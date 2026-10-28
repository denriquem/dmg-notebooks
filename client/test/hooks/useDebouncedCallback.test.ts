import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedCallback } from "../../src/hooks/useDebouncedCallback";

type Debounced = (value: string) => void;
type Props = { fn: Debounced };

describe("useDebouncedCallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not call through until the delay has elapsed", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 500));

    act(() => result.current("a"));
    expect(fn).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(499));
    expect(fn).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(1));
    expect(fn).toHaveBeenCalledExactlyOnceWith("a");
  });

  it("collapses a burst of calls into a single trailing call", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 500));

    act(() => {
      result.current("a");
      vi.advanceTimersByTime(100);
      result.current("ab");
      vi.advanceTimersByTime(100);
      result.current("abc");
      vi.advanceTimersByTime(500);
    });

    expect(fn).toHaveBeenCalledExactlyOnceWith("abc");
  });

  it("keeps a stable identity across re-renders so effects don't re-fire", () => {
    const { result, rerender } = renderHook<Debounced, Props>(
      ({ fn }) => useDebouncedCallback(fn, 500),
      { initialProps: { fn: vi.fn() } },
    );
    const first = result.current;

    rerender({ fn: vi.fn() });

    expect(result.current).toBe(first);
  });

  it("invokes the latest callback, not the one captured at first render", () => {
    const stale = vi.fn();
    const fresh = vi.fn();
    const { result, rerender } = renderHook<Debounced, Props>(
      ({ fn }) => useDebouncedCallback(fn, 500),
      { initialProps: { fn: stale } },
    );

    act(() => result.current("value"));
    rerender({ fn: fresh });
    act(() => void vi.advanceTimersByTime(500));

    expect(stale).not.toHaveBeenCalled();
    expect(fresh).toHaveBeenCalledExactlyOnceWith("value");
  });

  it("fires again after the timer has already flushed", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 200));

    act(() => {
      result.current("first");
      vi.advanceTimersByTime(200);
      result.current("second");
      vi.advanceTimersByTime(200);
    });

    expect(fn.mock.calls).toEqual([["first"], ["second"]]);
  });
});
