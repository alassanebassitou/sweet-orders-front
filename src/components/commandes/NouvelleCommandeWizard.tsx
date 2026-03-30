import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X, Search, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockClients, mockProduits } from '@/lib/mockData';

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
}

interface Props {
  onClose: () => void;
}

const steps = ['Client', 'Produits', 'Livraison', 'Paiement', 'Récapitulatif'];

interface SelectedProduct {
  produitId: string;
  nom: string;
  quantite: number;
  prixUnitaire: number;
  message?: string;
}

export default function NouvelleCommandeWizard({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [dateLivraison, setDateLivraison] = useState('');
  const [creneauHoraire, setCreneauHoraire] = useState('');
  const [modeLivraison, setModeLivraison] = useState('LIVRAISON_DOMICILE');
  const [adresseLivraison, setAdresseLivraison] = useState('');
  const [instructionsLivraison, setInstructionsLivraison] = useState('');
  const [modePaiement, setModePaiement] = useState('ORANGE_MONEY');
  const [notesInternes, setNotesInternes] = useState('');

  const selectedClient = mockClients.find((c) => c.id === selectedClientId);
  const montantTotal = selectedProducts.reduce((sum, p) => sum + p.prixUnitaire * p.quantite, 0);
  const acompteRequis = Math.round(montantTotal * 0.5);

  const filteredClients = mockClients.filter(
    (c) =>
      c.nom.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.prenom.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.telephone.includes(clientSearch)
  );

  const addProduct = (p: typeof mockProduits[0]) => {
    const existing = selectedProducts.find((sp) => sp.produitId === p.id);
    if (existing) {
      setSelectedProducts(selectedProducts.map((sp) => sp.produitId === p.id ? { ...sp, quantite: sp.quantite + 1 } : sp));
    } else {
      setSelectedProducts([...selectedProducts, { produitId: p.id, nom: p.nom, quantite: 1, prixUnitaire: p.prixBase }]);
    }
  };

  const updateQty = (produitId: string, delta: number) => {
    setSelectedProducts(
      selectedProducts
        .map((sp) => sp.produitId === produitId ? { ...sp, quantite: Math.max(0, sp.quantite + delta) } : sp)
        .filter((sp) => sp.quantite > 0)
    );
  };

  const canNext = () => {
    if (step === 0) return !!selectedClientId;
    if (step === 1) return selectedProducts.length > 0;
    if (step === 2) return !!dateLivraison;
    return true;
  };

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg">
          <X className="w-5 h-5" />
        </button>
        <h1 className="font-display text-xl font-bold">Nouvelle commande</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              i < step ? 'bg-success text-success-foreground' : i === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:inline ${i === step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s}</span>
            {i < steps.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card className="shadow-sm">
        <CardContent className="p-4 md:p-6">
          {/* Step 0: Client */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold">Sélectionner un client</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Rechercher par nom ou téléphone..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredClients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedClientId(c.id); setAdresseLivraison(c.adresse); }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedClientId === c.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{c.prenom} {c.nom}</p>
                        <p className="text-xs text-muted-foreground">{c.telephone} — {c.ville}</p>
                      </div>
                      {c.estVip && <span className="text-xs bg-warning/15 text-warning px-2 py-0.5 rounded-full font-medium">VIP</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Produits */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold">Sélectionner les produits</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mockProduits.map((p) => {
                  const sel = selectedProducts.find((sp) => sp.produitId === p.id);
                  return (
                    <div key={p.id} className={`p-3 rounded-lg border transition-colors ${sel ? 'border-primary bg-primary/5' : 'border-border'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{p.nom}</p>
                          <p className="text-xs text-muted-foreground">{p.categorie}</p>
                        </div>
                        <p className="text-sm font-semibold">{formatFCFA(p.prixBase)}</p>
                      </div>
                      {sel ? (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateQty(p.id, -1)}><Minus className="w-3 h-3" /></Button>
                          <span className="text-sm font-bold w-8 text-center">{sel.quantite}</span>
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateQty(p.id, 1)}><Plus className="w-3 h-3" /></Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => addProduct(p)} className="w-full">Ajouter</Button>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedProducts.length > 0 && (
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between text-sm font-bold">
                    <span>Total</span>
                    <span>{formatFCFA(montantTotal)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Livraison */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold">Détails de livraison</h2>
              <div className="grid gap-4">
                <div>
                  <Label>Date de livraison *</Label>
                  <Input type="date" value={dateLivraison} onChange={(e) => setDateLivraison(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Créneau horaire</Label>
                  <Select value={creneauHoraire} onValueChange={setCreneauHoraire}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir un créneau" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="08:00-10:00">08h00 - 10h00</SelectItem>
                      <SelectItem value="10:00-12:00">10h00 - 12h00</SelectItem>
                      <SelectItem value="14:00-16:00">14h00 - 16h00</SelectItem>
                      <SelectItem value="16:00-18:00">16h00 - 18h00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mode de livraison</Label>
                  <Select value={modeLivraison} onValueChange={setModeLivraison}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LIVRAISON_DOMICILE">Livraison à domicile</SelectItem>
                      <SelectItem value="RETRAIT_SUR_PLACE">Retrait sur place</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {modeLivraison === 'LIVRAISON_DOMICILE' && (
                  <>
                    <div>
                      <Label>Adresse de livraison</Label>
                      <Input value={adresseLivraison} onChange={(e) => setAdresseLivraison(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label>Instructions de livraison</Label>
                      <Textarea value={instructionsLivraison} onChange={(e) => setInstructionsLivraison(e.target.value)} placeholder="Détails supplémentaires..." className="mt-1" />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Paiement */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold">Paiement</h2>
              <Card className="bg-secondary/50"><CardContent className="p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Montant total</span><span className="font-bold">{formatFCFA(montantTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Acompte requis (50%)</span><span className="font-bold text-primary">{formatFCFA(acompteRequis)}</span>
                </div>
              </CardContent></Card>
              <div>
                <Label>Mode de paiement</Label>
                <Select value={modePaiement} onValueChange={setModePaiement}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORANGE_MONEY">Orange Money</SelectItem>
                    <SelectItem value="WAVE">Wave</SelectItem>
                    <SelectItem value="MOOV">Moov Money</SelectItem>
                    <SelectItem value="ESPECES">Espèces</SelectItem>
                    <SelectItem value="VIREMENT">Virement</SelectItem>
                    <SelectItem value="CARTE">Carte bancaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes internes</Label>
                <Textarea value={notesInternes} onChange={(e) => setNotesInternes(e.target.value)} placeholder="Notes pour cette commande..." className="mt-1" />
              </div>
            </div>
          )}

          {/* Step 4: Récap */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold">Récapitulatif</h2>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Client</p>
                  <p className="font-medium text-sm">{selectedClient?.prenom} {selectedClient?.nom}</p>
                  <p className="text-xs text-muted-foreground">{selectedClient?.telephone}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Produits</p>
                  {selectedProducts.map((sp) => (
                    <div key={sp.produitId} className="flex justify-between text-sm py-0.5">
                      <span>{sp.nom} x{sp.quantite}</span>
                      <span className="font-medium">{formatFCFA(sp.prixUnitaire * sp.quantite)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold pt-2 mt-2 border-t border-border">
                    <span>Total</span><span>{formatFCFA(montantTotal)}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Livraison</p>
                  <p className="text-sm">{dateLivraison} — {creneauHoraire || 'Non précisé'}</p>
                  <p className="text-sm">{modeLivraison === 'LIVRAISON_DOMICILE' ? `📍 ${adresseLivraison}` : '🏪 Retrait sur place'}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Paiement</p>
                  <p className="text-sm">Acompte: {formatFCFA(acompteRequis)} — {modePaiement.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step === 0 ? onClose() : setStep(step - 1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Annuler' : 'Précédent'}
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="gap-2">
            Suivant <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={onClose} className="gap-2 bg-success hover:bg-success/90 text-success-foreground">
            <Check className="w-4 h-4" /> Confirmer la commande
          </Button>
        )}
      </div>
    </div>
  );
}
