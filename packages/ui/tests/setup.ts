import '@testing-library/jest-dom/vitest';

// Mock window.matchMedia for components using responsive hooks.
// Default simulates a 1280px desktop viewport.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => {
    const match = query.match(/\(min-width:\s*(\d+)px\)/);
    const breakpoint = match ? parseInt(match[1], 10) : 0;
    const matches = 1280 >= breakpoint;

    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => true,
    } as unknown as MediaQueryList;
  },
});
