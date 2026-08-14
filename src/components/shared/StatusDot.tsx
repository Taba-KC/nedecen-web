interface StatusDotProps {
  status: "active" | "pending";
}

export function StatusDot({ status }: StatusDotProps) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: status === "active" ? "#22c55e" : "#f59e0b" }}
      title={status === "active" ? "Account set up" : "Pending onboarding"}
    />
  );
}