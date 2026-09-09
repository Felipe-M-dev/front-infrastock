import {
  apiRequest,
} from './api.service';

export type UserRole =
  | 'ADMIN'
  | 'EDITOR'
  | 'VIEWER';

export interface CompanyRef {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface AppUser {
  id: number;
  username: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  role: UserRole;
  active: boolean;
  companyId: number | null;
  company: CompanyRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  name: string;
  email?: string;
  role: UserRole;
  companyId: number;
  active?: boolean;
}

export interface UpdateUserPayload {
  username?: string;
  password?: string;
  name?: string;
  email?: string;
  role?: UserRole;
  companyId?: number;
  active?: boolean;
}

export async function getUsers(): Promise<AppUser[]> {
  return apiRequest<AppUser[]>(
    '/users',
    {
      fallbackMessage:
        'No fue posible obtener los usuarios.',
    },
  );
}

export async function createUser(
  payload: CreateUserPayload,
): Promise<AppUser> {
  return apiRequest<AppUser>(
    '/users',
    {
      method: 'POST',
      body: payload,
      fallbackMessage:
        'No fue posible crear el usuario.',
    },
  );
}

export async function updateUser(
  id: number,
  payload: UpdateUserPayload,
): Promise<AppUser> {
  return apiRequest<AppUser>(
    `/users/${id}`,
    {
      method: 'PATCH',
      body: payload,
      fallbackMessage:
        'No fue posible modificar el usuario.',
    },
  );
}

export async function uploadUserAvatar(
  id: number,
  file: File,
): Promise<AppUser> {
  const formData =
    new FormData();

  formData.append(
    'file',
    file,
  );

  return apiRequest<AppUser>(
    `/users/${id}/avatar`,
    {
      method: 'POST',
      body: formData,
      fallbackMessage:
        'No fue posible actualizar la foto del usuario.',
    },
  );
}

export async function removeUserAvatar(
  id: number,
): Promise<AppUser> {
  return apiRequest<AppUser>(
    `/users/${id}/avatar`,
    {
      method: 'DELETE',
      fallbackMessage:
        'No fue posible eliminar la foto del usuario.',
    },
  );
}
