import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as authApi from "../../src/api/auth";
import { useAuthStore } from "../../src/store/auth";
import { renderWithProviders } from "../utils";
import AuthPage from "../../src/pages/AuthPage";

vi.mock("../../src/api/auth");

const USER = { id: "user_1", email: "ada@example.com", name: "Ada" };

/** Mimics the shape axios gives a rejected request. */
const axiosError = (status: number) =>
  Object.assign(new Error("Request failed"), {
    response: { status, data: { error: "nope" } },
  });

// "Log in" labels both the mode tab and the submit button, so queries have to
// say which one they mean.
const submitButton = (name: string) =>
  screen.getAllByRole("button", { name }).find((b) => b.getAttribute("type") === "submit")!;
const modeTab = (name: string) =>
  screen.getAllByRole("button", { name }).find((b) => b.getAttribute("type") !== "submit")!;

const fill = async (fields: Record<string, string>) => {
  for (const [label, value] of Object.entries(fields)) {
    await userEvent.type(screen.getByLabelText(label), value);
  }
};

beforeEach(() => {
  useAuthStore.setState({ user: null, status: "guest" });
});

describe("AuthPage — log in", () => {
  it("opens on the log in tab", () => {
    renderWithProviders(<AuthPage />);

    expect(submitButton("Log in")).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });

  it("submits the entered credentials", async () => {
    vi.mocked(authApi.login).mockResolvedValue(USER);
    renderWithProviders(<AuthPage />);

    await fill({ Email: "ada@example.com", Password: "correcthorse" });
    await userEvent.click(submitButton("Log in"));

    expect(authApi.login).toHaveBeenCalledExactlyOnceWith("ada@example.com", "correcthorse");
  });

  it("marks the user as signed in on success", async () => {
    vi.mocked(authApi.login).mockResolvedValue(USER);
    renderWithProviders(<AuthPage />);

    await fill({ Email: "ada@example.com", Password: "correcthorse" });
    await userEvent.click(submitButton("Log in"));

    expect(useAuthStore.getState()).toMatchObject({ user: USER, status: "authed" });
  });

  it("explains a rejected login and stays signed out", async () => {
    vi.mocked(authApi.login).mockRejectedValue(axiosError(401));
    renderWithProviders(<AuthPage />);

    await fill({ Email: "ada@example.com", Password: "wrong-password" });
    await userEvent.click(submitButton("Log in"));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    expect(useAuthStore.getState().status).toBe("guest");
  });

  it("points at the backend when the request never reached it", async () => {
    vi.mocked(authApi.login).mockRejectedValue(
      Object.assign(new Error("Network Error"), { response: undefined }),
    );
    renderWithProviders(<AuthPage />);

    await fill({ Email: "ada@example.com", Password: "correcthorse" });
    await userEvent.click(submitButton("Log in"));

    expect(await screen.findByText(/Can't reach the server/)).toBeInTheDocument();
  });
});

describe("AuthPage — sign up", () => {
  const switchToSignUp = async () => {
    renderWithProviders(<AuthPage />);
    await userEvent.click(modeTab("Sign up"));
  };

  it("swaps in the sign up form, including the name field", async () => {
    await switchToSignUp();

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(submitButton("Create account")).toBeInTheDocument();
  });

  it("submits name, email and password", async () => {
    vi.mocked(authApi.register).mockResolvedValue(USER);
    await switchToSignUp();

    await fill({ Name: "Ada", Email: "ada@example.com", Password: "correcthorse" });
    await userEvent.click(submitButton("Create account"));

    expect(authApi.register).toHaveBeenCalledExactlyOnceWith(
      "ada@example.com",
      "correcthorse",
      "Ada",
    );
  });

  it("explains a duplicate email", async () => {
    vi.mocked(authApi.register).mockRejectedValue(axiosError(409));
    await switchToSignUp();

    await fill({ Name: "Ada", Email: "ada@example.com", Password: "correcthorse" });
    await userEvent.click(submitButton("Create account"));

    expect(await screen.findByText("That email is already registered.")).toBeInTheDocument();
  });

  it("explains a password the server rejected as too short", async () => {
    vi.mocked(authApi.register).mockRejectedValue(axiosError(400));
    await switchToSignUp();

    await fill({ Name: "Ada", Email: "ada@example.com", Password: "short" });
    await userEvent.click(submitButton("Create account"));

    expect(
      await screen.findByText("Check your details: password must be at least 8 characters."),
    ).toBeInTheDocument();
  });

  it("can switch back to log in", async () => {
    await switchToSignUp();

    await userEvent.click(modeTab("Log in"));

    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    expect(submitButton("Log in")).toBeInTheDocument();
  });
});
