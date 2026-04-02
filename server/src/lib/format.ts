export function toNumber(value: string | number | null | undefined) {
  if (value == null) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
