"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CvSnapshotRow } from "@/lib/cv";
import type { AdminDictionary } from "@/lib/i18n/dictionaries/en/admin";
import { formatTemplate } from "@/lib/i18n/format";
import { useLocale } from "@/lib/i18n/use-locale";

function triggerDownload(blob: Blob, disposition: string | null) {
  const match = /filename="([^"]+)"/.exec(disposition ?? "");
  const filename = match?.[1] ?? "cv.pdf";
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function CvHistory({
  snapshots,
  dict: fullDict,
}: {
  snapshots: CvSnapshotRow[];
  dict: AdminDictionary;
}) {
  const router = useRouter();
  const locale = useLocale();
  const dict = fullDict.cvHistory;
  const common = fullDict.common;
  const [confirm, setConfirm] = useState<CvSnapshotRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function redownload(snapshot: CvSnapshotRow) {
    setBusy(true);
    const res = await fetch("/api/cv/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapshotId: snapshot.id }),
    });
    setBusy(false);
    if (!res.ok) return;
    const blob = await res.blob();
    triggerDownload(blob, res.headers.get("content-disposition"));
  }

  async function remove() {
    if (!confirm) return;
    setBusy(true);
    const res = await fetch(`/api/admin/cv-snapshots/${confirm.id}`, { method: "DELETE" });
    setBusy(false);
    setConfirm(null);
    if (res.ok) router.refresh();
  }

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="text-[10.5px] font-semibold tracking-[.14em] text-ac">{dict.heading}</span>
        <span className="font-sans text-[11.5px] leading-[1.4] text-dim">{dict.blurb}</span>
      </div>
      {snapshots.length === 0 ? (
        <p className="mt-4 border border-dashed border-line px-3.5 py-5 text-[11.5px] text-dim">
          {dict.empty}
        </p>
      ) : (
        <div className="mt-4 overflow-hidden border border-line">
          {snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              className="grid grid-cols-[46px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line px-3.5 py-3 last:border-b-0"
            >
              <span className="border border-line px-1.5 py-0.5 text-center text-[10px] font-semibold tracking-[.08em] text-ac">
                v{snapshot.version}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-medium leading-[1.3]">
                  {snapshot.position || dict.untitledRole} @{" "}
                  {snapshot.company || dict.untitledCompany}
                </div>
                <div className="mt-0.5 text-[10.5px] leading-[1.4] text-dim">
                  {formatDate(snapshot.createdAt, locale)} · {snapshot.locale.toUpperCase()}
                </div>
              </div>
              <span className="flex gap-1.5">
                <a
                  href={`/${locale}/admin/cv/print?snapshot=${snapshot.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-line px-2.5 py-[5px] text-[10px] font-medium tracking-[.08em] text-dim hover:border-fg hover:text-fg"
                >
                  {dict.view}
                </a>
                <Button
                  variant="secondary"
                  onClick={() => redownload(snapshot)}
                  disabled={busy}
                  className="px-2.5 py-[5px] text-[10px] font-medium tracking-[.08em]"
                >
                  {dict.redownload}
                </Button>
                <Button
                  variant="danger-ghost"
                  title={common.delete}
                  onClick={() => setConfirm(snapshot)}
                  className="size-[27px] text-[11px]"
                >
                  ×
                </Button>
              </span>
            </div>
          ))}
        </div>
      )}

      <AlertDialog.Root open={Boolean(confirm)} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-[2px]" />
          <AlertDialog.Popup className="fixed inset-0 z-[110] grid place-items-center p-6">
            <div className="w-[min(430px,100%)] border border-line bg-panel p-6">
              <p className="text-[10.5px] font-semibold tracking-[.14em] text-[oklch(.58_.17_25)]">
                {common.destructiveDelete}
              </p>
              <h3 className="mt-3.5 text-[17px] font-semibold leading-[1.3] tracking-[-.02em]">
                {formatTemplate(dict.deleteTitle, { version: confirm?.version ?? 0 })}
              </h3>
              <p className="mt-2.5 font-sans text-[13px] leading-[1.6] text-dim">
                {dict.deleteBody}
              </p>
              <div className="mt-5 flex gap-2">
                <Button
                  variant="danger"
                  onClick={remove}
                  disabled={busy}
                  className="flex-1 px-3 py-3 text-[10.5px] font-semibold tracking-[.1em]"
                >
                  {common.yesDelete}
                </Button>
                <AlertDialog.Close className="border border-line bg-transparent px-4 py-3 text-[10.5px] font-medium tracking-[.1em] text-fg outline-none hover:border-fg">
                  {common.cancel}
                </AlertDialog.Close>
              </div>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
