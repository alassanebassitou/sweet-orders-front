import { useEffect, useMemo, useState } from 'react';
import { Plus, CakeSlice, Edit, Trash2, Upload, Image as ImageIcon, Loader2, X, Search } from 'lucide-react';
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

  // ── Filters / display state ──────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');       // raw input, updates every keystroke
  const [search, setSearch] = useState('');                 // debounced value actually used for filtering
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'>('name-asc');

  // ── Delete confirmation state ────────────────────────────────────────────
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | number | null>(null);

  // Debounce search input by 300ms so we don't re-filter the list on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

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
    onError: (e) => toast.error(e.message || 'Erreur création'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: Partial<Product> }) => productService.update(id, payload),
    onSuccess: () => { toast.success('Produit mis à jour'); invalidate(); setOpen(false); },
    onError: (e) => toast.error(e.message || 'Erreur mise à jour'),
  });
  const removeMut = useMutation({
    mutationFn: (id: string | number) => productService.remove(id),
    onSuccess: () => { toast.success('Produit désactivé'); invalidate(); setConfirmDeleteId(null); },
    onError: (e) => { toast.error(e.message || 'Erreur suppression'); setConfirmDeleteId(null); },
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
    const payload = { ...form, categoryId: form.category };
    if (editing) updateMut.mutate({ id: editing.id, payload: payload as any });
    else createMut.mutate(payload);
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

  // ── Derived list: filter + sort ──────────────────────────────────────────
  const filteredProduits = useMemo(() => {
    let list = [...(produits as any[])];

    // Text search on name + description
    if (search) {
      list = list.filter((p) => {
        const haystack = `${p.name || ''} ${p.description || ''}`.toLowerCase();
        return haystack.includes(search);
      });
    }

    // Category filter
    if (categoryFilter !== 'all') {
      list = list.filter((p) => {
        const catName = p.category || (categories as any[]).find((c: any) => c.id === p.categoryId)?.name;
        return String(catName) === categoryFilter;
      });
    }

    // Status filter
    if (statusFilter === 'active') list = list.filter((p) => p.isActif);
    if (statusFilter === 'inactive') list = list.filter((p) => !p.isActif);

    // Sort
    list.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return (a.name || '').localeCompare(b.name || '');
        case 'name-desc': return (b.name || '').localeCompare(a.name || '');
        case 'price-asc': return (a.basePrice || 0) - (b.basePrice || 0);
        case 'price-desc': return (b.basePrice || 0) - (a.basePrice || 0);
        default: return 0;
      }
    });

    return list;
  }, [produits, categories, search, categoryFilter, statusFilter, sortBy]);

  const hasActiveFilters = search !== '' || categoryFilter !== 'all' || statusFilter !== 'all';

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setSortBy('name-asc');
  };

  const productPendingDelete = (produits as any[]).find((p) => p.id === confirmDeleteId);

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Catalogue</h1>
          <p className="text-muted-foreground text-sm">
            {filteredProduits.length} produit(s)
            {hasActiveFilters && (produits as any[]).length !== filteredProduits.length
              ? ` sur ${(produits as any[]).length}`
              : ''}
          </p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Nouveau produit</Button>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher un produit..."
            className="pl-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {(categories as any[]).map((cat: any) => (
              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="inactive">Inactif</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Nom (A → Z)</SelectItem>
            <SelectItem value="name-desc">Nom (Z → A)</SelectItem>
            <SelectItem value="price-asc">Prix croissant</SelectItem>
            <SelectItem value="price-desc">Prix décroissant</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={resetFilters} className="gap-2 shrink-0">
            <X className="w-4 h-4" /> Réinitialiser
          </Button>
        )}
      </div>

      {isLoading ? <LoadingState /> :
       isError ? <ErrorState message="Impossible de charger le catalogue" onRetry={refetch} /> :
       (produits as any[]).length === 0 ? <EmptyState message="Aucun produit" icon={CakeSlice} /> :
       filteredProduits.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <SearchX className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Aucun produit ne correspond à ces filtres</p>
          <Button variant="outline" size="sm" onClick={resetFilters}>Réinitialiser les filtres</Button>
        </div>
       ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProduits.map((p: any) => (
            <Card key={p.id} className="overflow-hidden shadow-sm">
              <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                {p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="absolute inset-0 w-full h-full object-cover" /> : <CakeSlice className="w-12 h-12 text-primary/60" />}
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
                    <Button size="icon" variant="ghost" onClick={() => setConfirmDeleteId(p.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Edit/create dialog ── */}
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
                  value={form.category ? String(form.category) : ''}
                  onValueChange={(v) => setForm({ ...form, category: Number(v) })}
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

      {/* ── Delete confirmation dialog ── */}
      <Dialog open={confirmDeleteId !== null} onOpenChange={(v) => !v && setConfirmDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Désactiver ce produit ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {productPendingDelete
              ? `"${productPendingDelete.name}" sera désactivé et ne sera plus visible côté client.`
              : 'Ce produit sera désactivé.'}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => confirmDeleteId !== null && removeMut.mutate(confirmDeleteId)}
              disabled={removeMut.isPending}
            >
              Désactiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
