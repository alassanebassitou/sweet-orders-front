import { X, Phone, Mail, MapPin, Star, MessageCircle, UserCheck, UserX } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { commandeService, userService } from '@/lib/services';
import { statutColors } from '@/lib/constants';
import { formatFCFA } from '@/lib/format';
import { toast } from 'sonner';

export default function ClientDetailSheet({ client, onClose }: { client: any; onClose: () => void }) {
  const { data: cmds = [] } = useQuery({
    queryKey: ['client-commandes', client.id],
    queryFn: () => commandeService.listAdmin({ clientId: client.id }),
  });

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-card shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-lg font-semibold">Fiche client</h2>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-5">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary mb-3">
              {(client.firstname?.charAt(0) || '')}{(client.lastname?.charAt(0) || '')}
            </div>
            <h3 className="font-display text-xl font-bold">{client.firstname} {client.lastname}</h3>
            {(client.estVip || client.isVIP) && <Badge className="bg-warning/15 text-warning gap-1 mt-2"><Star className="w-3 h-3" /> VIP</Badge>}
          </div>
          <div className="space-y-2 text-sm">
            {client.telephone && <a href={`tel:${client.telephone}`} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary"><Phone className="w-4 h-4 text-primary" />{client.telephone}</a>}
            {client.email && <a href={`mailto:${client.email}`} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary"><Mail className="w-4 h-4 text-primary" />{client.email}</a>}
            {(client.address || client.city) && <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"><MapPin className="w-4 h-4 text-primary" />{[client.address, client.city].filter(Boolean).join(', ')}</div>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-primary/5 text-center">
              <p className="text-2xl font-bold font-display text-primary">{cmds.length}</p>
              <p className="text-xs text-muted-foreground">Commandes</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 text-center">
              <p className="text-lg font-bold font-display text-primary">{formatFCFA(cmds.reduce((s: number, c: any) => s + (c.totalAmount || 0), 0))}</p>
              <p className="text-xs text-muted-foreground">Total dépensé</p>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">Historique</h4>
            {cmds.length > 0 ? (
              <div className="space-y-2">
                {cmds.map((c: any) => {
                  const st = statutColors[c.status];
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <p className="text-sm font-medium">{c.numero}</p>
                        <p className="text-xs text-muted-foreground">{c.wishDeliveryDate}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className={`${st?.bg} ${st?.text} text-[10px]`}>{st?.label}</Badge>
                        <p className="text-xs font-medium mt-1">{formatFCFA(c.totalAmount || 0)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-4">Aucune commande</p>}
          </div>
          {client.telephone && (
            <Button className="w-full gap-2" onClick={() => window.open(`https://wa.me/${client.telephone.replace('+', '')}`, '_blank')}>
              <MessageCircle className="w-4 h-4" /> Contacter sur WhatsApp
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
