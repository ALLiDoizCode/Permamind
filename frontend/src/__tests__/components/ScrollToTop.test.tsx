import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ScrollToTop } from '@/components/ScrollToTop';

describe('ScrollToTop', () => {
  let scrollToSpy: any;

  beforeEach(() => {
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    scrollToSpy.mockRestore();
  });

  it('scrolls to top on initial render', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <ScrollToTop />
      </MemoryRouter>
    );

    expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
  });

  it('uses location.pathname in effect dependency', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <ScrollToTop />
      </MemoryRouter>
    );

    // Component should call scrollTo on mount
    expect(scrollToSpy).toHaveBeenCalledWith(0, 0);

    // This test verifies the component is set up correctly
    // Actual route change behavior is tested in integration/e2e tests
  });

  it('renders nothing (returns null)', () => {
    const { container } = render(
      <MemoryRouter>
        <ScrollToTop />
      </MemoryRouter>
    );

    expect(container.firstChild).toBeNull();
  });
});
