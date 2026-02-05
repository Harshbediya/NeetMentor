"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Trash2,
    Edit3,
    Flame,
    History,
    Clock,
    Target,
    BookOpen,
    Trophy,
    RefreshCcw
} from "lucide-react";

// Helper to get formatted date string: YYYY-MM-DD
const formatDateKey = (date) => {
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();
    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
};

const MONTHS = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// NEET 2026 Target Date
const NEET_TARGET_DATE = new Date(2026, 4, 3); // May 3, 2026

export default function CalendarSystem() {
    const [tasksData, setTasksData] = useState({});
    const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(2026);
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTask, setEditingTask] = useState(null);
    const [streak, setStreak] = useState(0);
    const [countdown, setCountdown] = useState(0);

    const [taskForm, setTaskForm] = useState({
        name: "",
        subject: "Physics",
        type: "Reading",
        hours: "1",
        status: "Not Completed",
        notes: "",
        date: formatDateKey(new Date())
    });

    useEffect(() => {
        setIsMounted(true);
        fetchProgress();

        // Calculate countdown to NEET 2026
        const now = new Date();
        const diff = NEET_TARGET_DATE - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        setCountdown(days > 0 ? days : 0);
    }, []);

    const fetchProgress = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/progress");
            const result = await res.json();
            if (result.success) {
                setTasksData(result.data || {});
                calculateStreak(result.data || {});
            }
        } catch (error) {
            console.error("Failed to fetch progress:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveProgressToDB = async (newData) => {
        try {
            await fetch("/api/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tasksData: newData })
            });
        } catch (error) {
            console.error("Failed to save progress:", error);
        }
    };

    const calculateStreak = (data) => {
        let currentStreak = 0;
        let checkDate = new Date();
        const todayStr = formatDateKey(checkDate);
        if (!data[todayStr] || data[todayStr].status !== "completed") {
            checkDate.setDate(checkDate.getDate() - 1);
        }
        while (true) {
            const dateStr = formatDateKey(checkDate);
            if (data[dateStr] && data[dateStr].status === "completed") {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        setStreak(currentStreak);
    };

    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

    const deriveDayStatus = (tasks) => {
        if (!tasks || tasks.length === 0) return null;
        if (tasks.some(t => t.status === "Not Completed")) return "not-completed";
        if (tasks.some(t => t.status === "Completed")) return "completed";
        return "skipped";
    };

    const handleDateClick = (day, month, year) => {
        const dateStr = formatDateKey(new Date(year, month, day));
        setSelectedDate(dateStr);
        setTaskForm(prev => ({ ...prev, date: dateStr }));
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        const dateKey = taskForm.date;
        const newTasksData = { ...tasksData };
        let currentDayData = newTasksData[dateKey] || { status: null, tasks: [] };
        let updatedTasks = [...currentDayData.tasks];

        if (editingTask !== null) {
            updatedTasks = updatedTasks.map(t => t.id === editingTask.id ? { ...taskForm, id: t.id } : t);
            setEditingTask(null);
        } else {
            updatedTasks.push({ ...taskForm, id: Date.now() });
        }

        newTasksData[dateKey] = {
            status: deriveDayStatus(updatedTasks),
            tasks: updatedTasks
        };

        setTasksData(newTasksData);
        calculateStreak(newTasksData);
        await saveProgressToDB(newTasksData);

        setTaskForm({
            name: "",
            subject: "Physics",
            type: "Reading",
            hours: "1",
            status: "Not Completed",
            notes: "",
            date: dateKey
        });
    };

    const deleteTask = async (dateKey, id) => {
        const newTasksData = { ...tasksData };
        if (!newTasksData[dateKey]) return;
        const updatedTasks = newTasksData[dateKey].tasks.filter(t => t.id !== id);
        if (updatedTasks.length === 0) {
            delete newTasksData[dateKey];
        } else {
            newTasksData[dateKey] = { status: deriveDayStatus(updatedTasks), tasks: updatedTasks };
        }
        setTasksData(newTasksData);
        calculateStreak(newTasksData);
        await saveProgressToDB(newTasksData);
    };

    const editTask = (task) => {
        setTaskForm(task);
        setEditingTask(task);
    };

    if (!isMounted) return null;

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const todayStr = formatDateKey(new Date());

    return (
        <AppShell>
            <div className="calendar-page-container">
                {/* Countdown Banner */}
                <div className="countdown-banner">
                    <Target size={24} />
                    <span>Countdown to NEET 2026: <strong>{countdown} Days</strong> Remaining! 🎯</span>
                </div>

                <header className="wall-calendar-header">
                    <button className="nav-btn" onClick={() => {
                        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
                        else setCurrentMonth(m => m - 1);
                    }}><ChevronLeft size={24} /></button>
                    <h1>{MONTHS[currentMonth]} {currentYear}</h1>
                    <button className="nav-btn" onClick={() => {
                        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
                        else setCurrentMonth(m => m + 1);
                    }}><ChevronRight size={24} /></button>

                    {isLoading && <div className="sync-indicator"><RefreshCcw size={16} className="spin" /> Syncing...</div>}
                </header>

                <div className="tracker-grid-container">
                    {/* Visual Wall Calendar */}
                    <div className="wall-calendar-card card">
                        <div className="weekday-header-grid">
                            {DAYS.map(day => <div key={day} className="weekday-label">{day}</div>)}
                        </div>
                        <div className="calendar-box-grid">
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} className="calendar-box empty"></div>
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const dateStr = formatDateKey(new Date(currentYear, currentMonth, day));
                                const isToday = dateStr === todayStr;
                                const isSelected = dateStr === selectedDate;
                                const dayData = tasksData[dateStr];
                                const dayStatus = dayData?.status;

                                const totalHours = dayData?.tasks.reduce((acc, t) => acc + parseFloat(t.hours || 0), 0) || 0;
                                const subjects = [...new Set(dayData?.tasks.map(t => t.subject) || [])];

                                return (
                                    <div
                                        key={day}
                                        className={`calendar-box ${dayStatus || ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleDateClick(day, currentMonth, currentYear)}
                                    >
                                        <div className="date-number-wrapper">
                                            <span className="date-number">{day}</span>
                                        </div>

                                        {dayData && dayData.tasks.length > 0 && (
                                            <div className="box-summary">
                                                {totalHours > 0 && (
                                                    <div className="hours-indicator">
                                                        <Clock size={10} /> {totalHours}h
                                                    </div>
                                                )}
                                                <div className="subject-dots">
                                                    {subjects.map(s => (
                                                        <span key={s} className={`sub-dot ${s.toLowerCase()}`} title={s}></span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="horizontal-legend">
                            <div className="legend-item"><span className="dot green"></span> Completed</div>
                            <div className="legend-item"><span className="dot red"></span> Not Completed</div>
                            <div className="legend-item"><span className="dot yellow"></span> Skipped</div>
                            <div className="legend-separator"></div>
                            <div className="legend-item"><span className="sub-dot physics"></span> Physics</div>
                            <div className="legend-item"><span className="sub-dot chemistry"></span> Chem</div>
                            <div className="legend-item"><span className="sub-dot biology"></span> Biology</div>
                        </div>
                    </div>

                    {/* Sidebar: Task Panel */}
                    <div className="card task-panel">
                        <div className="stats-header">
                            <div className="streak-mini-card">
                                <Flame size={20} color="#f97316" fill="#f97316" />
                                <span>{streak} Day Streak</span>
                            </div>
                            <div className="trophy-card">
                                <Trophy size={18} color="#FFD700" />
                                <span>Level 1</span>
                            </div>
                        </div>

                        <div className="panel-header">
                            <h3>{new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                        </div>

                        <form onSubmit={handleAddTask} className="task-form">
                            <div className="form-row">
                                <input type="text" placeholder="Task Name (e.g. Modern Physics)" value={taskForm.name} onChange={e => setTaskForm(f => ({ ...f, name: e.target.value }))} required />
                                <select value={taskForm.subject} onChange={e => setTaskForm(f => ({ ...f, subject: e.target.value }))}>
                                    <option value="Physics">Physics</option>
                                    <option value="Chemistry">Chemistry</option>
                                    <option value="Biology">Biology</option>
                                </select>
                            </div>
                            <div className="form-row">
                                <select value={taskForm.type} onChange={e => setTaskForm(f => ({ ...f, type: e.target.value }))}>
                                    <option value="Reading">Reading</option>
                                    <option value="Revision">Revision</option>
                                    <option value="PYQs">PYQs</option>
                                    <option value="Mock Test">Mock Test</option>
                                </select>
                                <div className="hours-input">
                                    <Clock size={16} />
                                    <input type="number" step="0.5" min="0" max="24" value={taskForm.hours} onChange={e => setTaskForm(f => ({ ...f, hours: e.target.value }))} />
                                    <span>hrs</span>
                                </div>
                            </div>
                            <div className="form-row">
                                <select value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))}>
                                    <option value="Completed">Completed</option>
                                    <option value="Not Completed">Not Completed</option>
                                    <option value="Skipped">Skipped</option>
                                </select>
                            </div>
                            <textarea placeholder="Notes / Performance Review" value={taskForm.notes} onChange={e => setTaskForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">{editingTask ? "Update Status" : "Save Progress"}</button>
                                {editingTask && <button type="button" className="btn btn-secondary" onClick={() => { setEditingTask(null); setTaskForm({ name: "", subject: "Physics", type: "Reading", hours: "1", status: "Not Completed", notes: "", date: selectedDate }); }}>Cancel</button>}
                            </div>
                        </form>

                        <div className="updates-list">
                            {(!tasksData[selectedDate] || tasksData[selectedDate].tasks.length === 0) ? (
                                <div className="empty-state">
                                    <BookOpen size={32} />
                                    <p>No study updates for this day.<br />Log your effort now!</p>
                                </div>
                            ) : (
                                tasksData[selectedDate].tasks.map(t => (
                                    <div key={t.id} className="update-item">
                                        <div className={`status-border ${t.status.toLowerCase().replace(' ', '-')}`}></div>
                                        <div className="update-content">
                                            <div className="update-meta">
                                                <span className={`subject-tag ${t.subject.toLowerCase()}`}>{t.subject}</span>
                                                <span className="type-tag">{t.type}</span>
                                                <span className="hours-tag">{t.hours}h</span>
                                            </div>
                                            <p className={`title ${t.status === 'Completed' ? 'done' : ''}`}>{t.name}</p>
                                            {t.notes && <p className="notes">"{t.notes}"</p>}
                                        </div>
                                        <div className="update-actions">
                                            <button onClick={() => editTask(t)} className="action-btn"><Edit3 size={16} /></button>
                                            <button onClick={() => deleteTask(selectedDate, t.id)} className="action-btn delete"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="card history-footer">
                    <div className="history-header"><History size={18} /> Performance History (7 Days)</div>
                    <div className="history-scroll">
                        {Object.keys(tasksData).sort().reverse().slice(0, 7).map(d => (
                            <div key={d} className="history-bar-card">
                                <span className="date">{new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                <div className="bar-container">
                                    <div className={`bar ${tasksData[d].status || 'none'}`} style={{ height: '100%' }}></div>
                                </div>
                                <span className="hour-stat">
                                    {(tasksData[d]?.tasks || []).reduce((acc, t) => acc + parseFloat(t.hours || 0), 0).toFixed(1)}h
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .calendar-page-container { padding: 1rem 0; display: flex; flex-direction: column; gap: 1.5rem; }
                .sync-indicator { position: absolute; right: 0; bottom: -20px; font-size: 0.75rem; color: #64748b; display: flex; align-items: center; gap: 4px; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                .countdown-banner {
                    background: linear-gradient(90deg, #1e293b 0%, #334155 100%);
                    color: white; padding: 1rem 1.5rem; border-radius: 12px;
                    display: flex; align-items: center; gap: 1rem; font-size: 1.1rem;
                    box-shadow: var(--shadow-md); border-left: 6px solid var(--color-primary);
                }
                .countdown-banner strong { color: #facc15; font-size: 1.3rem; }

                .wall-calendar-header { display: flex; justify-content: center; align-items: center; gap: 3rem; margin-top: 1rem; position: relative; }
                .wall-calendar-header h1 { font-size: 2.2rem; font-weight: 800; letter-spacing: 0.1em; color: var(--color-text-main); text-transform: uppercase; margin: 0; }
                .nav-btn { background: white; border: 1px solid var(--color-border); padding: 0.6rem; border-radius: 50%; box-shadow: var(--shadow-sm); transition: all 0.2s; color: var(--color-text-main); }
                .nav-btn:hover { background: var(--color-primary-light); transform: scale(1.1); color: var(--color-primary); }

                .tracker-grid-container { display: grid; grid-template-columns: 1fr 420px; gap: 1.5rem; align-items: start; }
                @media (max-width: 1300px) { .tracker-grid-container { grid-template-columns: 1fr; } }

                .wall-calendar-card { padding: 0; overflow: hidden; border: 2px solid #1e293b; border-radius: 8px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
                .weekday-header-grid { display: grid; grid-template-columns: repeat(7, 1fr); background: #1e293b; }
                .weekday-label { color: #94a3b8; text-align: center; padding: 1rem 0.25rem; font-weight: 800; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; }

                .calendar-box-grid { display: grid; grid-template-columns: repeat(7, 1fr); border-top: 1px solid #1e293b; background: #e2e8f0; gap: 1px; }
                .calendar-box { aspect-ratio: 1; position: relative; cursor: pointer; background: white; transition: all 0.2s; min-height: 110px; display: flex; flex-direction: column; }
                .calendar-box:hover { z-index: 10; transform: scale(1.02); box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                .calendar-box.empty { background: #f1f5f9; cursor: default; pointer-events: none; }
                
                .calendar-box.completed { background-color: #dcfce7 !important; border-bottom: 4px solid #22c55e; }
                .calendar-box.not-completed { background-color: #fee2e2 !important; border-bottom: 4px solid #ef4444; }
                .calendar-box.skipped { background-color: #fef9c3 !important; border-bottom: 4px solid #eab308; }
                .calendar-box.selected { background-color: #eff6ff !important; box-shadow: inset 0 0 0 3px var(--color-primary); }
                
                .date-number-wrapper { padding: 8px; }
                .date-number { font-weight: 800; font-size: 1.2rem; color: #475569; }
                .calendar-box.today .date-number { background: var(--color-primary); color: white; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }

                .box-summary { margin-top: auto; padding: 8px; display: flex; justify-content: space-between; align-items: flex-end; }
                .hours-indicator { font-size: 0.75rem; font-weight: 800; color: #1e293b; background: rgba(255,255,255,0.8); padding: 2px 6px; border-radius: 4px; display: flex; align-items: center; gap: 3px; }
                .subject-dots { display: flex; gap: 3px; }
                .sub-dot { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; }
                .sub-dot.physics { background: #3b82f6; }
                .sub-dot.chemistry { background: #f97316; }
                .sub-dot.biology { background: #22c55e; }

                .horizontal-legend { display: flex; justify-content: center; align-items: center; gap: 1.5rem; padding: 1.25rem; background: white; font-weight: 700; font-size: 0.8rem; flex-wrap: wrap; }
                .legend-item { display: flex; align-items: center; gap: 0.4rem; color: #64748b; }
                .legend-separator { width: 1px; height: 16px; background: #e2e8f0; margin: 0 0.5rem; }
                .dot { width: 12px; height: 12px; border-radius: 3px; }
                .dot.green { background: #22c55e; }
                .dot.red { background: #ef4444; }
                .dot.yellow { background: #eab308; }

                .task-panel { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; box-shadow: var(--shadow-lg); }
                .stats-header { display: flex; gap: 0.75rem; }
                .streak-mini-card, .trophy-card { 
                    flex: 1; display: flex; align-items: center; justify-content: center;
                    gap: 0.6rem; padding: 0.75rem; border-radius: 12px; font-weight: 800; font-size: 0.9rem;
                }
                .streak-mini-card { background: #fff7ed; border: 1px solid #ffedd5; color: #9a3412; }
                .trophy-card { background: #f0fdf4; border: 1px solid #dcfce7; color: #166534; }

                .panel-header h3 { margin: 0; font-size: 1.3rem; font-weight: 800; color: var(--color-text-main); }
                .task-form { display: flex; flex-direction: column; gap: 0.85rem; background: #f8fafc; padding: 1.25rem; border-radius: 16px; border: 1px solid #e2e8f0; width: 100%; box-sizing: border-box; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; width: 100%; }
                .hours-input { display: flex; align-items: center; gap: 0.5rem; background: white; border: 1px solid #cbd5e1; padding: 0 0.75rem; border-radius: 8px; }
                .hours-input input { border: none !important; padding: 0.65rem 0 !important; width: 40px !important; text-align: center; font-weight: 800; }
                .hours-input span { font-size: 0.8rem; font-weight: 700; color: #64748b; }

                .task-form input, .task-form select, .task-form textarea { 
                    width: 100%; box-sizing: border-box; padding: 0.75rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.9rem; font-weight: 600; outline: none; min-width: 0; background: white;
                }
                .task-form textarea { resize: none; background: #fff; }
                .form-actions { display: flex; gap: 0.6rem; }
                .form-actions button { flex: 1; padding: 0.85rem; font-weight: 800; }

                .updates-list { display: flex; flex-direction: column; gap: 1rem; max-height: 500px; overflow-y: auto; padding-right: 4px; }
                .update-item { display: flex; gap: 1rem; background: white; padding: 1rem; border-radius: 12px; border: 1px solid #e2e8f0; align-items: flex-start; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); position: relative; overflow: hidden; }
                .status-border { position: absolute; left: 0; top: 0; bottom: 0; width: 6px; }
                .status-border.completed { background: #22c55e; }
                .status-border.not-completed { background: #ef4444; }
                .status-border.skipped { background: #eab308; }

                .update-content { flex: 1; }
                .update-meta { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
                .subject-tag { font-size: 0.65rem; font-weight: 900; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
                .subject-tag.physics { background: #eff6ff; color: #1d4ed8; }
                .subject-tag.chemistry { background: #fff7ed; color: #c2410c; }
                .subject-tag.biology { background: #f0fdf4; color: #15803d; }
                .type-tag, .hours-tag { font-size: 0.65rem; font-weight: 700; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; }

                .update-content .title { font-weight: 800; font-size: 1rem; margin: 0; color: #1e293b; }
                .update-content .title.done { text-decoration: line-through; color: #94a3b8; }
                .update-content .notes { font-size: 0.85rem; color: #64748b; font-style: italic; margin-top: 0.4rem; line-height: 1.5; }
                
                .update-actions { display: flex; gap: 0.4rem; }
                .action-btn { background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.5rem; border-radius: 8px; color: #94a3b8; transition: all 0.2s; }
                .action-btn:hover { background: #fff; color: var(--color-primary); border-color: var(--color-primary); }
                .action-btn.delete:hover { background: #fee2e2; color: #ef4444; border-color: #fca5a5; }
                
                .empty-state { text-align: center; padding: 4rem 1rem; color: #94a3b8; background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 16px; }
                .empty-state p { margin-top: 1rem; font-weight: 700; font-size: 0.95rem; line-height: 1.6; }

                .history-footer { padding: 1.5rem; }
                .history-header { font-weight: 800; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; }
                .history-scroll { display: flex; gap: 1.5rem; overflow-x: auto; padding-bottom: 0.75rem; }
                .history-bar-card { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; min-width: 80px; }
                .bar-container { height: 80px; width: 30px; background: #f1f5f9; border-radius: 6px; overflow: hidden; display: flex; flex-direction: column-reverse; }
                .bar.completed { background: #22c55e; }
                .bar.not-completed { background: #ef4444; }
                .bar.skipped { background: #eab308; }
                .bar.none { background: #cbd5e1; }
                
                .date { font-weight: 800; font-size: 0.75rem; color: #475569; }
                .hour-stat { font-weight: 800; font-size: 0.8rem; color: var(--color-primary); }

                @media (max-width: 768px) {
                    .calendar-box { min-height: 85px; }
                    .date-number { font-size: 1rem; }
                    .wall-calendar-header h1 { font-size: 1.6rem; }
                    .tracker-grid-container { grid-template-columns: 1fr; }
                }
            `}</style>
        </AppShell>
    );
}
