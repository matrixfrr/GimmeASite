import { NextResponse } from "next/server";
import Stripe from "stripe";

// Lazy initialization to avoid build-time errors
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function POST(request: Request) {
  const stripe = getStripe();

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    // Find the customer by email in Stripe
    const customers = await stripe.customers.list({
      email: email.toLowerCase(),
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json(
        {
          error: "not_found",
          message: "We couldn't find an account with this email address. Please make sure you're using the same email you used during checkout.",
        },
        { status: 404 }
      );
    }

    const customer = customers.data[0];

    // Get the origin for redirect URLs
    const origin = request.headers.get("origin") || "https://gimmeasite.com";

    // Create a billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: origin,
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
