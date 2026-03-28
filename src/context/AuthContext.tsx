"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

// ─── Dummy credentials ────────────────────────────────────────────────────────
const DUMMY_EMAIL    = "admin@edma.com";
const DUMMY_PASSWORD = "123456";
const STORAGE_KEY    = "edma-auth-v1";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthContextValue {
    isLoggedIn: boolean;
    /** Returns true on success, false on wrong credentials */
    login:    (email: string, password: string) => boolean;
    /** Dummy register — accepts any valid input and logs the user in */
    register: (name: string, email: string, password: string) => void;
    logout:   () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Hydrate from localStorage once on mount
    useEffect(() => {
        try {
            setIsLoggedIn(localStorage.getItem(STORAGE_KEY) === "true");
        } catch { /* private browsing */ }
    }, []);

    const login = useCallback((email: string, password: string): boolean => {
        if (
            email.trim().toLowerCase() === DUMMY_EMAIL &&
            password === DUMMY_PASSWORD
        ) {
            try { localStorage.setItem(STORAGE_KEY, "true"); } catch { /* ignore */ }
            setIsLoggedIn(true);
            return true;
        }
        return false;
    }, []);

    const register = useCallback((_name: string, _email: string, _password: string) => {
        // Dummy: accept any submission, just log the user in
        try { localStorage.setItem(STORAGE_KEY, "true"); } catch { /* ignore */ }
        setIsLoggedIn(true);
    }, []);

    const logout = useCallback(() => {
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
        setIsLoggedIn(false);
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
