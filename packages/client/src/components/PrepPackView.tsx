import type { PrepPackResult } from '../types';

interface PrepPackViewProps {
  result: PrepPackResult;
}

const sectionCard =
  'rounded-xl border border-white/10 bg-zinc-900/40 p-4 space-y-2';

export function PrepPackView({ result }: PrepPackViewProps) {
  const { startupSummary, fitScore, fitReasons, questions, agenda } = result;
  return (
    <div className="space-y-4">
      {startupSummary.length > 0 && (
        <section className={sectionCard}>
          <h3 className="text-base font-semibold text-zinc-200">Startup summary</h3>
          <ul className="list-disc list-inside space-y-1 text-zinc-300">
            {startupSummary.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}
      <section className={sectionCard}>
        <h3 className="text-base font-semibold text-zinc-200">Fit score</h3>
        <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-500/20 px-3 py-1 text-lg font-bold text-cyan-300">
          {fitScore}/100
        </span>
        {fitReasons.length > 0 && (
          <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-300">
            {fitReasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </section>
      {questions.length > 0 && (
        <section className={sectionCard}>
          <h3 className="text-base font-semibold text-zinc-200">Tailored questions</h3>
          <ol className="list-decimal list-inside space-y-1 text-zinc-300">
            {questions.slice(0, 5).map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </section>
      )}
      <section className={sectionCard}>
        <h3 className="text-base font-semibold text-zinc-200">15‑minute agenda</h3>
        <div className="space-y-3">
          {agenda.min0_2.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-500">0–2 min</h4>
              <ul className="list-disc list-inside text-zinc-300">
                {agenda.min0_2.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {agenda.min2_7.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-500">2–7 min</h4>
              <ul className="list-disc list-inside text-zinc-300">
                {agenda.min2_7.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {agenda.min7_12.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-500">7–12 min</h4>
              <ul className="list-disc list-inside text-zinc-300">
                {agenda.min7_12.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {agenda.min12_15.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-500">12–15 min</h4>
              <ul className="list-disc list-inside text-zinc-300">
                {agenda.min12_15.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
