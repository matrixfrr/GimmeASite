import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";


// Lazy initialization to avoid build-time errors
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  console.log("=== Stripe Key Check ===");
  console.log("Key exists:", !!secretKey);
  console.log("Key prefix:", secretKey ? secretKey.substring(0, 12) + "..." : "N/A");

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  // Check for placeholder value
  if (secretKey.includes("YOUR_SECRET_KEY_HERE") || secretKey === "sk_live_" || secretKey === "sk_test_") {
    throw new Error("STRIPE_SECRET_KEY is set to a placeholder value. Please configure your actual Stripe secret key.");
  }
  return new Stripe(secretKey);
}

// Validate that the URL is a valid Stripe Checkout URL
function isValidCheckoutUrl(url: string | null): boolean {
  if (!url || typeof url !== "string") return false;

  // Trim whitespace
  const cleanUrl = url.trim();

  // Valid checkout URLs can be:
  // 1. Default Stripe checkout: checkout.stripe.com
  // 2. Custom domain: account.gimmeasite.com (configured in Stripe Dashboard)
  const isStripeCheckout = cleanUrl.includes("checkout.stripe.com");
  const isCustomCheckoutDomain = cleanUrl.includes("account.gimmeasite.com/c/pay/");

  if (!isStripeCheckout && !isCustomCheckoutDomain) return false;

  // Must NOT be a billing portal URL (customer portal, not checkout)
  // The portal URL pattern is different: /p/ for portal vs /c/pay/ for checkout
  if (cleanUrl.includes("billing.stripe.com/p/")) return false;
  if (cleanUrl.includes("billingportal")) return false;

  // Also reject if it's a portal path on custom domain
  if (cleanUrl.includes("account.gimmeasite.com/p/")) return false;

  return true;
}

// Convert custom domain checkout URL to default Stripe checkout URL
// This is needed because the custom domain may not be properly configured
function convertToDefaultStripeUrl(url: string): string {
  // If using custom domain, convert to default Stripe checkout URL
  // account.gimmeasite.com/c/pay/SESSION_ID -> checkout.stripe.com/c/pay/SESSION_ID
  if (url.includes("account.gimmeasite.com")) {
    return url.replace("account.gimmeasite.com", "checkout.stripe.com");
  }
  return url;
}

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const { priceType, customerEmail, customerName } = await request.json();

    console.log("=== Checkout API called ===");
    console.log("Email:", customerEmail);
    console.log("Plan type:", priceType);

    if (!customerEmail) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    // Look up the quote for this email
    const { data: quote, error: quoteError } = await supabase
      .from("client_quotes")
      .select("*")
      .eq("email", customerEmail.toLowerCase())
      .eq("paid", false)
      .eq("plan_type", priceType)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (quoteError && quoteError.code !== "PGRST116") {
      console.error("Database error:", quoteError);
      return NextResponse.json(
        { error: "Database error. Please try again." },
        { status: 500 }
      );
    }

    // If no quote found for this email, return error
    if (!quote) {
      console.log("No quote found for email:", customerEmail, "plan:", priceType);
      return NextResponse.json(
        { error: "EMAIL_NOT_RECOGNIZED" },
        { status: 404 }
      );
    }

    console.log("Quote found:", {
      id: quote.id,
      name: quote.name,
      priceCents: quote.price_cents,
      planType: quote.plan_type,
    });

    // Get the origin for redirect URLs
    const origin = request.headers.get("origin") || "https://gimmeasite.com";

    let session: Stripe.Checkout.Session;

    // Common session parameters
    const commonParams = {
      payment_method_types: ["card", "link"] as ("card" | "link")[],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      customer_email: customerEmail,
      allow_promotion_codes: true,
    };

    // Detect upfront+monthly quotes stored as "one-time" (notes has [monthly_cents:N] prefix)
    const isUpfrontMonthly = priceType === "one-time" && /\[monthly_cents:\d+\]/.test(quote.notes || "");

    if (priceType === "one-time" && !isUpfrontMonthly) {
      console.log("Creating ONE-TIME checkout session...");
      session = await stripe.checkout.sessions.create({
        ...commonParams,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "GimmeASite Upfront Fee",
                description: `Upfront fee for ${quote.name}.`,
              },
              unit_amount: quote.price_cents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        metadata: {
          plan: "one-time",
          customerName: customerName || quote.name,
          quoteId: quote.id,
        },
        payment_intent_data: {
          metadata: {
            plan: "one-time",
            customerName: customerName || quote.name,
            quoteId: quote.id,
          },
        },
      });
    } else if (priceType === "monthly") {
      console.log("Creating MONTHLY (subscription) checkout session...");
      session = await stripe.checkout.sessions.create({
        ...commonParams,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "GimmeASite Monthly Plan",
                description: `Recurring monthly fee for ${quote.name}.`,
              },
              unit_amount: quote.price_cents,
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        metadata: {
          plan: "monthly",
          customerName: customerName || quote.name,
          quoteId: quote.id,
        },
        subscription_data: {
          metadata: {
            plan: "monthly",
            customerName: customerName || quote.name,
            quoteId: quote.id,
          },
        },
      });
    } else if (isUpfrontMonthly || priceType === "upfront-monthly") {
      console.log("Creating UPFRONT + MONTHLY checkout session...");
      const monthlyMatch = quote.notes?.match(/\[monthly_cents:(\d+)\]/);
      const monthlyCents = monthlyMatch ? parseInt(monthlyMatch[1]) : null;

      if (!monthlyCents) {
        return NextResponse.json(
          { error: "Quote is missing monthly pricing data. Please contact support." },
          { status: 400 }
        );
      }

      const cleanDescription = (quote.notes || "").replace(/\[monthly_cents:\d+\]\s*/g, "").trim();

      // Use payment mode with two line items (setup fee + first month).
      // The recurring monthly subscription is created manually in Stripe after payment.
      session = await stripe.checkout.sessions.create({
        ...commonParams,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "GimmeASite Upfront Fee",
                description: `Upfront fee for ${quote.name}.`,
              },
              unit_amount: quote.price_cents,
            },
            quantity: 1,
          },
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "GimmeASite Monthly Fee",
                description: `Recurring monthly fee for ${quote.name}.`,
              },
              unit_amount: monthlyCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        metadata: {
          plan: "upfront-monthly",
          customerName: customerName || quote.name,
          quoteId: quote.id,
        },
        payment_intent_data: {
          metadata: {
            plan: "upfront-monthly",
            customerName: customerName || quote.name,
            quoteId: quote.id,
          },
        },
      });
    } else {
      return NextResponse.json(
        { error: "Invalid price type" },
        { status: 400 }
      );
    }

    console.log("Stripe session created:", {
      sessionId: session.id,
      mode: session.mode,
      status: session.status,
      url: session.url,
    });

    // Ensure we have a valid checkout URL
    if (!session.url) {
      console.error("ERROR: Stripe session created but no URL returned:", session.id);
      return NextResponse.json(
        { error: "Checkout session created but no redirect URL was provided. Please try again." },
        { status: 500 }
      );
    }

    // CRITICAL: Validate that this is a checkout URL, not a billing portal URL
    const checkoutUrl = session.url.trim();
    console.log("=== URL Validation ===");
    console.log("Raw URL:", session.url);
    console.log("Trimmed URL:", checkoutUrl);
    console.log("Contains checkout.stripe.com:", checkoutUrl.includes("checkout.stripe.com"));

    if (!isValidCheckoutUrl(checkoutUrl)) {
      console.error("ERROR: Invalid checkout URL received from Stripe:", checkoutUrl);
      console.error("Session ID:", session.id);
      console.error("Full session object:", JSON.stringify({
        id: session.id,
        mode: session.mode,
        status: session.status,
        url: session.url,
        payment_status: session.payment_status,
      }, null, 2));
      return NextResponse.json(
        {
          error: `Invalid checkout URL received. URL starts with: ${checkoutUrl.substring(0, 50)}...`,
          debug: checkoutUrl.substring(0, 100)
        },
        { status: 500 }
      );
    }

    // Convert custom domain to default Stripe URL to avoid DNS/SSL issues
    const finalCheckoutUrl = convertToDefaultStripeUrl(checkoutUrl);

    console.log("=== Checkout session created successfully ===");
    console.log("Session ID:", session.id);
    console.log("Original URL:", checkoutUrl.substring(0, 80));
    console.log("Final URL:", finalCheckoutUrl.substring(0, 80));
    console.log("Email:", customerEmail);
    console.log("Plan:", priceType);
    console.log("Amount:", quote.price_cents, "cents");

    return NextResponse.json({
      sessionId: session.id,
      url: finalCheckoutUrl,
      quotedPrice: quote.price_cents,
      clientName: quote.name,
    });
  } catch (error) {
    console.error("=== Stripe checkout error ===");
    console.error(error);

    // Check for configuration errors
    if (error instanceof Error) {
      if (error.message.includes("STRIPE_SECRET_KEY")) {
        return NextResponse.json(
          { error: "Payment system is not configured. Please contact support at hello@gimmeasite.com." },
          { status: 500 }
        );
      }
    }

    // Check for specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      // Handle authentication errors specifically
      if (error.type === "StripeAuthenticationError") {
        console.error("Stripe authentication failed - check API key");
        return NextResponse.json(
          { error: "Payment system configuration error. Please contact support at hello@gimmeasite.com." },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: `Payment error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create checkout session. Please try again or contact support." },
      { status: 500 }
    );
  }
}
