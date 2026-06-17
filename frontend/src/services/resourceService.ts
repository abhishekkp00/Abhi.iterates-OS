import api from './api';

export interface ResourceResponse {
  id: number;
  title: string;
  description: string;
  type: 'PDF' | 'LINK' | 'VIDEO' | 'NOTE' | 'BOOK';
  price: number;
  ownerId: number;
  ownerName: string;
  isOwner: boolean;
  isPurchased: boolean;
  url: string | null;
  createdAt: string;
}

export const getResources = async (): Promise<ResourceResponse[]> => {
  const response = await api.get<ResourceResponse[]>('/api/resources');
  return response.data;
};

export const getResourceById = async (id: number): Promise<ResourceResponse> => {
  const response = await api.get<ResourceResponse>(`/api/resources/${id}`);
  return response.data;
};

export const uploadResource = async (formData: FormData): Promise<ResourceResponse> => {
  const response = await api.post<ResourceResponse>('/api/resources', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const purchaseResource = async (id: number): Promise<void> => {
  await api.post(`/api/resources/${id}/purchase`);
};

export const getResourceFileBlob = async (id: number): Promise<Blob> => {
  const response = await api.get(`/api/resources/${id}/view`, {
    responseType: 'blob',
  });
  return response.data;
};
