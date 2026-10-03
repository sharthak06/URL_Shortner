import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/api/auth.api";
import { Button } from "@/components/ui/button";
import {
  AuthActions,
  AuthField,
  AuthFooter,
  AuthHeader,
  AuthMessage,
  AuthModeTabs,
  AuthShell,
  AuthSubmitButton,
  EmailBadge,
  authLinkClass,
  authSecondaryButtonClass,
  authSwapVariants,
  type AuthStatus,
} from "@/components/auth/AuthShell";
import { Loader2, MailCheck, MailWarning } from "lucide-react";
import { toast } from "sonner";

type AuthView = "form" | "checkEmail" | "unverified";
type AuthMode = "login" | "register";

const MODE_OPTIONS: { value: AuthMode; label: string }[] = [
  { value: "login", label: "Sign In" },
  { value: "register", label: "Sign Up" },
];

const VIEW_STATUS: Record<Exclude<AuthView, "form">, AuthStatus> = {
  checkEmail: { tone: "success", icon: <MailCheck aria-hidden="true" /> },
  unverified: { tone: "warning", icon: <MailWarning aria-hidden="true" /> },
};

interface AuthPageProps {
  initialMode?: AuthMode;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, login, register } = useAuth();

  const queryMode = searchParams.get("mode") === "login" ? "login" : "register";
  const [mode, setMode] = useState<AuthMode>(initialMode || queryMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // "checkEmail" after a fresh signup, "unverified" after a login blocked pre-verification
  const [view, setView] = useState<AuthView>("form");
  const [pendingEmail, setPendingEmail] = useState("");

  const resendMutation = useMutation({
    mutationFn: (targetEmail: string) => authApi.resendVerification({ email: targetEmail }),
    onSuccess: () => {
      toast.success("Verification email sent. Check your inbox.");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Failed to resend verification email";
      toast.error(msg);
    },
  });

  const backToSignIn = () => {
    setView("form");
    setMode("login");
    setSearchParams({ mode: "login" }, { replace: true });
  };

  // If already authenticated, redirect smoothly to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Friendly notice after arriving here from a successful email confirmation.
  useEffect(() => {
    if ((location.state as { emailConfirmed?: boolean } | null)?.emailConfirmed) {
      toast.success("Email confirmed — sign in below.");
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Synchronize state with URL query param or initialMode prop
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    } else {
      const paramMode = searchParams.get("mode");
      if (paramMode === "login" || paramMode === "register") {
        setMode(paramMode);
      }
    }
  }, [searchParams, initialMode]);

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setSearchParams({ mode: newMode }, { replace: true });
  };

  const isSubmitDisabled = isSubmitting || !email.trim() || !password.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) return;

    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await login({ email: trimmedEmail, password: trimmedPassword });
        navigate("/dashboard", { replace: true });
      } else {
        // No session is created on signup - the account isn't usable until the
        // magic link (verification email) is clicked.
        await register({ email: trimmedEmail, password: trimmedPassword });
        setPendingEmail(trimmedEmail);
        setView("checkEmail");
      }
    } catch (err: any) {
      // AuthContext already shows a toast with the server's message. A blocked,
      // unverified login additionally gets a recovery screen with a resend action.
      if (mode === "login" && err?.response?.data?.errorCode === "EMAIL_NOT_VERIFIED") {
        setPendingEmail(trimmedEmail);
        setView("unverified");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const title =
    view === "checkEmail"
      ? "Check your email"
      : view === "unverified"
      ? "Verify your email"
      : mode === "login"
      ? "Welcome back"
      : "Create an account";

  const description =
    view === "form"
      ? mode === "login"
        ? "Sign in to manage your links and see who's clicking."
        : "Free short links, with a dashboard that shows every click."
      : undefined;

  const resendButtonContent = (idleLabel: string) =>
    resendMutation.isPending ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>Sending…</span>
      </>
    ) : (
      <span>{idleLabel}</span>
    );

  const backToSignInLink = (
    <button type="button" onClick={backToSignIn} className={`text-[13px] ${authLinkClass}`}>
      Back to sign in
    </button>
  );

  return (
    <AuthShell backLink={{ to: "/", label: "Back to Home" }}>
      <AuthHeader
        title={title}
        description={description}
        status={view === "form" ? undefined : VIEW_STATUS[view]}
      />

      <AnimatePresence mode="wait" initial={false}>
        {view === "checkEmail" && (
          <motion.div key="checkEmail" variants={authSwapVariants} initial="hidden" animate="visible" exit="exit">
            <AuthMessage>
              We've sent a confirmation link to <EmailBadge>{pendingEmail}</EmailBadge>. Click it to
              confirm your email, then sign in below.
            </AuthMessage>
            <AuthActions>
              <Button
                variant="secondary"
                disabled={resendMutation.isPending}
                onClick={() => resendMutation.mutate(pendingEmail)}
                className={authSecondaryButtonClass}
              >
                {resendButtonContent("Resend email")}
              </Button>
              {backToSignInLink}
            </AuthActions>
          </motion.div>
        )}

        {view === "unverified" && (
          <motion.div key="unverified" variants={authSwapVariants} initial="hidden" animate="visible" exit="exit">
            <AuthMessage>
              <EmailBadge>{pendingEmail}</EmailBadge> hasn't been verified yet. Check your inbox for
              the confirmation link, or we can send a new one.
            </AuthMessage>
            <AuthActions>
              <Button
                disabled={resendMutation.isPending}
                onClick={() => resendMutation.mutate(pendingEmail)}
                className={`${authSecondaryButtonClass} font-semibold`}
              >
                {resendButtonContent("Resend verification email")}
              </Button>
              {backToSignInLink}
            </AuthActions>
          </motion.div>
        )}

        {view === "form" && (
          <motion.div key="form" variants={authSwapVariants} initial="hidden" animate="visible" exit="exit">
            <AuthModeTabs
              label="Authentication Mode"
              value={mode}
              options={MODE_OPTIONS}
              onChange={handleModeChange}
            />

            <form onSubmit={handleSubmit} className="space-y-5">
              <AuthField
                id="auth-email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <AuthField
                id="auth-password"
                label="Password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                action={
                  <AnimatePresence initial={false}>
                    {mode === "login" && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                      >
                        <Link to="/forgot-password" className={`text-xs ${authLinkClass}`}>
                          Forgot password?
                        </Link>
                      </motion.span>
                    )}
                  </AnimatePresence>
                }
              />

              <AuthSubmitButton
                disabled={isSubmitDisabled}
                loading={isSubmitting}
                loadingLabel={mode === "login" ? "Signing in…" : "Creating account…"}
              >
                {mode === "login" ? "Sign In" : "Create Account"}
              </AuthSubmitButton>
            </form>

            <AuthFooter>
              {mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button type="button" onClick={() => handleModeChange("register")} className={authLinkClass}>
                    Sign up free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button type="button" onClick={() => handleModeChange("login")} className={authLinkClass}>
                    Sign in
                  </button>
                </>
              )}
            </AuthFooter>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
};

export default AuthPage;
