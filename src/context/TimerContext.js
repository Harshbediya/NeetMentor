"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, Timestamp, doc, setDoc, getDoc } from "firebase/firestore";

const TimerContext = createContext();

export function TimerProvider({ children }) {
    const [seconds, setSeconds] = useState(25 * 60);
    const [initialTime, setInitialTime] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState("Pomodoro");
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [uid, setUid] = useState(null);
    const [dailyGoal, setDailyGoal] = useState(6 * 3600);
    const [realStats, setRealStats] = useState({
        todaySeconds: 0,
        byMode: { Pomodoro: 0, "Deep Work": 0, "Mock Test": 0 },
        bySubject: { Physics: 0, Chemistry: 0, Biology: 0 }
    });

    const intervalRef = useRef(null);

    // Initialize Auth & Settings
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUid(user.uid);
                // Fetch daily goal from settings
                const settingsRef = doc(db, "users", user.uid, "settings", "timer");
                const docSnap = await getDoc(settingsRef);
                if (docSnap.exists()) {
                    setDailyGoal(docSnap.data().dailyGoal || 6 * 3600);
                }
            } else {
                setUid(null);
            }
        });

        // Request notification permission
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        return () => unsubscribeAuth();
    }, []);

    // Load persisted state from localStorage to handle refresh
    useEffect(() => {
        const saved = localStorage.getItem('timer_state');
        if (saved) {
            const { seconds: s, isActive: active, lastUpdate, mode: m, initialTime: it, subject } = JSON.parse(saved);
            const now = Date.now();
            const elapsed = Math.floor((now - lastUpdate) / 1000);

            if (active) {
                const remaining = Math.max(s - elapsed, 0);
                setSeconds(remaining);
                setIsActive(remaining > 0);
            } else {
                setSeconds(s);
                setIsActive(false);
            }
            setMode(m);
            setInitialTime(it);
            setSelectedSubject(subject);
        }
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        const state = {
            seconds,
            isActive,
            mode,
            initialTime,
            subject: selectedSubject,
            lastUpdate: Date.now()
        };
        localStorage.setItem('timer_state', JSON.stringify(state));
    }, [seconds, isActive, mode, initialTime, selectedSubject]);

    // Timer Logic
    useEffect(() => {
        if (isActive && seconds > 0) {
            intervalRef.current = setInterval(() => {
                setSeconds(s => {
                    if (s <= 1) {
                        handleTimerComplete();
                        return 0;
                    }
                    return s - 1;
                });
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isActive, seconds]);

    // Real-time Stats Listener
    useEffect(() => {
        if (!uid) return;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const q = query(
            collection(db, "users", uid, "sessions"),
            where("createdAt", ">=", Timestamp.fromDate(todayStart))
        );
        const unsubscribeStats = onSnapshot(q, (snapshot) => {
            let totalSecs = 0;
            const byMode = { Pomodoro: 0, "Deep Work": 0, "Mock Test": 0 };
            const bySubject = { Physics: 0, Chemistry: 0, Biology: 0 };
            snapshot.forEach((doc) => {
                const data = doc.data();
                const dur = Number(data.duration || 0);
                totalSecs += dur;
                if (data.mode && byMode[data.mode] !== undefined) byMode[data.mode] += dur;
                if (data.subject && bySubject[data.subject] !== undefined) bySubject[data.subject] += dur;
            });
            setRealStats({ todaySeconds: totalSecs, byMode, bySubject });
        });
        return () => unsubscribeStats();
    }, [uid]);

    const handleTimerComplete = () => {
        setIsActive(false);
        // Play sound (will be handled by the page component or globally here if needed)
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Focus Session Complete! 🎉", {
                body: "Great job! Time to log your session.",
                icon: "/timer-icon.png" // User can add an icon later
            });
        }
    };

    const updateDailyGoal = async (newGoalSeconds) => {
        setDailyGoal(newGoalSeconds);
        if (uid) {
            const settingsRef = doc(db, "users", uid, "settings", "timer");
            await setDoc(settingsRef, { dailyGoal: newGoalSeconds }, { merge: true });
        }
    };

    const saveSession = async (sessionDetails) => {
        if (!uid || !selectedSubject) return;
        const sessionData = {
            subject: selectedSubject,
            topic: sessionDetails.topic || "Self Study",
            difficulty: sessionDetails.difficulty,
            duration: initialTime,
            mode: mode,
            createdAt: serverTimestamp()
        };
        try {
            await addDoc(collection(db, "users", uid, "sessions"), sessionData);
            return true;
        } catch (error) {
            console.error("Save Error:", error);
            return false;
        }
    };

    const value = {
        seconds, setSeconds,
        isActive, setIsActive,
        mode, setMode,
        selectedSubject, setSelectedSubject,
        initialTime, setInitialTime,
        dailyGoal, updateDailyGoal,
        realStats,
        uid,
        saveSession
    };

    return (
        <TimerContext.Provider value={value}>
            {children}
        </TimerContext.Provider>
    );
}

export const useTimer = () => useContext(TimerContext);
