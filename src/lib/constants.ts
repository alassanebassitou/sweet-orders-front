export const statutColors: Record<string, { bg: string; text: string; label: string }> = {
  PENDING_CONFIRMATION: { bg: 'bg-warning/15', text: 'text-warning', label: 'En attente' },
  CONFIRMED: { bg: 'bg-sky-500/15', text: 'text-sky-600', label: 'Confirmée' },
  IN_PRODUCTION: { bg: 'bg-primary/15', text: 'text-primary', label: 'En production' },
  READY: { bg: 'bg-accent/15', text: 'text-accent', label: 'Prête' },
  DELIVERED: { bg: 'bg-success/15', text: 'text-success', label: 'Livrée' },
  CANCELLED: { bg: 'bg-destructive/15', text: 'text-destructive', label: 'Annulée' },
};

export const statutOrder = [
  'DRAFT',
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'IN_PRODUCTION',
  'READY',
  'DELIVERED',
  'CANCELLED',
];

export const CATEGORIES = [
  { value: 'ALL', label: 'Tous' },
  { value: 'CAKE', label: 'Cakes' },
  { value: 'CUPCAKE', label: 'Cupcakes' },
  { value: 'TARTE', label: 'Tartes' },
  { value: 'AUTRE', label: 'Autres' },
];

export const CRENEAUX = ['Matin', 'Après-midi', 'Soirée'];

export const MODES_LIVRAISON = [
  { value: 'HOME_DELIVERY', label: 'Livraison à domicile' },
  { value: 'COLLECTION_ON_SITE', label: 'Retrait sur place' },
];

export const CATEGORIES_DEPENSES = [
  'INGREDIENTS',
  'EMBALLAGE',
  'TRANSPORT',
  'EQUIPEMENT',
  'MARKETING',
  'AUTRE',
];
