import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "../../src/store/auth";

const reset = () => useAuthStore.setState({ user: null, status: "loading" });

describe("useAuthStore", () => {
  beforeEach(reset);

  it("starts in the loading state so guards don't redirect before hydration", () => {
    expect(useAuthStore.getState()).toMatchObject({ user: null, status: "loading" });
  });

  it("moves to authed when a user is set", () => {
    useAuthStore.getState().setUser({ id: "user_1", email: "ada@example.com", name: "Ada" });

    const { user, status } = useAuthStore.getState();
    expect(status).toBe("authed");
    expect(user?.name).toBe("Ada");
  });

  it("moves to guest when the user is cleared", () => {
    useAuthStore.getState().setUser({ id: "user_1", email: "ada@example.com", name: "Ada" });
    useAuthStore.getState().setUser(null);

    expect(useAuthStore.getState()).toMatchObject({ user: null, status: "guest" });
  });

  it("notifies subscribers on change", () => {
    const seen: string[] = [];
    const unsubscribe = useAuthStore.subscribe((s) => seen.push(s.status));

    useAuthStore.getState().setUser({ id: "user_1", email: "ada@example.com", name: "Ada" });
    useAuthStore.getState().setUser(null);
    unsubscribe();

    expect(seen).toEqual(["authed", "guest"]);
  });
});
