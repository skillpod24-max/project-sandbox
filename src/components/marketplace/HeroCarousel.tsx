import { useState, useEffect, memo } from "react";
import AutoShowroomHero from "./AutoShowroomHero";

// Premium Cars Racing SVG Hero
const PremiumRacingHero = memo(() => {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <svg
        viewBox="0 0 1200 400"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="nightSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          
          <linearGradient id="roadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>

          <linearGradient id="sportsCar1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>

          <linearGradient id="sportsCar2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          <linearGradient id="headlightGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fef3c7" stopOpacity="1" />
            <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Night Sky */}
        <rect width="1200" height="400" fill="url(#nightSky)" />

        {/* Stars */}
        <g fill="white" opacity="0.6">
          {[...Array(50)].map((_, i) => (
            <circle
              key={i}
              cx={Math.random() * 1200}
              cy={Math.random() * 200}
              r={Math.random() * 1.5 + 0.5}
            />
          ))}
        </g>

        {/* City Skyline Silhouette */}
        <g fill="#1e293b">
          <rect x="0" y="150" width="60" height="150" />
          <rect x="70" y="120" width="80" height="180" />
          <rect x="160" y="140" width="50" height="160" />
          <rect x="220" y="100" width="100" height="200" />
          <rect x="330" y="160" width="70" height="140" />
          <rect x="800" y="130" width="90" height="170" />
          <rect x="900" y="110" width="70" height="190" />
          <rect x="980" y="150" width="100" height="150" />
          <rect x="1090" y="120" width="60" height="180" />
          <rect x="1160" y="140" width="50" height="160" />
        </g>

        {/* Road */}
        <rect x="0" y="280" width="1200" height="120" fill="url(#roadGradient)" />
        
        {/* Road markings */}
        <g fill="#fbbf24" opacity="0.8">
          <rect x="50" y="330" width="80" height="6" rx="3" />
          <rect x="200" y="330" width="80" height="6" rx="3" />
          <rect x="350" y="330" width="80" height="6" rx="3" />
          <rect x="500" y="330" width="80" height="6" rx="3" />
          <rect x="650" y="330" width="80" height="6" rx="3" />
          <rect x="800" y="330" width="80" height="6" rx="3" />
          <rect x="950" y="330" width="80" height="6" rx="3" />
          <rect x="1100" y="330" width="80" height="6" rx="3" />
        </g>

        {/* Racing Car 1 - Red Ferrari-style */}
        <g transform="translate(300, 290)">
          {/* Speed lines */}
          <g opacity="0.4">
            <line x1="-60" y1="30" x2="-20" y2="30" stroke="#ef4444" strokeWidth="3" strokeLinecap="round">
              <animate attributeName="x1" values="-60;-100;-60" dur="0.5s" repeatCount="indefinite" />
              <animate attributeName="x2" values="-20;-60;-20" dur="0.5s" repeatCount="indefinite" />
            </line>
            <line x1="-50" y1="40" x2="-10" y2="40" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="x1" values="-50;-90;-50" dur="0.4s" repeatCount="indefinite" />
            </line>
          </g>
          
          {/* Body */}
          <path d="M0,50 L10,30 Q30,10 80,5 L160,5 Q200,10 220,25 L240,45 L250,50 L250,65 L240,70 L10,70 L0,65 Z" fill="url(#sportsCar1)" />
          {/* Windows */}
          <path d="M18,32 Q35,15 80,12 L140,12 Q175,18 195,30 L18,30" fill="#1e293b" opacity="0.9" />
          {/* Headlight glow */}
          <ellipse cx="250" cy="55" rx="30" ry="15" fill="url(#headlightGlow)" opacity="0.6">
            <animate attributeName="opacity" values="0.4;0.7;0.4" dur="0.8s" repeatCount="indefinite" />
          </ellipse>
          {/* Wheels */}
          <g>
            <circle cx="50" cy="65" r="20" fill="#1e293b" />
            <circle cx="50" cy="65" r="14" fill="#374151" />
            <circle cx="50" cy="65" r="5" fill="#6b7280">
              <animateTransform attributeName="transform" type="rotate" from="0 50 65" to="360 50 65" dur="0.3s" repeatCount="indefinite" />
            </circle>
            <circle cx="200" cy="65" r="20" fill="#1e293b" />
            <circle cx="200" cy="65" r="14" fill="#374151" />
            <circle cx="200" cy="65" r="5" fill="#6b7280">
              <animateTransform attributeName="transform" type="rotate" from="0 200 65" to="360 200 65" dur="0.3s" repeatCount="indefinite" />
            </circle>
          </g>
          {/* Tail light */}
          <rect x="0" y="50" width="8" height="12" rx="2" fill="#ef4444">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="0.5s" repeatCount="indefinite" />
          </rect>
        </g>

        {/* Racing Car 2 - Yellow Lamborghini-style */}
        <g transform="translate(700, 295)">
          {/* Speed lines */}
          <g opacity="0.4">
            <line x1="-50" y1="25" x2="-10" y2="25" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="x1" values="-50;-80;-50" dur="0.6s" repeatCount="indefinite" />
            </line>
          </g>
          
          {/* Body - lower and wider */}
          <path d="M0,45 L15,20 Q40,0 90,0 L170,0 Q210,5 230,20 L245,42 L250,48 L250,60 L240,63 L10,63 L0,58 Z" fill="url(#sportsCar2)" />
          {/* Windows */}
          <path d="M25,22 Q50,5 90,5 L155,5 Q190,10 210,22 L25,22" fill="#1e293b" opacity="0.9" />
          {/* Wheels */}
          <circle cx="55" cy="58" r="18" fill="#1e293b" />
          <circle cx="55" cy="58" r="12" fill="#374151" />
          <circle cx="200" cy="58" r="18" fill="#1e293b" />
          <circle cx="200" cy="58" r="12" fill="#374151" />
        </g>

        {/* Animated Shine */}
        <rect x="-150" y="0" width="80" height="400" fill="white" opacity="0.05">
          <animate attributeName="x" from="-150" to="1350" dur="3s" repeatCount="indefinite" />
        </rect>
      </svg>

      {/* Marketing Text */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-black/70 via-transparent to-black/70">
        <div className="text-center text-white px-4 max-w-4xl">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
            Speed Meets Trust
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl opacity-90 drop-shadow-md">
            Premium Pre-Owned Vehicles • Instant Loan Approval • 7-Day Return Policy
          </p>
        </div>
      </div>
    </div>
  );
});
PremiumRacingHero.displayName = "PremiumRacingHero";

// Family Road Trip SVG Hero
const FamilyRoadTripHero = memo(() => {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <svg
        viewBox="0 0 1200 400"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="sunsetSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="30%" stopColor="#f97316" />
            <stop offset="60%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>
          
          <linearGradient id="hillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#166534" />
          </linearGradient>

          <linearGradient id="suvGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>

          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="50%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sunset Sky */}
        <rect width="1200" height="400" fill="url(#sunsetSky)" />

        {/* Sun */}
        <circle cx="900" cy="150" r="60" fill="url(#sunGlow)">
          <animate attributeName="r" values="58;62;58" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="900" cy="150" r="40" fill="#fef3c7" />

        {/* Clouds */}
        <g fill="white" opacity="0.7">
          <ellipse cx="200" cy="80" rx="60" ry="25" />
          <ellipse cx="170" cy="90" rx="40" ry="20" />
          <ellipse cx="240" cy="85" rx="45" ry="22" />
          
          <ellipse cx="600" cy="60" rx="50" ry="20" />
          <ellipse cx="580" cy="70" rx="35" ry="18" />
          <ellipse cx="630" cy="68" rx="40" ry="18" />
          
          <ellipse cx="1000" cy="100" rx="55" ry="22" />
          <ellipse cx="1030" cy="110" rx="40" ry="18" />
        </g>

        {/* Hills - Back */}
        <path d="M0,280 Q150,200 300,250 Q450,180 600,220 Q750,160 900,200 Q1050,140 1200,180 L1200,400 L0,400 Z" fill="#22c55e" opacity="0.6" />

        {/* Hills - Front */}
        <path d="M0,320 Q200,250 400,290 Q600,230 800,280 Q1000,220 1200,260 L1200,400 L0,400 Z" fill="url(#hillGradient)" />

        {/* Road */}
        <path d="M0,340 Q300,320 600,330 Q900,340 1200,320 L1200,400 L0,400 Z" fill="#374151" />
        
        {/* Road markings */}
        <g fill="#fbbf24" opacity="0.9">
          <ellipse cx="100" cy="355" rx="25" ry="4" />
          <ellipse cx="250" cy="350" rx="30" ry="4" />
          <ellipse cx="420" cy="352" rx="28" ry="4" />
          <ellipse cx="600" cy="355" rx="32" ry="4" />
          <ellipse cx="780" cy="352" rx="28" ry="4" />
          <ellipse cx="950" cy="348" rx="30" ry="4" />
          <ellipse cx="1120" cy="345" rx="25" ry="4" />
        </g>

        {/* Family SUV */}
        <g transform="translate(450, 295)">
          {/* Body */}
          <path d="M0,60 L10,40 Q25,15 60,10 L180,10 Q210,15 225,40 L235,58 L240,65 L240,85 L230,90 L10,90 L0,85 Z" fill="url(#suvGradient)" />
          {/* Roof rack */}
          <rect x="50" y="5" width="130" height="6" rx="2" fill="#334155" />
          <rect x="60" y="2" width="30" height="5" rx="2" fill="#475569" />
          <rect x="140" y="2" width="30" height="5" rx="2" fill="#475569" />
          {/* Windows */}
          <path d="M20,42 Q35,20 60,16 L170,16 Q195,22 210,42 L20,42" fill="#7dd3fc" opacity="0.7" />
          {/* Window divider */}
          <rect x="115" y="18" width="4" height="24" fill="#1e40af" />
          {/* Door handles */}
          <rect x="75" y="55" width="15" height="4" rx="2" fill="#1e3a8a" />
          <rect x="145" y="55" width="15" height="4" rx="2" fill="#1e3a8a" />
          {/* Wheels */}
          <circle cx="50" cy="85" r="22" fill="#1e293b" />
          <circle cx="50" cy="85" r="15" fill="#475569" />
          <circle cx="50" cy="85" r="6" fill="#6b7280" />
          <circle cx="190" cy="85" r="22" fill="#1e293b" />
          <circle cx="190" cy="85" r="15" fill="#475569" />
          <circle cx="190" cy="85" r="6" fill="#6b7280" />
          {/* Headlights */}
          <ellipse cx="238" cy="70" rx="6" ry="8" fill="#fef3c7" />
          {/* Taillights */}
          <rect x="0" y="62" width="6" height="15" rx="2" fill="#ef4444" />
        </g>

        {/* Birds */}
        <g stroke="#1f2937" strokeWidth="2" fill="none" opacity="0.6">
          <path d="M100,120 Q110,115 115,120 Q120,115 130,120" />
          <path d="M150,100 Q160,95 165,100 Q170,95 180,100" />
          <path d="M1050,130 Q1060,125 1065,130 Q1070,125 1080,130" />
        </g>

        {/* Trees silhouette on hills */}
        <g fill="#166534">
          <path d="M50,310 L60,280 L55,285 L65,260 L60,265 L70,240 L80,265 L75,260 L85,285 L80,280 L90,310 Z" />
          <path d="M180,300 L190,275 L185,278 L195,255 L190,260 L200,235 L210,260 L205,255 L215,278 L210,275 L220,300 Z" />
          <path d="M1050,290 L1060,265 L1055,268 L1065,245 L1060,250 L1070,225 L1080,250 L1075,245 L1085,268 L1080,265 L1090,290 Z" />
          <path d="M1130,295 L1138,275 L1135,278 L1142,260 L1138,263 L1145,245 L1152,263 L1148,260 L1155,278 L1152,275 L1160,295 Z" />
        </g>

        {/* Animated Shine */}
        <rect x="-100" y="0" width="60" height="400" fill="white" opacity="0.08">
          <animate attributeName="x" from="-100" to="1300" dur="4s" repeatCount="indefinite" />
        </rect>
      </svg>

      {/* Marketing Text */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-black/50 via-transparent to-black/50">
        <div className="text-center text-white px-4 max-w-4xl">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
            Adventure Starts Here
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl opacity-90 drop-shadow-md">
            Family Cars • SUVs • 150+ Safety Checks • Free Home Test Drive
          </p>
        </div>
      </div>
    </div>
  );
});
FamilyRoadTripHero.displayName = "FamilyRoadTripHero";

// Cars24-Style Promotional Banner
const PromoBannerHero = memo(() => {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
      {/* Decorative elements */}
      <div className="absolute inset-0">
        {/* Circles */}
        <div className="absolute top-10 right-20 w-64 h-64 rounded-full bg-white/5 blur-xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-blue-400/10 blur-2xl" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-yellow-400/10 blur-xl" />
        
        {/* Dotted pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="white" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left - Text */}
          <div className="text-white space-y-4 md:space-y-6">
            <div className="inline-flex items-center gap-2 bg-yellow-500/20 backdrop-blur px-4 py-2 rounded-full text-yellow-300 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
              </span>
              Limited Time Offer
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Get <span className="text-yellow-400">₹50,000</span> Off
              <br />
              On Your First Car
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-md">
              Use code <span className="font-bold bg-white/20 px-2 py-0.5 rounded">FIRST50</span> at checkout. Valid till month end.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold px-8 py-3 rounded-full transition-all shadow-lg shadow-yellow-500/30 hover:shadow-yellow-400/40">
                Browse Cars
              </button>
              <button className="bg-white/10 hover:bg-white/20 backdrop-blur text-white font-medium px-6 py-3 rounded-full border border-white/20 transition-all">
                View Offers
              </button>
            </div>
          </div>

          {/* Right - Stats */}
          <div className="hidden md:grid grid-cols-2 gap-4">
            {[
              { value: "10,000+", label: "Verified Cars" },
              { value: "500+", label: "Trusted Dealers" },
              { value: "4.8★", label: "Customer Rating" },
              { value: "7 Days", label: "Return Policy" },
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-colors">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-blue-200 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
PromoBannerHero.displayName = "PromoBannerHero";

// Hero Carousel Component
interface HeroCarouselProps {
  autoplayInterval?: number;
}

const HeroCarousel = memo(({ autoplayInterval = 5000 }: HeroCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [PromoBannerHero, AutoShowroomHero, PremiumRacingHero, FamilyRoadTripHero];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoplayInterval);

    return () => clearInterval(timer);
  }, [autoplayInterval, slides.length]);

  const CurrentHero = slides[currentSlide];

  return (
    <div className="relative w-full h-full">
      <div className="w-full h-full transition-opacity duration-500">
        <CurrentHero />
      </div>
      
      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === currentSlide
                ? 'bg-white w-6'
                : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
});

HeroCarousel.displayName = "HeroCarousel";

export { HeroCarousel, PremiumRacingHero, FamilyRoadTripHero, PromoBannerHero };
export default HeroCarousel;
