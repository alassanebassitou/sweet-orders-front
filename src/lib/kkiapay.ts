import { api } from '@/lib/api';
import { toast } from 'sonner';

declare global {
  interface Window {
    openKkiapayWidget?: (opts: any) => void;
    addKkiapayListener?: (event: string, cb: (data: any) => void) => void;
    removeKkiapayListener?: (event: string, cb?: any) => void;
  }
}

const SDK_URL = 'https://cdn.kkiapay.me/k.js';
let sdkPromise: Promise<void> | null = null;

const loadSdk = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.openKkiapayWidget) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SDK_URL}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Kkiapay SDK failed to load')));
      return;
    }
    const s = document.createElement('script');
    s.src = SDK_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Kkiapay SDK failed to load'));
    document.head.appendChild(s);
  });
  return sdkPromise;
};

interface KkiapayOptions {
  amount: number;
  commandeId: number | string;
  clientInfo: { telephone?: string; name?: string; email?: string };
  type: 'ACOMPTE' | 'SOLDE' | 'DELIVERY_FEES';
  onSuccess?: (transactionId: string) => void;
  onFailure?: (error: any) => void;
}

// Mapper pour les échecs directs du widget (avant même la vérification backend)
const mapWidgetFailureCode = (error: any): string => {
  const raw =
  error?.reason?.message ||
    error?.failureCode ||
    error?.code ||
    error?.status ||
    error?.data?.failureCode ||
    error?.data?.code ||
    '';
  const code = String(raw).toLowerCase().trim();

  const statusMap: Record<string, string> = {
    'insufficent_fund':  'insufficient_fund',
    'payment_declined':   'declined',
    'processing_error':   'error',
  };

  return statusMap[code] ?? 'error';
};

// Fonction séparée — vérification backend puis redirection
const verifyAndRedirect = async (
  transactionId: string,
  commandeId: number | string,
  type: 'ACOMPTE' | 'SOLDE' | 'DELIVERY_FEES',
  paidAmount: number,
  onSuccess?: (transactionId: string) => void,
  onFailure?: (error: any) => void,
) => {
  let frontendStatus = 'error'; // fallback

  try {
    const response = await api.post('/payments/kkiapay/verify', {
      transactionId,
      commandeId,
      type,
    });

    // Succès backend → on lit la réponse AVANT de rediriger
    console.log('[Kkiapay] Backend verify success:', response.data);
    frontendStatus = 'success';
    onSuccess?.(transactionId);

  } catch (err: any) {
    // On lit la réponse d'erreur AVANT de rediriger
    const responseData = err?.response?.data;
    console.log('[Kkiapay] Backend verify error response:', responseData);
    console.log('[Kkiapay] HTTP status:', err?.response?.status);

    // Le backend renvoie frontendStatus dans le body de l'erreur
    frontendStatus = responseData?.frontendStatus ?? 'error';
    console.log('[Kkiapay] Resolved frontendStatus:', frontendStatus);
    onFailure?.(err);
  }

  // Redirection APRÈS avoir tout lu
  console.log('[Kkiapay] Redirecting with status:', frontendStatus);

  const params = new URLSearchParams({
    status: frontendStatus,
    commandeId: String(commandeId),
    ...(frontendStatus === 'success' && transactionId ? { transactionId } : {}),
    ...(frontendStatus === 'success' && paidAmount    ? { amount: String(paidAmount) } : {}),
  });

  window.location.href = `/app/paiement/resultat?${params.toString()}`;
};

export const payWithKkiapay = async ({
  amount,
  commandeId,
  clientInfo,
  type,
  onSuccess,
  onFailure,
}: KkiapayOptions) => {

  const cleanup = () => {
    window.removeKkiapayListener?.('success', successHandler);
    window.removeKkiapayListener?.('failed',  failureHandler);
    window.removeKkiapayListener?.('failure', failureHandler);
  };

  const successHandler = async ({ transactionId, amount: paidAmount }: any) => {
    // On cleanup d'abord, puis on vérifie, puis on redirige
    cleanup();
    console.log('[Kkiapay] Widget success event — transactionId:', transactionId, 'amount:', paidAmount);

    // Appel séparé qui gère tout : vérif backend → lecture réponse → redirection
    await verifyAndRedirect(transactionId, commandeId, type, paidAmount || amount, onSuccess, onFailure);
  };

  const failureHandler = (error: any) => {
    cleanup();
    // Ici le widget a échoué AVANT la vérification backend (ex: PIN incorrect, annulation)
    console.log('[Kkiapay] Widget failure event — full payload:', JSON.stringify(error, null, 2));

    const status = mapWidgetFailureCode(error);
    console.log('[Kkiapay] Mapped widget failure status:', status);

    // Redirection directe, pas besoin de vérifier le backend
    window.location.href = `/app/paiement/resultat?status=${status}&commandeId=${commandeId}`;
    onFailure?.(error);
  };

  try {
    await loadSdk();
    const { data: config } = await api.get('/payments/kkiapay/config');

    window.addKkiapayListener?.('success', successHandler);
    window.addKkiapayListener?.('failed',  failureHandler);
    window.addKkiapayListener?.('failure', failureHandler);

    window.openKkiapayWidget?.({
      amount,
      key:     config.publicKey,
      sandbox: !!config.sandbox,
      phone:   clientInfo.telephone,
      name:    clientInfo.name,
      email:   clientInfo.email,
      data:    String(commandeId),
    });

  } catch (err) {
    console.error('[Kkiapay] Init failed:', err);
    toast.error("Impossible d'initialiser le paiement.");
    window.location.href = `/app/paiement/resultat?status=error&commandeId=${commandeId}`;
    onFailure?.(err);
  }
};
