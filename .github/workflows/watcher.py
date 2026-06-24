import imaplib, email, json, os, ssl, urllib.request, re, traceback, zipfile, io
from datetime import datetime, timezone
from email.header import decode_header

GMAIL_USER     = os.environ["GMAIL_USER"]
GMAIL_APP_PASS = os.environ["GMAIL_APP_PASS"]
CLAUDE_API_KEY = os.environ["CLAUDE_API_KEY"]
GITHUB_TOKEN   = os.environ["GITHUB_TOKEN_SECRET"]
NETLIFY_TOKEN  = os.environ["NETLIFY_TOKEN"]
INBOX_GIST_ID  = os.environ["INBOX_GIST_ID"]
PROCESSED_KEY  = "processed_ids"

ctx = ssl._create_unverified_context()

def log(msg):
    print(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  {msg}", flush=True)

def call_claude(prompt):
    payload = json.dumps({
        "model": "claude-sonnet-4-6",
        "max_tokens": 8000,
        "messages": [{"role": "user", "content": prompt}]
    }).encode()
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=payload,
        headers={
            "x-api-key": CLAUDE_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
    )
    with urllib.request.urlopen(req, context=ctx, timeout=120) as r:
        return json.loads(r.read())["content"][0]["text"]

DESIGN_PROMPT = """\
Before generating anything, randomly select ONE design style from this list — do not default to your most common style, and do not repeat the same style for consecutive clients:

- Brutalist (raw, bold typography, high contrast, unconventional layout)
- Glassmorphism (frosted glass cards, blurred backgrounds, soft gradients)
- Swiss/International (strict grid, clean sans-serif, minimal color, mathematical spacing)
- Editorial (magazine-style, large pull quotes, mixed column widths, strong imagery)
- Japandi Minimalist (warm neutrals, lots of whitespace, subtle textures, understated elegance)
- Bold Maximalist (loud colors, overlapping elements, expressive type, high energy)
- Dark Luxury (deep blacks, gold/silver accents, premium feel, cinematic)
- Corporate Clean (structured, trustworthy, muted palette, professional)
- Memphis/Retro (geometric shapes, bright colors, playful patterns, retro-inspired)
- Coastal/Organic (soft blues, greens, natural textures, relaxed feel)

Then randomly select a font pairing from Google Fonts. Never use: Inter, Roboto, Open Sans, Lato, Montserrat, Poppins, Raleway, Arial, or any default system fonts. Choose something distinctive and intentional — examples by feel:

- Code/technical aesthetic: JetBrains Mono, Fira Code, Space Grotesk, IBM Plex family
- Editorial/literary: Playfair Display, Crimson Pro, Fraunces, Newsreader
- Startup/modern: Clash Display, Satoshi, Cabinet Grotesk, Bricolage Grotesque
- Display contrast pairing: pair a heavy display font with a monospace or geometric sans
- Use weight extremes: 100/200 vs 800/900 — never 400 vs 600. Size jumps of 3x+, not 1.5x.

Avoid converging on common AI choices (Space Grotesk, for example) — think outside the box. Pick one distinctive font and use it decisively. Load from Google Fonts.

Then vary the layout: randomly choose hero alignment (left, center, right, or full-bleed), nav style (sticky top, sidebar, minimal floating), and section order.

Apply the chosen style and font consistently throughout. Commit to a cohesive aesthetic using CSS variables for color consistency. Use dominant colors with sharp accents — avoid timid, evenly-distributed palettes. Draw from IDE themes, cultural aesthetics, and the client's industry for inspiration. Vary between light and dark themes across clients.

Create atmosphere and depth in backgrounds — layer CSS gradients, geometric patterns, or contextual textures that match the overall aesthetic. Never default to a plain solid color background.

Use animations for high-impact moments: a well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use CSS-only animations for all motion effects.

State your chosen style, font pairing, and color palette in an HTML comment at the top of the file.

Override the random style selection if it is clearly inappropriate for the client's industry — in that case, pick the next most appropriate style from the list, still applying all design rules above.

You are an expert frontend engineer. Build a complete, self-contained HTML file using vanilla HTML, CSS, and JavaScript — all inline. Use Tailwind CSS for utility classes where helpful, but define your core design tokens as CSS variables. Do not reference external stylesheets or scripts beyond Google Fonts and Tailwind CDN.

Avoid the "AI slop" aesthetic at all costs:
- No purple gradients on white backgrounds
- No predictable card-grid layouts
- No cliched hero + feature section + CTA patterns unless genuinely appropriate
- No generic, context-free design — every choice should feel tailored to this specific client

Build a sexy, professional, modern, high-converting, easily-navigated, desktop/tablet/mobile-friendly one-page draft. Structure the navigation to include Home, About or Why Us?, Contact, and — if applicable — Our Services or Book Appointment (with pricing). Adapt to the client's type: a music artist does not want an "Our Services" section; a law firm does not want a booking widget. Be circumstantially intelligent.

Use the client info below to shape layout, structure, and UX. Pull their branding, colors, logo, photos, and social media presence from their public profiles and Google. Display their logo in the header. Include galleries, banners, or backgrounds pulled from or inspired by their real media. If media is unavailable, compensate with original generative designs — never use placeholders.

Pull real reviews from Yelp, Google, or relevant platforms for testimonials where credibility matters. Pull accurate business details (address, hours, phone, email) from public sources. Do not invent or generalize information that belongs to other businesses.

Include a footer with social media links, and Privacy Policy, Terms of Service, and Cookie Policy pages linked (not built). Ensure strong CTAs and lead capture forms where appropriate. Make adjustments to avoid plagiarism and AI speculation. All nav buttons and page-link buttons should be non-functional (one-page front-end draft only).

If "Owns existing domain" is yes, use the existing domain throughout the site — footer, contact info, header. Otherwise use the desired domain field.
"""

def build_html(sub):
    fields = {k: sub.get(k, "") for k in
        ["company","name","email","phone","domain","message","instagram",
         "tiktok","facebook","youtube","linkedin","googleBusiness","paymentPlan",
         "ownsDomain","existingDomain"]}
    client_block = f"""CLIENT INFO FROM FORMSPREE:
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

Return ONLY the raw HTML — no markdown, no explanation, no code fences."""
    return call_claude(DESIGN_PROMPT + "\n" + client_block)

def netlify_deploy(html, business_name):
    slug = re.sub(r'[^a-z0-9-]', '-', business_name.lower()).strip('-')
    slug = re.sub(r'-+', '-', slug)[:50] + "-draft"
    data = json.dumps({"name": slug}).encode()
    req = urllib.request.Request("https://api.netlify.com/api/v1/sites", data=data, method="POST")
    req.add_header("Authorization", f"Bearer {NETLIFY_TOKEN}")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
        site = json.loads(r.read())
    site_id  = site["id"]
    site_url = site.get("ssl_url") or site.get("url")
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("index.html", html)
    buf.seek(0)
    req2 = urllib.request.Request(
        f"https://api.netlify.com/api/v1/sites/{site_id}/deploys",
        data=buf.read(), method="POST")
    req2.add_header("Authorization", f"Bearer {NETLIFY_TOKEN}")
    req2.add_header("Content-Type", "application/zip")
    with urllib.request.urlopen(req2, context=ctx, timeout=60) as r:
        r.read()
    return site_id, site_url

def load_gist():
    req = urllib.request.Request(f"https://api.github.com/gists/{INBOX_GIST_ID}")
    req.add_header("Authorization", f"Bearer {GITHUB_TOKEN}")
    req.add_header("Accept", "application/vnd.github.v3+json")
    with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
        gist = json.loads(r.read())
    return json.loads(gist["files"]["inbox.json"]["content"])

def save_gist(content):
    data = json.dumps({"files": {"inbox.json": {"content": json.dumps(content, indent=2)}}}).encode()
    req = urllib.request.Request(f"https://api.github.com/gists/{INBOX_GIST_ID}", data=data, method="PATCH")
    req.add_header("Authorization", f"Bearer {GITHUB_TOKEN}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/vnd.github.v3+json")
    with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
        r.read()

def parse_email_body(body, subject, msg_id):
    def extract(field):
        m = re.search(rf"{re.escape(field)}[:\s]+([^\n]+)", body, re.IGNORECASE)
        return m.group(1).strip() if m else ""
    sub = {
        "msg_id": msg_id, "subject": subject,
        "name": extract("name"), "email": extract("email"),
        "company": extract("company"), "domain": extract("domain"),
        "phone": extract("phone"), "instagram": extract("instagram"),
        "facebook": extract("facebook"), "tiktok": extract("tiktok"),
        "twitter": extract("twitter"), "youtube": extract("youtube"),
        "linkedin": extract("linkedin"), "googleBusiness": extract("googleBusiness"),
        "message": extract("message"), "paymentPlan": extract("paymentPlan"),
        "ownsDomain": extract("ownsDomain"), "existingDomain": extract("existingDomain"),
    }
    return sub if sub["email"] else None

try:
    content = load_gist()
    processed_ids = set(content.get(PROCESSED_KEY, []))

    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login(GMAIL_USER, GMAIL_APP_PASS)
    mail.select("inbox")
    _, data = mail.search(None, 'FROM "formspree.io" SUBJECT "New GimmeASite Inquiry"')
    ids = data[0].split()
    log(f"Found {len(ids)} Formspree email(s)")
    new_count = 0

    for eid in ids:
        _, msg_data = mail.fetch(eid, "(RFC822)")
        raw = msg_data[0][1]
        msg = email.message_from_bytes(raw)
        subject = decode_header(msg["Subject"])[0][0]
        if isinstance(subject, bytes):
            subject = subject.decode()
        msg_id = msg["Message-ID"] or str(eid)
        if msg_id in processed_ids:
            continue
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                    break
        else:
            body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")
        sub = parse_email_body(body, subject, msg_id)
        if not sub:
            continue
        first_name = sub.get("name", "").strip().split()[0].lower() if sub.get("name") else ""
        if first_name == "test":
            log(f"Skipping test submission: {sub.get('name')}")
            processed_ids.add(msg_id)
            continue
        company = sub.get("company", "unknown")
        log(f"Processing: {company} ({sub.get('email', '')})")
        html = build_html(sub)
        site_id, preview_url = netlify_deploy(html, company)
        log(f"Draft deployed: {company} -> {preview_url}")
        processed_ids.add(msg_id)
        notifications = content.get("notifications", [])
        notifications.append({
            "company": company,
            "preview_url": preview_url,
            "email": sub.get("email", ""),
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        content["notifications"] = notifications
        new_count += 1

    mail.logout()
    content[PROCESSED_KEY] = list(processed_ids)
    save_gist(content)
    log(f"Done. {new_count} new draft(s) built.")

except Exception as e:
    log(f"ERROR: {e}")
    print(traceback.format_exc(), flush=True)
    raise
