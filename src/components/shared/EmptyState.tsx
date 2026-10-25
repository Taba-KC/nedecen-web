/**
 * Consistent message for a list or screen with nothing to display. Optional content/actions
 * come from the caller so the message can explain the appropriate next step.
 */
interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-16 px-6 text-center">
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        {message}
      </p>
    </div>
  );
}