import { useState } from 'react';
import { Info, Edit, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { parametreService } from '@/lib/services';
import { LoadingState } from '@/components/common/StateViews';
import { interpolateTemplate, TemplateVariables } from '@/lib/templateUtils';

const VARIABLES = [
  '{Prenom}', '{Nom}', '{Numero}', '{DateLivraison}',
  '{MontantTotal}', '{Acompte}', '{SoldeRestant}',
  '{TelephonePatisserie}', '{NomPatisserie}',
];

export default function MessagesPage() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const previewVars: TemplateVariables = {
    Prenom: 'Aminata',
    Nom: 'Koné',
    Numero: 'CMD-2026-ABC',
    DateLivraison: '25 mai 2026',
    MontantTotal: '15 000',
    Acompte: '7 500',
    SoldeRestant: '7 500',
    NomPatisserie: 'Ma Pâtisserie',
    TelephonePatisserie: '+22997000000',
  };

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => parametreService.templates(),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, contenu }: { id: number; contenu: string }) =>
      parametreService.updateTemplate(id, contenu),
    onSuccess: () => {
      toast.success('Template enregistré');
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  });

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setEditContent(t.contenu || t.content || '');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-primary" /> Messages WhatsApp
        </h1>
        <p className="text-muted-foreground text-sm">
          Personnalisez vos templates et envoyez des messages clients
        </p>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            Variables disponibles dans les templates
          </p>
          <div className="flex flex-wrap gap-2">
            {VARIABLES.map((v) => (
              <code
                key={v}
                className="text-xs bg-background border border-primary/20 text-primary px-2 py-1 rounded"
              >
                {v}
              </code>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-4">
          {(templates as any[]).length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun template disponible</p>
          )}
          {(templates as any[]).map((t: any) => (
            <Card key={t.id} className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">
                      {t.libelle || t.label || t.code}
                    </p>
                    {t.type && (
                      <code className="text-xs text-muted-foreground">{t.type}</code>
                    )}
                  </div>
                  {editingId !== t.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(t)}
                      className="gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" /> Modifier
                    </Button>
                  )}
                </div>

                {editingId === t.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={4}
                      className="text-sm"
                    />
                    <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-sm">
                      <p className="text-xs font-semibold mb-1 text-success">
                        Aperçu avec données exemple :
                      </p>
                      <p className="whitespace-pre-wrap">
                        {interpolateTemplate(editContent, previewVars)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          updateMut.mutate({ id: t.id, contenu: editContent })
                        }
                        disabled={updateMut.isPending}
                      >
                        Sauvegarder
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-secondary/40 rounded-lg text-sm text-muted-foreground whitespace-pre-wrap">
                    {t.contenu || t.content}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
