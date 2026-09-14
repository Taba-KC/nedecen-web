"use client";

import { useEffect, useState } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect breakpoint (lg = 1024px)
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const header = (
    <div
      className="flex items-center justify-between px-6 py-4 flex-shrink-0"
      style={{ borderBottom: "1px solid var(--color-border)" }}
    >
      <h2 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
        {title}
      </h2>
      <button
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors hover:bg-[var(--color-surface)]"
        style={{ color: "var(--color-text-muted)" }}
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );

  // ── Desktop: centered modal ─────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <div
        className="fixed inset-0 z-40 flex items-center justify-center p-6"
        style={{
          backgroundColor: "rgba(0,0,0,0.45)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.2s ease",
        }}
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
          style={{
            backgroundColor: "var(--color-card)",
            maxHeight: "85vh",
            boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
            transform: isOpen ? "scale(1) translateY(0)" : "scale(0.96) translateY(8px)",
            transition: "transform 0.2s ease",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {header}
          <div className="overflow-y-auto flex-1 px-6 py-5">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // ── Mobile / tablet: bottom sheet ──────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: "rgba(0,0,0,0.45)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl"
        style={{
          backgroundColor: "var(--color-card)",
          transform: isOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s ease",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: "var(--color-border)" }}
          />
        </div>

        {header}

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </>
  );
}
