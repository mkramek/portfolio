"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import type { AdminDictionary } from "@/lib/i18n/dictionaries/en/admin";
import { formatTemplate } from "@/lib/i18n/format";
import { useLocale } from "@/lib/i18n/use-locale";

export default function PasskeySection({ dict }: { dict: AdminDictionary["passkey"] }) {
  const router = useRouter();
  const locale = useLocale();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function registerPasskey() {
    setBusy(true);
    setMessage(null);
    const { data, error } = await authClient.passkey.addPasskey({ name: "This device" });
    setBusy(false);
    if (error) {
      setMessage(error.message ?? dict.failed);
      return;
    }
    setMessage(
      data
        ? formatTemplate(dict.registered, { name: data.name ?? "This device" })
        : dict.registeredFallback,
    );
  }

  async function signOut() {
    setBusy(true);
    await authClient.signOut();
    setBusy(false);
    router.push(`/${locale}/admin/login`);
    router.refresh();
  }

  return (
    <div className="mt-6 w-full max-w-2xl space-y-4">
      <section className="border border-line bg-panel p-6">
        <h2 className="font-sans text-lg font-semibold tracking-tight">{dict.title}</h2>
        <p className="mt-1 text-sm text-dim">{dict.blurb}</p>
        <Button onClick={registerPasskey} disabled={busy} className="mt-4 px-3 py-2 text-sm">
          {dict.register}
        </Button>
        {message && <p className="mt-3 text-xs text-dim">{message}</p>}
      </section>

      <Button variant="form" onClick={signOut} disabled={busy} className="w-full px-3 py-2 text-sm">
        {dict.signOut}
      </Button>
    </div>
  );
}
