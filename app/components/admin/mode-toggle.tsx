"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ModeToggle({ mode }: { mode: "light" | "dark" }) {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await fetch("/api/admin/theme", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: mode === "dark" ? "light" : "dark" }),
        });
        router.refresh();
      }}
      className="px-2.5 py-1.5 text-[10.5px] font-medium tracking-[.08em]"
    >
      {mode === "dark" ? "LIGHT" : "DARK"}
    </Button>
  );
}
