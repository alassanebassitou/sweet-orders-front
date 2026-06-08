import api from './api';

export interface DeliveryZone {
  id: number;
  name: string;
  quartier: string;
  fraisLivraison: number;
  actif?: boolean;
  description?: string;
}

export const zoneService = {
  getAll: (): Promise<DeliveryZone[]> =>
    api.get('/zones-livraison').then(r => r.data),

  create: (payload: Partial<DeliveryZone>) =>
    api.post('/zones-livraison', payload).then(r => r.data),

  update: (id: number, payload: Partial<DeliveryZone>) =>
    api.put(`/zones-livraison/${id}`, payload).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/zones-livraison/${id}`).then(r => r.data),

  getVilles: async (): Promise<string[]> => {
    const zones = await zoneService.getAll();
    return [...new Set(zones.map((z) => z.name))].sort();
  },

  getQuartiersForVille: async (ville: string): Promise<DeliveryZone[]> => {
    const zones = await zoneService.getAll();
    return zones.filter(
      (z) => z.name.toLowerCase() === ville.toLowerCase() && z.actif !== false,
    );
  },

  findZone: async (ville: string, quartier: string): Promise<DeliveryZone | null> => {
    const zones = await zoneService.getAll();
    return zones.find(
      (z) =>
        z.name.toLowerCase() === ville.toLowerCase() &&
        z.quartier.toLowerCase() === quartier.toLowerCase(),
    ) || null;
  },

  recordUnknownQuartier: (ville: string, quartier: string) =>
    api.post('/zones-livraison', {
      name: ville,
      quartier,
      fraisLivraison: 0,
      actif: true,
    }).then(r => r.data),

  applyFeeToCommande: (commandeId: number | string, fraisLivraison: number, zoneId?: number) =>
    api.put(`/admin/commandes/${commandeId}/frais-livraison`, {
      fraisLivraison,
      zoneId,
    }).then(r => r.data),
};
