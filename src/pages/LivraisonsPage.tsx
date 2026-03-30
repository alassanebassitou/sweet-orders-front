import { Truck } from 'lucide-react';

export default function LivraisonsPage() {
  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold mb-2">Livraisons</h1>
      <p className="text-muted-foreground text-sm mb-8">Tournée du jour et calendrier</p>
      <div className="text-center py-16 text-muted-foreground">
        <Truck className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="font-medium">Module en construction</p>
        <p className="text-sm">La gestion des livraisons sera bientôt disponible</p>
      </div>
    </div>
  );
}
