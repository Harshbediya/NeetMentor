"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import AppShell from "@/components/AppShell";
import {
    Play, Pause, RotateCcw,
    BookOpen, Zap, GraduationCap,
    Clock, Edit3, Check, Target, Trophy, Flame, Coffee,
    TrendingUp, Award, CheckCircle2, Timer as TimerIcon, X, Trash2,
    FlaskConical, Dna, ChevronRight
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
    } = useTimer();

    const [mounted, setMounted] = useState(false);
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [customInput, setCustomInput] = useState("25");
    const [goalInput, setGoalInput] = useState("6");
    const [showLoggingModal, setShowLoggingModal] = useState(false);
    const [saveStatus, setSaveStatus] = useState({ error: null, success: false });
    const [sessionDetails, setSessionDetails] = useState({ topic: "", difficulty: "Medium" });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showHistory, setShowHistory] = useState(false);
    const [historyDate, setHistoryDate] = useState('');

    // --- NEW: History State ---
    const [viewDate, setViewDate] = useState(() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });

    const modalTriggerRef = useRef(null);

    // Calculate stats dynamic based on viewDate
    // Calculate stats dynamic based on viewDate
    const displayedStats = useMemo(() => {
        // Filter sessions by date (robust against ISO/Local mismatch)
        const targetLogs = recentSessions.filter(s => {
            const d = s.date || s.created_at;
            if (!d) return false;
            if (d.includes('T')) {
                const dateObj = new Date(d);
                const y = dateObj.getFullYear();
                const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}` === viewDate;
            }
            return d === viewDate;
        });

        // Sum total seconds
        const totalSecs = targetLogs.reduce((acc, s) => acc + (s.duration || s.minutes * 60), 0);

        // Subject breakdown
        const bySub = {};
        targetLogs.forEach(s => {
            const sub = s.subject || 'Other';
            if (!bySub[sub]) bySub[sub] = 0;
            bySub[sub] += (s.duration || s.minutes * 60);
        });

        return { todaySeconds: totalSecs, bySubject: bySub };
    }, [viewDate, recentSessions]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setMounted(true);
        setGoalInput((dailyGoal / 3600).toString());
    }, [dailyGoal]);

    // Update ref when isBreakTime changes
    useEffect(() => {
        modalTriggerRef.current = (duration) => {
            console.log("TimerPage: trigger modal with duration", duration);
            if (!isBreakTime) {
                // Defer ALL state updates to avoid updating during render or inside a state updater
                setTimeout(() => {
                    setSessionDetails(prev => ({ ...prev, duration: duration }));
                    setShowLoggingModal(true);
                }, 0);
            }
        };
    }, [isBreakTime]);



    // Register callback with context once
    useEffect(() => {
        setOnTimerComplete(() => (duration) => {
            console.log("TimerPage: onTimerComplete received", duration);
            if (modalTriggerRef.current) {
                modalTriggerRef.current(duration);
            }
        });
    }, [setOnTimerComplete]);

    const toggleTimer = () => {
        if (!isActive && !selectedSubject && !isBreakTime) {
            setSelectedSubject("Physics"); // Default to Physics if none selected to allow starting
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

    const formatTimeCompact = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const onSave = async () => {
        setSaveStatus({ error: null, success: false });
        try {
            console.log("=== SAVE BUTTON CLICKED ===");

            // Validate topic
            if (!sessionDetails.topic || sessionDetails.topic.trim() === "") {
                setSaveStatus({ error: "Please enter what you studied.", success: false });
                return;
            }

            // Validate subject
            if (!selectedSubject) {
                setSaveStatus({ error: "Please select a subject first.", success: false });
                return;
            }

            console.log("Validation passed. Calling saveSession...");
            const success = await saveSession(sessionDetails);

            if (success) {
                setSaveStatus({ error: null, success: true });
                // Briefly show success state then close
                setTimeout(() => {
                    setShowLoggingModal(false);
                    setSaveStatus({ error: null, success: false });
                    setSessionDetails({ topic: "", difficulty: "Medium" });
                }, 1000);
            } else {
                setSaveStatus({ error: "Error saving session. Check your connection.", success: false });
            }
        } catch (error) {
            console.error("Error in onSave:", error);
            setSaveStatus({ error: "Something went wrong: " + error.message, success: false });
        }
    };

    const handleDeleteSession = async (id) => {
        if (window.confirm("Are you sure you want to delete this session? This will update your stats.")) {
            const success = await deleteSession(id);
            if (success) {
                // Success is handled by real-time listener updates
            } else {
                alert("Failed to delete session. Please try again.");
            }
        }
    };

    if (!mounted) return null;

    const progressPercentage = Math.min((realStats.todaySeconds / dailyGoal) * 100, 100);
    const sessionProgress = initialTime > 0 ? ((initialTime - seconds) / initialTime) : 0;
    const elapsedSeconds = initialTime - seconds;

    // Circular Progress Math
    const radius = mounted && typeof window !== 'undefined' && window.innerWidth < 480 ? 90 : (mounted && window.innerWidth < 768 ? 110 : 130);
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (sessionProgress * circumference);

    return (
        <AppShell>
            <div className="hub-container">
                {/* PREMIUM HEADER */}
                <header className="premium-header">
                    <div className="header-top">
                        <div className="brand-section">
                            <div className="header-badge">
                                <Clock size={14} />
                                {isBreakTime ? "BREAK MODE" : "FOCUS MODE"}
                            </div>
                            <h1 className="main-title">
                                {isBreakTime ? "🌟 Recharge Time" : "🎯 Deep Focus Session"}
                            </h1>
                            <p className="subtitle">
                                {isBreakTime
                                    ? "Great work! Rest well to maintain peak performance."
                                    : "Every focused minute brings you closer to your NEET dream."}
                            </p>
                        </div>

                        {/* Achievement Badges */}
                        <div className="achievement-row">
                            {studyStreak > 0 && (
                                <div className="achievement-badge streak-badge">
                                    <Flame size={20} />
                                    <div className="badge-content">
                                        <span className="badge-value">{studyStreak}</span>
                                        <span className="badge-label">Day Streak</span>
                                    </div>
                                </div>
                            )}
                            {pomodoroCount > 0 && (
                                <div className="achievement-badge pomo-badge">
                                    <Trophy size={20} />
                                    <div className="badge-content">
                                        <span className="badge-value">{pomodoroCount}</span>
                                        <span className="badge-label">Pomodoros</span>
                                    </div>
                                </div>
                            )}
                            <div className="achievement-badge time-badge">
                                <TimerIcon size={20} />
                                <div className="badge-content">
                                    <span className="badge-value">{formatTimeCompact(realStats.todaySeconds)}</span>
                                    <span className="badge-label">Today</span>
                                </div>
                            </div>

                            {/* Real-time Clock */}
                            <div className="achievement-badge clock-badge">
                                <Clock size={20} />
                                <div className="badge-content">
                                    <span className="badge-value">
                                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                    <span className="badge-label">Current Time</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="main-grid">
                    {/* LEFT: TIMER SECTION */}
                    <div className="timer-section">
                        {!isBreakTime && (
                            <div className="subject-selector-card">
                                <h3 className="card-title">
                                    <BookOpen size={18} />
                                    Select Subject
                                </h3>
                                <div className="subject-grid">
                                    {[
                                        { name: "Physics", icon: <Zap size={22} />, color: "physics" },
                                        { name: "Chemistry", icon: <FlaskConical size={22} />, color: "chemistry" },
                                        { name: "Biology", icon: <Dna size={22} />, color: "biology" }
                                    ].map(sub => (
                                        <button
                                            key={sub.name}
                                            className={`subject-btn ${selectedSubject === sub.name ? "selected" : ""}`}
                                            data-subject={sub.name}
                                            onClick={() => !isActive && setSelectedSubject(sub.name)}
                                            disabled={isActive}
                                        >
                                            <span className="subject-icon">{sub.icon}</span>
                                            <span className="subject-name">{sub.name}</span>
                                            {selectedSubject === sub.name && <CheckCircle2 size={16} className="check-icon" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* MAIN TIMER DISPLAY */}
                        <div className="timer-display-card">
                            <div className="timer-visual">
                                <svg className="progress-ring" width="340" height="340">
                                    {/* Background Circle */}
                                    <circle
                                        className="ring-bg"
                                        cx="170"
                                        cy="170"
                                        r={radius}
                                        fill="none"
                                        stroke="#f1f5f9"
                                        strokeWidth="16"
                                    />
                                    {/* Progress Circle */}
                                    <circle
                                        className={`ring-progress ${isBreakTime ? 'break-ring' : 'focus-ring'}`}
                                        cx="170"
                                        cy="170"
                                        r={radius}
                                        fill="none"
                                        strokeWidth="16"
                                        strokeLinecap="round"
                                        style={{
                                            strokeDasharray: circumference,
                                            strokeDashoffset: strokeDashoffset,
                                            transform: 'rotate(-90deg)',
                                            transformOrigin: '50% 50%',
                                            transition: isActive ? "stroke-dashoffset 1s linear" : "stroke-dashoffset 0.3s ease"
                                        }}
                                    />
                                </svg>

                                <div className="timer-center">
                                    <div className="mode-indicator">
                                        {isBreakTime ? (
                                            <><Coffee size={16} /> {breakType === 'long' ? 'Long Break' : 'Short Break'}</>
                                        ) : (
                                            <>{mode}</>
                                        )}
                                    </div>

                                    {isEditingTime && !isBreakTime ? (
                                        <div className="time-editor">
                                            <input
                                                type="number"
                                                value={customInput}
                                                onChange={(e) => setCustomInput(e.target.value)}
                                                autoFocus
                                                className="time-input"
                                            />
                                            <button onClick={handleCustomTimeSubmit} className="confirm-btn">
                                                <Check size={24} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            className="time-display"
                                            onClick={() => !isActive && !isBreakTime && setIsEditingTime(true)}
                                        >
                                            {formatTime(seconds)}
                                            {!isActive && !isBreakTime && <Edit3 size={20} className="edit-hint" />}
                                        </div>
                                    )}

                                    {/* Elapsed Time Display */}
                                    {isActive && !isBreakTime && elapsedSeconds > 0 && (
                                        <div className="elapsed-info">
                                            <Award size={14} />
                                            <span>{formatTimeCompact(elapsedSeconds)} completed</span>
                                        </div>
                                    )}

                                    {/* Progress Percentage */}
                                    {isActive && (
                                        <div className="session-progress">
                                            {Math.round(sessionProgress * 100)}% Complete
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CONTROLS */}
                            <div className="timer-controls">
                                <button className="control-btn secondary" onClick={resetTimer} title="Reset">
                                    <RotateCcw size={22} />
                                </button>
                                <button
                                    className={`control-btn primary ${isActive ? 'active' : ''}`}
                                    onClick={toggleTimer}
                                >
                                    {isActive ? (
                                        <><Pause size={32} fill="currentColor" /> Pause</>
                                    ) : (
                                        <><Play size={32} fill="currentColor" style={{ marginLeft: 4 }} /> Start</>
                                    )}
                                </button>
                                {isActive && !isBreakTime && (
                                    <button
                                        className="finish-early-btn"
                                        onClick={() => {
                                            setIsActive(false);
                                            if (modalTriggerRef.current) {
                                                modalTriggerRef.current(elapsedSeconds);
                                            }
                                        }}
                                        title="Finish & Log Now"
                                    >
                                        <CheckCircle2 size={24} />
                                        Log Early
                                    </button>
                                )}
                            </div>

                            {/* MODE SELECTOR */}
                            {!isBreakTime && (
                                <div className="mode-selector">
                                    <button
                                        className={`mode-btn ${mode === "Pomodoro" ? "active" : ""}`}
                                        onClick={() => switchMode("Pomodoro", 25)}
                                        disabled={isActive}
                                    >
                                        <Zap size={18} />
                                        <div>
                                            <div className="mode-name">Pomodoro</div>
                                            <div className="mode-time">25 min</div>
                                        </div>
                                    </button>
                                    <button
                                        className={`mode-btn ${mode === "Deep Work" ? "active" : ""}`}
                                        onClick={() => switchMode("Deep Work", 50)}
                                        disabled={isActive}
                                    >
                                        <BookOpen size={18} />
                                        <div>
                                            <div className="mode-name">Deep Work</div>
                                            <div className="mode-time">50 min</div>
                                        </div>
                                    </button>
                                    <button
                                        className={`mode-btn ${mode === "Mock Test" ? "active" : ""}`}
                                        onClick={() => switchMode("Mock Test", 180)}
                                        disabled={isActive}
                                    >
                                        <GraduationCap size={18} />
                                        <div>
                                            <div className="mode-name">Mock Test</div>
                                            <div className="mode-time">3 hours</div>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {isBreakTime && (
                                <button
                                    className="skip-break-btn"
                                    onClick={() => {
                                        setIsActive(false);
                                        setSeconds(25 * 60);
                                        setInitialTime(25 * 60);
                                        setMode("Pomodoro");
                                    }}
                                >
                                    Skip Break & Continue Studying
                                </button>
                            )}
                        </div>

                        {/* MOTIVATION CARD */}
                        {!isBreakTime && selectedSubject && (
                            <div className="motivation-card">
                                <div className="motivation-icon">💪</div>
                                <div className="motivation-text">
                                    <h4>Focusing on {selectedSubject}</h4>
                                    <p>"Success is the sum of small efforts, repeated day in and day out."</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="stats-section">
                        {/* DAILY GOAL CARD */}
                        <div className="stat-card goal-card">
                            <div className="card-header" style={{ alignItems: 'flex-start' }}>
                                <div>
                                    <h3><Target size={20} /> {(() => {
                                        const d = new Date();
                                        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                        return viewDate === today ? "Daily Goal" : "History View";
                                    })()}</h3>
                                    <input
                                        type="date"
                                        value={viewDate}
                                        max={(() => {
                                            const d = new Date();
                                            const year = d.getFullYear();
                                            const month = String(d.getMonth() + 1).padStart(2, '0');
                                            const day = String(d.getDate()).padStart(2, '0');
                                            return `${year}-${month}-${day}`;
                                        })()}
                                        onChange={(e) => setViewDate(e.target.value)}
                                        className="history-date-picker"
                                        style={{
                                            marginTop: '4px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '6px',
                                            padding: '4px 8px',
                                            fontSize: '0.85rem',
                                            color: '#64748b',
                                            background: '#f8fafc',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                </div>
                                {isEditingGoal && (() => {
                                    const d = new Date();
                                    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                    return viewDate === today;
                                })() ? (
                                    <div className="inline-edit">
                                        <input
                                            type="number"
                                            value={goalInput}
                                            onChange={e => setGoalInput(e.target.value)}
                                            className="goal-input"
                                        />
                                        <button onClick={handleGoalSubmit} className="ok-btn">✓</button>
                                    </div>
                                ) : (
                                    viewDate === new Date().toISOString().split('T')[0] && (
                                        <button className="edit-btn" onClick={() => setIsEditingGoal(true)}>
                                            <Edit3 size={14} /> Edit
                                        </button>
                                    )
                                )}
                            </div>

                            <div className="goal-display">
                                <div className="current-progress">
                                    <span className="big-number">{(displayedStats.todaySeconds / 3600).toFixed(1)}</span>
                                    <span className="unit">hours</span>
                                </div>
                                <div className="divider">/</div>
                                <div className="target-value">
                                    <span className="target-number">{(dailyGoal / 3600).toFixed(1)}</span>
                                    <span className="unit">goal</span>
                                </div>
                            </div>

                            <div className="progress-bar-container">
                                <div className="progress-bar" style={{ width: `${Math.min((displayedStats.todaySeconds / dailyGoal) * 100, 100)}%` }}></div>
                            </div>

                            <div className="goal-status">
                                {displayedStats.todaySeconds >= dailyGoal ? (
                                    <span className="status-success">🏆 Goal Achieved!</span>
                                ) : (
                                    <span className="status-pending">
                                        {formatTimeCompact(Math.max(0, dailyGoal - displayedStats.todaySeconds))} remaining
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* SUBJECT BREAKDOWN */}
                        <div className="stat-card">
                            <h3 className="card-title">
                                <TrendingUp size={18} />
                                Subject Distribution
                            </h3>
                            <div className="subject-stats">
                                {Object.keys(displayedStats.bySubject).length === 0 ? (
                                    <div className="no-data-msg">No study data for this date.</div>
                                ) : Object.entries(displayedStats.bySubject).map(([sub, secs]) => {
                                    const percentage = displayedStats.todaySeconds > 0 ? (secs / displayedStats.todaySeconds) * 100 : 0;
                                    return (
                                        <div key={sub} className="subject-stat-item">
                                            <div className="stat-header">
                                                <span className="stat-subject">{sub}</span>
                                                <span className="stat-value">{formatTimeCompact(secs)}</span>
                                            </div>
                                            <div className="stat-bar-container">
                                                <div
                                                    className={`stat-bar ${sub.toLowerCase()}`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* RECENT SESSIONS LIST (FILTERED BY DATE) */}
                        <div className="stat-card recent-card">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <Award size={18} />
                                    Sessions ({viewDate === new Date().toISOString().split('T')[0] ? "Today" : viewDate})
                                </h3>
                            </div>
                            <div className="recent-sessions-list">
                                {recentSessions.filter(s => {
                                    const d = s.date || s.created_at;
                                    if (!d) return false;
                                    if (d.includes('T')) {
                                        const dateObj = new Date(d);
                                        const y = dateObj.getFullYear();
                                        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                                        const day = String(dateObj.getDate()).padStart(2, '0');
                                        return `${y}-${m}-${day}` === viewDate;
                                    }
                                    return d === viewDate;
                                }).length > 0 ? (
                                    recentSessions
                                        .filter(s => {
                                            const d = s.date || s.created_at;
                                            if (!d) return false;
                                            if (d.includes('T')) {
                                                const dateObj = new Date(d);
                                                const y = dateObj.getFullYear();
                                                const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                                                const day = String(dateObj.getDate()).padStart(2, '0');
                                                return `${y}-${m}-${day}` === viewDate;
                                            }
                                            return d === viewDate;
                                        })
                                        .sort((a, b) => b.id - a.id) // Sort new to old
                                        .map((session) => (
                                            <div key={session.id} className="recent-session-item">
                                                <div className="recent-session-main">
                                                    <div className={`session-badge ${(session.subject || 'Physics').toLowerCase()}`}>
                                                        {(session.subject || 'P')[0]}
                                                    </div>
                                                    <div className="session-info">
                                                        <div className="session-topic">{session.topic || "Self Study"}</div>
                                                        <div className="session-meta">
                                                            {session.subject} • {formatTimeCompact(session.duration || (session.minutes * 60))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    className="delete-session-btn"
                                                    onClick={() => handleDeleteSession(session.id)}
                                                    title="Delete Session"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))
                                ) : (
                                    <div className="empty-recent">
                                        <div className="empty-recent-icon"><TimerIcon size={24} /></div>
                                        <p>No sessions logged for {viewDate}.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* LOGGING MODAL */}
                {showLoggingModal && (
                    <div className="modal-backdrop">
                        <div className="session-modal">
                            <button
                                className="modal-close-btn"
                                onClick={() => setShowLoggingModal(false)}
                                title="Close"
                            >
                                <X size={24} />
                            </button>

                            <div className="modal-header">
                                <div className="success-icon">🎉</div>
                                <h2>Session Complete!</h2>
                                <p>Excellent focus! Log this session to track your progress.</p>
                            </div>

                            <div className="modal-body">
                                <div className="form-field">
                                    <label>What did you study?</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Organic Chemistry - Reactions"
                                        value={sessionDetails.topic}
                                        onChange={e => setSessionDetails({ ...sessionDetails, topic: e.target.value })}
                                        className="topic-input"
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Difficulty Level</label>
                                    <div className="difficulty-buttons">
                                        {["Easy", "Medium", "Hard"].map(d => (
                                            <button
                                                key={d}
                                                className={`difficulty-btn ${sessionDetails.difficulty === d ? d.toLowerCase() : ""}`}
                                                onClick={() => setSessionDetails({ ...sessionDetails, difficulty: d })}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {saveStatus.error && (
                                <div className="save-error-msg">{saveStatus.error}</div>
                            )}
                            {saveStatus.success && (
                                <div className="save-success-msg">Session Saved! 🎉</div>
                            )}

                            <button
                                type="button"
                                className={`save-btn ${saveStatus.success ? 'success' : ''}`}
                                onClick={onSave}
                                disabled={saveStatus.success}
                            >
                                {saveStatus.success ? "Done!" : "Save Session & Continue"}
                            </button>
                        </div>
                    </div>
                )}

                {/* HISTORY MODAL */}
                {showHistory && (
                    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
                        <div className="session-modal" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                            <div className="modal-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flex: '0 0 auto' }}>
                                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Study History</h2>
                                <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={24} color="#64748b" />
                                </button>
                            </div>

                            <div className="history-filters" style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', flex: '0 0 auto' }}>
                                <div className="input-group">
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block' }}>Filter by Date</label>
                                    <input
                                        type="date"
                                        value={historyDate}
                                        onChange={(e) => setHistoryDate(e.target.value)}
                                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontFamily: 'inherit' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'end' }}>
                                    <button
                                        onClick={() => setHistoryDate('')}
                                        style={{ padding: '8px 12px', borderRadius: '8px', background: '#f1f5f9', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <div className="history-list" style={{ overflowY: 'auto', flex: '1 1 auto', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {(() => {
                                    const filtered = historyDate
                                        ? recentSessions.filter(s => (s.date || new Date().toISOString().split('T')[0]) === historyDate)
                                        : recentSessions;

                                    if (filtered.length === 0) return (
                                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                            <p>No logs found for this period.</p>
                                        </div>
                                    );

                                    // Calc stats
                                    const totalTime = filtered.reduce((acc, curr) => acc + (curr.duration || (curr.minutes * 60)), 0);

                                    return (
                                        <>
                                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                                                <div><span style={{ color: '#64748b', fontSize: '0.8rem' }}>Sessions</span><br /><b>{filtered.length}</b></div>
                                                <div><span style={{ color: '#64748b', fontSize: '0.8rem' }}>Total Time</span><br /><b>{formatTimeCompact(totalTime)}</b></div>
                                            </div>

                                            {filtered.map(session => (
                                                <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                                            {(session.subject || 'G')[0]}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{session.topic || "Self Study"}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                                {session.subject} • {new Date(session.date || session.created_at || Date.now()).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <span style={{ fontWeight: 700, color: '#4f46e5' }}>{formatTimeCompact(session.duration || (session.minutes * 60))}</span>
                                                        <button
                                                            onClick={() => handleDeleteSession(session.id)}
                                                            className="delete-session-btn"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .hub-container { 
                    max-width: 1400px; 
                    margin: 0 auto; 
                    padding: 2rem 1.5rem; 
                    background: var(--color-background);
                    min-height: 100vh;
                    box-sizing: border-box;
                }

                /* PREMIUM HEADER */
                .premium-header { 
                    margin-bottom: 2.5rem; 
                    background: var(--color-surface);
                    padding: 40px;
                    border-radius: 32px;
                    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--color-border);
                }
                .header-top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 24px; }
                .brand-section { flex: 1; min-width: 300px; }
                .header-badge { 
                    display: inline-flex; 
                    align-items: center; 
                    gap: 8px; 
                    background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
                    color: #4f46e5; 
                    padding: 8px 20px; 
                    border-radius: 100px; 
                    font-size: 0.75rem; 
                    font-weight: 950; 
                    letter-spacing: 1px;
                    margin-bottom: 1rem;
                    text-transform: uppercase;
                    border: 1px solid rgba(79, 70, 229, 0.1);
                }
                .main-title { 
                    font-size: 3rem; 
                    font-weight: 900; 
                    line-height: 1.1; 
                    margin-bottom: 12px; 
                    background: linear-gradient(135deg, var(--color-text-main) 0%, #4f46e5 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .subtitle { 
                    font-size: 1.1rem; 
                    color: #64748b; 
                    line-height: 1.6;
                    font-weight: 500;
                    margin-top: 8px;
                }

                /* ACHIEVEMENT BADGES */
                .achievement-row { display: flex; gap: 16px; flex-wrap: wrap; }
                .achievement-badge { 
                    display: flex; 
                    align-items: center; 
                    gap: 12px; 
                    padding: 16px 24px; 
                    border-radius: 20px; 
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    box-shadow: var(--shadow-sm);
                }
                .achievement-badge svg { flex-shrink: 0; }
                .streak-badge { border-color: #fef3c7; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); }
                .streak-badge svg { color: #f59e0b; }
                .pomo-badge { border-color: #d1fae5; background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); }
                .pomo-badge svg { color: #10b981; }
                .time-badge { border-color: #ddd6fe; background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); }
                .time-badge svg { color: #8b5cf6; }
                .clock-badge { border-color: #e0f2fe; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); }
                .clock-badge svg { color: #0ea5e9; }
                .badge-content { display: flex; flex-direction: column; line-height: 1.2; }
                .badge-value { font-size: 1.5rem; font-weight: 900; color: var(--color-text-main); }
                .badge-label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }

                /* MAIN GRID */
                .main-grid { 
                    display: grid; 
                    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr); 
                    gap: 2.5rem; 
                    align-items: start;
                }

                /* TIMER SECTION */
                .timer-section { display: flex; flex-direction: column; gap: 3rem; }
                /* RECENT SESSIONS EMPTY */
                .empty-recent {
                    padding: 3rem 1rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 1rem;
                    opacity: 0.8;
                }
                .empty-recent-icon {
                    width: 60px;
                    height: 60px;
                    background: #f1f5f9;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-light);
                    margin-bottom: 0.5rem;
                    animation: float 3s ease-in-out infinite;
                }
                @keyframes float { 0% { transform: translateY(0); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0); } }
                .empty-recent p { font-size: 0.9rem; font-weight: 600; color: var(--text-muted); }
                
                .subject-selector-card {
                    background: var(--color-surface);
                    padding: 32px;
                    border-radius: 28px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
                    border: 1px solid var(--color-border);
                }
                .card-title { 
                    display: flex; 
                    align-items: center; 
                    gap: 10px; 
                    font-size: 1.1rem; 
                    font-weight: 800; 
                    margin-bottom: 20px;
                    color: var(--color-text-main);
                }
                .subject-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
                .subject-btn {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    padding: 24px 12px;
                    border-radius: 24px;
                    border: 1px solid var(--color-border);
                    background: var(--color-surface);
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    font-weight: 800;
                    color: var(--text-muted);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                    min-width: 0;
                }
                .subject-btn:hover:not(:disabled) { 
                    transform: translateY(-5px);
                    box-shadow: 0 15px 30px rgba(0,0,0,0.08);
                    border-color: var(--primary-glow);
                }
                .subject-btn.selected { 
                    color: white; 
                    border: none;
                    transform: scale(1.02);
                }
                .subject-btn[data-subject="Physics"].selected { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); box-shadow: 0 15px 35px rgba(59, 130, 246, 0.3); }
                .subject-btn[data-subject="Chemistry"].selected { background: linear-gradient(135deg, #f97316 0%, #c2410c 100%); box-shadow: 0 15px 35px rgba(249, 115, 22, 0.3); }
                .subject-btn[data-subject="Biology"].selected { background: linear-gradient(135deg, #10b981 0%, #047857 100%); box-shadow: 0 15px 35px rgba(16, 185, 129, 0.3); }
                
                .subject-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                .subject-icon {
                    width: 54px;
                    height: 54px;
                    border-radius: 18px;
                    background: var(--color-background);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.75rem;
                    font-weight: 900;
                    transition: all 0.3s;
                }
                .subject-btn.selected .subject-icon { background: rgba(255,255,255,0.2); }
                .subject-name { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
                .check-icon { position: absolute; top: 12px; right: 12px; opacity: 0; transform: scale(0); transition: all 0.3s; }
                .subject-btn.selected .check-icon { opacity: 1; transform: scale(1); }

                /* TIMER DISPLAY */
                .timer-display-card {
                    background: var(--color-surface);
                    padding: 48px 40px;
                    border-radius: 32px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.08);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 32px;
                    border: 1px solid var(--color-border);
                }
                .timer-visual { position: relative; width: 340px; height: 340px; }
                .progress-ring { filter: drop-shadow(0 4px 12px rgba(0,0,0,0.08)); }
                .ring-progress.focus-ring { stroke: url(#focusGradient); }
                .ring-progress.break-ring { stroke: #10b981; }
                
                .timer-center {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .mode-indicator {
                    font-size: 0.85rem;
                    font-weight: 800;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .time-display {
                    font-size: 5rem;
                    font-weight: 900;
                    color: var(--color-text-main);
                    letter-spacing: -3px;
                    cursor: pointer;
                    position: relative;
                    line-height: 1;
                }
                .edit-hint {
                    position: absolute;
                    top: -8px;
                    right: -28px;
                    color: #cbd5e1;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .time-display:hover .edit-hint { opacity: 1; }
                
                .time-editor {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .time-input {
                    font-size: 3.5rem;
                    font-weight: 900;
                    width: 160px;
                    border: none;
                    border-bottom: 4px solid #4f46e5;
                    text-align: center;
                    outline: none;
                    background: transparent;
                }
                .confirm-btn {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: #10b981;
                    color: white;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .elapsed-info {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: #10b981;
                    background: var(--color-primary-light);
                    padding: 6px 16px;
                    border-radius: 100px;
                }
                .session-progress {
                    font-size: 0.85rem;
                    font-weight: 800;
                    color: #4f46e5;
                    background: var(--color-primary-light);
                    padding: 6px 16px;
                    border-radius: 100px;
                }

                /* CONTROLS */
                .timer-controls {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                .control-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    border: none;
                    border-radius: 24px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 1.1rem;
                }
                .control-btn.secondary {
                    width: 56px;
                    height: 56px;
                    background: #f8fafc;
                    color: #64748b;
                }
                .control-btn.secondary:hover {
                    background: #f1f5f9;
                    color: var(--color-text-main);
                    transform: scale(1.05);
                }
                .control-btn.primary {
                    padding: 18px 48px;
                    background: linear-gradient(135deg, var(--color-text-main) 0%, #334155 100%);
                    color: white;
                    box-shadow: 0 8px 24px rgba(30, 41, 59, 0.3);
                }
                .control-btn.primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 32px rgba(30, 41, 59, 0.4);
                }
                .control-btn.primary.active {
                    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
                    box-shadow: 0 8px 24px rgba(79, 70, 229, 0.4);
                }

                /* MODE SELECTOR */
                .mode-selector {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    width: 100%;
                }
                .mode-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 20px;
                    border-radius: 18px;
                    border: 2px solid var(--color-border);
                    background: var(--color-background);
                    cursor: pointer;
                    transition: all 0.2s;
                    font-weight: 700;
                }
                .mode-btn:hover:not(:disabled) {
                    border-color: #cbd5e1;
                    background: white;
                }
                .mode-btn.active {
                    background: var(--color-primary);
                    color: white;
                    border-color: var(--color-primary);
                }
                .mode-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .mode-name { font-size: 0.9rem; }
                .mode-time { font-size: 0.75rem; opacity: 0.7; }

                .skip-break-btn {
                    padding: 14px 28px;
                    background: #f1f5f9;
                    color: #64748b;
                    border: none;
                    border-radius: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .skip-break-btn:hover {
                    background: #e2e8f0;
                    color: var(--color-text-main);
                }

                /* MOTIVATION CARD */
                .motivation-card {
                    background: var(--color-warning-bg);
                    border: 2px solid var(--color-border);
                    border-radius: 24px;
                    padding: 24px 28px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                .motivation-icon { font-size: 2.5rem; }
                .motivation-text h4 {
                    margin: 0 0 6px 0;
                    color: var(--color-text-main);
                    font-size: 1.05rem;
                    font-weight: 800;
                }
                .motivation-text p {
                    margin: 0;
                    color: var(--color-text-muted);
                    font-style: italic;
                    font-size: 0.95rem;
                    line-height: 1.5;
                }

                /* STATS SECTION */
                .stats-section {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                .stat-card {
                    background: var(--color-surface);
                    padding: 32px;
                    border-radius: 28px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
                    border: 1px solid var(--color-border);
                }

                /* GOAL CARD */
                .goal-card { background: var(--color-surface); }
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }
                .card-header h3 {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 1.1rem;
                    font-weight: 800;
                    margin: 0;
                }
                .edit-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: #4f46e5;
                    background: none;
                    border: none;
                    cursor: pointer;
                }
                .inline-edit {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .goal-input {
                    width: 60px;
                    padding: 6px 10px;
                    border-radius: 10px;
                    border: 2px solid var(--color-border);
                    font-weight: 700;
                    text-align: center;
                }
                .ok-btn {
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    background: #10b981;
                    color: white;
                    border: none;
                    cursor: pointer;
                    font-weight: 900;
                }

                .goal-display {
                    display: flex;
                    align-items: baseline;
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .current-progress { display: flex; align-items: baseline; gap: 6px; }
                .big-number {
                    font-size: 4rem;
                    font-weight: 900;
                    color: var(--color-text-main);
                    line-height: 1;
                }
                .unit {
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                }
                .divider {
                    font-size: 2.5rem;
                    color: #cbd5e1;
                    font-weight: 300;
                }
                .target-value { display: flex; align-items: baseline; gap: 6px; }
                .target-number {
                    font-size: 2rem;
                    font-weight: 800;
                    color: #64748b;
                }

                .progress-bar-container {
                    height: 14px;
                    background: var(--color-border);
                    border-radius: 100px;
                    overflow: hidden;
                    margin-bottom: 16px;
                }
                .progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #4f46e5 0%, #818cf8 100%);
                    border-radius: 100px;
                    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .goal-status {
                    font-size: 0.95rem;
                    font-weight: 700;
                }
                .status-success { color: #10b981; }
                .status-pending { color: #64748b; }

                /* SUBJECT STATS */
                .subject-stats {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .subject-stat-item { }
                .stat-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
                .stat-subject {
                    font-weight: 800;
                    color: var(--color-text-main);
                    font-size: 0.95rem;
                }
                .stat-value {
                    font-weight: 800;
                    color: #64748b;
                    font-size: 0.9rem;
                }
                .stat-bar-container {
                    height: 8px;
                    background: var(--color-background);
                    border-radius: 100px;
                    overflow: hidden;
                }
                .stat-bar {
                    height: 100%;
                    border-radius: 100px;
                    transition: width 0.5s ease;
                }
                .stat-bar.physics { background: linear-gradient(90deg, #6366f1 0%, #818cf8 100%); }
                .stat-bar.chemistry { background: linear-gradient(90deg, #10b981 0%, #34d399 100%); }
                .stat-bar.biology { background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%); }

                /* MODE STATS */
                .mode-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                }
                .mode-stat-box {
                    background: var(--color-background);
                    padding: 20px 16px;
                    border-radius: 18px;
                    text-align: center;
                }
                .mode-stat-value {
                    font-size: 1.3rem;
                    font-weight: 900;
                    color: var(--color-text-main);
                    margin-bottom: 4px;
                }
                .mode-stat-label {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                }

                /* RECENT SESSIONS */
                .recent-card { max-height: 400px; overflow-y: auto; }
                .recent-sessions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    width: 100%;
                }
                .save-error-msg {
                    color: #ef4444;
                    background: #fee2e2;
                    padding: 10px 16px;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-bottom: 12px;
                    text-align: center;
                    animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                }
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
                .save-success-msg {
                    color: #10b981;
                    background: #d1fae5;
                    padding: 10px 16px;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-bottom: 12px;
                    text-align: center;
                }
                .save-btn.success {
                    background: #10b981 !important;
                    border-color: #10b981 !important;
                    pointer-events: none;
                }
                .finish-early-btn {
                    height: 56px;
                    padding: 0 20px;
                    border-radius: 18px;
                    border: 2px solid var(--color-border);
                    background: white;
                    color: #64748b;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.95rem;
                }
                .finish-early-btn:hover {
                    border-color: #3b82f6;
                    color: #3b82f6;
                    background: #f0f7ff;
                    transform: translateY(-2px);
                }
                .finish-early-btn:active {
                    transform: translateY(0);
                }
                .recent-session-item {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 14px;
                    background: var(--color-background);
                    border-radius: 16px;
                    transition: 0.2s;
                }
                .recent-session-item:hover {
                    background: var(--color-border);
                }
                .recent-session-main {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    flex: 1;
                    min-width: 0;
                }
                .planned-label {
                    color: #94a3b8;
                    font-weight: normal;
                }
                .delete-session-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    background: transparent;
                    color: #94a3b8;
                    cursor: pointer;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }
                .delete-session-btn:hover {
                    background: #fee2e2;
                    color: #ef4444;
                }
                .session-badge {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 900;
                    font-size: 1.1rem;
                    color: white;
                    flex-shrink: 0;
                }
                .session-badge.physics { background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); }
                .session-badge.chemistry { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); }
                .session-badge.biology { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); }
                .session-info { flex: 1; min-width: 0; }
                .session-topic {
                    font-weight: 800;
                    color: var(--color-text-main);
                    font-size: 0.9rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .session-meta {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    font-weight: 600;
                    margin-top: 2px;
                }

                /* MODAL */
                .modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.7);
                    backdrop-filter: blur(12px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.2s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .session-modal {
                    position: relative;
                    background: var(--color-surface);
                    padding: 48px 40px;
                    border-radius: 32px;
                    width: 500px;
                    max-width: 90vw;
                    box-shadow: 0 24px 64px rgba(0,0,0,0.3);
                    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid var(--color-border);
                }
                .modal-close-btn {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    background: var(--color-background);
                    border: 1px solid var(--color-border);
                    color: #64748b;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    z-index: 10;
                }
                .modal-close-btn:hover {
                    background: #f1f5f9;
                    color: var(--color-text-main);
                    transform: scale(1.05);
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .modal-header {
                    text-align: center;
                    margin-bottom: 32px;
                }
                .success-icon {
                    font-size: 4rem;
                    margin-bottom: 16px;
                }
                .modal-header h2 {
                    font-size: 2rem;
                    font-weight: 900;
                    margin-bottom: 8px;
                    color: var(--color-text-main);
                }
                .modal-header p {
                    color: #64748b;
                    font-size: 1rem;
                }
                .modal-body {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                .form-field label {
                    display: block;
                    font-weight: 800;
                    margin-bottom: 12px;
                    color: var(--color-text-main);
                    font-size: 0.95rem;
                }
                .topic-input {
                    width: 100%;
                    padding: 16px 20px;
                    border-radius: 16px;
                    border: 2px solid #f1f5f9;
                    font-size: 1rem;
                    outline: none;
                    transition: 0.2s;
                }
                .topic-input:focus {
                    border-color: #4f46e5;
                    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
                }
                .difficulty-buttons {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                }
                .difficulty-btn {
                    padding: 16px;
                    border-radius: 14px;
                    border: 2px solid #f1f5f9;
                    background: white;
                    font-weight: 800;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .difficulty-btn:hover {
                    border-color: #cbd5e1;
                }
                .difficulty-btn.easy {
                    background: #dcfce7;
                    color: #166534;
                    border-color: #86efac;
                }
                .difficulty-btn.medium {
                    background: #fef9c3;
                    color: #854d0e;
                    border-color: #fde047;
                }
                .difficulty-btn.hard {
                    background: #fee2e2;
                    color: #991b1b;
                    border-color: #fca5a5;
                }
                .save-btn {
                    width: 100%;
                    padding: 20px;
                    border-radius: 20px;
                    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
                    color: white;
                    border: none;
                    font-weight: 900;
                    font-size: 1.1rem;
                    margin-top: 16px;
                    cursor: pointer;
                    box-shadow: 0 12px 28px rgba(79, 70, 229, 0.4);
                    transition: 0.3s;
                }
                .save-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 16px 36px rgba(79, 70, 229, 0.5);
                }

                /* RESPONSIVE */
                @media (max-width: 1400px) {
                    .main-grid { gap: 1.5rem; }
                }
                @media (max-width: 1200px) {
                    .main-grid { grid-template-columns: 1fr; gap: 2rem; max-width: 800px; margin: 0 auto; }
                    .premium-header { padding: 30px; }
                    .main-title { font-size: 2.5rem; }
                }
                @media (max-width: 768px) {
                    .hub-container { padding: 1.25rem 0.75rem; }
                    .premium-header { 
                        padding: 32px 20px; 
                        border-radius: 24px; 
                        margin-bottom: 2.5rem; 
                        text-align: center;
                    }
                    .header-top { justify-content: center; flex-direction: column; align-items: center; gap: 16px; }
                    .brand-section { min-width: 0; text-align: center; }
                    .main-title { font-size: 2rem; }
                    .subtitle { font-size: 0.95rem; }
                    
                    .main-grid { gap: 2.5rem; }
                    .timer-section { gap: 2.5rem; }
                    .stats-section { gap: 2.5rem; }

                    .achievement-row { 
                        display: grid; 
                        grid-template-columns: repeat(2, 1fr); 
                        gap: 12px; 
                        width: 100%; 
                    }
                    .achievement-badge { 
                        padding: 14px 12px; 
                        border-radius: 18px; 
                        justify-content: center;
                        background: var(--color-surface);
                    }

                    .timer-visual { width: 280px !important; height: 280px !important; margin: 0 auto; }
                    .progress-ring { width: 280px !important; height: 280px !important; }
                    .progress-ring circle { cx: 140 !important; cy: 140 !important; r: 110 !important; }
                    .time-display { font-size: 3.5rem; }
                    
                    .subject-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
                    .subject-btn { padding: 18px 8px; border-radius: 20px; gap: 8px; }
                    .subject-icon { width: 44px; height: 44px; font-size: 1.25rem; border-radius: 12px; }
                    .subject-name { font-size: 0.75rem; }
                    
                    .timer-display-card { padding: 32px 20px; border-radius: 28px; }
                    .stat-card { padding: 24px 20px; border-radius: 24px; }
                    .mode-selector { grid-template-columns: 1fr; gap: 10px; }
                    .mode-btn { padding: 14px 18px; border-radius: 16px; }
                    .timer-controls { width: 100%; flex-direction: column; gap: 16px; }
                    .control-btn.primary { padding: 16px 36px; font-size: 1.1rem; width: 100%; }
                    .control-btn.secondary { width: 100%; height: 56px; border-radius: 20px; }
                    
                    .motivation-card { padding: 20px; gap: 16px; border-radius: 20px; }
                    .motivation-icon { font-size: 2rem; }
                }
                
                @media (max-width: 480px) {
                    .hub-container { padding: 1rem 0.5rem; }
                    .premium-header { padding: 24px 16px; margin-bottom: 2rem; }
                    .main-title { font-size: 1.6rem; letter-spacing: -1px; }
                    .timer-visual { width: 220px !important; height: 220px !important; }
                    .progress-ring { width: 220px !important; height: 220px !important; }
                    .progress-ring circle { cx: 110 !important; cy: 110 !important; r: 88 !important; }
                    .time-display { font-size: 2.8rem; }
                    .achievement-row { grid-template-columns: 1fr; }
                    .subject-name { display: block; font-size: 0.6rem; font-weight: 900; }
                    .subject-btn { padding: 12px 2px; }
                    .subject-icon { width: 36px; height: 36px; font-size: 1rem; border-radius: 10px; }
                    .subject-grid { gap: 4px; }
                    .mode-btn { padding: 10px 12px; }
                    .mode-name { font-size: 0.8rem; }
                    
                    .big-number { font-size: 2.5rem; }
                    .divider { font-size: 1.5rem; }
                    .target-number { font-size: 1.5rem; }
                    .stat-card { padding: 20px 16px; }
                    .motivation-card { padding: 16px; gap: 12px; }
                    .motivation-icon { font-size: 1.5rem; }
                    .motivation-text h4 { font-size: 0.9rem; }
                    .motivation-text p { font-size: 0.8rem; }
                }
            `}</style>

            <svg width="0" height="0">
                <defs>
                    <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                </defs>
            </svg>
        </AppShell>
    );
}