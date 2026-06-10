import { CakeSlice, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { authService } from '@/lib/services';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';

export default function VerifyCodePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const { setAuth } = useAuthStore();
  const clearCart = useCartStore((s) => s.clear);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (!email) navigate('/login');
  }, [email, navigate]);

  const verify = async () => {
    if (code.length !== 6) {
      toast.error('Entrez les 6 chiffres');
      return;
    }
    try {
      setLoading(true);
      const data = await authService.verifyCode(email, code);
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
      navigate(user.role === 'ROLE_ADMIN' ? '/admin/dashboard' : '/app/home');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg) toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      setResending(true);
      await authService.sendCode(email);
      toast.success('Code renvoyé');
      setCountdown(60);
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
            <img
                src="/favicon.ico"
                alt="Sweet Orders"
                className="w-8 h-8 object-contain"
              />
          </div>
          <h1 className="font-display text-2xl font-bold">Vérification</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Un code à 6 chiffres a été envoyé à<br />
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-lg border border-border p-6 space-y-5">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button onClick={verify} className="w-full" disabled={loading || code.length !== 6}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Vérifier le code
          </Button>

          <div className="text-center text-sm">
            {countdown > 0 ? (
              <span className="text-muted-foreground">
                Renvoyer le code dans {countdown}s
              </span>
            ) : (
              <button
                onClick={resend}
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
