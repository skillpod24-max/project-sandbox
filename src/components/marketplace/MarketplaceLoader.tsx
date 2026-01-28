interface MarketplaceLoaderProps {
  text?: string;
}

const MarketplaceLoader = ({ text = "Loading..." }: MarketplaceLoaderProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Supercar SVG with proper wheel rotation */}
      <svg
        width="240"
        height="120"
        viewBox="0 0 240 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="supercar-animation"
      >
        {/* Ground Shadow */}
        <ellipse cx="120" cy="105" rx="80" ry="8" fill="#E2E8F0" className="shadow-pulse" />
        
        {/* Speed Lines - behind car */}
        <g className="speed-lines">
          <line x1="5" y1="55" x2="30" y2="55" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
          <line x1="10" y1="65" x2="35" y2="65" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="75" x2="28" y2="75" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
          <line x1="15" y1="45" x2="35" y2="45" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        </g>

        <g className="car-body">
          {/* Main Body - Sleek Sports Car */}
          <path 
            d="M45 70 L55 70 L60 55 L75 45 L110 38 L155 38 L180 48 L195 55 L210 62 L210 78 L45 78 Z" 
            fill="url(#carGradient)"
            stroke="#DC2626"
            strokeWidth="1"
          />
          
          {/* Hood accent */}
          <path 
            d="M62 55 L75 46 L140 40 L165 42 L175 50 L160 52 L80 54 Z" 
            fill="#EF4444"
          />
          
          {/* Roof/Cabin - Low sports style */}
          <path 
            d="M85 45 L100 35 L140 32 L165 38 L175 48 L170 55 L90 55 Z" 
            fill="#1F2937"
          />
          
          {/* Front Windshield */}
          <path 
            d="M88 48 L100 38 L115 35 L115 52 L92 52 Z" 
            fill="#60A5FA"
            opacity="0.8"
          />
          
          {/* Rear Windshield */}
          <path 
            d="M120 35 L138 35 L160 43 L165 52 L120 52 Z" 
            fill="#60A5FA"
            opacity="0.8"
          />
          
          {/* Rear Spoiler */}
          <rect x="175" y="32" width="30" height="4" rx="2" fill="#374151" />
          <rect x="180" y="36" width="4" height="10" fill="#374151" />
          <rect x="198" y="36" width="4" height="10" fill="#374151" />
          
          {/* Side Vent */}
          <path d="M100 58 L120 58 L118 65 L102 65 Z" fill="#1F2937" />
          <line x1="104" y1="60" x2="116" y2="60" stroke="#9CA3AF" strokeWidth="1" />
          <line x1="105" y1="63" x2="115" y2="63" stroke="#9CA3AF" strokeWidth="1" />
          
          {/* Door Line */}
          <line x1="130" y1="52" x2="135" y2="75" stroke="#DC2626" strokeWidth="1" />
          
          {/* Side Stripe */}
          <rect x="50" y="68" width="155" height="5" fill="#FEE2E2" />
          
          {/* Headlight - Aggressive LED style */}
          <path d="M48 66 L55 60 L55 72 L48 72 Z" fill="#FEF3C7" />
          <circle cx="52" cy="67" r="2" fill="#FDE047" />
          
          {/* Taillight LED strip */}
          <rect x="205" y="62" width="4" height="12" rx="1" fill="#EF4444" className="taillight-glow" />
          <rect x="207" y="64" width="2" height="8" fill="#FCA5A5" />
          
          {/* Front wheel well */}
          <path d="M58 78 Q58 62 75 62 Q92 62 92 78" fill="#1F2937" />
          
          {/* Rear wheel well */}
          <path d="M160 78 Q160 62 177 62 Q194 62 194 78" fill="#1F2937" />
          
          {/* Front bumper detail */}
          <path d="M45 72 L55 68 L55 78 L45 78 Z" fill="#374151" />
          
          {/* Rear diffuser */}
          <path d="M195 75 L210 70 L210 78 L195 78 Z" fill="#374151" />
        </g>
        
        {/* Front Wheel with proper rotation */}
        <g className="wheel wheel-front">
          <circle cx="75" cy="85" r="15" fill="#1F2937" />
          <circle cx="75" cy="85" r="12" fill="#374151" />
          {/* 5-spoke rim */}
          <g className="wheel-spokes">
            <line x1="75" y1="74" x2="75" y2="96" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="64" y1="85" x2="86" y2="85" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="67" y1="78" x2="83" y2="92" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="67" y1="92" x2="83" y2="78" stroke="#9CA3AF" strokeWidth="2" />
          </g>
          <circle cx="75" cy="85" r="4" fill="#6B7280" />
          <circle cx="75" cy="85" r="2" fill="#9CA3AF" />
        </g>
        
        {/* Rear Wheel with proper rotation */}
        <g className="wheel wheel-rear">
          <circle cx="177" cy="85" r="15" fill="#1F2937" />
          <circle cx="177" cy="85" r="12" fill="#374151" />
          {/* 5-spoke rim */}
          <g className="wheel-spokes">
            <line x1="177" y1="74" x2="177" y2="96" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="166" y1="85" x2="188" y2="85" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="169" y1="78" x2="185" y2="92" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="169" y1="92" x2="185" y2="78" stroke="#9CA3AF" strokeWidth="2" />
          </g>
          <circle cx="177" cy="85" r="4" fill="#6B7280" />
          <circle cx="177" cy="85" r="2" fill="#9CA3AF" />
        </g>

        {/* Gradient Definition */}
        <defs>
          <linearGradient id="carGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="50%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>
        </defs>
      </svg>

      {/* Loading Text */}
      <div className="mt-6 flex items-center gap-2">
        <div className="flex gap-1">
          <span className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-sm font-medium text-slate-600">{text}</p>
      </div>

      <style>
        {`
          .supercar-animation {
            animation: car-hover 1.2s ease-in-out infinite;
          }

          @keyframes car-hover {
            0%, 100% { transform: translateY(0) translateX(0); }
            25% { transform: translateY(-4px) translateX(3px); }
            50% { transform: translateY(-6px) translateX(0); }
            75% { transform: translateY(-4px) translateX(-3px); }
          }

          .shadow-pulse {
            animation: shadow-scale 1.2s ease-in-out infinite;
            transform-origin: center;
          }

          @keyframes shadow-scale {
            0%, 100% { transform: scaleX(1); opacity: 0.6; }
            50% { transform: scaleX(0.8); opacity: 0.3; }
          }

          .wheel-front {
            animation: wheel-spin-front 0.4s linear infinite;
            transform-origin: 75px 85px;
          }
          
          .wheel-rear {
            animation: wheel-spin-rear 0.4s linear infinite;
            transform-origin: 177px 85px;
          }

          @keyframes wheel-spin-front {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes wheel-spin-rear {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .speed-lines {
            animation: speed-flash 0.5s ease-in-out infinite;
          }

          @keyframes speed-flash {
            0%, 100% { opacity: 0.2; transform: translateX(0); }
            50% { opacity: 0.8; transform: translateX(-8px); }
          }

          .car-body {
            animation: car-shake 0.12s ease-in-out infinite;
          }

          @keyframes car-shake {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(1px); }
          }
          
          .taillight-glow {
            animation: glow 0.8s ease-in-out infinite alternate;
          }
          
          @keyframes glow {
            0% { opacity: 0.7; }
            100% { opacity: 1; filter: brightness(1.2); }
          }
        `}
      </style>
    </div>
  );
};

export default MarketplaceLoader;
