import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { userService, authService } from '@/lib/services';
import { avisService } from '@/lib/avisService';
import { useQuery, useMutation } from '@tanstack/react-query';
import { LoadingState, ErrorState } from '@/components/common/StateViews';
import { commandeService } from '@/lib/services';
import { formatFCFA } from '@/lib/format';
import { StarRating } from '@/components/ui/StarRating';
import { relativeTime } from '@/lib/relativeTime';
import { CakeSlice, Star } from 'lucide-react';

export default function ClientProfil() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();

  const [prenom, setPrenom] = useState(user?.firstname || '');
  const [nom, setNom] = useState(user?.lastname || '');
  const [telephone, setTelephone] = useState(user?.telephone || '');
  const [adresse, setAdresse] = useState(user?.address || '');
  const [ville, setVille] = useState(user?.city || '');

  const { data: commandes = [] } = useQuery({
    queryKey: ['mes-commandes'],
    queryFn: () => commandeService.mesCommandes(),
  });
  const { data: mesAvis = [] } = useQuery({
    queryKey: ['mes-avis'],
    queryFn: () => avisService.getMesAvis(),
  });

  const total = commandes.length;
  const livrees = commandes.filter((c: any) => c.status === 'DELIVERED').length;
  const depense = commandes.reduce((s: number, c: any) => s + (c.totalPaye || c.paye || 0), 0);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => userService.updateMe(payload),
    onSuccess: (data) => {
      updateUser(data || { firstname: prenom, lastname: nom, telephone, address: adresse, city: ville });
      toast.success('Profil mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const save = () => updateMutation.mutate({ firstname: prenom, lastname: nom, telephone, address: adresse, city: ville });

  const doLogout = async () => {
    try { await authService.logout(); } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      <div className="text-center">
        {user?.photoUrl ? (
          <img src={user.photoUrl} alt="" className="mx-auto w-20 h-20 rounded-full" />
        ) : (
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center text-2xl font-bold text-primary">
            {(user?.firstname?.[0] || user?.lastname?.[0] || 'C')}
          </div>
        )}
        <h1 className="font-display text-2xl font-bold mt-3">{user?.firstname} {user?.lastname}</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-display text-xl font-bold text-primary">{total}</p>
            <p className="text-[10px] text-muted-foreground">Commandes</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold text-primary">{livrees}</p>
            <p className="text-[10px] text-muted-foreground">Livrées</p>
          </div>
          <div>
            <p className="font-display text-sm font-bold text-primary">{formatFCFA(depense)}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-display font-semibold flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Mes avis
          </h3>
          {(mesAvis as any[]).length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">Vous n'avez pas encore laissé d'avis</p>
              <p className="text-xs text-muted-foreground mt-1">
                Vos avis apparaîtront ici après réception de vos commandes.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(mesAvis as any[]).map((a) => (
                <div key={a.id} className="flex gap-3 py-3">
                  {a.productPhotoUrl || a.photoUrl ? (
                    <img src={a.productPhotoUrl || a.photoUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center">
                      <CakeSlice className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{a.productName || `Produit #${a.productId}`}</p>
                    <div className="flex items-center gap-2">
                      <StarRating value={a.note || 0} size="sm" />
                      <span className="text-xs text-muted-foreground">{relativeTime(a.createdAt)}</span>
                    </div>
                    {a.comment && <p className="text-xs mt-1 text-foreground/80">{a.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-display font-semibold">Mes informations</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Prénom</Label><Input value={prenom} onChange={(e) => setPrenom(e.target.value)} className="mt-1" /></div>
            <div><Label>Nom</Label><Input value={nom} onChange={(e) => setNom(e.target.value)} className="mt-1" /></div>
          </div>
          <div><Label>Téléphone</Label><Input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="mt-1" /></div>
          <div><Label>Adresse</Label><Input value={adresse} onChange={(e) => setAdresse(e.target.value)} className="mt-1" /></div>
          <div><Label>Ville</Label><Input value={ville} onChange={(e) => setVille(e.target.value)} className="mt-1" /></div>
          <Button onClick={save} className="w-full gap-2"><Save className="w-4 h-4" /> Enregistrer</Button>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={doLogout} className="w-full gap-2 text-destructive hover:text-destructive">
        <LogOut className="w-4 h-4" /> Se déconnecter
      </Button>
    </div>
  );
}
