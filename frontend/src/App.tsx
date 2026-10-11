import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RouteLoadingFallback } from "@/components/layout/RouteLoadingFallback";

// Route-level code splitting for optimized initial bundle footprint
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const VerifyEmailPage = lazy(() => import("@/pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className="flex min-h-dvh flex-col bg-canvas text-zinc-100">
            <Navbar />

            <main id="main" tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
              <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/login" element={<AuthPage initialMode="login" />} />
                  <Route path="/signup" element={<AuthPage initialMode="register" />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/analytics/:id" element={<AnalyticsPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </main>

            <Footer />

            <Toaster
              position="top-center"
              theme="dark"
              gap={8}
              offset={16}
              visibleToasts={3}
              // Neutral surface for every toast; semantics carried only by a small
              // colored leading icon (status color = small semantic cue, not a fill).
              icons={{
                success: <CheckCircle2 className="h-[18px] w-[18px] text-emerald-400" aria-hidden="true" />,
                error: <XCircle className="h-[18px] w-[18px] text-red-400" aria-hidden="true" />,
                warning: <AlertTriangle className="h-[18px] w-[18px] text-amber-400" aria-hidden="true" />,
                info: <Info className="h-[18px] w-[18px] text-indigo-400" aria-hidden="true" />,
              }}
              toastOptions={{
                duration: 4000,
                classNames: {
                  toast:
                    "!bg-surface !border !border-line !rounded-xl !shadow-lg !font-sans !text-zinc-100",
                  title: "!font-medium",
                  description: "!text-zinc-400",
                  actionButton: "!bg-brand !text-white",
                  cancelButton: "!bg-surface-hover !text-zinc-300",
                },
              }}
            />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
