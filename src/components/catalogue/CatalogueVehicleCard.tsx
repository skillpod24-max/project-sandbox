import { Badge } from "@/components/ui/badge";
import { Car, Calendar, Fuel, Gauge, ArrowRight } from "lucide-react";
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

function ImageBadge({ text, color }: { text: string; color: string }) {
  return (
    <span className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-lg ${badgeColorMap[color || "emerald"]}`}>
      {text}
    </span>
  );
}

function PriceBlock({ vehicle, accentText, strikeClass }: { vehicle: any; accentText: string; strikeClass: string }) {
  return (
    <div>
      {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
        <p className={`text-xs ${strikeClass} line-through`}>₹{formatIndianNumber(vehicle.strikeout_price)}</p>
      )}
      <p className={`text-xl font-extrabold ${accentText}`}>₹{formatIndianNumber(vehicle.selling_price)}</p>
    </div>
  );
}

function SpecChip({ icon, text, className }: { icon: React.ReactNode; text: string; className?: string }) {
  return (
    <span className={`text-[11px] flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${className}`}>
      {icon}{text}
    </span>
  );
}

export default function CatalogueVehicleCard({ vehicle, images, accent, template, onClick }: CatalogueVehicleCardProps) {
  const primaryImage = images.find(i => i.is_primary) || images[0];

  // ─── MINIMAL: Horizontal list card ───
  if (template === "minimal") {
    return (
      <div onClick={onClick} className="flex gap-4 p-3 bg-white border border-gray-100 rounded-xl hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer group">
        <div className="w-36 h-28 sm:w-44 sm:h-32 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative">
          {primaryImage ? (
            <img src={primaryImage.image_url} alt={vehicle.brand} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Car className="h-8 w-8 text-gray-300" /></div>
          )}
          {vehicle.image_badge_text && <ImageBadge text={vehicle.image_badge_text} color={vehicle.image_badge_color} />}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <h3 className="font-bold text-gray-900 truncate text-base">{vehicle.brand} {vehicle.model}</h3>
            {vehicle.variant && <p className="text-xs text-gray-500 truncate">{vehicle.variant}</p>}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <SpecChip icon={<Calendar className="h-3 w-3" />} text={vehicle.manufacturing_year} className="bg-gray-100 text-gray-600" />
              <SpecChip icon={<Fuel className="h-3 w-3" />} text={vehicle.fuel_type} className="bg-gray-100 text-gray-600 capitalize" />
              {vehicle.odometer_reading && <SpecChip icon={<Gauge className="h-3 w-3" />} text={`${formatIndianNumber(vehicle.odometer_reading)} km`} className="bg-gray-100 text-gray-600" />}
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <PriceBlock vehicle={vehicle} accentText={accent.text} strikeClass="text-gray-400" />
            <span className={`text-xs font-semibold ${accent.text} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
              View <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── PREMIUM: Dark cinematic card ───
  if (template === "premium") {
    return (
      <div onClick={onClick} className="bg-gray-900 rounded-2xl overflow-hidden cursor-pointer group hover:ring-2 hover:ring-white/20 transition-all shadow-lg">
        <div className="aspect-[4/3] relative bg-gray-800">
          {primaryImage ? (
            <img src={primaryImage.image_url} alt={vehicle.brand} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Car className="h-12 w-12 text-gray-600" /></div>
          )}
          {vehicle.image_badge_text && <ImageBadge text={vehicle.image_badge_text} color={vehicle.image_badge_color} />}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-bold text-white text-base truncate drop-shadow-lg">{vehicle.brand} {vehicle.model}</h3>
            {vehicle.variant && <p className="text-xs text-gray-300 truncate">{vehicle.variant}</p>}
          </div>
          <Badge className={`absolute top-2.5 right-2.5 bg-gradient-to-r ${accent.gradient} text-white border-0 capitalize text-[10px] shadow-lg`}>{vehicle.condition}</Badge>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-1.5 mb-3">
            <SpecChip icon={<Calendar className="h-2.5 w-2.5" />} text={vehicle.manufacturing_year} className="bg-gray-800 text-gray-400 border border-gray-700" />
            <SpecChip icon={<Fuel className="h-2.5 w-2.5" />} text={vehicle.fuel_type} className="bg-gray-800 text-gray-400 border border-gray-700 capitalize" />
            {vehicle.odometer_reading && <SpecChip icon={<Gauge className="h-2.5 w-2.5" />} text={`${formatIndianNumber(vehicle.odometer_reading)} km`} className="bg-gray-800 text-gray-400 border border-gray-700" />}
          </div>
          <div className="flex items-end justify-between">
            <div>
              {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
                <p className="text-xs text-gray-500 line-through">₹{formatIndianNumber(vehicle.strikeout_price)}</p>
              )}
              <p className="text-xl font-extrabold text-white">₹{formatIndianNumber(vehicle.selling_price)}</p>
            </div>
            <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              Details <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── SHOWROOM: Gallery-focused large image ───
  if (template === "showroom") {
    return (
      <div onClick={onClick} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all cursor-pointer group border border-gray-100">
        <div className="aspect-[16/10] relative bg-gray-100">
          {primaryImage ? (
            <img src={primaryImage.image_url} alt={vehicle.brand} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Car className="h-16 w-16 text-gray-300" /></div>
          )}
          {vehicle.image_badge_text && <ImageBadge text={vehicle.image_badge_text} color={vehicle.image_badge_color} />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="font-bold text-white text-xl drop-shadow-lg">{vehicle.brand} {vehicle.model}</h3>
            {vehicle.variant && <p className="text-sm text-white/80 drop-shadow">{vehicle.variant}</p>}
          </div>
          <Badge className={`absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-900 border-0 capitalize text-xs font-semibold shadow-sm`}>{vehicle.condition}</Badge>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <SpecChip icon={<Calendar className="h-3 w-3" />} text={vehicle.manufacturing_year} className="bg-gray-100 text-gray-600" />
            <SpecChip icon={<Fuel className="h-3 w-3" />} text={vehicle.fuel_type} className="bg-gray-100 text-gray-600 capitalize" />
            {vehicle.odometer_reading && <SpecChip icon={<Gauge className="h-3 w-3" />} text={`${formatIndianNumber(vehicle.odometer_reading)} km`} className="bg-gray-100 text-gray-600" />}
          </div>
          <div className="text-right">
            {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
              <p className="text-xs text-gray-400 line-through">₹{formatIndianNumber(vehicle.strikeout_price)}</p>
            )}
            <p className={`text-xl font-extrabold ${accent.text}`}>₹{formatIndianNumber(vehicle.selling_price)}</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── MODERN: Rounded with accent chips ───
  if (template === "modern") {
    return (
      <div onClick={onClick} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all cursor-pointer group ring-1 ring-gray-100 hover:ring-gray-200">
        <div className="aspect-[4/3] relative bg-gray-50">
          {primaryImage ? (
            <img src={primaryImage.image_url} alt={vehicle.brand} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Car className="h-12 w-12 text-gray-300" /></div>
          )}
          {vehicle.image_badge_text && <ImageBadge text={vehicle.image_badge_text} color={vehicle.image_badge_color} />}
          <Badge className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-900 border-0 capitalize text-xs font-semibold shadow-sm">{vehicle.condition}</Badge>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-gray-900 truncate text-base">{vehicle.brand} {vehicle.model}</h3>
          {vehicle.variant && <p className="text-xs text-gray-500 truncate mt-0.5">{vehicle.variant}</p>}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <SpecChip icon={<Calendar className="h-2.5 w-2.5" />} text={vehicle.manufacturing_year} className={`${accent.bgLight} ${accent.text}`} />
            <SpecChip icon={<Fuel className="h-2.5 w-2.5" />} text={vehicle.fuel_type} className={`${accent.bgLight} ${accent.text} capitalize`} />
            {vehicle.transmission && <SpecChip icon={null} text={vehicle.transmission} className={`${accent.bgLight} ${accent.text} capitalize`} />}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <PriceBlock vehicle={vehicle} accentText={accent.text} strikeClass="text-gray-400" />
            <span className={`text-xs font-semibold ${accent.text} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
              View <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── CLASSIC: Default clean grid card ───
  return (
    <div onClick={onClick} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group border border-gray-200 hover:border-gray-300">
      <div className="aspect-[4/3] relative bg-gray-100">
        {primaryImage ? (
          <img src={primaryImage.image_url} alt={vehicle.brand} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Car className="h-12 w-12 text-gray-300" /></div>
        )}
        {vehicle.image_badge_text && <ImageBadge text={vehicle.image_badge_text} color={vehicle.image_badge_color} />}
        <Badge className={`absolute top-2.5 right-2.5 ${accent.bg} text-white border-0 capitalize text-[10px] shadow-md`}>{vehicle.condition}</Badge>
      </div>
      <div className="p-3.5">
        <h3 className="font-bold text-sm sm:text-base text-gray-900 truncate">{vehicle.brand} {vehicle.model}</h3>
        {vehicle.variant && <p className="text-xs text-gray-500 truncate">{vehicle.variant}</p>}
        <div className="flex flex-wrap gap-1 mt-2">
          <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs border-gray-200 text-gray-600 px-1.5 py-0.5">
            <Calendar className="h-2.5 w-2.5" /> {vehicle.manufacturing_year}
          </Badge>
          <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs capitalize border-gray-200 text-gray-600 px-1.5 py-0.5">
            <Fuel className="h-2.5 w-2.5" /> {vehicle.fuel_type}
          </Badge>
          {vehicle.odometer_reading && (
            <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs border-gray-200 text-gray-600 px-1.5 py-0.5">
              <Gauge className="h-2.5 w-2.5" /> {formatIndianNumber(vehicle.odometer_reading)} km
            </Badge>
          )}
        </div>
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
          <PriceBlock vehicle={vehicle} accentText={accent.text} strikeClass="text-gray-400" />
          <span className={`text-xs font-semibold ${accent.text} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
            View <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  );
}