import api from './api';

// ---- Auth
export const authService = {
  google: (idToken: any) => api.post('/auth/google', { idToken }).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data).catch(() => null),
  me: () => api.get('/auth/me').then(r => r.data),
};

// ---- Users / Clients
export const userService = {
  me: () => api.get('/users/me').then(r => r.data),
  updateMe: (payload: any) => api.put('/users/me', payload).then(r => r.data),
  listAdmin: (search?: string) =>
    api.get('/admin/users', { params: search ? { search } : {} }).then(r => r.data),
  update: (id: string | number, payload: any) =>
    api.put(`/admin/users/${id}`, payload).then(r => r.data),
  create: (payload: any) => api.post('/admin/users', payload).then(r => r.data),
  deactivate: (id: string | number) => api.delete(`/admin/users/${id}`).then(r => r.data),
};

// ---- Products
export const productService = {
  list: () => api.get('/products').then(r => r.data),
  get: (id: string | number) => api.get(`/products/${id}`).then(r => r.data),
  create: (payload: any) => api.post('/admin/products', payload).then(r => r.data),
  update: (id: string | number, payload: any) =>
    api.put(`/admin/products/${id}`, payload).then(r => r.data),
  remove: (id: string | number) => api.delete(`/admin/products/${id}`).then(r => r.data),
  uploadPhoto: (id: string | number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/admin/products/${id}/photo`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  getPersonnalisations: (id: string | number) =>
    api.get(`/products/${id}/customization`).then(r => r.data),
  addPersonnalisation: (id: string | number, payload: any) =>
    api.post(`/admin/products/${id}/customization`, payload).then(r => r.data),
};

// ---- Commandes
export const commandeService = {
  listAdmin: (params?: any) => api.get('/admin/commandes', { params }).then(r => r.data),
  get: (id: string | number) => api.get(`/commandes/${id}`).then(r => r.data),
  mesCommandes: () => api.get('/commandes/my-commandes').then(r => r.data),
  create: (payload: any) => api.post('/commandes', payload).then(r => r.data),
  changerStatut: (id: string | number, statut: string, commentaire?: string) =>
    api.patch(`/admin/commandes/${id}/status`, { statut, commentaire }).then(r => r.data),
  balance: (id: string | number) => api.get(`/commandes/${id}/balance`).then(r => r.data),
  paiements: (id: string | number) => api.get(`/commandes/${id}/payments`).then(r => r.data),
  dupliquer: (id: string | number) => api.post(`/commandes/${id}/duplicate`).then(r => r.data),
};

// ---- Paiements
export const paiementService = {
  enregistrer: (payload: any) => api.post('/admin/paiements', payload).then(r => r.data),
};

// ---- Production
export const productionService = {
  planning: (dateDebut: string) =>
    api.get('/productions/planning', { params: { dateDebut } }).then(r => r.data),
  ficheJour: (date?: string) =>
    api.get('/productions/day', { params: { date: date || new Date().toISOString().slice(0, 10) } }).then(r => r.data),
  terminer: (commandeId: string | number) =>
    api.patch(`/productions/${commandeId}/finish`).then(r => r.data),
};

// ---- Livraisons
export const deliveriesService = {
  aujourdhui: () => api.get('/deliveries/today').then(r => r.data),
  livrer: (id: string | number) => api.post(`/deliveries/${id}/delivered`).then(r => r.data),
  echec: (id: string | number, raisonEchec: string, notes?: string) =>
    api.post(`/deliveries/${id}/failure`, { raisonEchec, notes }).then(r => r.data),
  reprogrammer: (id: string | number, nouvelleDate: string, nouvelleHeure: string) =>
    api.put(`/deliveries/${id}/reprogrammed`, { nouvelleDate, nouvelleHeure }).then(r => r.data),
  calendrier: (month: number, year: number) =>
    api.get('/deliveries/calendar', { params: { month, year } }).then(r => r.data),
  planifier: (payload: any) => api.post('/deliveries', payload).then(r => r.data),
};

// ---- Finances
export const financeService = {
  dashboard: () => api.get('/finances/dashboard').then(r => r.data),
  depenses: (params?: any) => api.get('/expenses', { params }).then(r => r.data),
  creerDepense: (payload: any) => api.post('/expenses', payload).then(r => r.data),
  supprimerDepense: (id: string | number) => api.delete(`/expenses/${id}`).then(r => r.data),
  exportCSV: async (debut?: string, fin?: string) => {
    const response = await api.get('/finances/export', {
      params: { debut, fin },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'finances.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// ---- Paramètres
export const parametreService = {
  get: () => api.get('/settings').then(r => r.data),
  update: (payload: any) => api.put('/settings', payload).then(r => r.data),
  zones: () => api.get('/delivery-zones').then(r => r.data),
  creerZone: (payload: any) => api.post('/delivery-zones', payload).then(r => r.data),
  supprimerZone: (id: string | number) => api.delete(`/delivery-zones/${id}`).then(r => r.data),
  templates: () => api.get('/templates-messages').then(r => r.data),
  updateTemplate: (id: string | number, contenu: string) =>
    api.put(`/templates-messages/${id}`, { contenu }).then(r => r.data),
};

// ---- Notifications
export const notificationService = {
  list: () => api.get('/notifications').then(r => r.data),
  count: () => api.get('/notifications/count').then(r => r.data),
  nonLues: () => api.get('/notifications/unread').then(r => r.data),
  marquerLue: (id: string | number) => api.patch(`/notifications/${id}/read`).then(r => r.data),
  marquerToutesLues: () => api.patch('/notifications/read-all').then(r => r.data),
};

// ---- Kkiapay
export const paymentService = {
  kkiapayConfig: () => api.get('/payments/kkiapay/config').then(r => r.data),
  verifyKkiapay: (transactionId: string, commandeId: string | number) =>
    api.post('/payments/kkiapay/verify', { transactionId, commandeId }).then(r => r.data),
};
