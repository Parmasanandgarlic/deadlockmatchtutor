import { useEffect } from 'react';

const DEFAULT_TITLE = 'Deadlock AfterMatch';

/**
 * Keep the document title in sync with the current page.
 * Pass a string like `Dashboard — Vindicta` to append the suffix automatically.
 * Pass null/undefined to reset to the default title.
 */
export default function usePageTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${DEFAULT_TITLE}` : DEFAULT_TITLE;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
