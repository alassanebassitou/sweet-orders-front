import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import CommandesPage from "@/pages/CommandesPage";
import ClientsPage from "@/pages/ClientsPage";
import ProductionPage from "@/pages/ProductionPage";
import LivraisonsPage from "@/pages/LivraisonsPage";
import CataloguePage from "@/pages/CataloguePage";
import FinancesPage from "@/pages/FinancesPage";
import NotificationsPage from "@/pages/NotificationsPage";
import ParametresPage from "@/pages/ParametresPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
