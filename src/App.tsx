import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import { PageSkeleton, DashboardSkeleton } from "./components/ui/page-skeleton";
import FooterPageSkeleton from "./components/marketplace/FooterPageSkeleton";

// ─── Lazy-loaded pages (code-split per route) ───────────────────────
// Public marketplace
const Marketplace = lazy(() => import("./pages/Marketplace"));
const MarketplaceVehicle = lazy(() => import("./pages/marketplace/MarketplaceVehicle"));
const MarketplaceDealer = lazy(() => import("./pages/marketplace/MarketplaceDealer"));
const CompareVehicles = lazy(() => import("./pages/marketplace/CompareVehicles"));

const Wishlist = lazy(() => import("./pages/marketplace/Wishlist"));
const AllDealers = lazy(() => import("./pages/marketplace/AllDealers"));
const AllVehicles = lazy(() => import("./pages/marketplace/AllVehicles"));
const SellVehicle = lazy(() => import("./pages/marketplace/SellVehicle"));
const SellVehicleFormPage = lazy(() => import("./pages/marketplace/SellVehicleFormPage"));
const MarketplaceAdmin = lazy(() => import("./pages/admin/MarketplaceAdmin"));

// Public pages
const Auth = lazy(() => import("./pages/Auth"));
const PublicVehicle = lazy(() => import("./pages/PublicVehicle"));
const DealerPublicPage = lazy(() => import("./pages/DealerPublicPage"));

// Footer pages
const AboutPage = lazy(() => import("./pages/footer/AboutPage"));
const HowItWorksPage = lazy(() => import("./pages/footer/HowItWorksPage"));
const ContactPage = lazy(() => import("./pages/footer/ContactPage"));
const FAQPage = lazy(() => import("./pages/footer/FAQPage"));
const TermsPage = lazy(() => import("./pages/footer/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/footer/PrivacyPage"));
const BlogPage = lazy(() => import("./pages/footer/BlogPage"));

// Protected pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Vehicles = lazy(() => import("./pages/Vehicles"));
const Customers = lazy(() => import("./pages/Customers"));
const Vendors = lazy(() => import("./pages/Vendors"));
const Sales = lazy(() => import("./pages/Sales"));
const Purchases = lazy(() => import("./pages/Purchases"));
const Payments = lazy(() => import("./pages/Payments"));
const EMI = lazy(() => import("./pages/EMI"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Documents = lazy(() => import("./pages/Documents"));
const Leads = lazy(() => import("./pages/Leads"));
const Services = lazy(() => import("./pages/Services"));
const Reports = lazy(() => import("./pages/Reports"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Settings = lazy(() => import("./pages/Settings"));
const DealerMarketplaceHub = lazy(() => import("./pages/DealerMarketplaceHub"));
const MarketplaceAnalytics = lazy(() => import("./pages/MarketplaceAnalytics"));
const PublicPageAnalytics = lazy(() => import("./pages/PublicPageAnalytics"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const VehicleInspection = lazy(() => import("./pages/VehicleInspection"));
const NotFound = lazy(() => import("./pages/NotFound"));

// ─── Query Client ────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      retry: 1,
      structuralSharing: true,
    },
  },
});

// ─── Route wrapper helpers ───────────────────────────────────────────
const SuspenseWrap = ({ children, skeleton }: { children: React.ReactNode; skeleton?: React.ReactNode }) => (
  <Suspense fallback={skeleton || <PageSkeleton />}>{children}</Suspense>
);

const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <Layout>
      <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
    </Layout>
  </ProtectedRoute>
);

// ─── Protected route configs ─────────────────────────────────────────
const protectedRoutes = [
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/vehicles", element: <Vehicles /> },
  { path: "/customers", element: <Customers /> },
  { path: "/vendors", element: <Vendors /> },
  { path: "/sales", element: <Sales /> },
  { path: "/purchases", element: <Purchases /> },
  { path: "/payments", element: <Payments /> },
  { path: "/emi", element: <EMI /> },
  { path: "/expenses", element: <Expenses /> },
  { path: "/documents", element: <Documents /> },
  { path: "/leads", element: <Leads /> },
  { path: "/services", element: <Services /> },
  { path: "/reports", element: <Reports /> },
  { path: "/marketplace-hub", element: <DealerMarketplaceHub /> },
  { path: "/analytics/marketplace", element: <MarketplaceAnalytics /> },
  { path: "/analytics/public-page", element: <PublicPageAnalytics /> },
  { path: "/alerts", element: <Alerts /> },
  { path: "/settings", element: <Settings /> },
  { path: "/calendar", element: <CalendarPage /> },
];

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* ── Public Marketplace ── */}
              <Route path="/" element={<SuspenseWrap><Marketplace /></SuspenseWrap>} />
              <Route path="/marketplace/vehicle/:vehicleId" element={<SuspenseWrap><MarketplaceVehicle /></SuspenseWrap>} />
              <Route path="/marketplace/dealer/:dealerId" element={<SuspenseWrap><MarketplaceDealer /></SuspenseWrap>} />
              <Route path="/marketplace/compare" element={<SuspenseWrap><CompareVehicles /></SuspenseWrap>} />
              
              <Route path="/marketplace/wishlist" element={<SuspenseWrap><Wishlist /></SuspenseWrap>} />
              <Route path="/marketplace/dealers" element={<SuspenseWrap><AllDealers /></SuspenseWrap>} />
              <Route path="/marketplace/vehicles" element={<SuspenseWrap><AllVehicles /></SuspenseWrap>} />
              <Route path="/sell-vehicle" element={<SuspenseWrap><SellVehicle /></SuspenseWrap>} />
              <Route path="/sell-vehicle/form" element={<SuspenseWrap><SellVehicleFormPage /></SuspenseWrap>} />
              <Route path="/admin/marketplace" element={<SuspenseWrap><MarketplaceAdmin /></SuspenseWrap>} />

              {/* ── Footer Pages ── */}
              <Route path="/about" element={<SuspenseWrap skeleton={<FooterPageSkeleton />}><AboutPage /></SuspenseWrap>} />
              <Route path="/how-it-works" element={<SuspenseWrap skeleton={<FooterPageSkeleton />}><HowItWorksPage /></SuspenseWrap>} />
              <Route path="/contact" element={<SuspenseWrap skeleton={<FooterPageSkeleton />}><ContactPage /></SuspenseWrap>} />
              <Route path="/faq" element={<SuspenseWrap skeleton={<FooterPageSkeleton />}><FAQPage /></SuspenseWrap>} />
              <Route path="/terms" element={<SuspenseWrap skeleton={<FooterPageSkeleton />}><TermsPage /></SuspenseWrap>} />
              <Route path="/privacy" element={<SuspenseWrap skeleton={<FooterPageSkeleton />}><PrivacyPage /></SuspenseWrap>} />
              <Route path="/blog" element={<SuspenseWrap skeleton={<FooterPageSkeleton />}><BlogPage /></SuspenseWrap>} />

              {/* ── Public Catalogue / Auth ── */}
              <Route path="/auth" element={<SuspenseWrap><Auth /></SuspenseWrap>} />
              <Route path="/v/:pageId" element={<SuspenseWrap><PublicVehicle /></SuspenseWrap>} />
              <Route path="/d/:pageId" element={<SuspenseWrap><DealerPublicPage /></SuspenseWrap>} />
              <Route path="/d/:pageId/:vehicleId" element={<SuspenseWrap><PublicVehicle /></SuspenseWrap>} />
              <Route path="/catalogue/:dealerSlug" element={<SuspenseWrap><DealerPublicPage /></SuspenseWrap>} />
              <Route path="/catalogue/:dealerSlug/:vehicleCode" element={<SuspenseWrap><PublicVehicle /></SuspenseWrap>} />

              {/* ── Protected Routes (data-isolated per user) ── */}
              {protectedRoutes.map(({ path, element }) => (
                <Route key={path} path={path} element={<ProtectedPage>{element}</ProtectedPage>} />
              ))}

              <Route path="/inspection/:vehicleId" element={<SuspenseWrap><VehicleInspection /></SuspenseWrap>} />
              <Route path="*" element={<SuspenseWrap><NotFound /></SuspenseWrap>} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
