export function formatDateTime(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'es-CL',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    },
  ).format(
    new Date(value),
  );
}