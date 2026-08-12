"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AdminDictionary } from "@/lib/i18n/dictionaries/en/admin";

export function DataPanel({ dict }: { dict: AdminDictionary["dataPanel"] }) {
  const [importText, setImportText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }

  async function exportJson() {
    const res = await fetch("/api/admin/data");
    if (!res.ok) {
      flash(dict.toastExportFailed);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "portfolio.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    flash(dict.toastExported);
  }

  async function importJson() {
    let payload: unknown;
    try {
      payload = JSON.parse(importText);
    } catch {
      flash(dict.toastInvalidJson);
      return;
    }
    setBusy(true);
    const res = await fetch("/api/admin/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      flash(dict.toastImportFailed);
      return;
    }
    flash(dict.toastImported);
  }

  return (
    <div className="mt-6 grid max-w-[720px] gap-4">
      <section className="border border-line bg-panel p-5">
        <div className="text-[11px] font-semibold tracking-[.1em]">{dict.exportTitle}</div>
        <p className="my-2 font-sans text-[12px] leading-[1.6] text-dim">{dict.exportBlurb}</p>
        <Button
          onClick={exportJson}
          className="px-3.5 py-2.5 text-[10.5px] font-semibold tracking-[.1em]"
        >
          {dict.exportButton}
        </Button>
      </section>
      <section className="border border-line bg-panel p-5">
        <div className="text-[11px] font-semibold tracking-[.1em]">{dict.importTitle}</div>
        <p className="my-2 font-sans text-[12px] leading-[1.6] text-dim">{dict.importBlurb}</p>
        <textarea
          rows={7}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder='{ "profile": … }'
          className="w-full resize-y border border-line bg-bg px-2.5 py-2 font-mono text-[11.5px] leading-[1.6] text-fg outline-none focus:border-ac"
        />
        <div className="mt-2.5 flex items-center gap-2">
          <Button
            variant="accent-outline"
            onClick={importJson}
            disabled={busy}
            className="px-3 py-2.5 text-[10.5px] font-semibold tracking-[.1em]"
          >
            {dict.applyImport}
          </Button>
          {toast && <span className="text-[11px] text-ac">{toast}</span>}
        </div>
      </section>
    </div>
  );
}
