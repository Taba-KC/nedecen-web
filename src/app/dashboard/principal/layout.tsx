/**
 * Pass child routes through without adding another principal shell. BookWorkspace already
 * draws the bookshelf, so placing one here would duplicate the interface.
 */
export default function PrincipalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
