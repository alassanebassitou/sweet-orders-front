import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Minus, Plus, Trash2, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useQuery, useMutation } from '@tanstack/react-query';
import { commandeService, parametreService } from '@/lib/services';
import { formatFCFA } from '@/lib/format';

const steps = ['Panier', 'Livraison', 'Personnalisations', 'Récapitulatif', 'Confirmation'];

export default function ClientCommander() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, updateQuantite, removeItem, updateItem, clear, getTotal, getItemTotal } = useCartStore();
  const total = getTotal();

  const [step, setStep] = useState(0);
  const [dateLivraison, setDateLivraison] = useState('');
  const [creneau, setCreneau] = useState('matin');
  const [mode, setMode] = useState<'LIVRAISON_DOMICILE' | 'RETRAIT_SUR_PLACE'>('LIVRAISON_DOMICILE');
  const [adresse, setAdresse] = useState(user?.adresse || '');
  const [instructions, setInstructions] = useState('');
  const [orderNumber, setOrderNumber] = useState('');

  const acompteRequis = Math.round(total * mockParametres.pourcentageAcompte / 100);

  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const canNext = () => {
    if (step === 0) return items.length > 0;
    if (step === 1) return !!dateLivraison && (mode === 'RETRAIT_SUR_PLACE' || !!adresse);
    return true;
  };

  const handleConfirm = () => {
    const num = `CMD-2026-${Math.floor(Math.random() * 900 + 100)}`;
    setOrderNumber(num);
    setStep(4);
    toast.success('Commande envoyée !');
    // TODO: POST /api/v1/commandes
  };

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-3 mb-4">
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

      <Card>
        <CardContent className="p-4 md:p-6">
          {/* STEP 0 — Panier */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Mon panier</h2>
              {items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Votre panier est vide</p>
                  <Button onClick={() => navigate('/app/catalogue')} className="mt-4">Voir le catalogue</Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {items.map((it) => (
                      <div key={it.produitId} className="p-3 rounded-lg border border-border">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{it.nom}</p>
                            {it.personnalisations.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {it.personnalisations.map((p) => p.libelle).join(', ')}
                              </p>
                            )}
                            {it.messageGateau && (
                              <p className="text-xs text-muted-foreground italic">"{it.messageGateau}"</p>
                            )}
                          </div>
                          <button onClick={() => removeItem(it.produitId)} className="text-destructive p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantite(it.produitId, it.quantite - 1)}><Minus className="w-3 h-3" /></Button>
                            <span className="w-8 text-center text-sm font-semibold">{it.quantite}</span>
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantite(it.produitId, it.quantite + 1)}><Plus className="w-3 h-3" /></Button>
                          </div>
                          <span className="font-semibold text-sm">{formatFCFA(getItemTotal(it))}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-border flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatFCFA(total)}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 1 — Livraison */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Livraison</h2>
              <div>
                <Label>Date de livraison souhaitée</Label>
                <Input type="date" min={minDate} value={dateLivraison} onChange={(e) => setDateLivraison(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Créneau</Label>
                <RadioGroup value={creneau} onValueChange={setCreneau} className="mt-2 space-y-2">
                  {[['matin', 'Matin (8h-12h)'], ['apres-midi', 'Après-midi (12h-17h)'], ['soiree', 'Soirée (17h-20h)']].map(([v, l]) => (
                    <label key={v} className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-secondary/50">
                      <RadioGroupItem value={v} />
                      <span className="text-sm">{l}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label>Mode</Label>
                <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)} className="mt-2 space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-secondary/50">
                    <RadioGroupItem value="LIVRAISON_DOMICILE" />
                    <span className="text-sm">Livraison à domicile</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-secondary/50">
                    <RadioGroupItem value="RETRAIT_SUR_PLACE" />
                    <span className="text-sm">Retrait sur place</span>
                  </label>
                </RadioGroup>
              </div>
              {mode === 'LIVRAISON_DOMICILE' && (
                <>
                  <div>
                    <Label>Adresse</Label>
                    <Input value={adresse} onChange={(e) => setAdresse(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Instructions spéciales</Label>
                    <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} className="mt-1" />
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 2 — Personnalisations */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Personnalisations</h2>
              {items.map((it) => (
                <div key={it.produitId} className="p-3 rounded-lg border border-border space-y-2">
                  <p className="font-medium text-sm">{it.nom}</p>
                  <div>
                    <Label className="text-xs">Message sur le gâteau</Label>
                    <Input value={it.messageGateau || ''} onChange={(e) => updateItem(it.produitId, { messageGateau: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Allergènes</Label>
                    <Input value={it.allergenes || ''} onChange={(e) => updateItem(it.produitId, { allergenes: e.target.value })} className="mt-1" />
                  </div>
                  {it.personnalisations.length > 0 && (
                    <p className="text-xs text-muted-foreground">Options : {it.personnalisations.map((p) => p.libelle).join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* STEP 3 — Récapitulatif */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Récapitulatif</h2>
              <div className="p-3 rounded-lg bg-secondary/40 space-y-2">
                {items.map((it) => (
                  <div key={it.produitId} className="text-sm">
                    <div className="flex justify-between">
                      <span>🎂 {it.nom} ×{it.quantite}</span>
                      <span className="font-medium">{formatFCFA(getItemTotal(it))}</span>
                    </div>
                    {it.messageGateau && <p className="text-xs text-muted-foreground ml-6">Message : {it.messageGateau}</p>}
                    {it.personnalisations.map((p) => (
                      <p key={p.id} className="text-xs text-muted-foreground ml-6">+ {p.libelle}</p>
                    ))}
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-lg bg-secondary/40 text-sm space-y-1">
                <p>📅 {dateLivraison} — {creneau}</p>
                <p>{mode === 'LIVRAISON_DOMICILE' ? `📍 ${adresse}` : '🏪 Retrait sur place'}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 text-sm space-y-1">
                <div className="flex justify-between font-bold"><span>Total</span><span>{formatFCFA(total)}</span></div>
                <div className="flex justify-between text-primary"><span>Acompte requis ({mockParametres.pourcentageAcompte}%)</span><span>{formatFCFA(acompteRequis)}</span></div>
              </div>
            </div>
          )}

          {/* STEP 4 — Confirmation */}
          {step === 4 && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 className="w-20 h-20 mx-auto text-success" />
              <div>
                <h2 className="font-display text-2xl font-bold">Commande {orderNumber} envoyée !</h2>
                <p className="text-muted-foreground mt-1">L'acompte de {formatFCFA(acompteRequis)} est requis pour confirmer.</p>
              </div>
              <div className="flex flex-col gap-2 max-w-sm mx-auto">
                <Button onClick={() => { toast.info('Intégration Kkiapay à venir'); }}>Payer l'acompte maintenant</Button>
                <Button variant="outline" onClick={() => { clear(); navigate('/app/commandes'); }}>Payer plus tard</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      {step < 4 && (
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={() => step === 0 ? navigate('/app/catalogue') : setStep(step - 1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Catalogue' : 'Précédent'}
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="gap-2">
              Suivant <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleConfirm} className="gap-2 bg-success hover:bg-success/90 text-success-foreground">
              <Check className="w-4 h-4" /> Confirmer la commande
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
