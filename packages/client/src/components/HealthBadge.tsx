import { useEffect, useState } from "react";
import { checkHealth } from "../lib/api";
import { POLL_INTERVAL_MS } from "../utilities/constants";
import type { Status } from "../types/healthBadge";

export default function HealthBadge() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const run = async () => {
      const ok = await checkHealth(signal);
      setStatus(ok ? "online" : "offline");
    };

    run();

    const id = setInterval(run, POLL_INTERVAL_MS);
    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, []);

  const config = {
    checking: {
      dot: "bg-zinc-500",
      text: "text-zinc-500",
      label: "Checking...",
    },
    online: {
      dot: "bg-emerald-500",
      text: "text-emerald-400",
      label: "Server online",
    },
    offline: {
      dot: "bg-red-500/70",
      text: "text-zinc-500",
      label: "Server offline",
    },
  } satisfies Record<Status, { dot: string; text: string; label: string }>;

  const { dot, text, label } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${text}`}
      title={label}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}
