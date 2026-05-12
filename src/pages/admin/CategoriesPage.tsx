import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card } from '@/components/ui/card';
import { categoryService, CategoryRequest } from '@/lib/services';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/StateViews';

interface Category {
  id: number;
  name: string;
  description?: string;
  photoUrl?: string;
  createdAt?: string;
}

const emptyForm: CategoryRequest = { name: '', description: '', photoUrl: '' };

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryRequest>(emptyForm);

  const { data: categories = [], isLoading, isError, refetch } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  });

  const filtered = useMemo(
    () => categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [categories, search],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories'] });

  const createMutation = useMutation({
    mutationFn: (payload: CategoryRequest) => categoryService.create(payload),
    onSuccess: () => {
      invalidate();
      setCreateOpen(false);
      setForm(emptyForm);
      toast.success('Catégorie créée avec succès !');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CategoryRequest }) =>
      categoryService.update(id, payload),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      setForm(emptyForm);
      toast.success('Catégorie modifiée avec succès !');
    },
    onError: () => toast.error('Erreur lors de la modification'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryService.delete(id),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      toast.success('Catégorie supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const openCreate = () => { setForm(emptyForm); setCreateOpen(true); };
  const openEdit = (cat: Category) => {
    setForm({ name: cat.name, description: cat.description || '', photoUrl: cat.photoUrl || '' });
    setEditing(cat);
  };

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Le nom est requis'); return; }
    createMutation.mutate({
      name: form.name.trim(),
      description: form.description?.trim() || undefined,
      photoUrl: form.photoUrl?.trim() || undefined,
    });
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!form.name.trim()) { toast.error('Le nom est requis'); return; }
    updateMutation.mutate({
      id: editing.id,
      payload: {
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        photoUrl: form.photoUrl?.trim() || undefined,
      },
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-foreground">Catégories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {categories.length} catégorie{categories.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Nouvelle
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher une catégorie..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Aucune catégorie"
          description="Créez votre première catégorie de produits"
          action={
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" /> Créer une catégorie
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="Aucun résultat" description="Aucune catégorie ne correspond à votre recherche" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((cat) => (
            <Card key={cat.id} className="overflow-hidden flex flex-col">
              <div className="aspect-video w-full bg-secondary relative overflow-hidden">
                {cat.photoUrl ? (
                  <img src={cat.photoUrl} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                    <span className="font-display text-5xl font-semibold text-primary">
                      {cat.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-display text-lg font-semibold text-foreground">{cat.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2 flex-1">
                  {cat.description || 'Aucune description'}
                </p>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(cat)}>
                    <Pencil className="w-3.5 h-3.5" /> Modifier
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1 text-destructive hover:text-destructive" onClick={() => setDeleting(cat)}>
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={createOpen || !!editing}
        onOpenChange={(o) => { if (!o) { setCreateOpen(false); setEditing(null); setForm(emptyForm); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editing ? submitEdit : submitCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nom *</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Anniversaire, Mariage..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description de la catégorie..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-photo">Photo URL (optionnel)</Label>
              <Input
                id="cat-photo"
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                placeholder="Laissez vide pour une icône auto"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); setEditing(null); setForm(emptyForm); }}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Enregistrer les modifications' : 'Créer la catégorie'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la catégorie</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la catégorie « {deleting?.name} » ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
