import { CakeSlice, Truck, Sparkles, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatFCFA } from '@/lib/format';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const goCatalogue = () => {
    if (isAuthenticated && user?.role === 'ROLE_CLIENT') navigate('/app/catalogue');
    else navigate('/login');
  };

  const goProduct = (id: any) => {
    if (isAuthenticated && user?.role === 'ROLE_CLIENT') navigate(`/app/catalogue/${id}`);
    else navigate('/login');
  };

  const { data: produits = [], isLoading } = useQuery({
    queryKey: ['produits-public'],
    queryFn: () => api.get('/produits').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const featured = (produits as any[])
    .filter((p: any) => p.estActif ?? p.isActif ?? p.actif ?? true)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <img
                src="/favicon.ico"
                alt="Sweet Orders"
                className="w-8 h-8 object-contain"
              />
            </div>
            <span className="font-display text-lg font-semibold">Sweet Orders</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/contact')}>Contact</Button>
            <Button variant="outline" onClick={() => navigate('/login')}>Se connecter</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/5" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">
              Des gâteaux artisanaux livrés chez vous
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Commandez en ligne, nous livrons à Cotonou et environs.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={goCatalogue}>Voir le catalogue</Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                Se connecter avec Google
              </Button>
            </div>
          </div>
          <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/30 to-accent/40 flex items-center justify-center shadow-xl">
            <CakeSlice className="w-32 h-32 text-primary-foreground/80" />
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-6">
        {[
          { icon: CakeSlice, title: 'Fait maison', text: 'Pâtisseries artisanales préparées avec soin.' },
          { icon: Truck, title: 'Livraison à domicile', text: 'Partout à Cotonou et environs.' },
          { icon: Sparkles, title: '100% personnalisé', text: 'Vos messages et décors sur mesure.' },
        ].map((c) => (
          <Card key={c.title} className="text-center shadow-sm">
            <CardContent className="p-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-3">
                <c.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-1">{c.title}</h3>
              <p className="text-sm text-muted-foreground">{c.text}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Featured products */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="font-display text-2xl md:text-3xl font-bold mb-6 text-center">Nos créations</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden shadow-sm">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>
              ))
            : featured.map((p: any) => {
                const nom = p.nom || p.name;
                const prix = p.prixBase ?? p.basePrice ?? 0;
                const photo = p.photoUrl || p.photo;
                return (
                  <Card key={p.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div
                      className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center bg-cover bg-center"
                      style={photo ? { backgroundImage: `url(${photo})` } : undefined}
                    >
                      {!photo && <CakeSlice className="w-16 h-16 text-primary/60" />}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-display font-semibold">{nom}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{formatFCFA(prix)}</span>
                        <Button size="sm" onClick={() => goProduct(p.id)}>Commander</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-4 gap-6 text-sm">
          <div className="flex items-center gap-2">
            <CakeSlice className="w-5 h-5 text-primary" />
            <span className="font-display font-semibold">Sweet Orders</span>
          </div>
          <a href="https://wa.me/22997000000" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
            <Phone className="w-4 h-4" /> +229 97 00 00 00
          </a>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" /> Cotonou, Bénin
          </div>
          <button
            onClick={() => navigate('/contact')}
            className="text-left text-muted-foreground hover:text-primary"
          >
            Contact
          </button>
        </div>
      </footer>
    </div>
  );
}
