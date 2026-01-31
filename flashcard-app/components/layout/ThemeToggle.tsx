"use client";

import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2">
      🌙
      <Switch
        checked={theme === "dark"}
        onCheckedChange={() =>
          setTheme(theme === "dark" ? "light" : "dark")
        }
      />
    </div>
  );
}
