import { CakeSlice, Loader2, Mail } from 'lucide-react';
import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) {
      toast.error('Token Google manquant.');
      return;
    }
    
    try {
      setLoading(true);
      const data = await authService.google(credentialResponse.credential);
      const u = data.sessionUser || data.user || data;
      const sid = data.sessionId || data.sid;
      if (!sid || !u) throw new Error('Réponse invalide du serveur');

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
      setAuth(user, sid);
      navigate(user.role === 'ROLE_ADMIN' ? '/admin/dashboard' : '/app/home');
    } catch (err: any) {
      console.error(err);
      toast.error('Connexion échouée. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Entrez votre email');
      return;
    }
    try {
      setSending(true);
      await authService.sendCode(email);
      toast.success(`Code envoyé à ${email}`);
      navigate(`/login/verify?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      if (status === 404) {
        toast.error("Aucun compte trouvé. Inscrivez-vous d'abord.");
      } else if (msg) {
        toast.error(msg);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CakeSlice className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Sweet Orders</h1>
          <p className="text-muted-foreground">Connectez-vous pour commander</p>
        </div>

        <div className="bg-card rounded-2xl shadow-lg border border-border p-8 space-y-6">
          <h2 className="font-display text-xl font-semibold text-center">Connexion</h2>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => toast.error('Connexion Google annulée.')}
              useOneTap={false}
              text="signin_with"
              shape="rectangular"
              width="320"
            />
          </div>

          {loading && (
            <p className="text-xs text-center text-muted-foreground">Connexion en cours...</p>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <form onSubmit={sendCode} className="space-y-3">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline" className="w-full" disabled={sending}>
              {sending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Recevoir un code
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center">
            Pas encore inscrit ?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
