export function LoadingSpinner() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-12"
      aria-busy="true"
      role="status"
    >
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
      <span className="text-sm text-zinc-500">Loading…</span>
    </div>
  );
}
