import type {
  Company,
  User,
} from './auth.service';

import {
  applyCompanyTheme,
  resetCompanyTheme,
} from './theme.service';

const TOKEN_KEY =
  'accessToken';

const USER_KEY =
  'user';

const SESSION_MESSAGE_KEY =
  'infrastock-session-message';

const DEFAULT_EXPIRED_MESSAGE =
  'Tu sesión expiró. Inicia sesión nuevamente.';

export const SESSION_UPDATED_EVENT =
  'infrastock-session-updated';

export const SESSION_EXPIRED_EVENT =
  'infrastock-session-expired';

function notifySessionUpdated() {
  window.dispatchEvent(
    new CustomEvent(
      SESSION_UPDATED_EVENT,
    ),
  );
}

function clearSessionData() {
  sessionStorage.removeItem(
    TOKEN_KEY,
  );

  sessionStorage.removeItem(
    USER_KEY,
  );

  resetCompanyTheme();

  notifySessionUpdated();
}

export function saveSession(
  accessToken: string,
  user: User,
) {
  sessionStorage.setItem(
    TOKEN_KEY,
    accessToken,
  );

  sessionStorage.setItem(
    USER_KEY,
    JSON.stringify(user),
  );

  sessionStorage.removeItem(
    SESSION_MESSAGE_KEY,
  );

  applyCompanyTheme(
    user.company,
  );

  notifySessionUpdated();
}

export function getToken() {
  return sessionStorage.getItem(
    TOKEN_KEY,
  );
}

export function getUser():
  User | null {
  const value =
    sessionStorage.getItem(
      USER_KEY,
    );

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(
      value,
    ) as User;
  } catch {
    return null;
  }
}

export function updateSessionUser(
  user: User,
) {
  const currentUser =
    getUser();

  if (!currentUser) {
    return;
  }

  sessionStorage.setItem(
    USER_KEY,
    JSON.stringify(user),
  );

  applyCompanyTheme(
    user.company,
  );

  notifySessionUpdated();
}

export function updateSessionCompany(
  company: Company,
) {
  const currentUser =
    getUser();

  if (!currentUser) {
    return;
  }

  if (
    currentUser.company?.id !==
    company.id
  ) {
    return;
  }

  const updatedUser: User = {
    ...currentUser,

    company: {
      ...currentUser.company,
      ...company,
    },
  };

  sessionStorage.setItem(
    USER_KEY,
    JSON.stringify(
      updatedUser,
    ),
  );

  applyCompanyTheme(
    updatedUser.company,
  );

  notifySessionUpdated();
}

export function restoreTheme() {
  const user =
    getUser();

  if (user?.company) {
    applyCompanyTheme(
      user.company,
    );
  } else {
    resetCompanyTheme();
  }
}

export function expireSession(
  message = DEFAULT_EXPIRED_MESSAGE,
) {
  const hadSession =
    Boolean(
      getToken() ||
        getUser(),
    );

  clearSessionData();

  sessionStorage.setItem(
    SESSION_MESSAGE_KEY,
    message,
  );

  if (hadSession) {
    window.dispatchEvent(
      new CustomEvent(
        SESSION_EXPIRED_EVENT,
        {
          detail: {
            message,
          },
        },
      ),
    );
  }
}

export function consumeSessionMessage() {
  const message =
    sessionStorage.getItem(
      SESSION_MESSAGE_KEY,
    );

  if (message) {
    sessionStorage.removeItem(
      SESSION_MESSAGE_KEY,
    );
  }

  return message;
}

export function logout() {
  sessionStorage.removeItem(
    SESSION_MESSAGE_KEY,
  );

  clearSessionData();
}
