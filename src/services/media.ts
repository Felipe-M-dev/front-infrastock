const rawApiUrl =
  import.meta.env.VITE_API_URL as
    | string
    | undefined;

const apiUrl =
  rawApiUrl?.replace(/\/$/, '') ?? '';

export const DEFAULT_COMPANY_LOGO_URL =
  (
    import.meta.env
      .VITE_DEFAULT_COMPANY_LOGO_URL as
      | string
      | undefined
  )?.trim() ||
  '/branding/default/logo.svg';

export function mediaUrl(
  value?: string | null,
) {
  if (!value) {
    return null;
  }

  if (
    value.startsWith(
      '/uploads/',
    )
  ) {
    return `${apiUrl}${value}`;
  }

  return value;
}

export function companyLogoUrl(
  value?: string | null,
) {
  return (
    mediaUrl(value) ??
    DEFAULT_COMPANY_LOGO_URL
  );
}
