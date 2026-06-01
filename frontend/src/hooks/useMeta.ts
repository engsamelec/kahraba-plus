import { useEffect } from "react";

function setTag(selector: string, attr: string, key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

interface Meta {
  description?: string | null;
  image?: string | null;
  title?: string | null;
}

/**
 * Updates the page meta description and Open Graph / Twitter tags for richer
 * search snippets and social-share previews (e.g. a product page). Best-effort
 * client-side; restores nothing (the next page overwrites, and the static
 * index.html defaults cover first paint).
 */
export function useMeta({ description, image, title }: Meta) {
  useEffect(() => {
    if (description) {
      setTag('meta[name="description"]', "name", "description", description);
      setTag('meta[property="og:description"]', "property", "og:description", description);
      setTag('meta[name="twitter:description"]', "name", "twitter:description", description);
    }
    if (title) {
      setTag('meta[property="og:title"]', "property", "og:title", title);
      setTag('meta[name="twitter:title"]', "name", "twitter:title", title);
    }
    if (image) {
      setTag('meta[property="og:image"]', "property", "og:image", image);
      setTag('meta[name="twitter:image"]', "name", "twitter:image", image);
    }
  }, [description, image, title]);
}
