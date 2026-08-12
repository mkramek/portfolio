"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({ locale, label }: { locale: string; label: string }) {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await authClient.signOut();
        router.push(`/${locale}/admin/login`);
        router.refresh();
      }}
      className="w-full px-2.5 py-2 text-[10.5px] font-medium tracking-[.08em]"
    >
      {label}
    </Button>
  );
}
