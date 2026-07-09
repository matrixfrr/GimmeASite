import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from("contact_submissions").insert([{
      name: body.name || null,
      email: body.email || null,
      phone: body.phone || null,
      company: body.company || null,
      payment_plan: body.paymentPlan || null,
      owns_domain: body.ownsDomain === "yes",
      desired_domain: body.domain || null,
      existing_domain: body.existingDomain || null,
      message: body.message || null,
      instagram: body.instagram || null,
      facebook: body.facebook || null,
      twitter: body.twitter || null,
      youtube: body.youtube || null,
      tiktok: body.tiktok || null,
      linkedin: body.linkedin || null,
      google_business: body.googleBusiness || null,
      home_value_prop: body.homeKeyMessage || null,
      home_action: body.homeAction || null,
      about_story: body.aboutStory || null,
      about_differentiator: body.aboutUnique || null,
      services_products: body.servicesProducts || null,
      special_offers: body.specialOffers || null,
      contact_methods: body.contactMethods || null,
      business_hours: body.businessHours || null,
      additional_pages: body.additionalPages ? body.additionalPages.split(", ").filter(Boolean) : [],
      additional_details: body.additionalDetails || null,
      attachments: body.attachmentUrls?.length ? body.attachmentUrls : null,
    }]);

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact submit error:", err);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
