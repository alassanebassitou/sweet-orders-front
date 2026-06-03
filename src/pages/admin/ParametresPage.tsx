import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, MessageCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parametreService } from '@/lib/services';
import { LoadingState } from '@/components/common/StateViews';
import { formatFCFA } from '@/lib/format';

export default function ParametresPage() {
  const qc = useQueryClient();
  const paramsQ = useQuery({ queryKey: ['parametres'], queryFn: parametreService.get });
  const zonesQ = useQuery({ queryKey: ['zones'], queryFn: parametreService.zones });

  const [params, setParams] = useState<any>({});
  const [newZone, setNewZone] = useState({ name: '', deliveryFrees: 0 });

  useEffect(() => { if (paramsQ.data) setParams(paramsQ.data); }, [paramsQ.data]);

  const updateMut = useMutation({
    mutationFn: (payload: any) => parametreService.update(payload),
    onSuccess: () => { toast.success('Paramètres enregistrés'); qc.invalidateQueries({ queryKey: ['parametres'] }); },
    onError: () => toast.error('Erreur'),
  });

  const addZoneMut = useMutation({
    mutationFn: (payload: any) => parametreService.creerZone(payload),
    onSuccess: () => { toast.success('Zone ajoutée'); setNewZone({ name: '', deliveryFrees: 0 }); qc.invalidateQueries({ queryKey: ['zones'] }); },
    onError: () => toast.error('Erreur'),
  });

  const removeZoneMut = useMutation({
    mutationFn: (id: any) => parametreService.supprimerZone(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zones'] }),
    onError: () => toast.error('Erreur'),
  });

  if (paramsQ.isLoading) return <div className="p-6"><LoadingState /></div>;

  const zones = zonesQ.data || [];

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
        <CardHeader><CardTitle className="text-base">Zones de livraison</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {zones.length === 0 && <p className="text-sm text-muted-foreground">Aucune zone</p>}
          {zones.map((z: any) => (
            <div key={z.id} className="flex items-center justify-between p-2 rounded-lg border border-border">
              <div>
                <p className="font-medium text-sm">{z.name}</p>
                <p className="text-xs text-muted-foreground">{formatFCFA(z.frais || z.deliveryFrees || 0)}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => removeZoneMut.mutate(z.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2 pt-2 border-t border-border">
            <Input placeholder="Nom zone" value={newZone.name} onChange={(e) => setNewZone({ ...newZone, name: e.target.value })} />
            <Input type="number" placeholder="Frais" value={newZone.deliveryFrees} onChange={(e) => setNewZone({ ...newZone, deliveryFrees: parseInt(e.target.value || '0', 10) })} className="w-32" />
            <Button onClick={() => newZone.name && addZoneMut.mutate(newZone)} size="icon"><Plus className="w-4 h-4" /></Button>
          </div>
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
    </div>
  );
}
