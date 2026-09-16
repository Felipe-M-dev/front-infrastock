import { apiRequest } from './api.service';

export interface DeleteCatalogItemResult {
  deleted: true;
  id: number;
  name: string;
  version?: string;
}

export async function deleteSoftwareCatalogItem(
  id: number,
): Promise<DeleteCatalogItemResult> {
  return apiRequest<DeleteCatalogItemResult>(
    `/catalog-maintenance/software/${id}`,
    {
      method: 'DELETE',
      fallbackMessage:
        'No fue posible eliminar el software del catálogo.',
    },
  );
}

export async function deleteOperatingSystemCatalogItem(
  id: number,
): Promise<DeleteCatalogItemResult> {
  return apiRequest<DeleteCatalogItemResult>(
    `/catalog-maintenance/operating-systems/${id}`,
    {
      method: 'DELETE',
      fallbackMessage:
        'No fue posible eliminar el sistema operativo del catálogo.',
    },
  );
}
