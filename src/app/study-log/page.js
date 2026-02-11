"use client";

import { useState, useEffect, useMemo } from "react";
import AppShell from "@/components/AppShell";
import {
    BookOpen, Clock, CheckCircle, Plus, Trash2, Calendar,
    Target, Zap, Flame, BarChart3, ChevronRight, LayoutList, Sparkles
} from "lucide-react";
import { NEET_CHAPTERS } from "@/lib/constants";
import { auth } from "@/lib/firebase";
import { saveData, loadData } from "@/lib/progress";

// --- Sub Components ---

const DailyStat = ({ icon: Icon, label, value, color }) => (
    <div className="stat-card">
        <div className="icon-box" style={{ background: `${color}12`, color: color }}>
            <Icon size={24} strokeWidth={2.5} />
        </div>
        <div className="stat-info">
            <span className="stat-label">{label}</span>
            <span className="stat-value">{value}</span>
        </div>
        <style jsx>{`
            .stat-card {
                background: white;
                padding: 1.25rem 1.5rem;
                border-radius: 20px;
                display: flex;
                align-items: center;
                gap: 1.25rem;
                box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                border: 1px solid #f1f5f9;
                transition: all 0.3s ease;
            }
            .stat-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            }
            .icon-box {
                padding: 12px;
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .stat-info { display: flex; flex-direction: column; }
            .stat-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
            .stat-value { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin-top: 2px; }
        `}</style>
    </div>
);

export default function StudyLogPage() {
    const [logs, setLogs] = useState([]);
    const [goals, setGoals] = useState([]);
    const [newGoal, setNewGoal] = useState("");
    const [mounted, setMounted] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        subject: 'Biology',
        chapter: '',
        minutes: '',
        questions: '',
        revision: 'No',
        source: 'NCERT Book',
        difficulty: 'Medium'
    });

    useEffect(() => {
        setMounted(true);
        const syncStudyJournal = async () => {
            const serverData = await loadData("study-journal", { logs: [], goals: [] });
            if (serverData) {
                if (serverData.logs) setLogs(serverData.logs);
                if (serverData.goals) setGoals(serverData.goals);
            }
        };
        syncStudyJournal();
    }, []);

    useEffect(() => {
        if (mounted) {
            saveData("study-journal", { logs, goals });
        }
    }, [logs, goals, mounted]);



    const [timeFilter, setTimeFilter] = useState("all");
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!dropdownOpen) return;
        const closeMenu = () => setDropdownOpen(false);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, [dropdownOpen]);

    const processedLogs = useMemo(() => {
        // 1. Sort logs first (Latest Date and Latest Time/ID first)
        let sorted = [...logs].sort((a, b) => {
            if (b.date !== a.date) return b.date.localeCompare(a.date);
            return b.id - a.id;
        });

        // 2. Apply Time Filter
        if (timeFilter === "all") return sorted;

        const now = new Date();
        const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return sorted.filter(log => {
            const [y, m, d] = log.date.split('-').map(Number);
            const logDateLocal = new Date(y, m - 1, d);

            if (timeFilter === "today") {
                return log.date === todayLocal.toISOString().split('T')[0];
            }

            const diffTime = todayLocal - logDateLocal;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (timeFilter === "7days") return diffDays >= 0 && diffDays < 7;
            if (timeFilter === "30days") return diffDays >= 0 && diffDays < 30;
            return true;
        });
    }, [logs, timeFilter]);

    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayLogs = logs.filter(l => l.date === todayStr);
        const totalMin = todayLogs.reduce((acc, l) => acc + Number(l.minutes), 0);
        const totalQ = todayLogs.reduce((acc, l) => acc + Number(l.questions), 0);

        // Intensity Grid logic...
        const activityGrid = Array.from({ length: 30 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayLogs = logs.filter(l => l.date === dateStr);
            return { date: dateStr, intensity: dayLogs.reduce((acc, l) => acc + Number(l.minutes), 0) };
        }).reverse();

        // Streak logic
        const uniqueDates = Array.from(new Set(logs.map(l => l.date))).sort().reverse();
        let streak = 0;
        if (uniqueDates.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            let dateToCheck = uniqueDates.includes(today) ? today : (uniqueDates.includes(yesterday) ? yesterday : null);

            if (dateToCheck) {
                for (let i = 0; i < 365; i++) {
                    const d = new Date(dateToCheck);
                    d.setDate(d.getDate() - i);
                    if (uniqueDates.includes(d.toISOString().split('T')[0])) streak++;
                    else break;
                }
            }
        }

        return { todayHrs: (totalMin / 60).toFixed(1), todayMCQs: totalQ, activityGrid, streak };
    }, [logs]);

    const subjects = Object.keys(NEET_CHAPTERS);

    const handleSubmit = (e) => {
        e.preventDefault();
        const efficiency = formData.minutes > 0 ? (formData.questions / (formData.minutes / 60)).toFixed(1) : 0;
        const newLog = { ...formData, id: Date.now(), efficiency };
        setLogs([newLog, ...logs]);
        setFormData({ ...formData, chapter: '', minutes: '', questions: '' });
    };

    const deleteLog = (id) => {
        if (confirm("Delete this session record?")) setLogs(logs.filter(l => l.id !== id));
    };

    const addGoal = () => {
        if (!newGoal.trim()) return;
        setGoals([{ id: Date.now(), text: newGoal, done: false }, ...goals]);
        setNewGoal("");
    };

    const toggleGoal = (id) => {
        setGoals(goals.map(g => g.id === id ? { ...g, done: !g.done } : g));
    };

    if (!mounted) return null;

    return (
        <AppShell>
            <div className="journal-page">
                {/* --- Header Section --- */}
                <header className="journal-header">
                    <div className="header-info">
                        <div className="badge"><Sparkles size={14} /> NEET PROGRESS TRACKER</div>
                        <h1>My Study <span>Vault</span></h1>
                        <p>Track your daily logs and analyze your efficiency.</p>
                    </div>
                    <div className="streak-card">
                        <Flame size={24} fill="#FF8E53" color="#FF8E53" />
                        <div>
                            <span className="streak-value">{stats.streak} DAYS</span>
                            <span className="streak-label">STREAK</span>
                        </div>
                    </div>
                </header>

                {/* --- Dashboard Row --- */}
                <div className="stats-row">
                    <DailyStat icon={Clock} label="Today's Hours" value={`${stats.todayHrs} hrs`} color="#4f46e5" />
                    <DailyStat icon={Target} label="Questions" value={stats.todayMCQs} color="#10b981" />
                    <DailyStat icon={Zap} label="Best Speed" value={`${logs.length > 0 ? (logs[0].questions / (logs[0].minutes / 60 || 1)).toFixed(1) : 0} Q/h`} color="#f59e0b" />

                    <div className="performance-map">
                        <span className="map-title">INTENSITY GRID (30D)</span>
                        <div className="grid">
                            {stats.activityGrid.map((d, i) => {
                                let opacity = 0.1;
                                if (d.intensity > 0) opacity = 0.3;
                                if (d.intensity > 120) opacity = 0.6;
                                if (d.intensity > 240) opacity = 1;
                                return <div key={i} title={`${d.date}: ${d.intensity} min`} className="grid-cell" style={{ opacity }} />;
                            })}
                        </div>
                    </div>
                </div>

                <div className="main-content">
                    {/* --- LEFT: LOG FORM --- */}
                    <aside className="journal-sidebar-left">
                        <div className="form-card">
                            <div className="form-header">
                                <BarChart3 size={18} />
                                <h2>Log Session</h2>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="journal-form-group">
                                    <label>SUBJECT & CHAPTER</label>
                                    <select value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value, chapter: '' })}>
                                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <select required value={formData.chapter} onChange={e => setFormData({ ...formData, chapter: e.target.value })}>
                                        <option value="">Select Chapter</option>
                                        {NEET_CHAPTERS[formData.subject].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div className="journal-form-row">
                                    <div className="journal-form-group">
                                        <label>DURATION</label>
                                        <input type="number" required placeholder="Min" value={formData.minutes} onChange={e => setFormData({ ...formData, minutes: e.target.value })} />
                                    </div>
                                    <div className="journal-form-group">
                                        <label>QUESTIONS</label>
                                        <input type="number" required placeholder="Qs" value={formData.questions} onChange={e => setFormData({ ...formData, questions: e.target.value })} />
                                    </div>
                                </div>

                                <div className="journal-form-group">
                                    <label>SOURCE</label>
                                    <select value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })}>
                                        <option>NCERT Book</option>
                                        <option>PYQs (Previous Year)</option>
                                        <option>Coaching Notes</option>
                                        <option>Video Lecture</option>
                                    </select>
                                </div>

                                <div className="journal-form-group">
                                    <label>DIFFICULTY</label>
                                    <select value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                                        <option>Easy</option>
                                        <option>Medium</option>
                                        <option>Hard</option>
                                    </select>
                                </div>

                                <button type="submit" className="save-btn-journal">Save Session</button>
                            </form>
                        </div>
                    </aside>

                    {/* --- CENTER: LOG FEED --- */}
                    <main className="journal-feed-container">
                        <div className="feed-header-main">
                            <div className="title-stack">
                                <h3>History Log</h3>
                                <div className="feed-stats">{processedLogs.length} {timeFilter === 'all' ? 'Total' : 'Matched'} Sessions</div>
                            </div>
                            <div className="filter-wrapper-outer">
                                <div
                                    className={`custom-dropdown-trigger ${dropdownOpen ? 'active' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
                                >
                                    <Calendar size={14} className="filter-icon" />
                                    <span>{timeFilter === 'all' ? 'All Logs' : timeFilter === 'today' ? 'Today' : timeFilter === '7days' ? 'Last 7 Days' : 'Last 30 Days'}</span>
                                    <ChevronRight size={14} className={`arrow-icon ${dropdownOpen ? 'open' : ''}`} />
                                </div>

                                {dropdownOpen && (
                                    <div className="custom-dropdown-menu">
                                        {[
                                            { id: 'all', label: 'All Logs' },
                                            { id: 'today', label: 'Today' },
                                            { id: '7days', label: 'Last 7 Days' },
                                            { id: '30days', label: 'Last 30 Days' }
                                        ].map(opt => (
                                            <div
                                                key={opt.id}
                                                className={`dropdown-item ${timeFilter === opt.id ? 'selected' : ''}`}
                                                onClick={() => { setTimeFilter(opt.id); setDropdownOpen(false); }}
                                            >
                                                {opt.label}
                                                {timeFilter === opt.id && <CheckCircle size={12} />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="journal-feed-scroll">
                            {logs.length === 0 ? (
                                <div className="empty-state-journal">
                                    <div className="empty-illustration">
                                        <BookOpen size={42} strokeWidth={1.5} />
                                        <div className="pulse-ring"></div>
                                    </div>
                                    <h4>No History Yet</h4>
                                    <p>Start logging your study sessions to track your progress and see your analytics.</p>
                                </div>
                            ) : processedLogs.length === 0 ? (
                                <div className="empty-state-journal filter-empty">
                                    <Target size={42} strokeWidth={1.5} color="#94a3b8" />
                                    <h4>No Matches</h4>
                                    <p>No study sessions found for the selected time filter.</p>
                                    <button onClick={() => setTimeFilter('all')} className="clear-filter-btn">Show All History</button>
                                </div>
                            ) : (
                                <div className="logs-grid-journal">
                                    {processedLogs.map(log => (
                                        <div key={log.id} className={`history-card-new ${log.subject.toLowerCase()}`}>
                                            <div className="card-accent"></div>
                                            <div className="card-body-journal">
                                                <div className="card-meta-row">
                                                    <div className="subject-pill">
                                                        <span className="dot"></span>
                                                        {log.subject}
                                                    </div>
                                                    <div className={`diff-tag-new ${log.difficulty.toLowerCase()}`}>
                                                        {log.difficulty}
                                                    </div>
                                                </div>

                                                <h4 className="chapter-name-journal">{log.chapter}</h4>

                                                <div className="metric-row-journal">
                                                    <div className="metric-item"><Clock size={13} /> {log.minutes}m</div>
                                                    <div className="metric-item"><Target size={13} /> {log.questions} Qs</div>
                                                    <div className="metric-item speed"><Zap size={13} /> {log.efficiency} Q/h</div>
                                                </div>

                                                <div className="card-footer-journal">
                                                    <div className="date-journal"><Calendar size={11} /> {log.date}</div>
                                                    <button onClick={() => deleteLog(log.id)} className="delete-log-btn"><Trash2 size={15} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </main>

                    {/* --- RIGHT --- */}
                    <aside className="journal-sidebar-right">
                        <div className="sticky-wrapper">
                            <div className="goals-card">
                                <h3><LayoutList size={18} /> Daily Goal</h3>
                                <div className="add-goal">
                                    <input
                                        type="text"
                                        placeholder="Add a task..."
                                        value={newGoal}
                                        onChange={e => setNewGoal(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && addGoal()}
                                    />
                                    <button onClick={addGoal}><Plus size={20} /></button>
                                </div>
                                <div className="goals-list">
                                    {goals.map(goal => (
                                        <div
                                            key={goal.id}
                                            onClick={() => toggleGoal(goal.id)}
                                            className={`goal-item ${goal.done ? 'done' : ''}`}
                                        >
                                            <div className="checkbox">
                                                {goal.done && <CheckCircle size={14} color="#4f46e5" fill="#4f46e5" />}
                                            </div>
                                            <span className="goal-text">{goal.text}</span>
                                        </div>
                                    ))}
                                    {goals.length === 0 && <p className="hint">No goals set yet.</p>}
                                </div>
                            </div>

                            <div className="premium-tip-card">
                                <Sparkles size={18} className="tip-sparkle" />
                                <h4>TOP STUDY TIP</h4>
                                <p>&quot;Active recall is better than re-reading. Close the book and quiz yourself frequently.&quot;</p>
                            </div>
                        </div>
                    </aside>
                </div>

                <style jsx>{`
                    /* --- PROPER THEME SYSTEM --- */
                    :global(:root) {
                        --primary: #4f46e5;
                        --primary-glow: rgba(79, 70, 229, 0.15);
                        --bg-page: #fafbfc;
                        --bg-card: #ffffff;
                        --border: #f1f5f9;
                        --text-main: #1e293b;
                        --text-muted: #64748b;
                        --text-light: #94a3b8;
                        --radius-lg: 24px;
                        --radius-md: 20px;
                        --radius-sm: 12px;
                        --shadow-soft: 0 4px 15px rgba(0,0,0,0.02);
                        --shadow-lift: 0 12px 30px rgba(79, 70, 229, 0.08);
                    }

                    .journal-page { max-width: 1400px; margin: 0 auto; padding: 2rem; font-family: var(--font-inter, sans-serif); color: var(--text-main); background: var(--bg-page); min-height: 100vh; overflow-x: hidden; }
                    
                    /* Header Section */
                    .journal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                    .header-info h1 { font-size: 2.25rem; font-weight: 900; color: var(--text-main); margin: 4px 0; letter-spacing: -0.03em; }
                    .header-info h1 span { color: var(--primary); }
                    .header-info p { color: var(--text-muted); font-size: 1rem; }
                    .badge { display: inline-flex; align-items: center; gap: 8px; background: #eef2ff; color: var(--primary); padding: 5px 12px; border-radius: 99px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; }

                    .streak-card { background: var(--bg-card); padding: 1rem 1.5rem; border-radius: var(--radius-md); display: flex; align-items: center; gap: 0.75rem; border: 1px solid var(--border); box-shadow: var(--shadow-soft); transition: all 0.3s ease; }
                    .streak-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.05); }
                    .streak-value { display: block; font-size: 1.25rem; font-weight: 900; color: var(--text-main); line-height: 1; }
                    .streak-label { font-size: 0.6rem; font-weight: 800; color: var(--text-light); text-transform: uppercase; }

                    /* Stats Grid */
                    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 2.5rem; }
                    
                    /* Intensity Grid Section */
                    .performance-map { background: var(--bg-card); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border); box-shadow: var(--shadow-soft); display: flex; flex-direction: column; transition: all 0.3s ease; }
                    .performance-map:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.05); }
                    .map-title { font-size: 0.65rem; font-weight: 800; color: var(--text-light); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
                    .grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px; flex-grow: 1; }
                    .grid-cell { width: 100%; aspect-ratio: 1; background: var(--primary); border-radius: 4px; transition: all 0.2s; }

                    .main-content { display: grid; grid-template-columns: 320px 1fr 280px; gap: 2rem; align-items: start; max-height: calc(100vh - 350px); }
                    
                    /* Sidebar Sections */
                    .journal-sidebar-left, .journal-sidebar-right { position: sticky; top: 1.5rem; height: fit-content; }
                    
                    /* Form Section */
                    .form-card { background: var(--bg-card); padding: 1.75rem; border-radius: var(--radius-lg); border: 1px solid var(--border); box-shadow: 0 10px 40px rgba(0,0,0,0.03); }
                    .form-header { display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem; color: var(--primary); }
                    .form-header h2 { font-size: 1.15rem; font-weight: 900; color: var(--text-main); margin: 0; }
                    
                    .journal-form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 1.1rem; }
                    .journal-form-group label { font-size: 0.65rem; font-weight: 800; color: var(--text-light); letter-spacing: 0.05em; text-transform: uppercase; }
                    .journal-form-group select, .journal-form-group input { width: 100%; padding: 12px 14px; border-radius: var(--radius-sm); border: 1.5px solid var(--border); font-size: 0.9rem; outline: none; background: #f8fafc; transition: all 0.2s; font-weight: 600; color: var(--text-main); }
                    .journal-form-group select:focus, .journal-form-group input:focus { background: white; border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-glow); }
                    
                    .journal-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.25rem; }

                    .save-btn-journal { width: 100%; padding: 1rem; background: var(--primary); color: white; border: none; border-radius: 14px; font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); margin-top: 0.75rem; box-shadow: 0 6px 20px rgba(79, 70, 229, 0.25); }
                    .save-btn-journal:hover { background: #4338ca; transform: translateY(-2px) scale(1.02); box-shadow: 0 10px 25px rgba(79, 70, 229, 0.4); }

                    /* History Feed Section */
                    .journal-feed-container { display: flex; flex-direction: column; gap: 0; max-height: calc(100vh - 330px); }
                    .feed-header-main { display: flex; justify-content: space-between; align-items: center; padding-bottom: 1.25rem; background: var(--bg-page); z-index: 10; }
                    .title-stack h3 { font-size: 1.35rem; font-weight: 900; color: var(--text-main); margin: 0; }
                    .feed-stats { font-size: 0.75rem; font-weight: 700; color: var(--text-light); margin-top: 2px; }
                    
                    .journal-feed-scroll { 
                        overflow-y: auto; 
                        padding-right: 12px; 
                        padding-bottom: 2rem;
                        mask-image: linear-gradient(to bottom, black 95%, transparent 100%);
                        scrollbar-width: thin;
                        scrollbar-color: #e2e8f0 transparent;
                    }
                    
                    /* Custom Scrollbar */
                    .journal-feed-scroll::-webkit-scrollbar { width: 5px; }
                    .journal-feed-scroll::-webkit-scrollbar-track { background: transparent; }
                    .journal-feed-scroll::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 20px; }
                    .journal-feed-scroll::-webkit-scrollbar-thumb:hover { background-color: var(--text-muted); }

                    .logs-grid-journal { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
                    
                    .history-card-new { 
                        background: var(--bg-card); 
                        border-radius: var(--radius-md); 
                        border: 1px solid var(--border); 
                        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
                        position: relative; 
                        overflow: hidden; 
                        box-shadow: 0 4px 12px rgba(0,0,0,0.01);
                        display: flex;
                    }
                    .history-card-new:hover { transform: translateY(-6px) scale(1.01); border-color: var(--primary-glow); box-shadow: var(--shadow-lift); }
                    
                    .card-accent { width: 5px; flex-shrink: 0; }
                    .biology .card-accent { background: #10b981; }
                    .physics .card-accent { background: #3b82f6; }
                    .chemistry .card-accent { background: #ef4444; }
                    
                    .card-body-journal { padding: 1.25rem; flex: 1; display: flex; flex-direction: column; }
                    .card-meta-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
                    
                    .subject-pill { display: flex; align-items: center; gap: 8px; font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.02em; }
                    .dot { width: 7px; height: 7px; border-radius: 50%; }
                    .biology .dot { background: #10b981; }
                    .physics .dot { background: #3b82f6; }
                    .chemistry .dot { background: #ef4444; }
                    
                    .diff-tag-new { font-size: 0.6rem; font-weight: 900; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; }
                    .diff-tag-new.hard { background: #fef2f2; color: #ef4444; }
                    .diff-tag-new.medium { background: #fffbeb; color: #ca8a04; }
                    .diff-tag-new.easy { background: #f0fdf4; color: #10b981; }
                    
                    .chapter-name-journal { font-size: 1.1rem; font-weight: 900; color: var(--text-main); margin: 0 0 1rem 0; line-height: 1.3; height: 2.8rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
                    
                    .metric-row-journal { display: flex; gap: 0.65rem; margin-bottom: 1.25rem; }
                    .metric-item { display: flex; align-items: center; gap: 5px; font-size: 0.8rem; font-weight: 800; color: var(--text-muted); background: #f8fafc; padding: 6px 10px; border-radius: 10px; border: 1px solid var(--border); }
                    .metric-item.speed { color: #f59e0b; background: #fffbeb; border-color: #fff3c4; }

                    .card-footer-journal { display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px dashed var(--border); margin-top: auto; }
                    .date-journal { display: flex; align-items: center; gap: 5px; font-size: 0.7rem; font-weight: 700; color: var(--text-light); }
                    .delete-log-btn { background: none; border: none; color: #cbd5e1; cursor: pointer; transition: all 0.2s; padding: 4px; border-radius: 6px; }
                    .delete-log-btn:hover { color: #ef4444; background: #fef2f2; }

                    /* Filter Custom Menu */
                    .filter-wrapper-outer { position: relative; }
                    .custom-dropdown-trigger { 
                        display: flex; align-items: center; gap: 10px; background: var(--bg-card); padding: 8px 14px; border-radius: 14px; border: 1px solid var(--border); 
                        box-shadow: var(--shadow-soft); cursor: pointer; transition: all 0.2s; font-size: 0.8rem; font-weight: 800; color: var(--text-muted); min-width: 140px; justify-content: space-between;
                    }
                    .custom-dropdown-trigger:hover, .custom-dropdown-trigger.active { border-color: var(--primary); color: var(--primary); box-shadow: var(--primary-glow); }
                    .arrow-icon { transition: transform 0.3s; transform: rotate(90deg); color: #cbd5e1; }
                    .arrow-icon.open { transform: rotate(-90deg); color: var(--primary); }
                    
                    .custom-dropdown-menu { 
                        position: absolute; top: calc(100% + 8px); right: 0; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border); 
                        box-shadow: 0 15px 40px rgba(0,0,0,0.1); width: 180px; z-index: 100; overflow: hidden; padding: 6px; animation: slideDown 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
                    }
                    @keyframes slideDown { 0% { opacity: 0; transform: translateY(-10px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
                    .dropdown-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); cursor: pointer; border-radius: 10px; transition: all 0.2s; }
                    .dropdown-item:hover { background: #f8fafc; color: var(--primary); }
                    .dropdown-item.selected { background: #eef2ff; color: var(--primary); }

                    /* Goals & Right Sidebar */
                    .goals-card { background: var(--bg-card); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border); box-shadow: var(--shadow-soft); }
                    .goals-card h3 { display: flex; align-items: center; gap: 8px; font-size: 1.05rem; font-weight: 900; color: var(--text-main); margin-bottom: 1.25rem; }
                    .add-goal { display: flex; gap: 6px; margin-bottom: 1.25rem; }
                    .add-goal input { flex: 1; padding: 10px 14px; border-radius: var(--radius-sm); border: 1.5px solid var(--border); font-size: 0.85rem; outline: none; background: #f8fafc; font-weight: 600; }
                    .add-goal button { background: var(--primary); color: white; border: none; padding: 10px; border-radius: var(--radius-sm); cursor: pointer; transition: transform 0.2s; }
                    .goal-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
                    .goal-item:hover { background: #f8fafc; }
                    .goal-item.done { opacity: 0.5; background: #f1f5f9; }
                    .goal-text { font-size: 0.9rem; font-weight: 700; color: #475569; }
                    .checkbox { width: 22px; height: 22px; border-radius: 8px; border: 2.5px solid #e2e8f0; display: flex; align-items: center; justify-content: center; background: white; transition: all 0.2s; }
                    .goal-item.done .checkbox { border-color: var(--primary); background: var(--primary); color: white; }
                    .hint { font-size: 0.75rem; color: var(--text-light); margin-top: 1rem; text-align: center; }

                    .premium-tip-card { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 1.5rem; border-radius: var(--radius-md); margin-top: 1.25rem; color: white; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(30, 27, 75, 0.2); }
                    .tip-sparkle { position: absolute; right: -5px; top: -5px; opacity: 0.2; transform: rotate(15deg); }
                    .premium-tip-card h4 { font-size: 0.65rem; font-weight: 900; color: #818cf8; margin: 0 0 10px 0; letter-spacing: 0.15em; text-transform: uppercase; }
                    .premium-tip-card p { font-size: 0.95rem; line-height: 1.5; font-weight: 600; margin: 0; opacity: 0.9; }

                    /* Empty State UI */
                    .empty-state-journal { padding: 4rem 2rem; text-align: center; background: var(--bg-card); border-radius: var(--radius-lg); border: 2px dashed var(--border); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
                    .clear-filter-btn { margin-top: 1rem; padding: 8px 16px; background: #f1f5f9; border: none; border-radius: 10px; font-weight: 800; font-size: 0.8rem; color: var(--text-muted); cursor: pointer; transition: all 0.2s; }
                    .clear-filter-btn:hover { background: #e2e8f0; color: var(--text-main); }

                    /* Mobile Responsiveness Fixing Theme Tokens */
                    @media (max-width: 1024px) {
                        .journal-page { padding: 1.5rem; }
                        .main-content { grid-template-columns: 1fr; gap: 2rem; }
                        .stats-row { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
                        .journal-sidebar-left, .journal-sidebar-right { width: 100%; position: relative; top: 0; }
                        .journal-feed-container { max-height: 600px; order: 2; }
                        .journal-sidebar-left { order: 1; }
                        .journal-sidebar-right { order: 3; }
                        .journal-feed-scroll { max-height: 500px; mask-image: none; }
                    }

                    @media (max-width: 768px) {
                        .journal-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
                        .header-info h1 { font-size: 1.85rem; }
                        .streak-card { width: 100%; }
                        .stats-row { grid-template-columns: 1fr; }
                        .grid { grid-template-columns: repeat(15, 1fr); }
                        .journal-feed-scroll { max-height: 450px; }
                        .chapter-name-journal { height: auto; -webkit-line-clamp: 3; }
                    }
                `}</style>
            </div>
        </AppShell>
    );
}
