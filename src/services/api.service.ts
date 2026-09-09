import {
  expireSession,
  getToken,
} from './session.service';

const apiUrl =
  import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error(
    'VITE_API_URL no está configurada',
  );
}

export type ApiResponseType =
  | 'json'
  | 'text'
  | 'blob';

export interface ApiRequestOptions
  extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
  token?: string | null;
  handleUnauthorized?: boolean;
  fallbackMessage?: string;
  responseType?: ApiResponseType;
}

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(
    message: string,
    status: number,
    data: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function buildUrl(path: string) {
  if (
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }

  return `${apiUrl}${
    path.startsWith('/')
      ? path
      : `/${path}`
  }`;
}

function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !(value instanceof FormData) &&
    !(value instanceof Blob) &&
    !(value instanceof URLSearchParams) &&
    !(value instanceof ArrayBuffer)
  );
}

function extractMessage(
  data: unknown,
  fallback: string,
) {
  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data
  ) {
    const message = (
      data as {
        message?: unknown;
      }
    ).message;

    if (Array.isArray(message)) {
      const text = message
        .filter(
          (item): item is string =>
            typeof item === 'string',
        )
        .join(' ')
        .trim();

      if (text) {
        return text;
      }
    }

    if (
      typeof message === 'string' &&
      message.trim()
    ) {
      return message.trim();
    }
  }

  return fallback;
}

async function parseErrorBody(
  response: Response,
): Promise<unknown> {
  const contentType =
    response.headers.get(
      'content-type',
    ) ?? '';

  if (
    contentType.includes(
      'application/json',
    )
  ) {
    return response
      .json()
      .catch(() => null);
  }

  return response
    .text()
    .catch(() => null);
}

async function parseSuccessBody<T>(
  response: Response,
  responseType: ApiResponseType,
): Promise<T> {
  if (
    response.status === 204 ||
    response.status === 205
  ) {
    return undefined as T;
  }

  if (responseType === 'blob') {
    return response.blob() as Promise<T>;
  }

  if (responseType === 'text') {
    return response.text() as Promise<T>;
  }

  const contentLength =
    response.headers.get(
      'content-length',
    );

  if (contentLength === '0') {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiFetch(
  path: string,
  options: ApiRequestOptions = {},
): Promise<Response> {
  const {
    auth = true,
    token: tokenOverride,
    handleUnauthorized = true,
    fallbackMessage =
      'No fue posible completar la operación.',
    headers: providedHeaders,
    body: providedBody,
    responseType: _responseType,
    ...requestInit
  } = options;

  const headers = new Headers(
    providedHeaders,
  );

  const token =
    tokenOverride ??
    (auth ? getToken() : null);

  if (auth && !token) {
    if (handleUnauthorized) {
      expireSession();
    }

    throw new ApiError(
      'Tu sesión expiró. Inicia sesión nuevamente.',
      401,
    );
  }

  if (auth && token) {
    headers.set(
      'Authorization',
      `Bearer ${token}`,
    );
  }

  let body:
    | BodyInit
    | null
    | undefined;

  if (
    isPlainObject(
      providedBody,
    )
  ) {
    headers.set(
      'Content-Type',
      'application/json',
    );

    body = JSON.stringify(
      providedBody,
    );
  } else {
    body = providedBody as
      | BodyInit
      | null
      | undefined;
  }

  let response: Response;

  try {
    response = await fetch(
      buildUrl(path),
      {
        ...requestInit,
        headers,
        body,
      },
    );
  } catch {
    throw new ApiError(
      'No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.',
      0,
    );
  }

  if (!response.ok) {
    const data =
      await parseErrorBody(
        response,
      );

    if (
      response.status === 401 &&
      handleUnauthorized
    ) {
      expireSession();

      throw new ApiError(
        'Tu sesión expiró. Inicia sesión nuevamente.',
        401,
        data,
      );
    }

    if (response.status === 403) {
      throw new ApiError(
        extractMessage(
          data,
          'No tienes permisos para realizar esta operación.',
        ),
        403,
        data,
      );
    }

    throw new ApiError(
      extractMessage(
        data,
        fallbackMessage,
      ),
      response.status,
      data,
    );
  }

  return response;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const responseType =
    options.responseType ?? 'json';

  const response = await apiFetch(
    path,
    options,
  );

  return parseSuccessBody<T>(
    response,
    responseType,
  );
}
