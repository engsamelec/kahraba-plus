import { useEffect } from "react";

const BASE_TITLE = "كهربا بلس | Kahraba Plus";

/**
 * Sets the document title for the current page and restores the base title on
 * unmount. Pass a falsy value to keep just the base title.
 */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [title]);
}
