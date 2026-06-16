import { useState } from 'react';
import { Phone, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { userService } from '@/lib/services';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function PhoneNumberModal({ open, onOpenChange }: Props) {
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  const handleSavePhone = async () => {
    if (phoneInput.length < 10) return;
    setSavingPhone(true);
    try {
      const fullPhone = '+229' + phoneInput;
      await userService.updatePhone(fullPhone);
      useAuthStore.setState((s) => ({
        user: s.user ? { ...s.user, telephone: fullPhone } : s.user,
      }));
      toast.success('Numéro WhatsApp enregistré ! 📱');
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSavingPhone(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <Phone className="w-7 h-7 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-center font-display text-xl">
            Votre numéro WhatsApp
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            Ajoutez votre numéro pour recevoir les mises à jour de vos commandes
            directement sur WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Numéro WhatsApp *</Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 border rounded-md bg-secondary text-sm font-medium text-muted-foreground min-w-fit">
                🇧🇯 +229
              </div>
              <Input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                placeholder="01 97 00 00 00"
                maxLength={10}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Ex: 01 97 00 00 00 (sans le +229)
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handleSavePhone}
            disabled={phoneInput.length < 10 || savingPhone}
          >
            {savingPhone ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Enregistrer mon numéro
              </>
            )}
          </Button>

          <button
            onClick={() => onOpenChange(false)}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground underline"
          >
            Passer pour l'instant (je le ferai plus tard)
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
