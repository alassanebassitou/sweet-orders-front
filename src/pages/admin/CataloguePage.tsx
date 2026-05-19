import { useEffect, useState } from 'react';
import { Plus, CakeSlice, Edit, Trash2, Upload, Image as ImageIcon, Loader2, X } from 'lucide-react';
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
import { productService, categoryService } from '@/lib/services';
import { formatFCFA } from '@/lib/format';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/StateViews';

interface Product {
  id: string | number;
  name: string;
  description?: string;
  basePrice: number;
  category?: string;
  categoryId?: number;
  isActif: boolean;
  photoUrl?: string;
  additionalPhotos?: string[];
}

interface FormData {
  name: string;
  description: string;
  basePrice: number;
  category: number | '';
}

export default function CataloguePage() {
  const qc = useQueryClient();
  const { data: produits = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: productService.list,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormData>({ name: '', description: '', basePrice: 0, category: '' });
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['products'] });

  const createMut = useMutation({
    mutationFn: (payload: FormData) => productService.create(payload),
    onSuccess: (created: any) => {
      toast.success('Produit créé');
      invalidate();
      // keep dialog open in edit mode so admin can upload photos
      setEditing(created);
      setPhotoUrl(created?.photoUrl || '');
      setAdditionalPhotos(created?.additionalPhotos || []);
    },
    onError: () => toast.error('Erreur création'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: Partial<Product> }) => productService.update(id, payload),
    onSuccess: () => { toast.success('Produit mis à jour'); invalidate(); setOpen(false); },
    onError: () => toast.error('Erreur mise à jour'),
  });
  const removeMut = useMutation({
    mutationFn: (id: string | number) => productService.remove(id),
    onSuccess: () => { toast.success('Produit désactivé'); invalidate(); },
    onError: () => toast.error('Erreur suppression'),
  });

  const openNew = () => {
    setEditing(null);
    setForm({
      name: '', description: '', basePrice: 0,
      category: (categories as any[])[0]?.name ?? '',
    });
    setPhotoUrl('');
    setAdditionalPhotos([]);
    setOpen(true);
  };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      basePrice: p.basePrice,
      category: p.category ?? (categories as any[]).find((c: any) => c.name === p.category)?.name ?? '',
    });
    setPhotoUrl(p.photoUrl || '');
    setAdditionalPhotos(p.additionalPhotos || []);
    setOpen(true);
  };

  useEffect(() => {
    if (!editing || !open) return;
    const fresh = (produits as any[]).find((x) => String(x.id) === String(editing.id));
    if (fresh) {
      setPhotoUrl(fresh.photoUrl || '');
      setAdditionalPhotos(fresh.additionalPhotos || []);
    }
  }, [produits, editing, open]);

  const save = () => {
    if (!form.name.trim()) { toast.error('Nom requis'); return; }
    if (!form.category) { toast.error('Catégorie requise'); return; }
    if (editing) updateMut.mutate({ id: editing.id, payload: form as any });
    else createMut.mutate(form);
  };
  const toggleActif = (p: any) => updateMut.mutate({ id: p.id, payload: { ...p, isActif: !p.isActif } });

  const productId = editing?.id;

  const handleMainPhotoUpload = async (file?: File) => {
    if (!file || !productId) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Fichier > 5MB'); return; }
    setUploadingMain(true);
    try {
      const updated = await productService.uploadMainPhoto(productId, file);
      setPhotoUrl(updated.photoUrl);
      invalidate();
      toast.success('Photo principale mise à jour !');
    } catch {
      toast.error("Erreur lors de l'envoi de la photo");
    } finally {
      setUploadingMain(false);
    }
  };

  const handleAddPhoto = async (file?: File) => {
    if (!file || !productId) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Fichier > 5MB'); return; }
    setUploadingExtra(true);
    try {
      const updated = await productService.addPhoto(productId, file);
      setAdditionalPhotos(updated.additionalPhotos || []);
      invalidate();
      toast.success('Photo ajoutée !');
    } catch {
      toast.error("Erreur lors de l'ajout de la photo");
    } finally {
      setUploadingExtra(false);
    }
  };

  const handleDeletePhoto = async (url: string) => {
    if (!productId) return;
    try {
      const updated = await productService.deletePhoto(productId, url);
      setAdditionalPhotos(updated.additionalPhotos || []);
      invalidate();
      toast.success('Photo supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Catalogue</h1>
          <p className="text-muted-foreground text-sm">{(produits as any[]).length} produit(s)</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Nouveau produit</Button>
      </div>

      {isLoading ? <LoadingState /> :
       isError ? <ErrorState message="Impossible de charger le catalogue" onRetry={refetch} /> :
       (produits as any[]).length === 0 ? <EmptyState message="Aucun produit" icon={CakeSlice} /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(produits as any[]).map((p: any) => (
            <Card key={p.id} className="overflow-hidden shadow-sm">
              <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                {p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" /> : <CakeSlice className="w-12 h-12 text-primary/60" />}
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.category || (categories as any[]).find((c: any) => c.id === p.categoryId)?.name}</p>
                  </div>
                  <Badge variant={p.isActif ? 'default' : 'secondary'} className="text-[10px]">
                    {p.isActif ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                <p className="font-semibold text-primary">{formatFCFA(p.basePrice)}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <Switch checked={p.isActif} onCheckedChange={() => toggleActif(p)} />
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nom</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Prix de base (FCFA)</Label><Input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: parseInt(e.target.value || '0', 10) })} className="mt-1" /></div>
              <div>
                <Label>Catégorie</Label>
                <Select
                  value={form.categoryId ? String(form.categoryId) : ''}
                  onValueChange={(v) => setForm({ ...form, categoryId: Number(v) })}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    {(categories as any[]).map((cat: any) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Main image */}
            <div className="space-y-2">
              <Label>Photo principale</Label>
              {!productId && (
                <p className="text-xs text-muted-foreground">Enregistrez le produit pour pouvoir ajouter des photos.</p>
              )}
              {productId && (photoUrl ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border group">
                  <img src={photoUrl} alt="Product" className="w-full h-full object-cover" />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="text-white text-center">
                      <Upload className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-sm">Changer la photo</span>
                    </div>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleMainPhotoUpload(e.target.files?.[0])} />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-secondary transition-colors">
                  <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Cliquez pour ajouter une photo</span>
                  <span className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP — max 5MB</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleMainPhotoUpload(e.target.files?.[0])} />
                </label>
              ))}
              {uploadingMain && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...
                </div>
              )}
            </div>

            {/* Additional images */}
            {productId && (
              <div className="space-y-2">
                <Label>Photos supplémentaires</Label>
                <div className="grid grid-cols-3 gap-2">
                  {additionalPhotos.map((url, i) => (
                    <div key={url + i} className="relative aspect-square rounded-lg overflow-hidden border group">
                      <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(url)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {additionalPhotos.length < 5 && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors">
                      <div className="text-center">
                        {uploadingExtra ? (
                          <Loader2 className="w-5 h-5 mx-auto animate-spin text-muted-foreground" />
                        ) : (
                          <Plus className="w-5 h-5 mx-auto text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">Ajouter</span>
                      </div>
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleAddPhoto(e.target.files?.[0])} />
                    </label>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Maximum 5 photos supplémentaires</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Fermer</Button>
            <Button onClick={save} disabled={createMut.isPending || updateMut.isPending}>
              {editing ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
