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