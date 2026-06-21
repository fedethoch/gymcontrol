export function exerciseImageSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function exerciseImageUrl(name: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const slug = exerciseImageSlug(name);
  return `${base}/storage/v1/object/public/exercise-images/${slug}.png`;
}
