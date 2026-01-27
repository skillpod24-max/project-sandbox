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
          ? "min-h-screen flex flex-col items-center justify-center"
          : "flex flex-col items-center pt-12 pb-6"
      }`}
    >
      <svg
        width="180"
        height="100"
        viewBox="0 0 300 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-pulse"
      >
        {/* Road */}
        <rect x="0" y="90" width="300" height="4" fill="#9CA3AF" />
        <rect x="0" y="96" width="300" height="2" fill="#D1D5DB" />

        {/* Car */}
        <g className="animate-car">
          <rect x="60" y="45" rx="10" ry="10" width="120" height="30" fill="#2563EB" />
          <rect x="85" y="30" rx="6" ry="6" width="60" height="20" fill="#3B82F6" />

          {/* Windows */}
          <rect x="92" y="34" width="20" height="14" rx="3" fill="#E5E7EB" />
          <rect x="118" y="34" width="20" height="14" rx="3" fill="#E5E7EB" />

          {/* Wheels */}
          <circle cx="85" cy="80" r="10" fill="#111827" />
          <circle cx="155" cy="80" r="10" fill="#111827" />
          <circle cx="85" cy="80" r="5" fill="#9CA3AF" />
          <circle cx="155" cy="80" r="5" fill="#9CA3AF" />
        </g>
      </svg>

      <p className="mt-3 text-sm text-muted-foreground">{text}</p>

      <style>
        {`
          .animate-car {
            animation: drive 1.6s ease-in-out infinite;
          }

          @keyframes drive {
            0% { transform: translateX(-30px); }
            50% { transform: translateX(30px); }
            100% { transform: translateX(-30px); }
          }
        `}
      </style>
    </div>
  );
};

export default CarLoader;
