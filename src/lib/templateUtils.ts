export interface TemplateVariables {
  Prenom?: string;
  Nom?: string;
  Numero?: string;
  DateLivraison?: string;
  MontantTotal?: string;
  Acompte?: string;
  SoldeRestant?: string;
  TelephonePatisserie?: string;
  NomPatisserie?: string;
}

export const interpolateTemplate = (
  template: string,
  variables: TemplateVariables
): string => {
  let result = template || '';
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      result = result.split(`{${key}}`).join(String(value));
    }
  });
  return result;
};

export const sendWhatsApp = (phone: string, message: string): void => {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
};

export const formatDateFR = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export const getWhatsAppButtonLabel = (status: string): string => {
  const labels: Record<string, string> = {
    PENDING_CONFIRMATION: '📱 Message confirmation',
    CONFIRMED: '📱 Message confirmation',
    IN_PRODUCTION: '📱 Message production',
    READY: '📱 Message prête',
    DELIVERED: '📱 Message remerciement',
    CANCELLED: '📱 Relancer le client',
  };
  return labels[status] || '📱 Envoyer un message';
};

export const getTemplateType = (status: string): string => {
  const types: Record<string, string> = {
    PENDING_CONFIRMATION: 'CONFIRMATION',
    CONFIRMED: 'CONFIRMATION',
    IN_PRODUCTION: 'CONFIRMATION',
    READY: 'COMMANDE_PRETE',
    DELIVERED: 'REMERCIEMENT',
    CANCELLED: 'RELANCE_IMPAYE',
  };
  return types[status] || 'CONFIRMATION';
};

import { formatFCFA } from '@/lib/format';

export const buildOrderVariables = (
  commande: any,
  patisserie?: { nom?: string; telephone?: string }
): TemplateVariables => {
  const name = commande.clientName || '';
  const [prenom, ...rest] = name.split(' ');
  return {
    Prenom: prenom || '',
    Nom: rest.join(' ') || '',
    Numero: commande.numero || '',
    DateLivraison: formatDateFR(
      commande.wishDeliveryDate || commande.dateLivraisonSouhaitee
    ),
    MontantTotal: formatFCFA(commande.totalAmount || commande.montantTotal || 0).replace(' FCFA', ''),
    Acompte: formatFCFA(commande.requireAccount || commande.acompte || 0).replace(' FCFA', ''),
    SoldeRestant: formatFCFA(
      commande.soldeRestant ?? ((commande.totalAmount || 0) - (commande.totalPaye ?? commande.paye ?? 0))
    ).replace(' FCFA', ''),
    NomPatisserie: patisserie?.nom || '',
    TelephonePatisserie: patisserie?.telephone || '',
  };
};

export const sendOrderWhatsApp = (
  commande: any,
  templates: any[],
  toastError: (msg: string) => void,
  patisserie?: { nom?: string; telephone?: string }
): void => {
  const status = commande.status || commande.statut;
  const templateType = getTemplateType(status);
  const template = templates.find((t: any) => t.type === templateType || t.code === templateType);
  if (!template) {
    toastError('Template introuvable');
    return;
  }
  const variables = buildOrderVariables(commande, patisserie);
  const message = interpolateTemplate(template.contenu || template.content || '', variables);
  const phone = commande.clientPhone || commande.phone || '';
  if (!phone) {
    toastError('Numéro de téléphone client introuvable');
    return;
  }
  sendWhatsApp(phone, message);
};
