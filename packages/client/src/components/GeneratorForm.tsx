import {
  inputCompact,
  textareaClass,
  btnPrimary,
  btnSecondary,
} from "../styles/ui";
import { ErrorBanner } from "./ErrorBanner";
import { LoadingSpinner } from "./LoadingSpinner";
import { MIN_CHARS, MAX_CHARS, MAX_NAME_LEN } from "../utilities/constants";
import type { GeneratorFormProps } from "../types/generateForm";

export function GeneratorForm({
  startupProfileText,
  setStartupProfileText,
  investorProfileText,
  setInvestorProfileText,
  startupName,
  setStartupName,
  investorName,
  setInvestorName,
  canGenerate,
  loading,
  saving,
  error,
  onGenerate,
  onClear,
}: GeneratorFormProps) {
  const startupTrim = startupProfileText.trim();
  const investorTrim = investorProfileText.trim();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="block font-medium text-zinc-200">
            Startup profile (required)
          </label>
          <textarea
            className={textareaClass}
            value={startupProfileText}
            onChange={(e) => setStartupProfileText(e.target.value)}
            onKeyDown={(e) => {
              if (
                (e.ctrlKey || e.metaKey) &&
                e.key === "Enter" &&
                canGenerate
              ) {
                e.preventDefault();
                onGenerate();
              }
            }}
            placeholder="Paste startup profile..."
          />
          <p className="text-sm text-zinc-500">
            {startupProfileText.length} / {MAX_CHARS}
          </p>
          {startupTrim.length > 0 && startupTrim.length < MIN_CHARS && (
            <p className="text-sm text-amber-400">
              Minimum {MIN_CHARS} characters required
            </p>
          )}
          {startupTrim.length > MAX_CHARS && (
            <p className="text-sm text-amber-400">
              Maximum {MAX_CHARS} characters
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block font-medium text-zinc-200">
            Investor profile (required)
          </label>
          <textarea
            className={textareaClass}
            value={investorProfileText}
            onChange={(e) => setInvestorProfileText(e.target.value)}
            onKeyDown={(e) => {
              if (
                (e.ctrlKey || e.metaKey) &&
                e.key === "Enter" &&
                canGenerate
              ) {
                e.preventDefault();
                onGenerate();
              }
            }}
            placeholder="Paste investor profile..."
          />
          <p className="text-sm text-zinc-500">
            {investorProfileText.length} / {MAX_CHARS}
          </p>
          {investorTrim.length > 0 && investorTrim.length < MIN_CHARS && (
            <p className="text-sm text-amber-400">
              Minimum {MIN_CHARS} characters required
            </p>
          )}
          {investorTrim.length > MAX_CHARS && (
            <p className="text-sm text-amber-400">
              Maximum {MAX_CHARS} characters
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block font-medium text-sm text-zinc-200">
            Startup name (optional)
          </label>
          <input
            type="text"
            className={inputCompact}
            value={startupName}
            onChange={(e) => setStartupName(e.target.value)}
            placeholder="e.g. Acme Inc"
            maxLength={MAX_NAME_LEN}
          />
        </div>

        <div className="space-y-2">
          <label className="block font-medium text-sm text-zinc-200">
            Investor name (optional)
          </label>
          <input
            type="text"
            className={inputCompact}
            value={investorName}
            onChange={(e) => setInvestorName(e.target.value)}
            placeholder="e.g. Sequoia"
            maxLength={MAX_NAME_LEN}
          />
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          className={btnPrimary}
        >
          Generate
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={loading || saving}
          className={btnSecondary}
        >
          Clear
        </button>
      </div>

      {loading && <LoadingSpinner />}
    </div>
  );
}
