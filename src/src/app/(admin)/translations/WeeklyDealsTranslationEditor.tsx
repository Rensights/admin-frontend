"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import { adminApiClient, Translation } from "@/lib/api";
import "./weekly-deals-preview.css";

// Default (English) copy for the weekly-deals preview page, mirroring the
// public page's fallbacks. Shown when a key has no translation row yet.
const DEFAULTS: Record<string, string> = {
  "weeklyDeals.section.title": "Weekly Property Deals",
  "weeklyDeals.alert.title": "Latest Alert",
  "weeklyDeals.alert.subtitle": "Hot deals discovered across Dubai areas this week!",
  "weeklyDeals.alert.area1": "🏙️ Downtown Dubai:",
  "weeklyDeals.alert.area2": "⚓ Dubai Marina:",
  "weeklyDeals.alert.area3": "🏢 Business Bay:",
  "weeklyDeals.alert.area4": "🌴 Jumeirah Beach:",
  "weeklyDeals.alert.deals": "deals",
  "weeklyDeals.alert.total": "Total active alerts:",
  "weeklyDeals.alert.view": "View This Week's Alerts",
  "weeklyDeals.highlights.title": "This Week's Highlights",
  "weeklyDeals.highlights.market": "🔥 Hottest market:",
  "weeklyDeals.highlights.marketValue": "Dubai Marina (4 deals)",
  "weeklyDeals.highlights.discount": "💎 Best discount found:",
  "weeklyDeals.highlights.discountValue": "22% below market",
  "weeklyDeals.highlights.performing": "🏆 Best performing area:",
  "weeklyDeals.highlights.performingValue": "Downtown Dubai",
  "weeklyDeals.about.title": "About Deal Alerts",
  "weeklyDeals.about.p1": "Our AI-powered system analyzes thousands of properties daily to identify underpriced opportunities across Dubai.",
  "weeklyDeals.about.p2": "Each deal is verified by expert analysts to ensure accuracy and potential value. Get notified weekly about properties priced significantly below market value in prime locations.",
  "weeklyDeals.disclaimer.title": "Disclaimer",
  "weeklyDeals.disclaimer.body": "This report is generated for informational and educational purposes only. Rensights.com is a data analytics provider, not a licensed real estate brokerage, financial advisor, or legal consultant. The \"Estimated Price\" and \"Scores\" provided are based on automated algorithms and third-party data; they do not constitute a formal appraisal or a guarantee of profit. All investments carry risk. We strongly recommend consulting with a licensed professional before making any financial commitments.",
  "weeklyDeals.disclaimer.verificationTitle": "Verification Note",
  "weeklyDeals.disclaimer.verificationBody": "We scan external websites for pricing anomalies. We do not verify the physical condition, legal title, or the authenticity of the listing. Users must perform their own due diligence (physical viewing and title deed verification) before transferring funds to any third party.",
  "weeklyDeals.disclaimer.appraisalTitle": "No Formal Appraisal",
  "weeklyDeals.disclaimer.appraisalBody": "The property estimates and scores provided by this platform are generated via automated machine learning algorithms and do not constitute a formal, legal, or professional real estate appraisal. This platform does not account for the physical condition, interior upgrades, or latent defects of a property.",
  "weeklyDeals.disclaimer.sourcesTitle": "Data Sources",
  "weeklyDeals.disclaimer.sourcesBody": "Dubai Land Department (DLD), Bayut, and various public records.",
};

const ALERT_AREAS = [
  { key: "weeklyDeals.alert.area1", count: 3 },
  { key: "weeklyDeals.alert.area2", count: 4 },
  { key: "weeklyDeals.alert.area3", count: 3 },
  { key: "weeklyDeals.alert.area4", count: 3 },
];

interface EditableProps {
  translationKey: string;
  initial: string;
  onEdit: (key: string, value: string) => void;
}

// Uncontrolled contentEditable text: initial text is set once (keyed on value)
// so React never re-renders over the caret while typing.
const Editable = memo(function Editable({ translationKey, initial, onEdit }: EditableProps) {
  return (
    <span
      key={initial}
      data-wd-editable
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

export default function WeeklyDealsTranslationEditor({ translations, languageCode, onSaved }: Props) {
  const rowByKey = useMemo(() => {
    const map = new Map<string, Translation>();
    translations
      .filter((t) => t.namespace === "weeklyDeals")
      .forEach((t) => map.set(t.translationKey, t));
    return map;
  }, [translations]);

  const valueFor = useCallback(
    (key: string) => rowByKey.get(key)?.translationValue ?? DEFAULTS[key] ?? "",
    [rowByKey]
  );

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
            namespace: "weeklyDeals",
            translationKey: key,
            translationValue: value,
            description: existing.description || "",
          });
        } else {
          await adminApiClient.createTranslation({
            languageCode,
            namespace: "weeklyDeals",
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

  const ed = (key: string) => (
    <Editable translationKey={key} initial={valueFor(key)} onEdit={handleEdit} />
  );

  return (
    <div className="mb-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Editing <span className="font-semibold">weeklyDeals</span> for{" "}
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

      <div className="wd-preview">
        {/* Card 1 — Latest Alert */}
        <div className="section-card">
          <div className="section-title">{ed("weeklyDeals.section.title")}</div>
          <div className="alert-item">
            <div className="alert-title">{ed("weeklyDeals.alert.title")}</div>
            <div className="alert-desc">{ed("weeklyDeals.alert.subtitle")}</div>
            <div className="alert-list">
              {ALERT_AREAS.map((area) => (
                <div key={area.key} className="alert-row">
                  <span>{ed(area.key)}</span>
                  <span className="alert-number">
                    {area.count} {ed("weeklyDeals.alert.deals")}
                  </span>
                </div>
              ))}
            </div>
            <div className="alert-stats">
              <span>{ed("weeklyDeals.alert.total")}</span>
              <span className="alert-number">13</span>
            </div>
          </div>
          <div className="btn">{ed("weeklyDeals.alert.view")}</div>
        </div>

        {/* Card 2 — Highlights */}
        <div className="section-card">
          <div className="section-title">{ed("weeklyDeals.highlights.title")}</div>
          <div className="highlights">
            <div>
              <span>{ed("weeklyDeals.highlights.market")}</span>
              <span className="alert-performance">{ed("weeklyDeals.highlights.marketValue")}</span>
            </div>
            <div>
              <span>{ed("weeklyDeals.highlights.discount")}</span>
              <span className="alert-performance">{ed("weeklyDeals.highlights.discountValue")}</span>
            </div>
            <div>
              <span>{ed("weeklyDeals.highlights.performing")}</span>
              <span className="alert-performance">{ed("weeklyDeals.highlights.performingValue")}</span>
            </div>
          </div>
        </div>

        {/* Card 3 — About */}
        <div className="section-card">
          <div className="section-title">{ed("weeklyDeals.about.title")}</div>
          <p className="info-text">{ed("weeklyDeals.about.p1")}</p>
          <p className="info-text">{ed("weeklyDeals.about.p2")}</p>
        </div>

        {/* Card 4 — Disclaimer */}
        <div className="section-card report-disclaimer">
          <div className="section-title">{ed("weeklyDeals.disclaimer.title")}</div>
          <p>{ed("weeklyDeals.disclaimer.body")}</p>
          <h4>{ed("weeklyDeals.disclaimer.verificationTitle")}</h4>
          <p>{ed("weeklyDeals.disclaimer.verificationBody")}</p>
          <h4>{ed("weeklyDeals.disclaimer.appraisalTitle")}</h4>
          <p>{ed("weeklyDeals.disclaimer.appraisalBody")}</p>
          <h4>{ed("weeklyDeals.disclaimer.sourcesTitle")}</h4>
          <p>{ed("weeklyDeals.disclaimer.sourcesBody")}</p>
        </div>
      </div>
    </div>
  );
}
