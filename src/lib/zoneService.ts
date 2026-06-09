import api from './api';

export interface DeliveryZone {
  id: number;
  name: string;
  neighborhood: string;
  deliveryFees: number;
  actif?: boolean;
  description?: string;
}

export const zoneService = {
  getAll: (): Promise<DeliveryZone[]> =>
    api.get('/delivery-zones').then(r => r.data),

  create: (payload: Partial<DeliveryZone>) =>
    api.post('/delivery-zones', payload).then(r => r.data),

  update: (id: number, payload: Partial<DeliveryZone>) =>
    api.put(`/delivery-zones/${id}`, payload).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/delivery-zones/${id}`).then(r => r.data),

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
        z.neighborhood.toLowerCase() === quartier.toLowerCase(),
    ) || null;
  },

  recordUnknownQuartier: (ville: string, quartier: string) =>
    api.post('/delivery-zones', {
      name: ville,
      neighborhood: quartier,
      deliveryFees: 0,
      actif: true,
    }).then(r => r.data),

  applyFeeToCommande: (commandeId: number | string, deliveryFees: number, zoneId?: number) =>
    api.put(`/admin/commandes/${commandeId}/delivery-fees`, {
      deliveryFees,
      zoneId,
    }).then(r => r.data),
};
