import { apiClient } from "./client";
import type {
  CreateUrlPayload,
  SingleUrlResponse,
  AnalyticsResponse,
  UserUrlsResponse,
  UrlStatsResponse,
} from "../types/url.types";

export const urlsApi = {
  createShortUrl: async (payload: CreateUrlPayload) => {
    const res = await apiClient.post<SingleUrlResponse>("/urls/create-short-url", payload);
    return res.data.data.url;
  },

  getUserUrls: async (params?: { limit?: number; cursor?: string; search?: string }) => {
    const res = await apiClient.get<UserUrlsResponse>("/urls", { params });
    return res.data.data;
  },

  getStats: async () => {
    const res = await apiClient.get<UrlStatsResponse>("/urls/stats");
    return res.data.data;
  },

  updateUrl: async (shortCode: string, updatedOriginalUrl: string) => {
    const res = await apiClient.patch<SingleUrlResponse>(`/urls/${shortCode}`, {
      updatedOriginalUrl,
    });
    return res.data.data.url;
  },

  deleteUrl: async (shortCode: string) => {
    await apiClient.delete(`/urls/${shortCode}`);
  },

  getUrlAnalytics: async (urlId: string, params?: { limit?: number; cursor?: string }) => {
    const res = await apiClient.get<AnalyticsResponse>(`/urls/${urlId}/analytics`, {
      params,
    });
    return res.data.data;
  },
};
