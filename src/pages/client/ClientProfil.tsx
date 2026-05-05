import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { mockCommandes } from '@/lib/mockData';
import { formatFCFA } from '@/lib/format';

export default function ClientProfil() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();

  const [prenom, setPrenom] = useState(user?.prenom || '');
  const [nom, setNom] = useState(user?.nom || '');
  const [telephone, setTelephone] = useState(user?.telephone || '');
  const [adresse, setAdresse] = useState(user?.adresse || '');
  const [ville, setVille] = useState(user?.ville || '');

  const total = mockCommandes.length;
  const livrees = mockCommandes.filter((c) => c.statut === 'LIVREE').length;
  const depense = mockCommandes.reduce((s, c) => s + c.paye, 0);

  const save = () => {
    updateUser({ prenom, nom, telephone, adresse, ville });
    toast.success('Profil mis à jour');
  };

  const doLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      <div className="text-center">
        {user?.photoUrl ? (
          <img src={user.photoUrl} alt="" className="mx-auto w-20 h-20 rounded-full" />
        ) : (
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center text-2xl font-bold text-primary">
            {(user?.prenom?.[0] || user?.nom?.[0] || 'C')}
          </div>
        )}
        <h1 className="font-display text-2xl font-bold mt-3">{user?.prenom} {user?.nom}</h1>
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
