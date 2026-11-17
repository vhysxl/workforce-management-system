import { create } from "zustand";

export interface UserProfile {
  id?: string;
  email?: string;
  role?: string;
  full_name?: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | string[] | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  fetchProfile: () => Promise<void>;
  refresh: () => Promise<string | null>;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const STORAGE_KEY = "access_token";
let refreshPromise: Promise<string | null> | null = null;
let sessionVersion = 0;

function parseJwt(token: string | null): UserProfile | null {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    const parsed = JSON.parse(jsonPayload);
    return {
      id: parsed.sub,
      email: parsed.email,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

const initialToken = localStorage.getItem(STORAGE_KEY);

export const useAuthStore = create<AuthState>((set, get) => ({
  token: initialToken,
  user: parseJwt(initialToken),
  isAuthenticated: Boolean(initialToken),
  isLoading: false,
  error: null,

  refresh: () => {
    if (refreshPromise) return refreshPromise;

    const session = sessionVersion;
    const request: Promise<string | null> = (async () => {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();

      if (session !== sessionVersion) return null;

      if (!response.ok) {
        if (response.status === 401) {
          get().logout();
          set({ error: data.message });
        }
        throw new Error(
          Array.isArray(data.message) ? data.message.join("\n") : data.message,
        );
      }

      localStorage.setItem(STORAGE_KEY, data.token);
      set((state) => ({
        token: data.token,
        isAuthenticated: true,
        user: { ...state.user, ...parseJwt(data.token) },
      }));
      return data.token;
    })().finally(() => {
      if (refreshPromise === request) refreshPromise = null;
    });

    refreshPromise = request;
    return request;
  },

  fetchWithAuth: async (url, options = {}) => {
    const session = sessionVersion;
    const token = get().token;
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(url, { ...options, headers });
    if (response.status !== 401 || !token || session !== sessionVersion)
      return response;

    options.signal?.throwIfAborted();
    const nextToken =
      get().token !== token ? get().token : await get().refresh();
    options.signal?.throwIfAborted();
    if (!nextToken || session !== sessionVersion) return response;

    headers.set("Authorization", `Bearer ${nextToken}`);
    return fetch(url, { ...options, headers });
  },

  fetchProfile: async () => {
    if (!get().token) return;
    const session = sessionVersion;
    try {
      const response = await get().fetchWithAuth("/api/employees/me");
      if (!response.ok) return;
      const data = await response.json();
      if (session !== sessionVersion) return;
      set((state) => ({
        user: {
          ...state.user,
          id: data.id,
          full_name: data.full_name,
          email: data.email ?? state.user?.email,
          role: data.role ?? state.user?.role,
        },
      }));
    } catch {}
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        set({ error: data.message });
        return;
      }

      sessionVersion += 1;
      refreshPromise = null;
      localStorage.setItem(STORAGE_KEY, data.token);
      set({
        token: data.token,
        isAuthenticated: true,
        user: parseJwt(data.token),
      });
      get().fetchProfile();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    sessionVersion += 1;
    refreshPromise = null;
    localStorage.removeItem(STORAGE_KEY);
    set({ token: null, isAuthenticated: false, user: null, error: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));

if (initialToken) {
  useAuthStore.getState().fetchProfile();
}
