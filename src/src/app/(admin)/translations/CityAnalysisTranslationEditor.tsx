"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import { adminApiClient, Translation } from "@/lib/api";
import "./city-analysis-preview.css";

// Default (English) copy for the city-analysis preview page, mirroring the
// public page's fallbacks. Used as the displayed text when a key has no
// translation row yet for the selected language.
const DEFAULTS: Record<string, string> = {
  "cityAnalysis.title": "🏙️ Dubai City Analysis",
  "cityAnalysis.subtitle": "Data-Driven Investment Intelligence for Smart Investors",
  "cityAnalysis.summaryTitle": "City Market Summary",
  "cityAnalysis.summary1": "Median property price in Dubai is 1,850,000 AED (504,000 USD)",
  "cityAnalysis.summary2": "Year-over-year price appreciation stands at 12.4%",
  "cityAnalysis.summary3": "Gross rental yield averages 6.8% across all property types",
  "cityAnalysis.summary4": "Net rental yield after maintenance costs is 5.2%",
  "cityAnalysis.summary5": "Sales-to-listing ratio is 0.78 indicating balanced market conditions",
  "cityAnalysis.summary6": "Market volatility index is at moderate level (6.2/10)",
  "cityAnalysis.summary7": "Average age of properties is 8.5 years",
  "cityAnalysis.summary8": "Off-plan properties offer 7.2% yield vs 6.4% for ready homes",
  "cityAnalysis.summary9": "Investment recovery period averages 15.6 years",
  "cityAnalysis.modulesTitle": "Detailed Analysis Modules",
  "cityAnalysis.module1.title": "📍 Analysis by Dubai Areas",
  "cityAnalysis.module1.body": "6 comprehensive area reports with comparative charts covering Downtown, Marina, JBR, Business Bay, JVC, and Arabian Ranches",
  "cityAnalysis.module2.title": "🏗️ Property Type Comparison",
  "cityAnalysis.module2.body": "6 detailed charts comparing off-plan vs ready properties including ROI, appreciation, and risk analysis",
  "cityAnalysis.module3.title": "🏠 Analysis of Properties by Size",
  "cityAnalysis.module3.body": "5 charts analyzing studio, 1-bedroom, 2-bedroom, 3-bedroom, and 4+ bedroom properties with yield and demand metrics",
  "cityAnalysis.module4.title": "💰 Profitability Assessment",
  "cityAnalysis.module4.body": "ROI calculator and profit projection models for different investment horizons",
  "cityAnalysis.module5.title": "🎯 Which Property to Buy",
  "cityAnalysis.module5.body": "Detailed analysis and comparison of properties by occupancy rates, proximity to metro, amenities, and other key variables to identify optimal investment opportunities",
  "cityAnalysis.module6.title": "🤝 Price Negotiation Intelligence",
  "cityAnalysis.module6.body": "Real market value analysis to help negotiate optimal purchase prices",
  "cityAnalysis.cta": "See Full City Analysis",
};

const SUMMARY_KEYS = Array.from({ length: 9 }, (_, i) => `cityAnalysis.summary${i + 1}`);
const MODULE_KEYS = Array.from({ length: 6 }, (_, i) => i + 1);

interface EditableProps {
  translationKey: string;
  initial: string;
  onEdit: (key: string, value: string) => void;
}

// Uncontrolled contentEditable text: the initial text is set via the ref key so
// React never re-renders over the caret while typing. Edits are pushed to the
// parent draft ref through the stable onEdit handler.
const Editable = memo(function Editable({ translationKey, initial, onEdit }: EditableProps) {
  return (
    <span
      // key on `initial` remounts the node when the underlying value changes
      // (e.g. after a save/reload), so the displayed text stays in sync.
      key={initial}
      data-ca-editable
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onInput={(e) => onEdit(translationKey, e.currentTarget.textContent || "")}
    >
      {initial}
    </span>
  );
});

interface Props {
  translations: Translation[];
  languageCode: string;
  onSaved: () => void;
}

export default function CityAnalysisTranslationEditor({ translations, languageCode, onSaved }: Props) {
  // Existing rows for this namespace, keyed by translation key.
  const rowByKey = useMemo(() => {
    const map = new Map<string, Translation>();
    translations
      .filter((t) => t.namespace === "cityAnalysis")
      .forEach((t) => map.set(t.translationKey, t));
    return map;
  }, [translations]);

  // Value shown for a key: its saved translation, else the English default.
  const valueFor = useCallback(
    (key: string) => rowByKey.get(key)?.translationValue ?? DEFAULTS[key] ?? "",
    [rowByKey]
  );

  // Live draft (mutated on every keystroke without re-rendering the preview).
  const draftRef = useRef<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEdit = useCallback((key: string, value: string) => {
    draftRef.current[key] = value;
    setDirty(true);
    setMessage(null);
  }, []);

  const handleReset = useCallback(() => {
    draftRef.current = {};
    setDirty(false);
    setErrorMsg(null);
    setMessage(null);
    // Remounting via a key bump restores every field to its saved value.
    onSaved();
  }, [onSaved]);

  const handleSaveAll = useCallback(async () => {
    setSaving(true);
    setErrorMsg(null);
    setMessage(null);
    try {
      const changed = Object.entries(draftRef.current).filter(
        ([key, value]) => value !== valueFor(key)
      );
      if (changed.length === 0) {
        setMessage("No changes to save.");
        setDirty(false);
        return;
      }
      for (const [key, value] of changed) {
        const existing = rowByKey.get(key);
        if (existing) {
          await adminApiClient.updateTranslation(existing.id, {
            languageCode,
            namespace: "cityAnalysis",
            translationKey: key,
            translationValue: value,
            description: existing.description || "",
          });
        } else {
          await adminApiClient.createTranslation({
            languageCode,
            namespace: "cityAnalysis",
            translationKey: key,
            translationValue: value,
            description: "",
          });
        }
      }
      draftRef.current = {};
      setDirty(false);
      setMessage(`Saved ${changed.length} change${changed.length === 1 ? "" : "s"}.`);
      onSaved();
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }, [languageCode, onSaved, rowByKey, valueFor]);

  return (
    <div className="mb-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Editing <span className="font-semibold">cityAnalysis</span> for{" "}
          <span className="font-semibold">{languageCode.toUpperCase()}</span> — click any text on the
          page below to edit it, then Save.
        </div>
        <div className="flex items-center gap-2">
          {message && <span className="text-sm text-green-600 dark:text-green-400">{message}</span>}
          {errorMsg && <span className="text-sm text-red-600">{errorMsg}</span>}
          <button
            type="button"
            onClick={handleReset}
            disabled={!dirty || saving}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={!dirty || saving}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save all changes"}
          </button>
        </div>
      </div>

      <div className="ca-preview">
        <div className="city-analysis-header">
          <h2>
            <Editable translationKey="cityAnalysis.title" initial={valueFor("cityAnalysis.title")} onEdit={handleEdit} />
          </h2>
          <p>
            <Editable translationKey="cityAnalysis.subtitle" initial={valueFor("cityAnalysis.subtitle")} onEdit={handleEdit} />
          </p>
        </div>

        <div className="city-analysis-summary">
          <div className="city-analysis-left">
            <h3>
              <Editable translationKey="cityAnalysis.summaryTitle" initial={valueFor("cityAnalysis.summaryTitle")} onEdit={handleEdit} />
            </h3>
            <ul className="city-metrics-list">
              {SUMMARY_KEYS.map((key) => (
                <li key={key}>
                  <Editable translationKey={key} initial={valueFor(key)} onEdit={handleEdit} />
                </li>
              ))}
            </ul>
          </div>

          <div className="city-analysis-right">
            <h3>
              <Editable translationKey="cityAnalysis.modulesTitle" initial={valueFor("cityAnalysis.modulesTitle")} onEdit={handleEdit} />
            </h3>
            <div className="city-analysis-cards">
              {MODULE_KEYS.map((n) => (
                <div className="city-analysis-card" key={n}>
                  <h4>
                    <Editable
                      translationKey={`cityAnalysis.module${n}.title`}
                      initial={valueFor(`cityAnalysis.module${n}.title`)}
                      onEdit={handleEdit}
                    />
                  </h4>
                  <p>
                    <Editable
                      translationKey={`cityAnalysis.module${n}.body`}
                      initial={valueFor(`cityAnalysis.module${n}.body`)}
                      onEdit={handleEdit}
                    />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="city-analysis-cta">
          <span className="city-cta-button">
            <Editable translationKey="cityAnalysis.cta" initial={valueFor("cityAnalysis.cta")} onEdit={handleEdit} />
          </span>
        </div>
      </div>
    </div>
  );
}
