import { useState } from 'react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { financeService } from '@/lib/services';
import { CATEGORIES_DEPENSES } from '@/lib/constants';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  commandeId?: string | number;
  onCreated?: () => void;
}

export default function AjouterDepenseDialog({ open, onOpenChange, commandeId, onCreated }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    category: 'INGREDIENTS',
    amount: 0,
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
  });

  const createMut = useMutation({
    mutationFn: (payload: any) => financeService.creerDepense(payload),
    onSuccess: () => {
      toast.success('Dépense ajoutée');
      qc.invalidateQueries({ queryKey: ['depenses'] });
      qc.invalidateQueries({ queryKey: ['depenses-commande', commandeId] });
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] });
      onOpenChange(false);
      onCreated?.();
    },
    onError: () => toast.error('Erreur'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{commandeId ? 'Dépense liée à la commande' : 'Nouvelle dépense'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Catégorie</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES_DEPENSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Montant (FCFA)</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: parseInt(e.target.value || '0', 10) })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={form.expenseDate}
              onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            onClick={() => createMut.mutate({ ...form, commandeId })}
            disabled={createMut.isPending || !form.amount}
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
