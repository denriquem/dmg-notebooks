import { Center, Spinner } from "@chakra-ui/react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";

const RequireAuth = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const status = useAuthStore((s) => s.status);
  if (status === "loading") {
    return (
      <Center h="100vh">
        <Spinner />
      </Center>
    );
  }
  if (status === "guest") return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default RequireAuth;
