import { apiRequest } from './api.service';

export type CredentialCategory =
  | 'OPERATING_SYSTEM'
  | 'DATABASE'
  | 'MIDDLEWARE'
  | 'APPLICATION'
  | 'TRANSFER'
  | 'SERVICE'
  | 'OTHER';

export type CredentialAccountType =
  | 'ADMINISTRATOR'
  | 'OPERATION'
  | 'SERVICE'
  | 'APPLICATION'
  | 'READ_ONLY'
  | 'DATABASE'
  | 'INTEGRATION'
  | 'OTHER';

export type CredentialScope =
  | 'GLOBAL'
  | 'COMPANY'
  | 'SERVER'
  | 'SOFTWARE';

export type CredentialLifecycleStatus =
  | 'VALID'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'ROTATION_REQUIRED'
  | 'WITHOUT_POLICY';

export interface CredentialCompany {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface Credential {
  id: number;
  name: string;
  username: string;
  category: CredentialCategory;
  accountType: CredentialAccountType;
  environment: string | null;
  scope: CredentialScope;
  description: string | null;
  active: boolean;

  expiresAt: string | null;
  lastRotatedAt: string | null;
  rotationDays: number | null;
  rotationRequired: boolean;
  lifecycleStatus: CredentialLifecycleStatus;
  nextRotationAt: string | null;
  daysUntilExpiry: number | null;

  companyId: number | null;
  company: CredentialCompany | null;
  createdById: number | null;
  updatedById: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CredentialFilters {
  search?: string;
  companyId?: number | '';
  environment?: string;
  category?: CredentialCategory | '';
  accountType?: CredentialAccountType | '';
  scope?: CredentialScope | '';
  active?: boolean | '';
  lifecycleStatus?: CredentialLifecycleStatus | '';
}

export interface CreateCredentialPayload {
  name: string;
  username: string;
  password: string;
  category: CredentialCategory;
  accountType: CredentialAccountType;
  environment?: string;
  scope: CredentialScope;
  description?: string;
  companyId?: number;
  active?: boolean;
  expiresAt?: string | null;
  lastRotatedAt?: string | null;
  rotationDays?: number | null;
  rotationRequired?: boolean;
}

export interface UpdateCredentialPayload {
  name?: string;
  username?: string;
  password?: string;
  category?: CredentialCategory;
  accountType?: CredentialAccountType;
  environment?: string;
  scope?: CredentialScope;
  description?: string;
  companyId?: number;
  active?: boolean;
  expiresAt?: string | null;
  lastRotatedAt?: string | null;
  rotationDays?: number | null;
  rotationRequired?: boolean;
}

interface CopyPasswordResponse {
  password: string;
}

export interface CredentialAssignment {
  id: number;
  purpose: string | null;
  createdAt: string;
  credential: Credential;
}

export interface AssignCredentialPayload {
  credentialId: number;
  purpose?: string;
}

export interface CredentialUsageServerAssignment {
  id: number;
  purpose: string | null;
  createdAt: string;
  server: {
    id: number;
    hostname: string;
    ipAddress: string | null;
    environment: string | null;
    active: boolean;
    companyId: number | null;
    company: {
      id: number;
      name: string;
      slug: string;
    } | null;
  };
}

export interface CredentialUsageSoftwareAssignment {
  id: number;
  purpose: string | null;
  createdAt: string;
  serverSoftware: {
    id: number;
    version: string;
    server: {
      id: number;
      hostname: string;
      ipAddress: string | null;
      environment: string | null;
      active: boolean;
      companyId: number | null;
      company: {
        id: number;
        name: string;
        slug: string;
      } | null;
    };
    software: {
      id: number;
      name: string;
      category: string;
      active: boolean;
    };
  };
}

export interface CredentialUsage {
  credential: Credential;
  summary: {
    serverAssignments: number;
    softwareAssignments: number;
    totalAssignments: number;
  };
  serverAssignments: CredentialUsageServerAssignment[];
  softwareAssignments: CredentialUsageSoftwareAssignment[];
}

function buildCredentialParams(
  filters: CredentialFilters,
) {
  const params =
    new URLSearchParams();

  const search =
    filters.search?.trim();

  if (search) {
    params.set('search', search);
  }

  if (
    filters.companyId !== undefined &&
    filters.companyId !== ''
  ) {
    params.set(
      'companyId',
      String(filters.companyId),
    );
  }

  const environment =
    filters.environment?.trim();

  if (environment) {
    params.set(
      'environment',
      environment,
    );
  }

  if (filters.category) {
    params.set(
      'category',
      filters.category,
    );
  }

  if (filters.accountType) {
    params.set(
      'accountType',
      filters.accountType,
    );
  }

  if (filters.scope) {
    params.set(
      'scope',
      filters.scope,
    );
  }

  if (
    filters.active !== undefined &&
    filters.active !== ''
  ) {
    params.set(
      'active',
      String(filters.active),
    );
  }

  if (filters.lifecycleStatus) {
    params.set(
      'lifecycleStatus',
      filters.lifecycleStatus,
    );
  }

  return params;
}

export async function getCredentials(
  filters: CredentialFilters = {},
): Promise<Credential[]> {
  const params = buildCredentialParams(filters);
  const query = params.toString();

  return apiRequest<Credential[]>(
    `/credentials${query ? `?${query}` : ''}`,
    {
      fallbackMessage:
        'No fue posible obtener las credenciales.',
    },
  );
}

export async function getCredential(
  id: number,
): Promise<Credential> {
  return apiRequest<Credential>(
    `/credentials/${id}`,
    {
      fallbackMessage:
        'No fue posible obtener la credencial.',
    },
  );
}

export async function getCredentialUsage(
  id: number,
): Promise<CredentialUsage> {
  return apiRequest<CredentialUsage>(
    `/credentials/${id}/usage`,
    {
      fallbackMessage:
        'No fue posible obtener el mapa de uso de la credencial.',
    },
  );
}

export async function createCredential(
  payload: CreateCredentialPayload,
): Promise<Credential> {
  return apiRequest<Credential>(
    '/credentials',
    {
      method: 'POST',
      body: payload,
      fallbackMessage:
        'No fue posible crear la credencial.',
    },
  );
}

export async function updateCredential(
  id: number,
  payload: UpdateCredentialPayload,
): Promise<Credential> {
  return apiRequest<Credential>(
    `/credentials/${id}`,
    {
      method: 'PATCH',
      body: payload,
      fallbackMessage:
        'No fue posible modificar la credencial.',
    },
  );
}

export async function deactivateCredential(
  id: number,
): Promise<Credential> {
  return apiRequest<Credential>(
    `/credentials/${id}/deactivate`,
    {
      method: 'PATCH',
      fallbackMessage:
        'No fue posible desactivar la credencial.',
    },
  );
}

export async function copyCredentialPassword(
  id: number,
): Promise<void> {
  const result = await apiRequest<CopyPasswordResponse>(
    `/credentials/${id}/copy-password`,
    {
      method: 'POST',
      cache: 'no-store',
      fallbackMessage:
        'No fue posible copiar la contraseña.',
    },
  );

  await navigator.clipboard.writeText(
    result.password,
  );
}

export async function getServerCredentialAssignments(
  serverId: number,
): Promise<CredentialAssignment[]> {
  return apiRequest<CredentialAssignment[]>(
    `/credentials/assignments/server/${serverId}`,
    {
      fallbackMessage:
        'No fue posible obtener las credenciales del servidor.',
    },
  );
}

export async function assignCredentialToServer(
  serverId: number,
  payload: AssignCredentialPayload,
): Promise<CredentialAssignment> {
  return apiRequest<CredentialAssignment>(
    `/credentials/assignments/server/${serverId}`,
    {
      method: 'POST',
      body: payload,
      fallbackMessage:
        'No fue posible asignar la credencial al servidor.',
    },
  );
}

export async function unassignCredentialFromServer(
  serverId: number,
  credentialId: number,
): Promise<void> {
  await apiRequest<void>(
    `/credentials/assignments/server/${serverId}/${credentialId}`,
    {
      method: 'DELETE',
      fallbackMessage:
        'No fue posible desvincular la credencial del servidor.',
    },
  );
}

export async function getServerSoftwareCredentialAssignments(
  serverSoftwareId: number,
): Promise<CredentialAssignment[]> {
  return apiRequest<CredentialAssignment[]>(
    `/credentials/assignments/server-software/${serverSoftwareId}`,
    {
      fallbackMessage:
        'No fue posible obtener las credenciales del software.',
    },
  );
}

export async function assignCredentialToServerSoftware(
  serverSoftwareId: number,
  payload: AssignCredentialPayload,
): Promise<CredentialAssignment> {
  return apiRequest<CredentialAssignment>(
    `/credentials/assignments/server-software/${serverSoftwareId}`,
    {
      method: 'POST',
      body: payload,
      fallbackMessage:
        'No fue posible asignar la credencial al software.',
    },
  );
}

export async function unassignCredentialFromServerSoftware(
  serverSoftwareId: number,
  credentialId: number,
): Promise<void> {
  await apiRequest<void>(
    `/credentials/assignments/server-software/${serverSoftwareId}/${credentialId}`,
    {
      method: 'DELETE',
      fallbackMessage:
        'No fue posible desvincular la credencial del software.',
    },
  );
}
