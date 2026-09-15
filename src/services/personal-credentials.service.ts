import { apiRequest } from "./api.service";
import { getToken } from "./session.service";

export interface PersonalCredential {
  id: number;
  ownerId: number;
  name: string;
  username: string;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalCredentialPayload {
  name: string;
  username: string;
  password?: string;
  location: string;
  notes: string;
}

export interface PersonalCredentialList {
  items: PersonalCredential[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  owner: { id: number; name: string; username: string };
}

export function getPersonalCredentials(
  search: string,
  page: number,
  ownerId?: number,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    search,
    page: String(page),
    pageSize: "20",
  });
  const path =
    ownerId === undefined
      ? "/personal-credentials"
      : `/personal-credentials/users/${ownerId}`;
  return apiRequest<PersonalCredentialList>(`${path}?${params}`, {
    signal,
    cache: "no-store",
    fallbackMessage: "No fue posible consultar las credenciales personales.",
  });
}

export function savePersonalCredential(
  payload: PersonalCredentialPayload,
  id?: number,
) {
  return apiRequest<PersonalCredential>(
    id === undefined ? "/personal-credentials" : `/personal-credentials/${id}`,
    {
      method: id === undefined ? "POST" : "PATCH",
      body: payload,
      fallbackMessage: "No fue posible guardar la credencial personal.",
    },
  );
}

export function deletePersonalCredential(id: number) {
  return apiRequest<{ message: string }>(`/personal-credentials/${id}`, {
    method: "DELETE",
    fallbackMessage: "No fue posible eliminar la credencial personal.",
  });
}

export async function copyPersonalPassword(id: number, ownerId?: number) {
  const token = getToken();
  const path =
    ownerId === undefined
      ? `/personal-credentials/${id}`
      : `/personal-credentials/users/${ownerId}/${id}`;
  const result = await apiRequest<{ password: string }>(
    `${path}/copy-password`,
    {
      method: "POST",
      cache: "no-store",
      fallbackMessage: "No fue posible copiar la contraseña.",
    },
  );
  try {
    if (!token || token !== getToken())
      throw new Error("La sesión cambió. Vuelve a iniciar la consulta.");
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(result.password);
      return;
    }
    const previousFocus = document.activeElement;
    const textarea = document.createElement("textarea");
    textarea.value = result.password;
    textarea.readOnly = true;
    textarea.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
    // Keep the fallback within the current dialog's focus boundary.
    const target =
      document.querySelector("[data-personal-vault-dialog]") ?? document.body;
    target.appendChild(textarea);
    try {
      textarea.focus();
      textarea.select();
      if (!document.execCommand("copy"))
        throw new Error(
          "El navegador bloqueó la copia. Utiliza HTTPS o un navegador compatible.",
        );
    } finally {
      textarea.value = "";
      textarea.remove();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    }
  } finally {
    result.password = "";
  }
}
