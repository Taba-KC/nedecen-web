// ── Icons ─────────────────────────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function InfoIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="3" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ClassItem {
  id: number;
  name: string;
  gradeId: number;
  streamId: number | null;
  learnerCount: number;
}

export interface StreamItem {
  id: number;
  name: string;
}

interface ClassRowProps {
  cls: ClassItem;
  stream?: StreamItem;
  isLast: boolean;
  onAssignStream: (cls: ClassItem) => void;
  onInfo: (cls: ClassItem) => void;
  onUpload: (cls: ClassItem) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ClassRow({ cls, stream, isLast, onAssignStream, onInfo, onUpload }: ClassRowProps) {
  return (
    <div
      className="flex items-center gap-3 px-6 py-3.5"
      style={{ borderBottom: isLast ? "none" : "1px solid var(--color-border)" }}
    >
      {/* Class name */}
      <span
        className="text-sm font-semibold w-12 flex-shrink-0"
        style={{ color: "var(--color-text)" }}
      >
        {cls.name}
      </span>

      {/* Action icons */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onAssignStream(cls)}
          title="Assign stream"
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
          style={{ color: "var(--color-text-muted)" }}
        >
          <PencilIcon />
        </button>
        <button
          onClick={() => onInfo(cls)}
          title="Stream & subjects"
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
          style={{ color: "var(--color-text-muted)" }}
        >
          <InfoIcon />
        </button>
        <button
          onClick={() => onUpload(cls)}
          title="Add learners"
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
          style={{ color: "var(--color-text-muted)" }}
        >
          <DocumentIcon />
        </button>
      </div>

      {/* Push stream chip and count to the right */}
      <div className="flex-1" />

      {/* Stream chip */}
      {stream ? (
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0"
          style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#15803d" }}
        >
          {/* Green status dot */}
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: "#22c55e" }}
          />
          <span>{stream.name}</span>
        </div>
      ) : (
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0"
          style={{ border: "1.5px solid var(--color-border)", color: "var(--color-text-muted)" }}
        >
          <span>No stream</span>
        </div>
      )}

      {/* Learner count */}
      <span
        className="text-xs font-medium flex-shrink-0 text-right"
        style={{ color: "var(--color-text-muted)", minWidth: "5.5rem" }}
      >
        {cls.learnerCount} {cls.learnerCount === 1 ? "Learner" : "Learners"}
      </span>
    </div>
  );
}
