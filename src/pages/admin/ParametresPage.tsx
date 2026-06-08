import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, MessageCircle, ArrowRight, Edit, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { parametreService } from '@/lib/services';
import { zoneService, type DeliveryZone } from '@/lib/zoneService';
import { LoadingState } from '@/components/common/StateViews';
import { formatFCFA } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function ParametresPage() {
  const qc = useQueryClient();
  const paramsQ = useQuery({ queryKey: ['parametres'], queryFn: parametreService.get });
  const zonesQ = useQuery({ queryKey: ['zones-livraison'], queryFn: () => zoneService.getAll() });

  const [params, setParams] = useState<any>({});
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [zoneForm, setZoneForm] = useState<{ name: string; quartier: string; fraisLivraison: number; description?: string }>({
    name: '', quartier: '', fraisLivraison: 0, description: '',
  });

  useEffect(() => { if (paramsQ.data) setParams(paramsQ.data); }, [paramsQ.data]);

  const updateMut = useMutation({
    mutationFn: (payload: any) => parametreService.update(payload),
    onSuccess: () => { toast.success('Paramètres enregistrés'); qc.invalidateQueries({ queryKey: ['parametres'] }); },
    onError: () => toast.error('Erreur'),
  });

  const saveZoneMut = useMutation({
    mutationFn: () => editingZone
      ? zoneService.update(editingZone.id, zoneForm)
      : zoneService.create(zoneForm),
    onSuccess: () => {
      toast.success(editingZone ? 'Zone modifiée' : 'Zone ajoutée');
      setZoneDialogOpen(false);
      setEditingZone(null);
      setZoneForm({ name: '', quartier: '', fraisLivraison: 0, description: '' });
      qc.invalidateQueries({ queryKey: ['zones-livraison'] });
    },
    onError: () => toast.error('Erreur'),
  });

  const removeZoneMut = useMutation({
    mutationFn: (id: number) => zoneService.delete(id),
    onSuccess: () => { toast.success('Zone supprimée'); qc.invalidateQueries({ queryKey: ['zones-livraison'] }); },
    onError: () => toast.error('Erreur'),
  });

  const openEditZone = (z: DeliveryZone) => {
    setEditingZone(z);
    setZoneForm({ name: z.name, quartier: z.quartier, fraisLivraison: z.fraisLivraison, description: z.description || '' });
    setZoneDialogOpen(true);
  };
  const openNewZone = () => {
    setEditingZone(null);
    setZoneForm({ name: '', quartier: '', fraisLivraison: 0, description: '' });
    setZoneDialogOpen(true);
  };

  if (paramsQ.isLoading) return <div className="p-6"><LoadingState /></div>;

  const zones = (zonesQ.data || []) as DeliveryZone[];

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground text-sm">Configuration de la pâtisserie</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Pâtisserie</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Nom</Label><Input value={params.namePatisserie || ''} onChange={(e) => setParams({ ...params, namePatisserie: e.target.value })} className="mt-1" /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Téléphone WhatsApp</Label><Input value={params.whatsappPhoneNumber || ''} onChange={(e) => setParams({ ...params, whatsappPhoneNumber: e.target.value })} className="mt-1" /></div>
            <div><Label>Email</Label><Input value={params.email || ''} onChange={(e) => setParams({ ...params, email: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label>Adresse</Label><Input value={params.address || ''} onChange={(e) => setParams({ ...params, address: e.target.value })} className="mt-1" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Configuration commandes</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3">
          <div><Label>Délai min. (heures)</Label><Input type="number" value={params.minimumDelayHour || 0} onChange={(e) => setParams({ ...params, minimumDelayHour: parseInt(e.target.value || '0', 10) })} className="mt-1" /></div>
          <div><Label>Acompte (%)</Label><Input type="number" value={params.depositPercentage || 0} onChange={(e) => setParams({ ...params, depositPercentage: parseInt(e.target.value || '0', 10) })} className="mt-1" /></div>
          <div><Label>Seuil surcharge / jour</Label><Input type="number" value={params.productionOverloadThreshold || 0} onChange={(e) => setParams({ ...params, productionOverloadThreshold: parseInt(e.target.value || '0', 10) })} className="mt-1" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Zones de livraison</CardTitle>
          <Button size="sm" onClick={openNewZone} className="gap-1"><Plus className="w-4 h-4" /> Nouvelle zone</Button>
        </CardHeader>
        <CardContent>
          {zones.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune zone</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="p-3 text-left">Ville</th>
                    <th className="p-3 text-left">Quartier</th>
                    <th className="p-3 text-right">Frais livraison</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((z) => (
                    <tr key={z.id} className={cn('border-b border-border', z.fraisLivraison === 0 && 'bg-amber-50')}>
                      <td className="p-3 font-medium">{z.name}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {z.fraisLivraison === 0 && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                          {z.quartier}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        {z.fraisLivraison > 0 ? (
                          <span className="font-semibold text-primary">{formatFCFA(z.fraisLivraison)}</span>
                        ) : (
                          <span className="text-xs text-amber-600 italic font-medium">À définir</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEditZone(z)} className="h-7 px-2">
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => removeZoneMut.mutate(z.id)} className="h-7 px-2 text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageCircle className="w-4 h-4 text-primary" /> Templates WhatsApp</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            La gestion des templates WhatsApp se fait maintenant dans une page dédiée.
          </p>
          <Link to="/admin/messages">
            <Button variant="outline" className="gap-2">
              Gérer les templates <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Button onClick={() => updateMut.mutate(params)} disabled={updateMut.isPending} className="gap-2">
        <Save className="w-4 h-4" /> Enregistrer
      </Button>

      <Dialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingZone ? 'Modifier la zone' : 'Nouvelle zone de livraison'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Ville *</Label>
              <Input value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} placeholder="Ex: Calavi" className="mt-1" />
            </div>
            <div>
              <Label>Quartier *</Label>
              <Input value={zoneForm.quartier} onChange={(e) => setZoneForm({ ...zoneForm, quartier: e.target.value })} placeholder="Ex: Godomey Salamey" className="mt-1" />
            </div>
            <div>
              <Label>Frais de livraison (FCFA) *</Label>
              <Input type="number" value={zoneForm.fraisLivraison} onChange={(e) => setZoneForm({ ...zoneForm, fraisLivraison: parseInt(e.target.value || '0', 10) })} placeholder="Ex: 1500" min={0} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Plusieurs quartiers peuvent avoir les mêmes frais. Entrez 0 si non encore défini.</p>
            </div>
            <div>
              <Label>Description (optionnel)</Label>
              <Input value={zoneForm.description || ''} onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })} placeholder="Ex: Zone périphérique" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZoneDialogOpen(false)}>Annuler</Button>
            <Button onClick={() => saveZoneMut.mutate()} disabled={!zoneForm.name || !zoneForm.quartier || saveZoneMut.isPending}>
              {editingZone ? 'Enregistrer' : 'Ajouter la zone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
