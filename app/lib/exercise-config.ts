export const EXERCISE_IMAGE_BUCKET = "exercise-images";

export const EXERCISE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const EXERCISE_IMAGE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const EXERCISE_IMAGE_ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
] as const;

export const EXERCISE_IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp";
