import { ChefHat } from 'lucide-react';

export default function ProductionPage() {
  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold mb-2">Production</h1>
      <p className="text-muted-foreground text-sm mb-8">Planning de production hebdomadaire</p>
      <div className="text-center py-16 text-muted-foreground">
        <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="font-medium">Module en construction</p>
        <p className="text-sm">Le planning de production sera bientôt disponible</p>
      </div>
    </div>
  );
}
