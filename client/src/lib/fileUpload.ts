export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;

export const IMAGE_SIZE_LABEL = "5MB";
export const VIDEO_SIZE_LABEL = "50MB";
export const DOCUMENT_SIZE_LABEL = "5MB";

export function validateFileSize(file: File, maxSizeBytes: number, label: string): string | null {
  return file.size > maxSizeBytes ? `File must be ${label} or smaller.` : null;
}
