import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <ShieldAlert className="w-16 h-16 mx-auto text-destructive mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Accès non autorisé</h1>
        <p className="text-muted-foreground mb-6">Vous n'avez pas accès à cette section.</p>
        <Button asChild><Link to="/login">Retour à la connexion</Link></Button>
      </div>
    </div>
  );
}
