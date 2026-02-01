"use client";

import { useState, useEffect, useRef } from "react";
import AppShell from "@/components/AppShell";
import {
    Play, Pause, RotateCcw, Coffee, Target, Timer,
    BookOpen, Zap, Sparkles, Brain, GraduationCap, ChevronRight, Edit2, CheckCircle, Save, Clock
} from "lucide-react";

const STUDY_TIPS = [
    "Drink a glass of water to keep your brain hydrated.",
    "Try active recall – close your eyes and summarize what you just read.",
    "Deep breathing: 4s inhale, 4s hold, 4s exhale.",
    "Stand up and stretch your back and neck for 1 minute.",
    "Visualize your goal: Imagine yourself in a white coat with a stethoscope."
];

const MODES = [
    { name: "Pomodoro", work: 25, break: 5, icon: Zap, desc: "Quick intense burst" },
    { name: "Deep Work", work: 50, break: 10, icon: Brain, desc: "Best for tough chapters" },
    { name: "Mock Test", work: 180, break: 0, icon: GraduationCap, desc: "NEET Stamina Builder" },
];

export default function FocusTimerPage() {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [duration, setDuration] = useState(25);
    const [selectedMode, setSelectedMode] = useState(MODES[0]);
    const [subject, setSubject] = useState("");
    const [sessionsCompleted, setSessionsCompleted] = useState(0);
    const [totalMinutes, setTotalMinutes] = useState(0);
    const [dailyGoalHours, setDailyGoalHours] = useState(6);
    const [mounted, setMounted] = useState(false);
    const [currentTip, setCurrentTip] = useState(STUDY_TIPS[0]);
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [customMinutes, setCustomMinutes] = useState("25");
    const [currentTime, setCurrentTime] = useState(new Date());

    const [isEditingStats, setIsEditingStats] = useState(false);
    const [editHours, setEditHours] = useState(0);
    const [editMins, setEditMins] = useState(0);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [tempGoal, setTempGoal] = useState(6);
    const [isSavingStats, setIsSavingStats] = useState(false);
    const [modeStats, setModeStats] = useState({
        "Pomodoro": 0,
        "Deep Work": 0,
        "Mock Test": 0,
        "Custom": 0
    });

    const timerRef = useRef(null);
    const progressRef = useRef(0); // Tracks seconds elapsed in current session

    useEffect(() => {
        setMounted(true);
        fetchStats();
        const savedGoal = localStorage.getItem("study_daily_goal");
        if (savedGoal) {
            setDailyGoalHours(parseInt(savedGoal));
            setTempGoal(parseInt(savedGoal));
        }

        const savedModeStats = localStorage.getItem("study_mode_stats");
        if (savedModeStats) {
            setModeStats(JSON.parse(savedModeStats));
        }

        // Real-time clock interval
        const clockInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(clockInterval);
    }, []);

    // Sync modeStats to local storage
    useEffect(() => {
        if (mounted) {
            localStorage.setItem("study_mode_stats", JSON.stringify(modeStats));
        }
    }, [modeStats, mounted]);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/timer");
            const result = await res.json();
            if (result.success && result.data) {
                const today = new Date().toLocaleDateString();
                if (result.data.date === today) {
                    setTotalMinutes(result.data.minutes || 0);
                    setSessionsCompleted(result.data.sessions || 0);
                    if (result.data.modeStats) setModeStats(result.data.modeStats);

                    setEditHours(Math.floor((result.data.minutes || 0) / 60));
                    setEditMins((result.data.minutes || 0) % 60);
                } else {
                    // New day reset
                    setModeStats({ "Pomodoro": 0, "Deep Work": 0, "Mock Test": 0, "Custom": 0 });
                }
            }
        } catch (error) {
            console.error("Failed to fetch timer stats", error);
        }
    };

    const saveStatsToDB = async (minutes, sessions, specificModeStats) => {
        const today = new Date().toLocaleDateString();
        try {
            setIsSavingStats(true);
            await fetch("/api/timer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    stats: {
                        date: today,
                        minutes: minutes,
                        sessions: sessions === undefined ? sessionsCompleted : sessions,
                        modeStats: specificModeStats || modeStats
                    }
                })
            });
            setTotalMinutes(minutes);
            if (sessions !== undefined) setSessionsCompleted(sessions);
            if (specificModeStats) setModeStats(specificModeStats);
        } catch (error) {
            console.error("Failed to save timer stats", error);
        } finally {
            setIsSavingStats(false);
        }
    };

    const saveGoal = (val) => {
        const goal = Math.max(1, Math.min(24, parseInt(val) || 6));
        setDailyGoalHours(goal);
        setTempGoal(goal);
        localStorage.setItem("study_daily_goal", goal.toString());
        setIsEditingGoal(false);
    };

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    const newTime = prev - 1;
                    progressRef.current += 1;

                    // Every 60 seconds of study, increment stats
                    if (!isBreak && progressRef.current % 60 === 0) {
                        const modeName = selectedMode.name || "Custom";
                        setModeStats(prev => ({
                            ...prev,
                            [modeName]: (prev[modeName] || 0) + 1
                        }));
                        setTotalMinutes(t => t + 1);
                        // Optional: save to DB every minute? Might be too many requests. 
                        // Let's just save on pause or end.
                    }
                    return newTime;
                });
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            handleSessionEnd();
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft, isBreak, selectedMode]);

    const handleSessionEnd = () => {
        setIsActive(false);
        const elapsedMinsInCurrent = Math.floor(progressRef.current / 60);
        progressRef.current = 0; // Reset for next

        if (!isBreak) {
            const newSessionCount = sessionsCompleted + 1;
            saveStatsToDB(totalMinutes, newSessionCount); // totalMinutes is already incremented by the interval
            if (selectedMode.break > 0) {
                setIsBreak(true);
                setTimeLeft(selectedMode.break * 60);
                setCurrentTip(STUDY_TIPS[Math.floor(Math.random() * STUDY_TIPS.length)]);
            } else {
                alert("Session Complete! Great stamina.");
                resetTimer();
            }
        } else {
            setIsBreak(false);
            setTimeLeft(duration * 60);
        }
    };

    const formatSecondsToMMSS = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatMinutesToHM = (totalMins) => {
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        return { h, m };
    };

    const toggleTimer = () => {
        setIsActive(!isActive);
        setIsEditingTime(false);
    };

    const resetTimer = () => {
        setIsActive(false);
        setIsBreak(false);
        setTimeLeft(duration * 60);
    };

    const changeMode = (mode) => {
        setSelectedMode(mode);
        updateDuration(mode.work);
    };

    const updateDuration = (mins) => {
        const m = parseInt(mins) || 1;
        setDuration(m);
        setCustomMinutes(m.toString());
        setIsActive(false);
        setIsBreak(false);
        setTimeLeft(m * 60);
        setIsEditingTime(false);
    };

    const handleCustomSubmit = (e) => {
        e.preventDefault();
        updateDuration(customMinutes);
    };

    const handleManualStatUpdate = async () => {
        const newTotal = (parseInt(editHours) * 60) + parseInt(editMins);
        await saveStatsToDB(newTotal, sessionsCompleted);
        setIsEditingStats(false);
    };

    if (!mounted) return null;

    const { h: currentH, m: currentM } = formatMinutesToHM(totalMinutes);

    return (
        <AppShell>
            <div className="timer-page-container">

                {/* Header Section */}
                <header className="timer-header">
                    <div className="header-text">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="header-pill">
                                <div className="pill-icon">
                                    <Timer size={16} color="var(--color-primary)" />
                                </div>
                                <span>CONCENTRATION HUB</span>
                            </div>
                            <div className="live-clock-pill">
                                <Clock size={14} />
                                <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            </div>
                        </div>
                        <h1 className="main-title">
                            {selectedMode.name} <span className="highlight-text">Mode</span>
                        </h1>
                        <p className="subtitle">{selectedMode.desc}</p>
                    </div>

                    <div className="header-stats">
                        <div className="stat-card" onClick={() => !isEditingStats && setIsEditingStats(true)}>
                            <div className="stat-label">TODAY'S TOTAL</div>

                            {isEditingStats ? (
                                <div className="stat-edit-row" onClick={e => e.stopPropagation()}>
                                    <input type="number" value={editHours} onChange={(e) => setEditHours(e.target.value)} className="stat-input" />
                                    <span>h</span>
                                    <input type="number" value={editMins} onChange={(e) => setEditMins(e.target.value)} className="stat-input" />
                                    <span>m</span>
                                    <button onClick={handleManualStatUpdate} className="stat-save-btn"><Save size={14} /></button>
                                </div>
                            ) : (
                                <div className="stat-value">
                                    {currentH}h {currentM}m <Edit2 size={12} className="edit-hint" />
                                </div>
                            )}
                        </div>

                        <div className="stat-card accent">
                            <div className="stat-label accent">SESSIONS</div>
                            <div className="stat-value accent">{sessionsCompleted}</div>
                            <div style={{ fontSize: '0.55rem', fontWeight: 700, opacity: 0.6, marginTop: '4px', color: 'var(--color-primary)' }}>
                                UPDATES ON FINISH
                            </div>
                        </div>
                    </div>
                </header>

                <div className="timer-content-grid">

                    {/* Left Panel: Main Timer */}
                    <div className="timer-main-card-wrapper">
                        <div className={`timer-card ${isBreak ? 'break-mode' : ''}`}>

                            {!isBreak && !isActive && (
                                <div className="subject-input-wrapper">
                                    <div className="input-with-icon">
                                        <BookOpen className="input-icon" size={18} />
                                        <input
                                            type="text"
                                            placeholder="What are you studying tonight?"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {isBreak ? (
                                <div className="break-display">
                                    <div className="break-icon-wrapper">
                                        <Coffee size={48} fill="#DCFCE7" />
                                    </div>
                                    <h2 className="break-title">Relax & Recharge</h2>
                                    <div className="study-tip-pill">
                                        <Sparkles size={16} color="#10B981" />
                                        <span>{currentTip}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="timer-display-controls">
                                    {isActive && subject && (
                                        <div className="focusing-pill">
                                            <div className="pulse-dot"></div>
                                            <span>Focusing: {subject}</span>
                                        </div>
                                    )}

                                    {isEditingTime && !isActive ? (
                                        <form onSubmit={handleCustomSubmit} className="custom-time-form">
                                            <div className="input-group">
                                                <input
                                                    type="number"
                                                    autoFocus
                                                    value={customMinutes}
                                                    onChange={(e) => setCustomMinutes(e.target.value)}
                                                />
                                                <span className="mins-label">MINS</span>
                                            </div>
                                            <button type="submit" className="btn btn-primary set-time-btn">Set Time</button>
                                        </form>
                                    ) : (
                                        <div
                                            className={`timer-clock ${isActive ? 'active' : ''}`}
                                            onClick={() => !isActive && setIsEditingTime(true)}
                                            title={!isActive ? "Click to edit time" : ""}
                                        >
                                            {formatSecondsToMMSS(timeLeft)}
                                            {!isActive && (
                                                <div className="timer-edit-trigger">
                                                    <Edit2 size={14} />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Sub-timer hint to show session progress */}
                                    {isActive && !isBreak && (
                                        <div style={{
                                            marginTop: '1rem',
                                            fontSize: '0.85rem',
                                            fontWeight: 800,
                                            color: '#94A3B8',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            <Sparkles size={14} color="var(--color-primary)" />
                                            <span>
                                                {Math.floor((timeLeft / (duration * 60)) * 100)}% to next session
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="timer-buttons">
                                <button
                                    onClick={toggleTimer}
                                    className={`btn main-action-btn ${isActive ? 'danger' : 'primary'}`}
                                >
                                    {isActive ? <><Pause size={20} strokeWidth={3} /> Hold Session</> : <><Play size={20} fill="white" strokeWidth={3} /> Start Focus</>}
                                </button>

                                <button
                                    onClick={resetTimer}
                                    className="btn btn-secondary reset-btn"
                                >
                                    <RotateCcw size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Modes & Motivation */}
                    <aside className="timer-sidebar">

                        <div className="card sidebar-presets">
                            <h3 className="section-title">
                                <Zap size={18} fill="var(--color-primary)" color="var(--color-primary)" /> Quick Presets
                            </h3>
                            <div className="presets-list">
                                {MODES.map((mode) => {
                                    const modeMinsDone = modeStats[mode.name] || 0;
                                    const isCurrent = selectedMode.name === mode.name;
                                    // Progress bar logic if active
                                    const sessionElapsed = isCurrent && !isBreak ? Math.floor(progressRef.current / 60) : 0;

                                    return (
                                        <button
                                            key={mode.name}
                                            onClick={() => changeMode(mode)}
                                            className={`preset-btn-item ${isCurrent ? 'active' : ''}`}
                                            style={{ position: 'relative', overflow: 'hidden' }}
                                        >
                                            <div className="preset-icon">
                                                <mode.icon size={20} />
                                            </div>
                                            <div className="preset-info">
                                                <div className="preset-name">{mode.name}</div>
                                                <div className="preset-timer">
                                                    {mode.work}m interval • {modeMinsDone > 0 ? `${modeMinsDone}m today` : 'Not started'}
                                                </div>
                                            </div>
                                            {/* Micro Progress Bar */}
                                            <div style={{
                                                position: 'absolute', bottom: 0, left: 0, height: '4px',
                                                width: `${Math.min((modeMinsDone / mode.work) * 100, 100)}%`,
                                                background: 'var(--color-primary)', opacity: 0.3
                                            }}></div>
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => setIsEditingTime(true)}
                                    className={`preset-btn-item custom ${isEditingTime ? 'editing' : ''}`}
                                >
                                    <div className="preset-icon">
                                        <Edit2 size={20} />
                                    </div>
                                    <div className="preset-info">
                                        <div className="preset-name">Custom Time</div>
                                        <div className="preset-timer">Set your own minutes</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="card expert-tip-card">
                            <div className="tip-header">
                                <Sparkles size={16} fill="#C7D2FE" />
                                <span>STUDY EXPERT</span>
                            </div>
                            <p className="tip-text">
                                "The brain thrives on predictability. Use the <b>same timer duration</b> for the same subject to build a neural trigger for deep concentration."
                            </p>
                        </div>

                    </aside>
                </div>

                {/* Performance Section with Mode Breakdown */}
                <div className="performance-section">
                    <div className="performance-header">
                        <h3 className="performance-title">
                            <Clock size={18} color="var(--color-primary)" /> Daily Performance
                        </h3>
                        <div className="goal-editor" onClick={() => setIsEditingGoal(true)}>
                            {isEditingGoal ? (
                                <div className="goal-edit-input" onClick={e => e.stopPropagation()}>
                                    <span>GOAL:</span>
                                    <input
                                        type="number"
                                        value={tempGoal}
                                        onChange={e => setTempGoal(e.target.value)}
                                    />
                                    <span>HRS</span>
                                    <CheckCircle size={16} className="save-goal-icon" onClick={() => saveGoal(tempGoal)} />
                                </div>
                            ) : (
                                <>GOAL: {dailyGoalHours} HOURS <Edit2 size={12} /></>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
                        <div className="card performance-card">
                            <div className="progress-container">
                                <div className="progress-info">
                                    <span className="label">Overall Completion</span>
                                    <span className="percentage">{Math.round((totalMinutes / (dailyGoalHours * 60)) * 100)}%</span>
                                </div>
                                <div className="progress-bar-bg">
                                    <div className="progress-bar-fill" style={{ width: `${Math.min((totalMinutes / (dailyGoalHours * 60)) * 100, 100)}%` }}></div>
                                </div>
                            </div>

                            <div className="goal-status-divider"></div>

                            <div className="goal-status-display">
                                {totalMinutes >= dailyGoalHours * 60 ? (
                                    <div className="goal-achieved">
                                        <div className="achievement-icon">
                                            <CheckCircle size={22} />
                                        </div>
                                        <div className="achievement-text">
                                            <div className="main">GOAL ACHIEVED</div>
                                            <div className="sub">Target: {dailyGoalHours}h Met</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="goal-remaining">
                                        <div className="time-left">
                                            {Math.floor((dailyGoalHours * 60 - totalMinutes) / 60)}h {(dailyGoalHours * 60 - totalMinutes) % 60}m
                                        </div>
                                        <div className="time-label">LEFT TO REACH GOAL</div>
                                        <div className="target-pill">
                                            <Target size={12} /> TARGET: {dailyGoalHours}H
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mode breakdown card - Redesigned for premium look */}
                        <div className="card performance-card-breakdown">
                            <div className="breakdown-header">
                                <Zap size={14} fill="#F59E0B" color="#F59E0B" />
                                <h4>MODE BREAKDOWN</h4>
                            </div>

                            <div className="breakdown-list">
                                {[...MODES, { name: "Custom", icon: Clock, work: duration }].map(m => {
                                    const minsDone = modeStats[m.name] || 0;
                                    if (m.name === "Custom" && minsDone === 0) return null;

                                    return (
                                        <div key={m.name} className="breakdown-item">
                                            <div className="item-top">
                                                <div className="item-label">
                                                    <div className="item-icon-small">
                                                        <m.icon size={12} />
                                                    </div>
                                                    <span>{m.name}</span>
                                                </div>
                                                <div className="item-stats">
                                                    <span className="done">{minsDone}m</span>
                                                    <span className="sep">/</span>
                                                    <span className="total">{m.work}m</span>
                                                </div>
                                            </div>
                                            <div className="item-progress-track">
                                                <div className="item-progress-fill" style={{
                                                    width: `${Math.min((minsDone / m.work) * 100, 100)}%`,
                                                    background: m.name === 'Deep Work' ? 'linear-gradient(90deg, #6366F1, #818CF8)' :
                                                        m.name === 'Mock Test' ? 'linear-gradient(90deg, #F43F5E, #FB7185)' :
                                                            m.name === 'Custom' ? 'linear-gradient(90deg, #94A3B8, #CBD5E1)' :
                                                                'linear-gradient(90deg, #4F46E5, #6366F1)'
                                                }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <style jsx>{`
                .timer-page-container {
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 2rem 1rem 4rem;
                }

                .timer-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 2rem;
                    margin-bottom: 3rem;
                    padding-top: 1rem;
                }

                .header-pill {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.75rem;
                }

                .header-pill span {
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: var(--color-primary);
                    letter-spacing: 0.08em;
                }

                .live-clock-pill {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.4rem 0.8rem;
                    background: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    color: #64748B;
                    font-size: 0.8rem;
                    font-weight: 800;
                    margin-bottom: 0.75rem;
                }

                .main-title {
                    font-size: clamp(1.8rem, 5vw, 2.8rem);
                    font-weight: 950;
                    letter-spacing: -0.04em;
                    margin-bottom: 0.5rem;
                }

                .highlight-text {
                    color: var(--color-primary);
                }

                .subtitle {
                    color: var(--color-text-muted);
                    font-weight: 600;
                    font-size: clamp(0.9rem, 2vw, 1.05rem);
                }

                .header-stats {
                    display: flex;
                    gap: 1rem;
                }

                .stat-card {
                    padding: 1rem 1.4rem;
                    background: white;
                    border-radius: 20px;
                    border: 1px solid var(--color-border);
                    box-shadow: var(--shadow-sm);
                    min-width: 160px;
                    cursor: pointer;
                }

                .stat-card.accent {
                    background: var(--color-primary-light);
                    border-color: var(--color-primary-medium);
                    cursor: default;
                }

                .stat-label {
                    font-size: 0.65rem;
                    font-weight: 800;
                    color: var(--color-text-muted);
                    margin-bottom: 0.4rem;
                    letter-spacing: 0.05em;
                }

                .stat-label.accent {
                    color: var(--color-primary);
                }

                .stat-value {
                    font-size: 1.3rem;
                    font-weight: 900;
                    display: flex;
                    align-items: baseline;
                    gap: 0.25rem;
                }

                .stat-value.accent {
                    color: var(--color-primary);
                }

                .edit-hint {
                    opacity: 0.3;
                    margin-left: 0.25rem;
                }

                .stat-edit-row {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                .stat-input {
                    width: 38px;
                    border: 1px solid var(--color-border);
                    border-radius: 6px;
                    padding: 4px;
                    text-align: center;
                    font-weight: 800;
                    font-size: 1rem;
                }

                .stat-save-btn {
                    background: var(--color-primary);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 4px 8px;
                    margin-left: 0.25rem;
                }

                .timer-content-grid {
                    display: grid;
                    grid-template-columns: 1fr 320px;
                    gap: 2rem;
                }

                .timer-card {
                    padding: clamp(2rem, 8vw, 4rem) 2rem;
                    background: white;
                    border-radius: 40px;
                    box-shadow: 0 40px 80px -20px rgba(0,0,0,0.06);
                    border: 1px solid var(--color-border);
                    text-align: center;
                    min-height: 520px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    transition: all 0.3s ease;
                }

                .timer-card.break-mode {
                    background: linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%);
                    border-color: #10B981;
                }

                .subject-input-wrapper {
                    max-width: 380px;
                    margin: 0 auto 2.5rem;
                    width: 100%;
                }

                .input-with-icon {
                    position: relative;
                }

                .input-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94A3B8;
                }

                .input-with-icon input {
                    width: 100%;
                    padding: 0.9rem 1rem 0.9rem 2.8rem;
                    border-radius: 16px;
                    border: 2px solid #F1F5F9;
                    background: #F8FAFC;
                    font-size: 0.95rem;
                    font-weight: 600;
                    outline: none;
                    transition: all 0.2s;
                }

                .input-with-icon input:focus {
                    border-color: var(--color-primary-medium);
                    background: white;
                    box-shadow: 0 0 0 4px var(--color-primary-light);
                }

                .break-icon-wrapper {
                    color: #10B981;
                    margin-bottom: 1.5rem;
                }

                .break-title {
                    font-size: 2rem;
                    font-weight: 900;
                    color: #166534;
                    margin-bottom: 1rem;
                }

                .study-tip-pill {
                    background: white;
                    padding: 0.8rem 1.2rem;
                    border-radius: 14px;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.6rem;
                    border: 1px dashed #10B981;
                    max-width: 90%;
                }

                .study-tip-pill span {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: #15803D;
                    text-align: left;
                }

                .timer-display-controls {
                    margin-bottom: 3rem;
                    position: relative;
                }

                .focusing-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: var(--color-primary-light);
                    border-radius: 10px;
                    margin-bottom: 1.5rem;
                }

                .pulse-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--color-primary);
                    animation: pulse 1.5s infinite;
                }

                .focusing-pill span {
                    font-size: 0.8rem;
                    font-weight: 800;
                    color: var(--color-primary);
                }

                .timer-clock {
                    font-size: clamp(5rem, 15vw, 8.5rem);
                    font-weight: 950;
                    font-variant-numeric: tabular-nums;
                    line-height: 1;
                    letter-spacing: -0.06em;
                    position: relative;
                    display: inline-block;
                    cursor: pointer;
                    transition: color 0.3s;
                }

                .timer-clock.active {
                    color: var(--color-primary);
                    cursor: default;
                }

                .timer-edit-trigger {
                    position: absolute;
                    top: -5px;
                    right: -35px;
                    background: #F1F5F9;
                    padding: 6px;
                    border-radius: 8px;
                    color: #64748B;
                }

                .custom-time-form {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                }

                .input-group {
                    display: flex;
                    align-items: baseline;
                    gap: 0.75rem;
                }

                .input-group input {
                    font-size: 6rem;
                    font-weight: 950;
                    width: 180px;
                    border: none;
                    outline: none;
                    background: transparent;
                    text-align: center;
                    color: var(--color-primary);
                    letter-spacing: -0.06em;
                }

                .mins-label {
                    font-size: 1.5rem;
                    font-weight: 900;
                    color: #94A3B8;
                }

                .timer-buttons {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                }

                .main-action-btn {
                    padding: 1rem 3rem;
                    border-radius: 20px;
                    font-size: 1rem;
                    font-weight: 900;
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    transition: all 0.3s;
                }

                .main-action-btn.primary {
                    background: var(--color-primary);
                    color: white;
                    box-shadow: 0 15px 30px -10px rgba(79, 70, 229, 0.4);
                }

                .main-action-btn.danger {
                    background: #FEE2E2;
                    color: #EF4444;
                }

                .reset-btn {
                    padding: 1rem 1.5rem;
                    border-radius: 20px;
                    background: white;
                    border: 1px solid var(--color-border);
                }

                .timer-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .sidebar-presets {
                    padding: 1.5rem;
                    border-radius: 24px;
                }

                .section-title {
                    font-size: 1rem;
                    font-weight: 900;
                    margin-bottom: 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                }

                .presets-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .preset-btn-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    border-radius: 14px;
                    border: 2.5px solid transparent;
                    background: #F8FAFC;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                }

                .preset-btn-item.active {
                    border-color: var(--color-primary);
                    background: var(--color-primary-light);
                }

                .preset-icon {
                    padding: 8px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: var(--shadow-sm);
                    color: #64748B;
                }

                .preset-btn-item.active .preset-icon {
                    background: var(--color-primary);
                    color: white;
                }

                .preset-name {
                    font-size: 0.85rem;
                    font-weight: 800;
                }

                .preset-btn-item.active .preset-name {
                    color: var(--color-primary);
                }

                .preset-timer {
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: #64748B;
                }

                .preset-btn-item.custom {
                    border: 2.5px dashed #E2E8F0;
                    background: white;
                }

                .expert-tip-card {
                    padding: 1.5rem;
                    border-radius: 24px;
                    background: linear-gradient(135deg, #4F46E5 0%, #312E81 100%);
                    color: white;
                    border: none;
                }

                .tip-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.75rem;
                    font-size: 0.7rem;
                    font-weight: 900;
                    letter-spacing: 0.1em;
                    color: #C7D2FE;
                }

                .tip-text {
                    font-size: 0.85rem;
                    line-height: 1.6;
                    font-weight: 500;
                    opacity: 0.95;
                }

                .performance-section {
                    margin-top: 3rem;
                }

                .performance-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.25rem;
                }

                .performance-title {
                    font-size: 1.1rem;
                    font-weight: 900;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .goal-editor {
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: var(--color-primary);
                    background: var(--color-primary-light);
                    padding: 0.4rem 0.8rem;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    cursor: pointer;
                }

                .goal-edit-input {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                }

                .goal-edit-input input {
                    width: 35px;
                    border: 1px solid var(--color-primary);
                    border-radius: 4px;
                    text-align: center;
                    font-weight: bold;
                    background: white;
                }

                .performance-card {
                    padding: 2rem;
                    border-radius: 28px;
                    display: flex;
                    align-items: center;
                    gap: 2.5rem;
                }

                .performance-card-breakdown {
                    padding: 1.5rem;
                    border-radius: 28px;
                    background: white;
                }

                .breakdown-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1.25rem;
                }

                .breakdown-header h4 {
                    font-size: 0.75rem;
                    font-weight: 900;
                    color: #64748B;
                    letter-spacing: 0.05em;
                }

                .breakdown-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1.15rem;
                }

                .breakdown-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .item-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .item-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .item-label span {
                    font-size: 0.8rem;
                    font-weight: 800;
                    color: var(--color-text-main);
                }

                .item-icon-small {
                    padding: 4px;
                    background: #F1F5F9;
                    border-radius: 6px;
                    color: #64748B;
                    display: flex;
                }

                .item-stats {
                    font-size: 0.75rem;
                    font-weight: 800;
                }

                .item-stats .done {
                    color: var(--color-primary);
                }

                .item-stats .sep {
                    margin: 0 2px;
                    opacity: 0.3;
                }

                .item-stats .total {
                    color: #94A3B8;
                }

                .item-progress-track {
                    height: 6px;
                    background: #F1F5F9;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .item-progress-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .progress-container {
                    flex: 1;
                }

                .progress-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.75rem;
                }

                .progress-info .label {
                    font-weight: 800;
                    color: #64748B;
                    font-size: 0.8rem;
                }

                .progress-info .percentage {
                    font-weight: 900;
                    color: var(--color-primary);
                }

                .progress-bar-bg {
                    height: 12px;
                    background: #F1F5F9;
                    border-radius: 10px;
                    overflow: hidden;
                }

                .progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #4F46E5, #818CF8);
                    border-radius: 10px;
                    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .goal-status-divider {
                    width: 1px;
                    height: 60px;
                    background: #E2E8F0;
                }

                .goal-status-display {
                    text-align: center;
                    min-width: 180px;
                }

                .goal-achieved {
                    color: #10B981;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    text-align: left;
                }

                .achievement-icon {
                    background: #DCFCE7;
                    padding: 8px;
                    border-radius: 50%;
                }

                .achievement-text .main {
                    font-size: 1rem;
                    font-weight: 950;
                }

                .achievement-text .sub {
                    font-size: 0.7rem;
                    font-weight: 800;
                    opacity: 0.8;
                }

                .time-left {
                    font-size: 1.8rem;
                    font-weight: 950;
                    color: var(--color-text-main);
                    line-height: 1;
                }

                .time-label {
                    font-size: 0.65rem;
                    font-weight: 800;
                    color: #FB7185;
                    letter-spacing: 0.05em;
                    margin: 0.25rem 0 0.75rem;
                }

                .target-pill {
                    padding: 0.4rem 0.8rem;
                    background: #F1F5F9;
                    border-radius: 8px;
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: #64748B;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                }

                @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 0.6; }
                    50% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.6; }
                }

                /* RESPONSIVE MEDIA QUERIES */
                @media (max-width: 992px) {
                    .timer-header {
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                        gap: 1.5rem;
                    }
                    .header-pill {
                        justify-content: center;
                    }
                    .header-stats {
                        width: 100%;
                        justify-content: center;
                    }
                    .stat-card {
                        flex: 1;
                        min-width: unset;
                    }
                }

                @media (max-width: 768px) {
                    .timer-content-grid {
                        grid-template-columns: 1fr;
                    }
                    .timer-sidebar {
                        order: 2;
                    }
                    .timer-main-card-wrapper {
                        order: 1;
                    }
                    .performance-card {
                        flex-direction: column;
                        gap: 1.5rem;
                    }
                    .goal-status-divider {
                        width: 100%;
                        height: 1px;
                    }
                    .goal-status-display {
                        width: 100%;
                        min-width: unset;
                    }
                }

                @media (max-width: 480px) {
                    .timer-header {
                        margin-bottom: 2rem;
                    }
                    .header-stats {
                        flex-direction: column;
                    }
                    .timer-card {
                        padding: 3rem 1.5rem;
                        min-height: auto;
                    }
                    .timer-clock {
                        font-size: 4.5rem;
                    }
                    .main-action-btn {
                        padding: 1rem 1.5rem;
                        flex: 1;
                    }
                    .performance-card {
                        padding: 1.5rem;
                    }
                }

                input::-webkit-outer-spin-button,
                input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
            `}</style>
        </AppShell>
    );
}
