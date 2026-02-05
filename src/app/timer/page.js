"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import {
    Play, Pause, RotateCcw,
    BookOpen, Zap, GraduationCap,
    TrendingUp, Award, Clock, Edit3, Check, Target, Trophy
} from "lucide-react";
import { useTimer } from "@/context/TimerContext";

export default function TimerPage() {
    const {
        seconds, setSeconds,
        isActive, setIsActive,
        mode, setMode,
        selectedSubject, setSelectedSubject,
        initialTime, setInitialTime,
        dailyGoal, updateDailyGoal,
        realStats,
        saveSession
    } = useTimer();

    const [mounted, setMounted] = useState(false);
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [customInput, setCustomInput] = useState("25");
    const [goalInput, setGoalInput] = useState("6");
    const [showLoggingModal, setShowLoggingModal] = useState(false);
    const [sessionDetails, setSessionDetails] = useState({ topic: "", difficulty: "Medium" });

    useEffect(() => {
        setMounted(true);
        setGoalInput((dailyGoal / 3600).toString());
    }, [dailyGoal]);

    const handleTimerCompleteUI = () => {
        setShowLoggingModal(true);
    };

    // Watch for timer completion in UI to show modal
    useEffect(() => {
        if (seconds === 0 && !isActive && initialTime > 0 && !showLoggingModal) {
            // Check if it just finished (this is a bit tricky with global state, 
            // but we can assume if it's 0 and was active recently)
            // Actually handleTimerComplete in Context handles notifications, 
            // but the UI modal needs to be triggered here.
        }
    }, [seconds, isActive]);

    const toggleTimer = () => {
        if (!isActive && !selectedSubject) {
            alert("Please select a subject (Physics/Chemistry/Biology) before starting.");
            return;
        }
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setSeconds(initialTime);
    };

    const switchMode = (newMode, minutes) => {
        setMode(newMode);
        setIsEditingTime(false);
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
            setIsEditingTime(false);
            setMode("Custom");
        }
    };

    const handleGoalSubmit = () => {
        const hours = parseFloat(goalInput);
        if (!isNaN(hours) && hours > 0) {
            updateDailyGoal(hours * 3600);
            setIsEditingGoal(false);
        }
    };

    const formatTime = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return h > 0 ? `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}` : `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const onSave = async () => {
        const success = await saveSession(sessionDetails);
        if (success) {
            setShowLoggingModal(false);
            setSessionDetails({ topic: "", difficulty: "Medium" });
        } else {
            alert("Error saving session. Check your connection.");
        }
    };

    if (!mounted) return null;

    const progressPercentage = Math.min((realStats.todaySeconds / dailyGoal) * 100, 100);
    const sessionProgress = initialTime > 0 ? ((initialTime - seconds) / initialTime) : 0;

    // Circular Progress Math
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (sessionProgress * circumference);

    return (
        <AppShell>
            <div className="hub-container">
                <header className="page-header">
                    <div className="header-badge"><Clock size={14} /> NEET MENTOR FOCUS</div>
                    <h1>Your Study Sanctuary</h1>
                    <p>Stay disciplined. Every second counts towards your dream college.</p>
                </header>

                <div className="grid-layout">
                    {/* LEFT PANEL: MOTIVATIONAL TIMER */}
                    <div className="timer-panel">
                        <div className="subject-selection">
                            <h3 className="section-title">Step 1: Choose Your Weapon</h3>
                            <div className="subject-chips">
                                {["Physics", "Chemistry", "Biology"].map(sub => (
                                    <button
                                        key={sub}
                                        className={`subject-chip ${selectedSubject === sub ? "active" : ""}`}
                                        onClick={() => !isActive && setSelectedSubject(sub)}
                                        disabled={isActive}
                                    >
                                        {sub}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="timer-main-area">
                            <div className="circular-timer-container">
                                <svg className="timer-svg" width="300" height="300">
                                    <circle className="timer-bg" cx="150" cy="150" r={radius} />
                                    <circle
                                        className="timer-progress"
                                        cx="150"
                                        cy="150"
                                        r={radius}
                                        style={{
                                            strokeDasharray: circumference,
                                            strokeDashoffset: strokeDashoffset,
                                            transition: isActive ? "stroke-dashoffset 1s linear" : "stroke-dashoffset 0.3s ease"
                                        }}
                                    />
                                </svg>

                                <div className="timer-content">
                                    <span className="current-mode">{mode}</span>
                                    {isEditingTime ? (
                                        <div className="edit-time-inline">
                                            <input
                                                type="number"
                                                value={customInput}
                                                onChange={(e) => setCustomInput(e.target.value)}
                                                autoFocus
                                            />
                                            <button onClick={handleCustomTimeSubmit}><Check size={20} /></button>
                                        </div>
                                    ) : (
                                        <h2 className="time-text" onClick={() => !isActive && setIsEditingTime(true)}>
                                            {formatTime(seconds)}
                                            {!isActive && <Edit3 size={16} className="tiny-edit" />}
                                        </h2>
                                    )}
                                    <div className="control-row">
                                        <button className="icon-btn" onClick={resetTimer}><RotateCcw size={20} /></button>
                                        <button className={`play-btn ${isActive ? 'active' : ''}`} onClick={toggleTimer}>
                                            {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" style={{ marginLeft: 4 }} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mode-selector-vertical">
                                <button className={mode === "Pomodoro" ? "active" : ""} onClick={() => switchMode("Pomodoro", 25)}>
                                    <Zap size={18} /> <span>25m</span>
                                </button>
                                <button className={mode === "Deep Work" ? "active" : ""} onClick={() => switchMode("Deep Work", 50)}>
                                    <BookOpen size={18} /> <span>50m</span>
                                </button>
                                <button className={mode === "Mock Test" ? "active" : ""} onClick={() => switchMode("Mock Test", 180)}>
                                    <GraduationCap size={18} /> <span>3h</span>
                                </button>
                            </div>
                        </div>

                        <div className="motivation-card">
                            <Trophy size={24} color="#f59e0b" />
                            <div className="mot-content">
                                <h4>Focusing on {selectedSubject || "your goals"}</h4>
                                <p>"The pain of discipline is far less than the pain of regret."</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: GOALS & STATS */}
                    <div className="stats-panel">
                        <div className="goal-card-premium">
                            <div className="goal-header">
                                <h3><Target size={18} /> Daily Goal</h3>
                                {isEditingGoal ? (
                                    <div className="goal-edit">
                                        <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)} />
                                        <button onClick={handleGoalSubmit}>OK</button>
                                    </div>
                                ) : (
                                    <button className="edit-link" onClick={() => setIsEditingGoal(true)}>Edit</button>
                                )}
                            </div>

                            <div className="goal-stats">
                                <div className="stat-main">
                                    <span className="big-val">{(realStats.todaySeconds / 3600).toFixed(1)}h</span>
                                    <span className="label">Studied</span>
                                </div>
                                <div className="stat-separator">/</div>
                                <div className="stat-sub">
                                    <span className="sub-val">{(dailyGoal / 3600).toFixed(1)}h</span>
                                    <span className="label">Target</span>
                                </div>
                            </div>

                            <div className="progress-track-premium">
                                <div className="track-fill" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                            <p className="status-text">
                                {progressPercentage >= 100 ? "Goal achieved! You are a champion! 🏆" : `${Math.round(100 - progressPercentage)}% remaining to reach your goal.`}
                            </p>
                        </div>

                        <div className="breakdown-card-premium">
                            <h3>Subject Distribution</h3>
                            <div className="dist-list">
                                {Object.entries(realStats.bySubject).map(([sub, secs]) => (
                                    <div key={sub} className="dist-item">
                                        <div className="dist-info">
                                            <span>{sub}</span>
                                            <span>{Math.round(secs / 60)}m</span>
                                        </div>
                                        <div className="dist-bar">
                                            <div
                                                className={`dist-fill ${sub.toLowerCase()}`}
                                                style={{ width: `${realStats.todaySeconds > 0 ? (secs / realStats.todaySeconds) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="breakdown-card-premium">
                            <h3>Mode History</h3>
                            <div className="mode-grid">
                                {Object.entries(realStats.byMode).map(([m, secs]) => (
                                    <div key={m} className="mode-box">
                                        <span className="m-val">{Math.round(secs / 60)}m</span>
                                        <span className="m-label">{m}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* LOGGING MODAL */}
                {showLoggingModal && (
                    <div className="modal-overlay">
                        <div className="logging-modal">
                            <h2>Session Complete! 🎉</h2>
                            <p>Great focus! Log this to keep your streak alive.</p>
                            <div className="form-group">
                                <label>What exactly did you study?</label>
                                <input type="text" placeholder="e.g. Organic Chemistry, Kinematics..." value={sessionDetails.topic} onChange={e => setSessionDetails({ ...sessionDetails, topic: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>How difficult was it?</label>
                                <div className="diff-row">
                                    {["Easy", "Medium", "Hard"].map(d => (
                                        <button key={d} className={`diff-btn ${sessionDetails.difficulty === d ? d.toLowerCase() : ""}`} onClick={() => setSessionDetails({ ...sessionDetails, difficulty: d })}>{d}</button>
                                    ))}
                                </div>
                            </div>
                            <button className="save-session-btn" onClick={onSave}>Save & Celebrate</button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .hub-container { max-width: 1200px; margin: 0 auto; padding: 40px 24px; color: #1e293b; }
                .page-header { margin-bottom: 40px; }
                .header-badge { display: inline-flex; align-items: center; gap: 8px; background: #eef2ff; color: #4f46e5; padding: 6px 16px; border-radius: 99px; font-size: 0.8rem; font-weight: 800; margin-bottom: 16px; letter-spacing: 1px; }
                .page-header h1 { font-size: 3rem; font-weight: 900; line-height: 1.1; margin-bottom: 12px; background: linear-gradient(135deg, #1e293b 0%, #4f46e5 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .page-header p { font-size: 1.25rem; color: #64748b; max-width: 600px; }

                .grid-layout { display: grid; grid-template-columns: 1fr 380px; gap: 40px; }

                /* TIMER SECTION */
                .section-title { font-size: 0.9rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
                .subject-chips { display: flex; gap: 12px; margin-bottom: 32px; }
                .subject-chip { padding: 12px 24px; border-radius: 16px; border: 2px solid #f1f5f9; background: white; font-weight: 700; color: #64748b; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .subject-chip.active { background: #4f46e5; color: white; border-color: #4f46e5; transform: scale(1.05); box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.4); }
                .subject-chip:disabled { opacity: 0.8; cursor: not-allowed; }

                .timer-main-area { display: flex; align-items: center; gap: 40px; margin-bottom: 40px; background: white; padding: 40px; border-radius: 40px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; }
                .circular-timer-container { position: relative; width: 300px; height: 300px; }
                .timer-svg { transform: rotate(-90deg); }
                .timer-bg { fill: none; stroke: #f1f5f9; stroke-width: 12; }
                .timer-progress { fill: none; stroke: #4f46e5; stroke-width: 12; stroke-linecap: round; }
                
                .timer-content { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                .current-mode { font-size: 0.85rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
                .time-text { font-size: 4.5rem; font-weight: 900; color: #1e293b; letter-spacing: -2px; cursor: pointer; position: relative; }
                .tiny-edit { position: absolute; top: 0; right: -20px; color: #cbd5e1; }
                .edit-time-inline input { font-size: 3rem; width: 140px; border: none; border-bottom: 4px solid #4f46e5; text-align: center; font-weight: 900; outline: none; }
                .control-row { display: flex; align-items: center; gap: 24px; margin-top: 24px; }
                .play-btn { width: 80px; height: 80px; border-radius: 28px; background: #1e293b; color: white; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; }
                .play-btn:hover { transform: scale(1.1); box-shadow: 0 15px 30px -10px rgba(30, 41, 59, 0.5); }
                .play-btn.active { background: #4f46e5; }
                .icon-btn { background: #f8fafc; color: #64748b; border: none; width: 44px; height: 44px; border-radius: 14px; cursor: pointer; transition: 0.2s; }
                .icon-btn:hover { background: #f1f5f9; color: #1e293b; }

                .mode-selector-vertical { display: flex; flex-direction: column; gap: 12px; }
                .mode-selector-vertical button { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-radius: 20px; border: 1px solid #f1f5f9; background: white; font-weight: 700; color: #64748b; cursor: pointer; transition: all 0.2s; }
                .mode-selector-vertical button:hover { border-color: #cbd5e1; background: #f8fafc; }
                .mode-selector-vertical button.active { background: #1e293b; color: white; border-color: #1e293b; }

                .motivation-card { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 24px; padding: 24px; display: flex; gap: 20px; align-items: center; }
                .mot-content h4 { margin: 0 0 4px 0; color: #92400e; font-size: 1rem; }
                .mot-content p { margin: 0; color: #b45309; font-style: italic; font-size: 0.95rem; }

                /* STATS SECTION */
                .stats-panel { display: flex; flex-direction: column; gap: 24px; }
                .goal-card-premium { background: white; border-radius: 32px; padding: 32px; border: 1px solid #f1f5f9; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); }
                .goal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .goal-header h3 { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; font-weight: 800; }
                .edit-link { font-size: 0.85rem; font-weight: 700; color: #4f46e5; background: none; border: none; cursor: pointer; }
                .goal-edit { display: flex; gap: 8px; }
                .goal-edit input { width: 60px; padding: 4px 8px; border-radius: 8px; border: 1px solid #e2e8f0; font-weight: 700; }
                .goal-stats { display: flex; align-items: baseline; gap: 12px; margin-bottom: 20px; }
                .big-val { font-size: 3.5rem; font-weight: 900; color: #1e293b; line-height: 1; }
                .stat-separator { font-size: 2rem; color: #cbd5e1; }
                .sub-val { font-size: 1.5rem; font-weight: 700; color: #94a3b8; }
                .label { display: block; font-size: 0.8rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
                
                .progress-track-premium { height: 12px; background: #f1f5f9; border-radius: 99px; overflow: hidden; margin-bottom: 12px; }
                .track-fill { height: 100%; background: linear-gradient(90deg, #4f46e5 0%, #818cf8 100%); border-radius: 99px; transition: width 0.5s ease; }
                .status-text { font-size: 0.9rem; color: #64748b; font-weight: 600; }

                .breakdown-card-premium { background: white; border-radius: 28px; padding: 28px; border: 1px solid #f1f5f9; }
                .breakdown-card-premium h3 { font-size: 1rem; font-weight: 800; margin-bottom: 20px; }
                .dist-list { display: flex; flex-direction: column; gap: 16px; }
                .dist-info { display: flex; justify-content: space-between; font-weight: 700; font-size: 0.9rem; margin-bottom: 8px; }
                .dist-bar { height: 6px; background: #f8fafc; border-radius: 99px; overflow: hidden; }
                .dist-fill { height: 100%; border-radius: 99px; }
                .dist-fill.physics { background: #6366f1; }
                .dist-fill.chemistry { background: #10b981; }
                .dist-fill.biology { background: #f59e0b; }

                .mode-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
                .mode-box { background: #f8fafc; padding: 16px; border-radius: 20px; text-align: center; }
                .m-val { display: block; font-size: 1.1rem; font-weight: 800; color: #1e293b; }
                .m-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }

                /* MODAL */
                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .logging-modal { background: white; padding: 40px; border-radius: 32px; width: 450px; box-shadow: 0 30px 60px -15px rgba(0,0,0,0.3); }
                .logging-modal h2 { font-size: 2rem; font-weight: 900; margin-bottom: 8px; }
                .form-group { margin-top: 24px; }
                .form-group label { display: block; font-size: 0.9rem; font-weight: 700; margin-bottom: 12px; }
                .form-group input { width: 100%; padding: 16px; border-radius: 16px; border: 2px solid #f1f5f9; outline: none; font-size: 1rem; }
                .diff-row { display: flex; gap: 12px; }
                .diff-btn { flex: 1; padding: 14px; border-radius: 14px; border: 2px solid #f1f5f9; background: white; font-weight: 800; cursor: pointer; transition: 0.2s; }
                .diff-btn.easy { background: #dcfce7; color: #166534; border-color: #86efac; }
                .diff-btn.medium { background: #fef9c3; color: #854d0e; border-color: #fde047; }
                .diff-btn.hard { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
                .save-session-btn { width: 100%; padding: 18px; border-radius: 20px; background: #4f46e5; color: white; border: none; font-weight: 800; font-size: 1.1rem; margin-top: 32px; cursor: pointer; box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.4); }

                @media (max-width: 1000px) {
                    .grid-layout { grid-template-columns: 1fr; }
                    .timer-main-area { flex-direction: column; }
                    .mode-selector-vertical { flex-direction: row; flex-wrap: wrap; }
                }
            `}</style>
        </AppShell>
    );
}
