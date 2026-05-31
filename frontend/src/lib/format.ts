export function formatPrice(amount: number, currency = "USD"): string {
  const symbol = currency === "USD" ? "$" : currency + " ";
  return `${symbol}${amount.toFixed(2)}`;
}

export function classFor(status: string): string {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    case "shipped":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    case "processing":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}
