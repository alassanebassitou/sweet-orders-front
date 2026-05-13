import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Wallet, ShieldAlert, MessageCircle, Home, RotateCw, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatFCFA } from '@/lib/format';

const ADMIN_PHONE_FALLBACK = '22500000000';

function useParametres() {
  return useQuery({
    queryKey: ['parametres-public'],
    queryFn: () => api.get('/parametres').then(r => r.data),
    retry: 1,
  });
}

/* ─────────── SUCCESS ─────────── */
function SuccessScenario({
  commandeId,
  transactionId,
  amount,
  onViewOrder,
  onHome,
}: {
  commandeId: string | null;
  transactionId: string | null;
  amount: string | null;
  onViewOrder: () => void;
  onHome: () => void;
}) {
  const amt = amount ? parseInt(amount, 10) : 0;
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-[#3E2723]">Paiement effectué avec succès !</h1>
        <p className="text-muted-foreground">
          Votre acompte de <span className="font-semibold text-foreground">{formatFCFA(amt)}</span> a bien été reçu.
        </p>
      </div>

      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <ClipboardList className="w-4 h-4 text-primary" />
            <span className="font-semibold">Récapitulatif</span>
          </div>
          <div className="flex justify-between"><span className="text-muted-foreground">Commande</span><span className="font-medium">CMD-{commandeId || '---'}</span></div>
          {transactionId && <div className="flex justify-between"><span className="text-muted-foreground">Transaction</span><span className="font-medium font-mono text-xs">{transactionId}</span></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">Montant</span><span className="font-medium">{formatFCFA(amt)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{today}</span></div>
          <div className="flex justify-between text-green-600"><span>Statut</span><span className="font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Confirmé</span></div>
        </CardContent>
      </Card>

      <p className="text-sm text-center text-muted-foreground">
        La pâtissière a été notifiée.<br />
        Vous recevrez une confirmation de votre commande très bientôt.
      </p>

      <div className="space-y-2">
        <Button onClick={onViewOrder} className="w-full bg-[#C97B5A] hover:bg-[#B56A4A] text-white">
          Voir ma commande
        </Button>
        <Button onClick={onHome} variant="outline" className="w-full">
          <Home className="w-4 h-4 mr-2" /> Retour à l'accueil
        </Button>
      </div>
    </div>
  );
}

/* ─────────── ERROR ─────────── */
function ErrorScenario({
  commandeId,
  adminPhone,
  onRetry,
  onViewOrder,
}: {
  commandeId: string | null;
  adminPhone: string;
  onRetry: () => void;
  onViewOrder: () => void;
}) {
  const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(
    `Bonjour, j'ai rencontré une erreur technique lors du paiement de ma commande ${commandeId || ''}. Pouvez-vous m'aider ?`
  )}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-red-900">Une erreur est survenue</h1>
        <p className="text-muted-foreground">
          Le paiement n'a pas pu être traité en raison d'une erreur technique.
        </p>
      </div>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4 space-y-2 text-sm">
          <p className="font-semibold text-yellow-900">Que s'est-il passé ?</p>
          <p className="text-yellow-800">
            Une erreur technique a empêché le traitement de votre paiement. Votre compte n'a pas été débité.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Button onClick={onRetry} className="w-full gap-2 bg-[#C97B5A] hover:bg-[#B56A4A] text-white">
          <RotateCw className="w-4 h-4" /> Réessayer le paiement
        </Button>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
          <Button variant="outline" className="w-full gap-2">
            <MessageCircle className="w-4 h-4" /> Contacter le support
          </Button>
        </a>
        <Button onClick={onViewOrder} variant="ghost" className="w-full">
          Voir ma commande
        </Button>
      </div>
    </div>
  );
}

/* ─────────── INSUFFICIENT FUNDS ─────────── */
function InsufficientFundsScenario({
  commandeId,
  amount,
  adminPhone,
  onRetry,
}: {
  commandeId: string | null;
  amount: string | null;
  adminPhone: string;
  onRetry: () => void;
}) {
  const amt = amount ? parseInt(amount, 10) : 0;
  const whatsappMessage = encodeURIComponent(
    `Bonjour, je souhaite payer mon acompte pour la commande ${commandeId || ''} autrement. Pouvez-vous m'aider ?`
  );
  const whatsappUrl = `https://wa.me/${adminPhone}?text=${whatsappMessage}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
          <Wallet className="w-10 h-10 text-orange-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-orange-900">Solde insuffisant</h1>
        <p className="text-muted-foreground">
          Votre compte Mobile Money ne dispose pas du solde suffisant pour effectuer ce paiement.
        </p>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 space-y-3 text-sm">
          <p className="font-semibold text-blue-900">Solutions possibles</p>
          <ol className="list-decimal list-inside space-y-1.5 text-blue-800">
            <li>Rechargez votre compte Mobile Money et réessayez</li>
            <li>Utilisez un autre moyen de paiement (autre numéro, carte bancaire)</li>
            <li>Contactez-nous pour payer en espèces à la livraison</li>
          </ol>
        </CardContent>
      </Card>

      {amt > 0 && (
        <p className="text-center text-sm">
          Montant requis : <span className="font-semibold">{formatFCFA(amt)}</span>
        </p>
      )}

      <div className="space-y-2">
        <Button onClick={onRetry} className="w-full gap-2 bg-[#C97B5A] hover:bg-[#B56A4A] text-white">
          <RotateCw className="w-4 h-4" /> Réessayer avec un autre compte
        </Button>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
          <Button variant="outline" className="w-full gap-2">
            <MessageCircle className="w-4 h-4" /> Payer autrement via WhatsApp
          </Button>
        </a>
      </div>
    </div>
  );
}

/* ─────────── DECLINED ─────────── */
function DeclinedScenario({
  commandeId,
  adminPhone,
  onRetry,
  onViewOrder,
}: {
  commandeId: string | null;
  adminPhone: string;
  onRetry: () => void;
  onViewOrder: () => void;
}) {
  const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(
    `Bonjour, mon paiement pour la commande ${commandeId || ''} a été refusé. Pouvez-vous m'aider ?`
  )}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-amber-900">Paiement refusé</h1>
        <p className="text-muted-foreground">
          Votre paiement a été refusé. Cela peut arriver pour plusieurs raisons de sécurité.
        </p>
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4 space-y-2 text-sm">
          <p className="font-semibold text-amber-900">Raisons possibles</p>
          <ul className="list-disc list-inside space-y-1 text-amber-800">
            <li>Limite journalière atteinte sur votre compte Mobile Money</li>
            <li>Transaction bloquée par votre opérateur pour sécurité</li>
            <li>Code PIN incorrect saisi plusieurs fois</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4 space-y-1 text-sm">
          <p className="font-semibold text-green-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Votre commande est préservée
          </p>
          <p className="text-green-800">
            Votre commande n°{commandeId || '---'} existe toujours. Le paiement peut être effectué plus tard.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Button onClick={onRetry} className="w-full gap-2 bg-[#C97B5A] hover:bg-[#B56A4A] text-white">
          <RotateCw className="w-4 h-4" /> Réessayer le paiement
        </Button>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
          <Button variant="outline" className="w-full gap-2">
            <MessageCircle className="w-4 h-4" /> Contacter la pâtissière
          </Button>
        </a>
        <Button onClick={onViewOrder} variant="ghost" className="w-full gap-2">
          <ClipboardList className="w-4 h-4" /> Voir ma commande
        </Button>
      </div>
    </div>
  );
}

/* ─────────── MAIN PAGE ─────────── */
export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const status = searchParams.get('status') as 'success' | 'error' | 'insufficient_funds' | 'declined' | null;
  const commandeId = searchParams.get('commandeId');
  const transactionId = searchParams.get('transactionId');
  const amount = searchParams.get('amount');

  const { data: params } = useParametres();
  const adminPhone = params?.telephoneWhatsapp || ADMIN_PHONE_FALLBACK;

  const bgClass = {
    success: 'bg-gradient-to-b from-green-50 to-white',
    error: 'bg-gradient-to-b from-red-50 to-white',
    insufficient_funds: 'bg-gradient-to-b from-orange-50 to-white',
    declined: 'bg-gradient-to-b from-amber-50 to-white',
  }[status || 'error'];

  const handleViewOrder = () => {
    if (commandeId) navigate(`/app/commandes/${commandeId}`);
    else navigate('/app/commandes');
  };

  const handleRetry = () => {
    if (commandeId) navigate(`/app/commandes/${commandeId}`);
    else navigate('/app/commandes');
  };

  const scenarios: Record<string, React.ReactNode> = {
    success: (
      <SuccessScenario
        commandeId={commandeId}
        transactionId={transactionId}
        amount={amount}
        onViewOrder={handleViewOrder}
        onHome={() => navigate('/app/home')}
      />
    ),
    error: (
      <ErrorScenario
        commandeId={commandeId}
        adminPhone={adminPhone}
        onRetry={handleRetry}
        onViewOrder={handleViewOrder}
      />
    ),
    insufficient_funds: (
      <InsufficientFundsScenario
        commandeId={commandeId}
        amount={amount}
        adminPhone={adminPhone}
        onRetry={handleRetry}
      />
    ),
    declined: (
      <DeclinedScenario
        commandeId={commandeId}
        adminPhone={adminPhone}
        onRetry={handleRetry}
        onViewOrder={handleViewOrder}
      />
    ),
  };

  return (
    <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4`}>
      <div className="max-w-md w-full">
        {scenarios[status || 'error']}
      </div>
    </div>
  );
}
