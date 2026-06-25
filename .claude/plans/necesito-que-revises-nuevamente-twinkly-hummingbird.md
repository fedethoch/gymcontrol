# Plan: corrección visual dashboard principal (PWA)

## Context

La implementación actual del dashboard (`app/page.tsx`, ruta `/`) no replica con fidelidad la referencia `docs/design-references/dashboard-principal-redesign-v1.png`. El objetivo no es rediseñar sino **corregir** dos bloques concretos para acercarlos al mockup: la card "Carga muscular" y la card "Comidas de hoy" (estado vacío). Sin tocar lógica, datos, rutas, auth ni navbar.

Todo el dashboard vive en un único archivo: `app/page.tsx`. Los dos componentes a tocar son sub-componentes del mismo archivo:
- `CargaMuscularCard` — `app/page.tsx:678-740`
- `ComidasHoyCard` — `app/page.tsx:742-859`

El gradient del hero ("Comenzar entrenamiento", `app/page.tsx:316`) es reutilizable:
`bg-[linear-gradient(135deg,#8b5cf6_0%,#6d28d9_100%)] hover:bg-[linear-gradient(135deg,#9d72ff_0%,#7c3aed_100%)] shadow-[0_6px_20px_rgba(124,58,237,0.38)]`

---

## 1. Diagnóstico de diferencias actuales vs referencia

### Card "Carga muscular"
- **Actual**: bloque barra+legend (`<div className="grid gap-0.5 mt-1.5">`, líneas 720-727) queda pegado justo debajo de los cuerpos. El espacio sobrante queda abajo, contra el botón.
- **Referencia**: el bloque barra+texto está **centrado verticalmente** en el espacio entre los cuerpos y el botón "Ver detalle muscular". Misma altura total de card.

### Card "Comidas de hoy" (estado vacío, líneas 771-812)
- **Sección derecha** (líneas 798-811): hoy el ícono (`Utensils`) está a la **izquierda** del texto, y es un cubierto genérico. Referencia: ícono a la **derecha** del texto, y debe ser un **batido/shaker** (no cubierto).
- **Sección izquierda** (líneas 774-786): ícono `UtensilsCrossed` chico (`size-6`); los dos textos ocupan varios renglones cada uno. Referencia: ícono **más grande** y cada texto en **un solo renglón**.
- **Botón CTA** "Agregar primera comida" (líneas 788-794): fondo plano `bg-[#161d2f]`. Referencia: botón con **gradient violeta** estilo hero.

---

## 2. Plan de corrección por bloque

### Bloque A — `CargaMuscularCard` (centrar barra+legend)
Reestructurar el contenedor del estado poblado (líneas 707-728) para que la barra quede centrada en el hueco entre cuerpos y botón:
- Contenedor sigue `flex flex-1 flex-col`.
- Bloque cuerpos (líneas 709-719): sin cambios de tamaño (mantiene `height: 120`).
- Quitar `mt-1.5` del bloque barra+legend y envolverlo en un wrapper `flex flex-1 items-center` (o aplicar `my-auto` al propio bloque) para que el espacio libre se reparta arriba y abajo → barra+texto centrados verticalmente entre cuerpos y botón.
- Altura total de la card intacta; el botón sigue fuera del condicional al fondo.

### Bloque B — `ComidasHoyCard` estado vacío

**B1. Sección derecha (líneas 798-811): ícono a la derecha + batido**
- Invertir orden: primero la columna de texto (Sugerencia + helper), luego el ícono → mover el `<Icon>` al final del flex (o `flex-row-reverse`).
- Reemplazar `Utensils` por un ícono de batido. lucide-react no tiene "shaker"; aproximación más cercana: **`CupSoda`** (vaso con sorbete) o `Milk`. Recomendado: `CupSoda`. Mantener color `text-[#1c2b44]` y alto (`self-stretch`).

**B2. Sección izquierda (líneas 774-786): ícono más grande + texto a un renglón**
- Agrandar `UtensilsCrossed` de `size-6` a `size-9`/`size-10`.
- Forzar cada texto a una línea: agregar `whitespace-nowrap` (y achicar el font-size si hace falta evitar overflow en mobile) a los dos `<p>` de las líneas 781-786. Validar en viewport angosto que no desborde; si desborda, reducir `text-xs`→`text-[11px]` antes que permitir wrap.

**B3. Botón CTA "Agregar primera comida" (líneas 788-794): gradient hero**
- Reemplazar `bg-[#161d2f] ... hover:bg-[#1e2840] hover:text-white` por el gradient del hero:
  `bg-[linear-gradient(135deg,#8b5cf6_0%,#6d28d9_100%)] hover:bg-[linear-gradient(135deg,#9d72ff_0%,#7c3aed_100%)] shadow-[0_6px_20px_rgba(124,58,237,0.38)]` y texto `text-white`.
- Mantener tamaño/padding actuales (`px-3 py-1.5 text-[10px]`, `rounded-lg`, ícono `Plus`).

---

## 3. Archivos/componentes a modificar

| Archivo | Componente | Líneas | Cambio |
|---|---|---|---|
| `app/page.tsx` | `CargaMuscularCard` | 707-728 | centrar bloque barra+legend en el hueco |
| `app/page.tsx` | `ComidasHoyCard` | 774-786 | agrandar ícono izq + texto a un renglón |
| `app/page.tsx` | `ComidasHoyCard` | 788-794 | gradient hero en CTA |
| `app/page.tsx` | `ComidasHoyCard` | 798-811 | ícono a la derecha + batido (`CupSoda`) |
| `app/page.tsx` | imports (top) | ~1-40 | agregar `CupSoda` a import de `lucide-react`; quitar `Utensils` si queda sin uso |

Solo se edita `app/page.tsx`. Sin cambios de lógica, props, datos, rutas ni navbar.

---

## 4. Riesgos / limitaciones

- **Icono batido**: lucide-react no incluye un shaker de proteína. Aproximación más cercana = `CupSoda` (recomendado) o `Milk`. No es 1:1 con un shaker de gym; es la mejor opción dentro de la librería ya en uso (la regla del proyecto es solo `lucide-react`).
- **Texto a un renglón en mobile**: `whitespace-nowrap` puede desbordar en viewports muy angostos. Mitigación: bajar font-size en lugar de permitir wrap; verificar con Playwright a 375px.
- Centrar la barra cambia la posición vertical pero no la altura de la card → no afecta el grid de cards vecinas (`Nutrición de hoy`).

---

## 5. Validación con Playwright (MCP)

1. Levantar app (dev server) y loguear con credenciales admin de `.env.local`.
2. Abrir el dashboard principal (`/`) en viewport mobile (~390px, contexto PWA).
3. Screenshot **antes** de cambios → guardar en scratchpad.
4. Aplicar cambios.
5. Screenshot **después** de cada bloque (Carga muscular y Comidas de hoy).
6. Comparar lado a lado contra `docs/design-references/dashboard-principal-redesign-v1.png`: verificar
   - barra de carga muscular centrada entre cuerpos y botón;
   - card comidas: ícono izq grande, textos en un renglón, ícono batido a la derecha, CTA con gradient.
7. **Ronda de corrección visual**: ajustar tamaños/spacing/icono según la comparación y volver a sacar screenshot hasta que coincida con la referencia.
8. Chequear estado poblado de ambas cards (con datos) no se rompió.
