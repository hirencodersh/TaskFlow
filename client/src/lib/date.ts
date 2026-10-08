export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'Not set';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Not set';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}
