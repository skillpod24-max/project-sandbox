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
      {/* Racing Car SVG - Similar to sports car */}
      <svg
        width="200"
        height="100"
        viewBox="0 0 200 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-bounce-gentle"
      >
        {/* Shadow */}
        <ellipse cx="100" cy="88" rx="60" ry="6" fill="#E2E8F0" className="animate-pulse" />
        
        {/* Car Body */}
        <g className="car-group">
          {/* Main body - yellow sports car */}
          <path 
            d="M30 55 L45 55 L55 40 L95 35 L130 35 L145 45 L170 50 L170 65 L30 65 Z" 
            fill="#FBBF24" 
            stroke="#F59E0B" 
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
          <rect x="35" y="56" width="130" height="4" fill="#FB923C" />
          
          {/* Headlight */}
          <ellipse cx="35" cy="58" rx="4" ry="3" fill="#FEF3C7" />
          
          {/* Taillight */}
          <rect x="165" y="54" width="4" height="6" rx="1" fill="#EF4444" />
          
          {/* Front wheel well */}
          <path d="M45 65 Q45 55 55 55 Q65 55 65 65" fill="#1F2937" />
          
          {/* Rear wheel well */}
          <path d="M135 65 Q135 55 145 55 Q155 55 155 65" fill="#1F2937" />
        </g>
        
        {/* Wheels */}
        <g className="wheels">
          {/* Front wheel */}
          <circle cx="55" cy="70" r="12" fill="#1F2937" />
          <circle cx="55" cy="70" r="8" fill="#374151" />
          <circle cx="55" cy="70" r="4" fill="#9CA3AF" />
          
          {/* Rear wheel */}
          <circle cx="145" cy="70" r="12" fill="#1F2937" />
          <circle cx="145" cy="70" r="8" fill="#374151" />
          <circle cx="145" cy="70" r="4" fill="#9CA3AF" />
        </g>

        {/* Speed lines */}
        <g className="speed-lines" opacity="0.4">
          <line x1="5" y1="50" x2="20" y2="50" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="58" x2="25" y2="58" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          <line x1="10" y1="66" x2="22" y2="66" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>

      <p className="mt-4 text-sm text-muted-foreground font-medium">{text}</p>

      <style>
        {`
          .animate-bounce-gentle {
            animation: bounce-gentle 1.5s ease-in-out infinite;
          }

          @keyframes bounce-gentle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }

          .car-group {
            animation: drive-shake 0.5s ease-in-out infinite;
          }

          @keyframes drive-shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-2px); }
            75% { transform: translateX(2px); }
          }

          .wheels circle {
            animation: spin-wheel 0.4s linear infinite;
            transform-origin: center;
          }

          @keyframes spin-wheel {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .speed-lines {
            animation: speed-flash 0.6s ease-in-out infinite;
          }

          @keyframes speed-flash {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.6; }
          }
        `}
      </style>
    </div>
  );
};

export default CarLoader;
