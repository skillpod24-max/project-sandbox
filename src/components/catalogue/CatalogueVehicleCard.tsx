import { Badge } from "@/components/ui/badge";
import { Car, Calendar, Fuel, Gauge, Users } from "lucide-react";
import { formatIndianNumber } from "@/lib/formatters";

interface CatalogueVehicleCardProps {
  vehicle: any;
  images: any[];
  accent: any;
  template: string;
  onClick: () => void;
}

const badgeColorMap: Record<string, string> = {
  emerald: "bg-emerald-600",
  rose: "bg-rose-600",
  amber: "bg-amber-500",
  indigo: "bg-indigo-600",
  blue: "bg-blue-600",
  violet: "bg-violet-600",
  cyan: "bg-cyan-600",
  orange: "bg-orange-600",
};

export default function CatalogueVehicleCard({ vehicle, images, accent, template, onClick }: CatalogueVehicleCardProps) {
  const primaryImage = images.find(i => i.is_primary) || images[0];

  // Minimal template = list style
  if (template === "minimal") {
    return (
      <div
        onClick={onClick}
        className="flex gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="w-32 h-24 sm:w-40 sm:h-28 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
          {primaryImage ? (
            <img src={primaryImage.image_url} alt={vehicle.brand} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Car className="h-8 w-8 text-gray-300" /></div>
          )}
          {vehicle.image_badge_text && (
            <span className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ${badgeColorMap[vehicle.image_badge_color || "emerald"]}`}>
              {vehicle.image_badge_text}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 truncate">{vehicle.brand} {vehicle.model}</h3>
            {vehicle.variant && <p className="text-xs text-gray-500 truncate">{vehicle.variant}</p>}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="h-3 w-3" />{vehicle.manufacturing_year}</span>
              <span className="text-xs text-gray-500 flex items-center gap-1 capitalize"><Fuel className="h-3 w-3" />{vehicle.fuel_type}</span>
              {vehicle.odometer_reading && <span className="text-xs text-gray-500 flex items-center gap-1"><Gauge className="h-3 w-3" />{formatIndianNumber(vehicle.odometer_reading)} km</span>}
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
                <p className="text-xs text-gray-400 line-through">₹{formatIndianNumber(vehicle.strikeout_price)}</p>
              )}
              <p className={`text-lg font-bold ${accent.text}`}>₹{formatIndianNumber(vehicle.selling_price)}</p>
            </div>
            <Badge variant="outline" className="capitalize text-[10px]">{vehicle.condition}</Badge>
          </div>
        </div>
      </div>
    );
  }

  // Premium template = dark card
  if (template === "premium") {
    return (
      <div
        onClick={onClick}
        className="bg-gray-900 rounded-2xl overflow-hidden cursor-pointer group hover:ring-2 hover:ring-white/20 transition-all"
      >
        <div className="aspect-[4/3] relative bg-gray-800">
          {primaryImage ? (
            <img src={primaryImage.image_url} alt={vehicle.brand} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Car className="h-12 w-12 text-gray-600" /></div>
          )}
          {vehicle.image_badge_text && (
            <span className={`absolute bottom-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white shadow-lg ${badgeColorMap[vehicle.image_badge_color || "emerald"]}`}>
              {vehicle.image_badge_text}
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
          <Badge className={`absolute top-2 right-2 bg-gradient-to-r ${accent.gradient} text-white border-0 capitalize text-xs`}>{vehicle.condition}</Badge>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-white truncate">{vehicle.brand} {vehicle.model}</h3>
          {vehicle.variant && <p className="text-xs text-gray-400 truncate">{vehicle.variant}</p>}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="outline" className="text-[10px] border-gray-700 text-gray-400 gap-1"><Calendar className="h-2.5 w-2.5" />{vehicle.manufacturing_year}</Badge>
            <Badge variant="outline" className="text-[10px] border-gray-700 text-gray-400 gap-1 capitalize"><Fuel className="h-2.5 w-2.5" />{vehicle.fuel_type}</Badge>
            {vehicle.odometer_reading && <Badge variant="outline" className="text-[10px] border-gray-700 text-gray-400 gap-1"><Gauge className="h-2.5 w-2.5" />{formatIndianNumber(vehicle.odometer_reading)} km</Badge>}
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
                <p className="text-xs text-gray-500 line-through">₹{formatIndianNumber(vehicle.strikeout_price)}</p>
              )}
              <p className="text-xl font-bold text-white">₹{formatIndianNumber(vehicle.selling_price)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Showroom template = large image focus
  if (template === "showroom") {
    return (
      <div
        onClick={onClick}
        className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group border border-gray-100"
      >
        <div className="aspect-[16/10] relative bg-gray-100">
          {primaryImage ? (
            <img src={primaryImage.image_url} alt={vehicle.brand} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Car className="h-16 w-16 text-gray-300" /></div>
          )}
          {vehicle.image_badge_text && (
            <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg ${badgeColorMap[vehicle.image_badge_color || "emerald"]}`}>
              {vehicle.image_badge_text}
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-bold text-white text-lg drop-shadow-lg">{vehicle.brand} {vehicle.model}</h3>
            {vehicle.variant && <p className="text-xs text-white/80 drop-shadow">{vehicle.variant}</p>}
          </div>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="h-3 w-3" />{vehicle.manufacturing_year}</span>
            <span className="text-xs text-gray-500 flex items-center gap-1 capitalize"><Fuel className="h-3 w-3" />{vehicle.fuel_type}</span>
            {vehicle.odometer_reading && <span className="text-xs text-gray-500 flex items-center gap-1"><Gauge className="h-3 w-3" />{formatIndianNumber(vehicle.odometer_reading)} km</span>}
          </div>
          <div className="text-right">
            {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
              <p className="text-xs text-gray-400 line-through">₹{formatIndianNumber(vehicle.strikeout_price)}</p>
            )}
            <p className={`text-xl font-bold ${accent.text}`}>₹{formatIndianNumber(vehicle.selling_price)}</p>
          </div>
        </div>
      </div>
    );
  }

  // Modern template
  if (template === "modern") {
    return (
      <div
        onClick={onClick}
        className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all cursor-pointer group border-0 ring-1 ring-gray-100"
      >
        <div className="aspect-[4/3] relative bg-gray-50">
          {primaryImage ? (
            <img src={primaryImage.image_url} alt={vehicle.brand} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Car className="h-12 w-12 text-gray-300" /></div>
          )}
          {vehicle.image_badge_text && (
            <span className={`absolute bottom-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white shadow-md ${badgeColorMap[vehicle.image_badge_color || "emerald"]}`}>
              {vehicle.image_badge_text}
            </span>
          )}
          <Badge className={`absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-900 border-0 capitalize text-xs font-semibold shadow-sm`}>{vehicle.condition}</Badge>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-gray-900 truncate text-base">{vehicle.brand} {vehicle.model}</h3>
          {vehicle.variant && <p className="text-xs text-gray-500 truncate mt-0.5">{vehicle.variant}</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`text-[11px] ${accent.bgLight} ${accent.text} px-2 py-0.5 rounded-full font-medium`}>{vehicle.manufacturing_year}</span>
            <span className={`text-[11px] ${accent.bgLight} ${accent.text} px-2 py-0.5 rounded-full font-medium capitalize`}>{vehicle.fuel_type}</span>
            {vehicle.transmission && <span className={`text-[11px] ${accent.bgLight} ${accent.text} px-2 py-0.5 rounded-full font-medium capitalize`}>{vehicle.transmission}</span>}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <div>
              {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
                <p className="text-xs text-gray-400 line-through">₹{formatIndianNumber(vehicle.strikeout_price)}</p>
              )}
              <p className={`text-xl font-extrabold ${accent.text}`}>₹{formatIndianNumber(vehicle.selling_price)}</p>
            </div>
            <span className={`text-xs font-medium ${accent.text} opacity-0 group-hover:opacity-100 transition-opacity`}>View →</span>
          </div>
        </div>
      </div>
    );
  }

  // Classic template (default)
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group border border-gray-200"
    >
      <div className="aspect-[4/3] relative bg-gray-100">
        {primaryImage ? (
          <img src={primaryImage.image_url} alt={vehicle.brand} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Car className="h-12 w-12 text-gray-300" /></div>
        )}
        {vehicle.image_badge_text && (
          <span className={`absolute bottom-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white shadow-md ${badgeColorMap[vehicle.image_badge_color || "emerald"]}`}>
            {vehicle.image_badge_text}
          </span>
        )}
        <Badge className={`absolute top-2 right-2 ${accent.bg} text-white border-0 capitalize text-xs`}>{vehicle.condition}</Badge>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-sm sm:text-base text-gray-900 truncate">{vehicle.brand} {vehicle.model}</h3>
        {vehicle.variant && <p className="text-xs text-gray-500 truncate">{vehicle.variant}</p>}
        <div className="flex flex-wrap gap-1 mt-2">
          <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs border-gray-300 text-gray-600 px-1.5 py-0.5">
            <Calendar className="h-2.5 w-2.5" /> {vehicle.manufacturing_year}
          </Badge>
          <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs capitalize border-gray-300 text-gray-600 px-1.5 py-0.5">
            <Fuel className="h-2.5 w-2.5" /> {vehicle.fuel_type}
          </Badge>
          {vehicle.odometer_reading && (
            <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs border-gray-300 text-gray-600 px-1.5 py-0.5">
              <Gauge className="h-2.5 w-2.5" /> {formatIndianNumber(vehicle.odometer_reading)} km
            </Badge>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
              <p className="text-xs text-gray-400 line-through">₹{formatIndianNumber(vehicle.strikeout_price)}</p>
            )}
            <p className={`text-lg sm:text-xl font-bold ${accent.text}`}>₹{formatIndianNumber(vehicle.selling_price)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
