interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      className="rounded-xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-red-200"
      role="alert"
    >
      {message}
    </div>
  );
}
