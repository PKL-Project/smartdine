export function money(cents: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "PLN",
  }).format(cents / 100);
}
