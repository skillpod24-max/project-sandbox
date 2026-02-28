import { useState } from "react";
import { useReportsData } from "@/hooks/useReportsData";
import { ReportsSidebar } from "@/components/reports/ReportsSidebar";
import { BusinessOverview } from "@/components/reports/BusinessOverview";
import { SalesReports } from "@/components/reports/SalesReports";
import { EMIReports } from "@/components/reports/EMIReports";
import { InventoryReports } from "@/components/reports/InventoryReports";
import { LeadReports } from "@/components/reports/LeadReports";
import { CustomerReports } from "@/components/reports/CustomerReports";
import { VendorReports } from "@/components/reports/VendorReports";
import { ExpenseReports } from "@/components/reports/ExpenseReports";
import { AnalyticsSkeleton } from "@/components/ui/page-skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

const Reports = () => {
  const [activeCategory, setActiveCategory] = useState("business");
  const [activeSubCategory, setActiveSubCategory] = useState("");
  const { data, loading } = useReportsData();
  const isMobile = useIsMobile();

  const handleChange = (cat: string, sub: string) => {
    setActiveCategory(cat);
    setActiveSubCategory(sub);
  };

  if (loading) return <AnalyticsSkeleton />;

  const renderContent = () => {
    switch (activeCategory) {
      case "business": return <BusinessOverview data={data} />;
      case "sales": return <SalesReports data={data} sub={activeSubCategory} />;
      case "emi": return <EMIReports data={data} sub={activeSubCategory} />;
      case "inventory": return <InventoryReports data={data} sub={activeSubCategory} />;
      case "leads": return <LeadReports data={data} sub={activeSubCategory} />;
      case "customers": return <CustomerReports data={data} sub={activeSubCategory} />;
      case "vendors": return <VendorReports data={data} sub={activeSubCategory} />;
      case "expenses": return <ExpenseReports data={data} sub={activeSubCategory} />;
      default: return <BusinessOverview data={data} />;
    }
  };

  return (
    <div className={isMobile ? "space-y-0" : "flex gap-6 animate-fade-in"}>
      <ReportsSidebar
        activeCategory={activeCategory}
        activeSubCategory={activeSubCategory}
        onChange={handleChange}
      />
      <div className="flex-1 min-w-0">
        {renderContent()}
      </div>
    </div>
  );
};

export default Reports;
