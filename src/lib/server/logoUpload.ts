import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

const LOGO_BUCKET = "partner_logos";
const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export class FileUploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function getLogoObjectKey(partnerId: number): string {
  return `partner_logos/${partnerId}/logo`;
}

export function validateLogoFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new FileUploadError("Only PNG and JPEG are allowed", 415);
  }

  const fileTooSmall = file.size <= 0;
  const fileTooLarge = file.size > MAX_FILE_SIZE_BYTES;
  if (fileTooSmall || fileTooLarge) {
    throw new FileUploadError("File too large (limit 5MB)", 413);
  }
}

export async function validateImageSignature(file: File): Promise<void> {
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
    throw new FileUploadError("Invalid image file content", 415);
  }
}

export async function uploadLogoForPartner(
  partnerId: number,
  file: File,
): Promise<{ objectKey: string; publicUrl: string }> {
  const objectKey = getLogoObjectKey(partnerId);
  const publicUrl = await uploadLogoObject(objectKey, file, true);
  return { objectKey, publicUrl };
}

export async function uploadLogoObject(
  objectKey: string,
  file: File,
  upsert: boolean,
): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.storage.from(LOGO_BUCKET).upload(objectKey, file, {
    cacheControl: "3600",
    upsert,
    contentType: file.type,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabaseAdmin.storage.from(LOGO_BUCKET).getPublicUrl(objectKey);
  return data.publicUrl;
}

export async function deleteLogoObject(objectKey: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.storage.from(LOGO_BUCKET).remove([objectKey]);
  if (error) {
    throw new Error(error.message);
  }
}
