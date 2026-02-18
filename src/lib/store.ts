import { create } from "zustand";

export interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    role: "STUDENT" | "EDUCATOR";
    rollNo?: string | null;
}

interface AuthState {
    user: User | null;
    loading: boolean;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,
    setUser: (user) => set({ user, loading: false }),
    setLoading: (loading) => set({ loading }),
    logout: () => set({ user: null, loading: false }),
}));

interface LiveState {
    currentSession: {
        id: string;
        status: string;
        portalOpen: boolean;
        portalCloseTime: string | null;
        admittedCount: number;
    } | null;
    setSession: (session: LiveState["currentSession"]) => void;
    clearSession: () => void;
}

export const useLiveStore = create<LiveState>((set) => ({
    currentSession: null,
    setSession: (currentSession) => set({ currentSession }),
    clearSession: () => set({ currentSession: null }),
}));
