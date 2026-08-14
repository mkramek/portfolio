"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Dialog } from "@base-ui/react/dialog";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  type EntityRow,
  fromRaw,
  type ListEntity,
  localizeListConfig,
  setPath,
  toRaw,
} from "@/lib/admin/fields";
import type { AdminDictionary } from "@/lib/i18n/dictionaries/en/admin";
import { formatTemplate } from "@/lib/i18n/format";
import { EntryEditor } from "./entry-editor";
import { TabHeader } from "./tab-header";

type Editing = { id: string | null; raw: Record<string, string> };
type Confirm = { id: string; label: string } | null;

export function EntityView({
  entity,
  rows,
  adminMode,
  dict,
}: {
  entity: ListEntity;
  rows: EntityRow[];
  adminMode: "split" | "stacked";
  dict: AdminDictionary;
}) {
  // ListConfig carries real functions (cells/labelOf) — those can never cross the
  // Server -> Client Component boundary as props, so the config is built here, client
  // side, from the plain (string-only) dict.lists/dict.fields data instead of being
  // passed down whole from a server-rendered page.
  const config = useMemo(
    () => localizeListConfig(entity, dict.lists, dict.fields),
    [entity, dict.lists, dict.fields],
  );
  const router = useRouter();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const rowOf = (id: string | null) => rows.find((row) => row.id === id) ?? null;

  function openEditor(id: string | null) {
    const row = rowOf(id);
    const raw: Record<string, string> = {};
    for (const field of config.fields) raw[field.key] = toRaw(field, row);
    if (!row && config.entity === "roles") raw.depth = "simple";
    setEditing({ id, raw });
    setMessage(null);
  }

  async function save() {
    if (!editing) return;
    const built: Record<string, unknown> = {};
    for (const field of config.fields)
      setPath(built, field.key, fromRaw(field, editing.raw[field.key]));
    const existing = rowOf(editing.id);
    setBusy(true);
    const res = await fetch(editing.id ? `${config.apiBase}/${editing.id}` : config.apiBase, {
      method: editing.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing.id ? { ...built, sortOrder: existing?.sortOrder ?? 0 } : built),
    });
    setBusy(false);
    if (!res.ok) {
      setMessage(dict.common.couldNotSave);
      return;
    }
    setEditing(null);
    router.refresh();
  }

  async function remove() {
    if (!confirm) return;
    setBusy(true);
    const res = await fetch(`${config.apiBase}/${confirm.id}`, { method: "DELETE" });
    setBusy(false);
    setConfirm(null);
    if (res.ok) router.refresh();
  }

  async function move(id: string, dir: -1 | 1) {
    const res = await fetch(`${config.apiBase}/${id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dir }),
    });
    if (res.ok) router.refresh();
  }

  async function toggleCv(id: string) {
    const row = rowOf(id);
    if (!row) return;
    const res = await fetch(`${config.apiBase}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...row, includeInCv: !row.includeInCv }),
    });
    if (res.ok) router.refresh();
  }

  const split = adminMode === "split";
  const editorOpen = Boolean(editing);
  const editorTitle = editing
    ? `${editing.id ? dict.entryEditor.editPrefix : dict.entryEditor.newPrefix} ${config.title.toUpperCase()}`
    : "";

  const editor = editing ? (
    <EntryEditor
      title={editorTitle}
      fields={config.fields}
      raw={editing.raw}
      onRaw={(key, value) =>
        setEditing((prev) => (prev ? { ...prev, raw: { ...prev.raw, [key]: value } } : prev))
      }
      onSave={save}
      onCancel={() => setEditing(null)}
      busy={busy}
      dict={dict.common}
    />
  ) : null;

  return (
    <div>
      <TabHeader
        title={config.title}
        help={config.help}
        action={
          <Button
            onClick={() => openEditor(null)}
            className="px-3 py-2 text-[10.5px] font-semibold tracking-[.1em]"
          >
            {dict.common.newEntry}
          </Button>
        }
      />
      {message && <p className="mt-4 text-xs text-dim">{message}</p>}

      <div
        className={`mt-6 gap-5 ${split && editorOpen ? "grid items-start" : ""}`}
        style={split && editorOpen ? { gridTemplateColumns: "minmax(0,1fr) 380px" } : undefined}
      >
        <div className="min-w-0">
          <div className="overflow-hidden border border-line">
            <div
              className="grid items-center gap-3.5 border-b border-line bg-panel2 px-3.5 py-2.5 text-[10px] font-semibold tracking-[.1em] text-dim"
              style={{ gridTemplateColumns: config.colTemplate }}
            >
              {config.columns.map((column) => (
                <span key={column}>{column}</span>
              ))}
              <span className="text-right">{dict.common.actions}</span>
            </div>
            {rows.length === 0 && (
              <div className="border-t border-line px-3.5 py-6 text-[11.5px] text-dim">
                {formatTemplate(dict.common.noEntriesYet, { label: dict.common.newEntry })}
              </div>
            )}
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid items-center gap-3.5 border-t border-line px-3.5 py-[11px] transition-colors duration-150 hover:bg-acsoft"
                style={{ gridTemplateColumns: config.colTemplate }}
              >
                {config.cells(row).map((cell, i) => (
                  <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: cell order is stable within a row
                    key={`${row.id}-${i}`}
                    className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] leading-[1.45]"
                  >
                    {cell}
                  </span>
                ))}
                <span className="flex justify-end gap-1.5">
                  {config.hasCvToggle && (
                    <Button
                      variant="icon-accent"
                      title={dict.common.includeInCv}
                      onClick={() => toggleCv(row.id)}
                      className="grid size-6 place-items-center text-[10px]"
                    >
                      {row.includeInCv === false ? "○" : "●"}
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    title={dict.common.moveUp}
                    onClick={() => move(row.id, -1)}
                    className="size-6 text-[10px]"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="secondary"
                    title={dict.common.moveDown}
                    onClick={() => move(row.id, 1)}
                    className="size-6 text-[10px]"
                  >
                    ↓
                  </Button>
                  <Button
                    variant="outline-accent"
                    onClick={() => openEditor(row.id)}
                    className="h-6 px-2 text-[10px] font-medium tracking-[.08em]"
                  >
                    {dict.common.edit}
                  </Button>
                  <Button
                    variant="danger-ghost"
                    title={dict.common.delete}
                    onClick={() => setConfirm({ id: row.id, label: config.labelOf(row) })}
                    className="size-6 text-[11px]"
                  >
                    ×
                  </Button>
                </span>
              </div>
            ))}
          </div>
        </div>

        {split && editorOpen && (
          <div className="sticky top-[71px] max-h-[calc(100vh-96px)] overflow-auto border border-ac bg-panel">
            {editor}
          </div>
        )}
      </div>

      {!split && (
        <Dialog.Root open={editorOpen} onOpenChange={(open) => !open && setEditing(null)}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]" />
            <Dialog.Popup className="fixed inset-0 z-50 grid place-items-center p-6">
              <div className="max-h-[calc(100vh-96px)] w-full max-w-xl overflow-auto border border-ac bg-panel">
                {editor}
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      <AlertDialog.Root open={Boolean(confirm)} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-[2px]" />
          <AlertDialog.Popup className="fixed inset-0 z-[110] grid place-items-center p-6">
            <div className="w-[min(430px,100%)] border border-line bg-panel p-6">
              <p className="text-[10.5px] font-semibold tracking-[.14em] text-[oklch(.58_.17_25)]">
                {dict.common.destructiveDelete}
              </p>
              <h3 className="mt-3.5 text-[17px] font-semibold leading-[1.3] tracking-[-.02em]">
                {formatTemplate(dict.common.deleteEntryTitle, { label: confirm?.label ?? "" })}
              </h3>
              <p className="mt-2.5 font-sans text-[13px] leading-[1.6] text-dim">
                {dict.common.deleteEntryBody}
              </p>
              <div className="mt-5 flex gap-2">
                <Button
                  variant="danger"
                  onClick={remove}
                  disabled={busy}
                  className="flex-1 px-3 py-3 text-[10.5px] font-semibold tracking-[.1em]"
                >
                  {dict.common.yesDelete}
                </Button>
                <AlertDialog.Close className="border border-line bg-transparent px-4 py-3 text-[10.5px] font-medium tracking-[.1em] text-fg outline-none hover:border-fg">
                  {dict.common.cancel}
                </AlertDialog.Close>
              </div>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
