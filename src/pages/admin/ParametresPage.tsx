import { Settings } from 'lucide-react';

export default function ParametresPage() {
  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold mb-2">Paramètres</h1>
      <p className="text-muted-foreground text-sm mb-8">Configuration générale</p>
      <div className="text-center py-16 text-muted-foreground">
        <Settings className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="font-medium">Module en construction</p>
        <p className="text-sm">Les paramètres seront bientôt disponibles</p>
      </div>
    </div>
  );
}
