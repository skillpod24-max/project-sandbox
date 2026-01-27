import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Customers from "./pages/Customers";
import Vendors from "./pages/Vendors";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Payments from "./pages/Payments";
import EMI from "./pages/EMI";
import Expenses from "./pages/Expenses";
import Documents from "./pages/Documents";
import Leads from "./pages/Leads";
import Services from "./pages/Services";
import Reports from "./pages/Reports";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

import Layout from "./components/Layout";

import PublicVehicle from "./pages/PublicVehicle";
import DealerPublicPage from "./pages/DealerPublicPage";
import PublicPageAnalytics from "./pages/PublicPageAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <Routes>
          {/* ---------- Public / No Sidebar ---------- */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/v/:pageId" element={<PublicVehicle />} />
          <Route path="/d/:pageId" element={<DealerPublicPage />} />

          {/* ---------- Redirect ---------- */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* ---------- Protected / Sidebar Layout ---------- */}
          <Route
            path="/dashboard"
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
          />
          <Route
            path="/vehicles"
            element={
              <Layout>
                <Vehicles />
              </Layout>
            }
          />
          <Route
            path="/customers"
            element={
              <Layout>
                <Customers />
              </Layout>
            }
          />
          <Route
            path="/vendors"
            element={
              <Layout>
                <Vendors />
              </Layout>
            }
          />
          <Route
            path="/sales"
            element={
              <Layout>
                <Sales />
              </Layout>
            }
          />
          <Route
            path="/purchases"
            element={
              <Layout>
                <Purchases />
              </Layout>
            }
          />
          <Route
            path="/payments"
            element={
              <Layout>
                <Payments />
              </Layout>
            }
          />
          <Route
            path="/emi"
            element={
              <Layout>
                <EMI />
              </Layout>
            }
          />
          <Route
            path="/expenses"
            element={
              <Layout>
                <Expenses />
              </Layout>
            }
          />
          <Route
            path="/documents"
            element={
              <Layout>
                <Documents />
              </Layout>
            }
          />
          <Route
            path="/leads"
            element={
              <Layout>
                <Leads />
              </Layout>
            }
          />
          <Route
            path="/services"
            element={
              <Layout>
                <Services />
              </Layout>
            }
          />
          <Route
            path="/reports"
            element={
              <Layout>
                <Reports />
              </Layout>
            }
          />
          <Route
            path="/analytics/public-page"
            element={
              <Layout>
                <PublicPageAnalytics />
              </Layout>
            }
          />
          <Route
            path="/alerts"
            element={
              <Layout>
                <Alerts />
              </Layout>
            }
          />
          <Route
            path="/settings"
            element={
              <Layout>
                <Settings />
              </Layout>
            }
          />

          {/* ---------- 404 ---------- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
