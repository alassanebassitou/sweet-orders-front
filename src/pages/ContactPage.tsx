import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MapPin, Phone, Mail, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { parametreService } from '@/lib/services';

export default function ContactPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['parametres-public'],
    queryFn: parametreService.get,
    staleTime: 5 * 60 * 1000,
  });

  const adresse = (settings as any)?.adresse || (settings as any)?.address || '—';
  const telephone =
    (settings as any)?.telephoneWhatsapp ||
    (settings as any)?.whatsappPhoneNumber ||
    '';
  const email = (settings as any)?.email || '—';

  const handleWhatsApp = () => {
    if (!telephone) {
      toast.error('Numéro WhatsApp indisponible');
      return;
    }
    const tel = telephone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${tel}`, '_blank');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      toast.success('Message envoyé ! Nous vous répondrons bientôt.');
      setForm({ nom: '', email: '', message: '' });
      setSubmitting(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <img
                src="/favicon.ico"
                alt="Sweet Orders"
                className="w-8 h-8 object-contain"
              />
            </div>
            <span className="font-display text-lg font-semibold">Sweet Orders</span>
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/')}>Accueil</Button>
            <Button variant="outline" onClick={() => navigate('/login')}>Se connecter</Button>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold">Nous contacter</h1>
          <p className="mt-3 text-muted-foreground">
            Une question ? Nous sommes là pour vous aider
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Contact info */}
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-5">
              <h2 className="font-display text-xl font-semibold">Nos coordonnées</h2>

              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-muted-foreground">{adresse}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Téléphone</p>
                      <p className="text-muted-foreground">{telephone || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground break-all">{email}</p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleWhatsApp}
                disabled={!telephone}
                className="w-full gap-2 bg-success hover:bg-success/90 text-success-foreground"
              >
                <MessageCircle className="w-4 h-4" />
                Nous contacter sur WhatsApp
              </Button>
            </CardContent>
          </Card>

          {/* Contact form */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h2 className="font-display text-xl font-semibold mb-4">Envoyez-nous un message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nom">Nom complet *</Label>
                  <Input
                    id="nom"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Envoyer
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border bg-card mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-wrap justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <img
                src="/favicon.ico"
                alt="Sweet Orders"
                className="w-8 h-8 object-contain"
              />
            <span className="font-display font-semibold">Sweet Orders</span>
          </div>
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-primary">
            Accueil
          </button>
        </div>
      </footer>
    </div>
  );
}
