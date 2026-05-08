## Plan — Sweet Orders: Kkiapay, Notifications, Wizard Manuel, Dépenses liées

### 1. Intégration Kkiapay
- Installer `kkiapay-js`
- Créer `src/lib/kkiapay.ts` avec fonction `payWithKkiapay` (config via `/payments/kkiapay/config`, vérification via `/payments/kkiapay/verify`)
- `ClientCommander.tsx` (Step 5) : après création commande, bouton "Payer l'acompte" qui ouvre le widget Kkiapay
- `ClientCommandeDetail.tsx` : remplacer le toast placeholder "Payer le solde" par appel réel à `payWithKkiapay`, invalidation queries au succès

### 2. Notifications client (WebSocket + cloche)
- Créer `src/components/client/NotificationBell.tsx` : cloche avec badge (utilise `notificationService.count()` + `refetchInterval: 30000`), popover avec liste, marquer lue/tout lue
- `ClientLayout.tsx` : 
  - Souscrire au WebSocket `/topic/commandes` → toast contextualisé selon statut (CONFIRMEE/EN_PRODUCTION/PRETE/LIVREE/ANNULEE) si `clientEmail` correspond à user connecté ; invalider `mes-commandes` et `commande`
  - Ajouter `<NotificationBell />` dans le header
- Désinscription au unmount

### 3. Wizard Admin — Commandes manuelles
- Créer `src/components/admin/NouvelleCommandeWizard.tsx` (5 étapes) :
  - **Step 1** Client : recherche autocomplete via `userService.listAdmin(search)` + bouton "Créer un nouveau client" (form inline → `userService.create` avec `role: ROLE_CLIENT`)
  - **Step 2** Produits : sélection catalogue, quantité, personnalisations, message gâteau, allergènes
  - **Step 3** Livraison : date, créneau, mode, adresse, instructions
  - **Step 4** Paiement manuel : "Acompte reçu ?" Oui/Non → si Oui : montant, mode (Espèces/Orange Money/Wave/Moov/Virement/Autre), date, notes
  - **Step 5** Récap → `commandeService.create({...payload, source: 'MANUEL'})` puis si acompte → `paiementService.enregistrer(...)`
- Ajouter `userService.create` dans `services.ts`
- Ajouter bouton "Nouvelle commande" dans `admin/CommandesPage.tsx` qui ouvre le wizard

### 4. Dépenses liées aux commandes
- Étendre `financeService` : `depensesParCommande(commandeId)` (`GET /admin/commandes/{id}/depenses`), accepter `commandeId` optionnel dans `creerDepense`
- `CommandeDetailSheet.tsx` (admin) : ajouter section "💰 Finances de cette commande" avec total, acompte, solde, dépenses liées (liste détaillée), bénéfice net (`totalAmount - totalDepenses`), bouton "+ Ajouter une dépense" (dialog avec montant/catégorie/description → POST avec `commandeId`)
- `admin/FinancesPage.tsx` : filtre Dépenses [Toutes | Liées à une commande | Générales] ; afficher badge `CMD-XXXX` cliquable sur les dépenses liées

### 5. Détails techniques
- Toutes les queries TanStack invalidées correctement après mutations
- Montants en FCFA entiers (`formatFCFA`)
- Toasts via `sonner`
- Skeletons via `LoadingState`/`ErrorState`/`EmptyState`
- Theme caramel/crème conservé, semantic tokens uniquement

### Fichiers
**Créer** : `src/lib/kkiapay.ts`, `src/components/client/NotificationBell.tsx`, `src/components/admin/NouvelleCommandeWizard.tsx`, `src/components/admin/AjouterDepenseDialog.tsx`

**Modifier** : `src/lib/services.ts`, `src/pages/client/ClientCommander.tsx`, `src/pages/client/ClientCommandeDetail.tsx`, `src/components/layout/ClientLayout.tsx`, `src/components/admin/CommandeDetailSheet.tsx`, `src/pages/admin/CommandesPage.tsx`, `src/pages/admin/FinancesPage.tsx`, `package.json` (kkiapay-js)
