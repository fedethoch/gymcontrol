import type { KeyboardEvent } from "react";

const FIELDS =
  'input:not([type="hidden"]):not(:disabled):not([readonly]), textarea:not(:disabled):not([readonly])';

/**
 * `onKeyDown` de un formulario (DESIGN.md §4): Enter en un input pasa al campo siguiente en vez de enviar
 * el formulario a medias (el "Ir" del teclado del celular). En el último campo, Enter envía; en un
 * textarea sigue siendo un salto de línea.
 */
export function focusNextFieldOnEnter(event: KeyboardEvent<HTMLFormElement>) {
  const field = event.target;
  if (event.key !== "Enter" || event.nativeEvent.defaultPrevented || event.nativeEvent.isComposing) return;
  if (!(field instanceof HTMLInputElement)) return;

  const fields = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(FIELDS));
  const index = fields.indexOf(field);
  const next = index === -1 ? undefined : fields[index + 1];
  if (!next) return;

  event.preventDefault();
  next.focus();
}
