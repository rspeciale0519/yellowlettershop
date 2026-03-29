export function formatDate(dateString: string | Date): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
