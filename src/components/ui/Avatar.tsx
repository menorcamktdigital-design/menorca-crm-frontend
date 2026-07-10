interface AvatarProps {
  nombre: string | null;
  numero?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "h-10 w-10 text-base",
  md: "h-12 w-12 text-lg",
  lg: "h-14 w-14 text-xl",
};

// Colores estables por contacto (hash simple del número/nombre)
const COLORS = [
  "bg-emerald-600",
  "bg-teal-600",
  "bg-cyan-700",
  "bg-sky-700",
  "bg-indigo-600",
  "bg-violet-600",
  "bg-rose-600",
  "bg-amber-600",
];

function hashColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
}

export default function Avatar({ nombre, numero = "", size = "md" }: AvatarProps) {
  const inicial = (nombre?.trim()?.[0] || numero?.[0] || "?").toUpperCase();
  return (
    <div
      className={`${SIZES[size]} ${hashColor(numero || nombre || "?")} flex shrink-0 items-center justify-center rounded-full font-semibold text-white`}
    >
      {inicial}
    </div>
  );
}
