"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { CheckCircle, Circle, AlertTriangle, Clock, FileQuestion, Plus, Trash2, Flame, Target, TrendingUp, BookOpen, Timer, ClipboardList, Star, Zap, Moon, Sun } from "lucide-react";
import Link from "next/link";

const INITIAL_TASKS = [
    { id: 1, subject: 'Physics', topic: 'Current Electricity', time: '60 min', questions: '30 MCQs', done: false, color: '#E0F2FE', iconColor: '#0284C7', priority: 'high' },
    { id: 2, subject: 'Chemistry', topic: 'Chemical Bonding', time: '45 min', questions: '25 MCQs', done: false, color: '#F0F9FF', iconColor: '#0EA5E9', priority: 'medium' },
    { id: 3, subject: 'Biology', topic: 'Human Physiology', time: '50 min', questions: '35 MCQs', done: false, color: '#ECFCCB', iconColor: '#65A30D', priority: 'high' },
];

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
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [mounted, setMounted] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [newTask, setNewTask] = useState({ subject: 'Physics', topic: '', time: '', questions: '', priority: 'medium' });
    const [studyStreak, setStudyStreak] = useState(0);
    const [lastStreakDate, setLastStreakDate] = useState(null);
    const [dailyStudyHours, setDailyStudyHours] = useState(0);
    const [dailyGoal, setDailyGoal] = useState(6); // 6 hours daily goal
    const [motivationalQuote, setMotivationalQuote] = useState('');
    const [syllabusStats, setSyllabusStats] = useState({ Physics: 0, Chemistry: 0, Biology: 0 });
    const [theme, setTheme] = useState("light");

    useEffect(() => {
        setMounted(true);
        fetchDashboardData();

        // Set random motivational quote
        const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
        setMotivationalQuote(randomQuote);

        // Theme initialization
        const savedTheme = localStorage.getItem("neet-theme") ||
            (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("neet-theme", newTheme);
    };

    const fetchDashboardData = async () => {
        try {
            const res = await fetch("/api/dashboard");
            const result = await res.json();
            if (result.success && result.data) {
                if (result.data.tasks) setTasks(result.data.tasks);

                const streakData = result.data.streak;
                if (streakData) {
                    const { streak, lastDate } = streakData;
                    setLastStreakDate(lastDate);
                    const today = new Date().toLocaleDateString();
                    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

                    if (lastDate === today || lastDate === yesterday) {
                        setStudyStreak(streak);
                    } else {
                        setStudyStreak(0);
                    }
                }

                // Fetch timer stats
                const timerRes = await fetch("/api/timer");
                const timerData = await timerRes.json();
                if (timerData.success && timerData.data) {
                    const today = new Date().toLocaleDateString();
                    if (timerData.data.date === today) {
                        setDailyStudyHours(Math.floor(timerData.data.minutes / 60));
                    }
                }

                // Fetch syllabus stats
                const syllabusRes = await fetch("/api/syllabus");
                const syllabusData = await syllabusRes.json();
                if (syllabusData.success) {
                    const completed = syllabusData.data || {};
                    const stats = { Physics: 0, Chemistry: 0, Biology: 0 };

                    // Constants for total topics (should be calculated dynamically ideally)
                    const totalTopics = {
                        Physics: 80, // estimated
                        Chemistry: 70,
                        Biology: 100
                    };

                    Object.keys(completed).forEach(id => {
                        if (completed[id]) {
                            if (id.startsWith('Physics')) stats.Physics++;
                            else if (id.startsWith('Chemistry')) stats.Chemistry++;
                            else if (id.startsWith('Biology')) stats.Biology++;
                        }
                    });

                    setSyllabusStats({
                        Physics: Math.min(Math.round((stats.Physics / totalTopics.Physics) * 100), 100),
                        Chemistry: Math.min(Math.round((stats.Chemistry / totalTopics.Chemistry) * 100), 100),
                        Biology: Math.min(Math.round((stats.Biology / totalTopics.Biology) * 100), 100)
                    });
                }
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        }
    };

    const saveDashboardData = async (currentTasks) => {
        const today = new Date().toLocaleDateString();
        const allDone = currentTasks.length > 0 && currentTasks.every(t => t.done);

        let newStreak = studyStreak;
        let newLastDate = lastStreakDate;

        if (allDone && lastStreakDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
            if (lastStreakDate === yesterday) {
                newStreak = studyStreak + 1;
            } else {
                newStreak = 1;
            }
            newLastDate = today;
            setStudyStreak(newStreak);
            setLastStreakDate(newLastDate);
        }

        try {
            await fetch("/api/dashboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tasks: currentTasks,
                    streak: { streak: newStreak, lastDate: newLastDate || lastStreakDate }
                })
            });
        } catch (error) {
            console.error("Failed to save dashboard data", error);
        }
    };

    const toggleTask = async (id) => {
        const newTasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
        setTasks(newTasks);
        await saveDashboardData(newTasks);
    };

    const getColor = (subject) => {
        switch (subject) {
            case 'Physics': return { bg: '#E0F2FE', text: '#0284C7' };
            case 'Chemistry': return { bg: '#F0F9FF', text: '#0EA5E9' };
            case 'Biology': return { bg: '#ECFCCB', text: '#65A30D' };
            default: return { bg: '#F3F4F6', text: '#374151' };
        }
    };

    const addTask = async (e) => {
        e.preventDefault();
        const colors = getColor(newTask.subject);
        const task = {
            id: Date.now(),
            ...newTask,
            done: false,
            color: colors.bg,
            iconColor: colors.text
        };
        const updatedTasks = [task, ...tasks];
        setTasks(updatedTasks);
        setNewTask({ subject: 'Physics', topic: '', time: '', questions: '' });
        setIsFormOpen(false);
        await saveDashboardData(updatedTasks);
    };

    const deleteTask = async (id) => {
        if (confirm('Remove this task?')) {
            const updatedTasks = tasks.filter(t => t.id !== id);
            setTasks(updatedTasks);
            await saveDashboardData(updatedTasks);
        }
    };

    const getStudyTip = () => {
        const weakest = getWeakestSubject();
        if (weakest === 'Physics') return 'Try solving 10 extra MCQs in Kinematics today to boost your score.';
        if (weakest === 'Chemistry') return 'Review the periodic table for 15 minutes before starting Organic Chemistry.';
        if (weakest === 'Biology') return 'Draw a quick diagram of the Human Heart to reinforce your understanding.';
        return 'Stay consistent and focus on one topic at a time!';
    };

    const completedCount = tasks.filter(t => t.done).length;
    const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
    const allDone = tasks.length > 0 && completedCount === tasks.length;

    const getSubjectStats = () => {
        const stats = {};
        tasks.forEach(task => {
            if (!stats[task.subject]) {
                stats[task.subject] = { total: 0, done: 0 };
            }
            stats[task.subject].total++;
            if (task.done) {
                stats[task.subject].done++;
            }
        });
        return stats;
    };

    const getStrongestSubject = () => {
        const stats = getSubjectStats();
        let strongest = 'N/A';
        let maxScore = -1;

        ['Physics', 'Chemistry', 'Biology'].forEach(sub => {
            const taskDone = (stats[sub]?.done || 0) * 10;
            const syllabusDone = syllabusStats[sub] || 0;
            const totalScore = taskDone + syllabusDone;

            if (totalScore > maxScore) {
                maxScore = totalScore;
                strongest = sub;
            }
        });
        return strongest;
    };

    const getWeakestSubject = () => {
        const stats = getSubjectStats();
        let weakest = 'N/A';
        let minScore = Infinity;

        ['Physics', 'Chemistry', 'Biology'].forEach(sub => {
            const taskDone = (stats[sub]?.done || 0) * 10;
            const syllabusDone = syllabusStats[sub] || 0;
            const totalScore = taskDone + syllabusDone;

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
            {/* Global Stats Title with Theme Toggle */}
            <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--color-border)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0 }}>Analytics</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>Real-time study insights</p>
                </div>
                <button
                    onClick={toggleTheme}
                    style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-main)',
                        padding: '8px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
            </div>

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
            <div className="card" style={{ padding: '20px', marginBottom: '20px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Target size={18} color="var(--color-primary)" />
                    </div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>Study Hours</h3>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Completion</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{Math.round((dailyStudyHours / dailyGoal) * 100)}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--color-primary-light)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${(dailyStudyHours / dailyGoal) * 100}%`, height: '100%', background: 'var(--color-primary)' }}></div>
                </div>
            </div>

            {/* Motivational Dose Card */}
            <div className="card" style={{ padding: '20px', marginBottom: '20px', background: 'var(--color-warning-bg, #FFFBEB)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Star size={18} color="#F59E0B" />
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#92400E' }}>Motivational Dose</h3>
                </div>
                <div style={{ background: 'white', borderRadius: '12px', padding: '8px', marginBottom: '12px', boxShadow: 'var(--shadow-sm)' }}>
                    <img src="/images/winning-year.jpg" alt="Winning Year" style={{ width: '100%', borderRadius: '8px' }} />
                </div>
                <p style={{ fontSize: '0.85rem', color: '#92400E', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>
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
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px' }}>Performance</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: '#F0FDF4', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #DCFCE7' }}>
                        <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>Strongest Info</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534' }}>{getStrongestSubject()}</span>
                    </div>
                    <div style={{ background: '#FFF7ED', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #FFEDD5' }}>
                        <span style={{ fontSize: '0.8rem', color: '#9A3412', fontWeight: 600 }}>Needs Attention</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#9A3412' }}>{getWeakestSubject()}</span>
                    </div>
                </div>
            </div>

            {/* Study Mantra Card */}
            <div className="card" style={{ padding: '20px', background: 'var(--color-primary-light)', border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--color-primary)' }}>💡 Study Mantra</h3>
                <div style={{ background: 'white', borderRadius: '12px', padding: '8px', marginBottom: '12px' }}>
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
                <div style={{
                    marginBottom: '32px',
                    borderRadius: '24px',
                    padding: '32px',
                    color: 'white',
                    background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}>
                    <div style={{ position: 'absolute', top: '-10%', right: '-5%', opacity: 0.1 }}>
                        <Zap size={200} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                                    TARGET: NEET 2026
                                </div>
                            </div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', color: 'white', lineHeight: 1.1 }}>
                                Welcome back, Aspirant! 🚀
                            </h1>
                            <p style={{ fontSize: '1.1rem', marginBottom: '24px', opacity: 0.8 }}>
                                You've mastered <span style={{ color: '#818CF8', fontWeight: 700 }}>{Math.round((syllabusStats.Physics + syllabusStats.Chemistry + syllabusStats.Biology) / 3)}%</span> of the syllabus.
                            </p>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-block' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px', letterSpacing: '0.05em' }}>DAILY DOSE</div>
                                <div style={{ fontWeight: 600 }}>"{motivationalQuote}"</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <img
                                src="/images/study-girl.jpg"
                                alt="Study motivation"
                                style={{
                                    width: '100%',
                                    maxWidth: '220px',
                                    height: 'auto',
                                    borderRadius: '20px',
                                    boxShadow: '0 12px 24px rgba(0,0,0,0.5)',
                                    transform: 'rotate(2deg)'
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '20px',
                    marginBottom: '32px'
                }}>
                    {['Physics', 'Chemistry', 'Biology'].map(subject => (
                        <div key={subject} className="card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <BookOpen size={18} color={getColor(subject).text} />
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{subject}</span>
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: getColor(subject).text }}>
                                    {syllabusStats[subject]}%
                                </span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${syllabusStats[subject]}%`,
                                    height: '100%',
                                    background: getColor(subject).text,
                                    borderRadius: '999px',
                                    transition: 'width 1s ease-out'
                                }}></div>
                            </div>
                            <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Mastery Level</span>
                                <span style={{ fontWeight: 600 }}>
                                    {syllabusStats[subject] < 30 ? 'Beginner' : syllabusStats[subject] < 70 ? 'Intermediate' : 'Advanced'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px', color: 'var(--color-text-main)' }}>
                            Today's Tasks
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                                {allDone ? '🎉 All caught up for today!' : `You have ${tasks.length - completedCount} tasks remaining`}
                            </p>
                            <span style={{ color: '#E2E8F0' }}>|</span>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Star size={14} fill="currentColor" />
                                Tip: {getStudyTip()}
                            </div>
                        </div>
                    </div>
                    {!allDone && (
                        <div style={{
                            background: '#F0F9FF',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            color: '#0369A1',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: '1px solid #BAE6FD'
                        }}>
                            <Timer size={16} />
                            ETA: {tasks.filter(t => !t.done).length * 45} mins
                        </div>
                    )}
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
                        <div className="card" style={{ background: '#F8FAFC', border: '1px dashed var(--color-primary)', padding: '20px' }}>
                            <form onSubmit={addTask}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                                    <select
                                        value={newTask.subject} onChange={e => setNewTask({ ...newTask, subject: e.target.value })}
                                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                                    >
                                        <option>Physics</option>
                                        <option>Chemistry</option>
                                        <option>Biology</option>
                                        <option>Other</option>
                                    </select>
                                    <input
                                        placeholder="Time (e.g. 45 min)"
                                        value={newTask.time} onChange={e => setNewTask({ ...newTask, time: e.target.value })}
                                        required style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                                    />
                                    <input
                                        placeholder="Goal (e.g. 20 MCQs)"
                                        value={newTask.questions} onChange={e => setNewTask({ ...newTask, questions: e.target.value })}
                                        required style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                                    />
                                </div>
                                <input
                                    placeholder="Topic Name (e.g. Rotational Motion)"
                                    value={newTask.topic} onChange={e => setNewTask({ ...newTask, topic: e.target.value })}
                                    required style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '12px' }}
                                />
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Task</button>
                                    <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-secondary">Cancel</button>
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
                            opacity: task.done ? 0.6 : 1,
                            transition: 'opacity 0.2s',
                            padding: '20px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                        <span style={{
                                            display: 'inline-block', padding: '4px 12px', borderRadius: '999px',
                                            background: task.color, color: task.iconColor, fontSize: '0.8rem', fontWeight: 700
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
                                    <button onClick={() => toggleTask(task.id)} style={{ background: 'none', border: 'none', color: task.done ? '#10B981' : '#CBD5E1', cursor: 'pointer' }}>
                                        {task.done ? <CheckCircle size={28} /> : <Circle size={28} />}
                                    </button>
                                    <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: '#EF4444', opacity: 0.7, cursor: 'pointer' }}>
                                        <Trash2 size={22} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '24px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={16} /> {task.time}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileQuestion size={16} /> {task.questions}
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

            </div>

            <style jsx>{`
                .dashboard-main-content {
                    max-width: 900px;
                }

                @media (max-width: 1200px) {
                    .dashboard-main-content {
                        max-width: 100%;
                    }
                }

                @media (max-width: 768px) {
                    .dashboard-main-content > div:first-child > div {
                        grid-template-columns: 1fr !important;
                        text-align: center;
                    }
                    
                    .dashboard-main-content h1 {
                        font-size: 2rem !important;
                    }
                }
            `}</style>
        </AppShell>
    );
}
