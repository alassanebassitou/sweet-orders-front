import { Wallet } from 'lucide-react';

export default function FinancesPage() {
  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold mb-2">Finances</h1>
      <p className="text-muted-foreground text-sm mb-8">Dashboard financier et dépenses</p>
      <div className="text-center py-16 text-muted-foreground">
        <Wallet className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="font-medium">Module en construction</p>
        <p className="text-sm">Le module finances sera bientôt disponible</p>
      </div>
    </div>
  );
}
