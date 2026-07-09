import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("file") as File[];

    if (!files.length) {
      return NextResponse.json({ urls: [] });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const urls: string[] = [];
    for (const file of files) {
      if (!file || file.size === 0) continue;
      const ext = file.name.split(".").pop() || "bin";
      const fileName = `contact-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const arrayBuffer = await file.arrayBuffer();
      const { error } = await supabaseAdmin.storage
        .from("ticket-attachments")
        .upload(fileName, arrayBuffer, { contentType: file.type });
      if (!error) {
        const { data } = supabaseAdmin.storage.from("ticket-attachments").getPublicUrl(fileName);
        if (data?.publicUrl) urls.push(data.publicUrl);
      }
    }

    return NextResponse.json({ urls });
  } catch (err) {
    console.error("Contact attachment upload error:", err);
    return NextResponse.json({ urls: [] });
  }
}
