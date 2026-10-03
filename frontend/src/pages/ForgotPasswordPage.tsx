import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { authApi } from "@/api/auth.api";
import { Button } from "@/components/ui/button";
import {
  AuthActions,
  AuthField,
  AuthFooter,
  AuthHeader,
  AuthMessage,
  AuthShell,
  AuthSubmitButton,
  EmailBadge,
  authLinkClass,
  authSecondaryButtonClass,
  authSwapVariants,
} from "@/components/auth/AuthShell";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setIsSubmitted(true);
    } catch (err: any) {
      const message = err?.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell backLink={{ to: "/login", label: "Back to Sign In" }}>
      <AuthHeader
        title="Reset your password"
        description={
          isSubmitted
            ? "Check your inbox for a link to reset your password."
            : "Enter the email on your account and we'll send you a reset link."
        }
        status={isSubmitted ? { tone: "success", icon: <MailCheck aria-hidden="true" /> } : undefined}
      />

      <AnimatePresence mode="wait" initial={false}>
        {isSubmitted ? (
          <motion.div key="sent" variants={authSwapVariants} initial="hidden" animate="visible" exit="exit">
            <AuthMessage>
              If an account exists for <EmailBadge>{email.trim()}</EmailBadge>, we've sent a reset
              link. It expires shortly, so use it soon.
            </AuthMessage>
            <AuthActions>
              <Button asChild variant="secondary" className={authSecondaryButtonClass}>
                <Link to="/login">Back to Sign In</Link>
              </Button>
            </AuthActions>
          </motion.div>
        ) : (
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
              id="forgot-email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <AuthSubmitButton
              disabled={!email.trim()}
              loading={isSubmitting}
              loadingLabel="Sending link…"
            >
              Send Reset Link
            </AuthSubmitButton>
          </motion.form>
        )}
      </AnimatePresence>

      <AuthFooter>
        Remembered your password?{" "}
        <Link to="/login" className={authLinkClass}>
          Sign in
        </Link>
      </AuthFooter>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
