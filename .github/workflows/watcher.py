#!/usr/bin/env python3
"""
GimmeASite Watcher — launchd agent
Runs every 15 minutes. Checks Gmail for new contact form submission emails,
builds site drafts via Claude API, uploads to GitHub Gist, sends macOS notification.
Also polls Google Calendar for upcoming Discovery Calls and opens the client's
draft preview link in the browser 15 minutes before the appointment.
"""

import imaplib, email, json, os, ssl, urllib.request, subprocess, re, traceback, zipfile, io, base64
import requests as req_lib
from datetime import datetime, timezone, timedelta
from email.header import decode_header

# ── CONFIG ──────────────────────────────────────────────────────────────────
GMAIL_USER     = os.environ["GMAIL_USER"]
GMAIL_APP_PASS = os.environ["GMAIL_APP_PASS"]
CLAUDE_API_KEY = os.environ["CLAUDE_API_KEY"]
GITHUB_TOKEN   = os.environ["GITHUB_TOKEN_SECRET"]
GITHUB_USER    = "matrixfrr"
INBOX_GIST_ID  = os.environ["INBOX_GIST_ID"]
PROCESSED_FILE = "/Users/admin/.gimmeasite/processed.json"
PENDING_FILE   = "/Users/admin/.gimmeasite/pending_posts.json"
DRAFTS_DIR     = "/Users/admin/Downloads/site-drafts"
LOG_FILE       = "/Users/admin/.gimmeasite/watcher.log"
OAUTH_FILE     = "/Users/admin/.gimmeasite/oauth_client.json"
TOKEN_FILE     = "/Users/admin/.gimmeasite/calendar_token.json"
OPENED_FILE    = "/Users/admin/.gimmeasite/opened_calls.json"
DRAFT_EMAILS_FILE    = "/Users/admin/.gimmeasite/pending_draft_emails.json"
PENDING_APPROVALS    = "/Users/admin/.gimmeasite/pending_approvals.json"
REVISION_EMAILS_FILE = "/Users/admin/.gimmeasite/processed_revision_emails.json"
PENDING_REVISIONS    = "/Users/admin/.gimmeasite/pending_revisions.json"
BOOKING_LINK   = "https://calendar.app.google/wQdwGP7Trr5ThAKn6"
EST            = timezone(timedelta(hours=-4))  # EDT (UTC-4); change to -5 in Nov when clocks fall back
CALENDAR_ID    = "hello@gimmeasite.com"
CF_ACCOUNT_ID  = os.environ.get("CF_ACCOUNT_ID", "848d99ff350de8b5b16548fa02e03a48")
CF_API_TOKEN   = os.environ["CF_API_TOKEN"]
CF_KV_NS_ID    = os.environ.get("CF_KV_NS_ID", "b006a344325e4068b6ddd744b563c75a")
SUPABASE_URL   = os.environ.get("SUPABASE_URL", "https://spfifpabqgtozmqxrwmc.supabase.co")
SUPABASE_KEY   = os.environ["SUPABASE_KEY"]
PROCESSED_TICKETS_FILE = "/Users/admin/.gimmeasite/processed_tickets.json"
PENDING_SUPPORT_RENEWALS  = "/Users/admin/.gimmeasite/pending_support_renewals.json"
PENDING_TICKET_PAYMENTS   = "/Users/admin/.gimmeasite/pending_ticket_payments.json"

ctx = ssl._create_unverified_context()

# ── LOGGING ─────────────────────────────────────────────────────────────────
def log(msg):
    line = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

# ── PROCESSED IDs ────────────────────────────────────────────────────────────
def load_processed():
    try:
        with open(PROCESSED_FILE) as f:
            return json.load(f)
    except Exception:
        return {"processed_ids": [], "drafts": {}}

def save_processed(data):
    with open(PROCESSED_FILE, "w") as f:
        json.dump(data, f, indent=2)

# ── OPENED CALLS TRACKER ─────────────────────────────────────────────────────
def load_opened():
    try:
        with open(OPENED_FILE) as f:
            return set(json.load(f).get("opened", []))
    except Exception:
        return set()

def save_opened(opened):
    with open(OPENED_FILE, "w") as f:
        json.dump({"opened": list(opened)}, f, indent=2)

# ── GMAIL IMAP ───────────────────────────────────────────────────────────────
def fetch_supabase_submissions():
    """Fetches unprocessed contact form submissions from Supabase."""
    submissions = []
    try:
        rows = supabase_request("GET", "contact_submissions?processed=eq.false&order=created_at.asc")
        for row in rows:
            owns = row.get("owns_domain", False)
            pages = row.get("additional_pages") or []
            attachments = row.get("attachments") or []
            sub = {
                "msg_id":            row["id"],
                "_supabase_id":      row["id"],
                "name":              row.get("name", ""),
                "email":             row.get("email", ""),
                "company":           row.get("company", ""),
                "phone":             row.get("phone", ""),
                "paymentPlan":       row.get("payment_plan", ""),
                "ownsDomain":        "yes" if owns else "no",
                "domain":            row.get("desired_domain", "") if not owns else "",
                "existingDomain":    row.get("existing_domain", "") if owns else "",
                "message":           row.get("message", ""),
                "instagram":         row.get("instagram", ""),
                "facebook":          row.get("facebook", ""),
                "twitter":           row.get("twitter", ""),
                "youtube":           row.get("youtube", ""),
                "tiktok":            row.get("tiktok", ""),
                "linkedin":          row.get("linkedin", ""),
                "googleBusiness":    row.get("google_business", ""),
                "attachments":       attachments,
                "homeKeyMessage":    row.get("home_value_prop", ""),
                "homeAction":        row.get("home_action", ""),
                "aboutStory":        row.get("about_story", ""),
                "aboutUnique":       row.get("about_differentiator", ""),
                "servicesProducts":  row.get("services_products", ""),
                "specialOffers":     row.get("special_offers", ""),
                "contactMethods":    row.get("contact_methods", ""),
                "businessHours":     row.get("business_hours", ""),
                "additionalPages":   ", ".join(pages) if isinstance(pages, list) else str(pages),
                "additionalDetails": row.get("additional_details", ""),
            }
            if sub["email"]:
                submissions.append(sub)
        log(f"Fetched {len(submissions)} unprocessed submission(s) from Supabase")
    except Exception as e:
        error_notify("Supabase submission fetch failed", e, traceback.format_exc())
    return submissions

# ── CLAUDE API ───────────────────────────────────────────────────────────────
def _stream_claude(messages):
    """Core SSE streaming call. Returns assembled text from Claude."""
    headers = {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload = {
        "model": "claude-sonnet-4-6",
        "max_tokens": 32000,
        "stream": True,
        "messages": messages,
    }
    chunks = []
    with req_lib.post(
        "https://api.anthropic.com/v1/messages",
        headers=headers,
        json=payload,
        stream=True,
        timeout=600,
        verify=False,
    ) as resp:
        resp.raise_for_status()
        for raw_line in resp.iter_lines():
            if not raw_line:
                continue
            line = raw_line if isinstance(raw_line, str) else raw_line.decode("utf-8")
            if not line.startswith("data: "):
                continue
            data = line[6:]
            if data == "[DONE]":
                break
            try:
                event = json.loads(data)
                if event.get("type") == "content_block_delta":
                    chunks.append(event["delta"].get("text", ""))
            except Exception:
                pass
    return "".join(chunks)


def call_claude(prompt):
    return _stream_claude([{"role": "user", "content": prompt}])


def call_claude_with_images(prompt, image_attachments):
    """Call Claude with text prompt plus base64-encoded images as vision content."""
    content = []
    for att in image_attachments:
        if not att["content_type"].startswith("image/"):
            continue
        b64 = base64.b64encode(att["data"]).decode("ascii")
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": att["content_type"],
                "data": b64,
            },
        })
    content.append({"type": "text", "text": prompt})
    return _stream_claude([{"role": "user", "content": content}])


def check_domain_price(domain):
    if not domain:
        return None
    domain = domain.strip().lower()
    for prefix in ("https://", "http://", "www."):
        if domain.startswith(prefix):
            domain = domain[len(prefix):]
    domain = domain.split("/")[0]
    try:
        url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/registrar/domains/search?query={domain}&limit=5"
        req = urllib.request.Request(url)
        req.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
        req.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(req, context=ctx, timeout=10) as r:
            data = json.loads(r.read())
        results = data.get("result", {}).get("domains", [])
        for d in results:
            if d.get("name", "").lower() == domain:
                available = d.get("available", False)
                price_usd = d.get("price")
                return {"domain": domain, "available": available, "price_usd": price_usd}
        return {"domain": domain, "available": None, "price_usd": None}
    except Exception as e:
        log(f"Domain check failed for {domain}: {e}")
        return None

def build_html(sub):
    fields = {k: sub.get(k, "") for k in
        ["company","name","email","phone","domain","message","instagram",
         "tiktok","facebook","youtube","linkedin","googleBusiness","paymentPlan",
         "ownsDomain","existingDomain",
         "homeKeyMessage","homeAction","aboutStory","aboutUnique",
         "servicesProducts","specialOffers","contactMethods","businessHours",
         "additionalPages","additionalDetails"]}
    prompt = f"""Before generating anything, randomly select ONE design style from this list — do not default to your most common, and do not repeat the same style for consecutive clients:

- Brutalist (raw, bold typography, high contrast, unconventional layout)
- Glassmorphism (frosted glass cards, blurred backgrounds, soft gradients)
- Swiss/International (strict grid, clean sans-serif, minimal color, mathematical spacing)
- Editorial (magazine-style, large pull quotes, mixed column widths, strong imagery)
- Japandi Minimalist (warm neutrals, lots of whitespace, subtle textures, understated elegance)
- Bold Maximalist (loud colors, overlapping elements, expressive type, high energy)
- Dark Luxury (deep blacks, gold/silver accents, premium feel, cinematic)
- Corporate Clean (structured, trustworthy, muted palette, professional)
- Memphis/Retro (geometric shapes, bright colors, playful patterns, 80s/90s inspired)
- Coastal/Organic (soft blues, greens, natural textures, relaxed feel)

Override the style only if it is clearly inappropriate for the client's industry — use the next most fitting style instead.

For additional design inspiration, draw from the following sources for palette choices, spacing rhythms, component aesthetics, and interaction patterns that feel production-quality rather than AI-generated:

- https://styles.refero.design/ -- 2,000+ real-world design systems with color palettes, typography specs, and atmospheric descriptions
- https://ui.shadcn.com/create?preset=b27GcrRo -- polished component patterns and interaction design
- https://tailwindcss.com/plus -- utility-first layout and spacing patterns
- https://www.untitledui.com/ -- Figma, React, and icon design systems
- https://heroui.com/ -- accessible, modern component library
- https://magicui.design/ -- animated, high-impact UI components
- https://react-aria.adobe.com/ -- Adobe's accessible interaction primitives
- https://www.kibo-ui.com/ -- refined, minimal UI components
- https://ui.aceternity.com/ -- bold, cinematic UI effects
- https://ui.mantine.dev/ -- full-featured component library with strong defaults
- https://ant.design/ -- enterprise-grade design language and components
- https://www.alignui.com/ -- clean, modern design system
- https://www.originui-ng.com/ -- open-source UI components
- https://www.radix-ui.com/ -- unstyled, accessible component primitives
- https://21st.dev/ -- curated, high-quality UI components
- https://www.tremor.so/ -- dashboard and data UI components
- https://preline.co/ -- Tailwind UI component library
- https://flowbite.com/ -- open-source Tailwind component library

Once the style is chosen, derive ALL of the following from it so every element feels intentional and cohesive:

FONT PAIRING — choose a Google Fonts pairing that authentically fits the style. Never use: Inter, Roboto, Open Sans, Lato, Montserrat, Poppins, Raleway, Arial, or any default system font. Use weight extremes (100/200 vs 800/900) and size jumps of 3x+. Avoid overused AI choices like Space Grotesk.

COLOR PALETTE — choose a dominant color, sharp accent, and background tone that serve the style. Options: light (cream/off-white), dark (near-black/deep navy/charcoal), or tinted (saturated mid-tone — forest, rust, indigo, etc.). Never default to plain white. Define all tokens as CSS variables.

HERO LAYOUT — choose whichever of left-aligned, center-aligned, right-aligned, or full-bleed best fits the style.

NAV STYLE — choose whichever of sticky top bar, minimal floating pill, left sidebar, or transparent overlay best fits the style.

SECTION ORDER — arrange sections (hero, about, services, testimonials, contact, etc.) in the sequence that best serves the style and the client's industry.

BACKGROUND TREATMENT — choose whichever of layered CSS gradient, geometric pattern, grain/noise texture, generative art, or split-color panels best fits the style. Never use a plain solid color background.

ANIMATION STYLE — choose whichever of staggered fade-in on load, slide-up reveals on scroll, typewriter headline, parallax layers, or subtle pulse/glow on CTAs best fits the style. CSS-only — no external JS animation libraries.

State the chosen style and all derived decisions in an HTML comment at the top of the file.

---

You are an expert frontend engineer. Build a complete, self-contained HTML file using vanilla HTML, CSS, and JavaScript — all inline. Use Tailwind CSS for utility classes where helpful, but define all design tokens as CSS variables. No external dependencies beyond Google Fonts and Tailwind CDN.

THIS IS A SINGLE-PAGE DRAFT. The entire site must be one HTML file, one page, no routing, no multi-page navigation. All sections scroll vertically on the same page. Nav links must anchor-scroll to sections on the same page — they must NOT link to separate pages or external URLs. There are no other HTML files. Enforce this absolutely.

Avoid the "AI slop" aesthetic at all costs:
- No purple gradients on white backgrounds
- No predictable card-grid layouts
- No clichéd hero + feature section + CTA patterns unless genuinely appropriate
- No generic, context-free design — every choice should feel tailored to this specific client

Build a sexy, professional, modern, high-converting, easily-navigated, desktop/tablet/mobile-friendly one-page draft. Structure the navigation to include Home, About or Why Us?, Contact, and — if applicable — Our Services or Book Appointment (with pricing). Adapt to the client's type: a music artist does not want an "Our Services" section; a law firm does not want a booking widget. Be circumstantially intelligent.

Use the client info below to shape layout, structure, and UX. Pull their branding, colors, logo, photos, and social media presence from their public profiles and Google. Display their logo in the header. Include galleries, banners, or backgrounds pulled from or inspired by their real media. If media is unavailable, compensate with original generative designs — never use placeholders.

Pull real reviews from Yelp, Google, or relevant platforms for testimonials where credibility matters. Pull accurate business details (address, hours, phone, email) from public sources. Do not invent or generalize information that belongs to other businesses.

Include a footer with social media links, and Privacy Policy, Terms of Service, and Cookie Policy pages linked (not built). Ensure strong CTAs and lead capture forms where appropriate. Make adjustments to avoid plagiarism and AI speculation.

If "Owns existing domain" is yes, use the existing domain throughout the site — footer, contact info, header. Otherwise use the desired domain field.

CLIENT INFO:
- Business name: {fields['company']}
- Contact name: {fields['name']}
- Email: {fields['email']}
- Phone: {fields['phone']}
- Desired domain: {fields['domain']}
- Owns existing domain: {fields['ownsDomain']}
- Existing domain (if owned): {fields['existingDomain']}
- Instagram: {fields['instagram']}
- TikTok: {fields['tiktok']}
- Facebook: {fields['facebook']}
- YouTube: {fields['youtube']}
- LinkedIn: {fields['linkedin']}
- Google Business: {fields['googleBusiness']}
- Payment plan interest: {fields['paymentPlan']}
- Their message: {fields['message']}

COPY PROVIDED BY CLIENT (use this exact content for the sections below — do not invent or replace):
- Home page key message / tagline: {fields['homeKeyMessage']}
- Home page primary call-to-action: {fields['homeAction']}
- About page — their story: {fields['aboutStory']}
- About page — what makes them unique: {fields['aboutUnique']}
- Services / products description: {fields['servicesProducts']}
- Special offers or promotions: {fields['specialOffers']}
- Preferred contact methods: {fields['contactMethods']}
- Business hours: {fields['businessHours']}
- Additional pages requested: {fields['additionalPages']}
- Additional notes / details: {fields['additionalDetails']}

If any copy field above is blank, fall back to researching the client's public presence (social media, Google, Yelp). Never leave a section empty or use obvious placeholder text.

If brand files were uploaded (logo, photos, fonts, brand colors), they are attached as images. Use them directly — display the logo in the header, incorporate brand colors and imagery throughout.

Return ONLY the raw HTML — no markdown, no explanation, no code fences."""
    image_attachments = [a for a in sub.get("attachments", []) if a["content_type"].startswith("image/")]
    if image_attachments:
        return call_claude_with_images(prompt, image_attachments)
    return call_claude(prompt)

# ── CLOUDFLARE PAGES DEPLOY ──────────────────────────────────────────────────
def cf_pages_deploy(html, business_name, existing_project=None):
    slug = re.sub(r'[^a-z0-9-]', '-', business_name.lower()).strip('-')
    slug = re.sub(r'-+', '-', slug)[:50] + "-draft"
    project_name = existing_project or slug

    cf_base = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}"
    cf_headers = {"Authorization": f"Bearer {CF_API_TOKEN}"}

    # Create project if it doesn't exist yet
    if not existing_project:
        create_data = json.dumps({
            "name": project_name,
            "production_branch": "main"
        }).encode()
        req = urllib.request.Request(
            f"{cf_base}/pages/projects",
            data=create_data, method="POST"
        )
        req.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
        req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
                result = json.loads(r.read())
                project_name = result.get("result", {}).get("name", project_name)
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            if "already exists" not in body and e.code != 409:
                raise

    # Build multipart body with index.html
    boundary = "----CFPagesBoundary" + re.sub(r'[^a-z0-9]', '', business_name.lower())[:16]
    html_bytes = html.encode("utf-8")
    parts = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="files"; filename="/index.html"\r\n'
        f"Content-Type: text/html\r\n\r\n"
    ).encode() + html_bytes + f"\r\n--{boundary}--\r\n".encode()

    req2 = urllib.request.Request(
        f"{cf_base}/pages/projects/{project_name}/deployments",
        data=parts, method="POST"
    )
    req2.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
    req2.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    with urllib.request.urlopen(req2, context=ctx, timeout=60) as r:
        deploy_result = json.loads(r.read())

    site_url = f"https://{project_name}.pages.dev"
    return project_name, site_url

# ── MACOS NOTIFICATION ───────────────────────────────────────────────────────
def notify(title, body, urgent=False):
    sound = "Sosumi" if urgent else "Ping"
    subprocess.run([
        "osascript", "-e",
        f'display notification "{body}" with title "{title}" sound name "{sound}"'
    ])

def alert(title, body):
    """Blocking alert dialog for critical failures."""
    subprocess.run([
        "osascript", "-e",
        f'tell app "System Events" to display alert "{title}" message "{body}" as critical'
    ])

def error_notify(context, error, tb=""):
    """Log error and fire urgent notification with diagnostic info."""
    diag = f"{context}: {error}"
    if tb:
        diag += f"\n{tb[:300]}"
    log(f"ERROR — {diag}")
    # Write to dedicated error log
    with open("/Users/admin/.gimmeasite/error.log", "a") as f:
        f.write(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  {diag}\n\n")
    notify(f"⚠️ GimmeASite ERROR", context[:60], urgent=True)

# ── PENDING POSTS ─────────────────────────────────────────────────────────────
def save_pending(company, preview_url, sub, domain_note=""):
    try:
        with open(PENDING_FILE) as f:
            pending = json.load(f)
    except Exception:
        pending = {"posts": []}

    pending["posts"].append({
        "company": company,
        "preview_url": preview_url,
        "message": (
            f"✅ New site draft ready: {company}\n\n"
            f"Client: {sub.get('name','')} | {sub.get('email','')} | {sub.get('phone','')}\n"
            f"Plan: {sub.get('paymentPlan','')}\n"
            f"Domain: {domain_note}\n"
            f"Business: {sub.get('message','')[:120]}\n\n"
            f"🔗 Preview: {preview_url}"
        ),
        "created_at": datetime.now().isoformat()
    })
    with open(PENDING_FILE, "w") as f:
        json.dump(pending, f, indent=2)

# ── INBOX GIST (GitHub Actions notifications) ────────────────────────────────
def check_inbox_gist():
    try:
        req = urllib.request.Request(f"https://api.github.com/gists/{INBOX_GIST_ID}")
        req.add_header("Authorization", f"Bearer {GITHUB_TOKEN}")
        req.add_header("Accept", "application/vnd.github.v3+json")
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            gist = json.loads(r.read())
        content = json.loads(gist["files"]["inbox.json"]["content"])
        notifications = content.get("notifications", [])
        unread = [n for n in notifications if not n.get("read")]
        if not unread:
            return
        log(f"Inbox: {len(unread)} unread notification(s) from GitHub Actions")
        for n in unread:
            company = n.get("company", "Unknown")
            preview_url = n.get("preview_url", "")
            notify(f"GimmeASite — Draft Ready (cloud)", f"{company}: {preview_url}")
            log(f"Notified (cloud draft): {company} — {preview_url}")
            n["read"] = True
        content["notifications"] = notifications
        data = json.dumps({"files": {"inbox.json": {"content": json.dumps(content, indent=2)}}}).encode()
        req2 = urllib.request.Request(f"https://api.github.com/gists/{INBOX_GIST_ID}",
                                      data=data, method="PATCH")
        req2.add_header("Authorization", f"Bearer {GITHUB_TOKEN}")
        req2.add_header("Content-Type", "application/json")
        req2.add_header("Accept", "application/vnd.github.v3+json")
        with urllib.request.urlopen(req2, context=ctx, timeout=15) as r:
            r.read()
    except Exception as e:
        error_notify("GitHub inbox gist check failed", e, traceback.format_exc())

# ── CLOUDFLARE KV ────────────────────────────────────────────────────────────
def kv_put(key, value):
    try:
        encoded_key = urllib.parse.quote(key, safe="")
        req = urllib.request.Request(
            f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}",
            data=value.encode(),
            method="PUT"
        )
        req.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
        req.add_header("Content-Type", "text/plain")
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            r.read()
        log(f"KV: stored domain '{value}' for '{key}'")
    except Exception as e:
        error_notify(f"Cloudflare KV write failed for {key}", e, traceback.format_exc())

# ── SMTP EMAIL ───────────────────────────────────────────────────────────────
def send_email(to, subject, body):
    import smtplib
    from email.mime.text import MIMEText
    msg = MIMEText(body, "plain")
    msg["Subject"] = subject
    msg["From"]    = "hello@gimmeasite.com"
    msg["To"]      = to
    with smtplib.SMTP("smtp.gmail.com", 587) as s:
        s.starttls()
        s.login("mattrixfr@gmail.com", "fxzfwxntdsantkzj")
        s.sendmail("hello@gimmeasite.com", to, msg.as_string())

# ── INTERNAL SUMMARY EMAIL ───────────────────────────────────────────────────
def send_internal_summary(sub, preview_url, domain_note):
    company  = sub.get("company", "")
    name     = sub.get("name", "")
    email    = sub.get("email", "")
    phone    = sub.get("phone", "")
    plan     = sub.get("paymentPlan", "")
    message  = sub.get("message", "")
    instagram = sub.get("instagram", "")
    tiktok   = sub.get("tiktok", "")
    facebook = sub.get("facebook", "")
    subject  = f"[DRAFT READY] {company} — Review before Discovery Call"
    body = f"""A new site draft has been built and deployed for {company}. Review before the Discovery Call.

CLIENT INFO
-----------
Business:  {company}
Name:      {name}
Email:     {email}
Phone:     {phone}
Plan:      {plan}
Message:   {message}

DOMAIN
------
{domain_note}

SOCIAL
------
Instagram:  {instagram}
TikTok:     {tiktok}
Facebook:   {facebook}

DRAFT PREVIEW
-------------
{preview_url}

Run /close once the sale is closed.
"""
    send_email("hello@gimmeasite.com", subject, body)
    log(f"Internal summary email sent for {company}")

# ── DRAFT EMAIL QUEUE ────────────────────────────────────────────────────────
def queue_draft_email(sub, draft_completed_at):
    try:
        with open(DRAFT_EMAILS_FILE) as f:
            data = json.load(f)
    except Exception:
        data = {"pending": []}
    data["pending"].append({
        "email":      sub.get("email", ""),
        "first_name": sub.get("name", "").strip().split()[0],
        "company":    sub.get("company", ""),
        "completed_at": draft_completed_at,
        "sent": False
    })
    with open(DRAFT_EMAILS_FILE, "w") as f:
        json.dump(data, f, indent=2)

def client_has_meeting(client_email):
    import urllib.parse
    token = get_calendar_token()
    if not token:
        return False
    now = datetime.now(timezone.utc)
    params = urllib.parse.urlencode({
        "timeMin":      now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "timeMax":      (now + timedelta(days=60)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "singleEvents": "true",
        "q":            "Discovery Call"
    })
    req = urllib.request.Request(
        f"https://www.googleapis.com/calendar/v3/calendars/{urllib.parse.quote(CALENDAR_ID)}/events?{params}"
    )
    req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            events = json.loads(r.read()).get("items", [])
        for event in events:
            for attendee in event.get("attendees", []):
                if attendee.get("email", "").lower() == client_email.lower():
                    return True
    except Exception as e:
        log(f"Calendar meeting check error: {e}")
    return False

def send_time_ok():
    now_est = datetime.now(EST)
    return 9 <= now_est.hour < 18

def compute_send_time(completed_at_str):
    import random
    completed = datetime.fromisoformat(completed_at_str)
    if completed.tzinfo is None:
        completed = completed.replace(tzinfo=timezone.utc)
    earliest = completed + timedelta(hours=6, minutes=random.randint(0, 89))
    earliest_est = earliest.astimezone(EST)
    # Must land between 9 AM and 6 PM EST; otherwise push to next day at a random time in window
    if earliest_est.hour >= 18 or earliest_est.hour < 9:
        rand_hour   = random.randint(9, 17)
        rand_minute = random.randint(0, 59)
        next_day = earliest_est.replace(hour=rand_hour, minute=rand_minute, second=0, microsecond=0)
        if earliest_est.hour >= 18:
            next_day += timedelta(days=1)
        return next_day.astimezone(timezone.utc)
    return earliest

def check_pending_draft_emails():
    try:
        with open(DRAFT_EMAILS_FILE) as f:
            data = json.load(f)
    except Exception:
        return

    now_utc = datetime.now(timezone.utc)
    changed = False

    for entry in data["pending"]:
        if entry.get("sent"):
            continue
        send_after = compute_send_time(entry["completed_at"])
        if now_utc < send_after:
            continue
        if not send_time_ok():
            continue

        first_name  = entry["first_name"]
        client_email = entry["email"]
        has_meeting = client_has_meeting(client_email)

        subject = f"Your website draft is ready, {first_name}! 🎉"

        if has_meeting:
            body = f"""Hi {first_name},

Great news — your website draft is finished, and it's looking great!

We'll go over everything together in our upcoming Google Meet. Come ready to share any thoughts, feedback, or changes you'd like to see — we'll make sure everything is exactly how you want it before we move forward.

Looking forward to connecting with you soon.

Cheers,
The GimmeASite Team"""
        else:
            body = f"""Hi {first_name},

Great news — your website draft is finished, and it's looking great!

The next step is a quick Google Meet where we'll walk you through the design, answer any questions, and make sure everything aligns with your vision. It only takes about 20–30 minutes.

Grab a time that works for you here: {BOOKING_LINK}

Looking forward to connecting with you soon.

Cheers,
The GimmeASite Team"""

        try:
            send_email(client_email, subject, body)
            version = "A (booked)" if has_meeting else "B (not booked)"
            log(f"Draft email sent to {client_email} — Version {version}")
            entry["sent"] = True
            changed = True
        except Exception as e:
            log(f"Draft email send error ({client_email}): {e}")

    if changed:
        with open(DRAFT_EMAILS_FILE, "w") as f:
            json.dump(data, f, indent=2)

# ── AUTO-SEND APPROVED CLIENT EMAILS ─────────────────────────────────────────
def check_pending_approvals():
    try:
        with open(PENDING_APPROVALS) as f:
            approvals = json.load(f)
    except Exception:
        return

    now_est = datetime.now(timezone(timedelta(hours=-4)))
    changed = False

    for client_email, record in list(approvals.items()):
        if record.get("status") != "approved":
            continue

        earliest = datetime.fromisoformat(record["earliest_send"]).replace(
            tzinfo=timezone(timedelta(hours=-4)))

        in_window = 9 <= now_est.hour < 18
        past_earliest = now_est >= earliest

        if past_earliest and in_window:
            try:
                send_client_email(record)
                record["status"] = "sent"
                changed = True
                log(f"Auto-sent client email to {client_email}")
                notify("GimmeASite — Email Sent", f"Client email delivered to {record.get('name','')}")
            except Exception as e:
                log(f"Auto-send error for {client_email}: {e}")

    if changed:
        with open(PENDING_APPROVALS, "w") as f:
            json.dump(approvals, f, indent=2)

def capture_site_media(url, output_dir):
    """
    Uses Playwright to:
    1. Record a full scroll-through screen recording (webm)
    2. Take named screenshots of major sections
    Returns (video_path, [screenshot_paths])
    """
    from playwright.sync_api import sync_playwright
    import tempfile

    os.makedirs(output_dir, exist_ok=True)
    screenshot_paths = []
    video_path = None

    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            record_video_dir=output_dir,
            record_video_size={"width": 1280, "height": 800}
        )
        page = context.new_page()
        page.goto(url, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(1500)

        # Scroll through the full page slowly for the recording
        total_height = page.evaluate("document.body.scrollHeight")
        scroll_step = 200
        current = 0
        while current < total_height:
            page.evaluate(f"window.scrollTo(0, {current})")
            page.wait_for_timeout(80)
            current += scroll_step
        page.wait_for_timeout(500)
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(500)

        # Screenshot major sections by querying common semantic tags/ids
        sections = [
            ("hero",         "header, section:first-of-type, .hero, #hero, #home"),
            ("about",        "#about, .about, section:nth-of-type(2)"),
            ("services",     "#services, .services, #our-services"),
            ("testimonials", "#testimonials, .testimonials, #reviews"),
            ("contact",      "#contact, .contact, footer"),
        ]
        for name, selector in sections:
            try:
                el = page.query_selector(selector)
                if el:
                    path = os.path.join(output_dir, f"{name}.png")
                    el.screenshot(path=path)
                    screenshot_paths.append(path)
            except Exception:
                pass

        # Fallback: full-page screenshot if no sections matched
        if not screenshot_paths:
            path = os.path.join(output_dir, "fullpage.png")
            page.screenshot(path=path, full_page=True)
            screenshot_paths.append(path)

        context.close()

        # Find the recorded video file
        for fname in os.listdir(output_dir):
            if fname.endswith(".webm"):
                video_path = os.path.join(output_dir, fname)
                break

        browser.close()

    return video_path, screenshot_paths


def send_client_email(record):
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from email.mime.image import MIMEImage
    from email.mime.base import MIMEBase
    from email import encoders

    first_name   = record["name"].split()[0]
    to           = record["client_email"]
    payment_url  = record["payment_url"]
    site_url     = record.get("site_url", "") or record.get("preview_url", "")

    # Capture screen recording + section screenshots via Playwright
    video_path, screenshot_paths = None, []
    if site_url:
        try:
            media_dir = os.path.join(DRAFTS_DIR, f"media_{record['name'].replace(' ', '_')}")
            video_path, screenshot_paths = capture_site_media(site_url, media_dir)
            log(f"Captured {len(screenshot_paths)} screenshots and video for {first_name}")
        except Exception as e:
            log(f"Media capture failed for {first_name}: {e}")

    subject = f"Your website is live, {first_name}! 🎉"
    body = f"""Hi {first_name},

Your website is officially live, and it looks incredible. We're so excited for you to see it! Check out the screen recording and screenshots attached below.

To complete your order and get your site connected to your desired domain, your next step is to pay at {payment_url}.

If you have any questions or feedback, don't hesitate to reach out — we're here every step of the way.

Cheers,
The GimmeASite Team"""

    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"]    = "hello@gimmeasite.com"
    msg["To"]      = to
    msg.attach(MIMEText(body, "plain"))

    # Attach screen recording
    if video_path and os.path.exists(video_path):
        with open(video_path, "rb") as f:
            vid = MIMEBase("video", "webm")
            vid.set_payload(f.read())
            encoders.encode_base64(vid)
            vid.add_header("Content-Disposition", "attachment", filename="website_preview.webm")
            msg.attach(vid)

    # Attach section screenshots
    for path in screenshot_paths:
        if os.path.exists(path):
            with open(path, "rb") as f:
                img = MIMEImage(f.read())
                img.add_header("Content-Disposition", "attachment",
                               filename=os.path.basename(path))
                msg.attach(img)

    with smtplib.SMTP("smtp.gmail.com", 587) as s:
        s.starttls()
        s.login("mattrixfr@gmail.com", "fxzfwxntdsantkzj")
        s.sendmail("hello@gimmeasite.com", to, msg.as_string())

# ── NAMESERVER EMAIL QUEUE ────────────────────────────────────────────────────
def check_pending_ns_emails():
    try:
        # List KV keys with pending_ns_email: prefix
        encoded_prefix = urllib.parse.quote("pending_ns_email:", safe="")
        req = urllib.request.Request(
            f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/keys?prefix={encoded_prefix}"
        )
        req.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            keys = json.loads(r.read()).get("result", [])

        for key_obj in keys:
            key = key_obj["name"]
            # Fetch the pending email data
            encoded_key = urllib.parse.quote(key, safe="")
            req2 = urllib.request.Request(
                f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}"
            )
            req2.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
            with urllib.request.urlopen(req2, context=ctx, timeout=15) as r:
                data = json.loads(r.read())

            to         = data["to"]
            first_name = data["first_name"]
            domain     = data["domain"]
            nameservers = data.get("nameservers", [])
            ns1 = nameservers[0] if len(nameservers) > 0 else "ns1.cloudflare.com"
            ns2 = nameservers[1] if len(nameservers) > 1 else "ns2.cloudflare.com"

            subject = f"One last step to go live, {first_name}!"
            body = f"""Hi {first_name},

Your new website is fully built, configured, and ready to go live — there's just one quick step on your end.

Since you're keeping your existing domain ({domain}), you'll need to update your nameservers at your domain registrar (the company where you purchased your domain — e.g. GoDaddy, Namecheap, Squarespace, etc.).

Here's what to do:

1. Log in to your domain registrar
2. Find the DNS or Nameserver settings for {domain}
3. Replace your current nameservers with these two:

   Nameserver 1: {ns1}
   Nameserver 2: {ns2}

4. Save the changes

That's it! DNS changes can take up to 24–48 hours to fully propagate, but your site is usually live within a few hours. Once it's live, your website will be accessible at {domain}.

If you run into any trouble finding the nameserver settings, just reply to this email and we'll walk you through it.

Need a revision to your site? Submit a ticket at https://gimmeasite.com/tickets and our team will take care of it.

You can manage your subscription, update your payment method, and view invoices at https://gimmeasite.com/billing.

P.S. If you're loving the experience, we'd be so grateful if you recommended us to friends or family who could use a website — or dropped us a quick review at https://g.page/r/CTaID4fouMzCEBM/review. You can also follow us on Instagram for updates at https://instagram.com/gimmeasite. Thank you for the opportunity for us to design with passion!

Cheers,
The GimmeASite Team"""

            send_email(to, subject, body)
            log(f"Nameserver email sent to {to} for {domain}")

            # Delete the pending entry from KV
            req3 = urllib.request.Request(
                f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}",
                method="DELETE"
            )
            req3.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
            with urllib.request.urlopen(req3, context=ctx, timeout=15) as r:
                r.read()

        # Check for pending post-payment emails (new-domain clients)
        encoded_prefix2 = urllib.parse.quote("pending_payment_email:", safe="")
        req4 = urllib.request.Request(
            f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/keys?prefix={encoded_prefix2}"
        )
        req4.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
        with urllib.request.urlopen(req4, context=ctx, timeout=15) as r:
            payment_keys = json.loads(r.read()).get("result", [])

        for key_obj in payment_keys:
            key = key_obj["name"]
            encoded_key = urllib.parse.quote(key, safe="")
            req5 = urllib.request.Request(
                f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}"
            )
            req5.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
            with urllib.request.urlopen(req5, context=ctx, timeout=15) as r:
                pdata = json.loads(r.read())

            to         = pdata["to"]
            first_name = pdata["first_name"]
            domain     = pdata["domain"]

            subject = f"You're all set, {first_name}!"
            body = f"""Hi {first_name},

Your payment is confirmed and your website is fully configured. It will be live at {domain} within a few hours as DNS propagates globally. You may be able to access it sooner, so feel free to check. Welcome to the GimmeASite family!

Need a revision to your site? Submit a ticket at https://gimmeasite.com/tickets and our team will take care of it.

You can manage your subscription, update your payment method, and view invoices at https://gimmeasite.com/billing.

P.S. If you're loving the experience, we'd be so grateful if you recommended us to friends or family who could use a website — or dropped us a quick review at https://g.page/r/CTaID4fouMzCEBM/review. You can also follow us on Instagram for updates at https://instagram.com/gimmeasite. Thank you for the opportunity for us to design with passion!

Cheers,
The GimmeASite Team"""

            send_email(to, subject, body)
            log(f"Post-payment email sent to {to}")

            req6 = urllib.request.Request(
                f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}",
                method="DELETE"
            )
            req6.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
            with urllib.request.urlopen(req6, context=ctx, timeout=15) as r:
                r.read()

    except Exception as e:
        error_notify("Nameserver email send failed", e, traceback.format_exc())

# ── 30-DAY CHECK-IN EMAIL ─────────────────────────────────────────────────────
def check_pending_checkin_emails():
    try:
        encoded_prefix = urllib.parse.quote("pending_checkin_email:", safe="")
        req = urllib.request.Request(
            f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/keys?prefix={encoded_prefix}"
        )
        req.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            keys = json.loads(r.read()).get("result", [])

        for key_obj in keys:
            key      = key_obj["name"]
            encoded_key = urllib.parse.quote(key, safe="")
            req2 = urllib.request.Request(
                f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}"
            )
            req2.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
            with urllib.request.urlopen(req2, context=ctx, timeout=15) as r:
                data = json.loads(r.read())

            to           = data["to"]
            first_name   = data["first_name"]
            send_after   = datetime.fromisoformat(data["send_after"]).replace(tzinfo=timezone.utc)
            paid_at      = datetime.fromisoformat(data["paid_at"]).replace(tzinfo=timezone.utc)

            if datetime.now(timezone.utc) < send_after:
                continue

            # Check Gmail for any emails from this client since 2 days after payment
            window_start = paid_at + timedelta(days=2)
            client_reached_out = False
            try:
                mail = imaplib.IMAP4_SSL("imap.gmail.com")
                mail.login(GMAIL_USER, GMAIL_APP_PASS)
                mail.select("inbox")
                since_str = window_start.strftime("%d-%b-%Y")
                _, result = mail.search(None, f'FROM "{to}" SINCE {since_str}')
                if result[0].split():
                    client_reached_out = True
                mail.logout()
            except Exception as e:
                log(f"Gmail check-in search failed for {to}: {e}")

            # Delete KV entry regardless
            req3 = urllib.request.Request(
                f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}",
                method="DELETE"
            )
            req3.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
            with urllib.request.urlopen(req3, context=ctx, timeout=15) as r:
                r.read()

            if client_reached_out:
                log(f"Check-in skipped for {to} — client has been in touch")
                continue

            subject = f"Checking in, {first_name} 👋"
            body = f"""Hi {first_name},

It's been about a month since your site went live — we just wanted to check in and see how everything is going!

If you have any questions, need any updates, or just want to chat about your site, don't hesitate to reply to this email. We're always here.

Also — we have some exciting marketing packages in the works that will help drive traffic and leads to your new site. Stay tuned, we'll be reaching out when they're ready!

Cheers,
The GimmeASite Team"""

            send_email(to, subject, body)
            log(f"30-day check-in email sent to {to}")

    except Exception as e:
        error_notify("Check-in email failed", e, traceback.format_exc())

# ── GOOGLE CALENDAR AUTH ──────────────────────────────────────────────────────
def get_calendar_token():
    try:
        with open(TOKEN_FILE) as f:
            token_data = json.load(f)

        with open(OAUTH_FILE) as f:
            client = json.load(f)["installed"]

        # Refresh the access token
        payload = urllib.parse.urlencode({
            "client_id":     client["client_id"],
            "client_secret": client["client_secret"],
            "refresh_token": token_data["refresh_token"],
            "grant_type":    "refresh_token"
        }).encode()

        req = urllib.request.Request(
            "https://oauth2.googleapis.com/token",
            data=payload,
            method="POST"
        )
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            resp = json.loads(r.read())
        return resp.get("access_token")
    except Exception as e:
        error_notify("Google Calendar auth failed", e, traceback.format_exc())
        return None

# ── CALENDAR POLL ─────────────────────────────────────────────────────────────
def check_upcoming_calls(drafts_by_email):
    import urllib.parse

    token = get_calendar_token()
    if not token:
        return

    now = datetime.now(timezone.utc)
    window_start = now + timedelta(minutes=14)
    window_end   = now + timedelta(minutes=16)

    params = urllib.parse.urlencode({
        "calendarId":   CALENDAR_ID,
        "timeMin":      window_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "timeMax":      window_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "singleEvents": "true",
        "orderBy":      "startTime",
        "q":            "Discovery Call"
    })

    req = urllib.request.Request(
        f"https://www.googleapis.com/calendar/v3/calendars/{urllib.parse.quote(CALENDAR_ID)}/events?{params}"
    )
    req.add_header("Authorization", f"Bearer {token}")

    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            events = json.loads(r.read()).get("items", [])
    except Exception as e:
        error_notify("Google Calendar poll failed", e, traceback.format_exc())
        return

    opened = load_opened()

    for event in events:
        event_id = event.get("id")
        if event_id in opened:
            continue

        # Find attendee email that matches a known draft
        attendees = [a for a in event.get("attendees", []) if not a.get("self")]
        if not attendees:
            continue
        preview_url = None
        client_email = None

        for attendee in attendees:
            email_addr = attendee.get("email", "").lower()
            if email_addr in drafts_by_email:
                preview_url = drafts_by_email[email_addr]
                client_email = email_addr
                break

        if preview_url:
            log(f"Opening draft for {client_email} 15min before call: {preview_url}")
            subprocess.run(["open", preview_url])
            notify("GimmeASite — Call in 15 min", f"Draft open: {client_email}")
            opened.add(event_id)
        else:
            log(f"Upcoming Discovery Call found but no matching draft for attendees: {[a.get('email') for a in attendees]}")
            opened.add(event_id)  # mark so we don't log again next cycle

    save_opened(opened)

# ── MAIN ─────────────────────────────────────────────────────────────────────
# ── CLIENT REVISION REQUESTS ─────────────────────────────────────────────────
def check_revision_emails():
    """Scans hello@gimmeasite.com inbox for client revision requests.
    Identifies known clients by email, applies changes via Claude, sends internal review email.
    Does NOT deploy — Matthew replies 'deploy' to trigger deployment."""
    try:
        processed_data = load_processed()
        drafts_by_email = {k.lower(): v for k, v in processed_data.get("drafts", {}).items()}

        try:
            with open(REVISION_EMAILS_FILE) as f:
                processed_revisions = set(json.load(f))
        except Exception:
            processed_revisions = set()

        try:
            with open(PENDING_REVISIONS) as f:
                pending_revisions = json.load(f)
        except Exception:
            pending_revisions = {}

        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(GMAIL_USER, GMAIL_APP_PASS)
        mail.select("inbox")

        _, data = mail.search(None, 'TO "hello@gimmeasite.com"')
        ids = data[0].split()

        for eid in ids:
            _, msg_data = mail.fetch(eid, "(RFC822)")
            raw = msg_data[0][1]
            msg = email.message_from_bytes(raw)

            msg_id = msg.get("Message-ID", str(eid))
            if msg_id in processed_revisions:
                continue

            # Skip if this is an internal email from ourselves or an existing revision deploy reply
            sender = msg.get("From", "")
            if "mattrixfr@gmail.com" in sender or "hello@gimmeasite.com" in sender:
                continue

            # Extract sender email
            import re as _re
            sender_match = _re.search(r"[\w.\-+]+@[\w.\-]+", sender)
            if not sender_match:
                continue
            sender_email = sender_match.group(0).lower()

            # Only process emails from known paying clients
            if sender_email not in drafts_by_email:
                continue

            subject_raw = msg.get("Subject", "")
            subject_decoded = decode_header(subject_raw)[0][0]
            if isinstance(subject_decoded, bytes):
                subject_decoded = subject_decoded.decode()

            # Only process emails that include "revision" in the subject
            if "revision" not in subject_decoded.lower():
                continue

            # Skip if this looks like a "deploy" approval reply (handled by check_pending_revision_deploys)
            if "deploy" in subject_decoded.lower() or "deploy" in (msg.get("In-Reply-To", "") or ""):
                continue

            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                        break
            else:
                body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")

            if not body.strip():
                continue

            # Find site HTML for this client
            site_folder = None
            for folder_name in os.listdir(DRAFTS_DIR):
                folder_path = os.path.join(DRAFTS_DIR, folder_name)
                if not os.path.isdir(folder_path):
                    continue
                html_path = os.path.join(folder_path, "index.html")
                if not os.path.exists(html_path):
                    continue
                # Match by checking KV data or folder name heuristics
                # Store the best candidate (most recent mtime)
                if site_folder is None:
                    site_folder = (folder_path, html_path)

            # Better: find site by checking pending_approvals for this email
            try:
                with open(PENDING_APPROVALS) as f:
                    approvals = json.load(f)
                record = approvals.get(sender_email, {})
                site_url = record.get("preview_url") or record.get("site_url", "")
                # Find matching folder by preview_url pages.dev subdomain
                if site_url:
                    subdomain = site_url.replace("https://", "").split(".")[0]
                    for folder_name in os.listdir(DRAFTS_DIR):
                        if subdomain.lower().replace("-", " ") in folder_name.lower() or \
                           folder_name.lower().replace(" ", "-") in subdomain.lower():
                            candidate = os.path.join(DRAFTS_DIR, folder_name, "index.html")
                            if os.path.exists(candidate):
                                site_folder = (os.path.join(DRAFTS_DIR, folder_name), candidate)
                                break
            except Exception:
                pass

            if not site_folder:
                log(f"Revision email from {sender_email} — no site HTML found, skipping")
                processed_revisions.add(msg_id)
                continue

            folder_path, html_path = site_folder
            with open(html_path) as f:
                current_html = f.read()

            log(f"Processing revision request from {sender_email}: {subject_decoded[:60]}")

            # Use Claude API to apply the revision
            revision_prompt = f"""You are a web developer maintaining a client's live website. The client has emailed a revision request. Apply the requested changes to the HTML and return the complete updated HTML file.

CLIENT REVISION REQUEST:
Subject: {subject_decoded}
---
{body.strip()}
---

CURRENT HTML:
{current_html}

Return ONLY the complete updated HTML — no explanation, no markdown, no code fences. The response should start with <!DOCTYPE html> or <html>."""

            api_req = urllib.request.Request("https://api.anthropic.com/v1/messages")
            api_req.add_header("x-api-key", CLAUDE_API_KEY)
            api_req.add_header("anthropic-version", "2023-06-01")
            api_req.add_header("content-type", "application/json")
            api_payload = json.dumps({
                "model": "claude-sonnet-4-6",
                "max_tokens": 16000,
                "messages": [{"role": "user", "content": revision_prompt}]
            }).encode()

            with urllib.request.urlopen(api_req, data=api_payload, timeout=120) as r:
                api_resp = json.loads(r.read())
            updated_html = api_resp["content"][0]["text"].strip()

            # Save updated HTML
            revised_path = os.path.join(folder_path, "index_revised.html")
            with open(revised_path, "w") as f:
                f.write(updated_html)

            # Store pending revision for deploy approval
            pending_revisions[msg_id] = {
                "sender_email": sender_email,
                "subject": subject_decoded,
                "folder_path": folder_path,
                "html_path": html_path,
                "revised_path": revised_path,
                "received_at": datetime.now(timezone.utc).isoformat()
            }
            with open(PENDING_REVISIONS, "w") as f:
                json.dump(pending_revisions, f, indent=2)

            # Send internal review email
            client_name = sender_email.split("@")[0].title()
            try:
                with open(PENDING_APPROVALS) as f:
                    approvals = json.load(f)
                client_name = approvals.get(sender_email, {}).get("name", client_name)
            except Exception:
                pass

            internal_subject = f"[REVISION READY] {client_name} — Reply with 'deploy' to push live"
            internal_body = f"""A client submitted a revision request and the changes have been applied.

Client: {client_name} ({sender_email})
Their request: "{subject_decoded}"

---
{body.strip()[:500]}
---

Revised HTML saved to: {revised_path}

To deploy this revision, reply to this email with the word "deploy" in your reply.
To discard, do nothing."""

            send_email("hello@gimmeasite.com", internal_subject, internal_body)
            subprocess.Popen(["open", revised_path])
            log(f"Internal revision review email sent for {sender_email}")
            notify("GimmeASite — Revision Ready", f"Revision from {client_name} ready for review")

            processed_revisions.add(msg_id)

        mail.logout()

        with open(REVISION_EMAILS_FILE, "w") as f:
            json.dump(list(processed_revisions), f, indent=2)

    except Exception as e:
        error_notify("Revision email check failed", e, traceback.format_exc())


def cf_pages_unpublish(project_name):
    """Deploys a simple offline page to a Cloudflare Pages project."""
    offline_html = """<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Site Offline</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5;}
.box{text-align:center;padding:40px;background:#fff;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.08);}
h1{font-size:1.5rem;color:#222;}p{color:#666;}</style></head>
<body><div class="box"><h1>This site is currently offline.</h1>
<p>If you believe this is an error, please contact us at hello@gimmeasite.com.</p></div></body></html>"""
    cf_pages_deploy(offline_html, project_name, existing_project=project_name)


# ── GRACE PERIOD (PAYMENT FAILED) ────────────────────────────────────────────
def check_grace_periods():
    """Polls KV for pending_grace: entries. Sends initial, 3-day, and 1-day warning
    emails. Auto-unpublishes the site after 7 days."""
    try:
        import urllib.parse
        encoded_prefix = urllib.parse.quote("pending_grace:", safe="")
        req = urllib.request.Request(
            f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/keys?prefix={encoded_prefix}"
        )
        req.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            keys = json.loads(r.read()).get("result", [])

        for key_obj in keys:
            key = key_obj["name"]
            encoded_key = urllib.parse.quote(key, safe="")
            req2 = urllib.request.Request(
                f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}"
            )
            req2.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
            with urllib.request.urlopen(req2, context=ctx, timeout=15) as r:
                data = json.loads(r.read())

            to         = data["to"]
            first_name = data["first_name"]
            domain     = data["domain"]
            site_id    = data["site_id"]
            grace_end  = datetime.fromisoformat(data["grace_end"]).replace(tzinfo=timezone.utc)
            warn_3d    = datetime.fromisoformat(data["warn_3d_after"]).replace(tzinfo=timezone.utc)
            warn_1d    = datetime.fromisoformat(data["warn_1d_after"]).replace(tzinfo=timezone.utc)
            now        = datetime.now(timezone.utc)

            changed = False

            # Initial email
            if not data.get("initial_sent"):
                subject = f"Action required — payment issue on your account, {first_name}"
                body = f"""Hi {first_name},

We weren't able to process your most recent payment for your GimmeASite subscription.

Don't worry — your website is still live and we've started a 7-day grace period to give you time to resolve the issue. Please update your payment method as soon as possible to avoid any interruption to your service.

If your payment is not resolved within 7 days, your website at {domain} will be taken offline until the balance is settled.

To update your payment method, go to your Billing Portal at https://gimmeasite.com/billing.

If you believe this is an error or have any questions, please don't hesitate to reach out.

Cheers,
The GimmeASite Team"""
                send_email(to, subject, body)
                send_email("hello@gimmeasite.com",
                           f"[GRACE PERIOD] {first_name} — payment failed ({domain})",
                           f"Payment failed for {first_name} ({to}). Grace period ends {grace_end.strftime('%Y-%m-%d')}.")
                data["initial_sent"] = True
                changed = True
                log(f"Grace period initial email sent to {to}")

            # 3-day warning
            elif not data.get("warn_3d_sent") and now >= warn_3d:
                subject = f"3 days left — please update your payment, {first_name}"
                body = f"""Hi {first_name},

This is a reminder that your GimmeASite payment is still outstanding. Your website at {domain} will go offline in 3 days if the issue is not resolved.

To update your payment method, go to your Billing Portal at https://gimmeasite.com/billing.

Cheers,
The GimmeASite Team"""
                send_email(to, subject, body)
                data["warn_3d_sent"] = True
                changed = True
                log(f"Grace period 3-day warning sent to {to}")

            # 1-day warning
            elif not data.get("warn_1d_sent") and now >= warn_1d:
                subject = f"Final notice — your site goes offline tomorrow, {first_name}"
                body = f"""Hi {first_name},

Your website at {domain} will go offline tomorrow if your outstanding payment is not resolved.

To update your payment method, go to your Billing Portal at https://gimmeasite.com/billing. Please do so immediately to avoid interruption.

Cheers,
The GimmeASite Team"""
                send_email(to, subject, body)
                data["warn_1d_sent"] = True
                changed = True
                log(f"Grace period 1-day warning sent to {to}")

            # Grace period expired — unpublish site
            elif now >= grace_end:
                if site_id:
                    try:
                        cf_pages_unpublish(site_id)
                        log(f"Pages site unpublished for {to} ({domain})")
                    except Exception as e:
                        log(f"Unpublish failed for {to}: {e}")
                send_email(to,
                           f"Your website has been taken offline, {first_name}",
                           f"""Hi {first_name},

We're sorry to inform you that your website at {domain} has been taken offline due to an unresolved payment on your account.

Your site and all associated files are safely stored on our end. To restore your website, go to your Billing Portal at https://gimmeasite.com/billing to settle the balance, then reply to this email and we'll get you back online right away.

Cheers,
The GimmeASite Team""")
                send_email("hello@gimmeasite.com",
                           f"[SITE OFFLINE] {first_name} — grace period expired ({domain})",
                           f"Site taken offline for {first_name} ({to}). Domain: {domain}. Site ID: {site_id}.")
                notify("GimmeASite — Site Offline", f"{first_name}'s site taken offline ({domain})", urgent=True)

                # Delete KV entry
                req3 = urllib.request.Request(
                    f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}",
                    method="DELETE"
                )
                req3.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
                with urllib.request.urlopen(req3, context=ctx, timeout=15) as r:
                    r.read()
                log(f"Grace period KV entry deleted for {to}")
                continue

            if changed:
                req4 = urllib.request.Request(
                    f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}",
                    data=json.dumps(data).encode(), method="PUT"
                )
                req4.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
                req4.add_header("Content-Type", "text/plain")
                with urllib.request.urlopen(req4, context=ctx, timeout=15) as r:
                    r.read()

    except Exception as e:
        error_notify("Grace period check failed", e, traceback.format_exc())


# ── CANCELLATIONS ─────────────────────────────────────────────────────────────
def check_cancellations():
    """Polls KV for pending_cancellation: entries. Sends ownership transfer offer
    email immediately, then auto-unpublishes site at billing period end."""
    try:
        import urllib.parse
        encoded_prefix = urllib.parse.quote("pending_cancellation:", safe="")
        req = urllib.request.Request(
            f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/keys?prefix={encoded_prefix}"
        )
        req.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            keys = json.loads(r.read()).get("result", [])

        for key_obj in keys:
            key = key_obj["name"]
            encoded_key = urllib.parse.quote(key, safe="")
            req2 = urllib.request.Request(
                f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}"
            )
            req2.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
            with urllib.request.urlopen(req2, context=ctx, timeout=15) as r:
                data = json.loads(r.read())

            to         = data["to"]
            domain     = data["domain"]
            site_id    = data["site_id"]
            period_end = datetime.fromisoformat(data["period_end"]).replace(tzinfo=timezone.utc)
            now        = datetime.now(timezone.utc)
            changed    = False

            # Send transfer offer email once
            if not data.get("cancel_email_sent"):
                first_name = to.split("@")[0].title()

                # Look up plan and pricing from pending_approvals
                plan        = data.get("plan", "").lower()
                upfront_fee = 0.0
                monthly_fee = 0.0
                annual_fee  = 0.0
                try:
                    with open(PENDING_APPROVALS) as f:
                        approvals = json.load(f)
                    record      = approvals.get(to, {})
                    first_name  = record.get("name", first_name).split()[0]
                    plan        = record.get("plan", plan).lower()
                    upfront_fee = float(record.get("upfront_fee", 0) or 0)
                    monthly_fee = float(record.get("monthly_fee", 0) or 0)
                    annual_fee  = float(record.get("annual_fee", 0) or 0)
                except Exception:
                    pass

                # Calculate transfer fee based on plan
                if plan == "upfront":
                    files_fee = round(upfront_fee * 0.25, 2)
                    files_fee_str = f"${files_fee:,.2f}" if files_fee > 0 else "a fee based on your original plan"
                elif plan in ("monthly", "hybrid"):
                    files_fee = round(monthly_fee * 1.5, 2)
                    files_fee_str = f"${files_fee:,.2f}" if files_fee > 0 else "a fee based on your original plan"
                elif plan == "annual":
                    files_fee = round(annual_fee * 0.20, 2)
                    files_fee_str = f"${files_fee:,.2f}" if files_fee > 0 else "a fee based on your original plan"
                else:
                    files_fee_str = "a one-time fee"

                # Look up domain transfer price
                domain_fee_str = "quoted upon request"
                try:
                    price_info = check_domain_price(domain)
                    if price_info and price_info.get("price_usd"):
                        raw_price = float(price_info["price_usd"])
                        # 65% markup + $20 service fee, rounded to nearest $5
                        domain_fee = round((raw_price * 1.65 + 20) / 5) * 5
                        domain_fee_str = f"${domain_fee:,.2f}"
                except Exception:
                    pass

                subject = f"We're sorry to see you go, {first_name}"
                body = f"""Hi {first_name},

We've received your cancellation and your GimmeASite subscription will remain active until the end of your current billing period. Your website at {domain} will continue running until then.

Before we part ways, we wanted to let you know that you have the option to take full ownership of your website and/or domain. For a one-time site transfer fee of {files_fee_str}, we can hand over your complete site files directly to you. Domain transfer is available separately for {domain_fee_str}. Both can be bundled together.

Upon transfer, we'll provide you with step-by-step instructions on how to take ownership of your domain at your registrar of choice, as well as guidance on how to host and deploy your site files so your online presence doesn't skip a beat.

If you'd like to initiate a Transfer of Ownership, you can do so by submitting a ticket at the link below — our team will take it from there.

https://gimmeasite.com/tickets

We're sorry to see you go and hope we can work together again in the future.

Cheers,
The GimmeASite Team"""
                send_email(to, subject, body)
                send_email("hello@gimmeasite.com",
                           f"[CANCELLATION] {first_name} — site offline {period_end.strftime('%Y-%m-%d')} ({domain})",
                           f"Subscription cancelled for {first_name} ({to}).\nDomain: {domain}\nSite ID: {site_id}\nWill unpublish: {period_end.strftime('%Y-%m-%d %H:%M UTC')}")
                notify("GimmeASite — Cancellation", f"{first_name} cancelled ({domain})", urgent=True)
                data["cancel_email_sent"] = True
                changed = True
                log(f"Cancellation email sent to {to}")

            # Auto-unpublish at billing period end
            if now >= period_end:
                if site_id:
                    try:
                        cf_pages_unpublish(site_id)
                        log(f"Pages site unpublished after cancellation for {to} ({domain})")
                    except Exception as e:
                        log(f"Unpublish failed for {to}: {e}")

                req3 = urllib.request.Request(
                    f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}",
                    method="DELETE"
                )
                req3.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
                with urllib.request.urlopen(req3, context=ctx, timeout=15) as r:
                    r.read()
                log(f"Cancellation KV entry deleted for {to}")
                continue

            if changed:
                req4 = urllib.request.Request(
                    f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}",
                    data=json.dumps(data).encode(), method="PUT"
                )
                req4.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
                req4.add_header("Content-Type", "text/plain")
                with urllib.request.urlopen(req4, context=ctx, timeout=15) as r:
                    r.read()

    except Exception as e:
        error_notify("Cancellation check failed", e, traceback.format_exc())


def supabase_request(method, path, body=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
        return json.loads(r.read())


def supabase_patch(path, body):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="PATCH")
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
        return json.loads(r.read())


# ── TICKET RECEIVED EMAIL ────────────────────────────────────────────────────
def send_ticket_received_email(to, first_name, ticket_subject):
    subject = f"Your Ticket Has Been Received, {first_name}!"
    body = f"""Hi {first_name},

Thanks for reaching out — we've received your ticket and our team is on it.

Ticket: "{ticket_subject}"

We'll review your ticket and get back to you as soon as possible. If anything changes or you'd like to add more detail, just reply to this email.

Cheers,
The GimmeASite Team"""
    send_email(to, subject, body)
    log(f"Ticket received email sent to {to}")


# ── SUPABASE TICKET SCANNER ───────────────────────────────────────────────────
def check_tickets():
    """Polls Supabase for open Revision Request and Full Redesign Request tickets.
    For revisions: applies changes via Claude, saves revised HTML, sends internal review email.
    For redesigns: rebuilds the entire site from scratch via Claude, sends internal review email.
    Does NOT deploy — Matthew replies 'deploy' to the internal email to push live."""
    try:
        try:
            with open(PROCESSED_TICKETS_FILE) as f:
                processed_tickets = set(json.load(f))
        except Exception:
            processed_tickets = set()

        try:
            with open(PENDING_REVISIONS) as f:
                pending_revisions = json.load(f)
        except Exception:
            pending_revisions = {}

        # Fetch ALL open tickets (any type) for confirmation emails
        all_tickets = supabase_request("GET",
            "tickets?status=eq.open&order=created_at.asc&select=*")

        # Fetch only revision/redesign tickets for processing
        tickets = [t for t in all_tickets if t.get("ticket_type") in ("revision", "redesign")]

        changed = False

        # Send confirmation email for any new ticket, regardless of type
        try:
            with open(PENDING_SUPPORT_RENEWALS) as f:
                support_renewals = json.load(f)
        except Exception:
            support_renewals = {}

        support_renewals_changed = False

        for ticket in all_tickets:
            ticket_id   = ticket["id"]
            if ticket_id in processed_tickets:
                continue
            if ticket.get("ticket_type") not in ("revision", "redesign"):
                email      = ticket["email"].lower()
                first_name = ticket["name"].split()[0]
                subject    = ticket.get("subject", "")
                try:
                    send_ticket_received_email(email, first_name, subject)
                except Exception as e:
                    log(f"Ticket confirmation email failed for {email}: {e}")

                # Queue payment follow-up emails for paid ticket types
                tt = ticket.get("ticket_type", "")
                description = ticket.get("description", "")

                if tt in ("Revision Refill", "Domain Change", "Transfer of Ownership"):
                    try:
                        with open(PENDING_TICKET_PAYMENTS) as f:
                            ticket_payments = json.load(f)
                    except Exception:
                        ticket_payments = {}
                    delay = 1 if tt == "Revision Refill" else 3
                    send_after = (datetime.now(timezone.utc) + timedelta(days=delay)).isoformat()
                    ticket_payments[ticket_id] = {
                        "ticket_id":   ticket_id,
                        "ticket_type": tt,
                        "email":       email,
                        "first_name":  first_name,
                        "description": description,
                        "send_after":  send_after,
                        "sent":        False
                    }
                    with open(PENDING_TICKET_PAYMENTS, "w") as f:
                        json.dump(ticket_payments, f, indent=2)

                    # Set KV so Worker can detect invoice payment
                    if tt == "Domain Change":
                        kv_put(f"pending_domain_change_payment:{email}", json.dumps({
                            "email":       email,
                            "first_name":  first_name,
                            "ticket_id":   ticket_id,
                            "description": description
                        }))
                    elif tt == "Transfer of Ownership":
                        kv_put(f"pending_transfer_payment:{email}", json.dumps({
                            "email":       email,
                            "first_name":  first_name,
                            "ticket_id":   ticket_id,
                            "subject":     subject,
                            "description": description
                        }))
                    elif tt == "Revision Refill":
                        kv_put(f"pending_revision_refill_payment:{email}", json.dumps({
                            "email":      email,
                            "first_name": first_name,
                            "ticket_id":  ticket_id
                        }))
                    log(f"Ticket payment email queued for {email} ({tt})")

                # Queue renewal follow-up for support renewal tickets
                if ticket.get("ticket_type") == "upfront_support_renewal":
                    send_after = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
                    support_renewals[email] = {
                        "email":      email,
                        "first_name": first_name,
                        "ticket_id":  ticket_id,
                        "send_after": send_after,
                        "email_sent": False
                    }
                    kv_put(f"pending_support_renewal_payment:{email}", json.dumps({
                        "email":      email,
                        "first_name": first_name,
                        "ticket_id":  ticket_id
                    }))
                    support_renewals_changed = True
                    log(f"Support renewal queued for {email}")

                # Internal alert for plan change tickets — requires close command to queue payment email
                if tt in ("Upgrade to a Subscription Plan", "Upgrade Plan", "Downgrade Plan"):
                    send_email(
                        "hello@gimmeasite.com",
                        f"[PLAN CHANGE TICKET] {first_name} — {tt}",
                        f"Plan change ticket received from {first_name} ({email}).\n\nTicket type: {tt}\nSubject: {subject}\n\nRun the close command to queue the payment/change email:\n\nUpgrade: close \"Name\" email newprice newplan https://payment-link.com upgrade\nDowngrade: close \"Name\" email newprice newplan downgrade"
                    )
                    log(f"Internal alert sent for plan change ticket from {email} ({tt})")

                processed_tickets.add(ticket_id)
                changed = True

        if support_renewals_changed:
            with open(PENDING_SUPPORT_RENEWALS, "w") as f:
                json.dump(support_renewals, f, indent=2)

        for ticket in tickets:
            ticket_id  = ticket["id"]
            if ticket_id in processed_tickets:
                continue

            email       = ticket["email"].lower()
            name        = ticket["name"]
            first_name  = name.split()[0]
            plan_type   = ticket.get("plan_type", "")
            subject     = ticket.get("subject", "")
            description = ticket.get("description", "")
            ticket_type = ticket.get("ticket_type", "revision")

            log(f"Processing {ticket_type} ticket from {email}: {subject[:60]}")

            # Send immediate confirmation to client
            try:
                send_ticket_received_email(email, first_name, subject)
            except Exception as e:
                log(f"Ticket confirmation email failed for {email}: {e}")

            # Find site HTML for this client
            html_path, folder_path, revised_path = None, None, None
            try:
                with open(PENDING_APPROVALS) as f:
                    approvals = json.load(f)
                record   = approvals.get(email, {})
                site_url = record.get("preview_url") or record.get("site_url", "")
                if site_url:
                    subdomain = site_url.replace("https://", "").split(".")[0]
                    for folder_name in os.listdir(DRAFTS_DIR):
                        if subdomain.lower().replace("-", " ") in folder_name.lower() or \
                           folder_name.lower().replace(" ", "-") in subdomain.lower():
                            candidate = os.path.join(DRAFTS_DIR, folder_name, "index.html")
                            if os.path.exists(candidate):
                                html_path   = candidate
                                folder_path = os.path.join(DRAFTS_DIR, folder_name)
                                revised_path = os.path.join(folder_path, "index_revised.html")
                                break
            except Exception as e:
                log(f"Could not find site for {email}: {e}")

            if not html_path:
                log(f"No site HTML found for {email}, skipping ticket {ticket_id}")
                processed_tickets.add(ticket_id)
                continue

            with open(html_path) as f:
                current_html = f.read()

            # Mark ticket in_progress in Supabase
            supabase_patch(f"tickets?id=eq.{ticket_id}", {"status": "in_progress"})

            if ticket_type == "revision":
                prompt = f"""You are a web developer maintaining a client's live website. The client has submitted a revision request. Apply the requested changes to the HTML and return the complete updated HTML file.

REVISION REQUEST:
Subject: {subject}
---
{description.strip()}
---

CURRENT HTML:
{current_html}

Return ONLY the complete updated HTML — no explanation, no markdown, no code fences."""

                internal_label = "REVISION READY"
                internal_action = "revision"

            else:  # redesign
                # Non-annual clients must pay before redesign is processed
                if plan_type.lower() != "annual":
                    kv_put(f"pending_redesign_payment:{email}", json.dumps({
                        "ticket_id":   ticket_id,
                        "email":       email,
                        "name":        name,
                        "plan_type":   plan_type,
                        "subject":     subject,
                        "description": description,
                        "html_path":   html_path,
                        "folder_path": folder_path,
                        "revised_path": revised_path,
                    }))
                    supabase_patch(f"tickets?id=eq.{ticket_id}", {"status": "in_progress"})
                    try:
                        with open(PENDING_TICKET_PAYMENTS) as f:
                            ticket_payments = json.load(f)
                    except Exception:
                        ticket_payments = {}
                    send_after = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
                    ticket_payments[ticket_id] = {
                        "ticket_id":   ticket_id,
                        "ticket_type": "Redesign",
                        "email":       email,
                        "first_name":  first_name,
                        "send_after":  send_after,
                        "sent":        False
                    }
                    with open(PENDING_TICKET_PAYMENTS, "w") as f:
                        json.dump(ticket_payments, f, indent=2)
                    send_email("hello@gimmeasite.com",
                        f"[REDESIGN PAYMENT PENDING] {name} ({email})",
                        f"Redesign ticket received from {name} ({email}).\nPlan: {plan_type}\nSubject: {subject}\n\nPayment email queued for 1 day out.")
                    log(f"Redesign payment email queued for {email} (ticket {ticket_id})")
                    processed_tickets.add(ticket_id)
                    changed = True
                    continue

                # Annual clients — process immediately
                prompt = f"""You are a world-class web designer rebuilding a client's website from scratch. The client has requested a full redesign. Using the client information below (extracted from their existing site) and the redesign brief, build a completely new, production-ready website.

REDESIGN REQUEST:
Subject: {subject}
---
{description.strip()}
---

EXISTING SITE (for client info reference only — do not copy the design):
{current_html[:8000]}

Build a fresh, stunning website. Apply all GimmeASite design standards: choose a strong design style, pair fonts deliberately, use a refined color palette. Return ONLY the complete HTML — no explanation, no markdown, no code fences."""

                internal_label = "REDESIGN READY"
                internal_action = "redesign"

            # Call Claude API
            api_req = urllib.request.Request("https://api.anthropic.com/v1/messages")
            api_req.add_header("x-api-key", CLAUDE_API_KEY)
            api_req.add_header("anthropic-version", "2023-06-01")
            api_req.add_header("content-type", "application/json")
            api_payload = json.dumps({
                "model": "claude-sonnet-4-6",
                "max_tokens": 16000,
                "messages": [{"role": "user", "content": prompt}]
            }).encode()

            with urllib.request.urlopen(api_req, data=api_payload, context=ctx, timeout=180) as r:
                api_resp = json.loads(r.read())
            updated_html = api_resp["content"][0]["text"].strip()

            with open(revised_path, "w") as f:
                f.write(updated_html)

            # Store pending revision for deploy approval
            pending_revisions[ticket_id] = {
                "sender_email":   email,
                "subject":        subject,
                "folder_path":    folder_path,
                "html_path":      html_path,
                "revised_path":   revised_path,
                "ticket_id":      ticket_id,
                "ticket_type":    ticket_type,
                "received_at":    datetime.now(timezone.utc).isoformat()
            }
            with open(PENDING_REVISIONS, "w") as f:
                json.dump(pending_revisions, f, indent=2)

            # Send internal review email
            internal_subject = f"[{internal_label}] {name} — Reply with 'deploy' to push live"
            internal_body = f"""A client submitted a {ticket_type} request via the ticketing system and the work is complete.

Client: {name} ({email})
Plan: {plan_type}
Ticket subject: "{subject}"

---
{description.strip()[:500]}
---

Revised HTML saved to: {revised_path}

Reply to this email with "deploy" to push live, or "redo: [feedback]" to request further changes."""

            send_email("hello@gimmeasite.com", internal_subject, internal_body)
            subprocess.Popen(["open", revised_path])
            notify(f"GimmeASite — {internal_label}", f"{name}: {subject[:50]}")
            log(f"{internal_label} email sent for ticket {ticket_id} ({email})")

            processed_tickets.add(ticket_id)
            changed = True

        if changed:
            with open(PROCESSED_TICKETS_FILE, "w") as f:
                json.dump(list(processed_tickets), f, indent=2)
            with open(PENDING_REVISIONS, "w") as f:
                json.dump(pending_revisions, f, indent=2)

    except Exception as e:
        error_notify("Ticket scan failed", e, traceback.format_exc())


# ── PAID REDESIGN PROCESSOR ───────────────────────────────────────────────────
def check_pending_redesigns():
    """Polls KV for pending_redesign: entries (set by Worker after redesign payment).
    Processes the redesign via Claude and sends internal review email."""
    try:
        import urllib.parse
        encoded_prefix = urllib.parse.quote("pending_redesign:", safe="")
        req = urllib.request.Request(
            f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/keys?prefix={encoded_prefix}"
        )
        req.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            keys = json.loads(r.read()).get("result", [])

        try:
            with open(PENDING_REVISIONS) as f:
                pending_revisions = json.load(f)
        except Exception:
            pending_revisions = {}

        for key_obj in keys:
            key = key_obj["name"]
            encoded_key = urllib.parse.quote(key, safe="")
            req2 = urllib.request.Request(
                f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}"
            )
            req2.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
            with urllib.request.urlopen(req2, context=ctx, timeout=15) as r:
                data = json.loads(r.read())

            email       = data["email"]
            name        = data["name"]
            first_name  = name.split()[0]
            plan_type   = data.get("plan_type", "")
            subject     = data.get("subject", "Full Redesign")
            description = data.get("description", "")
            html_path   = data.get("html_path", "")
            folder_path = data.get("folder_path", "")
            revised_path = data.get("revised_path", "")
            ticket_id   = data.get("ticket_id", "")

            if not html_path or not os.path.exists(html_path):
                log(f"HTML not found for paid redesign {email}, skipping")
                continue

            with open(html_path) as f:
                current_html = f.read()

            log(f"Processing paid redesign for {email}: {subject[:60]}")

            prompt = f"""You are a world-class web designer rebuilding a client's website from scratch. The client has requested a full redesign and has paid for this service. Using the client information below (extracted from their existing site) and the redesign brief, build a completely new, production-ready website.

REDESIGN REQUEST:
Subject: {subject}
---
{description.strip()}
---

EXISTING SITE (for client info reference only — do not copy the design):
{current_html[:8000]}

Build a fresh, stunning website. Apply all GimmeASite design standards: choose a strong design style, pair fonts deliberately, use a refined color palette. Return ONLY the complete HTML — no explanation, no markdown, no code fences."""

            api_req = urllib.request.Request("https://api.anthropic.com/v1/messages")
            api_req.add_header("x-api-key", CLAUDE_API_KEY)
            api_req.add_header("anthropic-version", "2023-06-01")
            api_req.add_header("content-type", "application/json")
            api_payload = json.dumps({
                "model": "claude-sonnet-4-6",
                "max_tokens": 16000,
                "messages": [{"role": "user", "content": prompt}]
            }).encode()

            with urllib.request.urlopen(api_req, data=api_payload, context=ctx, timeout=180) as r:
                api_resp = json.loads(r.read())
            updated_html = api_resp["content"][0]["text"].strip()

            with open(revised_path, "w") as f:
                f.write(updated_html)

            pending_revisions[ticket_id or email] = {
                "sender_email":  email,
                "subject":       subject,
                "folder_path":   folder_path,
                "html_path":     html_path,
                "revised_path":  revised_path,
                "ticket_id":     ticket_id,
                "ticket_type":   "redesign",
                "received_at":   datetime.now(timezone.utc).isoformat()
            }
            with open(PENDING_REVISIONS, "w") as f:
                json.dump(pending_revisions, f, indent=2)

            internal_subject = f"[REDESIGN READY] {name} — Reply with 'deploy' to push live"
            internal_body = f"""Payment confirmed. Redesign is complete and ready for review.

Client: {name} ({email})
Plan: {plan_type}
Request: "{subject}"

---
{description.strip()[:500]}
---

Revised HTML saved to: {revised_path}

Reply with "deploy" to push live, or "redo: [feedback]" to request further changes."""

            send_email("hello@gimmeasite.com", internal_subject, internal_body)
            subprocess.Popen(["open", revised_path])
            notify("GimmeASite — Redesign Ready", f"{name}: {subject[:50]}")
            log(f"Paid redesign ready for {email}")

            # Delete KV entry
            req3 = urllib.request.Request(
                f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}",
                method="DELETE"
            )
            req3.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
            with urllib.request.urlopen(req3, context=ctx, timeout=15) as r:
                r.read()

    except Exception as e:
        error_notify("Pending redesign check failed", e, traceback.format_exc())


def _revision_next_deploy_time(from_now):
    """Given a datetime, advance it into a 9am–5pm EST slot that is 2–6 hours from now."""
    import random
    offset_hours = random.uniform(2, 6)
    candidate = from_now + timedelta(hours=offset_hours)
    candidate = candidate.astimezone(EST)
    # If outside 9am–5pm, push to 9am next valid day
    for _ in range(14):
        if 9 <= candidate.hour < 17:
            break
        if candidate.hour >= 17:
            candidate = candidate.replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(days=1)
        elif candidate.hour < 9:
            candidate = candidate.replace(hour=9, minute=0, second=0, microsecond=0)
    return candidate


def _match_reply_to_revision(msg, pending_revisions):
    """Try to match an incoming email to a pending revision by thread or client name."""
    in_reply_to = msg.get("In-Reply-To", "") or ""
    references  = msg.get("References", "") or ""
    for key, rev in pending_revisions.items():
        internal_msg_id = rev.get("internal_msg_id", "")
        if internal_msg_id and (internal_msg_id in in_reply_to or internal_msg_id in references):
            return key
    # Fallback: subject contains client email username
    subject_raw = msg.get("Subject", "")
    subject_decoded = decode_header(subject_raw)[0][0]
    if isinstance(subject_decoded, bytes):
        subject_decoded = subject_decoded.decode()
    for key, rev in pending_revisions.items():
        fragment = rev["sender_email"].split("@")[0].lower()
        if fragment in subject_decoded.lower():
            return key
    return None


def check_pending_revision_deploys():
    """
    Two responsibilities per run:
    1. Scan inbox for Matthew's reply to a [REVISION READY] email.
       - Reply contains 'deploy' → schedule deploy (2–6 hrs, 9am–5pm EST)
       - Reply contains 'redo:' → re-run Claude with feedback, send new [REVISION READY]
    2. Fire any scheduled deploys whose deploy_after time has passed and it's 9am–5pm EST.
    """
    import random

    try:
        try:
            with open(PENDING_REVISIONS) as f:
                pending_revisions = json.load(f)
        except Exception:
            pending_revisions = {}

        try:
            with open(REVISION_EMAILS_FILE) as f:
                processed_revisions = set(json.load(f))
        except Exception:
            processed_revisions = set()

        changed = False

        # ── Step 1: scan for Matthew's replies ───────────────────────────────
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(GMAIL_USER, GMAIL_APP_PASS)
        mail.select("inbox")

        _, data = mail.search(None, 'FROM "mattrixfr@gmail.com"')
        ids = data[0].split()

        for eid in ids:
            _, msg_data = mail.fetch(eid, "(RFC822)")
            raw = msg_data[0][1]
            msg = email.message_from_bytes(raw)

            reply_msg_id = msg.get("Message-ID", str(eid))
            if reply_msg_id in processed_revisions:
                continue

            subject_raw = msg.get("Subject", "")
            subject_decoded = decode_header(subject_raw)[0][0]
            if isinstance(subject_decoded, bytes):
                subject_decoded = subject_decoded.decode()
            subject_lower = subject_decoded.lower()

            # Only process replies to our revision emails
            if "revision" not in subject_lower and "redo" not in subject_lower:
                continue

            matched_key = _match_reply_to_revision(msg, pending_revisions)
            if not matched_key:
                continue

            rev = pending_revisions[matched_key]

            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                        break
            else:
                body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")

            body_lower = body.lower().strip()

            if body_lower.startswith("redo:") or "redo:" in body_lower[:100]:
                # Re-run Claude with Matthew's feedback
                feedback = body[body.lower().find("redo:") + 5:].strip()
                revised_path = rev["revised_path"]
                html_path    = rev["html_path"]
                sender_email = rev["sender_email"]

                base_html = ""
                if os.path.exists(revised_path):
                    with open(revised_path) as f:
                        base_html = f.read()
                elif os.path.exists(html_path):
                    with open(html_path) as f:
                        base_html = f.read()

                if base_html:
                    redo_prompt = f"""You are a web developer. A revision was made to a client's website but the internal reviewer says it needs more work. Apply the reviewer's feedback to the HTML and return the complete updated file.

REVIEWER FEEDBACK:
{feedback}

CURRENT HTML:
{base_html}

Return ONLY the complete updated HTML — no explanation, no markdown, no code fences."""

                    api_req = urllib.request.Request("https://api.anthropic.com/v1/messages")
                    api_req.add_header("x-api-key", CLAUDE_API_KEY)
                    api_req.add_header("anthropic-version", "2023-06-01")
                    api_req.add_header("content-type", "application/json")
                    api_payload = json.dumps({
                        "model": "claude-sonnet-4-6",
                        "max_tokens": 16000,
                        "messages": [{"role": "user", "content": redo_prompt}]
                    }).encode()

                    with urllib.request.urlopen(api_req, data=api_payload, timeout=120) as r:
                        api_resp = json.loads(r.read())
                    updated_html = api_resp["content"][0]["text"].strip()

                    with open(revised_path, "w") as f:
                        f.write(updated_html)

                    client_name = sender_email.split("@")[0].title()
                    try:
                        with open(PENDING_APPROVALS) as f:
                            approvals = json.load(f)
                        client_name = approvals.get(sender_email, {}).get("name", client_name)
                    except Exception:
                        pass

                    internal_subject = f"[REVISION READY] {client_name} — Reply with 'deploy' to push live (updated)"
                    internal_body = f"""The revision has been updated based on your feedback.

Client: {client_name} ({sender_email})
Your feedback was: "{feedback}"

Revised HTML saved to: {revised_path}

Reply with "deploy" to push live, or "redo: [feedback]" to request further changes."""

                    send_email("hello@gimmeasite.com", internal_subject, internal_body)
                    subprocess.Popen(["open", revised_path])
                    log(f"Redo revision sent for {sender_email}")
                    notify("GimmeASite — Revision Updated", f"{client_name}'s revision has been reworked")
                    changed = True

            elif "deploy" in body_lower[:200] or "deploy" in subject_lower:
                # For annual redesigns, hold deploy until 3 days after ticket receipt
                normal_deploy = _revision_next_deploy_time(datetime.now(timezone.utc))
                if rev.get("ticket_type") == "redesign":
                    received_at = datetime.fromisoformat(rev.get("received_at", datetime.now(timezone.utc).isoformat())).replace(tzinfo=timezone.utc)
                    earliest_allowed = received_at + timedelta(days=3)
                    if earliest_allowed > normal_deploy.astimezone(timezone.utc):
                        deploy_at = _revision_next_deploy_time(earliest_allowed)
                    else:
                        deploy_at = normal_deploy
                else:
                    deploy_at = normal_deploy
                rev["status"]       = "scheduled"
                rev["deploy_after"] = deploy_at.isoformat()
                pending_revisions[matched_key] = rev
                log(f"Revision deploy scheduled for {rev['sender_email']} at {deploy_at.isoformat()}")
                changed = True

            processed_revisions.add(reply_msg_id)

        mail.logout()

        with open(REVISION_EMAILS_FILE, "w") as f:
            json.dump(list(processed_revisions), f, indent=2)

        if changed:
            with open(PENDING_REVISIONS, "w") as f:
                json.dump(pending_revisions, f, indent=2)

        # ── Step 2: fire scheduled deploys ───────────────────────────────────
        now_est = datetime.now(EST)
        in_window = 9 <= now_est.hour < 17
        deployed_keys = []

        for key, rev in pending_revisions.items():
            if rev.get("status") != "scheduled":
                continue
            deploy_after = datetime.fromisoformat(rev["deploy_after"])
            if deploy_after.tzinfo is None:
                deploy_after = deploy_after.replace(tzinfo=EST)
            if not in_window or datetime.now(timezone.utc) < deploy_after.astimezone(timezone.utc):
                continue

            revised_path = rev["revised_path"]
            html_path    = rev["html_path"]
            sender_email = rev["sender_email"]

            if not os.path.exists(revised_path):
                log(f"Revised HTML missing at {revised_path}, skipping")
                deployed_keys.append(key)
                continue

            with open(revised_path) as f:
                updated_html = f.read()

            folder_name = os.path.basename(rev["folder_path"])
            company = folder_name.replace(" - Site Draft", "").strip()

            try:
                with open(PENDING_APPROVALS) as f:
                    approvals = json.load(f)
                record = approvals.get(sender_email, {})
                existing_project = record.get("pages_project")
                client_name = record.get("name", sender_email.split("@")[0].title())
                first_name  = client_name.split()[0]
                client_plan = record.get("plan", "").lower()
            except Exception:
                existing_project = None
                client_name = sender_email.split("@")[0].title()
                first_name  = client_name
                client_plan = ""

            site_id, new_url = cf_pages_deploy(updated_html, company, existing_project)

            with open(html_path, "w") as f:
                f.write(updated_html)
            os.remove(revised_path)

            try:
                with open(PENDING_APPROVALS) as f:
                    approvals = json.load(f)
                if sender_email in approvals:
                    approvals[sender_email]["preview_url"] = new_url
                    approvals[sender_email]["pages_project"] = site_id
                    with open(PENDING_APPROVALS, "w") as f:
                        json.dump(approvals, f, indent=2)
            except Exception:
                pass

            # Email client — varies by ticket type and plan
            ticket_type_deployed = rev.get("ticket_type", "revision")
            is_redesign = ticket_type_deployed == "redesign"
            work_label  = "redesign" if is_redesign else "revision"
            past_label  = "redesigned" if is_redesign else "updated"

            if is_redesign:
                # Redesign live emails — two versions: annual vs everyone else
                client_subject = f"Your redesign is live, {first_name}!"
                if client_plan == "annual":
                    client_body = f"""Hi {first_name},

Great news — your requested redesign has been completed and your site has been fully rebuilt. Everything is live and looking incredible!

If you need any further changes, submit a ticket at https://gimmeasite.com/tickets and we'll take care of it.

Cheers,
The GimmeASite Team"""
                else:
                    client_body = f"""Hi {first_name},

Great news — your requested redesign has been completed and your site has been fully rebuilt. Everything is live and looking incredible!

If you need any further changes, submit a ticket at https://gimmeasite.com/tickets and we'll take care of it. If we did not fulfill your redesign request correctly, let us know and you will not be charged for an additional redesign.

Cheers,
The GimmeASite Team"""
            else:
                # Revision live emails — three versions by plan
                client_subject = f"Your revision is live, {first_name}!"
                if client_plan == "upfront":
                    client_body = f"""Hi {first_name},

Great news — your requested revision has been completed and your site has been updated. Everything is live and looking great!

If you need any further changes, submit a ticket at https://gimmeasite.com/tickets and we'll take care of it. Make sure to be mindful of how many revisions are included in your Plan. If we did not fulfill your revision request correctly, that revision will not count against your total.

Cheers,
The GimmeASite Team"""
                elif client_plan == "annual":
                    client_body = f"""Hi {first_name},

Great news — your requested revision has been completed and your site has been updated. Everything is live and looking great!

If you need any further changes, submit a ticket at https://gimmeasite.com/tickets and we'll take care of it.

Cheers,
The GimmeASite Team"""
                else:
                    client_body = f"""Hi {first_name},

Great news — your requested revision has been completed and your site has been updated. Everything is live and looking great!

If you need any further changes, submit a ticket at https://gimmeasite.com/tickets and we'll take care of it. Make sure to be mindful of how many revisions are included in your Plan. If we did not fulfill your revision request correctly, that revision will not count against your total.

Cheers,
The GimmeASite Team"""
            send_email(sender_email, client_subject, client_body)

            # Internal confirmation
            internal_type = "REDESIGN" if is_redesign else "REVISION"
            send_email("hello@gimmeasite.com",
                       f"[{internal_type} DEPLOYED] {client_name} — {new_url}",
                       f"{internal_type.title()} deployed for {client_name} ({sender_email}).\n\nPreview: {new_url}")

            log(f"Revision deployed for {sender_email}: {new_url}")
            notify("GimmeASite — Revision Deployed", f"{client_name}'s revision is live")

            # Mark ticket resolved in Supabase if originated from ticketing system
            ticket_id = rev.get("ticket_id")
            if ticket_id:
                try:
                    supabase_patch(f"tickets?id=eq.{ticket_id}", {"status": "resolved"})
                    log(f"Ticket {ticket_id} marked resolved")
                except Exception as e:
                    log(f"Failed to mark ticket resolved: {e}")

            deployed_keys.append(key)

        for key in deployed_keys:
            pending_revisions.pop(key, None)

        with open(PENDING_REVISIONS, "w") as f:
            json.dump(pending_revisions, f, indent=2)

    except Exception as e:
        error_notify("Revision deploy check failed", e, traceback.format_exc())


def check_ticket_payment_emails():
    """Fires payment follow-up emails for Revision Refill, Domain Change, and Transfer of Ownership
    tickets one day after the confirmation, within 9am–5pm EST."""
    try:
        try:
            with open(PENDING_TICKET_PAYMENTS) as f:
                payments = json.load(f)
        except Exception:
            payments = {}

        changed  = False
        now_utc  = datetime.now(timezone.utc)
        now_est  = now_utc.astimezone(EST)

        for ticket_id, data in list(payments.items()):
            if data.get("sent"):
                continue
            send_after = datetime.fromisoformat(data["send_after"]).replace(tzinfo=timezone.utc)
            if now_utc < send_after:
                continue
            if not (9 <= now_est.hour < 17):
                continue

            email      = data["email"]
            first_name = data["first_name"]
            tt         = data["ticket_type"]

            if tt == "Redesign":
                subject = f"One more step for your redesign, {first_name}!"
                body = f"""Hi {first_name},

We've received your ticket for a Redesign request and we're ready to get started! Since redesigns are a premium service, there is a one-time fee to proceed.

To initiate your redesign, please complete payment at the link below:

https://account.gimmeasite.com/b/cNieVf8iC6e89ke2BJ0co0l

Once payment is confirmed, our team will begin your redesign right away. Allow sufficient time for completion.

If you have any questions, just reply to this email.

Cheers,
The GimmeASite Team"""

            elif tt == "Revision Refill":
                subject = f"Complete your Revision Refill purchase, {first_name}!"
                body = f"""Hi {first_name},

We've received your ticket for a Revision Refill request and we're ready to top you up! Each revision credit can be used toward a reasonable amount of edits to your site.

To complete your purchase, visit the link below — you can select the quantity you'd like directly on the payment page:

https://account.gimmeasite.com/b/9B68wR9mG4602VQ0tB0co0g

Once payment is confirmed, your revision credits will be added to your account and you're all set.

If you have any questions, just reply to this email.

Cheers,
The GimmeASite Team"""

            elif tt == "Domain Change":
                subject = f"Your domain change invoice, {first_name}"
                body = f"""Hi {first_name},

We've reviewed your Domain Change request and have sent you an invoice for the associated fee. Once payment is received, our team will acquire your new domain and get everything configured right away.

Please check your email for the invoice and complete payment at your earliest convenience to get started.

If you have any questions, just reply to this email.

Cheers,
The GimmeASite Team"""

            elif tt == "Transfer of Ownership":
                subject = f"Your Transfer of Ownership invoice, {first_name}"
                body = f"""Hi {first_name},

We've reviewed your Transfer of Ownership request and have sent you an invoice for the associated fee. Once payment is received, our team will prepare your website files and/or initiate your domain transfer right away.

Please check your email for the invoice and complete payment at your earliest convenience to get started.

If you have any questions, just reply to this email.

Cheers,
The GimmeASite Team"""

            elif tt in ("Upgrade to a Subscription Plan", "Upgrade Plan"):
                payment_url = data.get("payment_url", "")
                subject = f"Complete your plan upgrade, {first_name}!"
                body = f"""Hi {first_name},

We've reviewed your upgrade request and your new plan is ready to go! Complete payment below and your plan will be upgraded right away.

{payment_url}

Once payment is confirmed, you'll have access to all your new plan benefits immediately.

If you have any questions, just reply to this email.

Cheers,
The GimmeASite Team"""
                # Set KV so Worker can detect payment
                kv_put(f"pending_plan_upgrade:{email}", json.dumps({
                    "email":       email,
                    "first_name":  first_name,
                    "ticket_id":   data.get("ticket_id", ""),
                    "new_plan":    data.get("new_plan", ""),
                    "change_type": "upgrade"
                }))

            elif tt == "Downgrade Plan":
                payment_url = data.get("payment_url", "")
                subject = f"Your plan change request, {first_name}"
                body = f"""Hi {first_name},

We've reviewed your downgrade request. To approve your new plan, complete the invoice at the link below — you won't be charged today. The change will take effect at the end of your current billing cycle.

{payment_url}

If you have any questions, just reply to this email.

Cheers,
The GimmeASite Team"""
                # Set KV so Worker can detect checkout completion
                kv_put(f"pending_plan_downgrade_setup:{email}", json.dumps({
                    "email":       email,
                    "first_name":  first_name,
                    "ticket_id":   data.get("ticket_id", ""),
                    "new_plan":    data.get("new_plan", ""),
                    "change_type": "downgrade"
                }))

            else:
                continue

            send_email(email, subject, body)
            data["sent"] = True
            changed = True
            log(f"Ticket payment email sent to {email} ({tt})")

        if changed:
            with open(PENDING_TICKET_PAYMENTS, "w") as f:
                json.dump(payments, f, indent=2)

    except Exception as e:
        error_notify("Ticket payment email check failed", e, traceback.format_exc())


def check_support_expiry():
    """Fires a support period expiry email to upfront clients 6 months after payment, 9am–5pm EST."""
    try:
        import urllib.parse
        encoded_prefix = urllib.parse.quote("pending_support_expiry:", safe="")
        req = urllib.request.Request(
            f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/keys?prefix={encoded_prefix}"
        )
        req.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            keys = json.loads(r.read()).get("result", [])

        for key_obj in keys:
            key = key_obj["name"]
            encoded_key = urllib.parse.quote(key, safe="")
            req2 = urllib.request.Request(
                f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}"
            )
            req2.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
            with urllib.request.urlopen(req2, context=ctx, timeout=15) as r:
                data = json.loads(r.read())

            if data.get("sent"):
                continue

            send_after = datetime.fromisoformat(data["send_after"]).replace(tzinfo=timezone.utc)
            now_utc    = datetime.now(timezone.utc)
            now_est    = now_utc.astimezone(EST)

            if now_utc < send_after:
                continue
            if not (9 <= now_est.hour < 17):
                continue

            to         = data["to"]
            first_name = data["first_name"]

            subject = f"Your support period has ended, {first_name}"
            body = f"""Hi {first_name},

Your 6-month support period with GimmeASite has come to an end. We hope we've been able to make a real impact on your online presence!

If you'd like to continue receiving revisions, updates, and priority support, you can renew by submitting an "Upfront Support Renewal" ticket at the link below — our team will take it from there.

https://gimmeasite.com/tickets

We'd love to keep working with you.

Cheers,
The GimmeASite Team"""
            send_email(to, subject, body)
            send_email("hello@gimmeasite.com",
                       f"[SUPPORT EXPIRED] {first_name} ({to})",
                       f"Support period expiry email sent to {first_name} ({to}).")
            data["sent"] = True

            req3 = urllib.request.Request(
                f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}",
                data=json.dumps(data).encode(), method="PUT"
            )
            req3.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
            req3.add_header("Content-Type", "text/plain")
            with urllib.request.urlopen(req3, context=ctx, timeout=15) as r:
                r.read()
            log(f"Support expiry email sent to {to}")

    except Exception as e:
        error_notify("Support expiry check failed", e, traceback.format_exc())


def check_support_renewals():
    """Sends the upfront support renewal email 1 day after ticket receipt, within 9am–5pm EST."""
    try:
        try:
            with open(PENDING_SUPPORT_RENEWALS) as f:
                renewals = json.load(f)
        except Exception:
            renewals = {}

        changed = False
        now_utc = datetime.now(timezone.utc)
        now_est = now_utc.astimezone(EST)

        for email, data in list(renewals.items()):
            if data.get("email_sent"):
                continue
            send_after = datetime.fromisoformat(data["send_after"]).replace(tzinfo=timezone.utc)
            if now_utc < send_after:
                continue
            if not (9 <= now_est.hour < 17):
                continue

            first_name = data["first_name"]
            subject = f"Renew your support period, {first_name}!"
            body = f"""Hi {first_name},

We've received your renewal request — welcome back! To reactivate your support period and resume access to revisions and updates, you can complete your renewal at the link below.

As a thank you for being a loyal member, you'll receive 10 bonus revision credits upon renewal.

https://account.gimmeasite.com/b/14A5kF56q6e88gagsz0co0i

If you have any questions, just reply to this email — we're happy to help.

Cheers,
The GimmeASite Team"""
            send_email(email, subject, body)
            send_email("hello@gimmeasite.com",
                       f"[SUPPORT RENEWAL] Renewal email sent to {first_name} ({email})",
                       f"Renewal follow-up sent to {email}. Awaiting payment.")
            data["email_sent"] = True
            changed = True
            log(f"Support renewal email sent to {email}")

        if changed:
            with open(PENDING_SUPPORT_RENEWALS, "w") as f:
                json.dump(renewals, f, indent=2)

    except Exception as e:
        error_notify("Support renewal check failed", e, traceback.format_exc())


def check_support_renewal_paid():
    """Polls KV for pending_support_renewal_paid: entries (set by Worker on payment).
    Adds 10 revision credits in Supabase and notifies Matthew."""
    try:
        import urllib.parse
        encoded_prefix = urllib.parse.quote("pending_support_renewal_paid:", safe="")
        req = urllib.request.Request(
            f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/keys?prefix={encoded_prefix}"
        )
        req.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            keys = json.loads(r.read()).get("result", [])

        for key_obj in keys:
            key = key_obj["name"]
            encoded_key = urllib.parse.quote(key, safe="")
            req2 = urllib.request.Request(
                f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}"
            )
            req2.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
            with urllib.request.urlopen(req2, context=ctx, timeout=15) as r:
                data = json.loads(r.read())

            email      = data["email"]
            first_name = data["first_name"]
            ticket_id  = data.get("ticket_id", "")

            # Add 10 revision credits to client_quotes in Supabase
            try:
                # Fetch current credits
                result = supabase_request("GET", f"client_quotes?email=eq.{email}&select=id,revision_credits")
                if result and len(result) > 0:
                    record     = result[0]
                    quote_id   = record["id"]
                    current    = int(record.get("revision_credits") or 0)
                    new_total  = current + 10
                    supabase_patch(f"client_quotes?id=eq.{quote_id}", {"revision_credits": new_total})
                    log(f"Added 10 revision credits for {email} (now {new_total})")
                else:
                    log(f"No client_quotes record found for {email} — credits not updated")
            except Exception as e:
                log(f"Supabase credit update failed for {email}: {e}")

            # Resolve the ticket in Supabase
            if ticket_id:
                try:
                    supabase_patch(f"tickets?id=eq.{ticket_id}", {"status": "resolved"})
                except Exception:
                    pass

            # Remove from pending_support_renewals
            try:
                with open(PENDING_SUPPORT_RENEWALS) as f:
                    renewals = json.load(f)
                renewals.pop(email, None)
                with open(PENDING_SUPPORT_RENEWALS, "w") as f:
                    json.dump(renewals, f, indent=2)
            except Exception:
                pass

            send_email(email,
                       f"Your support period has been renewed, {first_name}!",
                       f"""Hi {first_name},

Great news — your support period has been successfully renewed! You now have full access to revisions, updates, and support once again.

As promised, 10 bonus revision credits have been added to your account. You're all set!

If you have any questions or need anything, just reply to this email.

Cheers,
The GimmeASite Team""")
            send_email("hello@gimmeasite.com",
                       f"[SUPPORT RENEWAL PAID] {first_name} ({email})",
                       f"{first_name} ({email}) has renewed their support period. 10 revision credits added to their account.")
            log(f"Support renewal processed for {email}")

            # Delete KV entry
            req3 = urllib.request.Request(
                f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}",
                method="DELETE"
            )
            req3.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
            with urllib.request.urlopen(req3, context=ctx, timeout=15) as r:
                r.read()

    except Exception as e:
        error_notify("Support renewal paid check failed", e, traceback.format_exc())


def kv_poll_prefix(prefix):
    """Returns list of (key, encoded_key, data) tuples for a given KV prefix."""
    import urllib.parse
    encoded_prefix = urllib.parse.quote(prefix, safe="")
    req = urllib.request.Request(
        f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/keys?prefix={encoded_prefix}"
    )
    req.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
    with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
        keys = json.loads(r.read()).get("result", [])
    results = []
    for key_obj in keys:
        import urllib.parse as up
        key = key_obj["name"]
        encoded_key = up.quote(key, safe="")
        req2 = urllib.request.Request(
            f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}"
        )
        req2.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
        with urllib.request.urlopen(req2, context=ctx, timeout=15) as r:
            data = json.loads(r.read())
        results.append((key, encoded_key, data))
    return results


def kv_delete(encoded_key):
    import urllib.request as ur
    req = ur.Request(
        f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{encoded_key}",
        method="DELETE"
    )
    req.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
    with ur.urlopen(req, context=ctx, timeout=15) as r:
        r.read()


def check_domain_change_sub_emails():
    """Polls pending_domain_change_sub_email: KV (set by admin charge route after subscription update).
    Sends a confirmation email to the client letting them know their subscription price has been updated."""
    try:
        for key, encoded_key, data in kv_poll_prefix("pending_domain_change_sub_email:"):
            email        = data["email"]
            first_name   = data["first_name"]
            new_amount   = data["new_amount"]
            interval     = data.get("interval", "month")
            period_label = "year" if interval == "year" else "month"

            send_email(email,
                f"Your subscription has been updated, {first_name}",
                f"""Hi {first_name},

Just a heads up — your subscription has been updated to reflect your new domain. Your new billing rate is ${new_amount}/{period_label}, starting from your next billing cycle.

No action is needed on your end. If you have any questions, just reply to this email.

Cheers,
The GimmeASite Team""")

            kv_delete(encoded_key)
            log(f"Domain change subscription confirmation sent to {email}")
    except Exception as e:
        error_notify("check_domain_change_sub_emails failed", e, traceback.format_exc())


def check_domain_change_paid():
    """Polls pending_domain_change_paid: KV (set by Worker on invoice.paid).
    Registers the new domain on Cloudflare, links to Pages, sends client confirmation."""
    try:
        for key, encoded_key, data in kv_poll_prefix("pending_domain_change_paid:"):
            email      = data["email"]
            first_name = data["first_name"]
            ticket_id  = data.get("ticket_id", "")
            description = data.get("description", "")

            # Extract new domain from ticket description (look for domain pattern)
            import re
            domain_match = re.search(r'\b([a-zA-Z0-9-]+\.[a-zA-Z]{2,})\b', description)
            new_domain = domain_match.group(1).lower() if domain_match else None

            if new_domain:
                try:
                    # Look up client's site_id
                    site_id = None
                    with open(PENDING_APPROVALS) as f:
                        approvals = json.load(f)
                    record  = approvals.get(email, {})
                    site_id = record.get("site_id", "")
                    site_url = record.get("preview_url") or record.get("site_url", "")

                    # Create Cloudflare zone and DNS records
                    zone_res = urllib.request.urlopen(
                        urllib.request.Request(
                            f"https://api.cloudflare.com/client/v4/zones",
                            data=json.dumps({"name": new_domain, "account": {"id": CF_ACCOUNT_ID}, "jump_start": False}).encode(),
                            method="POST",
                            headers={"Authorization": f"Bearer {CF_API_TOKEN}", "Content-Type": "application/json"}
                        ), context=ctx, timeout=15
                    )
                    zone_data = json.loads(zone_res.read())
                    zone_id   = zone_data.get("result", {}).get("id")

                    pages_cname = site_url.replace("https://", "").rstrip("/") if site_url else None
                    if zone_id and pages_cname:
                        for record_body in [
                            {"type": "CNAME", "name": new_domain, "content": pages_cname, "ttl": 1, "proxied": False},
                            {"type": "CNAME", "name": "www",      "content": pages_cname, "ttl": 1, "proxied": False}
                        ]:
                            urllib.request.urlopen(
                                urllib.request.Request(
                                    f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records",
                                    data=json.dumps(record_body).encode(), method="POST",
                                    headers={"Authorization": f"Bearer {CF_API_TOKEN}", "Content-Type": "application/json"}
                                ), context=ctx, timeout=15
                            ).read()

                    if site_id:
                        # Add custom domain to Cloudflare Pages project
                        urllib.request.urlopen(
                            urllib.request.Request(
                                f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/pages/projects/{site_id}/domains",
                                data=json.dumps({"name": new_domain}).encode(), method="POST",
                                headers={"Authorization": f"Bearer {CF_API_TOKEN}", "Content-Type": "application/json"}
                            ), context=ctx, timeout=15
                        ).read()

                    # Get nameservers
                    ns_res = urllib.request.urlopen(
                        urllib.request.Request(
                            f"https://api.cloudflare.com/client/v4/zones/{zone_id}",
                            headers={"Authorization": f"Bearer {CF_API_TOKEN}"}
                        ), context=ctx, timeout=15
                    )
                    ns_data     = json.loads(ns_res.read())
                    nameservers = ns_data.get("result", {}).get("name_servers", [])
                    ns_list     = "\n".join(f"   {ns}" for ns in nameservers)

                    send_email(email,
                        f"Your new domain is ready, {first_name}!",
                        f"""Hi {first_name},

Great news — your new domain ({new_domain}) has been acquired and configured. There's just one quick step on your end.

Log in to your domain registrar and update your nameservers to the following:

{ns_list}

DNS changes can take up to 24–48 hours to propagate, but your site is usually live within a few hours.

If you need any help, just reply to this email.

Cheers,
The GimmeASite Team""")
                    log(f"Domain change configured for {email}: {new_domain}")
                except Exception as e:
                    log(f"Domain change automation failed for {email}: {e}")
                    send_email("hello@gimmeasite.com",
                               f"[DOMAIN CHANGE ERROR] {first_name} ({email})",
                               f"Domain change paid but automation failed for {email}.\nNew domain: {new_domain}\nError: {e}")
            else:
                log(f"Could not extract domain from ticket for {email}")
                send_email("hello@gimmeasite.com",
                           f"[DOMAIN CHANGE] Manual action needed — {first_name} ({email})",
                           f"Domain change invoice paid by {first_name} ({email}) but no domain found in ticket description.\n\nDescription:\n{description}")

            if ticket_id:
                try:
                    supabase_patch(f"tickets?id=eq.{ticket_id}", {"status": "resolved"})
                except Exception:
                    pass

            send_email("hello@gimmeasite.com",
                       f"[DOMAIN CHANGE PAID] {first_name} ({email})",
                       f"Domain change invoice paid by {first_name} ({email}).\nNew domain: {new_domain or 'unknown'}")
            kv_delete(encoded_key)

    except Exception as e:
        error_notify("Domain change paid check failed", e, traceback.format_exc())


def check_transfer_paid():
    """Polls pending_transfer_paid: KV (set by Worker on invoice.paid).
    Emails site ZIP and/or sends Cloudflare domain auth code."""
    try:
        for key, encoded_key, data in kv_poll_prefix("pending_transfer_paid:"):
            email       = data["email"]
            first_name  = data["first_name"]
            ticket_id   = data.get("ticket_id", "")
            description = data.get("description", "").lower()

            ticket_subject   = data.get("subject", "")
            transfer_domain  = "domain" in ticket_subject.lower()
            transfer_files   = "website files" in ticket_subject.lower()

            # Default: transfer both if unclear
            if not transfer_domain and not transfer_files:
                transfer_domain = True
                transfer_files  = True

            auth_code   = None
            domain      = None
            zip_success = False

            # Look up client record
            try:
                with open(PENDING_APPROVALS) as f:
                    approvals = json.load(f)
                record  = approvals.get(email, {})
                domain  = record.get("domain", "")
                site_id = record.get("site_id", "")
            except Exception:
                site_id = ""

            # Get Cloudflare domain auth code
            if transfer_domain and domain:
                try:
                    # Unlock domain
                    urllib.request.urlopen(
                        urllib.request.Request(
                            f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/registrar/domains/{domain}",
                            data=json.dumps({"locked": False}).encode(), method="PUT",
                            headers={"Authorization": f"Bearer {CF_API_TOKEN}", "Content-Type": "application/json"}
                        ), context=ctx, timeout=15
                    ).read()
                    # Get auth code
                    auth_res = urllib.request.urlopen(
                        urllib.request.Request(
                            f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/registrar/domains/{domain}",
                            headers={"Authorization": f"Bearer {CF_API_TOKEN}"}
                        ), context=ctx, timeout=15
                    )
                    auth_data = json.loads(auth_res.read())
                    auth_code = auth_data.get("result", {}).get("auth_code")
                    log(f"Domain auth code retrieved for {domain}")
                except Exception as e:
                    log(f"Could not retrieve auth code for {domain}: {e}")

            # Build site ZIP from local draft folder and email it
            if transfer_files:
                try:
                    import zipfile, io
                    company_name = record.get("company") or record.get("name", email.split("@")[0])
                    deploy_name  = company_name or email.split("@")[0]
                    title        = f"{deploy_name} - Site Draft"
                    html_path    = os.path.join(DRAFTS_DIR, title, "index.html")
                    zip_path     = f"/tmp/{email.replace('@','_')}_site.zip"
                    if os.path.exists(html_path):
                        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                            zf.write(html_path, "index.html")
                        zip_success = True
                        log(f"Site ZIP created for {email}: {zip_path}")
                    else:
                        raise FileNotFoundError(f"Draft not found at {html_path}")
                except Exception as e:
                    log(f"ZIP creation failed for {email}: {e}")
                    send_email("hello@gimmeasite.com",
                               f"[TRANSFER ERROR] ZIP failed — {first_name} ({email})",
                               f"Could not create site ZIP for {email}.\nError: {e}\n\nPlease send files manually.")

            # Build and send client email
            body_parts = [f"Hi {first_name},\n\nGreat news — your Transfer of Ownership has been processed!\n"]

            if transfer_files:
                if zip_success:
                    body_parts.append("Your website files are attached to this email as a ZIP. To host your site, upload the files to any web hosting provider of your choice — we're happy to provide guidance if you need it.\n")
                else:
                    body_parts.append("We ran into an issue preparing your site files. Our team will send them to you manually shortly.\n")

            if transfer_domain and auth_code:
                body_parts.append(f"To transfer your domain ({domain}), use the authorization code below at your new registrar:\n\nAuthorization Code: {auth_code}\n\nSimply provide this code when initiating the transfer at your registrar of choice (GoDaddy, Namecheap, etc.) and they'll walk you through the rest.\n")
            elif transfer_domain and not auth_code:
                body_parts.append(f"We encountered an issue retrieving your domain authorization code for {domain}. Our team will follow up with it shortly.\n")

            body_parts.append("If you have any questions, just reply to this email.\n\nCheers,\nThe GimmeASite Team")

            # Send with attachment if ZIP exists
            if zip_success:
                import smtplib, email as emaillib
                from email.mime.multipart import MIMEMultipart
                from email.mime.text import MIMEText
                from email.mime.application import MIMEApplication

                msg = MIMEMultipart()
                msg["From"]    = "hello@gimmeasite.com"
                msg["To"]      = email
                msg["Subject"] = f"Your Transfer of Ownership is complete, {first_name}!"
                msg.attach(MIMEText("\n".join(body_parts), "plain"))

                with open(zip_path, "rb") as f:
                    part = MIMEApplication(f.read(), Name=f"{domain or 'site'}_files.zip")
                    part["Content-Disposition"] = f'attachment; filename="{domain or "site"}_files.zip"'
                    msg.attach(part)

                with smtplib.SMTP("smtp.gmail.com", 587) as server:
                    server.starttls()
                    server.login("mattrixfr@gmail.com", "axhr mtwy plam zelv")
                    server.sendmail("mattrixfr@gmail.com", email, msg.as_string())
                log(f"Transfer email with ZIP sent to {email}")
            else:
                send_email(email,
                    f"Your Transfer of Ownership is complete, {first_name}!",
                    "\n".join(body_parts))

            if ticket_id:
                try:
                    supabase_patch(f"tickets?id=eq.{ticket_id}", {"status": "resolved"})
                except Exception:
                    pass

            send_email("hello@gimmeasite.com",
                       f"[TRANSFER PAID] {first_name} ({email})",
                       f"Transfer of Ownership processed for {first_name} ({email}).\nDomain: {domain}\nAuth code: {auth_code or 'N/A'}\nZIP sent: {zip_success}")
            kv_delete(encoded_key)

    except Exception as e:
        error_notify("Transfer paid check failed", e, traceback.format_exc())


def check_revision_refill_paid():
    """Polls pending_revision_refill_paid: KV (set by Worker on checkout.session.completed).
    Adds purchased revision credits to Supabase and sends client confirmation."""
    try:
        for key, encoded_key, data in kv_poll_prefix("pending_revision_refill_paid:"):
            email      = data["email"]
            first_name = data["first_name"]
            ticket_id  = data.get("ticket_id", "")
            quantity   = int(data.get("quantity", 1))

            try:
                result = supabase_request("GET", f"client_quotes?email=eq.{email}&select=id,revision_credits")
                if result and len(result) > 0:
                    record    = result[0]
                    quote_id  = record["id"]
                    current   = int(record.get("revision_credits") or 0)
                    new_total = current + quantity
                    supabase_patch(f"client_quotes?id=eq.{quote_id}", {"revision_credits": new_total})
                    log(f"Added {quantity} revision credits for {email} (now {new_total})")
                else:
                    log(f"No client_quotes record found for {email} — credits not updated")
            except Exception as e:
                log(f"Supabase credit update failed for {email}: {e}")

            send_email(email,
                f"Your revisions have been refilled, {first_name}!",
                f"""Hi {first_name},

Your Revision Refill has been processed — your revision credits have been added to your account and are ready to use!

Whenever you're ready for a revision, simply submit a ticket at https://gimmeasite.com/tickets and our team will take care of it.

If you have any questions, just reply to this email.

Cheers,
The GimmeASite Team""")

            if ticket_id:
                try:
                    supabase_patch(f"tickets?id=eq.{ticket_id}", {"status": "resolved"})
                except Exception:
                    pass

            send_email("hello@gimmeasite.com",
                       f"[REVISION REFILL PAID] {first_name} ({email})",
                       f"{quantity} revision credit(s) added for {first_name} ({email}).")
            kv_delete(encoded_key)

    except Exception as e:
        error_notify("Revision refill paid check failed", e, traceback.format_exc())


PLAN_CREDITS = {
    "monthly": 2,
    "hybrid":  2,
    "annual":  999,
    "upfront": 3,
}


def check_plan_change_paid():
    """Detects plan upgrade payments (pending_plan_change:) and updates Supabase + sends confirmation."""
    try:
        import urllib.parse
        for key, encoded_key, data in kv_poll_prefix("pending_plan_change:"):
            email      = data.get("email", "")
            first_name = data.get("first_name", "there")
            new_plan   = data.get("new_plan", "")
            ticket_id  = data.get("ticket_id", "")

            new_credits = PLAN_CREDITS.get(new_plan, 2)
            try:
                supabase_patch(
                    f"client_quotes?email=eq.{urllib.parse.quote(email)}",
                    {"plan": new_plan, "revision_credits": new_credits}
                )
            except Exception as e:
                log(f"Supabase plan upgrade update failed for {email}: {e}")

            if ticket_id:
                try:
                    supabase_patch(f"tickets?id=eq.{ticket_id}", {"resolved": True})
                except Exception:
                    pass

            plan_display = new_plan.capitalize() if new_plan else "your new plan"
            change_type  = data.get("change_type", "upgrade")
            if change_type == "downgrade":
                conf_subject = f"Your plan has been updated, {first_name}"
                conf_body    = f"""Hi {first_name},

Your plan has been updated to the {plan_display} Plan and will take effect at the start of your next billing cycle.

If you have any questions, just reply to this email.

Cheers,
The GimmeASite Team"""
            else:
                conf_subject = f"Your plan has been upgraded, {first_name}!"
                conf_body    = f"""Hi {first_name},

Your plan has been successfully upgraded to the {plan_display} Plan — your new benefits are now active!

If you have any questions, just reply to this email.

Cheers,
The GimmeASite Team"""
            send_email(email, conf_subject, conf_body)

            send_email("hello@gimmeasite.com",
                       f"[PLAN UPGRADED] {first_name} → {new_plan}",
                       f"Plan upgrade confirmed for {first_name} ({email}).\nNew plan: {new_plan}\nRevision credits set to: {new_credits}")

            kv_delete(encoded_key)
            log(f"Plan upgrade processed for {email} → {new_plan}")

    except Exception as e:
        error_notify("Plan change paid check failed", e, traceback.format_exc())


def check_plan_downgrade():
    """Detects when a scheduled plan downgrade takes effect (period_end passed) and updates Supabase."""
    try:
        import urllib.parse
        now_utc = datetime.now(timezone.utc)

        for key, encoded_key, data in kv_poll_prefix("pending_plan_downgrade:"):
            period_end_str = data.get("period_end", "")
            if not period_end_str:
                continue
            period_end = datetime.fromisoformat(period_end_str).replace(tzinfo=timezone.utc)
            if now_utc < period_end:
                continue

            email      = data.get("email", "")
            first_name = data.get("first_name", "there")
            new_plan   = data.get("new_plan", "")
            ticket_id  = data.get("ticket_id", "")

            new_credits = PLAN_CREDITS.get(new_plan, 2)
            try:
                supabase_patch(
                    f"client_quotes?email=eq.{urllib.parse.quote(email)}",
                    {"plan": new_plan, "revision_credits": new_credits}
                )
            except Exception as e:
                log(f"Supabase plan downgrade update failed for {email}: {e}")

            # Update client's KV plan field
            try:
                import urllib.parse as _up
                _enc = _up.quote(email, safe="")
                _req = urllib.request.Request(
                    f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NS_ID}/values/{_enc}"
                )
                _req.add_header("Authorization", f"Bearer {CF_API_TOKEN}")
                with urllib.request.urlopen(_req, context=ctx, timeout=15) as _r:
                    _cd = json.loads(_r.read())
                _cd["plan"] = new_plan
                kv_put(email, json.dumps(_cd))
            except Exception:
                pass

            if ticket_id:
                try:
                    supabase_patch(f"tickets?id=eq.{ticket_id}", {"resolved": True})
                except Exception:
                    pass

            plan_display = new_plan.capitalize() if new_plan else "your new plan"
            send_email(email, f"Your plan has been updated, {first_name}", f"""Hi {first_name},

Your plan has been updated to the {plan_display} Plan — your new plan is now active.

Need a revision to your site? Submit a ticket at https://gimmeasite.com/tickets and our team will take care of it.

You can manage your subscription, update your payment method, and view invoices at https://gimmeasite.com/billing.

If you have any questions, just reply to this email.

Cheers,
The GimmeASite Team""")

            send_email("hello@gimmeasite.com",
                       f"[PLAN DOWNGRADED] {first_name} → {new_plan}",
                       f"Plan downgrade took effect for {first_name} ({email}).\nNew plan: {new_plan}\nRevision credits set to: {new_credits}")

            kv_delete(encoded_key)
            log(f"Plan downgrade processed for {email} → {new_plan}")

    except Exception as e:
        error_notify("Plan downgrade check failed", e, traceback.format_exc())


def main():
    import urllib.parse  # ensure available for calendar functions

    log("── Watcher run started ──")
    check_inbox_gist()
    check_pending_approvals()
    check_pending_ns_emails()
    check_pending_checkin_emails()
    check_pending_draft_emails()
    check_revision_emails()
    check_pending_revision_deploys()
    check_grace_periods()
    check_cancellations()
    check_tickets()
    check_pending_redesigns()
    check_ticket_payment_emails()
    check_support_expiry()
    check_support_renewals()
    check_support_renewal_paid()
    check_domain_change_sub_emails()
    check_domain_change_paid()
    check_transfer_paid()
    check_revision_refill_paid()
    check_plan_change_paid()
    check_plan_downgrade()

    processed_data  = load_processed()
    drafts_by_email = {k.lower(): v for k, v in processed_data.get("drafts", {}).items()}

    submissions = fetch_supabase_submissions()
    new_subs = [s for s in submissions
                if s.get("name", "").strip().split()[0].lower() != "test"]
    log(f"{len(new_subs)} new submission(s) to process")

    for sub in new_subs:
        company = sub.get("company") or sub.get("name") or sub.get("email", "unknown")
        client_email = sub.get("email", "").lower()
        try:
            log(f"Processing: {company}")
            desired_domain = sub.get("domain", "").strip()
            domain_info = check_domain_price(desired_domain)
            if domain_info:
                avail = "✅ Available" if domain_info["available"] else "❌ Taken"
                price_str = f"${domain_info['price_usd']}/yr" if domain_info["price_usd"] else "price unknown"
                domain_note = f"{domain_info['domain']} — {avail} — {price_str}"
            else:
                domain_note = desired_domain or "none provided"
            log(f"Domain: {domain_note}")

            html = build_html(sub)

            deploy_name = company or sub.get("name", "unknown")
            title = f"{deploy_name} - Site Draft"
            folder = os.path.join(DRAFTS_DIR, title)
            os.makedirs(folder, exist_ok=True)
            with open(os.path.join(folder, "index.html"), "w") as f:
                f.write(html)

            site_id, preview_url = cf_pages_deploy(html, deploy_name)
            log(f"Preview: {preview_url}")

            send_internal_summary(sub, preview_url, domain_note)
            save_pending(company, preview_url, sub, domain_note)
            queue_draft_email(sub, datetime.now(timezone.utc).isoformat())

            # Write client data to Cloudflare KV for payment webhook lookup
            owns_domain = sub.get("ownsDomain", "").strip().lower() in ("yes", "true", "on", "1", "checked")
            client_domain = (sub.get("existingDomain", "").strip() if owns_domain else sub.get("domain", "").strip())
            if client_email and client_domain:
                kv_put(client_email, json.dumps({
                    "domain":             client_domain,
                    "site_id":            site_id,
                    "site_url":           preview_url.replace("https://", "").rstrip("/"),
                    "is_external_domain": owns_domain
                }))

            # Mark processed in Supabase
            try:
                supabase_patch(f"contact_submissions?id=eq.{sub['_supabase_id']}", {"processed": True})
            except Exception as e:
                log(f"Failed to mark submission processed in Supabase: {e}")

            if client_email:
                drafts_by_email[client_email] = preview_url

            save_processed({"drafts": drafts_by_email})
            log(f"Done: {company}")

        except Exception as e:
            tb = traceback.format_exc()
            log(f"Error ({company}): {e}\n{tb}")
            error_notify(f"Draft build/deploy failed: {company}", e, tb)

    # Check for Discovery Calls starting in ~15 minutes
    check_upcoming_calls(drafts_by_email)

    log("── Watcher run complete ──\n")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        tb = traceback.format_exc()
        log(f"FATAL watcher crash: {e}\n{tb}")
        error_notify("GimmeASite watcher CRASHED", e, tb)
        raise
