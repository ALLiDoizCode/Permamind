import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 *
 * Automatically scrolls to top of page when route changes.
 * Must be placed inside BrowserRouter.
 *
 * @example
 * <BrowserRouter>
 *   <ScrollToTop />
 *   <Routes>...</Routes>
 * </BrowserRouter>
 */
export function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}
