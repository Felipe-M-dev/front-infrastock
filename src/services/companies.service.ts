import {
  apiRequest,
} from './api.service';

export interface AuditUser {
  id: number;
  username: string;
  name: string;
}

export interface Company {
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

  createdById: number | null;
  updatedById: number | null;

  createdBy: AuditUser | null;
  updatedBy: AuditUser | null;

  createdAt: string;
  updatedAt: string;

  _count: {
    users: number;
    servers: number;
  };
}

export interface CreateCompanyPayload {
  name: string;
  slug: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  logoBackgroundColor?: string;

  active?: boolean;
}

export interface UpdateCompanyPayload {
  name?: string;
  slug?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  logoBackgroundColor?: string;

  active?: boolean;
}

export async function getCompanies(): Promise<
  Company[]
> {
  return apiRequest<Company[]>(
    '/companies',
    {
      fallbackMessage:
        'No fue posible obtener las empresas.',
    },
  );
}

export async function createCompany(
  payload: CreateCompanyPayload,
): Promise<Company> {
  return apiRequest<Company>(
    '/companies',
    {
      method: 'POST',
      body: payload,
      fallbackMessage:
        'No fue posible crear la empresa.',
    },
  );
}

export async function updateCompany(
  id: number,
  payload: UpdateCompanyPayload,
): Promise<Company> {
  return apiRequest<Company>(
    `/companies/${id}`,
    {
      method: 'PATCH',
      body: payload,
      fallbackMessage:
        'No fue posible modificar la empresa.',
    },
  );
}

export async function uploadCompanyLogo(
  id: number,
  file: File,
): Promise<Company> {
  const formData =
    new FormData();

  formData.append(
    'file',
    file,
  );

  return apiRequest<Company>(
    `/companies/${id}/logo`,
    {
      method: 'POST',
      body: formData,
      fallbackMessage:
        'No fue posible cargar el logo.',
    },
  );
}

export async function removeCompanyLogo(
  id: number,
): Promise<Company> {
  return apiRequest<Company>(
    `/companies/${id}/logo`,
    {
      method: 'DELETE',
      fallbackMessage:
        'No fue posible eliminar el logo.',
    },
  );
}

export interface DeleteCompanyResult {
  id: number;
  name: string;
  deleted: true;
  reassignedTo: string;
  serversReassigned: number;
  usersReassigned: number;
  credentialsReassigned: number;
}

export async function deleteCompany(
  id: number,
): Promise<DeleteCompanyResult> {
  return apiRequest<DeleteCompanyResult>(
    `/companies/${id}`,
    {
      method: 'DELETE',
      fallbackMessage:
        'No fue posible eliminar la empresa.',
    },
  );
}
