import { memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, GitCompare, Car } from "lucide-react";

interface Props {
  vehicles: any[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

const CompareBar = memo(({ vehicles, onRemove, onClear }: Props) => {
  if (vehicles.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl z-50 safe-area-pb animate-fade-in">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-slate-900">
              Compare ({vehicles.length}/3)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 overflow-x-auto px-2">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 shrink-0"
              >
                {vehicle.image_url ? (
                  <img
                    src={vehicle.image_url}
                    alt=""
                    className="h-8 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="h-8 w-10 rounded bg-slate-200 flex items-center justify-center">
                    <Car className="h-4 w-4 text-slate-400" />
                  </div>
                )}
                <span className="text-xs font-medium text-slate-700 max-w-[100px] truncate">
                  {vehicle.brand} {vehicle.model}
                </span>
                <button
                  onClick={() => onRemove(vehicle.id)}
                  className="h-5 w-5 rounded-full bg-slate-300 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-slate-500"
            >
              Clear
            </Button>
            <Link to={`/marketplace/compare?ids=${vehicles.map(v => v.id).join(",")}`}>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                disabled={vehicles.length < 2}
              >
                <GitCompare className="h-4 w-4" />
                Compare Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});

CompareBar.displayName = "CompareBar";

export default CompareBar;
