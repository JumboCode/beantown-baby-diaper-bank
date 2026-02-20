import { supabase } from "@/lib/client";
import { NextResponse } from "next/server";

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

class UploadValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}


export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = validateFileUpload(formData);
    await validateImageSignature(file);
    const fileUrl = await uploadFile(file);
    
    return NextResponse.json(
      {
        message: "File uploaded successfully",
        url: fileUrl,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: error.status,
        },
      );
    }
    return NextResponse.json({ error: "File upload failed " }, { status: 500 });
  }
}

function validateFileUpload(formData: FormData): File {
  const raw = formData.get("file");
  if (!(raw instanceof File)) {
    throw new UploadValidationError("Missing file upload", 400);
  }
  if (!ALLOWED_MIME_TYPES.has(raw.type)) {
    throw new UploadValidationError("Only PNG and JPEG are allowed", 415);
  }

  const fileTooSmall = raw.size <= 0;
  const fileTooLarge = raw.size > MAX_FILE_SIZE_BYTES;

  if (fileTooSmall || fileTooLarge) {
    throw new UploadValidationError("File too large (limit 5MB)", 413);
  }

  return raw;
}

async function validateImageSignature(file: File): Promise<void> {
  const headerBytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  const isPng =
    headerBytes.length >= 8 &&
    headerBytes[0] === 0x89 &&
    headerBytes[1] === 0x50 &&
    headerBytes[2] === 0x4e &&
    headerBytes[3] === 0x47 &&
    headerBytes[4] === 0x0d &&
    headerBytes[5] === 0x0a &&
    headerBytes[6] === 0x1a &&
    headerBytes[7] === 0x0a;

  const isJpeg =
    headerBytes.length >= 3 &&
    headerBytes[0] === 0xff &&
    headerBytes[1] === 0xd8 &&
    headerBytes[2] === 0xff;

  if (!isPng && !isJpeg) {
    throw new UploadValidationError("Invalid image file content", 415);
  }
}

async function uploadFile(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("partner_logos")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: urlData } = supabase.storage
    .from("partner_logos")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}
