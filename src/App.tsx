import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { connectWebSocket, disconnectWebSocket } from "@/lib/websocket";
import AdminLayout from "@/components/layout/AdminLayout";
import ClientLayout from "@/components/layout/ClientLayout";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import UnauthorizedPage from "@/pages/UnauthorizedPage";

import DashboardPage from "@/pages/admin/DashboardPage";
import CommandesPage from "@/pages/admin/CommandesPage";
import ClientsPage from "@/pages/admin/ClientsPage";
import ProductionPage from "@/pages/admin/ProductionPage";
import LivraisonsPage from "@/pages/admin/LivraisonsPage";
import CataloguePage from "@/pages/admin/CataloguePage";
import FinancesPage from "@/pages/admin/FinancesPage";
import NotificationsPage from "@/pages/admin/NotificationsPage";
import ParametresPage from "@/pages/admin/ParametresPage";

import ClientHome from "@/pages/client/ClientHome";
import ClientCatalogue from "@/pages/client/ClientCatalogue";
import ClientProduitDetail from "@/pages/client/ClientProduitDetail";
import ClientCommander from "@/pages/client/ClientCommander";
import ClientMesCommandes from "@/pages/client/ClientMesCommandes";
import ClientCommandeDetail from "@/pages/client/ClientCommandeDetail";
import ClientProfil from "@/pages/client/ClientProfil";

import NotFound from "./pages/NotFound";
import { toast } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function RoleRoute({ role, children }: { role: 'ROLE_ADMIN' | 'ROLE_CLIENT'; children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== role) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}

function WebSocketBridge() {
  const { isAuthenticated, user } = useAuthStore();
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    connectWebSocket(
      user.role,
      (event) => {
        // Invalidate orders queries on update
        queryClient.invalidateQueries({ queryKey: ['commandes'] });
        queryClient.invalidateQueries({ queryKey: ['mes-commandes'] });
        if (event?.message) toast.info(event.message);
      },
      (event) => {
        addNotification({
          id: event.id || crypto.randomUUID(),
          type: event.type || 'INFO',
          message: event.message || 'Nouvelle notification',
          estLue: false,
          createdAt: new Date().toISOString(),
        });
        if (event?.message) toast(event.message);
      }
    );
    return () => disconnectWebSocket();
  }, [isAuthenticated, user, addNotification]);
  return null;
}

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <WebSocketBridge />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route path="/admin" element={<RoleRoute role="ROLE_ADMIN"><AdminLayout /></RoleRoute>}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="commandes" element={<CommandesPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="production" element={<ProductionPage />} />
              <Route path="livraisons" element={<LivraisonsPage />} />
              <Route path="catalogue" element={<CataloguePage />} />
              <Route path="finances" element={<FinancesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="parametres" element={<ParametresPage />} />
            </Route>

            <Route path="/app" element={<RoleRoute role="ROLE_CLIENT"><ClientLayout /></RoleRoute>}>
              <Route index element={<Navigate to="/app/home" replace />} />
              <Route path="home" element={<ClientHome />} />
              <Route path="catalogue" element={<ClientCatalogue />} />
              <Route path="catalogue/:id" element={<ClientProduitDetail />} />
              <Route path="commander" element={<ClientCommander />} />
              <Route path="commandes" element={<ClientMesCommandes />} />
              <Route path="commandes/:id" element={<ClientCommandeDetail />} />
              <Route path="profil" element={<ClientProfil />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
