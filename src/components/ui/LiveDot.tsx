export default function LiveDot() {
  return (
    <span className="flex items-center gap-1.5 text-sm text-gray-500">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00a884] opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#00a884]" />
      </span>
      en vivo
    </span>
  );
}
