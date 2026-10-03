import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
  config: CustomRequestConfig;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      config._retry = true; // Prevents queued requests from re-triggering refresh
      resolve(apiClient(config));
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomRequestConfig | undefined;

    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Never intercept auth endpoints to prevent infinite refresh loops
    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/logout") ||
      originalRequest.url?.includes("/auth/verify-email") ||
      originalRequest.url?.includes("/auth/forgot-password") ||
      originalRequest.url?.includes("/auth/reset-password")
    ) {
      return Promise.reject(error);
    }

    // If already retried once, do not loop
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Queue concurrent requests if refresh is already in-flight
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await apiClient.post("/auth/refresh");
      processQueue(null);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as AxiosError);

      // Only dispatch session-expired if the failed request was an active user operation,
      // NOT a routine session probe like /auth/me on cold start
      if (!originalRequest.url?.includes("/auth/me")) {
        window.dispatchEvent(new CustomEvent("auth:session-expired"));
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
