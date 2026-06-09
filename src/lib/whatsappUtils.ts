import { toast } from 'sonner';
import { paiementService } from '@/lib/services';
import {
  interpolateTemplate,
  sendWhatsApp,
  buildOrderVariables,
  type TemplateVariables,
} from '@/lib/templateUtils';

export interface WhatsAppAction {
  label: string;
  type: 'whatsapp_only' | 'whatsapp_and_email';
  variant: 'default' | 'warning' | 'destructive';
}

export const getWhatsAppAction = (
  status: string,
  isVerified: boolean,
  isFullyPaid: boolean
): WhatsAppAction => {
  if (status === 'CANCELLED') {
    return { label: '📱 Relancer le client', type: 'whatsapp_only', variant: 'destructive' };
  }

  if (status === 'DELIVERED') {
    if (isFullyPaid) {
      return { label: '📱 Message de remerciement', type: 'whatsapp_only', variant: 'default' };
    }
    return {
      label: '📱 + ✉️ Remerciement + Rappel paiement',
      type: 'whatsapp_and_email',
      variant: 'warning',
    };
  }

  if (status === 'READY') {
    if (!isVerified) {
      return {
        label: '📱 + ✉️ Commande prête + Rappel acompte',
        type: 'whatsapp_and_email',
        variant: 'warning',
      };
    }
    if (!isFullyPaid) {
      return {
        label: '📱 + ✉️ Commande prête + Solde restant',
        type: 'whatsapp_and_email',
        variant: 'warning',
      };
    }
    return { label: '📱 La commande est prête', type: 'whatsapp_only', variant: 'default' };
  }

  if (status === 'CONFIRMED' || status === 'IN_PRODUCTION') {
    if (!isVerified) {
      return {
        label: '📱 + ✉️ Confirmation + Rappel acompte',
        type: 'whatsapp_and_email',
        variant: 'warning',
      };
    }
    return { label: '📱 Message de confirmation', type: 'whatsapp_only', variant: 'default' };
  }

  // PENDING_CONFIRMATION / default
  if (!isVerified) {
    return {
      label: '📱 + ✉️ Message + Rappel acompte',
      type: 'whatsapp_and_email',
      variant: 'warning',
    };
  }
  return { label: '📱 Envoyer un message', type: 'whatsapp_only', variant: 'default' };
};

export const getTemplateTypeForPayment = (
  status: string,
  isVerified: boolean,
  isFullyPaid: boolean
): string => {
  if (status === 'CANCELLED') return 'RELANCE_IMPAYE';
  if (status === 'DELIVERED') return 'REMERCIEMENT';
  if (status === 'READY') return 'COMMANDE_PRETE';
  if (!isVerified || !isFullyPaid) return 'RAPPEL_PAIEMENT';
  return 'CONFIRMATION';
};

export const buttonColorClass: Record<WhatsAppAction['variant'], string> = {
  default: 'text-green-700 border-green-300 hover:bg-green-500',
  warning: 'text-amber-700 border-amber-300 hover:bg-amber-500',
  destructive: 'text-red-700 border-red-300 hover:bg-red-500',
};

export const handleSendWhatsAppFull = async (
  commande: any,
  templates: any[],
  patisserie: { nom?: string; telephone?: string },
  isVerified: boolean,
  isFullyPaid: boolean
): Promise<void> => {
  const status = commande.status || commande.statut;
  const action = getWhatsAppAction(status, isVerified, isFullyPaid);
  const templateType = getTemplateTypeForPayment(status, isVerified, isFullyPaid);

  const template = (templates || []).find((t: any) => t.type === templateType);
  if (!template) {
    toast.error('Template introuvable. Vérifiez vos templates dans Messages.');
    return;
  }

  const variables: TemplateVariables = buildOrderVariables(commande, patisserie);
  const message = interpolateTemplate(template.contenu || template.content || '', variables);

  const phone = commande.clientPhone || commande.clientTelephone || commande.phone || '';
  if (!phone) {
    toast.error('Numéro de téléphone client introuvable.');
    return;
  }

  if (action.type === 'whatsapp_and_email') {
    try {
      await paiementService.sendRelanceEmail(commande.id);
      toast.success('Email de rappel envoyé au client ✉️');
    } catch {
      toast.error('Email non envoyé, mais WhatsApp continue.');
    }
  }

  sendWhatsApp(phone, message);
};
