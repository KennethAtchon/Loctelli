"use client";

import { useDarkMode } from "@/contexts/dark-mode-context";
import { cn } from "@/lib/utils";

interface DarkModeToggleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function DarkModeToggle({
  className,
  size = "md",
}: DarkModeToggleProps) {
  const { isDark, toggleDarkMode } = useDarkMode();

  const sizeClasses = {
    sm: {
      container: "w-12 h-6",
      thumb: "w-5 h-5",
      icon: "w-3 h-3",
    },
    md: {
      container: "w-14 h-7",
      thumb: "w-6 h-6",
      icon: "w-3.5 h-3.5",
    },
    lg: {
      container: "w-16 h-8",
      thumb: "w-7 h-7",
      icon: "w-4 h-4",
    },
  };

  const { container, thumb, icon } = sizeClasses[size];

  return (
    <button
      onClick={toggleDarkMode}
      className={cn(
        "relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg",
        container,
        isDark
          ? "bg-gradient-to-r from-slate-700 to-slate-800 shadow-slate-900/30"
          : "bg-gradient-to-r from-blue-400 to-blue-600 shadow-blue-500/30",
        className
      )}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
    >
      {/* Background glow effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-300",
          isDark
            ? "bg-gradient-to-r from-slate-600/50 to-slate-700/50"
            : "bg-gradient-to-r from-blue-300/50 to-blue-500/50"
        )}
      />

      {/* Slider thumb */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full bg-white shadow-lg transform transition-all duration-300 ease-in-out",
          thumb,
          size === "sm" && (isDark ? "translate-x-6" : "translate-x-0.5"),
          size === "md" && (isDark ? "translate-x-7" : "translate-x-0.5"),
          size === "lg" && (isDark ? "translate-x-8" : "translate-x-0.5"),
          isDark ? "shadow-slate-900/20" : "shadow-blue-900/20"
        )}
      >
        {/* Simple indicator dot */}
        <div
          className={cn(
            "rounded-full transition-all duration-300",
            "w-2 h-2",
            isDark ? "bg-slate-600" : "bg-blue-500"
          )}
        />
      </div>
    </button>
  );
}

// Compact version for use in headers/toolbars
export function DarkModeToggleCompact({ className }: { className?: string }) {
  return <DarkModeToggle size="sm" className={className} />;
}

// Large version for settings pages
export function DarkModeToggleLarge({ className }: { className?: string }) {
  return <DarkModeToggle size="lg" className={className} />;
}
