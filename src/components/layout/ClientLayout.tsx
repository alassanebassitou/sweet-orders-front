import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom';
import { Home, CakeSlice, ClipboardList, User, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { connectWebSocket, disconnectWebSocket } from '@/lib/websocket';
import NotificationBell from '@/components/client/NotificationBell';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/app/home', label: 'Accueil', icon: Home },
  { path: '/app/catalogue', label: 'Catalogue', icon: CakeSlice },
  { path: '/app/commandes', label: 'Commandes', icon: ClipboardList },
  { path: '/app/profil', label: 'Profil', icon: User },
];

const STATUT_MESSAGES: Record<string, string> = {
  CONFIRMEE: '✅ Votre commande a été confirmée !',
  CONFIRMED: '✅ Votre commande a été confirmée !',
  EN_PRODUCTION: '👩‍🍳 Votre cake est en cours de préparation !',
  IN_PRODUCTION: '👩‍🍳 Votre cake est en cours de préparation !',
  PRETE: '🎂 Votre commande est prête !',
  READY: '🎂 Votre commande est prête !',
  LIVREE: '🚚 Votre commande a été livrée. Merci !',
  DELIVERED: '🚚 Votre commande a été livrée. Merci !',
  ANNULEE: '❌ Votre commande a été annulée.',
  CANCELLED: '❌ Votre commande a été annulée.',
};

export default function ClientLayout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const cartCount = useCartStore((s) => s.getCount());
  const location = useLocation();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    connectWebSocket(
      user.role,
      (event) => {
        if (event?.type === 'STATUT_CHANGED') {
          const { commandeId, statut, clientEmail } = event.payload || {};
          if (clientEmail && clientEmail !== user.email) return;
          const msg = STATUT_MESSAGES[statut];
          if (msg) toast(msg);
          qc.invalidateQueries({ queryKey: ['mes-commandes'] });
          if (commandeId) qc.invalidateQueries({ queryKey: ['commande', String(commandeId)] });
        }
      },
      () => {
        qc.invalidateQueries({ queryKey: ['notif-count'] });
        qc.invalidateQueries({ queryKey: ['notifications'] });
      }
    );
    return () => { disconnectWebSocket(); };
  }, [user, qc]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/app/home')} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <CakeSlice className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold">Sweet Orders</span>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((t) => (
              <NavLink
                key={t.path}
                to={t.path}
                className={({ isActive }) => cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-secondary'
                )}
              >
                {t.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <NotificationBell />
            <button
              onClick={() => navigate('/app/commander')}
              className="relative p-2 rounded-lg hover:bg-secondary"
              aria-label="Panier"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button onClick={() => navigate('/app/profil')} aria-label="Profil" className="ml-1 relative">
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                  {user?.prenom?.charAt(0) || user?.nom?.charAt(0) || 'C'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-card rounded-full" title="En ligne" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-card border-t border-border z-40">
        <div className="flex justify-around py-2">
          {tabs.map((t) => {
            const active = location.pathname.startsWith(t.path);
            return (
              <button
                key={t.path}
                onClick={() => navigate(t.path)}
                className={cn('flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium', active ? 'text-primary' : 'text-muted-foreground')}
              >
                <t.icon className="w-5 h-5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
