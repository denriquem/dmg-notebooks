import { Navigate, Route, Routes } from "react-router-dom";
import { useHydrateAuth } from "./hooks/useAuth";
import RequireAuth from "./components/RequireAuth";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import PageEditor from "./pages/PageEditor";

const App = (): JSX.Element => {
  useHydrateAuth();
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/pages/:id"
        element={
          <RequireAuth>
            <PageEditor />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
