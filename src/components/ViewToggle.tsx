import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewToggleProps {
  viewMode: "grid" | "list";
  onViewChange: (mode: "grid" | "list") => void;
}

const ViewToggle = ({ viewMode, onViewChange }: ViewToggleProps) => {
  return (
    <div className="flex items-center border border-border rounded-lg overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 rounded-none ${viewMode === "grid" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-muted"}`}
        onClick={() => onViewChange("grid")}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 rounded-none ${viewMode === "list" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-muted"}`}
        onClick={() => onViewChange("list")}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ViewToggle;
