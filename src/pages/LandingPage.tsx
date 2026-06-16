import { useRef } from 'react';
import { CakeSlice, Truck, Sparkles, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, useInView, Variants } from 'framer-motion';
import { formatFCFA } from '@/lib/format';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

// ─── Reusable animation variants ─────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.7, ease: 'easeOut', delay },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const slideLeft: Variants = {
  hidden: { opacity: 0, x: -48 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const slideRight: Variants = {
  hidden: { opacity: 0, x: 48 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────

function RevealOnScroll({
  children,
  variants = fadeUp,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  variants?: Variants;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={variants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      custom={delay}
    >
      {children}
    </motion.div>
  );
}

// ─── Floating decoration shapes (hero bg) ────────────────────────────────────

function FloatingBlob({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-30 pointer-events-none ${className}`}
      animate={{ y: [0, -18, 0], scale: [1, 1.04, 1] }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const goCatalogue = () => {
    if (isAuthenticated && user?.role === 'ROLE_CLIENT') navigate('/app/catalogue');
    else navigate('/login');
  };

  const goProduct = (id: any) => {
    if (isAuthenticated && user?.role === 'ROLE_CLIENT')
      navigate(`/app/catalogue/${id}`);
    else navigate('/login');
  };

  const { data: produits = [], isLoading } = useQuery({
    queryKey: ['produits-public'],
    queryFn: () => api.get('/products').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
    throwOnError: false,
  });

  const featured = (produits as any[])
    .filter((p: any) => p.estActif ?? p.isActif ?? p.actif ?? true)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── Header ── */}
      <motion.header
        className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border"
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <img src="/favicon.ico" alt="Sweet Orders" className="w-8 h-8 object-contain" />
            </div>
            <span className="font-display text-lg font-semibold">Sweet Orders</span>
          </motion.div>

          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Button variant="ghost" onClick={() => navigate('/contact')}>Contact</Button>
            <Button variant="outline" onClick={() => navigate('/login')}>Se connecter</Button>
          </motion.div>
        </div>
      </motion.header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Animated background blobs */}
        <FloatingBlob className="w-96 h-96 bg-primary top-[-80px] left-[-100px]" delay={0} />
        <FloatingBlob className="w-72 h-72 bg-accent top-[40%] right-[-60px]" delay={2} />
        <FloatingBlob className="w-48 h-48 bg-primary/40 bottom-[-40px] left-[30%]" delay={4} />

        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/5" />

        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">

          {/* Left: text */}
          <motion.div
            variants={slideLeft}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              className="font-display text-4xl md:text-5xl font-bold leading-tight"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              Des gâteaux artisanaux livrés chez vous
            </motion.h1>

            <motion.p
              className="mt-4 text-lg text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Commandez en ligne, nous livrons à Cotonou et environs.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.6 }}
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" onClick={goCatalogue}>Voir le catalogue</Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" variant="secondary" onClick={() => navigate('/signup')}>
                  Créer un compte
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                  Se connecter
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right: hero image card */}
          <motion.div
            className="aspect-square rounded-3xl bg-gradient-to-br from-primary/30 to-accent/40 flex items-center justify-center shadow-xl"
            variants={slideRight}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02, rotate: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            {/* Floating logo inside */}
            <motion.img
              src="/favicon.ico"
              alt="Sweet Orders"
              className="w-20 h-20 object-contain drop-shadow-xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </div>
      </section>

      {/* ── Why us ── */}
      <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-6">
        {[
          { icon: CakeSlice, title: 'Fait maison', text: 'Pâtisseries artisanales préparées avec soin.' },
          { icon: Truck, title: 'Livraison à domicile', text: 'Partout à Cotonou et environs.' },
          { icon: Sparkles, title: '100% personnalisé', text: 'Vos messages et décors sur mesure.' },
        ].map((c, i) => (
          <RevealOnScroll key={c.title} variants={fadeUp} delay={i * 0.12}>
            <motion.div
              whileHover={{ y: -6, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Card className="text-center shadow-sm h-full">
                <CardContent className="p-6">
                  <motion.div
                    className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-3"
                    whileHover={{ rotate: 10, scale: 1.15 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <c.icon className="w-6 h-6 text-primary" />
                  </motion.div>
                  <h3 className="font-display text-lg font-semibold mb-1">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">{c.text}</p>
                </CardContent>
              </Card>
            </motion.div>
          </RevealOnScroll>
        ))}
      </section>

      {/* ── Featured products ── */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <RevealOnScroll variants={fadeUp}>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-6 text-center">
            Nos créations
          </h2>
        </RevealOnScroll>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="overflow-hidden shadow-sm">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            : featured.map((p: any, i: number) => {
                const nom = p.nom || p.name;
                const prix = p.prixBase ?? p.basePrice ?? 0;
                const photo = p.photoUrl || p.photo;

                return (
                  <RevealOnScroll key={p.id} variants={scaleIn} delay={i * 0.1}>
                    <motion.div
                      whileHover={{ y: -6 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    >
                      <Card className="overflow-hidden shadow-sm hover:shadow-lg transition-shadow h-full">
                        {/* Product image with zoom on hover */}
                        <div className="overflow-hidden aspect-[4/3]">
                          <motion.div
                            className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center bg-cover bg-center"
                            style={photo ? { backgroundImage: `url(${photo})` } : undefined}
                            whileHover={{ scale: 1.07 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                          >
                            {!photo && (
                              <img
                                src="/favicon.ico"
                                alt="Sweet Orders"
                                className="w-8 h-8 object-contain"
                              />
                            )}
                          </motion.div>
                        </div>

                        <CardContent className="p-4">
                          <h3 className="font-display font-semibold">{nom}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {p.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{formatFCFA(prix)}</span>
                            <motion.div
                              whileHover={{ scale: 1.06 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button size="sm" onClick={() => goProduct(p.id)}>
                                Commander
                              </Button>
                            </motion.div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </RevealOnScroll>
                );
              })}
        </div>
      </section>

      {/* ── Footer ── */}
      <motion.footer
        className="border-t border-border bg-card mt-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-4 gap-6 text-sm">
          <div className="flex items-center gap-2">
            <img src="/favicon.ico" alt="Sweet Orders" className="w-8 h-8 object-contain" />
            <span className="font-display font-semibold">Sweet Orders</span>
          </div>
          <a
            href="https://wa.me/22997000000"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Phone className="w-4 h-4" /> +229 97 00 00 00
          </a>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" /> Cotonou, Bénin
          </div>
          <motion.button
            onClick={() => navigate('/contact')}
            className="text-left text-muted-foreground hover:text-primary transition-colors"
            whileHover={{ x: 4 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            Contact
          </motion.button>
        </div>
      </motion.footer>
    </div>
  );
}

