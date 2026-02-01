import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPrepPacks, deletePrepPack } from "../lib/api";
import type { PrepPackListItem } from "../types/prePack";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { ErrorBanner } from "../components/ErrorBanner";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { formatDate } from "../utilities/dateFormat";
import { btnDangerSmall } from "../styles/ui";

export default function NotesListPage() {
  const [items, setItems] = useState<PrepPackListItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetchPrepPacks(ac.signal)
      .then(setItems)
      .catch((e) => {
        if (
          e instanceof Error &&
          (e.name === "AbortError" || /aborted/i.test(e.message))
        )
          return;
        setError(e instanceof Error ? e.message : "Failed to load notes");
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, []);

  const handleDeleteClick = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteModalId(itemId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalId) return;
    setListError(null);
    setDeletingId(deleteModalId);
    try {
      await deletePrepPack(deleteModalId);
      setItems((prev) => prev.filter((i) => i.id !== deleteModalId));
      setDeleteModalId(null);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Notes</h1>
      {listError && <ErrorBanner message={listError} />}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/40 p-8 text-center text-zinc-500">
          No saved prep packs yet. Generate one from the Generate page.
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-zinc-900/60 p-4 transition-colors hover:border-cyan-400/30 hover:bg-zinc-900/80">
                  <Link to={`/notes/${item.id}`} className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-zinc-100">
                        {item.title}
                      </span>
                      {item.fitScore != null && (
                        <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-medium text-cyan-300">
                          {item.fitScore}/100
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-zinc-500">
                      {formatDate(item.createdAt)}
                      {(item.startupName || item.investorName) && (
                        <span className="ml-2">
                          ·{" "}
                          {[item.startupName, item.investorName]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(e, item.id)}
                    disabled={deletingId !== null}
                    className={btnDangerSmall}
                    title="Delete note"
                  >
                    {deletingId === item.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <ConfirmationModal
            isOpen={deleteModalId !== null}
            onClose={() => setDeleteModalId(null)}
            onConfirm={handleDeleteConfirm}
            title="Delete note"
            description="Are you sure you want to delete this note? This action cannot be undone."
            confirmLabel="Delete"
            cancelLabel="Cancel"
            confirmVariant="danger"
            isLoading={deletingId !== null}
          />
        </>
      )}
    </div>
  );
}
