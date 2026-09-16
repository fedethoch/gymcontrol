// Resuelve los imports `@/...` de la app cuando los tests corren con `node --test`.
const root = new URL("../../", import.meta.url);

export async function resolve(specifier, context, next) {
  if (!specifier.startsWith("@/")) {
    return next(specifier, context);
  }

  const path = specifier.slice(2);
  const target = new URL(/\.[a-z]+$/.test(path) ? path : `${path}.ts`, root);

  return next(target.href, context);
}
