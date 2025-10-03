import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import Contracts from "./pages/Contracts";
import ContractDetails from "./pages/ContractDetails";
import Fleet from "./pages/Fleet";
import VehicleDetails from "./pages/VehicleDetails";
import Drivers from "./pages/Drivers";
import DriverSubmission from "./pages/DriverSubmission";
import VehicleHandover from "./pages/VehicleHandover";
import VehicleReturn from "./pages/VehicleReturn";
import Inquiries from "./pages/Inquiries";
import Protocols from "./pages/Protocols";
import AccountingUpload from "./pages/AccountingUpload";
import Documents from "./pages/Documents";
import InvoicesManagement from "./pages/InvoicesManagement";
import InvoiceUpload from "./pages/InvoiceUpload";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/driver-form/:contractId" element={<DriverSubmission />} />
            <Route path="/vehicle-handover" element={<VehicleHandover />} />
            <Route path="/vehicle-return" element={<VehicleReturn />} />
            <Route path="/accounting-upload/:invoiceId" element={<AccountingUpload />} />
            <Route path="/invoice-upload/:invoiceId" element={<InvoiceUpload />} />
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:id" element={<ClientDetails />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/contracts/:id" element={<ContractDetails />} />
              <Route path="/fleet" element={<Fleet />} />
              <Route path="/fleet/:id" element={<VehicleDetails />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/inquiries" element={<Inquiries />} />
              <Route path="/protocols" element={<Protocols />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/invoices" element={<InvoicesManagement />} />
              <Route path="/users" element={<Users />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
