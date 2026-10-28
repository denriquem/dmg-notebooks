import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "../../src/store/auth";
import { renderWithProviders } from "../utils";
import RequireAuth from "../../src/components/RequireAuth";

const Protected = () => <div>Secret dashboard</div>;
const LoginPage = () => <div>Login page</div>;

const renderGuarded = () =>
  renderWithProviders(
    <Routes>
      <Route
        path="/"
        element={
          <RequireAuth>
            <Protected />
          </RequireAuth>
        }
      />
      <Route path="/login" element={<LoginPage />} />
    </Routes>,
    { route: "/" },
  );

describe("RequireAuth", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, status: "loading" });
  });

  it("shows a spinner while auth is still hydrating", () => {
    renderGuarded();

    expect(screen.queryByText("Secret dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });

  it("redirects a guest to /login", () => {
    useAuthStore.setState({ user: null, status: "guest" });

    renderGuarded();

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Secret dashboard")).not.toBeInTheDocument();
  });

  it("renders the protected content for a signed-in user", () => {
    useAuthStore.setState({
      user: { id: "user_1", email: "ada@example.com", name: "Ada" },
      status: "authed",
    });

    renderGuarded();

    expect(screen.getByText("Secret dashboard")).toBeInTheDocument();
  });
});
