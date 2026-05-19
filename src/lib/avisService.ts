import api from './api';

export interface AvisRequest {
  productId: number;
  commandeId: number;
  note: number;
  comment?: string;
}

export const avisService = {
  submit: (payload: AvisRequest) => api.post('/reviews', payload).then(r => r.data),
  getProduitAvis: (productId: number) => api.get(`/products/${productId}/reviews`).then(r => r.data),
  getMesAvis: () => api.get('/reviews/my-avis').then(r => r.data),
  getAll: () => api.get('/admin/reviews').then(r => r.data),
  hide: (id: number) => api.patch(`/admin/reviews/${id}/hidde`).then(r => r.data),
  restore: (id: number) => api.patch(`/admin/reviews/${id}/restaure`).then(r => r.data),
  delete: (id: number) => api.delete(`/admin/reviews/${id}`).then(r => r.data),
};
