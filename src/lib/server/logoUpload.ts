import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { randomUUID } from "crypto";

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

/** Generate a unique object key for a new logo upload. */
export function generateLogoObjectKey(file: File): string {
  const ext = file.type === "image/png" ? "png" : "jpg";
  return `${randomUUID()}.${ext}`;
}

/**
 * Extract the storage object key from a public URL previously returned by
 * uploadLogoObject. Returns null if the URL doesn't match the expected pattern.
 */
export function getObjectKeyFromUrl(url: string): string | null {
  try {
    const { pathname } = new URL(url);
    // Supabase public URLs end with /storage/v1/object/public/<bucket>/<key>
    const marker = `/object/public/${LOGO_BUCKET}/`;
    const idx = pathname.indexOf(marker);
    if (idx === -1) return null;
    return pathname.slice(idx + marker.length).split("?")[0];
  } catch {
    return null;
  }
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

/**
 * Upload a logo file and return its public URL.
 * Pass a key from generateLogoObjectKey() — each upload gets a unique key,
 * so upsert is always false (no collision possible).
 */
export async function uploadLogoObject(objectKey: string, file: File): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin();

  const bucketExists = await checkLogoBucketExists();
  if (!bucketExists) {
    await createLogoBucket();
  }

  const { error } = await supabaseAdmin.storage.from(LOGO_BUCKET).upload(objectKey, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabaseAdmin.storage.from(LOGO_BUCKET).getPublicUrl(objectKey);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function deleteLogoObject(objectKey: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.storage.from(LOGO_BUCKET).remove([objectKey]);
  if (error) {
    throw new Error(error.message);
  }
}

async function createLogoBucket() {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.storage.createBucket(LOGO_BUCKET, { public: true });
  if (error) {
    throw new Error(error.message);
  }
}

async function checkLogoBucketExists(): Promise<boolean> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
  return !error && (buckets?.some((b) => b.name === LOGO_BUCKET) ?? false);
}
