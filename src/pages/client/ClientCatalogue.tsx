import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CakeSlice } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockProduits } from '@/lib/mockData';
import { formatFCFA } from '@/lib/format';
import { cn } from '@/lib/utils';

const categories = [
  { value: 'ALL', label: 'Tous' },
  { value: 'CAKE', label: 'Cakes' },
  { value: 'CUPCAKE', label: 'Cupcakes' },
  { value: 'TARTE', label: 'Tartes' },
  { value: 'AUTRE', label: 'Autres' },
];

export default function ClientCatalogue() {
  const navigate = useNavigate();
  const [cat, setCat] = useState('ALL');
  const filtered = cat === 'ALL' ? mockProduits : mockProduits.filter((p) => p.categorie === cat);

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Notre Catalogue</h1>
        <p className="text-muted-foreground text-sm">Choisissez votre douceur</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        {categories.map((c) => (
          <button
            key={c.value}
            onClick={() => setCat(c.value)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors',
              cat === c.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-secondary'
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {filtered.map((p) => (
          <Card key={p.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/app/catalogue/${p.id}`)}>
            <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <CakeSlice className="w-12 h-12 text-primary/60" />
            </div>
            <CardContent className="p-3">
              <h3 className="font-medium text-sm">{p.nom}</h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-semibold text-primary">{formatFCFA(p.prixBase)}</span>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">Voir</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
