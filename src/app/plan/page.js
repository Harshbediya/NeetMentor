"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import api from "@/lib/api";
import { loadData, saveData } from "@/lib/progress";
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
    BarChart3, Sparkles, LayoutGrid, Timer, RefreshCcw
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
    const router = useRouter();
    const [tasksData, setTasksData] = useState({});
    const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(2026);
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTask, setEditingTask] = useState(null);
    const [streak, setStreak] = useState(0);
    const [countdown, setCountdown] = useState(0);
    const [dailyTarget, setDailyTarget] = useState(12);
    const [newTargetInput, setNewTargetInput] = useState("12");
    const [isEditingTarget, setIsEditingTarget] = useState(false);

    const [taskForm, setTaskForm] = useState({
        name: "",
        subject: "Physics",
        type: "Reading",
        hours: "1",
        minutes: "0",
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
            // Fetch tasks (from UserStorage) and settings
            const [plannerData, settingsRes] = await Promise.all([
                loadData('planner_data', {}),
                api.get('/user-storage/')
            ]);

            setTasksData(plannerData);
            const target = settingsRes.data?.planner_settings?.daily_target || 12;
            setDailyTarget(target);
            setNewTargetInput(target.toString());
            calculateStreak(plannerData);
        } catch (error) {
            if (error.response?.status === 401) {
                router.push("/login");
            }
            console.error("Failed to fetch progress:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = async (target) => {
        try {
            // Get existing storage data to merge
            const currentDataRes = await api.get('/user-storage/');
            const merged = { ...currentDataRes.data, planner_settings: { daily_target: target } };
            await api.post('/user-storage/', merged);
        } catch (error) {
            console.error("Failed to save settings:", error);
        }
    };

    const calculateStreak = (data) => {
        let currentStreak = 0;
        let checkDate = new Date();
        const todayStr = formatDateKey(checkDate);

        // Check if today has a completed status
        const isTodayDone = (dateKey) => {
            const dayTasks = data[dateKey]?.tasks;
            if (!dayTasks || dayTasks.length === 0) return false;
            const completedMins = dayTasks
                .filter(t => t.status === "Completed")
                .reduce((acc, t) => acc + (parseFloat(t.hours || 0) || 0) * 60 + (parseFloat(t.minutes || 0) || 0), 0);

            // Count as valid streak day if ANY task is completed (min > 0)
            return completedMins > 0;
        };

        if (!isTodayDone(todayStr)) {
            checkDate.setDate(checkDate.getDate() - 1);
        }

        while (true) {
            const dateStr = formatDateKey(checkDate);
            if (isTodayDone(dateStr)) {
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

    const deriveDayStatus = (dayTasks) => {
        if (!dayTasks || dayTasks.length === 0) return null;

        const completedMins = dayTasks
            .filter(t => t.status === "Completed")
            .reduce((acc, t) => acc + (parseFloat(t.hours || 0) || 0) * 60 + (parseFloat(t.minutes || 0) || 0), 0);

        const allDone = dayTasks.length > 0 && dayTasks.every(t => t.status === "Completed");

        if (completedMins >= dailyTarget * 60 || allDone) return "completed";
        if (completedMins > 0 || dayTasks.some(t => t.status === "Completed")) return "skipped";
        return "not-completed";
    };

    const handleDateClick = (day, month, year) => {
        const dateStr = formatDateKey(new Date(year, month, day));
        setSelectedDate(dateStr);
        setTaskForm(prev => ({ ...prev, date: dateStr }));
    };

    const jumpToDate = (isoDate) => {
        if (!isoDate) return;
        const d = new Date(isoDate);
        setCurrentMonth(d.getMonth());
        setCurrentYear(d.getFullYear());
        setSelectedDate(isoDate);
        setTaskForm(prev => ({ ...prev, date: isoDate }));
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        const newTask = {
            ...taskForm,
            date: selectedDate
        };

        try {
            let newData;
            if (editingTask) {
                const updatedTasks = tasksData[selectedDate]?.tasks.map(t => t.id === editingTask.id ? { ...newTask, id: editingTask.id } : t) || [];
                newData = {
                    ...tasksData,
                    [selectedDate]: { ...tasksData[selectedDate], tasks: updatedTasks }
                };
                setEditingTask(null);
            } else {
                const currentDayTasks = tasksData[selectedDate]?.tasks || [];
                const newTaskWithId = { ...newTask, id: Date.now() };
                newData = {
                    ...tasksData,
                    [selectedDate]: { ...tasksData[selectedDate], tasks: [...currentDayTasks, newTaskWithId] }
                };
            }
            setTasksData(newData);
            await saveData('planner_data', newData);
            calculateStreak(newData);
            setTaskForm({ name: "", subject: "Physics", type: "Reading", hours: "1", minutes: "0", status: "Not Completed", notes: "", date: selectedDate });
        } catch (e) {
            console.error("Failed to save task:", e);
        }
    };

    const deleteTask = async (date, taskId) => {
        if (!confirm("Are you sure you want to delete this study update?")) return;

        try {
            const remaining = tasksData[date]?.tasks.filter(t => t.id !== taskId) || [];
            const newData = {
                ...tasksData,
                [date]: { ...tasksData[date], tasks: remaining }
            };
            setTasksData(newData);
            await saveData('planner_data', newData);
            calculateStreak(newData);
        } catch (e) {
            console.error("Failed to delete task:", e);
        }
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button className="nav-btn" onClick={() => {
                            if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
                            else setCurrentMonth(m => m - 1);
                        }}><ChevronLeft size={24} /></button>
                        <h1>{MONTHS[currentMonth]} {currentYear}</h1>
                        <button className="nav-btn" onClick={() => {
                            if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
                            else setCurrentMonth(m => m + 1);
                        }}><ChevronRight size={24} /></button>
                    </div>

                    <div className="jump-to-date" style={{ display: 'flex', gap: '8px' }}>
                        <div className="date-input-wrap">
                            <span>Jump to:</span>
                            <input
                                type="date"
                                onChange={(e) => jumpToDate(e.target.value)}
                                value={selectedDate}
                            />
                        </div>
                        <button className="today-btn" onClick={() => jumpToDate(formatDateKey(new Date()))}>Today</button>
                    </div>

                    {isLoading && <div className="sync-indicator"><RefreshCcw size={16} className="spin" /> Syncing...</div>}
                </header>

                <div className="tracker-grid-container">
                    <div className="planner-main-column">
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
                                    const dayStatus = deriveDayStatus(dayData?.tasks);

                                    const completedMinutes = dayData?.tasks?.filter(t => t.status === "Completed").reduce((acc, t) => acc + (parseFloat(t.hours || 0) || 0) * 60 + (parseFloat(t.minutes || 0) || 0), 0) || 0;
                                    const h = Math.floor(completedMinutes / 60);
                                    const m = completedMinutes % 60;
                                    const subjects = [...new Set(dayData?.tasks?.map(t => t.subject) || [])];

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
                                                    {completedMinutes > 0 && (
                                                        <div className="hours-indicator">
                                                            <Clock size={10} /> {h > 0 ? `${h}h ` : ''}{m > 0 || h === 0 ? `${m}m` : ''}
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

                        <div className="card history-footer compact">
                            <div className="history-header"><History size={18} /> Daily Performance Timeline (Last 7 Days)</div>
                            <div className="history-scroll">
                                {Array.from({ length: 7 }).map((_, i) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() - (6 - i)); // Chronological order: 7 days ago to today
                                    const dateStr = formatDateKey(d);
                                    const dayData = tasksData[dateStr] || { tasks: [] };
                                    const completedMinutes = dayData.tasks.filter(t => t.status === "Completed").reduce((acc, t) => acc + (parseFloat(t.hours || 0) || 0) * 60 + (parseFloat(t.minutes || 0) || 0), 0);
                                    const dayStatus = deriveDayStatus(dayData.tasks);
                                    const h = Math.floor(completedMinutes / 60);
                                    const m = completedMinutes % 60;

                                    return (
                                        <div key={dateStr} className="history-bar-card clickable" onClick={() => jumpToDate(dateStr)}>
                                            <span className="date">{new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                            <div className="bar-container">
                                                <div className={`bar ${dayStatus || 'none'}`} style={{ height: `${Math.max(10, Math.min(100, (completedMinutes / (dailyTarget * 60)) * 100))}%` }}></div>
                                            </div>
                                            <span className="hour-stat">{h > 0 ? `${h}h ` : ''}{m > 0 || h === 0 ? `${m}m` : ''}</span>
                                        </div>
                                    );
                                })}
                            </div>
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

                        {/* AI Daily Focus Summary */}
                        {tasksData[selectedDate]?.tasks.length > 0 && (
                            <div className="daily-focus-summary">
                                <div className="focus-header">
                                    <Sparkles size={16} color="#8b5cf6" />
                                    <span>AI Daily Focus</span>
                                </div>
                                <div className="focus-stats">
                                    {['Physics', 'Chemistry', 'Biology'].map(sub => {
                                        const subTasks = (tasksData[selectedDate]?.tasks || []).filter(t => t.subject === sub && t.status === 'Completed');
                                        const subMins = subTasks.reduce((acc, t) => acc + (parseFloat(t.hours || 0) || 0) * 60 + (parseFloat(t.minutes || 0) || 0), 0);
                                        if (subMins === 0) return null;
                                        const h = Math.floor(subMins / 60);
                                        const m = subMins % 60;
                                        return (
                                            <div key={sub} className={`sub-focus-pill ${sub.toLowerCase()}`}>
                                                <span className="name">{sub}</span>
                                                <span className="time">{h > 0 ? `${h}h ` : ''}{m > 0 || h === 0 ? `${m}m` : ''}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="target-progress-container">
                                    <div className="target-info">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>Daily Target ({dailyTarget}h)</span>
                                            <button className="edit-target-trigger" onClick={() => setIsEditingTarget(true)}><Edit3 size={12} /></button>
                                        </div>
                                        <span className="percent">{Math.min(100, Math.round(((tasksData[selectedDate]?.tasks.filter(t => t.status === "Completed").reduce((acc, t) => acc + (parseFloat(t.hours || 0) || 0) * 60 + (parseFloat(t.minutes || 0) || 0), 0) || 0) / (dailyTarget * 60)) * 100))}%</span>
                                    </div>
                                    <div className="target-bar-bg">
                                        <div className="target-bar-fill" style={{ width: `${Math.min(100, ((tasksData[selectedDate]?.tasks.filter(t => t.status === "Completed").reduce((acc, t) => acc + (parseFloat(t.hours || 0) || 0) * 60 + (parseFloat(t.minutes || 0) || 0), 0) || 0) / (dailyTarget * 60)) * 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isEditingTarget && (
                            <div className="target-modal-overlay">
                                <div className="target-modal">
                                    <h4>Set Daily Study Goal</h4>
                                    <p>How many hours do you plan to study every day?</p>
                                    <div className="modal-input-row">
                                        <input
                                            type="number"
                                            value={newTargetInput}
                                            onChange={e => setNewTargetInput(e.target.value)}
                                            min="1" max="24"
                                        />
                                        <span>Hours</span>
                                    </div>
                                    <div className="modal-btns">
                                        <button className="btn btn-secondary" onClick={() => { setIsEditingTarget(false); setNewTargetInput(dailyTarget.toString()); }}>Cancel</button>
                                        <button className="btn btn-primary" onClick={() => {
                                            const val = parseInt(newTargetInput) || 12;
                                            setDailyTarget(val);
                                            saveSettings(val);
                                            setIsEditingTarget(false);
                                        }}>Save Goal</button>
                                    </div>
                                </div>
                            </div>
                        )}

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
                                <div className="time-inputs-row">
                                    <div className="hours-input">
                                        <Clock size={16} />
                                        <input type="number" step="1" min="0" max="24" value={taskForm.hours} onChange={e => setTaskForm(f => ({ ...f, hours: e.target.value }))} />
                                        <span>hrs</span>
                                    </div>
                                    <div className="hours-input">
                                        <Timer size={16} />
                                        <input type="number" step="5" min="0" max="55" value={taskForm.minutes} onChange={e => setTaskForm(f => ({ ...f, minutes: e.target.value }))} />
                                        <span>min</span>
                                    </div>
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
                                {editingTask && <button type="button" className="btn btn-secondary" onClick={() => { setEditingTask(null); setTaskForm({ name: "", subject: "Physics", type: "Reading", hours: "1", minutes: "0", status: "Not Completed", notes: "", date: selectedDate }); }}>Cancel</button>}
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
                                        <div className="type-icon-box">
                                            {t.type === 'PYQs' ? <Target size={18} /> :
                                                t.type === 'Mock Test' ? <BarChart3 size={18} /> :
                                                    t.type === 'Revision' ? <RefreshCcw size={18} /> :
                                                        <BookOpen size={18} />}
                                        </div>
                                        <div className="update-content">
                                            <div className="update-meta">
                                                <span className={`subject-tag ${t.subject.toLowerCase()}`}>{t.subject}</span>
                                                <span className="hours-tag">
                                                    {parseInt(t.hours || 0) > 0 ? `${parseInt(t.hours)}h ` : ''}
                                                    {parseInt(t.minutes || 0) > 0 ? `${parseInt(t.minutes)}m` : (parseInt(t.hours || 0) === 0 ? '0m' : '')}
                                                </span>
                                            </div>
                                            <p className={`title ${t.status === 'Completed' ? 'done' : ''}`}>{t.name}</p>
                                            <div className="type-meta">{t.type}</div>
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
            </div>

            <style jsx>{`
                .calendar-page-container { padding: 1rem 0; display: flex; flex-direction: column; gap: 1.5rem; }
                .sync-indicator { position: absolute; right: 0; bottom: -20px; font-size: 0.75rem; color: #64748b; display: flex; align-items: center; gap: 4px; }
                .spin { animation: spin 1s linear infinite; }
                
                .jump-to-date {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .date-input-wrap {
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                    background: white;
                    padding: 0.6rem 1.2rem;
                    border-radius: 12px;
                    border: 1px solid var(--color-border);
                    box-shadow: var(--shadow-sm);
                }
                .date-input-wrap span { font-size: 0.85rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
                .date-input-wrap input { border: none; font-weight: 800; color: var(--color-primary); cursor: pointer; outline: none; font-size: 0.9rem; }
                
                .today-btn {
                    padding: 0.6rem 1rem;
                    background: var(--color-primary);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-weight: 800;
                    cursor: pointer;
                    box-shadow: var(--shadow-sm);
                    transition: all 0.2s;
                }
                .today-btn:hover { background: #4338ca; transform: translateY(-2px); }
                
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

                .planner-main-column { display: flex; flex-direction: column; gap: 1.5rem; flex: 1; min-width: 0; }
                .tracker-grid-container { display: grid; grid-template-columns: 1fr 400px; gap: 1.5rem; align-items: flex-start; }
                
                .wall-calendar-card { border-radius: 20px; overflow: hidden; background: white; box-shadow: var(--shadow-md); border: 1px solid #e2e8f0; }
                .weekday-header-grid { display: grid; grid-template-columns: repeat(7, 1fr); background: #1e293b; }
                .weekday-label { color: #94a3b8; text-align: center; padding: 1rem 0; font-weight: 800; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; }
                
                .calendar-box-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #e2e8f0; border-top: 1px solid #1e293b; }
                .calendar-box { aspect-ratio: 1.1; min-height: 110px; background: white; padding: 0.5rem; cursor: pointer; transition: all 0.2s; position: relative; display: flex; flex-direction: column; }
                .calendar-box:hover { z-index: 10; transform: scale(1.02); box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                .calendar-box.empty { background: #f8fafc; cursor: default; pointer-events: none; }
                
                .calendar-box.completed { background-color: #dcfce7 !important; border-bottom: 4px solid #22c55e; }
                .calendar-box.not-completed { background-color: #fee2e2 !important; border-bottom: 4px solid #ef4444; }
                .calendar-box.skipped { background-color: #fef9c3 !important; border-bottom: 4px solid #eab308; }
                .calendar-box.selected { background-color: #eff6ff !important; box-shadow: inset 0 0 0 3px var(--color-primary); }
                
                .date-number-wrapper { padding: 4px; }
                .date-number { font-weight: 800; font-size: 1.1rem; color: #475569; }
                .calendar-box.today .date-number { background: var(--color-primary); color: white; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.9rem; }
                
                .history-footer.compact { padding: 1.5rem; border-radius: 20px; box-shadow: var(--shadow-md); border: 1px solid #e2e8f0; }
                .history-header { font-weight: 800; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.6rem; font-size: 1rem; color: #1e293b; }
                .history-scroll { display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 0.5rem; justify-content: space-between; }
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
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; width: 100%; align-items: center; }
                .time-inputs-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; width: 100%; }
                .hours-input { display: flex; align-items: center; gap: 0.4rem; background: white; border: 1px solid #cbd5e1; padding: 0 0.6rem; border-radius: 8px; flex: 1; }
                .hours-input input { border: none !important; padding: 0.65rem 0 !important; width: 35px !important; text-align: center; font-weight: 800; outline: none !important; }
                .hours-input span { font-size: 0.75rem; font-weight: 700; color: #64748b; }

                .task-form input, .task-form select, .task-form textarea { 
                    width: 100%; box-sizing: border-box; padding: 0.75rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.9rem; font-weight: 600; outline: none; min-width: 0; background: white;
                }
                .task-form textarea { resize: none; background: #fff; }
                .form-actions { display: flex; gap: 0.6rem; }
                .form-actions button { flex: 1; padding: 0.85rem; font-weight: 800; }

                .updates-list { 
                    display: flex; 
                    flex-direction: column; 
                    gap: 0.75rem; 
                    max-height: 380px; 
                    overflow-y: auto; 
                    padding: 0.5rem 0.5rem 0.5rem 0;
                    margin-top: 1rem;
                }
                .updates-list::-webkit-scrollbar { width: 6px; }
                .updates-list::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
                .updates-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f1f5f9; }
                .updates-list::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                
                .update-item { 
                    display: flex; 
                    gap: 0.75rem; 
                    background: #ffffff; 
                    padding: 1rem; 
                    border-radius: 12px; 
                    border: 1px solid #edf2f7; 
                    align-items: center; 
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                    position: relative; 
                    overflow: hidden; 
                    transition: all 0.2s;
                    flex-shrink: 0;
                    min-height: 80px;
                }
                .update-item:hover { transform: translateX(4px); box-shadow: 0 6px 12px -2px rgba(0,0,0,0.08); border-color: var(--color-primary-light); }
                .status-border { position: absolute; left: 0; top: 0; bottom: 0; width: 5px; }
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

                .update-content .title { font-weight: 800; font-size: 0.95rem; margin: 0; color: #1e293b; line-height: 1.4; }
                .update-content .title.done { text-decoration: line-through; color: #94a3b8; }
                .update-content .notes { font-size: 0.8rem; color: #64748b; font-style: italic; margin-top: 0.3rem; line-height: 1.4; background: #f8fafc; padding: 4px 8px; border-radius: 6px; }
                .type-meta { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
                .type-icon-box { background: #f1f5f9; color: #64748b; width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                
                .daily-focus-summary { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; box-shadow: var(--shadow-sm); }
                .focus-header { display: flex; align-items: center; gap: 0.5rem; color: #8b5cf6; font-weight: 800; font-size: 0.85rem; text-transform: uppercase; }
                .focus-stats { display: flex; gap: 0.6rem; flex-wrap: wrap; }
                .sub-focus-pill { padding: 4px 12px; border-radius: 100px; display: flex; gap: 8px; font-size: 0.75rem; font-weight: 800; border: 1px solid #e2e8f0; }
                .sub-focus-pill.physics { background: #eff6ff; color: #1d4ed8; border-color: #dbeafe; }
                .sub-focus-pill.chemistry { background: #fff7ed; color: #c2410c; border-color: #ffedd5; }
                .sub-focus-pill.biology { background: #f0fdf4; color: #15803d; border-color: #dcfce7; }
                
                .target-progress-container { margin-top: 0.5rem; }
                .target-info { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 800; color: #64748b; margin-bottom: 6px; }
                .target-info .percent { color: var(--color-primary); }
                .target-bar-bg { height: 8px; background: #f1f5f9; border-radius: 100px; overflow: hidden; }
                .target-bar-fill { height: 100%; background: linear-gradient(90deg, var(--color-primary) 0%, #8b5cf6 100%); border-radius: 100px; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
                .edit-target-trigger { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 2px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                .edit-target-trigger:hover { background: #f1f5f9; color: var(--color-primary); }

                .target-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
                .target-modal { background: white; padding: 2rem; border-radius: 20px; width: 90%; max-width: 400px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
                .target-modal h4 { margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 800; }
                .target-modal p { color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; }
                .modal-input-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
                .modal-input-row input { border: 2px solid #e2e8f0; padding: 0.75rem 1rem; border-radius: 10px; width: 80px; font-size: 1.2rem; font-weight: 800; text-align: center; }
                .modal-input-row span { font-weight: 700; color: #475569; }
                .modal-btns { display: flex; gap: 1rem; }
                .modal-btns button { flex: 1; padding: 0.85rem; border-radius: 12px; font-weight: 800; }

                .update-actions { display: flex; gap: 0.4rem; margin-left: auto; }
                .action-btn { background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.5rem; border-radius: 8px; color: #94a3b8; transition: all 0.2s; }
                .action-btn:hover { background: #fff; color: var(--color-primary); border-color: var(--color-primary); }
                .action-btn.delete:hover { background: #fee2e2; color: #ef4444; border-color: #fca5a5; }
                
                .empty-state { text-align: center; padding: 4rem 1rem; color: #94a3b8; background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 16px; }
                .empty-state p { margin-top: 1rem; font-weight: 700; font-size: 0.95rem; line-height: 1.6; }

                .history-footer { padding: 1.5rem; }
                .history-header { font-weight: 800; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; }
                .history-scroll { display: flex; gap: 1.5rem; overflow-x: auto; padding-bottom: 0.75rem; }
                .history-bar-card { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; min-width: 80px; transition: all 0.2s; }
                .history-bar-card.clickable { cursor: pointer; }
                .history-bar-card.clickable:hover { transform: translateY(-5px); }
                .history-bar-card.clickable:hover .bar-container { box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-color: var(--color-primary); }
                
                .bar-container { height: 80px; width: 30px; background: #f1f5f9; border-radius: 6px; overflow: hidden; display: flex; flex-direction: column-reverse; transition: all 0.2s; border: 2px solid transparent; }
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
        </AppShell >
    );
}
