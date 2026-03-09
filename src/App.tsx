import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";

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
import VehicleInspection from "./pages/VehicleInspection";
import SellVehicle from "./pages/marketplace/SellVehicle";
import SellVehicleFormPage from "./pages/marketplace/SellVehicleFormPage";
import Wishlist from "./pages/marketplace/Wishlist";
import AllDealers from "./pages/marketplace/AllDealers";
import AllVehicles from "./pages/marketplace/AllVehicles";
import DealerMarketplaceHub from "./pages/DealerMarketplaceHub";
import CalendarPage from "./pages/CalendarPage";

// Footer Pages
import AboutPage from "./pages/footer/AboutPage";
import HowItWorksPage from "./pages/footer/HowItWorksPage";
import ContactPage from "./pages/footer/ContactPage";
import FAQPage from "./pages/footer/FAQPage";
import TermsPage from "./pages/footer/TermsPage";
import PrivacyPage from "./pages/footer/PrivacyPage";
import BlogPage from "./pages/footer/BlogPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes - keep unused data in cache longer
      refetchOnWindowFocus: false,
      refetchOnMount: 'always', // Use cache but revalidate if stale
      retry: 1,
      structuralSharing: true, // Prevent unnecessary re-renders
    },
  },
});

const App = () => (
  <ErrorBoundary>
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
          <Route path="/marketplace/dealers" element={<AllDealers />} />
          <Route path="/marketplace/vehicles" element={<AllVehicles />} />
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
          <Route path="/blog" element={<BlogPage />} />
          
          {/* ---------- Public Pages (Separate from Marketplace) ---------- */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/v/:pageId" element={<PublicVehicle />} />
          <Route path="/d/:pageId" element={<DealerPublicPage />} />
          <Route path="/d/:pageId/:vehicleId" element={<PublicVehicle />} />
          {/* Catalogue routes: dealer-name-based slugs */}
          <Route path="/catalogue/:dealerSlug" element={<DealerPublicPage />} />
          <Route path="/catalogue/:dealerSlug/:vehicleCode" element={<PublicVehicle />} />

          {/* ---------- Protected / Sidebar Layout ---------- */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vehicles"
            element={
              <ProtectedRoute>
                <Layout>
                  <Vehicles />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <Layout>
                  <Customers />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendors"
            element={
              <ProtectedRoute>
                <Layout>
                  <Vendors />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <ProtectedRoute>
                <Layout>
                  <Sales />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases"
            element={
              <ProtectedRoute>
                <Layout>
                  <Purchases />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <Layout>
                  <Payments />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/emi"
            element={
              <ProtectedRoute>
                <Layout>
                  <EMI />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <Layout>
                  <Expenses />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <Layout>
                  <Documents />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leads"
            element={
              <ProtectedRoute>
                <Layout>
                  <Leads />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/services"
            element={
              <ProtectedRoute>
                <Layout>
                  <Services />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace-hub"
            element={
              <ProtectedRoute>
                <Layout>
                  <DealerMarketplaceHub />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/marketplace"
            element={
              <ProtectedRoute>
                <Layout>
                  <MarketplaceAnalytics />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/public-page"
            element={
              <ProtectedRoute>
                <Layout>
                  <PublicPageAnalytics />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <Layout>
                  <Alerts />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Layout>
                  <CalendarPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Removed individual routes - now consolidated in Marketplace Hub */}
          <Route path="/inspection/:vehicleId" element={<VehicleInspection />} />

          {/* ---------- 404 ---------- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
