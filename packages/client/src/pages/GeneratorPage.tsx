import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generatePrepPack, savePrepPack } from '../lib/api';
import type { GenerateResponse } from '../types';
import { PrepPackView } from '../components/PrepPackView';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoadingSpinner } from '../components/LoadingSpinner';

const inputBase =
  'w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-zinc-100 placeholder-zinc-500 transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
const textareaClass = `${inputBase} min-h-[120px] resize-y`;
const btnPrimary =
  'px-4 py-2 rounded-xl font-medium text-white bg-cyan-500 hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cyan-500';
const btnSecondary =
  'px-4 py-2 rounded-xl font-medium text-zinc-200 border border-white/10 bg-zinc-800 hover:bg-zinc-700 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 transition disabled:opacity-50 disabled:cursor-not-allowed';

export default function GeneratorPage() {
  const navigate = useNavigate();
  const [startupProfileText, setStartupProfileText] = useState('');
  const [investorProfileText, setInvestorProfileText] = useState('');
  const [startupName, setStartupName] = useState('');
  const [investorName, setInvestorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  const startupTrim = startupProfileText.trim();
  const investorTrim = investorProfileText.trim();
  const canGenerate = startupTrim.length > 0 && investorTrim.length > 0 && !loading;
  const canSave =
    Boolean(result?.prepPack) &&
    startupTrim.length > 0 &&
    investorTrim.length > 0 &&
    !saving &&
    !loading;

  const handleGenerate = async () => {
    if (!startupTrim || !investorTrim) {
      setError('Startup and Investor profiles are required.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await generatePrepPack({
        startupProfileText: startupTrim,
        investorProfileText: investorTrim,
        ...(startupName.trim() && { startupName: startupName.trim() }),
        ...(investorName.trim() && { investorName: investorName.trim() }),
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (loading || saving) return;
    setStartupProfileText('');
    setInvestorProfileText('');
    setStartupName('');
    setInvestorName('');
    setResult(null);
    setError(null);
    setSaveError(null);
  };

  const defaultTitle =
    startupName.trim() && investorName.trim()
      ? `${startupName.trim()} ↔ ${investorName.trim()}`
      : 'Meeting Prep Pack';

  const handleSave = async () => {
    if (!startupTrim || !investorTrim || !result?.prepPack) return;
    setSaveError(null);
    setSaving(true);
    try {
      const saved = await savePrepPack({
        title: defaultTitle,
        startupProfileText: startupTrim,
        investorProfileText: investorTrim,
        resultJson: result.prepPack,
        ...(startupName.trim() && { startupName: startupName.trim() }),
        ...(investorName.trim() && { investorName: investorName.trim() }),
        ...(result.meta?.model && { model: result.meta.model }),
        ...(result.meta?.tokensUsed != null && { tokensUsed: result.meta.tokensUsed }),
      });
      navigate(`/notes/${saved.id}`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Generate prep pack</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="block font-medium text-zinc-200">Startup profile (required)</label>
          <textarea
            className={textareaClass}
            value={startupProfileText}
            onChange={(e) => setStartupProfileText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canGenerate) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="Paste startup profile..."
          />
          <p className="text-sm text-zinc-500">{startupProfileText.length} characters</p>
        </div>
        <div className="space-y-2">
          <label className="block font-medium text-zinc-200">Investor profile (required)</label>
          <textarea
            className={textareaClass}
            value={investorProfileText}
            onChange={(e) => setInvestorProfileText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canGenerate) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="Paste investor profile..."
          />
          <p className="text-sm text-zinc-500">{investorProfileText.length} characters</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block font-medium text-sm text-zinc-200">Startup name (optional)</label>
          <input
            type="text"
            className={`${inputBase} py-2`}
            value={startupName}
            onChange={(e) => setStartupName(e.target.value)}
            placeholder="e.g. Acme Inc"
          />
        </div>
        <div className="space-y-2">
          <label className="block font-medium text-sm text-zinc-200">Investor name (optional)</label>
          <input
            type="text"
            className={`${inputBase} py-2`}
            value={investorName}
            onChange={(e) => setInvestorName(e.target.value)}
            placeholder="e.g. Sequoia"
          />
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="flex gap-3">
        <button type="button" onClick={handleGenerate} disabled={loading} className={btnPrimary}>
          Generate
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={loading || saving}
          className={btnSecondary}
        >
          Clear
        </button>
      </div>

      {loading && <LoadingSpinner />}

      {result?.prepPack && (
        <div className="space-y-4 rounded-xl border border-white/10 bg-zinc-900/60 p-6 pt-4">
          <h2 className="text-xl font-semibold text-zinc-100">Prep pack</h2>
          {result.meta && (
            <div className="text-sm text-zinc-500 space-y-0.5">
              {result.meta.model != null && result.meta.model !== '' && (
                <p>Model: {result.meta.model}</p>
              )}
              {result.meta.repaired != null && (
                <p>Repaired: {result.meta.repaired ? 'yes' : 'no'}</p>
              )}
            </div>
          )}
          <PrepPackView result={result.prepPack} />
          {saveError && <ErrorBanner message={saveError} />}
          <button type="button" onClick={handleSave} disabled={!canSave} className={btnPrimary}>
            {saving ? 'Saving…' : 'Save as note'}
          </button>
        </div>
      )}
    </div>
  );
}
