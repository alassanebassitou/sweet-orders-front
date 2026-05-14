import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CakeSlice, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { productService } from '@/lib/services';
import { useCartStore } from '@/stores/cartStore';
import { formatFCFA } from '@/lib/format';
import { LoadingState, ErrorState } from '@/components/common/StateViews';
import { ReviewsSection } from '@/components/client/ReviewsSection';

export default function ClientProduitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const productQ = useQuery({ queryKey: ['produit', id], queryFn: () => productService.get(id!), enabled: !!id });
  const persosQ = useQuery({ queryKey: ['produit-persos', id], queryFn: () => productService.getPersonnalisations(id!), enabled: !!id });

  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [allergenes, setAllergenes] = useState('');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const product = productQ.data;
  const persos = persosQ.data || product?.customizations || [];

  const total = useMemo(() => {
    if (!product) return 0;
    const supp = persos.filter((p: any) => selected.includes(String(p.id))).reduce((s: number, p: any) => s + (p.additionalPrice || 0), 0);
    return (product.basePrice + supp) * qty;
  }, [product, persos, selected, qty]);

  if (productQ.isLoading) return <div className="p-6"><LoadingState /></div>;
  if (productQ.isError || !product) return <div className="p-6"><ErrorState message="Produit introuvable" onRetry={productQ.refetch} /></div>;

  const toggle = (pid: string) => setSelected((s) => (s.includes(pid) ? s.filter((x) => x !== pid) : [...s, pid]));

  const handleAdd = () => {
    addItem({
      produitId: String(product.id),
      nom: product.name,
      prixBase: product.basePrice,
      photoUrl: product.photoUrl,
      quantite: qty,
      personnalisations: persos.filter((p: any) => selected.includes(String(p.id))).map((p: any) => ({
        id: String(p.id), libelle: p.libelle, prixSupplementaire: p.additionalPrice || 0,
      })),
      messageGateau: message,
      allergenes,
    });
    setAdded(true);
    toast.success('Ajouté au panier');
  };

  const hasMessage = persos.some((p: any) => selected.includes(String(p.id)) && /message/i.test(p.libelle));

  return (
    <div className="animate-fade-in pb-32">
      <div className="aspect-[4/3] md:aspect-[16/7] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative">
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center hover:bg-card">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {product.photoUrl ? <img src={product.photoUrl} alt={product.name} className="w-full h-full object-cover" /> : <CakeSlice className="w-32 h-32 text-primary/60" />}
      </div>

      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground mt-1">{product.description}</p>
          <p className="font-semibold text-lg mt-3">Prix de base : {formatFCFA(product.basePrice)}</p>
        </div>

        {persos.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display font-semibold">Personnalisations</h2>
            {persos.map((p: any) => (
              <label key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer hover:bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Checkbox checked={selected.includes(String(p.id))} onCheckedChange={() => toggle(String(p.id))} />
                  <span className="text-sm">{p.libelle}</span>
                </div>
                <span className="text-sm font-medium text-primary">+{formatFCFA(p.additionalPrice || 0)}</span>
              </label>
            ))}
          </section>
        )}

        {hasMessage && (
          <div>
            <Label>Message à inscrire</Label>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Joyeux anniversaire..." className="mt-1" />
          </div>
        )}

        <div>
          <Label>Allergènes / notes</Label>
          <Textarea value={allergenes} onChange={(e) => setAllergenes(e.target.value)} placeholder="Sans noix, sans gluten..." className="mt-1" />
        </div>

        <div>
          <Label>Quantité</Label>
          <div className="flex items-center gap-3 mt-2">
            <Button size="icon" variant="outline" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="w-4 h-4" /></Button>
            <span className="w-10 text-center font-bold">{qty}</span>
            <Button size="icon" variant="outline" onClick={() => setQty(qty + 1)}><Plus className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Prix total</p>
            <p className="font-display text-xl font-bold">{formatFCFA(total)}</p>
          </div>
          {added ? (
            <Button onClick={() => navigate('/app/commander')} className="flex-1 max-w-xs">Voir le panier</Button>
          ) : (
            <Button onClick={handleAdd} className="flex-1 max-w-xs">Ajouter au panier</Button>
          )}
        </div>
      </div>
    </div>
  );
}
