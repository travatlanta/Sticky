import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

export function ScrollRestoration() {
  const [location] = useLocation();
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const isPopState = useRef(false);

  useEffect(() => {
    const handlePopState = () => {
      isPopState.current = true;
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const saveScrollPosition = () => {
      scrollPositions.current.set(location, window.scrollY);
    };

    window.addEventListener("beforeunload", saveScrollPosition);
    
    return () => {
      saveScrollPosition();
      window.removeEventListener("beforeunload", saveScrollPosition);
    };
  }, [location]);

  useEffect(() => {
    if (isPopState.current) {
      const savedPosition = scrollPositions.current.get(location);
      if (savedPosition !== undefined) {
        setTimeout(() => {
          window.scrollTo(0, savedPosition);
        }, 0);
      }
      isPopState.current = false;
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return null;
}
