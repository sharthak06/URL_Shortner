import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { authApi } from "@/api/auth.api";
import { Button } from "@/components/ui/button";
import {
  AuthActions,
  AuthHeader,
  AuthMessage,
  AuthShell,
  authSecondaryButtonClass,
  authSwapVariants,
  type AuthStatus,
} from "@/components/auth/AuthShell";
import { Loader2, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

type VerifyStatus = "verifying" | "success" | "alreadyVerified" | "error";

// Module-scoped (not component-scoped) on purpose: React 18 StrictMode double-invokes
// effects in development via a synthetic mount -> unmount -> remount, and a useRef
// guard resets on that remount since it belongs to the new component instance. This
// set survives it, so a single-use magic-link token is never submitted twice just
// because of StrictMode. A genuine new link click is always a fresh page load anyway
// (new module instance), so this never blocks a real retry.
const processedTokens = new Set<string>();

const STATUS_COPY: Record<VerifyStatus, { title: string; status: AuthStatus }> = {
  verifying: {
    title: "Verifying your email…",
    status: { tone: "info", icon: <Loader2 className="animate-spin" aria-hidden="true" /> },
  },
  success: {
    title: "Email confirmed",
    status: { tone: "success", icon: <CheckCircle2 aria-hidden="true" /> },
  },
  alreadyVerified: {
    title: "Already verified",
    status: { tone: "info", icon: <ShieldCheck aria-hidden="true" /> },
  },
  error: {
    title: "Verification failed",
    status: { tone: "error", icon: <AlertCircle aria-hidden="true" /> },
  },
};

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<VerifyStatus>(token ? "verifying" : "error");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token || processedTokens.has(token)) return;
    processedTokens.add(token);

    authApi
      .verifyEmail({ token })
      .then((result) => {
        if (result.alreadyVerified) {
          // A harmless replay of an already-used link - just a friendly notice
          // rather than an error.
          setStatus("alreadyVerified");
          return;
        }
        // Verification only confirms the email - no session is created here.
        // The user still needs to sign in with their password.
        setStatus("success");
      })
      .catch((err: any) => {
        setStatus("error");
        setErrorMessage(
          err?.response?.data?.message || "This verification link is invalid or has expired."
        );
      });
    // Only run once on mount, on the token present at load time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Auto-continue to the login page shortly after a successful verification.
  useEffect(() => {
    if (status !== "success") return;
    const timer = setTimeout(
      () =>
        navigate("/login", {
          replace: true,
          state: { emailConfirmed: true },
        }),
      1500
    );
    return () => clearTimeout(timer);
  }, [status, navigate]);

  const { title, status: headerStatus } = STATUS_COPY[status];

  return (
    <AuthShell>
      <AuthHeader title={title} status={headerStatus} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={status} variants={authSwapVariants} initial="hidden" animate="visible" exit="exit">
          {status === "verifying" && (
            <AuthMessage>Hang tight while we confirm your email address.</AuthMessage>
          )}

          {status === "success" && (
            <>
              <AuthMessage>Email confirmed — sign in below. Taking you to the sign-in page…</AuthMessage>
              <AuthActions>
                <Button asChild className={`${authSecondaryButtonClass} font-semibold`}>
                  <Link to="/login">Go to Sign In</Link>
                </Button>
              </AuthActions>
            </>
          )}

          {status === "alreadyVerified" && (
            <>
              <AuthMessage>
                This link has already been used to verify your email. Please sign in with your
                password.
              </AuthMessage>
              <AuthActions>
                <Button asChild className={`${authSecondaryButtonClass} font-semibold`}>
                  <Link to="/login">Go to Sign In</Link>
                </Button>
              </AuthActions>
            </>
          )}

          {status === "error" && (
            <>
              <AuthMessage>{errorMessage}</AuthMessage>
              <AuthActions>
                <Button asChild variant="secondary" className={authSecondaryButtonClass}>
                  <Link to="/login">Go to Sign In</Link>
                </Button>
              </AuthActions>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </AuthShell>
  );
};

export default VerifyEmailPage;
