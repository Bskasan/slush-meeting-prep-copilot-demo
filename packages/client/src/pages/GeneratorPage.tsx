import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generatePrepPack, savePrepPack } from "../lib/api";
import { PrepPackView } from "../components/PrepPackView";
import { GeneratorForm } from "../components/GeneratorForm";
import { ErrorBanner } from "../components/ErrorBanner";
import { btnPrimary } from "../styles/ui";
import type { GenerateResponse } from "../types/generateForm";
import {
  MIN_CHARS,
  MAX_CHARS,
  MAX_NAME_LEN,
  MAX_TITLE_LEN,
} from "../utilities/constants";

export default function GeneratorPage() {
  const navigate = useNavigate();
  const [startupProfileText, setStartupProfileText] = useState("");
  const [investorProfileText, setInvestorProfileText] = useState("");
  const [startupName, setStartupName] = useState("");
  const [investorName, setInvestorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  const startupTrim = startupProfileText.trim();
  const investorTrim = investorProfileText.trim();
  const startupValid =
    startupTrim.length >= MIN_CHARS && startupTrim.length <= MAX_CHARS;
  const investorValid =
    investorTrim.length >= MIN_CHARS && investorTrim.length <= MAX_CHARS;
  const namesValid =
    startupName.trim().length <= MAX_NAME_LEN &&
    investorName.trim().length <= MAX_NAME_LEN;

  const canGenerate = startupValid && investorValid && namesValid && !loading;

  const defaultTitleRaw =
    startupName.trim() && investorName.trim()
      ? `${startupName.trim()} ↔ ${investorName.trim()}`
      : "Meeting Prep Pack";
  const defaultTitle = defaultTitleRaw.slice(0, MAX_TITLE_LEN);
  const titleValid =
    defaultTitle.length >= 1 && defaultTitle.length <= MAX_TITLE_LEN;

  const canSave =
    Boolean(result?.prepPack) &&
    startupValid &&
    investorValid &&
    namesValid &&
    titleValid &&
    !saving &&
    !loading;

  const handleGenerate = async () => {
    if (!startupValid || !investorValid || !namesValid) {
      setError(
        "Startup and investor profiles must be between 80 and 8000 characters. Optional names must be at most 80 characters.",
      );
      return;
    }
    setError(null);
    setSaveError(null);
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
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (loading || saving) return;
    setStartupProfileText("");
    setInvestorProfileText("");
    setStartupName("");
    setInvestorName("");
    setResult(null);
    setError(null);
    setSaveError(null);
  };

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
        ...(result.meta?.tokensUsed != null && {
          tokensUsed: result.meta.tokensUsed,
        }),
      });
      navigate(`/notes/${saved.id}`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
          Generate prep pack
        </h1>
        <p className="text-zinc-400 text-sm">
          Paste startup and investor profiles below to generate a tailored
          meeting prep pack summary, fit score, tailored questions, and a
          15-minute agenda.
        </p>
      </div>

      <GeneratorForm
        startupProfileText={startupProfileText}
        setStartupProfileText={setStartupProfileText}
        investorProfileText={investorProfileText}
        setInvestorProfileText={setInvestorProfileText}
        startupName={startupName}
        setStartupName={setStartupName}
        investorName={investorName}
        setInvestorName={setInvestorName}
        canGenerate={canGenerate}
        loading={loading}
        saving={saving}
        error={error}
        onGenerate={handleGenerate}
        onClear={handleClear}
      />

      {result?.prepPack && (
        <div className="space-y-4 rounded-xl border border-white/10 bg-zinc-900/60 p-6 pt-4">
          <h2 className="text-xl font-semibold text-zinc-100">Prep pack</h2>
          {result.meta && (
            <div className="text-sm text-zinc-500 space-y-0.5">
              {result.meta.model != null && result.meta.model !== "" && (
                <p>Model: {result.meta.model}</p>
              )}
              {result.meta.repaired != null && (
                <p>Repaired: {result.meta.repaired ? "yes" : "no"}</p>
              )}
            </div>
          )}
          <PrepPackView result={result.prepPack} />
          {saveError && <ErrorBanner message={saveError} />}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={btnPrimary}
          >
            {saving ? "Saving…" : "Save as note"}
          </button>
        </div>
      )}
    </div>
  );
}
