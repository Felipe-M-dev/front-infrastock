import type {
  Company,
} from './auth.service';

interface ThemeColors {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  logoBackgroundColor: string;
}

const DEFAULT_THEME: ThemeColors = {
  primaryColor: '#2563EB',
  secondaryColor: '#0F172A',
  backgroundColor: '#F1F5F9',
  surfaceColor: '#FFFFFF',
  textColor: '#0F172A',
  logoBackgroundColor: '#FFFFFF',
};

export function applyCompanyTheme(
  company?: Company | null,
) {
  const theme:
    ThemeColors =
    company ?? DEFAULT_THEME;

  const root =
    document.documentElement;

  root.style.setProperty(
    '--color-primary',
    theme.primaryColor,
  );

  root.style.setProperty(
    '--color-secondary',
    theme.secondaryColor,
  );

  root.style.setProperty(
    '--color-background',
    theme.backgroundColor,
  );

  root.style.setProperty(
    '--color-surface',
    theme.surfaceColor,
  );

  root.style.setProperty(
    '--color-text',
    theme.textColor,
  );

  root.style.setProperty(
    '--color-logo-background',
    theme.logoBackgroundColor,
  );
}

export function resetCompanyTheme() {
  applyCompanyTheme(null);
}
