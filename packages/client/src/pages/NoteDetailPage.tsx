import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchPrepPackById, updatePrepPack, deletePrepPack } from '../lib/api';
import type { PrepPackDetail, PrepPackResult } from '../types';
import { PrepPackView } from '../components/PrepPackView';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { inputCompact, textareaClass, btnPrimary, btnSecondary, btnDanger, chipClass } from '../styles/ui';
import { isAbortError } from '../utilities/errors';
import { formatDate } from '../utilities/dateFormat';

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<PrepPackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStartupName, setEditStartupName] = useState('');
  const [editInvestorName, setEditInvestorName] = useState('');
  const [editStartupProfileText, setEditStartupProfileText] = useState('');
  const [editInvestorProfileText, setEditInvestorProfileText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  useEffect(() => {
    if (note) {
      setEditTitle(note.title);
      setEditStartupName(note.startupName ?? '');
      setEditInvestorName(note.investorName ?? '');
      setEditStartupProfileText(note.startupProfileText);
      setEditInvestorProfileText(note.investorProfileText);
    }
  }, [note]);

  const handleDeleteConfirm = async () => {
    if (!id || deleting) return;
    setActionError(null);
    setDeleting(true);
    try {
      await deletePrepPack(id);
      setShowDeleteModal(false);
      navigate('/notes');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editTitle.trim()) return;
    setActionError(null);
    try {
      const updated = await updatePrepPack(id, {
        title: editTitle.trim(),
        startupName: editStartupName.trim() || undefined,
        investorName: editInvestorName.trim() || undefined,
        startupProfileText: editStartupProfileText,
        investorProfileText: editInvestorProfileText,
      });
      setNote(updated);
      setEditing(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to save changes');
    }
  };

  const handleEditCancel = () => {
    setEditing(false);
    setActionError(null);
    if (note) {
      setEditTitle(note.title);
      setEditStartupName(note.startupName ?? '');
      setEditInvestorName(note.investorName ?? '');
      setEditStartupProfileText(note.startupProfileText);
      setEditInvestorProfileText(note.investorProfileText);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!note) return <p className="text-zinc-500">Note not found.</p>;

  const result = note.resultJson as PrepPackResult;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/notes"
          className="inline-flex text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          ← Back to notes
        </Link>
        {!editing && (
          <>
            <span className="text-zinc-500">·</span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={deleting}
              className={btnSecondary}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
              className={btnDanger}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        )}
      </div>

      {actionError && <ErrorBanner message={actionError} />}

      {editing ? (
        <form onSubmit={handleEditSubmit} className="space-y-4 rounded-xl border border-white/10 bg-zinc-900/60 p-6">
          <h2 className="text-lg font-semibold text-zinc-100">Edit note</h2>
          <div>
            <label className="block font-medium text-zinc-300 mb-1">Title (required)</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className={inputCompact}
              placeholder="Note title"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Startup name</label>
              <input
                type="text"
                value={editStartupName}
                onChange={(e) => setEditStartupName(e.target.value)}
                className={inputCompact}
                placeholder="e.g. Acme Inc"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Investor name</label>
              <input
                type="text"
                value={editInvestorName}
                onChange={(e) => setEditInvestorName(e.target.value)}
                className={inputCompact}
                placeholder="e.g. Sequoia"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium text-zinc-300 mb-1">Startup profile</label>
            <textarea
              value={editStartupProfileText}
              onChange={(e) => setEditStartupProfileText(e.target.value)}
              className={textareaClass}
              placeholder="Startup profile text..."
            />
          </div>
          <div>
            <label className="block font-medium text-zinc-300 mb-1">Investor profile</label>
            <textarea
              value={editInvestorProfileText}
              onChange={(e) => setEditInvestorProfileText(e.target.value)}
              className={textareaClass}
              placeholder="Investor profile text..."
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className={btnPrimary} disabled={!editTitle.trim()}>
              Save changes
            </button>
            <button type="button" onClick={handleEditCancel} className={btnSecondary}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
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
        </>
      )}

      <PrepPackView result={result} />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isLoading={deleting}
      />

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
