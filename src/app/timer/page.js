"use client";

import { useState, useEffect, useRef } from "react";
import AppShell from "@/components/AppShell";
import {
    Play, Pause, RotateCcw,
    BookOpen, Zap, GraduationCap,
    TrendingUp, Award, Clock, Edit3, Check
} from "lucide-react";

export default function TimerPage() {
    const [seconds, setSeconds] = useState(25 * 60);
    const [initialTime, setInitialTime] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState("Pomodoro");
    const [mounted, setMounted] = useState(false);

    // Edit Mode State - Added for user request
    const [isEditing, setIsEditing] = useState(false);
    const [customInput, setCustomInput] = useState("25");

    // Stats
    const [dailyGoal, setDailyGoal] = useState(6 * 60);
    const [todayStudyTime, setTodayStudyTime] = useState(0);
    const [modeStats, setModeStats] = useState({ Pomodoro: 0, "Deep Work": 0, "Mock Test": 0 });
    const audioRef = useRef(null);

    useEffect(() => {
        setMounted(true);
        const savedStats = localStorage.getItem("neet_timer_stats");
        if (savedStats) {
            const parsed = JSON.parse(savedStats);
            const today = new Date().toLocaleDateString();
            if (parsed.date === today) {
                setTodayStudyTime(parsed.todayTime || 0);
                setModeStats(parsed.modeStats || { Pomodoro: 0, "Deep Work": 0, "Mock Test": 0 });
            }
        }
        audioRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem("neet_timer_stats", JSON.stringify({
                date: new Date().toLocaleDateString(),
                todayTime: todayStudyTime,
                modeStats: modeStats
            }));
        }
    }, [todayStudyTime, modeStats, mounted]);

    useEffect(() => {
        let interval = null;
        if (isActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds(s => s - 1);
            }, 1000);
        } else if (seconds === 0 && isActive) {
            clearInterval(interval);
            setIsActive(false);
            handleTimerComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, seconds]);

    const handleTimerComplete = () => {
        if (audioRef.current) audioRef.current.play();

        const minutesCompleted = initialTime / 60;
        setTodayStudyTime(prev => prev + minutesCompleted);
        setModeStats(prev => ({
            ...prev,
            [mode]: (prev[mode] || 0) + minutesCompleted
        }));

        if (typeof window !== "undefined") {
            alert(`Great job! You finished a ${mode} session.`);
        }
    };

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setSeconds(initialTime);
    };

    const switchMode = (newMode, minutes) => {
        setMode(newMode);
        setIsEditing(false);
        setIsActive(false);
        const secs = minutes * 60;
        setSeconds(secs);
        setInitialTime(secs);
        setCustomInput(minutes.toString());
    };

    const handleCustomTimeSubmit = () => {
        const mins = parseInt(customInput);
        if (!isNaN(mins) && mins > 0) {
            const secs = mins * 60;
            setInitialTime(secs);
            setSeconds(secs);
            setIsEditing(false);
            setMode("Custom");
        }
    };

    const formatTime = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        if (h > 0) {
            return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
        }
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    if (!mounted) return null;

    const progressPercentage = Math.min((todayStudyTime / dailyGoal) * 100, 100);
    // Avoid division by zero
    const sessionProgress = initialTime > 0 ? ((initialTime - seconds) / initialTime) * 100 : 0;

    return (
        <AppShell>
            <div className="hub-container">
                <header className="page-header">
                    <div className="header-badge">
                        <Clock size={14} /> CONCENTRATION HUB
                    </div>
                    <h1>Focus Statistics & Timer</h1>
                    <p>Track your study hours and stay in the zone.</p>
                </header>

                <div className="grid-layout">
                    {/* LEFT PANEL: TIMER */}
                    <div className="timer-panel">
                        <div className="presets-row">
                            <button
                                className={`preset-card ${mode === "Pomodoro" ? "active" : ""}`}
                                onClick={() => switchMode("Pomodoro", 25)}
                            >
                                <div className="icon-box"><Zap size={20} /></div>
                                <div className="text-box">
                                    <h3>Pomodoro</h3>
                                    <span>25m</span>
                                </div>
                            </button>
                            <button
                                className={`preset-card ${mode === "Deep Work" ? "active" : ""}`}
                                onClick={() => switchMode("Deep Work", 50)}
                            >
                                <div className="icon-box"><BookOpen size={20} /></div>
                                <div className="text-box">
                                    <h3>Deep Work</h3>
                                    <span>50m</span>
                                </div>
                            </button>
                            <button
                                className={`preset-card ${mode === "Mock Test" ? "active" : ""}`}
                                onClick={() => switchMode("Mock Test", 180)}
                            >
                                <div className="icon-box"><GraduationCap size={20} /></div>
                                <div className="text-box">
                                    <h3>Mock Test</h3>
                                    <span>180m</span>
                                </div>
                            </button>
                        </div>

                        <div className="main-timer-card">
                            <div className="timer-header">
                                <span className="mode-badge">{mode.toUpperCase()}</span>
                                {isActive && <span className="live-status">LIVE</span>}
                            </div>

                            {/* Editable Timer Display */}
                            <div className="timer-display-wrapper">
                                {isEditing ? (
                                    <div className="edit-time-box">
                                        <input
                                            type="number"
                                            value={customInput}
                                            onChange={(e) => setCustomInput(e.target.value)}
                                            className="time-input"
                                            autoFocus
                                        />
                                        <button className="save-time-btn" onClick={handleCustomTimeSubmit}>
                                            <Check size={24} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className={`time-display ${isActive ? "active" : ""}`}>
                                        {formatTime(seconds)}
                                        <button className="edit-icon" onClick={() => setIsEditing(true)}>
                                            <Edit3 size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Session Progress Bar */}
                            <div className="session-progress">
                                <div className="bar-bg">
                                    <div className="bar-fill" style={{ width: `${sessionProgress}%` }}></div>
                                </div>
                                <div className="session-visuals">
                                    <span>{Math.floor((initialTime - seconds) / 60)}m elapsed</span>
                                    <span>{Math.floor(initialTime / 60)}m total</span>
                                </div>
                            </div>

                            <div className="timer-controls">
                                <button className="control-btn reset" onClick={resetTimer}>
                                    <RotateCcw size={22} />
                                </button>
                                <button className={`control-btn play ${isActive ? "playing" : ""}`} onClick={toggleTimer}>
                                    {isActive ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" style={{ marginLeft: 4 }} />}
                                    <span>{isActive ? "PAUSE" : "START FOCUS"}</span>
                                </button>
                            </div>
                        </div>

                        <div className="expert-tip">
                            <div className="tip-icon"><Award size={20} color="#fbbf24" /></div>
                            <div className="tip-content">
                                <h4>Study Expert Tip</h4>
                                <p>
                                    {mode === "Pomodoro" && "Take a 5 minute break after this cycle. Your brain needs to reset."}
                                    {mode === "Deep Work" && "Eliminate all distractions. Put your phone in another room."}
                                    {mode === "Mock Test" && "Simulate exam conditions. No water breaks for the first hour."}
                                    {mode === "Custom" && "Consistency is key. Keep pushing!"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: STATS */}
                    <div className="stats-panel">
                        <div className="daily-progress-card">
                            <h3><TrendingUp size={18} /> Daily Performance</h3>
                            <div className="progress-circle">
                                <span className="progress-value">{Math.round(todayStudyTime / 60 * 10) / 10}h</span>
                                <span className="progress-label">Today's Study</span>
                            </div>
                            <div className="progress-bar-container">
                                <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                            <p className="goal-text">Goal: {dailyGoal / 60} Hours ({Math.round(progressPercentage)}%)</p>
                        </div>

                        <div className="breakdown-card">
                            <h3>Mode Breakdown</h3>
                            <ul className="stats-list">
                                <li>
                                    <span>Pomodoro</span>
                                    <span className="stat-val">{Math.round(modeStats.Pomodoro || 0)}m</span>
                                </li>
                                <li>
                                    <span>Deep Work</span>
                                    <span className="stat-val">{Math.round(modeStats["Deep Work"] || 0)}m</span>
                                </li>
                                <li>
                                    <span>Mock Test</span>
                                    <span className="stat-val">{Math.round(modeStats["Mock Test"] || 0)}m</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .hub-container {
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 24px;
                }

                .page-header { margin-bottom: 32px; }
                .header-badge { display: inline-flex; align-items: center; gap: 6px; background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 800; margin-bottom: 12px; }
                .page-header h1 { font-size: 2.5rem; font-weight: 800; color: #1e293b; margin-bottom: 8px; }
                .page-header p { color: #64748b; font-size: 1.1rem; }

                .grid-layout { display: grid; grid-template-columns: 1fr 320px; gap: 32px; }
                
                /* TIMER PANEL */
                .presets-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; }
                .preset-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; text-align: left; transition: all 0.2s; position: relative; overflow: hidden; }
                .preset-card:hover { transform: translateY(-2px); border-color: #cbd5e1; }
                .preset-card.active { border-color: #4f46e5; background: #eef2ff; }
                .preset-card.active .icon-box { background: #4f46e5; color: white; }
                .icon-box { width: 40px; height: 40px; border-radius: 10px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.2s; }
                .text-box h3 { margin: 0; font-size: 0.95rem; font-weight: 700; color: #1e293b; }
                .text-box span { font-size: 0.75rem; color: #64748b; }

                .main-timer-card { background: white; border-radius: 32px; padding: 48px; text-align: center; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; margin-bottom: 24px; }
                .timer-header { display: flex; justify-content: center; align-items: center; gap: 12px; margin-bottom: 32px; }
                .mode-badge { background: #f1f5f9; color: #64748b; padding: 6px 16px; border-radius: 99px; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.05em; }
                .live-status { background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; animation: pulse 1.5s infinite; }
                
                .timer-display-wrapper { position: relative; width: fit-content; margin: 0 auto 32px auto; min-height: 100px; }
                .time-display { font-size: 6rem; font-weight: 800; color: #1e293b; line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: -2px; display: flex; align-items: center; gap: 16px; }
                .time-display.active { color: #4f46e5; }
                
                .edit-icon { opacity: 0; transition: all 0.2s; background: white; border: 1px solid #e2e8f0; cursor: pointer; color: #94a3b8; border-radius: 50%; padding: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); position: absolute; right: -40px; top: 50%; transform: translateY(-50%); }
                .timer-display-wrapper:hover .edit-icon { opacity: 1; }
                .edit-icon:hover { color: #4f46e5; border-color: #4f46e5; }

                .edit-time-box { display: flex; align-items: center; gap: 12px; justify-content: center; }
                .time-input { font-size: 4rem; font-weight: 800; border: none; border-bottom: 4px solid #4f46e5; width: 220px; text-align: center; outline: none; color: #4f46e5; background: transparent; padding: 0 12px; }
                .save-time-btn { background: #4f46e5; color: white; width: 48px; height: 48px; border-radius: 50%; border: none; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                .save-time-btn:hover { transform: scale(1.1); }

                .session-progress { margin-bottom: 40px; max-width: 400px; margin-left: auto; margin-right: auto; }
                .bar-bg { height: 8px; background: #f1f5f9; border-radius: 99px; overflow: hidden; margin-bottom: 8px; }
                .bar-fill { height: 100%; background: #4f46e5; transition: width 1s linear; }
                .session-visuals { display: flex; justify-content: space-between; font-size: 0.85rem; color: #64748b; font-weight: 600; }
                
                .timer-controls { display: flex; align-items: center; justify-content: center; gap: 24px; }
                .control-btn { border: none; cursor: pointer; transition: all 0.2s; }
                .control-btn.reset { width: 56px; height: 56px; border-radius: 50%; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; }
                .control-btn.reset:hover { background: #e2e8f0; color: #1e293b; }
                .control-btn.play { height: 64px; padding: 0 48px; border-radius: 99px; background: #1e293b; color: white; display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 1.1rem; }
                .control-btn.play:hover { transform: scale(1.05); box-shadow: 0 10px 20px -5px rgba(30, 41, 59, 0.4); }
                .control-btn.play.playing { background: #4f46e5; }
                .control-btn.play.playing:hover { box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.4); }

                .expert-tip { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-radius: 20px; padding: 20px; display: flex; gap: 16px; align-items: flex-start; }
                .tip-icon { background: white; padding: 8px; border-radius: 50%; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .tip-content h4 { margin: 0 0 4px 0; color: #92400e; font-size: 0.9rem; font-weight: 800; text-transform: uppercase; }
                .tip-content p { margin: 0; color: #b45309; font-size: 0.95rem; line-height: 1.4; font-weight: 500; }

                /* STATS PANEL */
                .stats-panel { display: flex; flex-direction: column; gap: 24px; }
                .daily-progress-card { background: white; border-radius: 20px; padding: 24px; border: 1px solid #e2e8f0; text-align: center; }
                .daily-progress-card h3 { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 1rem; color: #64748b; margin-bottom: 24px; }
                .progress-circle { display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; }
                .progress-value { font-size: 3rem; font-weight: 800; color: #1e293b; line-height: 1; }
                .progress-label { font-size: 0.9rem; color: #94a3b8; font-weight: 600; }
                .progress-bar-container { height: 8px; background: #f1f5f9; border-radius: 99px; overflow: hidden; margin-bottom: 12px; }
                .progress-bar { height: 100%; background: #4f46e5; border-radius: 99px; transition: width 0.5s ease; }
                .goal-text { font-size: 0.8rem; color: #64748b; font-weight: 600; }

                .breakdown-card { background: white; border-radius: 20px; padding: 24px; border: 1px solid #e2e8f0; }
                .breakdown-card h3 { font-size: 1rem; color: #64748b; margin-bottom: 16px; }
                .stats-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
                .stats-list li { display: flex; justify-content: space-between; font-size: 0.95rem; color: #1e293b; font-weight: 500; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
                .stats-list li:last-child { border: none; padding-bottom: 0; }
                .stat-val { font-weight: 700; color: #4f46e5; }

                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                
                @media (max-width: 900px) {
                    .grid-layout { grid-template-columns: 1fr; }
                    .presets-row { overflow-x: auto; padding-bottom: 8px; }
                    .preset-card { min-width: 140px; }
                }
            `}</style>
        </AppShell>
    );
}
