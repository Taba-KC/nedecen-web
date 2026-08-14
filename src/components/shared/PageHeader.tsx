"use client";

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function PageHeader({ title, onBack, rightAction }: PageHeaderProps) {
  return (
    <div
      className="flex items-center justify-between py-4"
      style={{
        paddingLeft: "var(--page-px)",
        paddingRight: "var(--page-px)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-full text-base"
            style={{ color: "var(--color-text-muted)", backgroundColor: "var(--color-surface)" }}
            aria-label="Go back"
          >
            ←
          </button>
        )}
        <h1 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
          {title}
        </h1>
      </div>

      {rightAction && <div>{rightAction}</div>}
    </div>
  );
}