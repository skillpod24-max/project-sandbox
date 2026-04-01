import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Marketplace landing page preserves scroll on back-navigation
const PRESERVE_SCROLL_ROUTES = ["/"];

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (PRESERVE_SCROLL_ROUTES.includes(pathname) && prevPath.current !== pathname) {
      // Don't scroll to top for marketplace landing (user might be returning)
    } else {
      window.scrollTo(0, 0);
    }
    prevPath.current = pathname;
  }, [pathname]);

  return null;
};

export default ScrollToTop;
