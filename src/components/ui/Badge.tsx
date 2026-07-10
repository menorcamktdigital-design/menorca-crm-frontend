import { BADGE_CONFIG } from "@/types";

export default function Badge({ estado }: { estado: string }) {
  const config = BADGE_CONFIG[estado];
  if (!config) return null;
  return (
    <span
      className={`${config.className} inline-block rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap`}
    >
      {config.label}
    </span>
  );
}
