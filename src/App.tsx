import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";

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
import Marketplace from "./pages/Marketplace";
import MarketplaceVehicle from "./pages/marketplace/MarketplaceVehicle";
import MarketplaceDealer from "./pages/marketplace/MarketplaceDealer";
import MarketplaceAdmin from "./pages/admin/MarketplaceAdmin";
import CompareVehicles from "./pages/marketplace/CompareVehicles";
import AuctionDetail from "./pages/marketplace/AuctionDetail";
import MarketplaceAnalytics from "./pages/MarketplaceAnalytics";
import VehiclesForSale from "./pages/VehiclesForSale";
import VehicleInspection from "./pages/VehicleInspection";
import SellVehicle from "./pages/marketplace/SellVehicle";
import SellVehicleFormPage from "./pages/marketplace/SellVehicleFormPage";
import Wishlist from "./pages/marketplace/Wishlist";
import TestDriveRequests from "./pages/TestDriveRequests";

// Footer Pages
import AboutPage from "./pages/footer/AboutPage";
import HowItWorksPage from "./pages/footer/HowItWorksPage";
import ContactPage from "./pages/footer/ContactPage";
import FAQPage from "./pages/footer/FAQPage";
import TermsPage from "./pages/footer/TermsPage";
import PrivacyPage from "./pages/footer/PrivacyPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* ---------- Public Marketplace ---------- */}
          <Route path="/" element={<Marketplace />} />
          <Route path="/marketplace/vehicle/:vehicleId" element={<MarketplaceVehicle />} />
          <Route path="/marketplace/dealer/:dealerId" element={<MarketplaceDealer />} />
          <Route path="/marketplace/compare" element={<CompareVehicles />} />
          <Route path="/marketplace/auction/:auctionId" element={<AuctionDetail />} />
          <Route path="/marketplace/wishlist" element={<Wishlist />} />
          <Route path="/sell-vehicle" element={<SellVehicle />} />
          <Route path="/sell-vehicle/form" element={<SellVehicleFormPage />} />
          <Route path="/admin/marketplace" element={<MarketplaceAdmin />} />
          
          {/* Footer Pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          
          {/* ---------- Public Pages (Separate from Marketplace) ---------- */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/v/:pageId" element={<PublicVehicle />} />
          <Route path="/d/:pageId" element={<DealerPublicPage />} />

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
            path="/analytics/marketplace"
            element={
              <Layout>
                <MarketplaceAnalytics />
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
          <Route path="/vehicles-for-sale" element={<Layout><VehiclesForSale /></Layout>} />
          <Route path="/test-drive-requests" element={<TestDriveRequests />} />
          <Route path="/inspection/:vehicleId" element={<VehicleInspection />} />

          {/* ---------- 404 ---------- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
