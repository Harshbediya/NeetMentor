"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { CheckCircle, Circle, AlertTriangle, Clock, FileQuestion, Plus, Trash2, Hash, Flame, Target, TrendingUp, BookOpen, Timer, ClipboardList, Star, Zap, Moon, Sun, X, RotateCcw, ChevronRight, Microscope, Atom } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useTimer } from "@/context/TimerContext";
import { saveProgress, loadProgress, saveUserDoc, getUserDoc, loadData } from "@/lib/progress";
import { SYLLABUS_DATA } from "@/lib/syllabus-data";
import api, { getCookie, removeCookie } from "@/lib/api";



const MOTIVATIONAL_QUOTES = [
    "Success is the sum of small efforts repeated day in and day out.",
    "The expert in anything was once a beginner.",
    "Don't watch the clock; do what it does. Keep going.",
    "Your only limit is you.",
    "Dream it. Believe it. Achieve it.",
    "Study hard now, party later.",
    "Every expert was once a beginner.",
    "Consistency is the key to success."
];

export default function DashboardPage() {
    const router = useRouter();
    const {
        realStats,
        seconds,
        initialTime,
        isActive,
        isBreakTime,
        dailyGoal
    } = useTimer();
    const [tasks, setTasks] = useState([]);
    const [mockTests, setMockTests] = useState([]);

    const [showSuggestions, setShowSuggestions] = useState(false);

    // Sync Tasks & Syllabus with Server
    useEffect(() => {
        const sync = async () => {
            const token = getCookie('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                // Parallel fetching for performance (Fixing API Waterfall)
                const [tasksRes, storageRes, testsRes, syllabusProgress] = await Promise.all([
                    api.get('/tasks/'),
                    loadProgress(),
                    api.get('/mock-tests/'),
                    loadData("syllabus", {})
                ]);

                // Set Tasks
                setTasks(tasksRes.data);

                // Set Progress/Streak
                if (storageRes && storageRes.streak) {
                    setStudyStreak(storageRes.streak.streak || 0);
                    setLastStreakDate(storageRes.streak.lastDate);
                }

                // Set Mock Tests
                setMockTests(testsRes.data);

                // Trigger suggestions (non-blocking)
                fetchSuggestions('Physics');

                // Process Syllabus Progress
                if (syllabusProgress) {
                    const stats = { Physics: 0, Chemistry: 0, Biology: 0 };
                    ['Physics', 'Chemistry', 'Biology'].forEach(subject => {
                        let total = 0;
                        let completed = 0;
                        SYLLABUS_DATA[subject].forEach(unit => {
                            unit.subTopics.forEach(topic => {
                                total++;
                                if (syllabusProgress[`${unit.id}-${topic}`]) {
                                    completed++;
                                }
                            });
                        });
                        stats[subject] = total > 0 ? Math.round((completed / total) * 100) : 0;
                    });
                    setSyllabusStats(stats);
                }
            } catch (err) {
                if (err.response?.status !== 401) {
                    console.error("Dashboard sync error", err);
                } else {
                    // Token might be expired, clear it
                    removeCookie('token');
                    router.push('/login');
                }
            }
        };
        sync();
    }, []);

    // We no longer use simple saveProgress for tasks, we use dedicated CRUD
    useEffect(() => {
        // Just for streak persistence if tasks changed locally (backward compatibility)
        if (tasks.length > 0) {
            saveProgress({ streak: { streak: studyStreak, lastDate: lastStreakDate } });
        }
    }, [tasks]);
    const [mounted, setMounted] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [newTask, setNewTask] = useState({ subject: 'Physics', topic: '', time: '', questions: '', priority: 'medium' });
    const [studyStreak, setStudyStreak] = useState(0);
    const [lastStreakDate, setLastStreakDate] = useState(null);
    const [motivationalQuote, setMotivationalQuote] = useState('');
    const [syllabusStats, setSyllabusStats] = useState({ Physics: 0, Chemistry: 0, Biology: 0 });
    const [taskHistory, setTaskHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedHistoryDate, setSelectedHistoryDate] = useState(new Date().toISOString().split('T')[0]);
    const [suggestedTopics, setSuggestedTopics] = useState([]);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
        // Sync theme with server/localStorage if needed, though ThemeContext already handles it
        const syncTheme = async () => {
            const user = auth.currentUser;
            if (user && theme) {
                saveUserDoc(["settings", "theme"], { theme });
            }
        };
        syncTheme();

        // Set a random motivational quote
        setMotivationalQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

        // Click outside to close suggestions
        const handleClickOutside = () => setShowSuggestions(false);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [theme]);


    const saveDashboardData = async (currentTasks) => {
        if (!mounted) return;

        const today = new Date().toLocaleDateString();
        const allDone = currentTasks.length > 0 && currentTasks.every(t => t.done);

        let newStreak = studyStreak;
        let newLastDate = lastStreakDate;

        if (allDone && lastStreakDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
            if (lastStreakDate === yesterday) {
                newStreak = (studyStreak || 0) + 1;
            } else {
                newStreak = 1;
            }
            newLastDate = today;
            setStudyStreak(newStreak);
            setLastStreakDate(newLastDate);
        }

        await saveProgress({
            tasks: currentTasks,
            streak: { streak: newStreak, lastDate: newLastDate || lastStreakDate }
        });
    };

    const toggleTask = async (id) => {
        const t = tasks.find(x => x.id === id);
        if (!t) return;

        try {
            const res = await api.patch(`/tasks/${id}/`, { is_done: !t.is_done });
            const updated = tasks.map(x => x.id === id ? res.data : x);
            setTasks(updated);
            await saveDashboardAnalytics(updated);
        } catch (e) {
            console.error("Failed to toggle task", e);
        }
    };

    const saveDashboardAnalytics = async (currentTasks) => {
        // Only updates streaks in UserStorage
        const today = new Date().toLocaleDateString();
        const allDone = currentTasks.length > 0 && currentTasks.every(t => t.is_done);

        let newStreak = studyStreak;
        let newLastDate = lastStreakDate;

        if (allDone && lastStreakDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
            if (lastStreakDate === yesterday) {
                newStreak = (studyStreak || 0) + 1;
            } else {
                newStreak = 1;
            }
            newLastDate = today;
            setStudyStreak(newStreak);
            setLastStreakDate(newLastDate);
            await saveProgress({ streak: { streak: newStreak, lastDate: newLastDate } });
        }
    };

    const getColor = (subject) => {
        switch (subject) {
            case 'Physics': return { bg: '#EFF6FF', text: '#3B82F6' }; // Blue
            case 'Chemistry': return { bg: '#FFF7ED', text: '#F97316' }; // Orange
            case 'Biology': return { bg: '#ECFDF5', text: '#10B981' }; // Emerald
            default: return { bg: '#F3F4F6', text: '#374151' };
        }
    };

    const fetchSuggestions = async (subject) => {
        try {
            const res = await api.get(`/topics/?subject=${subject}`);
            setSuggestedTopics(res.data);
        } catch (e) {
            if (e.response?.status !== 401) {
                console.error("Failed to fetch suggestions", e);
            }
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get('/task-history/');
            setTaskHistory(res.data);
            setShowHistory(true);
        } catch (e) {
            if (e.response?.status !== 401) {
                console.error("Failed to fetch history", e);
            }
        }
    };

    const changeHistoryDate = (days) => {
        const current = new Date(selectedHistoryDate);
        current.setDate(current.getDate() + days);
        setSelectedHistoryDate(current.toISOString().split('T')[0]);
    };

    const filteredHistory = taskHistory.filter(task => {
        const taskDate = new Date(task.created_at).toISOString().split('T')[0];
        return taskDate === selectedHistoryDate;
    });

    const addTask = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/tasks/', {
                subject: newTask.subject,
                topic: newTask.topic,
                time_goal: newTask.time,
                questions_goal: newTask.questions,
                priority: newTask.priority || 'medium',
                is_done: false
            });
            setTasks([res.data, ...tasks]);
            setNewTask({ subject: 'Physics', topic: '', time: '', questions: '', priority: 'medium' });
            setIsFormOpen(false);
        } catch (e) {
            if (e.response?.status === 401) {
                const token = typeof window !== 'undefined' ? getCookie('token') : null;
                removeCookie('token');
                router.push('/login');
            } else {
                console.error("Failed to add task", e);
                alert("Failed to add task. Please try again.");
            }
        }
    };

    const deleteTask = async (id) => {
        if (confirm('Remove this task?')) {
            try {
                await api.delete(`/tasks/${id}/`);
                setTasks(tasks.filter(t => t.id !== id));
            } catch (e) {
                console.error("Failed to delete task", e);
            }
        }
    };

    // Updated count logic
    const completedCount = tasks.filter(t => t.is_done).length;
    const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
    const allDone = tasks.length > 0 && completedCount === tasks.length;



    const getStudyTip = () => {
        if (!mounted) return "Loading tips...";

        // 1. Check for failed/low mock tests (Trend Analysis)
        const recentTests = [...mockTests].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3);
        const lowScoreTest = recentTests.find(t => (t.score / t.total_score) < 0.6);

        if (lowScoreTest) {
            return `Improve ${lowScoreTest.subject}: You scored low in your recent test. Re-study basic concepts before new mock.`;
        }

        // 2. Syllabus progress check
        const subjects = ['Physics', 'Chemistry', 'Biology'];
        const laggingSubject = subjects.find(s => syllabusStats[s] < 10);
        if (laggingSubject) {
            return `Lagging in ${laggingSubject}: You've covered less than 10% of the syllabus. Start with Chapter 1 today!`;
        }

        // 3. Task consistency check
        if (tasks.length > 0 && tasks.filter(t => !t.is_done).length > 3) {
            return "Backlog Alert: You have many pending tasks. Prioritize 'High' tasks first.";
        }

        // 4. Default fallback to subject specific tips
        if (getWeakestSubject() === 'Physics') return 'Try solving extra MCQs in Kinematics today.';
        if (getWeakestSubject() === 'Chemistry') return 'Review periodic table for 15 mins before Organic.';

        return 'Consistency is the key to success. You are doing great!';
    };

    const getSubjectStats = () => {
        const stats = {};
        tasks.forEach(task => {
            if (!stats[task.subject]) {
                stats[task.subject] = { total: 0, done: 0 };
            }
            stats[task.subject].total++;
            if (task.is_done) {
                stats[task.subject].done++;
            }
        });
        return stats;
    };

    const getStrongestSubject = () => {
        const stats = getSubjectStats();
        let strongest = 'Biology'; // Placeholder
        let maxScore = -1;

        ['Physics', 'Chemistry', 'Biology'].forEach(sub => {
            // Task points + syllabus points + mock test avg
            const taskDone = (stats[sub]?.done || 0) * 10;
            const syllabusDone = syllabusStats[sub] || 0;

            const relevantTests = mockTests.filter(t => t.subject === sub);
            const testAvg = relevantTests.length > 0
                ? (relevantTests.reduce((acc, t) => acc + (t.score / t.total_score), 0) / relevantTests.length) * 100
                : 0;

            const totalScore = taskDone + syllabusDone + testAvg;

            if (totalScore > maxScore) {
                maxScore = totalScore;
                strongest = sub;
            }
        });
        return strongest;
    };

    const getWeakestSubject = () => {
        const stats = getSubjectStats();
        let weakest = 'Physics';
        let minScore = Infinity;

        ['Physics', 'Chemistry', 'Biology'].forEach(sub => {
            const taskDone = (stats[sub]?.done || 0) * 10;
            const syllabusDone = syllabusStats[sub] || 0;

            const relevantTests = mockTests.filter(t => t.subject === sub);
            const testAvg = relevantTests.length > 0
                ? (relevantTests.reduce((acc, t) => acc + (t.score / t.total_score), 0) / relevantTests.length) * 100
                : 100; // If no tests, don't penalize too much as "weak"

            const totalScore = taskDone + syllabusDone + testAvg;

            if (totalScore < minScore) {
                minScore = totalScore;
                weakest = sub;
            }
        });
        return weakest;
    };

    if (!mounted) return null;

    // Right Panel Content
    const rightPanel = (
        <div className="right-panel-content">
            {/* Global Stats Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0 }}>Analytics</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>Real-time study insights</p>
                </div>
                <button
                    onClick={toggleTheme}
                    className="theme-toggle-desktop"
                    style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--color-primary)',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>
            <style jsx>{`
                @media (max-width: 1200px) {
                    .theme-toggle-desktop {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Study Streak Card */}
            <div className="card" style={{
                padding: '20px',
                marginBottom: '20px',
                background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
                color: 'white',
                border: 'none',
                boxShadow: '0 10px 20px -5px rgba(67, 56, 202, 0.4)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, color: 'white' }}>Consistency</h3>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem' }}>LIVE</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>{studyStreak}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.9 }}>Days</div>
                </div>
                <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: 0, color: 'white' }}>
                    {studyStreak === 0 ? 'Start your first task!' : 'Amazing streak! Keep it up!'}
                </p>
            </div>

            {/* Daily Goal Card */}
            <div className="card" style={{ padding: '20px', marginBottom: '20px', border: '1px solid var(--color-border)', position: 'relative' }}>
                {isActive && !isBreakTime && (
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: '#EEF2FF',
                        color: '#4F46E5',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: '1px solid #C7D2FE'
                    }}>
                        <div style={{ width: '6px', height: '6px', background: '#4F46E5', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
                        FOCUSING
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Target size={18} color="var(--color-primary)" />
                    </div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>Study Progress</h3>
                </div>

                {(() => {
                    const elapsedInActive = (isActive && !isBreakTime) ? (initialTime - seconds) : 0;
                    const totalTodaySeconds = (realStats?.todaySeconds || 0) + elapsedInActive;
                    const totalTodayMinutes = Math.floor(totalTodaySeconds / 60);
                    const goalMinutes = Math.floor(dailyGoal / 60);
                    const progressPercent = Math.min(100, Math.round((totalTodaySeconds / dailyGoal) * 100));

                    return (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                    {totalTodayMinutes} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Mins</span>
                                </span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', alignSelf: 'center' }}>
                                    Goal: {goalMinutes}m
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Daily target completion</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>{progressPercent}%</span>
                            </div>
                            <div style={{ width: '100%', height: '10px', background: 'var(--color-primary-light)', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${progressPercent}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, var(--color-primary) 0%, #818CF8 100%)',
                                    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}></div>
                            </div>
                        </>
                    );
                })()}
            </div>

            {/* Motivational Dose Card */}
            <div className="card" style={{ padding: '20px', marginBottom: '20px', background: 'var(--color-warning-bg)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Star size={18} color="#F59E0B" />
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>Motivational Dose</h3>
                </div>
                <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '8px', marginBottom: '12px', boxShadow: 'var(--shadow-sm)' }}>
                    <img src="/images/winning-year.jpg" alt="Winning Year" style={{ width: '100%', borderRadius: '8px' }} />
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>
                    "{motivationalQuote}"
                </p>
            </div>

            {/* Quick Link Card */}
            <div className="card" style={{ padding: '16px', background: 'var(--color-primary-light)', border: '1px solid #E0E7FF', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'white', padding: '10px', borderRadius: '10px' }}>
                        <Timer size={22} color="var(--color-primary)" />
                    </div>
                    <div>
                        <Link href="/timer" style={{ textDecoration: 'none' }}>
                            <h4 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 700 }}>Open Timer</h4>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Focus on your current task</p>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Performance Card */}
            <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text-main)' }}>Performance</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: 'var(--color-success-bg)', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--color-border)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', fontWeight: 600 }}>Strongest Info</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>{getStrongestSubject()}</span>
                    </div>
                    <div style={{ background: 'var(--color-warning-bg)', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--color-border)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', fontWeight: 600 }}>Needs Attention</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f97316' }}>{getWeakestSubject()}</span>
                    </div>
                </div>
            </div>

            {/* Study Mantra Card */}
            <div className="card" style={{ padding: '20px', background: 'var(--color-primary-light)', border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--color-primary)' }}>💡 Study Mantra</h3>
                <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '8px', marginBottom: '12px' }}>
                    <img src="/images/read-revise-repeat.jpg" alt="Mantra" style={{ width: '100%', borderRadius: '8px' }} />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', margin: 0 }}>
                    Take a 10-minute break after every 45 minutes of study. Consistency beats intensity!
                </p>
            </div>
        </div>
    );

    return (
        <AppShell rightPanel={rightPanel}>
            <div className="dashboard-main-content">
                {/* Motivational Hero Banner */}
                <div className="hero-banner-v3">
                    <div className="mesh-gradient"></div>
                    <div className="hero-content-v3">
                        <div className="hero-top-meta">
                            <span className="hero-pill">TARGET: NEET 2026</span>
                            <div className="hero-live-badge">
                                <span className="pulse-dot"></span>
                                <span>LIVE SESSION</span>
                            </div>
                        </div>
                        <h1 className="hero-headline">
                            Welcome back,<br />
                            <span className="hero-name-glow">Aspirant! 🚀</span>
                        </h1>
                        <div className="hero-stats-row">
                            <div className="mini-stat">
                                <Zap size={14} className="stat-icon" />
                                <span><b>{Math.round((syllabusStats.Physics + syllabusStats.Chemistry + syllabusStats.Biology) / 3)}%</b> Mastery</span>
                            </div>
                        </div>
                        <div className="hero-quote-box-v3">
                            <Star size={12} fill="white" />
                            <p>"{motivationalQuote}"</p>
                        </div>
                    </div>
                    <div className="hero-visual-v3">
                        <div className="glass-card-wrapper">
                            <img src="/images/study-girl.jpg" alt="Aspirant" className="aspirant-img-v3" />
                            <div className="glass-overlay"></div>
                            <div className="glass-border"></div>
                        </div>
                    </div>
                </div>

                <div className="subject-meta-grid">
                    {['Physics', 'Chemistry', 'Biology'].map(subject => (
                        <div key={subject} className="subject-card">
                            <div className="card-top">
                                <div className="subject-info">
                                    <div className="icon-box" style={{ background: getColor(subject).bg }}>
                                        <BookOpen size={18} color={getColor(subject).text} />
                                    </div>
                                    <span className="subject-name">{subject}</span>
                                </div>
                                <span className="percentage" style={{ color: getColor(subject).text }}>
                                    {syllabusStats[subject]}%
                                </span>
                            </div>

                            <div className="progress-bar-container">
                                <div className="progress-bar-fill" style={{
                                    width: `${syllabusStats[subject]}%`,
                                    background: getColor(subject).text
                                }}></div>
                            </div>

                            <div className="card-footer">
                                <span className="label">Mastery Level</span>
                                <span className="status">
                                    {syllabusStats[subject] < 30 ? 'Beginner' : syllabusStats[subject] < 70 ? 'Intermediate' : 'Advanced'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="tasks-header-container">
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--color-text-main)' }}>
                            Today's Tasks
                        </h2>
                        <div className="tasks-meta-row">
                            <p className="tasks-remaining-text">
                                {allDone ? '🎉 All caught up for today!' : `You have ${tasks.length - completedCount} tasks remaining`}
                            </p>
                            <span className="meta-separator">|</span>
                            <div className="study-tip-pill">
                                <Star size={14} fill="currentColor" />
                                <span>Tip: {getStudyTip()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="tasks-right-content">
                        <button onClick={fetchHistory} className="btn-history-pill">
                            <RotateCcw size={16} /> History
                        </button>
                        {!allDone && (
                            <div className="eta-badge">
                                <Timer size={16} />
                                <span>ETA: {tasks.filter(t => !t.is_done).length * 45} mins</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Compact Warning Banner */}
                {!allDone && (
                    <div style={{
                        background: '#FEF2F2',
                        border: '1px solid #FEE2E2',
                        color: '#991B1B',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '24px',
                        fontSize: '0.9rem'
                    }}>
                        <div style={{ background: '#991B1B', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <AlertTriangle size={12} strokeWidth={3} />
                        </div>
                        <span style={{ fontWeight: 500 }}>Focus only on these tasks. Complete them before moving to anything else.</span>
                    </div>
                )}

                {/* Add Task Section */}
                <div style={{ marginBottom: '24px' }}>
                    {!isFormOpen ? (
                        <button
                            className="btn btn-secondary"
                            style={{ width: '100%', borderStyle: 'dashed', justifyContent: 'center', gap: '8px', padding: '12px' }}
                            onClick={() => setIsFormOpen(true)}
                        >
                            <Plus size={20} /> Add Personal Task
                        </button>
                    ) : (
                        <div className="card add-task-card">
                            <div className="form-header">
                                <h4 style={{ margin: 0 }}>Add New Study Goal</h4>
                                <button onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={18} /></button>
                            </div>
                            <form onSubmit={addTask}>
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>Subject</label>
                                        <select
                                            value={newTask.subject} onChange={e => {
                                                setNewTask({ ...newTask, subject: e.target.value });
                                                fetchSuggestions(e.target.value);
                                            }}
                                        >
                                            <option>Physics</option>
                                            <option>Chemistry</option>
                                            <option>Biology</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>Priority</label>
                                        <select
                                            value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                        >
                                            <option value="high">🔥 High</option>
                                            <option value="medium">⚡ Medium</option>
                                            <option value="low">📌 Low</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>Time Goal</label>
                                        <input
                                            placeholder="e.g. 45 min"
                                            value={newTask.time} onChange={e => setNewTask({ ...newTask, time: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Target</label>
                                        <input
                                            placeholder="e.g. 25 MCQs"
                                            value={newTask.questions} onChange={e => setNewTask({ ...newTask, questions: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="input-group full-width">
                                    <label>What are you studying today?</label>
                                    <div className="topic-input-wrapper">
                                        <input
                                            placeholder="Enter or select topic (e.g. Organic Chemistry...)"
                                            value={newTask.topic}
                                            onChange={e => {
                                                setNewTask({ ...newTask, topic: e.target.value });
                                                setShowSuggestions(true);
                                            }}
                                            onFocus={(e) => {
                                                e.stopPropagation();
                                                setShowSuggestions(true);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            required autoComplete="off"
                                            className="topic-input-field"
                                        />
                                        {showSuggestions && (
                                            <div className="suggestions-container" onClick={(e) => e.stopPropagation()}>
                                                {(() => {
                                                    const filtered = suggestedTopics.filter(t =>
                                                        t.name.toLowerCase().includes(newTask.topic.toLowerCase())
                                                    );
                                                    if (filtered.length > 0) {
                                                        return filtered.map(t => (
                                                            <div
                                                                key={t.id}
                                                                className="suggestion-item"
                                                                onClick={() => {
                                                                    setNewTask({ ...newTask, topic: t.name });
                                                                    setShowSuggestions(false);
                                                                }}
                                                            >
                                                                {newTask.subject === 'Physics' ? <Atom size={14} className="sug-icon" /> :
                                                                    newTask.subject === 'Biology' ? <Microscope size={14} className="sug-icon" /> :
                                                                        <Hash size={14} className="sug-icon" />}
                                                                {t.name}
                                                            </div>
                                                        ));
                                                    }
                                                    return (
                                                        <div className="suggestion-item" style={{ color: '#94A3B8', fontStyle: 'italic', cursor: 'default' }}>
                                                            <Plus size={14} className="sug-icon" />
                                                            No match? Type "{newTask.topic || '...'}" to add a custom topic
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="submit" className="btn btn-primary submit-btn">
                                        <Plus size={18} /> Create Task
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Task Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {tasks.map((task) => (
                        <div key={task.id} className="card" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            opacity: task.is_done ? 0.6 : 1,
                            transition: 'opacity 0.2s',
                            padding: '20px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                        <span style={{
                                            display: 'inline-block', padding: '4px 12px', borderRadius: '999px',
                                            background: getColor(task.subject).bg, color: getColor(task.subject).text, fontSize: '0.8rem', fontWeight: 700
                                        }}>
                                            {task.subject}
                                        </span>
                                        {task.priority && (
                                            <span style={{
                                                display: 'inline-block', padding: '4px 12px', borderRadius: '999px',
                                                background: task.priority === 'high' ? '#FEE2E2' : task.priority === 'medium' ? '#FEF3C7' : '#E0E7FF',
                                                color: task.priority === 'high' ? '#991B1B' : task.priority === 'medium' ? '#92400E' : '#3730A3',
                                                fontSize: '0.75rem', fontWeight: 600
                                            }}>
                                                {task.priority === 'high' ? '🔥 High' : task.priority === 'medium' ? '⚡ Medium' : '📌 Low'}
                                            </span>
                                        )}
                                    </div>
                                    <h3 style={{ fontSize: '1.15rem', marginBottom: '4px', fontWeight: 600 }}>{task.topic}</h3>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => toggleTask(task.id)} style={{ background: 'none', border: 'none', color: task.is_done ? '#10B981' : '#CBD5E1', cursor: 'pointer' }}>
                                        {task.is_done ? <CheckCircle size={28} /> : <Circle size={28} />}
                                    </button>
                                    <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: '#EF4444', opacity: 0.7, cursor: 'pointer' }}>
                                        <Trash2 size={22} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '24px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={16} /> {task.time_goal}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileQuestion size={16} /> {task.questions_goal}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button
                                    className="btn btn-secondary"
                                    style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}
                                    onClick={() => window.open(`https://www.google.com/search?q=${task.topic.replace(/ /g, '+')}+neet+short+notes+pdf`, '_blank')}
                                >
                                    View Notes
                                </button>
                                <button
                                    className="btn btn-primary"
                                    style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}
                                    onClick={() => window.open(`https://www.neetprep.com/search?q=${task.topic.replace(/ /g, '+')}`, '_blank')}
                                >
                                    Start Practice
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {allDone && (
                    <div style={{ marginTop: '32px', padding: '32px', textAlign: 'center', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                        <div style={{ color: '#10B981', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                            <CheckCircle size={48} />
                        </div>
                        <h3 style={{ color: '#166534', marginBottom: '8px' }}>All Tasks Completed!</h3>
                        <p style={{ color: '#15803D' }}>Great job! Tomorrow's tasks will appear here.</p>
                    </div>
                )}
                {!allDone && (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '32px', fontSize: '0.9rem' }}>
                        Tomorrow's tasks will appear after you complete today's.
                    </p>
                )}

                {/* Enhanced Study Journal Modal */}
                {showHistory && (
                    <div className="modal-overlay">
                        <div className="modal-content history-modal">
                            <div className="modal-header">
                                <div>
                                    <h3 style={{ margin: 0 }}>Study Journal</h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Review your past performance</p>
                                </div>
                                <button onClick={() => setShowHistory(false)} className="close-btn"><X size={20} /></button>
                            </div>

                            <div className="history-date-nav">
                                <button onClick={() => changeHistoryDate(-1)} className="date-nav-btn"><ChevronRight style={{ transform: 'rotate(180deg)' }} size={18} /></button>
                                <div className="current-date-display">
                                    <Clock size={16} />
                                    <span>{new Date(selectedHistoryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    <input
                                        type="date"
                                        className="date-picker-input"
                                        value={selectedHistoryDate}
                                        onChange={(e) => setSelectedHistoryDate(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => changeHistoryDate(1)}
                                    className="date-nav-btn"
                                    disabled={selectedHistoryDate === new Date().toISOString().split('T')[0]}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>

                            <div className="history-table-container">
                                {filteredHistory.length > 0 ? (
                                    <table className="history-table">
                                        <thead>
                                            <tr>
                                                <th>Subject</th>
                                                <th>Topic</th>
                                                <th>Target</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredHistory.map(task => (
                                                <tr key={task.id}>
                                                    <td>
                                                        <span className="subject-pill" style={{
                                                            background: getColor(task.subject).bg,
                                                            color: getColor(task.subject).text
                                                        }}>
                                                            {task.subject}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontWeight: 600 }}>{task.topic}</td>
                                                    <td style={{ fontSize: '0.85rem' }}>{task.time_goal} | {task.questions_goal}</td>
                                                    <td>
                                                        {task.is_done ?
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontWeight: 700, fontSize: '0.85rem' }}>
                                                                <CheckCircle size={14} /> Done
                                                            </div> :
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F97316', fontWeight: 700, fontSize: '0.85rem' }}>
                                                                <Circle size={14} /> Pending
                                                            </div>
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="no-history-state">
                                        <div className="empty-icon-box">
                                            <ClipboardList size={40} />
                                        </div>
                                        <h4>No tasks found for this day</h4>
                                        <p>Try selecting another date to see your study logs.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(4px);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .modal-content.history-modal {
                    background: var(--color-surface);
                    width: 100%;
                    max-width: 900px;
                    max-height: 80vh;
                    border-radius: 24px;
                    padding: 32px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }
                .close-btn {
                    background: none; border: none; cursor: pointer; color: var(--color-text-muted);
                }
                .history-table-container {
                    overflow-x: auto;
                }
                .history-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .history-table th {
                    text-align: left;
                    padding: 12px;
                    border-bottom: 2px solid var(--color-border);
                    color: var(--color-text-muted);
                    font-size: 0.85rem;
                }
                .history-table td {
                    padding: 16px 12px;
                    border-bottom: 1px solid var(--color-border);
                }
                .subject-pill {
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 700;
                }
                .status-done { color: #10B981; font-weight: 700; font-size: 0.85rem; }
                .status-pending { color: #F97316; font-weight: 700; font-size: 0.85rem; }

                .add-task-card {
                    background: #FFFFFF;
                    border: 2px solid #F1F5F9;
                    padding: 24px;
                    border-radius: 24px;
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
                }
                .form-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #F1F5F9;
                }
                .form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                    margin-bottom: 20px;
                }
                @media (max-width: 480px) {
                    .form-grid {
                        grid-template-columns: 1fr;
                    }
                    .add-task-card {
                        padding: 16px;
                    }
                }
                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .input-group label {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: var(--color-text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }
                .input-group input, .input-group select {
                    background: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    padding: 10px 14px;
                    border-radius: 12px;
                    font-weight: 600;
                    color: var(--color-text-main);
                    transition: all 0.2s;
                    width: 100%;
                    outline: none;
                }
                .input-group input:focus, .input-group select:focus {
                    background: #FFFFFF;
                    border-color: var(--color-primary);
                    outline: none;
                    box-shadow: 0 0 0 3px var(--color-primary-light);
                }
                .full-width {
                    margin-bottom: 20px;
                }
                :global(.topic-input-wrapper) {
                    position: relative;
                    width: 100%;
                    display: block;
                }
                :global(.topic-input-field) {
                    padding-left: 14px !important;
                }
                :global(.suggestions-container) {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: #FFFFFF;
                    border: 1px solid #E2E8F0;
                    border-radius: 12px;
                    margin-top: 4px;
                    max-height: 250px;
                    overflow-y: auto;
                    z-index: 3000;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                    /* Animation removed to prevent blinking while typing */
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                :global(.suggestion-item) {
                    padding: 12px 18px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--color-text-main);
                    transition: all 0.2s;
                    border-bottom: 1px solid rgba(0, 0, 0, 0.02);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                :global(.suggestion-item:last-child) { border-bottom: none; }
                :global(.suggestion-item:hover) {
                    background: var(--color-primary-light);
                    color: var(--color-primary);
                    padding-left: 24px;
                }
                :global(.sug-icon) {
                    opacity: 0.5;
                }
                :global(.suggestion-item:hover .sug-icon) {
                    opacity: 1;
                    color: var(--color-primary);
                }
                .submit-btn {
                    width: 100%;
                    justify-content: center;
                    padding: 14px;
                    border-radius: 14px;
                    font-weight: 700;
                }

                .history-date-nav {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 16px;
                    margin-bottom: 24px;
                    background: #F8FAFC;
                    padding: 12px;
                    border-radius: 16px;
                }
                .date-nav-btn {
                    background: white;
                    border: 1px solid var(--color-border);
                    padding: 6px;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    transition: all 0.2s;
                }
                .date-nav-btn:hover:not(:disabled) {
                    background: var(--color-primary-light);
                    border-color: var(--color-primary);
                }
                .date-nav-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                .current-date-display {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 700;
                    color: var(--color-text-main);
                    position: relative;
                }
                .date-picker-input {
                    position: absolute;
                    inset: 0;
                    opacity: 0;
                    cursor: pointer;
                    width: 100%;
                }
                .no-history-state {
                    padding: 60px 20px;
                    text-align: center;
                    color: var(--color-text-muted);
                }
                .empty-icon-box {
                    width: 80px;
                    height: 80px;
                    background: #F1F5F9;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                    color: #94A3B8;
                }

                .btn-history-pill {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    padding: 8px 16px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--color-text-main);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-history-pill:hover {
                    border-color: var(--color-primary);
                    color: var(--color-primary);
                    background: var(--color-primary-light);
                }

                .dashboard-main-content {
                    max-width: 1150px;
                    margin: 0 auto;
                    padding: 0 24px;
                }

                .subject-meta-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 40px;
                }

                .subject-card {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: 24px;
                    padding: 24px;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                }

                .subject-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                }

                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .subject-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .icon-box {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.3s ease;
                }

                .subject-card:hover .icon-box {
                    transform: scale(1.1) rotate(-5deg);
                }

                .subject-name {
                    font-size: 1.15rem;
                    font-weight: 800;
                    color: var(--color-text-main);
                    letter-spacing: -0.01em;
                }

                .percentage {
                    font-size: 1.25rem;
                    font-weight: 900;
                    font-variant-numeric: tabular-nums;
                }

                .progress-bar-container {
                    height: 8px;
                    background: #F1F5F9;
                    border-radius: 10px;
                    margin-bottom: 16px;
                    overflow: hidden;
                }

                .progress-bar-fill {
                    height: 100%;
                    border-radius: 10px;
                    transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.8rem;
                }

                .card-footer .label {
                    color: var(--color-text-muted);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .card-footer .status {
                    padding: 4px 12px;
                    border-radius: 8px;
                    background: #F8FAFC;
                    color: var(--color-text-main);
                    font-weight: 700;
                    border: 1px solid var(--color-border);
                }

                .hero-banner-v3 {
                    position: relative;
                    background: #0F172A; /* Deep base */
                    border-radius: 28px;
                    padding: 40px;
                    display: grid;
                    grid-template-columns: 1fr 240px;
                    gap: 32px;
                    color: white;
                    margin-bottom: 32px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                .mesh-gradient {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: 
                        radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
                        radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), 
                        radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%), 
                        radial-gradient(at 0% 100%, hsla(321,78%,11%,1) 0, transparent 50%), 
                        radial-gradient(at 50% 100%, hsla(113,96%,10%,1) 0, transparent 50%), 
                        radial-gradient(at 100% 100%, hsla(242,100%,30%,1) 0, transparent 50%);
                    opacity: 0.8;
                    z-index: 1;
                }

                .hero-content-v3 {
                    position: relative;
                    z-index: 5;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .hero-top-meta {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .hero-pill {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(5px);
                    padding: 4px 12px;
                    border-radius: 100px;
                    font-size: 0.65rem;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                    color: rgba(255, 255, 255, 0.9);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .hero-live-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.65rem;
                    font-weight: 900;
                    color: #4ADE80;
                }

                .pulse-dot {
                    width: 8px; height: 8px; background: #4ADE80; border-radius: 50%;
                    box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
                    animation: pulse-ring 2s infinite;
                }

                @keyframes pulse-ring {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(74, 222, 128, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
                }

                .hero-headline {
                    font-size: 3rem;
                    font-weight: 900;
                    line-height: 1.0;
                    margin: 0 0 16px 0;
                    letter-spacing: -0.03em;
                    color: white; /* Always white for dark hero background */
                    text-shadow: 0 4px 12px rgba(0,0,0,0.4);
                }

                @media (max-width: 768px) {
                    .hero-headline { 
                        font-size: 2.5rem !important; 
                        margin-bottom: 24px;
                    }
                }

                .hero-name-glow {
                    background: linear-gradient(135deg, #fff 0%, #A5B4FC 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    filter: drop-shadow(0 0 8px rgba(165, 180, 252, 0.4));
                }

                .hero-stats-row {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .mini-stat {
                    background: rgba(255, 255, 255, 0.08);
                    padding: 8px 16px;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .stat-icon { color: #818CF8; }

                .hero-quote-box-v3 {
                    display: flex;
                    gap: 10px;
                    opacity: 0.7;
                    max-width: 440px;
                }

                .hero-quote-box-v3 p {
                    margin: 0;
                    font-size: 0.85rem;
                    font-style: italic;
                    line-height: 1.4;
                }

                .hero-visual-v3 {
                    position: relative;
                    z-index: 5;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .glass-card-wrapper {
                    position: relative;
                    width: 260px;
                    height: 260px;
                    border-radius: 32px;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                    transform: perspective(1000px) rotateY(-5deg) rotateX(5deg);
                    animation: float-hero 6s ease-in-out infinite;
                }

                @keyframes float-hero {
                    0%, 100% { transform: perspective(1000px) rotateY(-5deg) rotateX(5deg) translateY(0); }
                    50% { transform: perspective(1000px) rotateY(-3deg) rotateX(3deg) translateY(-10px); }
                }

                .aspirant-img-v3 {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 20px;
                }

                .glass-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
                    pointer-events: none;
                    border-radius: 32px;
                }

                .tasks-header-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 24px;
                    gap: 20px;
                    flex-wrap: wrap;
                }

                .tasks-right-content {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .tasks-meta-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .tasks-remaining-text {
                    color: var(--color-text-muted);
                    font-size: 0.95rem;
                    margin: 0;
                }

                .meta-separator { color: var(--color-border); }

                .study-tip-pill {
                    font-size: 0.85rem;
                    color: var(--color-primary);
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: var(--color-primary-light);
                    padding: 4px 12px;
                    border-radius: 100px;
                }

                .eta-badge {
                    background: var(--color-info-bg);
                    padding: 8px 16px;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    color: var(--color-primary);
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border: 1px solid var(--color-border);
                    box-shadow: var(--shadow-sm);
                }

                @media (max-width: 1024px) {
                    .hero-banner-v3 {
                        grid-template-columns: 1fr 200px;
                        padding: 32px;
                        gap: 24px;
                    }
                }

                @media (max-width: 768px) {
                    .hero-banner-v3 {
                        grid-template-columns: 1fr;
                        padding: 32px 24px;
                        text-align: center;
                        gap: 32px;
                    }

                    .hero-top-meta { justify-content: center; }
                    .hero-headline { font-size: 2.2rem !important; }
                    .hero-stats-row { justify-content: center; flex-wrap: wrap; }
                    .hero-quote-box-v3 { flex-direction: column; align-items: center; margin: 0 auto; }
                    
                    .glass-card-wrapper {
                        width: 160px;
                        height: 160px;
                        transform: none;
                        margin: 0 auto;
                    }

                    .tasks-header-container {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                        flex-wrap: wrap;
                    }

                    .tasks-meta-row {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 8px;
                    }

                    .meta-separator { display: none; }
                    
                    .study-tip-pill {
                        width: 100%;
                        justify-content: flex-start;
                    }

                    .eta-badge {
                        width: 100%;
                        justify-content: center;
                    }

                    .hero-banner-new {
                        padding: 24px;
                    }

                    .subject-meta-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
                }

                @media (max-width: 480px) {
                    .hero-headline { font-size: 1.8rem !important; }
                    .hero-banner-v3 { border-radius: 20px; }
                    .hero-stats-row { gap: 8px; }
                    .mini-stat { padding: 6px 12px; font-size: 0.75rem; }
                }
            `}</style>
        </AppShell>
    );
}
