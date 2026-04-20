import { supabase } from "@/lib/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imgFile = formData.get("file") as File;
    if (!imgFile) {
      return NextResponse.json({ error: "No file found in the request" }, { status: 400 });
    }

    // Use supabase client from lib/client.ts
    const fileExt = imgFile.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    // Upset logo in database
    const { error: uploadError } = await supabase.storage
      .from("partner_logos")
      .upload(fileName, imgFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error: ", uploadError.message);
      return NextResponse.json({ error: "File upload failed " }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("partner_logos").getPublicUrl(fileName);

    return NextResponse.json(
      {
        message: "File uploaded successfully",
        url: urlData.publicUrl,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "File upload failed " }, { status: 500 });
  }
  // void request;
  // return new Response("Hello, world!", { status: 200 });
}
