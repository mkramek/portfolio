import { Suspense } from "react";
import { getAdminDictionary } from "@/lib/i18n/dictionaries";
import LoginForm from "./login-form";

export const metadata = { title: "Sign in — CV admin" };

export default async function LoginPage() {
  const dict = await getAdminDictionary();
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6 font-mono text-fg">
      <Suspense fallback={null}>
        <LoginForm dict={dict.login} />
      </Suspense>
    </main>
  );
}
