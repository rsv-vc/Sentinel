"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      onClick={toggle}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      className={`flex items-center gap-2 rounded-lg transition-colors hover:bg-[#2e2c2a] ${
        collapsed ? "justify-center p-1.5 w-full" : "px-2.5 py-2 w-full"
      }`}
    >
      {/* Track */}
      <div
        className={`relative flex-shrink-0 w-8 h-[18px] rounded-full transition-colors duration-200 ${
          isLight ? "bg-[#8A9C8B]" : "bg-[#2a2825]"
        }`}
      >
        {/* Thumb */}
        <span
          className={`absolute top-[3px] w-3 h-3 rounded-full shadow-sm transition-all duration-200 ${
            isLight ? "left-[17px] bg-white" : "left-[3px] bg-[#5c5248]"
          }`}
        />
      </div>
      {!collapsed && (
        <span className="text-[12px] font-medium text-[#5c5248] leading-none whitespace-nowrap">
          {isLight ? "Light mode" : "Dark mode"}
        </span>
      )}
    </button>
  );
}
