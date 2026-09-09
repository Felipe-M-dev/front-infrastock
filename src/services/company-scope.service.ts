import { apiRequest } from './api.service';

export interface AccessibleCompany {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  logoBackgroundColor: string;
  active: boolean;
}

export async function getAccessibleCompanies(): Promise<
  AccessibleCompany[]
> {
  return apiRequest<AccessibleCompany[]>(
    '/servers/accessible-companies',
    {
      fallbackMessage:
        'No fue posible obtener las empresas accesibles.',
    },
  );
}
