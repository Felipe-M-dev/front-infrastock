import { apiRequest } from './api.service';

export type IpStatus =
  | 'FREE'
  | 'USED'
  | 'RESERVED';

export interface NetworkSummary {
  id: number;
  name: string;
  cidr: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  range: {
    firstUsable: string;
    lastUsable: string;
    totalUsable: number;
  };
  totals: {
    used: number;
    reserved: number;
    free: number;
  };
}

export interface IpInventoryItem {
  ipAddress: string;
  status: IpStatus;
  server: {
    id: number;
    hostname: string;
    company: {
      id: number;
      name: string;
    } | null;
  } | null;
  previousServer: {
    id: number;
    hostname: string;
    company: {
      id: number;
      name: string;
    } | null;
  } | null;
  reservation: {
    id: number;
    description: string | null;
  } | null;
  requiresRelease: boolean;
}

export interface IpInventoryResponse {
  network: Omit<
    NetworkSummary,
    'totals'
  >;
  totals: {
    used: number;
    reserved: number;
    free: number;
  };
  filters: {
    search: string;
    status: IpStatus | null;
  };
  page: number;
  pageSize: number;
  totalPages: number;
  filtered: number;
  items: IpInventoryItem[];
}

export interface NetworkPayload {
  name: string;
  cidr: string;
  description?: string;
  active?: boolean;
}

export async function getNetworks(): Promise<
  NetworkSummary[]
> {
  return apiRequest<NetworkSummary[]>(
    '/networks',
    {
      fallbackMessage:
        'No fue posible obtener las redes.',
    },
  );
}

export async function getIpInventory(
  networkId: number,
  options: {
    search?: string;
    status?: IpStatus | '';
    page?: number;
    pageSize?: number;
  } = {},
): Promise<IpInventoryResponse> {
  const params = new URLSearchParams();

  if (options.search?.trim()) {
    params.set('search', options.search.trim());
  }

  if (options.status) {
    params.set('status', options.status);
  }

  if (options.page) {
    params.set('page', String(options.page));
  }

  if (options.pageSize) {
    params.set('pageSize', String(options.pageSize));
  }

  const query = params.toString();

  return apiRequest<IpInventoryResponse>(
    query
      ? `/networks/${networkId}/ips?${query}`
      : `/networks/${networkId}/ips`,
    {
      fallbackMessage:
        'No fue posible obtener las IPs.',
    },
  );
}

export async function createNetwork(
  payload: NetworkPayload,
): Promise<NetworkSummary> {
  return apiRequest<NetworkSummary>(
    '/networks',
    {
      method: 'POST',
      body: payload,
      fallbackMessage:
        'No fue posible crear la red.',
    },
  );
}

export async function updateNetwork(
  id: number,
  payload: NetworkPayload,
): Promise<NetworkSummary> {
  return apiRequest<NetworkSummary>(
    `/networks/${id}`,
    {
      method: 'PATCH',
      body: payload,
      fallbackMessage:
        'No fue posible modificar la red.',
    },
  );
}

export async function deleteNetwork(
  id: number,
): Promise<void> {
  await apiRequest<void>(
    `/networks/${id}`,
    {
      method: 'DELETE',
      fallbackMessage:
        'No fue posible eliminar la red.',
    },
  );
}

export async function reserveIp(
  networkId: number,
  payload: {
    ipAddress: string;
    description?: string;
  },
) {
  return apiRequest<unknown>(
    `/networks/${networkId}/reservations`,
    {
      method: 'POST',
      body: payload,
      fallbackMessage:
        'No fue posible reservar la IP.',
    },
  );
}

export async function releaseReservation(
  reservationId: number,
) {
  return apiRequest<unknown>(
    `/networks/reservations/${reservationId}/release`,
    {
      method: 'PATCH',
      fallbackMessage:
        'No fue posible liberar la reserva.',
    },
  );
}

export async function releaseInactiveServerIp(
  networkId: number,
  ipAddress: string,
) {
  return apiRequest<unknown>(
    `/networks/${networkId}/ips/release-inactive`,
    {
      method: 'PATCH',
      body: { ipAddress },
      fallbackMessage:
        'No fue posible liberar el vínculo histórico.',
    },
  );
}
