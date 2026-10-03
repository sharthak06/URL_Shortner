import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
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
      <AuthProvider>
        <BrowserRouter>
          <div className="flex min-h-dvh flex-col bg-canvas text-zinc-100">
            <Navbar />

            <main className="flex flex-1 flex-col">
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
              position="bottom-right"
              theme="dark"
              richColors
              closeButton
              toastOptions={{
                style: {
                  background: "#161618",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  color: "#f4f4f5",
                },
              }}
            />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
