// ── Icons ─────────────────────────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 15H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
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
  onDelete: (cls: ClassItem) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ClassRow({ cls, stream, isLast, onAssignStream, onInfo, onUpload, onDelete }: ClassRowProps) {
  const classLabel = cls.name.toLowerCase().startsWith("grade ") ? cls.name : `Grade ${cls.name}`;

  return (
    <div
      className="flex items-center gap-3 px-6 py-3.5"
      style={{ borderBottom: isLast ? "none" : "1px solid var(--color-border)" }}
    >
      {/* Class name */}
      <span
        className="text-sm font-semibold w-20 flex-shrink-0"
        style={{ color: "var(--color-text)" }}
      >
        {classLabel}
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
          onClick={() => onUpload(cls)}
          title="Add learners"
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
          style={{ color: "var(--color-text-muted)" }}
        >
          <PlusIcon />
        </button>
        <button
          onClick={() => onDelete(cls)}
          title="Delete class"
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
          style={{ color: "var(--color-text-muted)" }}
        >
          <TrashIcon />
        </button>
      </div>

      {/* Push stream chip and count to the right */}
      <div className="flex-1" />

      {/* Stream chip */}
      {stream ? (
        <button
          type="button"
          onClick={() => onInfo(cls)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0"
          style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#15803d" }}
          title="View stream subjects"
        >
          {/* Green status dot */}
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: "#22c55e" }}
          />
          <span>{stream.name}</span>
        </button>
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
