import {
  apiRequest,
} from './api.service';

export type ProfileRole =
  | 'ADMIN'
  | 'EDITOR'
  | 'VIEWER';

export interface ProfileCompany {
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
}

export interface ProfileUser {
  id: number;
  username: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  role: ProfileRole;
  company: ProfileCompany;
}

export interface UpdateMyProfilePayload {
  name: string;
  email?: string;
  currentPassword?: string;
  password?: string;
}

export async function getMyProfile(): Promise<ProfileUser> {
  return apiRequest<ProfileUser>(
    '/auth/profile',
    {
      fallbackMessage:
        'No fue posible obtener tu usuario.',
    },
  );
}

export async function updateMyProfile(
  payload:
    UpdateMyProfilePayload,
): Promise<ProfileUser> {
  return apiRequest<ProfileUser>(
    '/auth/profile',
    {
      method: 'PATCH',
      body: payload,
      fallbackMessage:
        'No fue posible actualizar tu usuario.',
    },
  );
}

export async function uploadMyAvatar(
  file: File,
): Promise<ProfileUser> {
  const formData =
    new FormData();

  formData.append(
    'file',
    file,
  );

  return apiRequest<ProfileUser>(
    '/auth/profile/avatar',
    {
      method: 'POST',
      body: formData,
      fallbackMessage:
        'No fue posible actualizar la foto de perfil.',
    },
  );
}

export async function removeMyAvatar(): Promise<ProfileUser> {
  return apiRequest<ProfileUser>(
    '/auth/profile/avatar',
    {
      method: 'DELETE',
      fallbackMessage:
        'No fue posible eliminar la foto de perfil.',
    },
  );
}
