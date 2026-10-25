/**
 * Compatibility layout for older grade URLs. It passes children through; the current
 * grade/class bookshelf is rendered by the principal workspace.
 */
export default function GradesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
