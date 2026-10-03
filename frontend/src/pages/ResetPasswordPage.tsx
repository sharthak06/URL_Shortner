import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { authApi } from "@/api/auth.api";
import { Button } from "@/components/ui/button";
import {
  AuthActions,
  AuthField,
  AuthHeader,
  AuthMessage,
  AuthShell,
  AuthSubmitButton,
  authSecondaryButtonClass,
  authSwapVariants,
  type AuthStatus,
} from "@/components/auth/AuthShell";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const MISSING_TOKEN_STATUS: AuthStatus = { tone: "error", icon: <AlertCircle aria-hidden="true" /> };
const SUCCESS_STATUS: AuthStatus = { tone: "success", icon: <CheckCircle2 aria-hidden="true" /> };

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || newPassword.trim().length < 6) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await authApi.resetPassword({ token, newPassword: newPassword.trim() });
      setIsSuccess(true);
      toast.success("Password reset successfully. Please sign in.");
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "This reset link is invalid or has expired.";
      toast.error(message);
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const state = !token ? "missingToken" : isSuccess ? "success" : "form";

  return (
    <AuthShell backLink={{ to: "/login", label: "Back to Sign In" }}>
      <AuthHeader
        title="Set a new password"
        description={
          isSuccess ? "Your password has been updated." : "Choose a new password for your account."
        }
        status={
          state === "missingToken" ? MISSING_TOKEN_STATUS : state === "success" ? SUCCESS_STATUS : undefined
        }
      />

      <AnimatePresence mode="wait" initial={false}>
        {state === "missingToken" && (
          <motion.div key="missingToken" variants={authSwapVariants} initial="hidden" animate="visible" exit="exit">
            <AuthMessage>
              This reset link is missing its token. Request a new one to continue.
            </AuthMessage>
            <AuthActions>
              <Button asChild variant="secondary" className={authSecondaryButtonClass}>
                <Link to="/forgot-password">Request a new link</Link>
              </Button>
            </AuthActions>
          </motion.div>
        )}

        {state === "success" && (
          <motion.div key="success" variants={authSwapVariants} initial="hidden" animate="visible" exit="exit">
            <p className="flex items-center justify-center gap-2 text-[13px] text-zinc-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" aria-hidden="true" />
              Redirecting you to sign in…
            </p>
          </motion.div>
        )}

        {state === "form" && (
          <motion.form
            key="form"
            variants={authSwapVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <AuthField
              id="reset-password"
              label="New Password"
              type="password"
              autoComplete="new-password"
              placeholder="Enter a new password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (submitError) setSubmitError(null);
              }}
              required
              minLength={6}
              hint="At least 6 characters."
            />

            {submitError && (
              <p role="alert" className="text-[13px] text-red-400">
                {submitError}
              </p>
            )}

            <AuthSubmitButton
              disabled={newPassword.trim().length < 6}
              loading={isSubmitting}
              loadingLabel="Resetting…"
            >
              Reset Password
            </AuthSubmitButton>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthShell>
  );
};

export default ResetPasswordPage;
