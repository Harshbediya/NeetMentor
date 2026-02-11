"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import api from "@/lib/api";
import {
    Calendar, Clock, CheckCircle, XCircle, FileText,
    Award, Target, BookOpen, Activity, ChevronRight,
    Filter, Layout
} from "lucide-react";

export default function HistoryPage() {
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        studyLogs: [],
        tasks: [],
        notes: [],
        mockTests: [],
        quizAttempts: []
    });

    useEffect(() => {
        fetchHistoryData();
    }, [selectedDate]);

    const fetchHistoryData = async () => {
        setLoading(true);
        try {
            // Fetch all data in parallel
            const [logsRes, tasksRes, notesRes, mocksRes, quizzesRes] = await Promise.all([
                api.get('/study-logs/'),
                api.get('/tasks/'),
                api.get('/notes/'),
                api.get('/mock-tests/'),
                api.get('/quiz-attempts/')
            ]);

            // Filter by selected date
            // Note: Some models use 'date' (YYYY-MM-DD), others 'created_at' (ISO timestamp)

            const filterByDate = (item, dateField = 'created_at') => {
                const val = item[dateField];
                if (!val) return false;

                // If it's a full ISO timestamp (has 'T'), convert to local date string
                if (val.includes('T')) {
                    const dateObj = new Date(val);
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const localYMD = `${year}-${month}-${day}`;
                    return localYMD === selectedDate;
                }

                // If it's just YYYY-MM-DD, compare string directly
                return val === selectedDate;
            };

            setData({
                studyLogs: logsRes.data.filter(item => filterByDate(item, 'date')),
                tasks: tasksRes.data.filter(item => filterByDate(item, 'created_at')),
                notes: notesRes.data.filter(item => filterByDate(item, 'created_at')),
                mockTests: mocksRes.data.filter(item => filterByDate(item, 'date')),
                quizAttempts: quizzesRes.data.filter(item => filterByDate(item, 'created_at'))
            });

        } catch (error) {
            console.error("Failed to fetch history data:", error);
            if (error.response && error.response.status === 401) {
                // Determine if it's an auth error and just show empty state
                setData({
                    studyLogs: [],
                    tasks: [],
                    notes: [],
                    mockTests: [],
                    quizAttempts: []
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Calculate Summary Stats
    const totalStudyTime = data.studyLogs.reduce((acc, log) => acc + (log.minutes || 0), 0);
    const tasksCompleted = data.tasks.filter(t => t.is_done).length;
    const totalTasks = data.tasks.length;
    const testsTaken = data.mockTests.length + data.quizAttempts.length;

    const formatTime = (mins) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const deleteItem = async (type, id) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            if (type === 'log') await api.delete(`/study-logs/${id}/`);
            if (type === 'task') await api.delete(`/tasks/${id}/`);
            if (type === 'note') await api.delete(`/notes/${id}/`);
            if (type === 'test') await api.delete(`/mock-tests/${id}/`);
            if (type === 'quiz') await api.delete(`/quiz-attempts/${id}/`);

            // Refresh data
            fetchHistoryData();
        } catch (error) {
            console.error("Failed to delete item", error);
            alert("Failed to delete item.");
        }
    };

    return (
        <AppShell>
            <div className="history-container">
                {/* Header Section */}
                <header className="history-header">
                    <div>
                        <h1>Daily Timeline</h1>
                        <p>Review your productivity and activities for any day.</p>
                    </div>
                    <div className="date-controls">
                        <button
                            className="date-nav-btn"
                            onClick={() => {
                                const d = new Date(selectedDate);
                                d.setDate(d.getDate() - 1);
                                setSelectedDate(d.toISOString().split('T')[0]);
                            }}
                        >
                            &lt; Prev Day
                        </button>
                        <div className="date-picker-wrapper">
                            <Calendar size={18} className="calendar-icon" />
                            <input
                                type="date"
                                value={selectedDate}
                                max={(() => {
                                    const d = new Date();
                                    const year = d.getFullYear();
                                    const month = String(d.getMonth() + 1).padStart(2, '0');
                                    const day = String(d.getDate()).padStart(2, '0');
                                    return `${year}-${month}-${day}`;
                                })()}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                        <button
                            className="date-nav-btn"
                            onClick={() => {
                                const d = new Date(selectedDate);
                                d.setDate(d.getDate() + 1);

                                // Prevent future dates
                                const today = new Date();
                                if (d <= today) {
                                    setSelectedDate(d.toISOString().split('T')[0]);
                                }
                            }}
                        >
                            Next Day &gt;
                        </button>
                    </div>
                </header>

                {/* Summary Cards */}
                <div className="summary-grid">
                    <div className="summary-card">
                        <div className="icon-box blue"><Clock size={20} /></div>
                        <div>
                            <span className="label">Study Time</span>
                            <span className="value">{formatTime(totalStudyTime)}</span>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="icon-box green"><CheckCircle size={20} /></div>
                        <div>
                            <span className="label">Tasks Done</span>
                            <span className="value">{tasksCompleted} <span className="sub">/ {totalTasks}</span></span>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="icon-box purple"><Award size={20} /></div>
                        <div>
                            <span className="label">Tests Taken</span>
                            <span className="value">{testsTaken}</span>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="icon-box orange"><FileText size={20} /></div>
                        <div>
                            <span className="label">Notes Created</span>
                            <span className="value">{data.notes.length}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading activity...</p>
                    </div>
                ) : (
                    <div className="history-content">

                        {/* 1. Study Sessions */}
                        <section className="history-section">
                            <h3 className="section-title">
                                <span><BookOpen size={18} /> Study Sessions</span>
                                <span className="count-badge">{data.studyLogs.length}</span>
                            </h3>
                            <div className="scrollable-list">
                                {data.studyLogs.length > 0 ? (
                                    <div className="activity-list">
                                        {data.studyLogs.map((log, i) => (
                                            <div key={i} className="activity-item">
                                                <div className="activity-icon blue"><Clock size={16} /></div>
                                                <div className="activity-details">
                                                    <h4>{log.subject || "General Study"}</h4>
                                                    <p>{log.topic || "Self Study"}</p>
                                                </div>
                                                <div className="activity-meta">
                                                    <span className="tag time">{log.minutes} min</span>
                                                </div>
                                                <button className="delete-btn" onClick={() => deleteItem('log', log.id)} title="Delete log">
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">No study sessions logged.</div>
                                )}
                            </div>
                        </section>

                        {/* 2. Tasks & To-Dos */}
                        <section className="history-section">
                            <h3 className="section-title">
                                <span><Target size={18} /> Tasks & Goals</span>
                                <span className="count-badge">{data.tasks.length}</span>
                            </h3>
                            <div className="scrollable-list">
                                {data.tasks.length > 0 ? (
                                    <div className="activity-list">
                                        {data.tasks.map((task, i) => (
                                            <div key={i} className={`activity-item ${task.is_done ? 'done' : ''}`}>
                                                <div className={`activity-icon ${task.is_done ? 'green' : 'gray'}`}>
                                                    {task.is_done ? <CheckCircle size={16} /> : <Target size={16} />}
                                                </div>
                                                <div className="activity-details">
                                                    <h4 style={{ textDecoration: task.is_done ? 'line-through' : 'none' }}>
                                                        {task.topic}
                                                    </h4>
                                                    <p>{task.subject}</p>
                                                </div>
                                                <div className="activity-meta">
                                                    {task.is_done ? (
                                                        <span className="tag completed">Completed</span>
                                                    ) : (
                                                        <span className="tag pending">Pending</span>
                                                    )}
                                                </div>
                                                <button className="delete-btn" onClick={() => deleteItem('task', task.id)} title="Delete task">
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">No tasks created.</div>
                                )}
                            </div>
                        </section>

                        {/* 3. Tests & Quizzes */}
                        <section className="history-section">
                            <h3 className="section-title">
                                <span><Activity size={18} /> Tests & Practice</span>
                                <span className="count-badge">{data.mockTests.length + data.quizAttempts.length}</span>
                            </h3>
                            <div className="scrollable-list">
                                {(data.mockTests.length > 0 || data.quizAttempts.length > 0) ? (
                                    <div className="activity-list">
                                        {data.mockTests.map((test, i) => (
                                            <div key={`mock-${i}`} className="activity-item">
                                                <div className="activity-icon purple"><Award size={16} /></div>
                                                <div className="activity-details">
                                                    <h4>{test.name}</h4>
                                                    <p>Mock Test Result</p>
                                                </div>
                                                <div className="activity-meta">
                                                    <span className="tag score">{test.score} / 720</span>
                                                </div>
                                                <button className="delete-btn" onClick={() => deleteItem('test', test.id)} title="Delete result">
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {data.quizAttempts.map((quiz, i) => (
                                            <div key={`quiz-${i}`} className="activity-item">
                                                <div className="activity-icon purple"><Award size={16} /></div>
                                                <div className="activity-details">
                                                    <h4>{quiz.quiz_name}</h4>
                                                    <p>{quiz.category || "Practice Quiz"}</p>
                                                </div>
                                                <div className="activity-meta">
                                                    <span className="tag score">{quiz.score} Score</span>
                                                </div>
                                                <button className="delete-btn" onClick={() => deleteItem('quiz', quiz.id)} title="Delete attempt">
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">No tests taken.</div>
                                )}
                            </div>
                        </section>

                        {/* 4. Notes */}
                        <section className="history-section">
                            <h3 className="section-title">
                                <span><FileText size={18} /> Notes Added</span>
                                <span className="count-badge">{data.notes.length}</span>
                            </h3>
                            <div className="scrollable-list">
                                {data.notes.length > 0 ? (
                                    <div className="activity-list">
                                        {data.notes.map((note, i) => (
                                            <div key={i} className="activity-item">
                                                <div className="activity-icon orange"><FileText size={16} /></div>
                                                <div className="activity-details">
                                                    <h4>{note.title}</h4>
                                                    <p>{note.subject}</p>
                                                </div>
                                                <div className="activity-meta">
                                                    <span className="tag note">Note</span>
                                                </div>
                                                <button className="delete-btn" onClick={() => deleteItem('note', note.id)} title="Delete note">
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">No notes created.</div>
                                )}
                            </div>
                        </section>

                    </div>
                )}
            </div>

            <style jsx>{`
                .history-container {
                    padding: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                    min-height: 100vh;
                }

                .history-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid #e2e8f0;
                }

                .history-header h1 {
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin: 0 0 0.5rem 0;
                }

                .history-header p {
                    color: #64748b;
                    font-size: 0.95rem;
                    margin: 0;
                }

                .date-picker-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: white;
                    padding: 10px 16px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }

                .calendar-icon { color: #64748b; }
                
                input[type="date"] {
                    border: none;
                    background: transparent;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #334155;
                    font-family: inherit;
                    outline: none;
                }

                /* Summary Cards */
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 3rem;
                }

                .summary-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }

                .icon-box {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .icon-box.blue { background: #eff6ff; color: #3b82f6; }
                .icon-box.green { background: #f0fdf4; color: #22c55e; }
                .icon-box.purple { background: #f5f3ff; color: #8b5cf6; }
                .icon-box.orange { background: #fff7ed; color: #f97316; }

                .summary-card .label { display: block; font-size: 0.8rem; color: #64748b; font-weight: 600; margin-bottom: 4px; }
                .summary-card .value { font-size: 1.4rem; font-weight: 800; color: #0f172a; }
                .summary-card .value .sub { font-size: 0.9rem; color: #94a3b8; font-weight: 600; }

                /* History List */
                .history-content {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 2rem;
                }

                .history-section {
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 20px;
                    border: 1px solid #f1f5f9;
                }

                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 1rem;
                    font-weight: 800;
                    color: #475569;
                    margin: 0 0 1.5rem 0;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .activity-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .activity-item {
                    background: white;
                    padding: 16px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    border: 1px solid #e2e8f0;
                    transition: transform 0.2s;
                }

                .activity-item:hover {
                    transform: translateX(4px);
                    border-color: #cbd5e1;
                }

                .activity-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .activity-icon.blue { background: #eff6ff; color: #3b82f6; }
                .activity-icon.green { background: #f0fdf4; color: #16a34a; }
                .activity-icon.gray { background: #f1f5f9; color: #94a3b8; }
                .activity-icon.purple { background: #f5f3ff; color: #8b5cf6; }
                .activity-icon.orange { background: #fff7ed; color: #f97316; }

                .activity-details { flex: 1; }
                .activity-details h4 { font-size: 0.95rem; font-weight: 700; color: #334155; margin: 0 0 4px 0; }
                .activity-details p { font-size: 0.8rem; color: #64748b; margin: 0; }

                .activity-meta { text-align: right; }
                
                .tag {
                    font-size: 0.75rem;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 99px;
                }

                .tag.time { background: #eff6ff; color: #3b82f6; }
                .tag.completed { background: #dcfce7; color: #16a34a; }
                .tag.pending { background: #f1f5f9; color: #64748b; }
                .tag.score { background: #f3e8ff; color: #7e22ce; }
                .tag.note { background: #ffedd5; color: #c2410c; }

                .empty-state {
                    text-align: center;
                    padding: 2rem 0;
                    color: #94a3b8;
                    font-size: 0.9rem;
                    font-weight: 500;
                }
                
                .loading-state {
                    grid-column: 1 / -1;
                    padding: 4rem;
                    text-align: center;
                }

                .spinner {
                    width: 30px;
                    height: 30px;
                    border: 3px solid #e2e8f0;
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin: 0 auto 1rem;
                }

                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

                @media (max-width: 768px) {
                    .history-container { padding: 1.5rem; }
                    .history-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
                    .history-content { grid-template-columns: 1fr; }
                    .date-controls { flex-wrap: wrap; }
                }

                .date-controls {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .date-nav-btn {
                    padding: 8px 16px;
                    border-radius: 99px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .date-nav-btn:hover {
                    background: #f8fafc;
                    color: #334155;
                    border-color: #cbd5e1;
                }

                .scrollable-list {
                    max-height: 400px;
                    overflow-y: auto;
                    padding-right: 8px;
                }
                .scrollable-list::-webkit-scrollbar { width: 4px; }
                .scrollable-list::-webkit-scrollbar-track { background: transparent; }
                .scrollable-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

                .count-badge {
                    background: #e2e8f0;
                    color: #64748b;
                    font-size: 0.75rem;
                    padding: 2px 8px;
                    border-radius: 99px;
                    margin-left: auto;
                }
                
                .delete-btn {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    border: none;
                    background: transparent;
                    color: #94a3b8;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-left: 8px;
                }
                .delete-btn:hover {
                    background: #fee2e2;
                    color: #ef4444;
                }
            `}</style>
        </AppShell>
    );
}
