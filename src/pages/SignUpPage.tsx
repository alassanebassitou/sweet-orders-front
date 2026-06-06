import { CakeSlice, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/lib/services';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    birthday: '',
    phone: '',
    email: '',
  });

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstname || !form.lastname || !form.birthday || !form.phone || !form.email) {
      toast.error('Tous les champs sont obligatoires');
      return;
    }
    try {
      setLoading(true);
      await authService.signup(form);
      toast.success('Compte créé !');
      navigate('/login');
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      if (status === 409) {
        toast.error("Un compte avec cet email existe déjà");
      } else if (msg) {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <CakeSlice className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold">Créer un compte</h1>
          <p className="text-sm text-muted-foreground">Rejoignez Sweet Orders</p>
        </div>

        <form onSubmit={submit} className="bg-card rounded-2xl shadow-lg border border-border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prénom *</Label>
              <Input value={form.firstname} onChange={(e) => update('firstname', e.target.value)} />
            </div>
            <div>
              <Label>Nom *</Label>
              <Input value={form.lastname} onChange={(e) => update('lastname', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Date de naissance *</Label>
            <Input type="date" value={form.birthday} onChange={(e) => update('birthday', e.target.value)} />
          </div>
          <div>
            <Label>Téléphone *</Label>
            <Input placeholder="+229..." value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </div>
          <div>
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Créer mon compte
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Déjà inscrit ?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
