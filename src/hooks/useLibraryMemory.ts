"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { rememberLibraryLocation } from "@/lib/libraryMemory";

/** Save completed URL changes, including filters; closing a tab also captures its latest URL. */
export function useLibraryMemory() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => {
    rememberLibraryLocation(`${pathname}${search ? `?${search}` : ""}`);
    const save = () => rememberLibraryLocation(`${window.location.pathname}${window.location.search}`);
    window.addEventListener("pagehide", save);
    return () => window.removeEventListener("pagehide", save);
  }, [pathname, search]);
}
