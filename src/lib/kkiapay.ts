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
  onSuccess?: (transactionId: string) => void;
  onFailure?: (error: any) => void;
}

export const payWithKkiapay = async ({
  amount,
  commandeId,
  clientInfo,
  onSuccess,
  onFailure,
}: KkiapayOptions) => {
  try {
    await loadSdk();
    const { data: config } = await api.get('/payments/kkiapay/config');

    const successHandler = async ({ transactionId, amount: paidAmount }: any) => {
      try {
        await api.post('/payments/kkiapay/verify', { transactionId, commandeId });
        window.removeKkiapayListener?.('success', successHandler);
        window.removeKkiapayListener?.('failed', failureHandler);
        // Navigate to result page
        const resultUrl = `/app/paiement/resultat?status=success&commandeId=${commandeId}&transactionId=${transactionId}&amount=${paidAmount || amount}`;
        window.location.href = resultUrl;
        onSuccess?.(transactionId);
      } catch (err) {
        window.removeKkiapayListener?.('success', successHandler);
        window.removeKkiapayListener?.('failed', failureHandler);
        const errorUrl = `/app/paiement/resultat?status=error&commandeId=${commandeId}`;
        window.location.href = errorUrl;
        onFailure?.(err);
      }
    };

    const failureHandler = (error: any) => {
      window.removeKkiapayListener?.('success', successHandler);
      window.removeKkiapayListener?.('failed', failureHandler);

      const failureCode = error?.failureCode || error?.code || 'error';
      const statusMap: Record<string, string> = {
        'insufficient_fund': 'insufficient_funds',
        'insufficient_funds': 'insufficient_funds',
        'processing_error': 'error',
        'invalid_number': 'error',
        'declined': 'declined',
        'transaction_denied': 'declined',
      };
      const status = statusMap[failureCode] || 'error';

      const errorUrl = `/app/paiement/resultat?status=${status}&commandeId=${commandeId}`;
      window.location.href = errorUrl;
      onFailure?.(error);
    };

    window.addKkiapayListener?.('success', successHandler);
    window.addKkiapayListener?.('failed', failureHandler);

    window.openKkiapayWidget?.({
      amount,
      key: config.publicKey,
      sandbox: !!config.sandbox,
      phone: clientInfo.telephone,
      name: clientInfo.name,
      email: clientInfo.email,
      data: String(commandeId),
    });
  } catch (err) {
    toast.error("Impossible d'initialiser le paiement.");
    const errorUrl = `/app/paiement/resultat?status=error&commandeId=${commandeId}`;
    window.location.href = errorUrl;
    onFailure?.(err);
  }
};
