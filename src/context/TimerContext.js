"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api, { getCookie } from "@/lib/api";
import { saveData, loadData } from "@/lib/progress";

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

    // New states for improvements
    const [isBreakTime, setIsBreakTime] = useState(false);
    const [breakType, setBreakType] = useState(null); // 'short' or 'long'
    const [pomodoroCount, setPomodoroCount] = useState(0);
    const [studyStreak, setStudyStreak] = useState(0);
    const [recentSessions, setRecentSessions] = useState([]);
    const [onTimerComplete, setOnTimerComplete] = useState(null);

    const intervalRef = useRef(null);
    const audioRef = useRef(null);

    // Helper for Local Date (YYYY-MM-DD)
    const getLocalDate = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Initialize Auth & Settings
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // We'll treat the presence of a token as "logged in"
                const token = getCookie('token');
                if (token) {
                    setUid('persistent-user'); // Dummy ID for internal state
                    const res = await api.get('/study-logs/');
                    // Calculate today's stats from logs
                    // Store ALL fetched logs for history display
                    setRecentSessions(res.data);

                    // Calculate today's stats specifically for the progress bar
                    const today = getLocalDate();
                    const todayLogs = res.data.filter(log => log.date === today);
                    const totalSecs = todayLogs.reduce((acc, log) => acc + (log.minutes * 60), 0);

                    // Also calculate subject distribution for today from logs
                    const todaySubjects = {};
                    todayLogs.forEach(log => {
                        const s = log.subject || "General";
                        todaySubjects[s] = (todaySubjects[s] || 0) + (log.minutes * 60);
                    });

                    setRealStats(prev => ({
                        ...prev,
                        todaySeconds: totalSecs,
                        bySubject: todaySubjects
                    }));

                    // Load goals and streak
                    const settings = await loadData('timer_settings', { dailyGoal: 6 * 3600, studyStreak: 0 });
                    setDailyGoal(settings.dailyGoal);
                    setStudyStreak(settings.studyStreak);
                }
            } catch (err) {
                console.warn("TimerContext: Failed to fetch data from Django.");
            }
        };

        fetchUserData();

        // Initialize audio
        audioRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    }, []);

    const hasLoaded = useRef(false);

    // Load persisted state from DB
    useEffect(() => {
        const loadTimerState = async () => {
            try {
                const res = await api.get('/user-storage/');
                const saved = res.data?.timer_state;
                if (saved) {
                    const { seconds: s, isActive: active, lastUpdate, mode: m, initialTime: it, subject, isBreak, breakT, pomoCount } = saved;
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
                    setIsBreakTime(isBreak || false);
                    setBreakType(breakT || null);
                    setPomodoroCount(pomoCount || 0);
                }
            } catch (e) { }
            hasLoaded.current = true;
        };
        loadTimerState();
    }, []);

    // Save timer state to DB (debounced/on change)
    useEffect(() => {
        if (!hasLoaded.current) return;
        const saveState = async () => {
            const state = {
                seconds,
                isActive,
                mode,
                initialTime,
                subject: selectedSubject,
                isBreak: isBreakTime,
                breakT: breakType,
                pomoCount: pomodoroCount,
                lastUpdate: Date.now()
            };
            try {
                await api.patch('/user-storage/', { timer_state: state });
            } catch (e) { }
        };
        // Only save specifically when status changes to avoid per-second DB hammering
        if (!isActive || seconds % 30 === 0 || seconds === 0) {
            saveState();
        }
    }, [seconds, isActive, mode, initialTime, selectedSubject, isBreakTime, breakType, pomodoroCount]);

    // Save timer settings to backend
    useEffect(() => {
        const saveSettings = async () => {
            try {
                await api.patch('/user-storage/', { timer_settings: { dailyGoal, studyStreak } });
            } catch (e) { }
        };
        saveSettings();
    }, [dailyGoal, studyStreak]);

    // Timer Logic
    // Timer Logic - Robust implementation
    useEffect(() => {
        let interval;
        if (isActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds(s => s - 1);
            }, 1000);
        } else if (seconds === 0 && isActive) {
            handleTimerComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, seconds > 0]);

    useEffect(() => {
        if (seconds === 0 && isActive) {
            handleTimerComplete();
        }
    }, [seconds, isActive]);

    // Simplified Stats Listener
    useEffect(() => {
        if (!uid) return;
        const interval = setInterval(async () => {
            try {
                const res = await api.get('/study-logs/');
                setRecentSessions(res.data);
            } catch (e) { }
        }, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, [uid]);

    const handleTimerComplete = () => {
        setIsActive(false);

        // Play audio
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio play failed:", e));
        }

        // Browser notification
        if ("Notification" in window && Notification.permission === "granted") {
            const title = isBreakTime ? "Break Complete! 🎯" : "Focus Session Complete! 🎉";
            const body = isBreakTime ? "Time to get back to studying!" : "Great job! Time to log your session.";
            new Notification(title, { body, icon: "/timer-icon.png" });
        }

        if (isBreakTime) {
            // Break finished, return to study mode
            setIsBreakTime(false);
            setBreakType(null);
            setSeconds(25 * 60);
            setInitialTime(25 * 60);
            setMode("Pomodoro");
        } else {
            // Study session finished
            if (mode === "Pomodoro") {
                const newCount = pomodoroCount + 1;
                setPomodoroCount(newCount);
                savePomodoroCount(newCount);

                // Suggest break
                if (newCount % 4 === 0) {
                    suggestBreak('long', 15);
                } else {
                    suggestBreak('short', 5);
                }
            }

            // Trigger callback for UI modal with duration
            if (onTimerComplete) {
                console.log("TimerContext: Triggering onTimerComplete with duration", initialTime);
                onTimerComplete(initialTime);
            }
        }
    };

    const suggestBreak = (type, minutes) => {
        // Automatically set break suggestion state instead of blocking confirm
        setBreakType(type);
        // We'll let the UI handle showing the suggestion
        console.log(`TimerContext: Break suggested - ${type} (${minutes} mins)`);
    };

    const startBreak = (type, minutes) => {
        setIsBreakTime(true);
        setBreakType(type);
        const secs = minutes * 60;
        setSeconds(secs);
        setInitialTime(secs);
        setMode(type === 'long' ? "Long Break" : "Short Break");
        setIsActive(true);
    };

    const savePomodoroCount = async (count) => {
        if (!uid) return; // Only save if a user is identified
        try {
            await api.patch('/user-storage/', { timer_pomo_count: { count } });
        } catch (e) {
            console.error("TimerContext: Failed to save pomodoro count to user storage.", e);
        }
    };

    const updateDailyGoal = (newGoalSeconds) => {
        setDailyGoal(newGoalSeconds);
        // Persistence handled by useEffect for dailyGoal
    };

    const saveSession = async ({ topic, minutes, difficulty }) => {
        try {
            const subj = selectedSubject || "General Study";
            const sessTopic = topic || "Self Study";
            const sessMinutes = minutes || Math.ceil((initialTime - seconds) / 60);

            // Payload for backend
            const todayDate = getLocalDate();
            const payload = {
                minutes: sessMinutes,
                subject: subj,
                topic: sessTopic,
                date: todayDate
            };

            let newSession = null;

            try {
                // Try saving to backend
                const res = await api.post('/study-logs/', payload);
                if (res.status === 201) {
                    newSession = res.data;
                }
            } catch (err) {
                console.error("TimerContext: Backend save failed", err);
                // Fallback: Create local session object so UI updates even if offline/error
                newSession = {
                    id: Date.now(), // Temp ID
                    minutes: sessMinutes,
                    subject: subj,
                    topic: sessTopic,
                    date: todayDate,
                    created_at: new Date().toISOString()
                };
            }

            if (newSession) {
                // Update Session List
                setRecentSessions(prev => [newSession, ...prev]);

                // Update Stats (Daily Goal, Subject)
                const durationSeconds = sessMinutes * 60;
                setRealStats(prev => {
                    const currentSubjSeconds = prev.bySubject[subj] || 0;
                    return {
                        ...prev,
                        todaySeconds: prev.todaySeconds + durationSeconds,
                        bySubject: {
                            ...prev.bySubject,
                            [subj]: currentSubjSeconds + durationSeconds
                        }
                    };
                });
            }

            return true;
        } catch (error) {
            console.error("TimerContext: Critical Save Error:", error);
            return false;
        }
    };

    const deleteSession = async (sessionId) => {
        // Find the session before deleting to subtract stats
        const sessionToDelete = recentSessions.find(s => s.id === sessionId);

        // Helper to update stats
        const updateStatsAfterDelete = () => {
            if (sessionToDelete) {
                const durationSeconds = (sessionToDelete.minutes || 0) * 60;
                setRealStats(prev => {
                    const subj = sessionToDelete.subject || "General Study";
                    const currentSubj = prev.bySubject[subj] || 0;
                    return {
                        ...prev,
                        todaySeconds: Math.max(0, prev.todaySeconds - durationSeconds),
                        bySubject: {
                            ...prev.bySubject,
                            [subj]: Math.max(0, currentSubj - durationSeconds)
                        }
                    };
                });
            }
        };

        // If ID is very large (timestamp), it's a local session
        if (typeof sessionId === 'number' && sessionId > 1000000000) {
            setRecentSessions(prev => prev.filter(s => s.id !== sessionId));
            updateStatsAfterDelete();
            return true;
        }

        try {
            await api.delete(`/study-logs/${sessionId}/`);
            setRecentSessions(prev => prev.filter(s => s.id !== sessionId));
            updateStatsAfterDelete();
            return true;
        } catch (error) {
            // If 404 (Not Found), it's already gone, so we update UI
            if (error && error.response && error.response.status === 404) {
                setRecentSessions(prev => prev.filter(s => s.id !== sessionId));
                updateStatsAfterDelete();
                return true;
            }
            console.error("TimerContext: Deletion Error:", error);
            return false;
        }
    };

    const updateStreak = async () => {
        const token = getCookie('token');
        if (!token) return;

        try {
            // Get TODAY in local time
            const d = new Date();
            const tYear = d.getFullYear();
            const tMonth = String(d.getMonth() + 1).padStart(2, '0');
            const tDay = String(d.getDate()).padStart(2, '0');
            const today = `${tYear}-${tMonth}-${tDay}`;

            const data = await loadData('timer_settings', { studyStreak: 0, lastStudyDate: null });

            let newStreak = data.studyStreak || 0;

            // Only update if we haven't already updated for today
            if (data.lastStudyDate !== today) {
                // Get YESTERDAY in local time
                const y = new Date();
                y.setDate(y.getDate() - 1);
                const yYear = y.getFullYear();
                const yMonth = String(y.getMonth() + 1).padStart(2, '0');
                const yDay = String(y.getDate()).padStart(2, '0');
                const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

                // Logic: 
                // If last study date was yesterday -> Streak + 1
                // If last study date was today (handled by if above, but double check) -> No change (already done)
                // If last study date was older -> Reset to 1 (New streak starts today)
                // If no last study date -> Start at 1

                if (data.lastStudyDate === yesterdayStr) {
                    newStreak += 1;
                } else {
                    newStreak = 1;
                }

                await saveData('timer_settings', {
                    ...data,
                    studyStreak: newStreak,
                    lastStudyDate: today
                });
                setStudyStreak(newStreak);
            }
        } catch (err) {
            console.warn("TimerContext: Could not update streak.", err);
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
        saveSession,
        deleteSession,
        isBreakTime,
        breakType,
        pomodoroCount,
        studyStreak,
        recentSessions,
        setOnTimerComplete,
        startBreak
    };

    return (
        <TimerContext.Provider value={value}>
            {children}
        </TimerContext.Provider>
    );
}

export const useTimer = () => {
    const context = useContext(TimerContext);
    if (context === undefined) {
        throw new Error("useTimer must be used within a TimerProvider");
    }
    return context;
};
