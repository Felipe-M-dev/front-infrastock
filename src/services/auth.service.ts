import {
  apiRequest,
} from './api.service';

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
}

export interface User {
  id: number;
  username: string;
  name: string;
  email: string | null;

  role:
    | 'ADMIN'
    | 'EDITOR'
    | 'VIEWER';

  company: Company;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface AuthMeResponse {
  sub: number;
  username: string;
  role:
    | 'ADMIN'
    | 'EDITOR'
    | 'VIEWER';

  companyId: number;

  iat: number;
  exp: number;
}

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>(
    '/auth/login',
    {
      method: 'POST',
      auth: false,
      handleUnauthorized: false,
      fallbackMessage:
        'No fue posible iniciar sesión.',
      body: {
        username,
        password,
      },
    },
  ).catch((error) => {
    if (
      error instanceof Error &&
      'status' in error &&
      error.status === 401
    ) {
      throw new Error(
        'Usuario o contraseña incorrectos.',
      );
    }

    throw error;
  });
}

export async function validateSession(
  token: string,
): Promise<AuthMeResponse> {
  return apiRequest<AuthMeResponse>(
    '/auth/me',
    {
      method: 'GET',
      token,
      fallbackMessage:
        'Sesión inválida o expirada.',
    },
  );
}
