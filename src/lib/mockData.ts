// Mock data for development without backend

export const mockDashboard = {
  commandesEnCours: 12,
  commandesAujourdhui: 3,
  revenuesMois: 485000,
  impayesTotal: 67000,
  livraisonsAujourdhui: 4,
  productionJour: 5,
  alertes: [
    { id: '1', type: 'ACOMPTE_MANQUANT', message: 'Acompte manquant pour commande #CMD-042', commandeId: '1' },
    { id: '2', type: 'SURCHARGE_PRODUCTION', message: '6 commandes prévues le 02/04 — capacité dépassée', commandeId: null },
    { id: '3', type: 'ANNIVERSAIRE_CLIENT', message: 'Anniversaire de Fatou Diallo dans 2 jours', clientId: '3' },
  ],
  commandesRecentes: [
    { id: '1', numero: 'CMD-045', client: 'Aminata Kone', produit: 'Wedding Cake 3 étages', montant: 85000, statut: 'CONFIRMEE', dateLivraison: '2026-04-02' },
    { id: '2', numero: 'CMD-044', client: 'Fatou Diallo', produit: 'Cupcakes x24', montant: 36000, statut: 'EN_PRODUCTION', dateLivraison: '2026-04-01' },
    { id: '3', numero: 'CMD-043', client: 'Marie Sossou', produit: 'Tarte aux fruits', montant: 18000, statut: 'PRETE', dateLivraison: '2026-03-31' },
    { id: '4', numero: 'CMD-042', client: 'Aïcha Bello', produit: 'Cake anniversaire', montant: 25000, statut: 'PENDING_CONFIRMATION', dateLivraison: '2026-04-03' },
    { id: '5', numero: 'CMD-041', client: 'Grace Adeyemi', produit: 'Number Cake 30', montant: 45000, statut: 'LIVREE', dateLivraison: '2026-03-29' },
  ],
  livraisonsAVenir: [
    { id: '1', client: 'Marie Sossou', adresse: '123 Rue du Commerce, Cotonou', heure: '10:00', produit: 'Tarte aux fruits' },
    { id: '2', client: 'Aminata Kone', adresse: '45 Av. Steinmetz, Cotonou', heure: '14:00', produit: 'Wedding Cake 3 étages' },
    { id: '3', client: 'Fatou Diallo', adresse: '78 Bd St Michel, Porto-Novo', heure: '16:30', produit: 'Cupcakes x24' },
  ],
  revenus30j: [
    { date: '01/03', montant: 25000 }, { date: '03/03', montant: 18000 },
    { date: '05/03', montant: 45000 }, { date: '08/03', montant: 32000 },
    { date: '10/03', montant: 58000 }, { date: '12/03', montant: 22000 },
    { date: '15/03', montant: 67000 }, { date: '17/03', montant: 41000 },
    { date: '19/03', montant: 35000 }, { date: '22/03', montant: 52000 },
    { date: '24/03', montant: 48000 }, { date: '27/03', montant: 72000 },
    { date: '29/03', montant: 38000 },
  ],
  topProduits: [
    { nom: 'Wedding Cake', commandes: 15 },
    { nom: 'Cupcakes', commandes: 12 },
    { nom: 'Number Cake', commandes: 9 },
    { nom: 'Tarte aux fruits', commandes: 7 },
    { nom: 'Cake Anniversaire', commandes: 6 },
  ],
};

export const mockClients = [
  { id: '1', nom: 'Kone', prenom: 'Aminata', telephone: '+22997001122', email: 'aminata@email.com', ville: 'Cotonou', estVip: true, remiseVip: 10, adresse: '45 Av. Steinmetz', totalCommandes: 8, totalDepense: 425000, actif: true },
  { id: '2', nom: 'Sossou', prenom: 'Marie', telephone: '+22996112233', email: 'marie.s@email.com', ville: 'Cotonou', estVip: false, remiseVip: 0, adresse: '123 Rue du Commerce', totalCommandes: 3, totalDepense: 67000, actif: true },
  { id: '3', nom: 'Diallo', prenom: 'Fatou', telephone: '+22995223344', email: 'fatou.d@email.com', ville: 'Porto-Novo', estVip: true, remiseVip: 5, adresse: '78 Bd St Michel', totalCommandes: 12, totalDepense: 580000, dateAnniversaire: '2026-04-01', actif: true },
  { id: '4', nom: 'Bello', prenom: 'Aïcha', telephone: '+22994334455', email: 'aicha.b@email.com', ville: 'Parakou', estVip: false, remiseVip: 0, adresse: '12 Rue des Palmiers', totalCommandes: 2, totalDepense: 43000, actif: true },
  { id: '5', nom: 'Adeyemi', prenom: 'Grace', telephone: '+22993445566', email: 'grace.a@email.com', ville: 'Cotonou', estVip: false, remiseVip: 0, adresse: '90 Av. Clozel', totalCommandes: 5, totalDepense: 195000, actif: true },
];

export const mockCommandes = [
  { id: '1', numero: 'CMD-045', clientId: '1', clientNom: 'Aminata Kone', clientTelephone: '+22997001122', clientEmail: 'aminata@email.com', statut: 'CONFIRMEE', dateCommande: '2026-03-28', dateLivraisonSouhaitee: '2026-04-02', creneauHoraire: 'Après-midi', modeLivraison: 'LIVRAISON_DOMICILE', adresseLivraison: '45 Av. Steinmetz, Cotonou', montantTotal: 85000, acompteRequis: 42500, paye: 42500, estUrgent: false, notesInternes: '', produits: [{ nom: 'Wedding Cake 3 étages', quantite: 1, prixTotal: 85000, messageGateau: 'Bon mariage', personnalisations: ['Glaçage premium'] }] },
  { id: '2', numero: 'CMD-044', clientId: '3', clientNom: 'Fatou Diallo', clientTelephone: '+22995223344', clientEmail: 'fatou.d@email.com', statut: 'EN_PRODUCTION', dateCommande: '2026-03-27', dateLivraisonSouhaitee: '2026-04-01', creneauHoraire: 'Matin', modeLivraison: 'LIVRAISON_DOMICILE', adresseLivraison: '78 Bd St Michel, Porto-Novo', montantTotal: 36000, acompteRequis: 18000, paye: 18000, estUrgent: false, notesInternes: 'Sans noix svp', produits: [{ nom: 'Cupcakes', quantite: 24, prixTotal: 36000, messageGateau: '', personnalisations: [] }] },
  { id: '3', numero: 'CMD-043', clientId: '2', clientNom: 'Marie Sossou', clientTelephone: '+22996112233', clientEmail: 'marie.s@email.com', statut: 'PRETE', dateCommande: '2026-03-26', dateLivraisonSouhaitee: '2026-03-31', creneauHoraire: 'Matin', modeLivraison: 'RETRAIT_SUR_PLACE', adresseLivraison: '', montantTotal: 18000, acompteRequis: 9000, paye: 18000, estUrgent: false, notesInternes: '', produits: [{ nom: 'Tarte aux fruits', quantite: 1, prixTotal: 18000, messageGateau: '', personnalisations: [] }] },
  { id: '4', numero: 'CMD-042', clientId: '4', clientNom: 'Aïcha Bello', clientTelephone: '+22994334455', clientEmail: 'aicha.b@email.com', statut: 'PENDING_CONFIRMATION', dateCommande: '2026-03-25', dateLivraisonSouhaitee: '2026-04-03', creneauHoraire: 'Soirée', modeLivraison: 'LIVRAISON_DOMICILE', adresseLivraison: '12 Rue des Palmiers, Parakou', montantTotal: 25000, acompteRequis: 12500, paye: 0, estUrgent: true, notesInternes: '', produits: [{ nom: 'Cake Anniversaire', quantite: 1, prixTotal: 25000, messageGateau: 'Joyeux anniversaire Aïcha', personnalisations: ['Figurines'] }] },
  { id: '5', numero: 'CMD-041', clientId: '5', clientNom: 'Grace Adeyemi', clientTelephone: '+22993445566', clientEmail: 'grace.a@email.com', statut: 'LIVREE', dateCommande: '2026-03-22', dateLivraisonSouhaitee: '2026-03-29', creneauHoraire: 'Après-midi', modeLivraison: 'LIVRAISON_DOMICILE', adresseLivraison: '90 Av. Clozel, Cotonou', montantTotal: 45000, acompteRequis: 22500, paye: 45000, estUrgent: false, notesInternes: '', produits: [{ nom: 'Number Cake 30', quantite: 1, prixTotal: 45000, messageGateau: '30 ans !', personnalisations: [] }] },
];

export const mockProduits = [
  { id: '1', nom: 'Wedding Cake', description: 'Cake de mariage élégant, jusqu\'à 5 étages', prixBase: 65000, categorie: 'CAKE', estActif: true, photoUrl: '' },
  { id: '2', nom: 'Cupcakes', description: 'Cupcakes décorés, minimum 12 pièces', prixBase: 1500, categorie: 'CUPCAKE', estActif: true, photoUrl: '' },
  { id: '3', nom: 'Number Cake', description: 'Cake en forme de chiffre avec fruits et crème', prixBase: 35000, categorie: 'CAKE', estActif: true, photoUrl: '' },
  { id: '4', nom: 'Tarte aux fruits', description: 'Tarte fraîche aux fruits de saison', prixBase: 15000, categorie: 'TARTE', estActif: true, photoUrl: '' },
  { id: '5', nom: 'Cake Anniversaire', description: 'Cake personnalisé pour anniversaire', prixBase: 20000, categorie: 'CAKE', estActif: true, photoUrl: '' },
  { id: '6', nom: 'Layer Cake', description: 'Cake multi-couches crème et ganache', prixBase: 25000, categorie: 'CAKE', estActif: true, photoUrl: '' },
];

export const mockPersonnalisations: Record<string, { id: string; libelle: string; prixSupplementaire: number; estRequis: boolean }[]> = {
  '1': [
    { id: 'p1', libelle: 'Message sur le gâteau', prixSupplementaire: 0, estRequis: false },
    { id: 'p2', libelle: 'Glaçage premium', prixSupplementaire: 5000, estRequis: false },
    { id: 'p3', libelle: 'Étage supplémentaire', prixSupplementaire: 15000, estRequis: false },
  ],
  '2': [
    { id: 'p1', libelle: 'Topper personnalisé', prixSupplementaire: 1000, estRequis: false },
  ],
  '3': [
    { id: 'p1', libelle: 'Message sur le gâteau', prixSupplementaire: 0, estRequis: false },
    { id: 'p2', libelle: 'Décor doré', prixSupplementaire: 3000, estRequis: false },
  ],
  '4': [],
  '5': [
    { id: 'p1', libelle: 'Message sur le gâteau', prixSupplementaire: 0, estRequis: false },
    { id: 'p2', libelle: 'Figurines décoratives', prixSupplementaire: 3000, estRequis: false },
  ],
  '6': [
    { id: 'p1', libelle: 'Glaçage premium', prixSupplementaire: 2000, estRequis: false },
  ],
};

export const mockDepenses = [
  { id: '1', categorie: 'INGREDIENTS', montant: 45000, description: 'Farine, sucre, beurre', date: '2026-03-25' },
  { id: '2', categorie: 'EMBALLAGES', montant: 12000, description: 'Boîtes à gâteaux', date: '2026-03-22' },
  { id: '3', categorie: 'INGREDIENTS', montant: 28000, description: 'Fruits frais', date: '2026-03-20' },
  { id: '4', categorie: 'TRANSPORT', montant: 8000, description: 'Carburant livraisons', date: '2026-03-18' },
  { id: '5', categorie: 'AUTRE', montant: 15000, description: 'Décorations', date: '2026-03-15' },
];

export const mockZonesLivraison = [
  { id: '1', nom: 'Cotonou centre', frais: 1500 },
  { id: '2', nom: 'Cotonou périphérie', frais: 2500 },
  { id: '3', nom: 'Porto-Novo', frais: 4000 },
  { id: '4', nom: 'Parakou', frais: 8000 },
];

export const mockParametres = {
  nomPatisserie: 'Ma Pâtisserie',
  telephoneWhatsapp: '+22997000000',
  email: 'contact@mapatisserie.bj',
  adresse: 'Cotonou, Bénin',
  delaiMinimumHeures: 48,
  pourcentageAcompte: 50,
  seuilSurchargeProduction: 5,
  templates: {
    confirmation: 'Bonjour {Prenom}, votre commande {Numero} est confirmée. Acompte: {Acompte} FCFA.',
    pretAEtreLivre: 'Bonjour {Prenom}, votre commande est prête ! Livraison prévue le {DateLivraison}.',
    rappelPaiement: 'Bonjour {Prenom}, un solde de {Solde} FCFA reste dû pour la commande {Numero}.',
    remerciement: 'Merci {Prenom} pour votre confiance ! À bientôt.',
  },
};

export const statutColors: Record<string, { bg: string; text: string; label: string }> = {
  BROUILLON: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Brouillon' },
  PENDING_CONFIRMATION: { bg: 'bg-warning/15', text: 'text-warning', label: 'En attente' },
  CONFIRMEE: { bg: 'bg-primary/15', text: 'text-primary', label: 'Confirmée' },
  EN_PRODUCTION: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En production' },
  PRETE: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Prête' },
  LIVREE: { bg: 'bg-success/20', text: 'text-success', label: 'Livrée' },
  ANNULEE: { bg: 'bg-destructive/15', text: 'text-destructive', label: 'Annulée' },
};

export const statutOrder = ['PENDING_CONFIRMATION', 'CONFIRMEE', 'EN_PRODUCTION', 'PRETE', 'LIVREE'];
