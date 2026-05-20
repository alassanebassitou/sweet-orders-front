import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Plus, Search, Trash2, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { commandeService, paiementService, productService, userService } from '@/lib/services';
import { formatFCFA } from '@/lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
}

const steps = ['Client', 'Produits', 'Livraison', 'Paiement', 'Récap'];

const MODES_PAIEMENT = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'MOBILE_MONEY', label: 'mobile Money' },
  { value: 'CART', label: 'Virement' },
  { value: 'OTHER', label: 'Autre' },
];

interface LigneProduit {
  produitId: any;
  productName: string;
  unitPrice: number;
  quantity: number;
  cakeMessage?: string;
  allergen?: string;
  customizationsJson?: string;
}

export default function NouvelleCommandeWizard({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);

  // Step 1 — Client
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClient, setNewClient] = useState({
    lastname: '', firstname: '', phone: '', email: '', address: '', city: '',
  });

  console.log("New client: ", newClient);

  // Step 2 — Produits
  const [lignes, setLignes] = useState<LigneProduit[]>([]);

  // Step 3 — Livraison
  const [dateLivraison, setDateLivraison] = useState('');
  const [creneau, setCreneau] = useState('matin');
  const [mode, setMode] = useState<'HOME_DELIVERY' | 'COLLECTION_ON_SITE'>('HOME_DELIVERY');
  const [adresse, setAdresse] = useState('');
  const [instructions, setInstructions] = useState('');

  // Step 4 — Paiement
  const [acompteRecu, setAcompteRecu] = useState<'oui' | 'non'>('non');
  const [paiement, setPaiement] = useState({
    amount: 0,
    paymentMode: 'CASH',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const usersQ = useQuery({
    queryKey: ['admin-users-search', search],
    queryFn: () => userService.listAdmin(search || undefined),
    enabled: step === 0 && !creatingClient,
  });

  const productsQ = useQuery({
    queryKey: ['products'],
    queryFn: productService.list,
    enabled: step === 1,
  });

  const createClientMut = useMutation({
    mutationFn: (payload: any) => userService.create({ ...payload, role: 'ROLE_CLIENT' }),
    onSuccess: (cli: any) => {
      toast.success('Client créé');
      setSelectedClient(cli);
      setCreatingClient(false);
    },
    onError: () => toast.error('Erreur création client'),
  });

  const total = lignes.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  const reset = () => {
    setStep(0);
    setSearch(''); setSelectedClient(null); setCreatingClient(false);
    setNewClient({ lastname: '', firstname: '', phone: '', email: '', address: '', city: '' });
    setLignes([]);
    setDateLivraison(''); setCreneau('matin'); setMode('HOME_DELIVERY'); setAdresse(''); setInstructions('');
    setAcompteRecu('non');
    setPaiement({ amount: 0, paymentMode: 'CASH', paymentDate: new Date().toISOString().split('T')[0], notes: '' });
  };

  const submitMut = useMutation({
    mutationFn: async () => {
      const payload = {
        clientId: selectedClient.id,
        wishDeliveryDate: dateLivraison,
        creneauHoraire: creneau,
        deliveryMode: mode,
        deliveryAddress: mode === 'HOME_DELIVERY' ? adresse : undefined,
        deliveryInstruction: instructions,
        source: 'MANUALLY',
        productRequests: lignes.map((l) => ({
          productId: l.produitId,
          quantity: l.quantity,
          cakeMessage: l.cakeMessage,
          allergen: l.allergen,
          customizationsJson: l.customizationsJson,
        })),
      };
      const cmd: any = await commandeService.create(payload);
      if (acompteRecu === 'oui' && paiement.amount > 0) {
        await paiementService.enregistrer({
          commandeId: cmd.id,
          amount: paiement.amount,
          paymentMode: paiement.paymentMode,
          paymentType: 'ACOMPTE',
          paymentDate: paiement.paymentDate,
          notes: paiement.notes,
        });
      }
      return cmd;
    },
    onSuccess: () => {
      toast.success('Commande créée');
      qc.invalidateQueries({ queryKey: ['commandes'] });
      reset();
      onClose();
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const canNext = () => {
    if (step === 0) return !!selectedClient;
    if (step === 1) return lignes.length > 0;
    if (step === 2) return !!dateLivraison && (mode === 'COLLECTION_ON_SITE' || !!adresse);
    if (step === 3) return acompteRecu === 'non' || (paiement.amount > 0);
    return true;
  };

  // ✅ Clear address when switching mode
const handleModeChange = (newMode: 'HOME_DELIVERY' | 'COLLECTION_ON_SITE') => {
  setMode(newMode);
  // Clear address when switching to pickup — prevents stale value blocking the button
  if (newMode === 'COLLECTION_ON_SITE') {
    setAdresse('');
    setInstructions('');
  }
};

  const addProduit = (p: any) => {
    setLignes((prev) => [...prev, {
      produitId: p.id,
      productName: p.name || p.nom,
      unitPrice: p.basePrice ?? p.prixBase ?? p.price ?? 0,
      quantity: 1,
    }]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-card shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-display text-lg font-semibold">Nouvelle commande (manuelle)</h2>
            <p className="text-xs text-muted-foreground">Étape {step + 1} sur {steps.length} — {steps[step]}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Step 0 — Client */}
          {step === 0 && (
            <div className="space-y-3">
              {selectedClient ? (
                <div className="p-3 rounded-lg border border-primary bg-primary/5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{selectedClient.firstname} {selectedClient.lastname}</p>
                    <p className="text-xs text-muted-foreground">{selectedClient.phone} · {selectedClient.email}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedClient(null)}>Changer</Button>
                </div>
              ) : creatingClient ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Prénom</Label><Input value={newClient.firstname} onChange={(e) => setNewClient({ ...newClient, firstname: e.target.value })} className="mt-1" /></div>
                    <div><Label>Nom</Label><Input value={newClient.lastname} onChange={(e) => setNewClient({ ...newClient, lastname: e.target.value })} className="mt-1" /></div>
                  </div>
                  <div><Label>Téléphone</Label><Input value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} className="mt-1" /></div>
                  <div><Label>Email</Label><Input type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} className="mt-1" /></div>
                  <div><Label>Adresse</Label><Input value={newClient.address} onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} className="mt-1" /></div>
                  <div><Label>Ville</Label><Input value={newClient.city} onChange={(e) => setNewClient({ ...newClient, city: e.target.value })} className="mt-1" /></div>
                  <div className="flex gap-2">
                    <Button onClick={() => createClientMut.mutate(newClient)} disabled={createClientMut.isPending || !newClient.firstname || !newClient.phone}>Créer</Button>
                    <Button variant="ghost" onClick={() => setCreatingClient(false)}>Annuler</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Rechercher un client..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                  </div>
                  <div className="border border-border rounded-lg max-h-64 overflow-y-auto">
                    {(usersQ.data || []).slice(0, 20).map((u: any) => (
                      <button key={u.id} onClick={() => setSelectedClient(u)} className="w-full text-left p-3 border-b border-border last:border-0 hover:bg-secondary/50">
                        <p className="text-sm font-medium">{u.firstname} {u.lastname}</p>
                        <p className="text-xs text-muted-foreground">{u.phone} · {u.email}</p>
                      </button>
                    ))}
                    {(usersQ.data || []).length === 0 && (
                      <p className="p-4 text-center text-xs text-muted-foreground">Aucun client trouvé</p>
                    )}
                  </div>
                  <Button variant="outline" onClick={() => setCreatingClient(true)} className="w-full gap-2">
                    <UserPlus className="w-4 h-4" /> Créer un nouveau client
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Step 1 — Produits */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Ajouter depuis le catalogue</Label>
                <Select onValueChange={(v) => {
                  const p = (productsQ.data || []).find((x: any) => String(x.id) === v);
                  if (p) addProduit(p);
                }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner un produit..." /></SelectTrigger>
                  <SelectContent>
                    {(productsQ.data || []).map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name} — {formatFCFA(p.basePrice ?? 0)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {lignes.map((l, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{l.productName}</p>
                      <button onClick={() => setLignes(lignes.filter((_, j) => j !== i))} className="text-destructive p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label className="text-xs">Quantité</Label><Input type="number" min={1} value={l.quantity} onChange={(e) => { const ll = [...lignes]; ll[i] = { ...l, quantity: parseInt(e.target.value || '1', 10) }; setLignes(ll); }} className="mt-1" /></div>
                      <div><Label className="text-xs">Prix unitaire</Label><Input value={formatFCFA(l.unitPrice)} disabled className="mt-1" /></div>
                    </div>
                    <div><Label className="text-xs">Message gâteau</Label><Input value={l.cakeMessage || ''} onChange={(e) => { const ll = [...lignes]; ll[i] = { ...l, cakeMessage: e.target.value }; setLignes(ll); }} className="mt-1" /></div>
                    <div><Label className="text-xs">Allergènes</Label><Input value={l.allergen || ''} onChange={(e) => { const ll = [...lignes]; ll[i] = { ...l, allergen: e.target.value }; setLignes(ll); }} className="mt-1" /></div>
                  </div>
                ))}
                {lignes.length > 0 && (
                  <div className="pt-2 flex justify-between font-bold">
                    <span>Total</span><span>{formatFCFA(total)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2 — Livraison */}
          {step === 2 && (
            <div className="space-y-3">
              <div><Label>Date livraison</Label><Input type="date" value={dateLivraison} onChange={(e) => setDateLivraison(e.target.value)} className="mt-1" /></div>
              <div>
                <Label>Créneau</Label>
                <Select value={creneau} onValueChange={setCreneau}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matin">Matin</SelectItem>
                    <SelectItem value="apres-midi">Après-midi</SelectItem>
                    <SelectItem value="soiree">Soirée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mode</Label>
                <RadioGroup value={mode} onValueChange={(v) => handleModeChange(v as any)} className="mt-2 space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer">
                    <RadioGroupItem value="HOME_DELIVERY" /><span className="text-sm">Livraison à domicile</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer">
                    <RadioGroupItem value="COLLECTION_ON_SITE" /><span className="text-sm">Retrait sur place</span>
                  </label>
                </RadioGroup>
              </div>
              {mode === 'HOME_DELIVERY' && (
                <>
                  <div><Label>Adresse</Label><Input value={adresse} onChange={(e) => setAdresse(e.target.value)} className="mt-1" /></div>
                  <div><Label>Instructions</Label><Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} className="mt-1" /></div>
                </>
              )}
            </div>
          )}

          {/* Step 3 — Paiement manuel */}
          {step === 3 && (
            <div className="space-y-3">
              <div>
                <Label>Un acompte a-t-il déjà été reçu ?</Label>
                <RadioGroup value={acompteRecu} onValueChange={(v) => setAcompteRecu(v as any)} className="mt-2 flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="oui" /> Oui</label>
                  <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="non" /> Non (à régler plus tard)</label>
                </RadioGroup>
              </div>
              {acompteRecu === 'oui' && (
                <div className="space-y-3 p-3 rounded-lg border border-border">
                  <div><Label>Montant reçu (FCFA)</Label><Input type="number" value={paiement.amount} onChange={(e) => setPaiement({ ...paiement, amount: parseInt(e.target.value || '0', 10) })} className="mt-1" /></div>
                  <div>
                    <Label>Mode de paiement</Label>
                    <Select value={paiement.paymentMode} onValueChange={(v) => setPaiement({ ...paiement, paymentMode: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MODES_PAIEMENT.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Date</Label><Input type="date" value={paiement.paymentDate} onChange={(e) => setPaiement({ ...paiement, paymentDate: e.target.value })} className="mt-1" /></div>
                  <div><Label>Notes</Label><Textarea value={paiement.notes} onChange={(e) => setPaiement({ ...paiement, notes: e.target.value })} placeholder="Reçu via WhatsApp..." className="mt-1" /></div>
                </div>
              )}
            </div>
          )}

          {/* Step 4 — Récap */}
          {step === 4 && (
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-lg bg-secondary/40">
                <p className="font-semibold">Client</p>
                <p>{selectedClient?.firstname} {selectedClient?.lastname} — {selectedClient?.telephone}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/40 space-y-1">
                <p className="font-semibold">Produits</p>
                {lignes.map((l, i) => (
                  <div key={i} className="flex justify-between"><span>{l.productName} ×{l.quantity}</span><span>{formatFCFA(l.unitPrice * l.quantity)}</span></div>
                ))}
                <div className="flex justify-between font-bold pt-2 border-t border-border"><span>Total</span><span>{formatFCFA(total)}</span></div>
              </div>
              <div className="p-3 rounded-lg bg-secondary/40">
                <p className="font-semibold">Livraison</p>
                <p>📅 {dateLivraison} — {creneau}</p>
                <p>{mode === 'HOME_DELIVERY' ? `📍 ${adresse}` : '🏪 Retrait sur place'}</p>
              </div>
              {acompteRecu === 'oui' && (
                <div className="p-3 rounded-lg bg-success/10">
                  <p className="font-semibold">Acompte reçu</p>
                  <p>{formatFCFA(paiement.amount)} via {MODES_PAIEMENT.find((m) => m.value === paiement.paymentMode)?.label}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex justify-between">
          <Button variant="outline" onClick={() => step === 0 ? onClose() : setStep(step - 1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Annuler' : 'Précédent'}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="gap-2">
              Suivant <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={() => submitMut.mutate()} disabled={submitMut.isPending} className="gap-2 bg-success hover:bg-success/90 text-success-foreground">
              <Check className="w-4 h-4" /> Créer la commande
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
