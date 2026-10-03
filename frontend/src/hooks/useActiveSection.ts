import { useEffect, useState } from "react";

/**
 * Returns the id of the section crossing the middle of the viewport, or null when none is
 * (e.g. while the hero is on screen). Waits for the elements to mount, since pages are lazy-loaded.
 */
export const useActiveSection = (ids: readonly string[], enabled = true): string | null => {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join("|");

  useEffect(() => {
    if (!enabled) {
      setActive(null);
      return;
    }

    let io: IntersectionObserver | undefined;
    let mo: MutationObserver | undefined;
    const visible = new Set<string>();

    const observe = (): boolean => {
      const elements = ids.map((id) => document.getElementById(id));
      if (elements.some((el) => !el)) return false;

      // A thin band just above the middle of the screen: whichever section sits in it is "current"
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) visible.add(entry.target.id);
            else visible.delete(entry.target.id);
          }
          setActive(ids.find((id) => visible.has(id)) ?? null);
        },
        { rootMargin: "-45% 0px -50% 0px" }
      );
      elements.forEach((el) => io!.observe(el!));
      return true;
    };

    if (!observe()) {
      mo = new MutationObserver(() => {
        if (observe()) mo?.disconnect();
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      io?.disconnect();
      mo?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return active;
};
