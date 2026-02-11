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
import { auth } from "@/lib/firebase";
import api, { getCookie, setCookie, removeCookie } from "@/lib/api";
import { createPortal } from "react-dom";

// --- Premium Sub-Components ---

const SelectionMeter = ({ si }) => {
    const percentage = Math.min(Math.max(si * 100, 0), 100);
    const color = si > 0.85 ? "#10B981" : si > 0.75 ? "#F59E0B" : "#EF4444";

    return (
        <div className="premium-card" style={{ padding: "1.75rem", background: "white" }}>
            <div style={{ position: "absolute", top: "-15px", right: "-15px", opacity: 0.08, color, animation: "float 6s ease-in-out infinite" }}>
                <Target size={90} strokeWidth={3} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h3 style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Selection Probability</h3>
                <div style={{ padding: "6px", background: `${color}15`, borderRadius: "8px", animation: "pulse-soft 2s infinite" }}>
                    <Sparkles size={16} color={color} fill={color} />
                </div>
            </div>
            <div style={{ position: "relative", height: "12px", background: "#F1F5F9", borderRadius: "20px", marginBottom: "1.25rem", overflow: "hidden" }}>
                <div style={{ width: `${percentage}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}dd)`, borderRadius: "20px", transition: "width 1.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
                <span style={{ fontSize: "2.75rem", fontWeight: 950, color, letterSpacing: "-0.04em" }}>{percentage.toFixed(0)}<span style={{ fontSize: "1.25rem", opacity: 0.6 }}>%</span></span>
                <div style={{ marginBottom: "8px" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--text-main)" }}>NEET INDEX</div>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase" }}>Calculated Score</div>
                </div>
            </div>
            <div style={{
                marginTop: "1.25rem", padding: "12px", borderRadius: "14px",
                background: `${color}08`, borderLeft: `4px solid ${color}`,
                fontSize: "0.8rem", fontWeight: 700, color: "var(--text-main)", lineHeight: 1.4
            }}>
                {si > 0.85 ? "🔥 Safe Zone. Excellent performance." : si > 0.75 ? "⏳ Borderline. Push slightly more!" : "⚠️ Warning. Theory review needed."}
            </div>
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
        const fetchTests = async () => {
            const token = typeof window !== 'undefined' ? getCookie('token') : null;
            if (!token) return;

            try {
                const response = await api.get('/mock-tests/');
                // Map snake_case from backend to camelCase for frontend
                const mappedData = response.data.map(t => ({
                    ...t,
                    timeBio: t.time_bio,
                    timeChem: t.time_chem,
                    timePhy: t.time_phy,
                    attemptOrder: t.attempt_order,
                    mistakeBreakdown: t.mistake_breakdown || []
                }));
                setTests(mappedData);
            } catch (err) {
                if (err.response?.status !== 401) {
                    console.error("Failed to fetch tests", err);
                }
            }
        };
        fetchTests();
    }, []);

    const addMistake = () => {
        if (!currentMistake.chapter) return;
        setFormData({
            ...formData,
            mistakeBreakdown: [...formData.mistakeBreakdown, { ...currentMistake, id: Date.now() }]
        });
        setCurrentMistake({ ...currentMistake, chapter: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const score = Number(formData.physics) + Number(formData.chemistry) + Number(formData.biology);
        if (score > 720) return alert("Score cannot exceed 720!");

        const payload = {
            name: formData.name,
            date: formData.date,
            score,
            physics: Number(formData.physics),
            chemistry: Number(formData.chemistry),
            biology: Number(formData.biology),
            incorrect: Number(formData.incorrect),
            time_bio: Number(formData.timeBio),
            time_chem: Number(formData.timeChem),
            time_phy: Number(formData.timePhy),
            attempt_order: formData.attemptOrder,
            mistake_breakdown: formData.mistakeBreakdown
        };

        try {
            if (editingId) {
                const res = await api.put(`/mock-tests/${editingId}/`, payload);
                setTests(tests.map(t => t.id === editingId ? { ...res.data, timeBio: res.data.time_bio, timeChem: res.data.time_chem, timePhy: res.data.time_phy, attemptOrder: res.data.attempt_order, mistakeBreakdown: res.data.mistake_breakdown } : t));
            } else {
                const res = await api.post('/mock-tests/', payload);
                setTests([{ ...res.data, timeBio: res.data.time_bio, timeChem: res.data.time_chem, timePhy: res.data.time_phy, attemptOrder: res.data.attempt_order, mistakeBreakdown: res.data.mistake_breakdown }, ...tests]);
            }
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
        } catch (err) {
            alert("Failed to save test. Please check if you are logged in.");
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this test?")) return;
        try {
            await api.delete(`/mock-tests/${id}/`);
            setTests(tests.filter(t => t.id !== id));
        } catch (err) {
            alert("Failed to delete test.");
        }
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

        const types = (latest.mistakeBreakdown || []).reduce((a, m) => { a[m.type] = (a[m.type] || 0) + 1; return a; }, {});
        if (types.conceptual > 2) insights.push({ type: 'critical', tag: 'Theory', msg: 'Conceptual gaps detected. Review theory before solving.' });

        const heatmap = (latest.mistakeBreakdown || []).reduce((a, m) => { a[m.chapter] = (a[m.chapter] || 0) + 1; return a; }, {});

        return { si, insights, actionPlan, heatmap };
    }, [tests, studyLogs]);

    if (!mounted) return null;

    return (
        <AppShell>
            <div className="test-page-container">

                {/* --- Header Section --- */}
                <header className="test-page-header">
                    <div className="header-left">
                        <div className="title-row">
                            <div className="icon-badge"><BarChart3 size={24} /></div>
                            <h1>Analytics Center</h1>
                        </div>
                        <p>Deep-dive analysis of your mock test performance.</p>
                    </div>
                    <div className="header-actions">
                        <button onClick={() => setShowForm(true)} className="log-test-btn">
                            <Plus size={20} /> Log New Test
                        </button>
                    </div>
                </header>

                {/* --- Top Dashboard Stats --- */}
                {tests.length > 0 && (
                    <div className="stats-grid">
                        <SelectionMeter si={analysis.si} />

                        {/* ACCURACY METER */}
                        <div className="premium-card" style={{ padding: "1.75rem", background: "white", display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                                <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Test Accuracy</span>
                                <div style={{ padding: "8px", background: Number(stats.accuracy) > 90 ? "#f0fdf4" : "#fffbeb", borderRadius: "10px" }}>
                                    <CheckCircle size={18} color={Number(stats.accuracy) > 90 ? "#10B981" : "#F59E0B"} />
                                </div>
                            </div>
                            <div style={{ fontSize: "2.5rem", fontWeight: 950, color: "var(--text-main)", letterSpacing: "-0.03em" }}>
                                {stats.accuracy}<span style={{ fontSize: "1.25rem", color: "var(--text-light)" }}>%</span>
                            </div>
                            <div style={{ marginTop: "1rem" }}>
                                <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "20px", overflow: "hidden" }}>
                                    <div style={{ width: `${stats.accuracy}%`, height: "100%", background: `linear-gradient(90deg, ${Number(stats.accuracy) > 90 ? '#10B981, #34D399' : '#F59E0B, #FBBF24'})`, borderRadius: "20px", transition: "width 1.5s ease" }} />
                                </div>
                                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-light)", marginTop: "10px" }}>
                                    Target 95% for top Government GMCs
                                </p>
                            </div>
                        </div>

                        <div className="premium-card" style={{ padding: "1.75rem", background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)", color: "white" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                                <span style={{ fontSize: "0.75rem", fontWeight: 850, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Performance Track</span>
                                <div style={{ padding: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "10px" }}>
                                    <Activity size={18} color="#10B981" />
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                <div>
                                    <div style={{ fontSize: "2.5rem", fontWeight: 950, letterSpacing: "-0.03em" }}>{stats.avg}</div>
                                    <div style={{ fontSize: "0.7rem", opacity: 0.5, fontWeight: 800, textTransform: "uppercase" }}>Avg Score</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#10B981" }}>{stats.highest}</div>
                                    <div style={{ fontSize: "0.7rem", opacity: 0.5, fontWeight: 800, textTransform: "uppercase" }}>Best Ever</div>
                                </div>
                            </div>
                            <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "0.75rem", fontWeight: 600, opacity: 0.6 }}>
                                Calculated across {tests.length} tests
                            </div>
                        </div>
                    </div>
                )}

                {/* --- AI MENTOR TRIGGER BOX --- */}
                {tests.length > 0 && (
                    <div
                        onClick={() => setShowAI(true)}
                        className="premium-card hover-trigger"
                        style={{
                            padding: "2.5rem", marginBottom: "2.5rem", cursor: "pointer",
                            background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
                            color: "white", display: "flex", alignItems: "center", gap: "2.5rem",
                            boxShadow: "0 25px 60px -12px rgba(79, 70, 229, 0.45)",
                            border: "none"
                        }}
                    >
                        <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.12)", borderRadius: "24px", backdropFilter: "blur(10px)" }}>
                            <Brain size={56} strokeWidth={1.5} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                <span style={{ padding: "5px 14px", background: "rgba(255,255,255,0.2)", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.05em" }}>NEET MENTOR AI</span>
                                <div style={{ display: "flex", gap: "4px" }}>
                                    <Sparkles size={16} fill="white" />
                                    <Sparkles size={10} fill="white" style={{ opacity: 0.6 }} />
                                </div>
                            </div>
                            <h2 style={{ fontSize: "2rem", fontWeight: 950, margin: 0, letterSpacing: "-0.03em" }}>Selection Strategy Analysis</h2>
                            <p style={{ opacity: 0.85, fontSize: "1rem", fontWeight: 600, margin: "0.5rem 0 0", maxWidth: "600px" }}>
                                Our AI has analyzed your recent mocks. Click for your personalized 3-day recovery sprint and chapter-wise focus areas.
                            </p>
                        </div>
                        <div className="arrow-circle">
                            <ChevronRight size={32} />
                        </div>
                    </div>
                )}

                {/* --- Test History --- */}
                <div className="table-card">
                    <div className="table-header">
                        <h3>Mock Test History</h3>
                        <span className="total-badge">Total: {tests.length} Entries</span>
                    </div>
                    <div className="table-scroll-wrapper">
                        <table className="test-history-table">
                            <thead>
                                <tr>
                                    <th>TEST DETAILS</th>
                                    <th>SCORES</th>
                                    <th>INCORRECT</th>
                                    <th>DURATION</th>
                                    <th style={{ textAlign: "right" }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tests.map(test => (
                                    <tr key={test.id}>
                                        <td>
                                            <div className="test-name-cell">{test.name}</div>
                                            <div className="test-meta-cell">{test.date} • {test.attemptOrder}</div>
                                        </td>
                                        <td>
                                            <div className="score-main-cell">
                                                <strong>{test.score}</strong>
                                                <span>/ 720</span>
                                            </div>
                                            <div className="score-sub-cell">
                                                <span className="phy">P: {test.physics}</span>
                                                <span className="chem">C: {test.chemistry}</span>
                                                <span className="bio">B: {test.biology}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`incorrect-cell ${test.incorrect > 15 ? 'high' : 'low'}`}>
                                                {test.incorrect} Incr
                                            </div>
                                        </td>
                                        <td>
                                            <div className="duration-cell">{test.timeBio + test.timeChem + test.timePhy}m</div>
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            <div className="action-btns">
                                                <button onClick={() => { setEditingId(test.id); setFormData(test); setShowForm(true); }} className="edit-btn"><ChevronRight size={18} /></button>
                                                <button onClick={() => handleDelete(test.id)} className="del-btn"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {tests.length === 0 && (
                            <div className="empty-history">
                                <div className="empty-icon-wrapper">
                                    <ClipboardList size={48} strokeWidth={2.5} />
                                </div>
                                <h3>Your Analytics Await</h3>
                                <p>Log your first mock test to unlock AI-driven selection insights and daily action plans.</p>
                                <button onClick={() => setShowForm(true)} className="log-test-btn" style={{ marginTop: "1rem" }}>
                                    <Plus size={20} /> Get Started Now
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- MOCK TEST FORM MODAL --- */}
                {showForm && createPortal(
                    <div className="test-modal-overlay">
                        <div className="test-modal-card">
                            <div className="modal-header">
                                <h2>{editingId ? "Edit Mock Test" : "New Test Result"}</h2>
                                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="close-modal-btn"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="test-form">
                                <div className="form-grid-top">
                                    <div className="form-field">
                                        <label>TEST NAME</label>
                                        <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Major Test 04" />
                                    </div>
                                    <div className="form-field">
                                        <label>DATE</label>
                                        <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                    </div>
                                </div>

                                <div className="score-section">
                                    <h3>Subject Scores</h3>
                                    <div className="scores-grid-proper">
                                        <div className="score-box bio">
                                            <label>BIOLOGY (360)</label>
                                            <input type="number" required placeholder="0" value={formData.biology} onChange={e => setFormData({ ...formData, biology: e.target.value })} />
                                        </div>
                                        <div className="score-box chem">
                                            <label>CHEMISTRY (180)</label>
                                            <input type="number" required placeholder="0" value={formData.chemistry} onChange={e => setFormData({ ...formData, chemistry: e.target.value })} />
                                        </div>
                                        <div className="score-box phy">
                                            <label>PHYSICS (180)</label>
                                            <input type="number" required placeholder="0" value={formData.physics} onChange={e => setFormData({ ...formData, physics: e.target.value })} />
                                        </div>
                                        <div className="score-box neg">
                                            <label>INCORRECT</label>
                                            <input type="number" required placeholder="0" value={formData.incorrect} onChange={e => setFormData({ ...formData, incorrect: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="mistake-tracker-section">
                                    <h3>Mistake Tracker (AI Analysis)</h3>
                                    <div className="mistake-input-row">
                                        <select value={currentMistake.subject} onChange={e => setCurrentMistake({ ...currentMistake, subject: e.target.value, chapter: '' })}>
                                            {Object.keys(NEET_CHAPTERS).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <select value={currentMistake.chapter} onChange={e => setCurrentMistake({ ...currentMistake, chapter: e.target.value })}>
                                            <option value="">Select Chapter</option>
                                            {NEET_CHAPTERS[currentMistake.subject].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <select value={currentMistake.type} onChange={e => setCurrentMistake({ ...currentMistake, type: e.target.value })}>
                                            <option value="conceptual">Conceptual Gap</option>
                                            <option value="silly">Silly Mistake</option>
                                            <option value="calc">Calculation Error</option>
                                        </select>
                                        <button type="button" onClick={addMistake} className="add-mistake-btn">Add</button>
                                    </div>
                                    <div className="mistake-tags-cloud">
                                        {formData.mistakeBreakdown.map(m => (
                                            <div key={m.id} className="mistake-tag">
                                                {m.chapter} ({m.type.charAt(0)})
                                                <X size={14} onClick={() => setFormData({ ...formData, mistakeBreakdown: formData.mistakeBreakdown.filter(i => i.id !== m.id) })} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="save-test-btn-proper">
                                    {editingId ? "Update Test Data" : "Save Test Result"}
                                </button>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}

                {/* --- AI DEEP ANALYSIS MODAL --- */}
                {showAI && analysis && createPortal(
                    <div className="ai-modal-overlay">
                        <div className="ai-modal-container">
                            <header className="ai-modal-header">
                                <div className="header-text">
                                    <h1 className="ai-gradient-title">NEET Selection AI</h1>
                                    <p className="ai-subtitle">Advanced Analysis & Mentorship</p>
                                </div>
                                <button onClick={() => setShowAI(false)} className="ai-close-btn"><X size={24} /></button>
                            </header>

                            <div className="ai-content-grid">
                                <div className="ai-left-column">
                                    <div className="column-header">
                                        <Activity size={20} color="#6366F1" />
                                        <h3>Performance Insights</h3>
                                    </div>
                                    <div className="insights-stack">
                                        {analysis.insights.map((insight, i) => (
                                            <div key={i} className={`insight-card ${insight.type}`}>
                                                <div className="insight-icon">
                                                    {insight.type === 'critical' ? <Zap size={20} /> : <AlertCircle size={20} />}
                                                </div>
                                                <div className="insight-body">
                                                    <span className="insight-tag">{insight.tag}</span>
                                                    <p>{insight.msg}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="ai-right-column">
                                    <div className="heatmap-section-card">
                                        <div className="column-header">
                                            <LayoutGrid size={20} />
                                            <h3>Chapter Heatmap</h3>
                                        </div>
                                        <div className="heatmap-badges">
                                            {Object.entries(analysis.heatmap).map(([chapter, count]) => (
                                                <HeatmapBadge key={chapter} chapter={chapter} count={count} />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="action-plan-card">
                                        <div className="plan-header">
                                            <Sparkles size={18} color="#818cf8" />
                                            <h3>3-Day Action Plan</h3>
                                        </div>
                                        <div className="plan-list">
                                            {analysis.actionPlan.map((plan, i) => (
                                                <div key={i} className="plan-item">
                                                    <span className="step-num">{i + 1}</span>
                                                    <p>{plan}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => setShowAI(false)} className="acknowledge-btn">Acknowledge Plan</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
                <style jsx>{`
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
                        --shadow-lift: 0 12px 35px rgba(79, 70, 229, 0.1);
                    }

                    .test-page-container { maxWidth: 1250px; margin: 0 auto; padding: 0 1.5rem 5rem 1.5rem; background: var(--bg-page); min-height: 100vh; }
                    
                    .test-page-header { display: flex; justify-content: space-between; align-items: flex-end; margin: 2rem 0 2.5rem 0; }
                    .header-left .title-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
                    .icon-badge { padding: 10px; background: #eef2ff; border-radius: 14px; color: #4f46e5; display: flex; box-shadow: var(--shadow-soft); }
                    .header-left h1 { fontSize: 2.5rem; fontWeight: 900; margin: 0; letter-spacing: -0.04em; color: var(--text-main); }
                    .header-left p { color: var(--text-muted); fontSize: 1.1rem; fontWeight: 500; }
                    
                    .log-test-btn { 
                        background: var(--primary); color: white; border: none; padding: 0 1.75rem; borderRadius: 16px; height: 54px; 
                        display: flex; align-items: center; gap: 8px; fontWeight: 800; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25); 
                    }
                    .log-test-btn:hover { background: #4338ca; transform: translateY(-3px) scale(1.02); box-shadow: 0 12px 30px rgba(79, 70, 229, 0.35); }

                    .premium-card { 
                        background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border); 
                        box-shadow: var(--shadow-soft); transition: all 0.4s ease; overflow: hidden; position: relative;
                    }
                    .premium-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-lift); border-color: var(--primary-glow); }

                    /* History Table */
                    .table-card { background: white; border-radius: var(--radius-lg); border: 1px solid var(--border); box-shadow: var(--shadow-soft); overflow: hidden; margin-top: 2rem; }
                    .table-header { padding: 1.75rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: #fff; }
                    .table-header h3 { margin: 0; fontSize: 1.25rem; fontWeight: 900; color: var(--text-main); }
                    .total-badge { font-size: 0.75rem; font-weight: 800; color: var(--primary); background: #eef2ff; padding: 6px 14px; border-radius: 10px; }
                    
                    .table-scroll-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
                    .test-history-table { width: 100%; border-collapse: collapse; min-width: 850px; }
                    .test-history-table th { background: #fcfdfe; padding: 1.25rem 1.75rem; text-align: left; font-size: 0.725rem; font-weight: 900; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.1em; }
                    .test-history-table td { padding: 1.5rem 1.75rem; border-top: 1px solid var(--border); vertical-align: middle; transition: background 0.2s; }
                    .test-history-table tr:hover td { background: #fafbfc; }
                    
                    .test-name-cell { font-weight: 900; font-size: 1.05rem; color: var(--text-main); margin-bottom: 2px; }
                    .test-meta-cell { font-size: 0.8rem; color: var(--text-light); font-weight: 600; }
                    .score-main-cell { display: flex; align-items: baseline; gap: 4px; }
                    .score-main-cell strong { font-size: 1.35rem; font-weight: 900; color: var(--text-main); }
                    .score-main-cell span { font-size: 0.75rem; font-weight: 700; color: var(--text-light); }
                    .score-sub-cell { display: flex; gap: 10px; font-size: 0.7rem; font-weight: 850; margin-top: 6px; }
                    .score-sub-cell .phy { color: #3b82f6; }
                    .score-sub-cell .chem { color: #10b981; }
                    .score-sub-cell .bio { color: #ef4444; }
                    
                    .incorrect-cell { font-weight: 900; font-size: 0.85rem; padding: 6px 12px; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px; }
                    .incorrect-cell.high { background: #fef2f2; color: #ef4444; }
                    .incorrect-cell.low { background: #f0fdf4; color: #10b981; }
                    
                    .duration-cell { font-weight: 800; color: var(--text-muted); font-size: 0.9rem; }

                    .action-btns { display: flex; gap: 10px; justify-content: flex-end; }
                    .action-btns button { background: #f8fafc; border: 1px solid var(--border); width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                    .edit-btn { color: var(--primary); }
                    .edit-btn:hover { background: #eef2ff; transform: scale(1.15); border-color: var(--primary); }
                    .del-btn { color: var(--text-light); opacity: 0.7; }
                    .del-btn:hover { color: #ef4444; background: #fef2f2; opacity: 1; transform: scale(1.15); border-color: #fecdd3; }

                    .empty-history { 
                        textAlign: center; padding: 6rem 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem;
                        background: radial-gradient(circle at center, #fff 0%, #fafbfc 100%);
                    }
                    .empty-history h3 { font-size: 1.5rem; font-weight: 900; color: var(--text-main); margin: 0; }
                    .empty-history p { color: var(--text-light); font-weight: 600; margin: 0; }
                    .empty-icon-wrapper { width: 100px; height: 100px; background: #eef2ff; border-radius: 30px; display: flex; align-items: center; justify-content: center; color: var(--primary); margin-bottom: 0.5rem; transform: rotate(-5deg); box-shadow: 0 15px 30px rgba(79, 70, 229, 0.1); }

                    /* Modal Styles */
                    .test-modal-overlay { 
                        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
                        background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(12px); 
                        display: flex; align-items: center; justify-content: center; 
                        z-index: 2147483647; padding: 2rem; 
                    }
                    .test-modal-card { 
                        width: 100%; max-width: 750px; max-height: 85vh; 
                        background: white; border-radius: 32px; 
                        box-shadow: 0 40px 100px -20px rgba(0,0,0,0.3); 
                        overflow-y: auto; padding: 3rem; 
                        position: relative; 
                        animation: modalEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                        border: 1px solid rgba(0,0,0,0.05);
                    }
                    @keyframes modalEnter { from { opacity: 0; transform: translateY(30px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                    
                    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
                    .modal-header h2 { font-size: 1.75rem; font-weight: 800; color: var(--text-main); margin: 0; letter-spacing: -0.02em; }
                    .close-modal-btn { background: #f1f5f9; border: none; padding: 8px; border-radius: 50%; color: var(--text-muted); cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
                    .close-modal-btn:hover { background: #e2e8f0; color: var(--text-main); transform: rotate(90deg); }

                    .test-form { display: flex; flex-direction: column; gap: 2.5rem; }
                    .form-grid-top { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                    .form-field { display: flex; flex-direction: column; gap: 10px; }
                    .form-field label { font-size: 0.75rem; font-weight: 850; color: var(--text-light); letter-spacing: 0.1em; text-transform: uppercase; }
                    .form-field input { padding: 16px; border-radius: 16px; border: 2px solid #f1f5f9; background: #fff; font-size: 1rem; font-weight: 700; outline: none; transition: all 0.25s; color: var(--text-main); }
                    .form-field input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-glow); }

                    .score-section h3, .mistake-tracker-section h3 { font-size: 0.95rem; font-weight: 900; color: var(--primary); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 8px; }
                    .scores-grid-proper { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
                    .score-box { padding: 1.25rem; border-radius: 20px; display: flex; flex-direction: column; gap: 10px; border: 1px solid transparent; transition: transform 0.3s ease; }
                    .score-box:hover { transform: translateY(-4px); }
                    .score-box label { font-size: 0.65rem; font-weight: 900; }
                    .score-box input { background: transparent; border: none; border-bottom: 2.5px solid rgba(0,0,0,0.08); font-size: 1.75rem; font-weight: 950; padding: 6px 0; outline: none; width: 100%; transition: border-color 0.3s; }
                    
                    .bio { background: #f0fdf4; color: #15803d; border-color: #dcfce7; } .bio input { color: #15803d; border-color: #bbf7d0; }
                    .chem { background: #f0f9ff; color: #0369a1; border-color: #e0f2fe; } .chem input { color: #0369a1; border-color: #bae6fd; }
                    .phy { background: #fef2f2; color: #b91c1c; border-color: #fee2e2; } .phy input { color: #b91c1c; border-color: #fecdd3; }
                    .neg { background: #f8fafc; color: #475569; border-color: #f1f5f9; } .neg input { color: #475569; border-color: #e2e8f0; }

                    .mistake-tracker-section { padding: 2rem; background: #fafbfc; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
                    .mistake-input-row { display: grid; grid-template-columns: 1fr 1fr 1fr 90px; gap: 1rem; align-items: center; margin-bottom: 1.5rem; }
                    .mistake-input-row select { padding: 14px; border-radius: 14px; border: 2px solid #f1f5f9; font-size: 0.9rem; font-weight: 700; color: #475569; outline: none; background: white; cursor: pointer; transition: border-color 0.2s; }
                    .mistake-input-row select:focus { border-color: var(--primary); }
                    .add-mistake-btn { height: 48px; background: #1e293b; color: white; border: none; border-radius: 12px; font-weight: 900; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                    .add-mistake-btn:hover { background: #000; transform: scale(1.04); box-shadow: 0 8px 16px rgba(0,0,0,0.2); }

                    .mistake-tags-cloud { display: flex; flexWrap: wrap; gap: 10px; }
                    .mistake-tag { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: white; border: 1px solid var(--border); border-radius: 12px; font-size: 0.8rem; font-weight: 800; color: var(--text-muted); box-shadow: 0 3px 6px rgba(0,0,0,0.03); transition: all 0.2s; }
                    .mistake-tag:hover { border-color: var(--primary); color: var(--primary); }

                    .save-test-btn-proper { 
                        width: 100%; height: 68px; background: var(--primary); color: white; border: none; border-radius: 20px; 
                        font-size: 1.2rem; font-weight: 900; cursor: pointer; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        box-shadow: 0 12px 30px rgba(79, 70, 229, 0.35);
                    }
                    .save-test-btn-proper:hover { background: #4338ca; transform: translateY(-4px); box-shadow: 0 20px 45px rgba(79, 70, 229, 0.45); }

                    .mistake-tracker-section { padding: 1.5rem; background: #fafbfc; border-radius: 20px; border: 1px solid #f1f5f9; }
                    .mistake-input-row { display: grid; grid-template-columns: 1fr 1fr 1fr 80px; gap: 0.75rem; align-items: center; margin-bottom: 1rem; }
                    .mistake-input-row select { padding: 12px; border-radius: 12px; border: 1.5px solid #f1f5f9; font-size: 0.85rem; font-weight: 700; color: #475569; }
                    .add-mistake-btn { height: 44px; background: #1e293b; color: white; border: none; border-radius: 10px; font-weight: 800; cursor: pointer; transition: all 0.2s; }
                    .add-mistake-btn:hover { background: #0f172a; transform: scale(1.05); }

                    .mistake-tags-cloud { display: flex; flexWrap: wrap; gap: 8px; }
                    .mistake-tag { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: white; border: 1px solid #f1f5f9; border-radius: 10px; font-size: 0.75rem; font-weight: 700; color: #475569; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }

                    .save-test-btn-proper { 
                        width: 100%; height: 64px; background: #4f46e5; color: white; border: none; border-radius: 18px; 
                        font-size: 1.1rem; font-weight: 900; cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        box-shadow: 0 10px 25px rgba(79, 70, 229, 0.3);
                    }
                    .save-test-btn-proper:hover { background: #4338ca; transform: translateY(-3px); box-shadow: 0 15px 35px rgba(79, 70, 229, 0.4); }

                    /* Stats Grid - Global */
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 1.5rem;
                        margin-bottom: 2.5rem;
                        animation: slideUp 0.4s ease-out;
                    }

                    @media (max-width: 1024px) {
                        .test-page-container { padding: 0 1.5rem 4rem 1.5rem; }
                        .test-page-header { margin: 1.5rem 0 2rem 0; }
                        .header-left h1 { font-size: 2rem; }
                        
                        /* Stats Grid for Tablets: 2 columns */
                        .stats-grid { 
                            grid-template-columns: repeat(2, 1fr) !important; 
                        }
                        /* Make first item (Selection Meter) span full width if odd number */
                        .stats-grid > div:first-child {
                            grid-column: span 2;
                        }
                    }

                    @media (max-width: 768px) {
                        .test-page-header { flex-direction: column; align-items: flex-start; gap: 1.25rem; }
                        .log-test-btn { width: 100%; justify-content: center; height: 48px; }
                        .header-left h1 { font-size: 1.75rem; }
                        
                        /* Stats Grid for Mobile: 1 column */
                        .stats-grid { 
                            grid-template-columns: 1fr !important; 
                        }
                        .stats-grid > div:first-child {
                            grid-column: span 1;
                        }

                        .test-modal-card { padding: 1.5rem; border-radius: 20px; }
                        .form-grid-top { grid-template-columns: 1fr; gap: 1rem; }
                        .scores-grid-proper { grid-template-columns: 1fr 1fr; }
                        .mistake-input-row { grid-template-columns: 1fr; gap: 8px; }
                        .add-mistake-btn { width: 100%; height: 50px; }
                        
                        .test-modal-overlay { padding: 0.75rem; }
                        .test-modal-card { padding: 2rem 1.5rem; border-radius: 28px; maxHeight: 95vh; }
                        .save-test-btn-proper { height: 60px; font-size: 1.1rem; }

                        .ai-modal-overlay { padding: 0; }
                        .ai-modal-container { padding: 5rem 1.5rem 2rem 1.5rem; }
                        .ai-modal-header { position: fixed; top: 0; left: 0; right: 0; padding: 1.5rem; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); z-index: 10; border-bottom: 1px solid #f1f5f9; }
                        .ai-gradient-title { font-size: 1.7rem; }
                        .ai-close-btn { width: 42px; height: 42px; }
                    }

                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    @media (max-width: 480px) {
                        .scores-grid-proper { grid-template-columns: 1fr; }
                        .ai-gradient-title { font-size: 1.6rem; }
                    }

                    /* AI Deep Analysis Specific Classes */
                    .ai-modal-overlay { position: fixed; inset: 0; background: rgba(255, 255, 255, 0.98); z-index: 9999; padding: 2rem; overflow-y: auto; }
                    .ai-modal-container { maxWidth: 1000px; margin: 0 auto; padding-bottom: 4rem; }
                    .ai-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3.5rem; }
                    .ai-gradient-title { font-size: 2.75rem; fontWeight: 900; background: linear-gradient(to right, #6366F1, #EC4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; letter-spacing: -0.03em; }
                    .ai-subtitle { color: #64748B; fontSize: 1.15rem; fontWeight: 600; margin: 5px 0 0; }
                    .ai-close-btn { width: 48px; height: 48px; background: #f1f5f9; border: none; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #64748b; cursor: pointer; transition: all 0.2s; }
                    .ai-close-btn:hover { background: #e2e8f0; color: #1e293b; transform: rotate(90deg); }

                    .ai-content-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 2.5rem; }
                    @media (max-width: 900px) { .ai-content-grid { grid-template-columns: 1fr; gap: 2rem; } }

                    .column-header { display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem; }
                    .column-header h3 { font-size: 1.1rem; fontWeight: 900; color: #1e293b; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; }

                    .insights-stack { display: flex; flex-direction: column; gap: 1.25rem; }
                    .insight-card { padding: 1.5rem; border-radius: 20px; display: flex; gap: 1.25rem; border: 1px solid transparent; transition: transform 0.2s; }
                    .insight-card:hover { transform: translateX(5px); }
                    .insight-card.critical { background: #FFF1F2; border-color: #FECDD3; }
                    .insight-card.warning { background: #FFFBEB; border-color: #FDE68A; }
                    .insight-card.success { background: #F0FDF4; border-color: #BBF7D0; }

                    .insight-icon { width: 44px; height: 44px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                    .critical .insight-icon { color: #E11D48; }
                    .warning .insight-icon { color: #D97706; }
                    .success .insight-icon { color: #10B981; }

                    .insight-body .insight-tag { font-size: 0.65rem; fontWeight: 900; text-transform: uppercase; opacity: 0.6; letter-spacing: 0.05em; }
                    .insight-body p { margin: 4px 0 0; font-size: 1.05rem; fontWeight: 700; line-height: 1.5; color: #334155; }

                    .heatmap-section-card { background: #f8fafc; padding: 1.5rem; border-radius: 24px; border: 1px solid #f1f5f9; margin-bottom: 2rem; }
                    .heatmap-badges { display: flex; flex-wrap: wrap; gap: 10px; }

                    .action-plan-card { background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 2rem; border-radius: 24px; color: white; position: relative; overflow: hidden; }
                    .plan-header { display: flex; align-items: center; gap: 10px; margin-bottom: 2rem; }
                    .plan-header h3 { font-size: 1.15rem; fontWeight: 900; margin: 0; color: #818cf8; }
                    .plan-list { display: flex; flex-direction: column; gap: 1.5rem; }
                    .plan-item { display: flex; gap: 1rem; }
                    .step-num { min-width: 28px; height: 28px; background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; fontWeight: 800; color: #818cf8; }
                    .plan-item p { margin: 0; font-size: 1rem; fontWeight: 600; line-height: 1.5; opacity: 0.9; }
                    .acknowledge-btn { width: 100%; height: 54px; margin-top: 2.5rem; background: #6366F1; color: white; border: none; border-radius: 14px; fontWeight: 800; cursor: pointer; transition: all 0.2s; }
                    .acknowledge-btn:hover { background: #4f46e5; transform: translateY(-2px); }
                `}</style>
            </div>
        </AppShell>
    );
}

