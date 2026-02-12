"use client";

import { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";


const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState("light");
    // const [mounted, setMounted] = useState(false); // Removed as per instruction

    useEffect(() => {
        const fetchTheme = async () => {
            try {
                const res = await api.get('/user-storage/');
                const savedTheme = res.data?.theme || "light";
                setTheme(savedTheme);
                document.documentElement.setAttribute('data-theme', savedTheme);
            } catch (e) {
                setTheme("light");
                document.documentElement.setAttribute('data-theme', "light");
            }
        };
        fetchTheme();
    }, []);

    const toggleTheme = async () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        try {
            const res = await api.get('/user-storage/');
            await api.post('/user-storage/', { ...res.data, theme: newTheme });
        } catch (e) { }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {/* The mounted state is removed, so this visibility logic might need adjustment or removal based on actual requirements */}
            {/* For now, assuming the div should always be visible or handled differently */}
            <div>
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
