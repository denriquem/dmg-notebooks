import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Chakra's responsive props and `useToast` both reach for these; jsdom ships
// neither.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

if (!window.scrollTo) {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
}

afterEach(() => {
  cleanup();
});
