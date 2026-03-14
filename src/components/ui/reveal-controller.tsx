"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function RevealController() {
  const pathname = usePathname();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    const observed = new WeakSet<HTMLElement>();

    const observeElement = (element: HTMLElement) => {
      if (observed.has(element)) {
        return;
      }
      observed.add(element);
      element.classList.remove("is-visible");
      observer.observe(element);
    };

    const scanNode = (node: ParentNode) => {
      if (node instanceof HTMLElement && node.matches("[data-reveal]")) {
        observeElement(node);
      }
      node.querySelectorAll?.("[data-reveal]").forEach((element) => observeElement(element as HTMLElement));
    };

    scanNode(document);

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            scanNode(node);
          }
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
