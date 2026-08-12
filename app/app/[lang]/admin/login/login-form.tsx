"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import type { AdminDictionary } from "@/lib/i18n/dictionaries/en/admin";
import { useLocale } from "@/lib/i18n/use-locale";

type Step = "email" | "code";

export default function LoginForm({ dict }: { dict: AdminDictionary["login"] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const next = searchParams.get("next") ?? `/${locale}/admin`;
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendMagicLink() {
    setBusy(true);
    setMessage(null);
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: next });
    setBusy(false);
    if (error) {
      setMessage(error.message ?? dict.genericError);
      return;
    }
    setSent(true);
  }

  async function sendCode() {
    setBusy(true);
    setMessage(null);
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    setBusy(false);
    if (error) {
      setMessage(error.message ?? dict.genericError);
      return;
    }
    setStep("code");
  }

  async function verifyCode() {
    setBusy(true);
    setMessage(null);
    const { error } = await authClient.signIn.emailOtp({ email, otp: code });
    setBusy(false);
    if (error) {
      setMessage(error.message ?? dict.invalidCode);
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function passkeySignIn() {
    setBusy(true);
    setMessage(null);
    const { error } = await authClient.signIn.passkey();
    setBusy(false);
    if (error) {
      setMessage(error.message ?? dict.passkeyFailed);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm border border-line bg-panel p-6">
      <p className="text-xs uppercase tracking-widest text-dim">{dict.eyebrow}</p>
      <h1 className="mt-2 font-sans text-2xl font-semibold tracking-tight">{dict.title}</h1>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs text-dim">{dict.email}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={step === "code"}
            placeholder={dict.emailPlaceholder}
            className="mt-1 w-full border border-line bg-panel2 px-3 py-2 text-sm outline-none focus:border-ac"
          />
        </label>

        {step === "email" ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="form"
                onClick={sendMagicLink}
                disabled={busy}
                className="px-3 py-2 text-sm"
              >
                {dict.sendMagicLink}
              </Button>
              <Button
                variant="form"
                onClick={sendCode}
                disabled={busy}
                className="px-3 py-2 text-sm"
              >
                {dict.sendCode}
              </Button>
            </div>
            <Button onClick={passkeySignIn} disabled={busy} className="w-full px-3 py-2 text-sm">
              {dict.signInWithPasskey}
            </Button>
          </>
        ) : (
          <>
            <label className="block">
              <span className="text-xs text-dim">{dict.code}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="mt-1 w-full border border-line bg-panel2 px-3 py-2 font-mono text-sm tracking-widest outline-none focus:border-ac"
              />
            </label>
            <Button onClick={verifyCode} disabled={busy} className="w-full px-3 py-2 text-sm">
              {dict.signIn}
            </Button>
            <Button
              variant="form"
              onClick={() => setStep("email")}
              className="w-full px-3 py-2 text-sm"
            >
              {dict.back}
            </Button>
          </>
        )}

        {sent && <p className="text-xs text-dim">{dict.magicLinkSent}</p>}
        {message && <p className="text-xs text-dim">{message}</p>}
      </div>
    </div>
  );
}
