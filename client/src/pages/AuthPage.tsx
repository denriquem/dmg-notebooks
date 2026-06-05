import { useState } from "react";
import { Box, Flex, Input, Text, useToast } from "@chakra-ui/react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { useLogin, useRegister } from "../hooks/useAuth";
import Glyph from "../components/dmg/Glyph";

type Mode = "login" | "signup";

const errMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === "object" && "response" in err) {
    const res = (err as { response?: { status?: number; data?: { error?: unknown } } }).response;
    if (!res) return "Can't reach the server — is the backend running on :3001?";
    if (res.status === 409) return "That email is already registered.";
    if (res.status === 400) return "Check your details: password must be at least 8 characters.";
  }
  return fallback;
};

const Field = ({
  label, type, value, onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}): JSX.Element => (
  <Box>
    <Text
      as="label"
      display="block"
      mb="6px"
      fontFamily="'Space Mono', monospace"
      fontWeight={700}
      fontSize="10px"
      letterSpacing="0.14em"
      textTransform="uppercase"
      color="color-mix(in oklab, var(--bone) 70%, transparent)"
    >
      {label}
    </Text>
    <Input
      type={type}
      value={value}
      required
      onChange={(e) => onChange(e.target.value)}
      variant="unstyled"
      fontFamily="'Space Grotesk', sans-serif"
      fontWeight={500}
      fontSize="16px"
      color="var(--bone)"
      bg="color-mix(in oklab, var(--bone) 8%, transparent)"
      border="2px solid color-mix(in oklab, var(--bone) 32%, transparent)"
      px="12px"
      py="10px"
      _focus={{ borderColor: "var(--horizon)" }}
    />
  </Box>
);

const AuthPage = (): JSX.Element => {
  const status = useAuthStore((s) => s.status);
  const navigate = useNavigate();
  const toast = useToast();
  const loginM = useLogin();
  const registerM = useRegister();

  const [mode, setMode] = useState<Mode>("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ email: "", password: "", name: "" });

  if (status === "authed") return <Navigate to="/" replace />;

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginM.mutateAsync(loginForm);
      navigate("/");
    } catch (err: unknown) {
      toast({ status: "error", title: errMessage(err, "Invalid credentials") });
    }
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerM.mutateAsync(signupForm);
      navigate("/");
    } catch (err: unknown) {
      toast({ status: "error", title: errMessage(err, "Sign up failed") });
    }
  };

  const submitting = loginM.isPending || registerM.isPending;

  return (
    <Box minH="100vh" position="relative" display="flex" alignItems="center" justifyContent="center" px="24px" fontFamily="'Space Grotesk', sans-serif">
      <div className="dmg-wall-grid" />
      <Box position="relative" zIndex={1} width="100%" maxW="420px">
        <Flex align="center" gap="14px" mb="22px" justify="center">
          <Glyph kind="sphere" size={40} color="terracotta" />
          <Text fontFamily="'Syne', sans-serif" fontWeight={800} fontSize="30px" letterSpacing="-0.03em" color="var(--ink)">
            DMGNotebooks
          </Text>
        </Flex>

        <Box bg="var(--ink)" border="3px solid var(--ink)" boxShadow="12px 12px 0 var(--terracotta)" p="28px">
          <Flex mb="22px" border="2px solid color-mix(in oklab, var(--bone) 32%, transparent)">
            {(["login", "signup"] as Mode[]).map((m) => (
              <Box
                key={m}
                as="button"
                flex="1"
                py="11px"
                cursor="pointer"
                fontFamily="'Syne', sans-serif"
                fontWeight={800}
                fontSize="13px"
                textTransform="uppercase"
                letterSpacing="0.02em"
                transition="all .12s"
                bg={mode === m ? "var(--ochre)" : "transparent"}
                color={mode === m ? "var(--ink)" : "var(--bone)"}
                onClick={() => setMode(m)}
              >
                {m === "login" ? "Log in" : "Sign up"}
              </Box>
            ))}
          </Flex>

          {mode === "login" ? (
            <form onSubmit={onLogin}>
              <Flex direction="column" gap="16px">
                <Field label="Email" type="email" value={loginForm.email} onChange={(v) => setLoginForm({ ...loginForm, email: v })} />
                <Field label="Password" type="password" value={loginForm.password} onChange={(v) => setLoginForm({ ...loginForm, password: v })} />
                <Box
                  as="button"
                  type="submit"
                  mt="4px"
                  py="13px"
                  cursor="pointer"
                  fontFamily="'Syne', sans-serif"
                  fontWeight={800}
                  fontSize="13px"
                  textTransform="uppercase"
                  letterSpacing="0.02em"
                  bg="var(--ochre)"
                  color="var(--ink)"
                  border="2.5px solid var(--bone)"
                  boxShadow="3px 3px 0 var(--bone)"
                  transition="all .12s"
                  opacity={submitting ? 0.6 : 1}
                  _hover={{ boxShadow: "5px 5px 0 var(--bone)", transform: "translate(-1px,-1px)" }}
                >
                  {submitting ? "…" : "Log in"}
                </Box>
              </Flex>
            </form>
          ) : (
            <form onSubmit={onSignup}>
              <Flex direction="column" gap="16px">
                <Field label="Name" value={signupForm.name} onChange={(v) => setSignupForm({ ...signupForm, name: v })} />
                <Field label="Email" type="email" value={signupForm.email} onChange={(v) => setSignupForm({ ...signupForm, email: v })} />
                <Field label="Password" type="password" value={signupForm.password} onChange={(v) => setSignupForm({ ...signupForm, password: v })} />
                <Box
                  as="button"
                  type="submit"
                  mt="4px"
                  py="13px"
                  cursor="pointer"
                  fontFamily="'Syne', sans-serif"
                  fontWeight={800}
                  fontSize="13px"
                  textTransform="uppercase"
                  letterSpacing="0.02em"
                  bg="var(--ochre)"
                  color="var(--ink)"
                  border="2.5px solid var(--bone)"
                  boxShadow="3px 3px 0 var(--bone)"
                  transition="all .12s"
                  opacity={submitting ? 0.6 : 1}
                  _hover={{ boxShadow: "5px 5px 0 var(--bone)", transform: "translate(-1px,-1px)" }}
                >
                  {submitting ? "…" : "Create account"}
                </Box>
              </Flex>
            </form>
          )}
        </Box>

        <Text
          mt="18px"
          textAlign="center"
          fontFamily="'Space Mono', monospace"
          fontWeight={400}
          fontSize="10px"
          letterSpacing="0.1em"
          textTransform="uppercase"
          color="color-mix(in oklab, var(--ink) 50%, transparent)"
        >
          Personal planning, the simple way
        </Text>
      </Box>
    </Box>
  );
};

export default AuthPage;
