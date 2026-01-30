import { memo } from "react";

const AutoShowroomHero = memo(() => {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <svg
        viewBox="0 0 1200 400"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Gradient backgrounds */}
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="50%" stopColor="#2d5a87" />
            <stop offset="100%" stopColor="#4a90c2" />
          </linearGradient>
          
          <linearGradient id="buildingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e8f4fc" />
            <stop offset="100%" stopColor="#b8d4e8" />
          </linearGradient>
          
          <linearGradient id="glassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d4e8f5" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#a8d4f0" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#7ec8ed" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="carOrange" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          <linearGradient id="carBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>

          <linearGradient id="carRed" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>

          <linearGradient id="floorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect width="1200" height="400" fill="url(#skyGradient)" />

        {/* City Buildings Background */}
        <g opacity="0.6">
          <rect x="50" y="80" width="80" height="220" fill="#1e3a5f" />
          <rect x="140" y="60" width="60" height="240" fill="#234466" />
          <rect x="210" y="100" width="70" height="200" fill="#2a4d73" />
          <rect x="1000" y="70" width="70" height="230" fill="#1e3a5f" />
          <rect x="1080" y="90" width="60" height="210" fill="#234466" />
          <rect x="1150" y="50" width="50" height="250" fill="#2a4d73" />
        </g>

        {/* Main Showroom Building */}
        <rect x="200" y="100" width="800" height="250" fill="url(#buildingGradient)" rx="5" />

        {/* Glass Panels */}
        <g fill="url(#glassGradient)">
          <rect x="220" y="120" width="150" height="180" rx="3" />
          <rect x="390" y="120" width="150" height="180" rx="3" />
          <rect x="560" y="120" width="150" height="180" rx="3" />
          <rect x="730" y="120" width="150" height="180" rx="3" />
          <rect x="900" y="120" width="80" height="180" rx="3" />
        </g>

        {/* Glass Reflections */}
        <g fill="white" opacity="0.3">
          <rect x="225" y="125" width="10" height="170" />
          <rect x="395" y="125" width="10" height="170" />
          <rect x="565" y="125" width="10" height="170" />
          <rect x="735" y="125" width="10" height="170" />
        </g>

        {/* Roof Structure */}
        <rect x="200" y="95" width="800" height="20" fill="#475569" />
        <rect x="195" y="85" width="810" height="15" fill="#334155" />

        {/* Floor */}
        <rect x="0" y="300" width="1200" height="100" fill="url(#floorGradient)" />
        
        {/* Floor Lines */}
        <g stroke="#64748b" strokeWidth="1" opacity="0.5">
          <line x1="0" y1="320" x2="1200" y2="320" />
          <line x1="0" y1="340" x2="1200" y2="340" />
          <line x1="0" y1="360" x2="1200" y2="360" />
        </g>

        {/* Orange Car (Left) */}
        <g transform="translate(150, 260)">
          {/* Body */}
          <path d="M20,40 L30,20 Q50,5 90,5 L140,5 Q160,5 170,20 L180,40 L185,45 L185,60 L175,65 L25,65 L15,60 L15,45 Z" fill="url(#carOrange)" />
          {/* Windows */}
          <path d="M35,22 Q50,10 90,10 L130,10 Q145,10 155,22 L35,22" fill="#1e293b" opacity="0.8" />
          {/* Wheels */}
          <circle cx="50" cy="60" r="18" fill="#1e293b" />
          <circle cx="50" cy="60" r="10" fill="#475569" />
          <circle cx="150" cy="60" r="18" fill="#1e293b" />
          <circle cx="150" cy="60" r="10" fill="#475569" />
          {/* Headlights */}
          <ellipse cx="180" cy="45" rx="8" ry="5" fill="#fef3c7" />
        </g>

        {/* Blue SUV (Center-Left) */}
        <g transform="translate(380, 255)">
          {/* Body */}
          <path d="M15,50 L25,25 Q40,8 80,8 L130,8 Q155,8 165,25 L175,50 L180,55 L180,70 L170,75 L20,75 L10,70 L10,55 Z" fill="url(#carBlue)" />
          {/* Windows */}
          <path d="M32,28 Q45,14 80,14 L125,14 Q140,14 152,28 L32,28" fill="#1e293b" opacity="0.8" />
          {/* Wheels */}
          <circle cx="45" cy="68" r="20" fill="#1e293b" />
          <circle cx="45" cy="68" r="12" fill="#475569" />
          <circle cx="145" cy="68" r="20" fill="#1e293b" />
          <circle cx="145" cy="68" r="12" fill="#475569" />
          {/* Roof Rails */}
          <rect x="40" y="5" width="110" height="4" rx="2" fill="#334155" />
        </g>

        {/* Red Sports Car (Center-Right) */}
        <g transform="translate(620, 270)">
          {/* Body */}
          <path d="M25,30 L40,12 Q60,0 100,0 L150,0 Q175,0 190,15 L200,35 L205,40 L205,52 L195,55 L20,55 L10,52 L10,40 Z" fill="url(#carRed)" />
          {/* Windows */}
          <path d="M48,15 Q65,5 100,5 L145,5 Q165,5 178,18 L48,18" fill="#1e293b" opacity="0.8" />
          {/* Wheels */}
          <circle cx="55" cy="50" r="16" fill="#1e293b" />
          <circle cx="55" cy="50" r="9" fill="#475569" />
          <circle cx="160" cy="50" r="16" fill="#1e293b" />
          <circle cx="160" cy="50" r="9" fill="#475569" />
          {/* Spoiler */}
          <rect x="5" y="25" width="25" height="5" rx="2" fill="#991b1b" />
        </g>

        {/* Yellow Hatchback (Right) */}
        <g transform="translate(880, 268)">
          {/* Body */}
          <path d="M20,35 L30,18 Q45,5 80,5 L120,5 Q140,5 150,18 L155,35 L160,40 L160,55 L150,58 L18,58 L8,55 L8,40 Z" fill="#eab308" />
          {/* Windows */}
          <path d="M35,20 Q50,10 80,10 L115,10 Q130,10 140,20 L35,20" fill="#1e293b" opacity="0.8" />
          {/* Wheels */}
          <circle cx="40" cy="52" r="15" fill="#1e293b" />
          <circle cx="40" cy="52" r="8" fill="#475569" />
          <circle cx="130" cy="52" r="15" fill="#1e293b" />
          <circle cx="130" cy="52" r="8" fill="#475569" />
        </g>

        {/* Decorative Elements */}
        <g>
          {/* Signage */}
          <rect x="530" y="45" width="140" height="35" rx="5" fill="#1e40af" />
          <text x="600" y="70" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">VAHANHUB</text>
        </g>

        {/* Trees/Plants */}
        <g>
          <circle cx="100" cy="280" r="25" fill="#15803d" opacity="0.8" />
          <rect x="96" y="290" width="8" height="20" fill="#854d0e" />
          <circle cx="1100" cy="280" r="25" fill="#15803d" opacity="0.8" />
          <rect x="1096" y="290" width="8" height="20" fill="#854d0e" />
        </g>

        {/* Animated Shine Effect */}
        <rect x="-100" y="0" width="50" height="400" fill="white" opacity="0.1">
          <animate attributeName="x" from="-100" to="1300" dur="4s" repeatCount="indefinite" />
        </rect>
      </svg>

      {/* Marketing Text Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-black/60 via-transparent to-black/60">
        <div className="text-center text-white px-4 max-w-4xl">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
            Your Dream Car Awaits
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl opacity-90 drop-shadow-md">
            10,000+ Verified Vehicles • 500+ Trusted Dealers • Best Prices Guaranteed
          </p>
        </div>
      </div>
    </div>
  );
});

AutoShowroomHero.displayName = "AutoShowroomHero";

export default AutoShowroomHero;
