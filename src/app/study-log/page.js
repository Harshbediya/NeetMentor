"use client";

import { useState, useEffect, useMemo } from "react";
import AppShell from "@/components/AppShell";
import {
    BookOpen, Clock, CheckCircle, Plus, Trash2, Calendar,
    Target, Zap, Flame, BarChart3, ChevronRight, LayoutList, Sparkles
} from "lucide-react";
import { NEET_CHAPTERS } from "@/lib/constants";

// --- Sub Components ---

const DailyStat = ({ icon: Icon, label, value, color }) => (
    <div className="card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", background: "white" }}>
        <div style={{ padding: "10px", background: `${color}15`, color: color, borderRadius: "12px" }}>
            <Icon size={22} />
        </div>
        <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 900 }}>{value}</div>
        </div>
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
        const savedLogs = localStorage.getItem('neet_study_logs');
        const savedGoals = localStorage.getItem('neet_study_goals');
        if (savedLogs) setLogs(JSON.parse(savedLogs));
        if (savedGoals) setGoals(JSON.parse(savedGoals));
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('neet_study_logs', JSON.stringify(logs));
            localStorage.setItem('neet_study_goals', JSON.stringify(goals));
        }
    }, [logs, goals, mounted]);

    const subjects = Object.keys(NEET_CHAPTERS);

    const handleSubmit = (e) => {
        e.preventDefault();
        const efficiency = formData.minutes > 0 ? (formData.questions / (formData.minutes / 60)).toFixed(1) : 0;
        const newLog = { ...formData, id: Date.now(), efficiency };
        setLogs([newLog, ...logs]);
        setFormData({ ...formData, chapter: '', minutes: '', questions: '', revision: 'No' });
    };

    const deleteLog = (id) => setLogs(logs.filter(l => l.id !== id));

    const addGoal = () => {
        if (!newGoal.trim()) return;
        setGoals([{ id: Date.now(), text: newGoal, done: false }, ...goals]);
        setNewGoal("");
    };

    const toggleGoal = (id) => {
        setGoals(goals.map(g => g.id === id ? { ...g, done: !g.done } : g));
    };

    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const todayLogs = logs.filter(l => l.date === todayStr);
        const totalMin = todayLogs.reduce((acc, l) => acc + Number(l.minutes), 0);
        const totalQ = todayLogs.reduce((acc, l) => acc + Number(l.questions), 0);

        // --- REAL STREAK CALCULATION ---
        const uniqueDates = Array.from(new Set(logs.map(l => l.date))).sort().reverse();
        let streak = 0;
        let dateToCheck = uniqueDates.includes(todayStr) ? todayStr : (uniqueDates.includes(yesterdayStr) ? yesterdayStr : null);

        if (dateToCheck) {
            for (let i = 0; i < 365; i++) {
                const d = new Date(dateToCheck);
                d.setDate(d.getDate() - i);
                const dStr = d.toISOString().split('T')[0];
                if (uniqueDates.includes(dStr)) {
                    streak++;
                } else {
                    break;
                }
            }
        }

        const activityGrid = Array.from({ length: 30 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayLogs = logs.filter(l => l.date === dateStr);
            const totalMinutes = dayLogs.reduce((acc, l) => acc + Number(l.minutes), 0);
            return { date: dateStr, intensity: totalMinutes };
        }).reverse();

        return {
            todayHrs: (totalMin / 60).toFixed(1),
            todayMCQs: totalQ,
            activityGrid,
            streak
        };
    }, [logs]);

    if (!mounted) return null;

    return (
        <AppShell>
            <div style={{ maxWidth: "1250px", margin: "0 auto", paddingBottom: "4rem" }}>

                {/* --- Header Section --- */}
                <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 style={{ fontSize: "2.5rem", fontWeight: 900 }}>Daily Study Journal</h1>
                        <p style={{ color: "var(--color-text-muted)", fontSize: "1.1rem" }}>Track your daily efforts to stay close to your medical selection goal.</p>
                    </div>
                    <div style={{ display: "flex", gap: "1rem" }}>
                        <div className="card" style={{ padding: "0.5rem 1rem", background: "linear-gradient(135deg, #FF6B6B, #FF8E53)", color: "white", display: "flex", alignItems: "center", gap: "0.5rem", borderRadius: "12px" }}>
                            <Flame size={20} fill="white" />
                            <span style={{ fontWeight: 800 }}>{stats.streak} DAY STREAK</span>
                        </div>
                    </div>
                </header>

                {/* --- Dashboard Row --- */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
                    <DailyStat icon={Clock} label="Today's Study" value={`${stats.todayHrs} hrs`} color="#2563EB" />
                    <DailyStat icon={Target} label="MCQs Solved" value={stats.todayMCQs} color="#16A34A" />
                    <DailyStat icon={Zap} label="Solving Speed" value={`${logs.length > 0 ? (logs[0].questions / (logs[0].minutes / 60 || 1)).toFixed(1) : 0} Q/hr`} color="#F59E0B" />

                    <div className="card" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#94A3B8" }}>30-DAY PERFORMANCE MAP</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", width: "160px" }}>
                            {stats.activityGrid.map((d, i) => {
                                let opacity = 0.1;
                                if (d.intensity > 0) opacity = 0.3;
                                if (d.intensity > 120) opacity = 0.6;
                                if (d.intensity > 240) opacity = 1;
                                return (
                                    <div
                                        key={i}
                                        title={`${d.date}: ${d.intensity} min`}
                                        style={{ width: "12px", height: "12px", background: "var(--color-primary)", opacity: opacity, borderRadius: "2px" }}
                                    />
                                );
                            })}
                        </div>
                        <span style={{ fontSize: "0.6rem", color: "#94A3B8" }}>Darker squares = Longer study hours</span>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "380px 1fr 300px", gap: "2rem" }} className="grid-cols-responsive">

                    {/* --- LEFT: LOG FORM --- */}
                    <aside>
                        <div className="card" style={{ position: "sticky", top: "2rem", padding: "1.5rem", boxShadow: "0 15px 30px -10px rgba(0,0,0,0.05)" }}>
                            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <BarChart3 size={20} color="var(--color-primary)" /> Log Study Session
                            </h2>
                            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                                <div>
                                    <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Subject & Chapter</label>
                                    <select value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value, chapter: '' })} style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #E2E8F0", marginTop: "0.4rem" }}>
                                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <select required value={formData.chapter} onChange={e => setFormData({ ...formData, chapter: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #E2E8F0", marginTop: "0.75rem" }}>
                                        <option value="">Select Chapter</option>
                                        {NEET_CHAPTERS[formData.subject].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div>
                                        <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748B" }}>DURATION (MINS)</label>
                                        <input type="number" required placeholder="eg: 60" value={formData.minutes} onChange={e => setFormData({ ...formData, minutes: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #E2E8F0", marginTop: "0.4rem" }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748B" }}>MCQs SOLVED</label>
                                        <input type="number" required placeholder="eg: 30" value={formData.questions} onChange={e => setFormData({ ...formData, questions: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #E2E8F0", marginTop: "0.4rem" }} />
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div>
                                        <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748B" }}>STUDY SOURCE</label>
                                        <select value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #E2E8F0", marginTop: "0.4rem" }}>
                                            <option>NCERT Book</option>
                                            <option>PYQs (Previous Year)</option>
                                            <option>Coaching Notes</option>
                                            <option>Video Lecture</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748B" }}>DIFFICULTY</label>
                                        <select value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #E2E8F0", marginTop: "0.4rem" }}>
                                            <option>Easy</option>
                                            <option>Medium</option>
                                            <option>Hard</option>
                                        </select>
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary" style={{ height: "55px", borderRadius: "15px", fontWeight: 800, marginTop: "0.5rem" }}>
                                    Save Session
                                </button>
                            </form>
                        </div>
                    </aside>

                    {/* --- CENTER: LOG FEED --- */}
                    <main>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1.5rem" }}>Study History</h3>
                        {logs.length === 0 ? (
                            <div className="card" style={{ textAlign: "center", padding: "4rem", background: "transparent", border: "2px dashed #E2E8F0" }}>
                                <BookOpen size={48} style={{ opacity: 0.1, margin: "0 auto 1rem" }} />
                                <p style={{ color: "var(--color-text-muted)" }}>Nothing logged yet. Start your first session!</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                {logs.map(log => (
                                    <div key={log.id} className="card hover-scale" style={{ padding: "1.25rem", borderLeft: `6px solid ${log.subject === 'Biology' ? '#16A34A' : log.subject === 'Physics' ? '#3B82F6' : '#EF4444'}` }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.75rem", fontWeight: 700, color: "#94A3B8", marginBottom: "0.4rem" }}>
                                                    <Calendar size={14} /> {log.date}
                                                    <span style={{ padding: "2px 8px", background: "#F1F5F9", borderRadius: "20px", color: "var(--color-text-main)" }}>{log.subject}</span>
                                                    <span style={{ padding: "2px 8px", background: log.difficulty === 'Hard' ? '#FFF1F2' : '#F0FDF4', borderRadius: "20px", color: log.difficulty === 'Hard' ? '#E11D48' : '#16A34A' }}>{log.difficulty}</span>
                                                </div>
                                                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0.25rem 0" }}>{log.chapter}</h3>
                                                <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.75rem" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600 }}>
                                                        <Clock size={16} color="#64748B" /> {log.minutes} min
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600 }}>
                                                        <Target size={16} color="#64748B" /> {log.questions} Qs
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => deleteLog(log.id)} style={{ background: "none", border: "none", color: "#EF4444", opacity: 0.3, cursor: "pointer" }}><Trash2 size={20} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>

                    {/* --- RIGHT: DAILY GOALS --- */}
                    <aside>
                        <div className="card" style={{ padding: "1.5rem", minHeight: "300px" }}>
                            <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <LayoutList size={18} color="var(--color-primary)" /> Daily Targets
                            </h3>
                            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
                                <input
                                    type="text"
                                    placeholder="eg: Revise genetics..."
                                    value={newGoal}
                                    onChange={e => setNewGoal(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && addGoal()}
                                    style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "0.85rem" }}
                                />
                                <button onClick={addGoal} style={{ padding: "8px", background: "var(--color-primary)", color: "white", border: "none", borderRadius: "8px" }}><Plus size={20} /></button>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {goals.map(goal => (
                                    <div
                                        key={goal.id}
                                        onClick={() => toggleGoal(goal.id)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.75rem",
                                            fontSize: "0.9rem",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            color: goal.done ? "#94A3B8" : "inherit",
                                            textDecoration: goal.done ? "line-through" : "none"
                                        }}
                                    >
                                        <div style={{ width: "20px", height: "20px", borderRadius: "4px", border: "2px solid var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", background: goal.done ? "var(--color-primary)" : "transparent" }}>
                                            {goal.done && <CheckCircle size={14} color="white" />}
                                        </div>
                                        {goal.text}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card" style={{ marginTop: "1.5rem", padding: "1.25rem", background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                <Sparkles size={16} color="#16A34A" />
                                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#166534" }}>DAILY STUDY TIP</span>
                            </div>
                            <p style={{ fontSize: "0.8rem", color: "#166534", margin: 0, lineHeight: 1.5 }}>
                                "Passive reading is not enough for NEET. Solve at least 10 MCQs immediately after finishing a topic to fix concepts."
                            </p>
                        </div>
                    </aside>

                </div>
            </div>
        </AppShell>
    );
}
