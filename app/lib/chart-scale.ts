// Sin imports a propósito: se testea con `node --test`.

/** Escala del gráfico con ticks redondos (paso 1·2·2.5·5 × 10ⁿ) que cubren los valores. */
export function chartScale(values: number[], targetTicks = 4): { min: number; max: number; ticks: number[] } {
  const low = Math.min(...values);
  const high = Math.max(...values);
  const step = niceStep((high - low) / targetTicks || Math.max(Math.abs(high) * 0.05, 1));
  const min = Math.floor(low / step) * step;
  const max = Math.max(Math.ceil(high / step) * step, min + step);
  const ticks: number[] = [];

  for (let tick = min; tick <= max + step / 2; tick += step) {
    ticks.push(Math.round(tick * 100) / 100);
  }

  return { min, max, ticks };
}

function niceStep(raw: number) {
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const factor = [1, 2, 2.5, 5, 10].find((candidate) => candidate >= normalized) ?? 10;

  return factor * magnitude;
}
