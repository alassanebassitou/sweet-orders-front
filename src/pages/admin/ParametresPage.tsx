import { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { mockParametres, mockZonesLivraison } from '@/lib/mockData';
import { formatFCFA } from '@/lib/format';

export default function ParametresPage() {
  const [params, setParams] = useState(mockParametres);
  const [zones, setZones] = useState(mockZonesLivraison);
  const [newZone, setNewZone] = useState({ nom: '', frais: 0 });

  const save = () => toast.success('Paramètres enregistrés');

  const addZone = () => {
    if (!newZone.nom) return;
    setZones((p) => [...p, { ...newZone, id: String(p.length + 1) }]);
    setNewZone({ nom: '', frais: 0 });
    toast.success('Zone ajoutée');
  };

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground text-sm">Configuration de la pâtisserie</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Pâtisserie</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Nom</Label><Input value={params.nomPatisserie} onChange={(e) => setParams({ ...params, nomPatisserie: e.target.value })} className="mt-1" /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Téléphone WhatsApp</Label><Input value={params.telephoneWhatsapp} onChange={(e) => setParams({ ...params, telephoneWhatsapp: e.target.value })} className="mt-1" /></div>
            <div><Label>Email</Label><Input value={params.email} onChange={(e) => setParams({ ...params, email: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label>Adresse</Label><Input value={params.adresse} onChange={(e) => setParams({ ...params, adresse: e.target.value })} className="mt-1" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Configuration commandes</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3">
          <div><Label>Délai min. (heures)</Label><Input type="number" value={params.delaiMinimumHeures} onChange={(e) => setParams({ ...params, delaiMinimumHeures: parseInt(e.target.value || '0', 10) })} className="mt-1" /></div>
          <div><Label>Acompte (%)</Label><Input type="number" value={params.pourcentageAcompte} onChange={(e) => setParams({ ...params, pourcentageAcompte: parseInt(e.target.value || '0', 10) })} className="mt-1" /></div>
          <div><Label>Seuil surcharge / jour</Label><Input type="number" value={params.seuilSurchargeProduction} onChange={(e) => setParams({ ...params, seuilSurchargeProduction: parseInt(e.target.value || '0', 10) })} className="mt-1" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Zones de livraison</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {zones.map((z) => (
            <div key={z.id} className="flex items-center justify-between p-2 rounded-lg border border-border">
              <div>
                <p className="font-medium text-sm">{z.nom}</p>
                <p className="text-xs text-muted-foreground">{formatFCFA(z.frais)}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setZones((p) => p.filter((x) => x.id !== z.id))}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2 pt-2 border-t border-border">
            <Input placeholder="Nom zone" value={newZone.nom} onChange={(e) => setNewZone({ ...newZone, nom: e.target.value })} />
            <Input type="number" placeholder="Frais" value={newZone.frais} onChange={(e) => setNewZone({ ...newZone, frais: parseInt(e.target.value || '0', 10) })} className="w-32" />
            <Button onClick={addZone} size="icon"><Plus className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Templates WhatsApp</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {([
            ['confirmation', 'Confirmation commande'],
            ['pretAEtreLivre', 'Commande prête'],
            ['rappelPaiement', 'Rappel paiement'],
            ['remerciement', 'Remerciement'],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <Label>{label}</Label>
              <Textarea
                value={params.templates[key]}
                onChange={(e) => setParams({ ...params, templates: { ...params.templates, [key]: e.target.value } })}
                className="mt-1"
                rows={2}
              />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Variables : {'{Prenom}'}, {'{Numero}'}, {'{Acompte}'}, {'{Solde}'}, {'{DateLivraison}'}</p>
        </CardContent>
      </Card>

      <Button onClick={save} className="gap-2"><Save className="w-4 h-4" /> Enregistrer</Button>
    </div>
  );
}
