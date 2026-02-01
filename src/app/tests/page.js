"use client";

import { useState, useEffect, useMemo } from "react";
import AppShell from "@/components/AppShell";
import {
    Plus, TrendingUp, AlertCircle, CheckCircle, Target,
    ArrowUpRight, Award, Brain, Zap, Clock,
    ClipboardList, Trash2, ChevronRight, Activity,
    BarChart3, Sparkles, LayoutGrid, Timer, X
} from "lucide-react";
import { NEET_CHAPTERS } from "@/lib/constants";

// --- Premium Sub-Components ---

const SelectionMeter = ({ si }) => {
    const percentage = Math.min(Math.max(si * 100, 0), 100);
    const color = si > 0.85 ? "#10B981" : si > 0.75 ? "#F59E0B" : "#EF4444";

    return (
        <div className="card" style={{ padding: "1.5rem", background: "white", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-20px", right: "-20px", opacity: 0.05 }}>
                <Target size={100} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "0.8rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Selection Probability</h3>
                <Sparkles size={16} color={color} />
            </div>
            <div style={{ position: "relative", height: "10px", background: "#F1F5F9", borderRadius: "20px", marginBottom: "1rem" }}>
                <div style={{ width: `${percentage}%`, height: "100%", background: color, borderRadius: "20px", transition: "width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
                <span style={{ fontSize: "2rem", fontWeight: 900, color }}>{percentage.toFixed(1)}%</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94A3B8", marginBottom: "6px" }}>NEET Index</span>
            </div>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>
                {si > 0.85 ? "🔥 Safe Zone. Maintain your consistency." : si > 0.75 ? "⏳ Borderline. A small push will ensure selection!" : "⚠️ Danger Zone. Urgent study method overhaul required."}
            </p>
        </div>
    );
};

const HeatmapBadge = ({ chapter, count }) => (
    <div style={{
        padding: "6px 12px", borderRadius: "10px",
        background: count > 2 ? "#FFF1F2" : "#F8FAFC",
        color: count > 2 ? "#E11D48" : "#475569",
        border: `1px solid ${count > 2 ? "#FECDD3" : "#E2E8F0"}`,
        fontSize: "0.75rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem"
    }}>
        {chapter} <span style={{ opacity: 0.5 }}>•</span> {count} Mistakes
    </div>
);

export default function MockTestsPage() {
    const [tests, setTests] = useState([]);
    const [studyLogs, setStudyLogs] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showAI, setShowAI] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        name: 'NEET Full Mock Test',
        physics: '', chemistry: '', biology: '',
        incorrect: '',
        timeBio: '45', timeChem: '50', timePhy: '85',
        attemptOrder: 'Bio-Chem-Phy',
        mistakeBreakdown: []
    });

    const [currentMistake, setCurrentMistake] = useState({ subject: 'Biology', chapter: '', type: 'conceptual' });

    useEffect(() => {
        setMounted(true);
        const savedTests = localStorage.getItem('neet_tests_v6_hybrid');
        const savedLogs = localStorage.getItem('neet_study_logs');
        if (savedTests) {
            setTests(JSON.parse(savedTests));
        } else {
            const old = localStorage.getItem('neet_tests_v4_simple');
            if (old) setTests(JSON.parse(old));
        }
        if (savedLogs) setStudyLogs(JSON.parse(savedLogs));
    }, []);

    useEffect(() => {
        if (mounted) localStorage.setItem('neet_tests_v6_hybrid', JSON.stringify(tests));
    }, [tests, mounted]);

    const addMistake = () => {
        if (!currentMistake.chapter) return;
        setFormData({
            ...formData,
            mistakeBreakdown: [...formData.mistakeBreakdown, { ...currentMistake, id: Date.now() }]
        });
        setCurrentMistake({ ...currentMistake, chapter: '' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const score = Number(formData.physics) + Number(formData.chemistry) + Number(formData.biology);
        if (score > 720) return alert("Score cannot exceed 720!");

        const newEntry = {
            ...formData,
            id: editingId || Date.now(),
            score,
            physics: Number(formData.physics),
            chemistry: Number(formData.chemistry),
            biology: Number(formData.biology),
            incorrect: Number(formData.incorrect),
            timeBio: Number(formData.timeBio),
            timeChem: Number(formData.timeChem),
            timePhy: Number(formData.timePhy)
        };

        if (editingId) setTests(tests.map(t => t.id === editingId ? newEntry : t));
        else setTests([newEntry, ...tests]);

        setShowForm(false);
        setEditingId(null);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            name: 'NEET Full Mock Test',
            physics: '', chemistry: '', biology: '',
            incorrect: '',
            timeBio: '45', timeChem: '50', timePhy: '85',
            attemptOrder: 'Bio-Chem-Phy',
            mistakeBreakdown: []
        });
    };

    const stats = useMemo(() => {
        if (tests.length === 0) return null;
        const total = tests.reduce((acc, t) => acc + t.score, 0);
        const latest = tests[0];

        const correct = (latest.score + latest.incorrect) / 4;
        const attempted = correct + latest.incorrect;
        const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

        return {
            avg: Math.round(total / tests.length),
            highest: Math.max(...tests.map(t => t.score)),
            accuracy: accuracy.toFixed(1)
        };
    }, [tests]);

    const analysis = useMemo(() => {
        if (tests.length === 0) return null;
        const latest = tests[0];
        const insights = [];
        const actionPlan = [];

        const si = (latest.biology / 360 * 0.5) + (latest.chemistry / 180 * 0.3) + (latest.physics / 180 * 0.2);

        const correct = (latest.score + latest.incorrect) / 4;
        const attempted = correct + latest.incorrect;
        const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

        if (latest.score < 450) insights.push({ type: 'critical', tag: 'Overall', msg: 'Fundamental NCERT gaps detected. 15 days theory lockdown recommended.' });

        if (accuracy < 85) insights.push({ type: 'critical', tag: 'Accuracy', msg: `Efficiency Drop (${accuracy.toFixed(1)}%). Significant negative marking detected.` });
        else if (accuracy >= 95) insights.push({ type: 'success', tag: 'Accuracy', msg: 'Excellent Precision! Minimal negative marking.' });

        if (latest.biology < 320) insights.push({ type: 'warning', tag: 'Biology', msg: 'Biology score is below safety threshold. Re-read NCERT.' });
        if (latest.physics < 120) {
            insights.push({ type: 'critical', tag: 'Physics', msg: 'Physics numerical weakness. Solve 50 extra daily.' });
            actionPlan.push("Solve 50 Numericals for each wrong Physics chapter.");
        }

        if (latest.incorrect > 20) insights.push({ type: 'critical', tag: 'Negatives', msg: 'High incorrect attempts. Stop guessing patterns.' });

        const types = latest.mistakeBreakdown.reduce((a, m) => { a[m.type] = (a[m.type] || 0) + 1; return a; }, {});
        if (types.conceptual > 2) insights.push({ type: 'critical', tag: 'Theory', msg: 'Conceptual gaps detected. Review theory before solving.' });

        const heatmap = latest.mistakeBreakdown.reduce((a, m) => { a[m.chapter] = (a[m.chapter] || 0) + 1; return a; }, {});

        return { si, insights, actionPlan, heatmap };
    }, [tests, studyLogs]);

    if (!mounted) return null;

    return (
        <AppShell>
            <div style={{ maxWidth: "1250px", margin: "0 auto", paddingBottom: "5rem" }}>

                {/* --- Header Section --- */}
                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                            <div style={{ padding: "8px", background: "var(--color-primary-light)", borderRadius: "12px", color: "var(--color-primary)" }}><BarChart3 size={24} /></div>
                            <h1 style={{ fontSize: "2.5rem", fontWeight: 900, margin: 0 }}>Analytics Center</h1>
                        </div>
                        <p style={{ color: "var(--color-text-muted)", fontSize: "1rem", fontWeight: 500 }}>Deep-dive analysis of your mock test performance.</p>
                    </div>
                    <div style={{ display: "flex", gap: "1rem" }}>
                        <button onClick={() => setShowForm(true)} className="btn btn-primary" style={{ padding: "0 1.5rem", borderRadius: "12px", height: "52px", gap: "0.5rem", fontWeight: 700 }}>
                            <Plus size={20} /> Log New Test
                        </button>
                    </div>
                </header>

                {/* --- Top Dashboard Stats --- */}
                {tests.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
                        <SelectionMeter si={analysis.si} />

                        {/* ACCURACY METER */}
                        <div className="card" style={{ padding: "1.5rem", background: "white", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Test Accuracy</span>
                                <CheckCircle size={18} color={Number(stats.accuracy) > 90 ? "#10B981" : "#F59E0B"} />
                            </div>
                            <div style={{ fontSize: "2.2rem", fontWeight: 900, color: Number(stats.accuracy) > 90 ? "#10B981" : Number(stats.accuracy) > 80 ? "#F59E0B" : "#EF4444" }}>
                                {stats.accuracy}%
                            </div>
                            <div style={{ marginTop: "0.5rem", height: "8px", background: "#F1F5F9", borderRadius: "10px", overflow: "hidden" }}>
                                <div style={{ width: `${stats.accuracy}%`, height: "100%", background: Number(stats.accuracy) > 90 ? "#10B981" : "#F59E0B", borderRadius: "10px", transition: "width 1s ease" }} />
                            </div>
                        </div>

                        <div className="card" style={{ padding: "1.5rem", background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)", color: "white" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                                <span style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.6, textTransform: "uppercase" }}>Overall Performance</span>
                                <Activity size={18} color="#10B981" />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div>
                                    <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{stats.avg}</div>
                                    <div style={{ fontSize: "0.7rem", opacity: 0.5, fontWeight: 700 }}>Avg Score</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{stats.highest}</div>
                                    <div style={{ fontSize: "0.7rem", opacity: 0.5, fontWeight: 700 }}>Highest Score</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- AI MENTOR TRIGGER BOX --- */}
                {tests.length > 0 && (
                    <div
                        onClick={() => setShowAI(true)}
                        className="card hover-scale"
                        style={{
                            padding: "2rem", marginBottom: "2rem", cursor: "pointer",
                            background: "linear-gradient(135deg, #6366F1 0%, #4338CA 100%)",
                            color: "white", display: "flex", alignItems: "center", gap: "2rem",
                            boxShadow: "0 20px 40px -10px rgba(99, 102, 241, 0.4)"
                        }}
                    >
                        <div style={{ padding: "1rem", background: "rgba(255,255,255,0.1)", borderRadius: "20px" }}>
                            <Brain size={48} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                <span style={{ padding: "4px 12px", background: "rgba(255,255,255,0.2)", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 800 }}>AI MENTOR</span>
                                <Sparkles size={16} fill="white" />
                            </div>
                            <h2 style={{ fontSize: "1.75rem", fontWeight: 900, margin: 0 }}>Selection AI Analysis</h2>
                            <p style={{ opacity: 0.8, fontSize: "0.9rem", margin: "0.5rem 0 0" }}>Click here for your personalized 3-day action plan and critical insights.</p>
                        </div>
                        <ChevronRight size={32} />
                    </div>
                )}

                {/* --- Test History --- */}
                <div className="card" style={{ padding: "0" }}>
                    <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Mock Test History</h3>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>Total: {tests.length} Entries</span>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "#F8FAFC", textAlign: "left" }}>
                                    <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", fontWeight: 800, color: "#64748B" }}>TEST DETAILS</th>
                                    <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", fontWeight: 800, color: "#64748B" }}>SCORES</th>
                                    <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", fontWeight: 800, color: "#64748B" }}>INCORRECT</th>
                                    <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", fontWeight: 800, color: "#64748B" }}>DURATION</th>
                                    <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", fontWeight: 800, color: "#64748B", textAlign: "right" }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tests.map(test => (
                                    <tr key={test.id} style={{ borderTop: "1px solid #F1F5F9" }}>
                                        <td style={{ padding: "1.25rem 1.5rem" }}>
                                            <div style={{ fontWeight: 800, fontSize: "1rem" }}>{test.name}</div>
                                            <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>{test.date} • {test.attemptOrder}</div>
                                        </td>
                                        <td style={{ padding: "1.25rem 1.5rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <div style={{ fontSize: "1.1rem", fontWeight: 900 }}>{test.score}</div>
                                                <div style={{ fontSize: "0.7rem", color: "#64748B" }}>/ 720</div>
                                            </div>
                                            <div style={{ fontSize: "0.7rem", display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                                                <span style={{ color: "#3B82F6" }}>Phy: {test.physics}</span>
                                                <span style={{ color: "#10B981" }}>Chem: {test.chemistry}</span>
                                                <span style={{ color: "#EF4444" }}>Bio: {test.biology}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "1.25rem 1.5rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: test.incorrect > 15 ? "#EF4444" : "#10B981", fontWeight: 800 }}>
                                                {test.incorrect} Incorrect
                                            </div>
                                        </td>
                                        <td style={{ padding: "1.25rem 1.5rem" }}>
                                            <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{test.timeBio + test.timeChem + test.timePhy} mins</div>
                                        </td>
                                        <td style={{ padding: "1.25rem 1.5rem", textAlign: "right" }}>
                                            <button onClick={() => { setEditingId(test.id); setFormData(test); setShowForm(true); }} style={{ background: "none", border: "none", color: "#3B82F6", padding: "8px", cursor: "pointer" }}><ChevronRight size={20} /></button>
                                            <button onClick={() => setTests(tests.filter(t => t.id !== test.id))} style={{ background: "none", border: "none", color: "#EF4444", padding: "8px", cursor: "pointer", opacity: 0.5 }}><Trash2 size={20} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {tests.length === 0 && (
                            <div style={{ textAlign: "center", padding: "5rem" }}>
                                <ClipboardList size={64} style={{ opacity: 0.1, margin: "0 auto 1rem" }} />
                                <h3 style={{ fontSize: "1.25rem", color: "#64748B" }}>No test data available.</h3>
                                <p style={{ color: "#94A3B8" }}>Log your first mock test to begin AI analysis.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- MOCK TEST FORM MODAL --- */}
                {showForm && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "2rem" }}>
                        <div className="card" style={{ width: "100%", maxWidth: "850px", maxHeight: "90vh", overflowY: "auto", padding: "2.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                                <h2 style={{ fontSize: "1.5rem", fontWeight: 900 }}>{editingId ? "Edit Mock Test" : "Log New Test Result"}</h2>
                                <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{ background: "none", border: "none", opacity: 0.5, cursor: "pointer" }}><Trash2 size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                    <div>
                                        <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748B" }}>TEST NAME</label>
                                        <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", padding: "1rem", borderRadius: "12px", border: "1px solid #E2E8F0", marginTop: "0.5rem" }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748B" }}>DATE</label>
                                        <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} style={{ width: "100%", padding: "1rem", borderRadius: "12px", border: "1px solid #E2E8F0", marginTop: "0.5rem" }} />
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: "0.9rem", fontWeight: 800, marginBottom: "1rem", color: "var(--color-primary)" }}>Subject Scores</h3>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1.25rem" }}>
                                        <div style={{ background: "#F0F9FF", padding: "1rem", borderRadius: "15px" }}>
                                            <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#0369A1" }}>BIOLOGY (360)</label>
                                            <input type="number" required placeholder="0" value={formData.biology} onChange={e => setFormData({ ...formData, biology: e.target.value })} style={{ width: "100%", background: "transparent", border: "none", borderBottom: "2px solid #BAE6FD", fontSize: "1.25rem", fontWeight: 900, marginTop: "0.5rem" }} />
                                        </div>
                                        <div style={{ background: "#F0FDF4", padding: "1rem", borderRadius: "15px" }}>
                                            <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#15803D" }}>CHEMISTRY (180)</label>
                                            <input type="number" required placeholder="0" value={formData.chemistry} onChange={e => setFormData({ ...formData, chemistry: e.target.value })} style={{ width: "100%", background: "transparent", border: "none", borderBottom: "2px solid #BBF7D0", fontSize: "1.25rem", fontWeight: 900, marginTop: "0.5rem" }} />
                                        </div>
                                        <div style={{ background: "#FEF2F2", padding: "1rem", borderRadius: "15px" }}>
                                            <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#B91C1C" }}>PHYSICS (180)</label>
                                            <input type="number" required placeholder="0" value={formData.physics} onChange={e => setFormData({ ...formData, physics: e.target.value })} style={{ width: "100%", background: "transparent", border: "none", borderBottom: "2px solid #FECDD3", fontSize: "1.25rem", fontWeight: 900, marginTop: "0.5rem" }} />
                                        </div>
                                        <div style={{ background: "#F8FAFC", padding: "1rem", borderRadius: "15px" }}>
                                            <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#475569" }}>INCORRECT</label>
                                            <input type="number" required placeholder="0" value={formData.incorrect} onChange={e => setFormData({ ...formData, incorrect: e.target.value })} style={{ width: "100%", background: "transparent", border: "none", borderBottom: "2px solid #E2E8F0", fontSize: "1.25rem", fontWeight: 900, marginTop: "0.5rem" }} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: "0.9rem", fontWeight: 800, marginBottom: "1rem", color: "var(--color-primary)" }}>Mistake Tracker (AI Training)</h3>
                                    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", marginBottom: "1rem" }}>
                                        <div style={{ flex: 1 }}>
                                            <select value={currentMistake.subject} onChange={e => setCurrentMistake({ ...currentMistake, subject: e.target.value, chapter: '' })} style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                                                {Object.keys(NEET_CHAPTERS).map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ flex: 1.5 }}>
                                            <select value={currentMistake.chapter} onChange={e => setCurrentMistake({ ...currentMistake, chapter: e.target.value })} style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                                                <option value="">Select Chapter</option>
                                                {NEET_CHAPTERS[currentMistake.subject].map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <select value={currentMistake.type} onChange={e => setCurrentMistake({ ...currentMistake, type: e.target.value })} style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                                                <option value="conceptual">Conceptual Gap</option>
                                                <option value="silly">Silly Mistake</option>
                                                <option value="calc">Calculation Error</option>
                                            </select>
                                        </div>
                                        <button type="button" onClick={addMistake} style={{ padding: "0.5rem 1.5rem", borderRadius: "8px", background: "#475569", color: "white", border: "none", fontWeight: 700 }}>Add</button>
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                        {formData.mistakeBreakdown.map(m => (
                                            <div key={m.id} style={{ padding: "4px 10px", background: "#F1F5F9", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                {m.chapter} ({m.type})
                                                <X size={12} color="#EF4444" style={{ cursor: "pointer" }} onClick={() => setFormData({ ...formData, mistakeBreakdown: formData.mistakeBreakdown.filter(i => i.id !== m.id) })} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary" style={{ height: "60px", borderRadius: "15px", fontSize: "1.1rem", fontWeight: 900 }}>
                                    {editingId ? "Update Test Data" : "Save Test Result"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* --- AI DEEP ANALYSIS MODAL --- */}
                {showAI && analysis && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(255, 255, 255, 0.95)", zIndex: 200, padding: "2rem", overflowY: "auto" }}>
                        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
                                <div>
                                    <h1 style={{ fontSize: "2.5rem", fontWeight: 900, background: "linear-gradient(to right, #6366F1, #EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>NEET Selection AI</h1>
                                    <p style={{ color: "#64748B", fontSize: "1.1rem", fontWeight: 500 }}>Advanced Analysis and Mentorship Plan</p>
                                </div>
                                <button onClick={() => setShowAI(false)} style={{ padding: "12px", background: "#F1F5F9", borderRadius: "15px", border: "none", cursor: "pointer" }}><Trash2 size={24} /></button>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <AlertCircle size={24} color="#6366F1" /> Performance Insights
                                    </h3>
                                    {analysis.insights.map((insight, i) => (
                                        <div key={i} style={{
                                            padding: "1.5rem", borderRadius: "20px",
                                            background: insight.type === 'critical' ? '#FFF1F2' : insight.type === 'warning' ? '#FFFBEB' : '#F0FDF4',
                                            border: `1px solid ${insight.type === 'critical' ? '#FECDD3' : '#FDE68A'}`,
                                            display: "flex", gap: "1.25rem"
                                        }}>
                                            <div style={{
                                                width: "40px", height: "40px", borderRadius: "10px",
                                                background: "white", display: "flex", alignItems: "center", justifyContent: "center",
                                                color: insight.type === 'critical' ? '#E11D48' : '#D97706',
                                                boxShadow: "0 5px 10px rgba(0,0,0,0.05)"
                                            }}>
                                                {insight.type === 'critical' ? <Zap size={20} /> : <AlertCircle size={20} />}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", opacity: 0.6 }}>{insight.tag}</div>
                                                <p style={{ margin: "5px 0 0", fontSize: "1.05rem", fontWeight: 700, lineHeight: 1.4 }}>{insight.msg}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                                    <div className="card" style={{ padding: "1.5rem", background: "#F8FAFC" }}>
                                        <h3 style={{ fontSize: "1rem", fontWeight: 900, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <LayoutGrid size={20} /> Chapter Heatmap
                                        </h3>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                                            {Object.entries(analysis.heatmap).map(([chapter, count]) => (
                                                <HeatmapBadge key={chapter} chapter={chapter} count={count} />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="card" style={{ padding: "2rem", background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", color: "white" }}>
                                        <h3 style={{ fontSize: "1.1rem", fontWeight: 900, marginBottom: "1.5rem", color: "#6366F1" }}>3-Day Action Plan</h3>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                            {analysis.actionPlan.map((plan, i) => (
                                                <div key={i} style={{ display: "flex", gap: "1rem" }}>
                                                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#6366F1" }}>{i + 1}.</div>
                                                    <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, opacity: 0.9 }}>{plan}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="btn btn-primary" style={{ width: "100%", marginTop: "2rem", height: "50px", borderRadius: "12px", background: "#6366F1" }}>Acknowledge Plan</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
}

