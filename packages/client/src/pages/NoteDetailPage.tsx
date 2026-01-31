import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPrepPackById } from '../lib/api';
import type { PrepPackDetail, PrepPackResult } from '../types';
import { PrepPackView } from '../components/PrepPackView';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoadingSpinner } from '../components/LoadingSpinner';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function isAbortError(e: unknown): boolean {
  if (e instanceof Error && e.name === 'AbortError') return true;
  if (e instanceof Error && /aborted/i.test(e.message)) return true;
  if (typeof e === 'object' && e !== null && 'name' in e && (e as { name: string }).name === 'AbortError') return true;
  return false;
}

const chipClass =
  'inline-flex items-center rounded-full border border-white/5 bg-zinc-800 px-2 py-1 text-xs text-zinc-400';

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<PrepPackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('Missing note ID');
      return;
    }
    const ac = new AbortController();
    fetchPrepPackById(id, ac.signal)
      .then(setNote)
      .catch((e) => {
        if (isAbortError(e)) return;
        setError(e instanceof Error ? e.message : 'Failed to load note');
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!note) return <p className="text-zinc-500">Note not found.</p>;

  const result = note.resultJson as PrepPackResult;

  return (
    <div className="space-y-6">
      <Link
        to="/notes"
        className="inline-flex items-center text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        ← Back to notes
      </Link>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{note.title}</h1>
      <div className="flex flex-wrap gap-2">
        <span className={chipClass}>Created: {formatDate(note.createdAt)}</span>
        {note.model && <span className={chipClass}>Model: {note.model}</span>}
        {note.tokensUsed != null && (
          <span className={chipClass}>Tokens: {note.tokensUsed}</span>
        )}
        {(note.startupName || note.investorName) && (
          <span className={chipClass}>
            {[note.startupName, note.investorName].filter(Boolean).join(' · ')}
          </span>
        )}
      </div>

      <PrepPackView result={result} />

      <section>
        <details className="group rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors list-none [&::-webkit-details-marker]:hidden">
            Show raw inputs
          </summary>
          <div className="border-t border-white/10 space-y-4 p-4">
            <div>
              <h4 className="text-sm font-medium text-zinc-500 mb-1">Startup profile</h4>
              <pre className="max-h-48 overflow-auto rounded-lg border border-white/10 bg-zinc-900 p-4 text-sm text-zinc-400 whitespace-pre-wrap">
                {note.startupProfileText}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-medium text-zinc-500 mb-1">Investor profile</h4>
              <pre className="max-h-48 overflow-auto rounded-lg border border-white/10 bg-zinc-900 p-4 text-sm text-zinc-400 whitespace-pre-wrap">
                {note.investorProfileText}
              </pre>
            </div>
          </div>
        </details>
      </section>
    </div>
  );
}
