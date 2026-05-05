import { useState } from 'react';
import { Plus, CakeSlice, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { produitService } from '@/lib/services';
import { formatFCFA } from '@/lib/format';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/StateViews';

export default function CataloguePage() {
  const qc = useQueryClient();
  const { data: produits = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['produits'],
    queryFn: produitService.list,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ nom: '', description: '', prixBase: 0, categorie: 'CAKE' });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['produits'] });

  const createMut = useMutation({
    mutationFn: (payload: any) => produitService.create(payload),
    onSuccess: () => { toast.success('Produit créé'); invalidate(); setOpen(false); },
    onError: () => toast.error('Erreur création'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: any) => produitService.update(id, payload),
    onSuccess: () => { toast.success('Produit mis à jour'); invalidate(); setOpen(false); },
    onError: () => toast.error('Erreur mise à jour'),
  });
  const removeMut = useMutation({
    mutationFn: (id: any) => produitService.remove(id),
    onSuccess: () => { toast.success('Produit désactivé'); invalidate(); },
    onError: () => toast.error('Erreur suppression'),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ nom: '', description: '', prixBase: 0, categorie: 'CAKE' });
    setOpen(true);
  };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ nom: p.nom, description: p.description || '', prixBase: p.prixBase, categorie: p.categorie });
    setOpen(true);
  };
  const save = () => {
    if (editing) updateMut.mutate({ id: editing.id, payload: form });
    else createMut.mutate(form);
  };
  const toggleActif = (p: any) => updateMut.mutate({ id: p.id, payload: { ...p, estActif: !p.estActif } });

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Catalogue</h1>
          <p className="text-muted-foreground text-sm">{produits.length} produit(s)</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Nouveau produit</Button>
      </div>

      {isLoading ? <LoadingState /> :
       isError ? <ErrorState message="Impossible de charger le catalogue" onRetry={refetch} /> :
       produits.length === 0 ? <EmptyState message="Aucun produit" icon={CakeSlice} /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {produits.map((p: any) => (
            <Card key={p.id} className="overflow-hidden shadow-sm">
              <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                {p.photoUrl ? <img src={p.photoUrl} alt={p.nom} className="w-full h-full object-cover" /> : <CakeSlice className="w-12 h-12 text-primary/60" />}
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold">{p.nom}</h3>
                    <p className="text-xs text-muted-foreground">{p.categorie}</p>
                  </div>
                  <Badge variant={p.estActif ? 'default' : 'secondary'} className="text-[10px]">
                    {p.estActif ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                <p className="font-semibold text-primary">{formatFCFA(p.prixBase)}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <Switch checked={p.estActif} onCheckedChange={() => toggleActif(p)} />
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => removeMut.mutate(p.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nom</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Prix de base (FCFA)</Label><Input type="number" value={form.prixBase} onChange={(e) => setForm({ ...form, prixBase: parseInt(e.target.value || '0', 10) })} className="mt-1" /></div>
              <div>
                <Label>Catégorie</Label>
                <Select value={form.categorie} onValueChange={(v) => setForm({ ...form, categorie: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAKE">Cake</SelectItem>
                    <SelectItem value="CUPCAKE">Cupcake</SelectItem>
                    <SelectItem value="TARTE">Tarte</SelectItem>
                    <SelectItem value="AUTRE">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} disabled={createMut.isPending || updateMut.isPending}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
