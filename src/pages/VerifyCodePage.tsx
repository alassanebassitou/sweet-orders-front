import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { authService } from '@/lib/services';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { cn } from '@/lib/utils';

export default function VerifyCodePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const { setAuth } = useAuthStore();
  const clearCart = useCartStore((s) => s.clear);

  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  useEffect(() => {
    if (!email) navigate('/login');
    else inputRefs.current[0]?.focus();
  }, [email, navigate]);

  const handleVerify = async (codeToVerify: string) => {
    if (verifying) return;
    setVerifying(true);
    try {
      const data = await authService.verifyCode(email, codeToVerify);
      const u = data.sessionUser || data.user || data;
      const sid = data.sessionId || data.sid;
      if (!sid || !u) throw new Error('Réponse invalide');
      const user = {
        id: u.userId || u.id,
        userId: u.userId,
        email: u.email,
        nom: u.name || u.nom,
        prenom: u.prenom,
        role: u.role,
        photoUrl: u.photoUrl,
        telephone: u.telephone,
        adresse: u.adresse,
        ville: u.ville,
        isActif: u.isActif,
      };
      clearCart();
      setAuth(user, sid);
      toast.success('Connexion réussie !');
      navigate(user.role === 'ROLE_ADMIN' ? '/admin/dashboard' : '/app/home');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Code incorrect ou expiré';
      toast.error(msg);
      setCode('');
      setVerifying(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 0);
    }
  };

  // Auto-trigger when 6 digits entered
  useEffect(() => {
    if (code.length === 6 && !verifying) {
      handleVerify(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const arr = code.split('');
    while (arr.length < 6) arr.push('');
    arr[index] = digit;
    const joined = arr.join('').slice(0, 6);
    setCode(joined);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    setCode(pasted);
    const lastIndex = Math.min(pasted.length, 6) - 1;
    inputRefs.current[lastIndex]?.focus();
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await authService.sendCode(email);
      toast.success('Code renvoyé');
      setResendCountdown(60);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg) toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <img src="/favicon.ico" alt="Sweet Orders" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="font-display text-2xl font-bold">Vérification</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Un code à 6 chiffres a été envoyé à<br />
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-lg border border-border p-6 space-y-5">
          <div className="flex gap-2 justify-center my-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={code[i] || ''}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                disabled={verifying}
                className={cn(
                  'w-12 h-14 text-center text-xl font-bold',
                  'border-2 rounded-xl transition-all',
                  'focus:border-primary focus:outline-none',
                  code[i] ? 'border-primary bg-primary/5' : 'border-border bg-card',
                  verifying && 'opacity-50 cursor-not-allowed'
                )}
              />
            ))}
          </div>

          {verifying && (
            <div className="flex items-center justify-center gap-2 text-primary text-sm py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Vérification en cours...
            </div>
          )}

          <div className="text-center text-sm">
            {resendCountdown > 0 ? (
              <span className="text-muted-foreground">
                Renvoyer le code dans {resendCountdown}s
              </span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-primary font-medium hover:underline disabled:opacity-50"
              >
                {resending ? 'Envoi...' : 'Renvoyer le code'}
              </button>
            )}
          </div>

          <p className="text-sm text-center text-muted-foreground">
            <Link to="/login" className="hover:underline">← Retour</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
