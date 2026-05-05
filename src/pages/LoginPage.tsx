import { CakeSlice } from 'lucide-react';
import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/lib/services';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) {
      toast.error('Token Google manquant.');
      return;
    }
    try {
      setLoading(true);
      const data = await authService.google(credentialResponse.credential);
      // data = { sessionId, sessionUser }
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

        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          <h2 className="font-display text-xl font-semibold text-center mb-6">Connexion</h2>

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
            <p className="text-xs text-center text-muted-foreground mt-4">Connexion en cours...</p>
          )}

          <p className="text-xs text-muted-foreground text-center mt-6">
            Connectez-vous avec votre compte Google. Votre rôle (client ou admin) sera détecté automatiquement.
          </p>
        </div>
      </div>
    </div>
  );
}
