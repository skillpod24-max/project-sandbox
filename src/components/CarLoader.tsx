interface CarLoaderProps {
  variant?: "center" | "top";
  text?: string;
}

const CarLoader = ({
  variant = "center",
  text = "Loading your workspace…",
}: CarLoaderProps) => {
  return (
    <div
      className={`w-full ${
        variant === "center"
          ? "min-h-screen flex flex-col items-center justify-center bg-slate-50"
          : "flex flex-col items-center pt-12 pb-6"
      }`}
    >
      {/* Racing Car SVG with proper wheel rotation */}
      <svg
        width="200"
        height="100"
        viewBox="0 0 200 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="car-animation"
      >
        {/* Shadow */}
        <ellipse cx="100" cy="88" rx="60" ry="6" fill="#E2E8F0" className="shadow-pulse" />
        
        {/* Car Body */}
        <g className="car-body">
          {/* Main body - blue sports car */}
          <path 
            d="M30 55 L45 55 L55 40 L95 35 L130 35 L145 45 L170 50 L170 65 L30 65 Z" 
            fill="#3B82F6" 
            stroke="#2563EB" 
            strokeWidth="1"
          />
          
          {/* Roof/cabin */}
          <path 
            d="M60 40 L90 33 L120 33 L140 42 L135 52 L65 52 Z" 
            fill="#1F2937"
          />
          
          {/* Front windshield */}
          <path 
            d="M63 42 L88 36 L88 50 L68 50 Z" 
            fill="#93C5FD"
            opacity="0.8"
          />
          
          {/* Rear windshield */}
          <path 
            d="M95 36 L118 36 L132 45 L132 50 L95 50 Z" 
            fill="#93C5FD"
            opacity="0.8"
          />
          
          {/* Spoiler */}
          <rect x="140" y="32" width="25" height="4" rx="1" fill="#374151" />
          <rect x="145" y="36" width="3" height="8" fill="#374151" />
          <rect x="158" y="36" width="3" height="8" fill="#374151" />
          
          {/* Side stripe */}
          <rect x="35" y="56" width="130" height="4" fill="#60A5FA" />
          
          {/* Headlight */}
          <ellipse cx="35" cy="58" rx="4" ry="3" fill="#FEF3C7" />
          
          {/* Taillight */}
          <rect x="165" y="54" width="4" height="6" rx="1" fill="#EF4444" />
          
          {/* Front wheel well */}
          <path d="M45 65 Q45 55 55 55 Q65 55 65 65" fill="#1F2937" />
          
          {/* Rear wheel well */}
          <path d="M135 65 Q135 55 145 55 Q155 55 155 65" fill="#1F2937" />
        </g>
        
        {/* Front wheel with spokes - separate rotating group */}
        <g>
          <circle cx="55" cy="70" r="12" fill="#1F2937" />
          <g className="front-wheel-inner">
            <circle cx="55" cy="70" r="9" fill="#374151" />
            {/* Spokes */}
            <line x1="55" y1="62" x2="55" y2="78" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="47" y1="70" x2="63" y2="70" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="49" y1="64" x2="61" y2="76" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="49" y1="76" x2="61" y2="64" stroke="#9CA3AF" strokeWidth="2" />
          </g>
          <circle cx="55" cy="70" r="3" fill="#6B7280" />
        </g>
        
        {/* Rear wheel with spokes - separate rotating group */}
        <g>
          <circle cx="145" cy="70" r="12" fill="#1F2937" />
          <g className="rear-wheel-inner">
            <circle cx="145" cy="70" r="9" fill="#374151" />
            {/* Spokes */}
            <line x1="145" y1="62" x2="145" y2="78" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="137" y1="70" x2="153" y2="70" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="139" y1="64" x2="151" y2="76" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="139" y1="76" x2="151" y2="64" stroke="#9CA3AF" strokeWidth="2" />
          </g>
          <circle cx="145" cy="70" r="3" fill="#6B7280" />
        </g>

        {/* Speed lines */}
        <g className="speed-lines">
          <line x1="5" y1="50" x2="20" y2="50" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="58" x2="25" y2="58" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          <line x1="10" y1="66" x2="22" y2="66" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>

      <p className="mt-4 text-sm text-muted-foreground font-medium">{text}</p>

      <style>
        {`
          .car-animation {
            animation: car-drive 1.5s ease-in-out infinite;
          }

          @keyframes car-drive {
            0%, 100% { transform: translateY(0) translateX(0); }
            25% { transform: translateY(-3px) translateX(2px); }
            50% { transform: translateY(-6px) translateX(0); }
            75% { transform: translateY(-3px) translateX(-2px); }
          }

          .shadow-pulse {
            animation: shadow-scale 1.5s ease-in-out infinite;
          }

          @keyframes shadow-scale {
            0%, 100% { transform: scaleX(1); opacity: 0.5; }
            50% { transform: scaleX(0.85); opacity: 0.3; }
          }

          .front-wheel-inner {
            animation: wheel-spin-front 0.3s linear infinite;
            transform-origin: 55px 70px;
            transform-box: fill-box;
          }
          
          .rear-wheel-inner {
            animation: wheel-spin-rear 0.3s linear infinite;
            transform-origin: 145px 70px;
            transform-box: fill-box;
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
            animation: speed-flash 0.4s ease-in-out infinite;
          }

          @keyframes speed-flash {
            0%, 100% { opacity: 0.2; transform: translateX(0); }
            50% { opacity: 0.7; transform: translateX(-5px); }
          }

          .car-body {
            animation: car-shake 0.15s ease-in-out infinite;
          }

          @keyframes car-shake {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(1px); }
          }
        `}
      </style>
    </div>
  );
};

export default CarLoader;
