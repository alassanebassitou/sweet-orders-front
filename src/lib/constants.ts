export const statutColors: Record<string, { bg: string; text: string; label: string }> = {
  EN_ATTENTE_CONFIRMATION: { bg: 'bg-warning/15', text: 'text-warning', label: 'En attente' },
  CONFIRMEE: { bg: 'bg-info/15', text: 'text-info', label: 'Confirmée' },
  EN_PRODUCTION: { bg: 'bg-primary/15', text: 'text-primary', label: 'En production' },
  PRETE: { bg: 'bg-accent/15', text: 'text-accent', label: 'Prête' },
  LIVREE: { bg: 'bg-success/15', text: 'text-success', label: 'Livrée' },
  ANNULEE: { bg: 'bg-destructive/15', text: 'text-destructive', label: 'Annulée' },
};

export const statutOrder = [
  'EN_ATTENTE_CONFIRMATION',
  'CONFIRMEE',
  'EN_PRODUCTION',
  'PRETE',
  'LIVREE',
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
  { value: 'LIVRAISON_DOMICILE', label: 'Livraison à domicile' },
  { value: 'RETRAIT_SUR_PLACE', label: 'Retrait sur place' },
];

export const CATEGORIES_DEPENSES = [
  'INGREDIENTS',
  'EMBALLAGE',
  'TRANSPORT',
  'EQUIPEMENT',
  'MARKETING',
  'AUTRE',
];
