import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, getTheme } from "@/lib/theme";

export default function ThemeToggle({ floating = false }) {
  const [theme, setTheme] = useState(getTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const next = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      className="km-pill"
      onClick={() => setTheme(next)}
      title={`Switch to ${next} mode`}
      aria-label={`Switch to ${next} mode`}
      style={{
        cursor: "pointer",
        padding: "0 12px",
        ...(floating ? { position: "fixed", right: 14, bottom: 14, zIndex: 60 } : {}),
      }}
    >
      {theme === "light"
        ? <Moon style={{ width: 16, height: 16, strokeWidth: 1.6 }} />
        : <Sun style={{ width: 16, height: 16, strokeWidth: 1.6 }} />}
    </button>
  );
}
