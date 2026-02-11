"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from "@/components/AppShell";
import {
    TrendingUp, Target, Clock, BookOpen,
    Award, AlertCircle, Calendar,
    Download, Zap, Star, ChevronDown
} from 'lucide-react';
import {
    BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, Cell
} from 'recharts';
import { useTimer } from "@/context/TimerContext";
import { loadData } from "@/lib/progress";
import { SYLLABUS_DATA } from "@/lib/syllabus-data";
import api, { getCookie } from '@/lib/api';

export default function AnalyticsPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [apiData, setApiData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syllabusData, setSyllabusData] = useState({});
    const [dateRange, setDateRange] = useState(30); // 7, 30, 90

    const { realStats, recentSessions, studyStreak } = useTimer();

    useEffect(() => {
        setMounted(true);
        const token = typeof window !== 'undefined' ? getCookie('token') : null;
        if (!token) {
            router.push("/login");
            return;
        }
        fetchAnalytics();
        loadSyllabusProgress();
    }, []);

    const loadSyllabusProgress = async () => {
        const prog = await loadData("syllabus", {});
        setSyllabusData(prog || {});
    };

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await api.get('/analytics-data/');
            setApiData(res.data);
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
            if (error.response?.status === 401) {
                router.push("/login");
            }
        } finally {
            setLoading(false);
        }
    };

    // --- REAL DATA AGGREGATION LOGIC ---
    const realAnalytics = useMemo(() => {
        if (!mounted) return null;

        // 1. Calculate Real Syllabus Progress (Independent of time range)
        const calculateSyllabus = () => {
            const stats = { Physics: 0, Chemistry: 0, Biology: 0 };
            let totalTopics = 0;
            let completedTopics = 0;

            Object.entries(SYLLABUS_DATA).forEach(([subject, units]) => {
                let subTotal = 0;
                let subDone = 0;
                units.forEach(unit => {
                    unit.subTopics.forEach(topic => {
                        subTotal++;
                        totalTopics++;
                        if (syllabusData[`${unit.id}-${topic}`]) {
                            subDone++;
                            completedTopics++;
                        }
                    });
                });
                stats[subject] = subTotal > 0 ? Math.round((subDone / subTotal) * 100) : 0;
            });

            return {
                subjectStats: stats,
                overall: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0
            };
        };

        const syllabus = calculateSyllabus();

        // 2. Filter Sessions by Date Range
        const now = new Date();
        const cutoff = new Date();
        cutoff.setDate(now.getDate() - dateRange);

        const filteredSessions = recentSessions.filter(s => {
            const sDate = s.createdAt?.seconds ? new Date(s.createdAt.seconds * 1000) : new Date();
            return sDate >= cutoff;
        });

        // 3. Aggregate Study Activity
        const getDailyActivity = () => {
            const chartDays = dateRange === 7 ? 7 : (dateRange === 30 ? 10 : 15); // Dynamic scale
            const activityData = [];
            for (let i = chartDays - 1; i >= 0; i--) {
                const d = new Date();
                const offset = dateRange === 30 ? i * 3 : (dateRange === 90 ? i * 6 : i);
                d.setDate(now.getDate() - offset);
                activityData.push({
                    date: d.toDateString(),
                    day: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
                    questions: 0,
                    hours: 0
                });
            }

            filteredSessions.forEach(session => {
                const sDate = new Date(session.createdAt?.seconds * 1000).toDateString();
                // Find closest match or direct match
                const dayObj = activityData.find(d => d.date === sDate);
                if (dayObj) {
                    const hrs = session.duration / 3600;
                    dayObj.hours += Number(hrs.toFixed(1));
                    const qRate = session.mode === 'Mock Test' ? 60 : 40;
                    dayObj.questions += Math.round(hrs * qRate);
                }
            });

            return activityData;
        };

        const dailyActivity = getDailyActivity();
        const totalSeconds = filteredSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
        const totalHours = totalSeconds / 3600;
        const totalQs = dailyActivity.reduce((acc, d) => acc + d.questions, 0);

        // 4. Subject Mastery (Combine syllabus + time)
        const subjectMastery = Object.entries(syllabus.subjectStats).map(([sub, completion]) => {
            const timeInSub = filteredSessions
                .filter(s => s.subject === sub)
                .reduce((acc, s) => acc + (s.duration || 0), 0) / 3600;

            const timeScore = Math.min((timeInSub / (dateRange / 3)) * 100, 100);
            return {
                subject: sub,
                completion: completion,
                accuracy: Math.round((completion * 0.7) + (timeScore * 0.3)) || 0
            };
        });

        return {
            overallStats: [
                { label: 'Questions Solved', value: totalQs.toLocaleString(), icon: 'Target', color: '#4F46E5', trend: 'Live' },
                { label: 'Estimated Accuracy', value: '72%', icon: 'Award', color: '#10B981', trend: '+0%' },
                { label: 'Study Time', value: `${Math.round(totalHours)}h`, icon: 'Clock', color: '#F59E0B', trend: `${dateRange} Days` },
                { label: 'Syllabus Done', value: `${syllabus.overall}%`, icon: 'BookOpen', color: '#EF4444', trend: 'Global' },
            ],
            subjectMastery,
            dailyActivity,
            mistakes: filteredSessions.filter(s => s.difficulty === 'Hard').slice(0, 3).map(s => ({
                topic: s.topic,
                attempts: 1,
                error: 'Difficulty'
            })),
            health: {
                goalCompletion: totalHours > 0 ? Math.min(Math.round((totalHours / (dateRange * 4)) * 100), 100) : 0,
                pyqCoverage: Math.round(syllabus.overall * 0.8),
                streak: studyStreak
            },
            intelligenceScore: {
                score: 300 + Math.round((syllabus.overall / 100) * 420),
                improvement: subjectMastery.sort((a, b) => a.completion - b.completion)[0]?.subject || 'Physics',
                gain: 25
            },
            rawSessions: filteredSessions // For report
        };
    }, [mounted, syllabusData, realStats, recentSessions, studyStreak, dateRange]);

    const handleDownloadReport = () => {
        if (!realAnalytics) return;

        const sessions = realAnalytics.rawSessions;
        const csvRows = [
            ["Date", "Subject", "Topic", "Duration (Sec)", "Mode", "Difficulty"],
            ...sessions.map(s => [
                new Date(s.createdAt?.seconds * 1000).toLocaleDateString(),
                s.subject,
                s.topic,
                s.duration,
                s.mode,
                s.difficulty
            ])
        ];

        const csvContent = "data:text/csv;charset=utf-8,"
            + csvRows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `NEET_Report_${dateRange}Days.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const displayData = realAnalytics || apiData;

    if (!mounted || loading && !displayData) return null;

    const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const getIcon = (iconName) => {
        switch (iconName) {
            case 'Target': return <Target size={20} />;
            case 'Award': return <Award size={20} />;
            case 'Clock': return <Clock size={20} />;
            case 'BookOpen': return <BookOpen size={20} />;
            default: return <TrendingUp size={20} />;
        }
    };

    const rightPanel = (
        <div className="analytics-right-panel">
            <div className="intelligence-score-section">
                <h3 className="section-title">Intelligence Score</h3>
                <div className="predictive-card">
                    <div className="score-circle-wrapper">
                        <div className="score-circle">
                            <span className="score-val">{displayData?.intelligenceScore?.score || 0}</span>
                            <span className="score-label">Predicted NEET</span>
                        </div>
                        <div className="pulse-ring-1"></div>
                        <div className="pulse-ring-2"></div>
                    </div>
                    <p className="predictive-desc">
                        Personalized score based on your real syllabus progress.
                    </p>
                    <div className="suggestion-box">
                        <AlertCircle size={14} color="#4F46E5" />
                        <span>Focus on <b>{displayData?.intelligenceScore?.improvement}</b> to gain +{displayData?.intelligenceScore?.gain} marks.</span>
                    </div>
                </div>
            </div>

            <div className="mistake-watchlist-section">
                <h3 className="section-title">Mistake Watchlist</h3>
                <div className="mistake-list">
                    {displayData?.mistakes?.length > 0 ? displayData.mistakes.map((item, i) => (
                        <div key={i} className="mistake-item">
                            <div className="mistake-info">
                                <h4 className="mistake-topic">{item.topic}</h4>
                                <p className="mistake-meta">{item.error} difficulty • {item.attempts} sessions</p>
                            </div>
                            <div className="fix-btn">Target</div>
                        </div>
                    )) : (
                        <p className="text-center text-slate-400 text-xs py-4">No hard sessions recently. Keep it up!</p>
                    )}
                </div>
            </div>

            <style jsx>{`
                .analytics-right-panel { display: flex; flex-direction: column; gap: 32px; width: 100%; }
                .section-title { font-size: 0.8rem; font-weight: 800; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
                .predictive-card {
                    background: linear-gradient(135deg, var(--color-primary-light) 0%, #fff 100%);
                    padding: 32px 24px;
                    border-radius: 24px;
                    border: 1px solid var(--color-primary-medium);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    box-shadow: 0 10px 30px -10px rgba(79, 70, 229, 0.2);
                    position: relative;
                    overflow: hidden;
                }
                .score-circle-wrapper { position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; }
                .score-circle {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: white;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 2;
                    box-shadow: 0 10px 20px rgba(79, 70, 229, 0.15);
                    border: 4px solid white;
                }
                .pulse-ring-1, .pulse-ring-2 {
                    position: absolute;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    border-radius: 50%;
                    border: 1px solid var(--color-primary);
                    opacity: 0;
                    z-index: 1;
                }
                .pulse-ring-1 { width: 100%; height: 100%; animation: pulse-ring 3s infinite; }
                .pulse-ring-2 { width: 100%; height: 100%; animation: pulse-ring 3s infinite 1.5s; }
                
                @keyframes pulse-ring {
                    0% { width: 100%; height: 100%; opacity: 0.5; border-width: 2px; }
                    100% { width: 180%; height: 180%; opacity: 0; border-width: 0px; }
                }

                .score-val { font-size: 1.85rem; font-weight: 900; color: var(--color-primary); line-height: 0.9; letter-spacing: -1px; }
                .score-label { font-size: 0.6rem; font-weight: 800; color: var(--color-text-muted); text-transform: uppercase; margin-top: 4px; text-align: center; letter-spacing: 0.5px; }
                .predictive-desc { font-size: 0.8rem; text-align: center; margin-top: 20px; color: var(--color-text-main); font-weight: 500; line-height: 1.5; z-index: 2; }
                .suggestion-box {
                    margin-top: 20px;
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(10px);
                    padding: 14px 18px;
                    border-radius: 16px;
                    font-size: 0.8rem;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                    border: 1px solid var(--color-primary-light);
                    width: 100%;
                    z-index: 2;
                    line-height: 1.4;
                    color: var(--color-text-muted);
                }
                .mistake-list { display: flex; flex-direction: column; gap: 12px; }
                .mistake-item {
                    background: var(--color-surface);
                    padding: 16px;
                    border-radius: 18px;
                    border: 1px solid var(--color-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.2s;
                    cursor: pointer;
                }
                .mistake-item:hover { border-color: var(--color-primary); transform: translateX(2px); }
                .mistake-info { flex: 1; min-width: 0; padding-right: 12px; }
                .mistake-topic { font-size: 0.9rem; font-weight: 700; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--color-text-main); }
                .mistake-meta { font-size: 0.75rem; color: var(--color-text-muted); margin: 4px 0 0 0; font-weight: 500; }
                .fix-btn {
                    padding: 8px 16px;
                    background: var(--color-text-main);
                    color: white;
                    border-radius: 10px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .fix-btn:hover { background: var(--color-primary); box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
            `}</style>
        </div>
    );

    return (
        <AppShell rightPanel={rightPanel}>
            <div className="analytics-main-container">
                <header className="analytics-header">
                    <div className="header-text">
                        <h1 className="analytics-title">Study Intelligence</h1>
                        <p className="analytics-subtitle">Deep analysis of your NEET preparation journey</p>
                    </div>
                    <div className="header-actions">
                        <div className="date-picker-dropdown">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(Number(e.target.value))}
                                className="filter-select"
                            >
                                <option value={7}>Last 7 Days</option>
                                <option value={30}>Last 30 Days</option>
                                <option value={90}>Last 90 Days</option>
                            </select>
                            <Calendar size={14} className="cal-icon" />
                            <ChevronDown size={14} className="chevron-icon" />
                        </div>
                        <button className="download-btn" onClick={handleDownloadReport}>
                            <Download size={14} />
                            <span>Report</span>
                        </button>
                    </div>
                </header>

                <div className="stats-grid">
                    {displayData?.overallStats?.map((stat, i) => (
                        <div key={i} className="card stat-card">
                            <div className="stat-header">
                                <div className="stat-icon-wrapper" style={{ background: `${stat.color}15`, color: stat.color }}>
                                    {getIcon(stat.icon)}
                                </div>
                                <span className="stat-trend" style={{ color: '#4F46E5', background: '#EEF2FF' }}>
                                    {stat.trend}
                                </span>
                            </div>
                            <div className="stat-body">
                                <h2 className="stat-value">{stat.value}</h2>
                                <p className="stat-label">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="charts-row">
                    <div className="card activity-card">
                        <div className="card-header">
                            <h3 className="card-title">Study Activity ({dateRange} Days)</h3>
                            <div className="chart-legend">
                                <span className="legend-item"><span className="dot questions"></span> EST. Qs</span>
                                <span className="legend-item"><span className="dot hours"></span> HOURS</span>
                            </div>
                        </div>
                        <div className="chart-container-lg">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={displayData?.dailyActivity || []}>
                                    <defs>
                                        <linearGradient id="colorQ" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                    <YAxis hide />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="questions" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorQ)" />
                                    <Line type="monotone" dataKey="hours" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="card mastery-card">
                        <h3 className="card-title">Subject Mastery</h3>
                        <div className="chart-container-sm">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={displayData?.subjectMastery || []}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                                    <Radar name="Accuracy" dataKey="accuracy" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.4} />
                                    <Radar name="Completion" dataKey="completion" stroke="#10B981" fill="#10B981" fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="subject-pills">
                            {displayData?.subjectMastery?.map((d, i) => (
                                <div key={i} className="subject-pill">
                                    <span className="sub-name">{d.subject}</span>
                                    <b className="sub-val">{d.completion}%</b>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="details-grid">
                    <div className="card detail-card">
                        <h3 className="card-title">Trends</h3>
                        <div className="chart-container-md">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={displayData?.dailyActivity || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px' }} />
                                    <Line type="monotone" dataKey="hours" stroke="#F59E0B" strokeWidth={4} dot={{ r: 5, fill: '#fff', stroke: '#F59E0B', strokeWidth: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="card detail-card">
                        <h3 className="card-title">Completion</h3>
                        <div className="chart-container-md">
                            <ResponsiveContainer width="100%" height="100%">
                                <ReBarChart data={displayData?.subjectMastery || []} layout="vertical" margin={{ left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} width={85} />
                                    <Tooltip />
                                    <Bar dataKey="completion" radius={[0, 8, 8, 0]} barSize={12}>
                                        {(displayData?.subjectMastery || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </ReBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="card detail-card health-card">
                        <h3 className="card-title">Prep Health</h3>
                        <div className="health-stat-list">
                            <div className="health-item">
                                <div className="health-labels">
                                    <span className="h-label">Goal Completion</span>
                                    <b className="h-val green">{displayData?.health?.goalCompletion || 0}%</b>
                                </div>
                                <div className="progress-bg"><div className="progress-bar green" style={{ width: `${displayData?.health?.goalCompletion || 0}%` }}></div></div>
                            </div>
                            <div className="health-item">
                                <div className="health-labels">
                                    <span className="h-label">PYQ Coverage</span>
                                    <b className="h-val purple">{displayData?.health?.pyqCoverage || 0}%</b>
                                </div>
                                <div className="progress-bg"><div className="progress-bar purple" style={{ width: `${displayData?.health?.pyqCoverage || 0}%` }}></div></div>
                            </div>
                            <div className="health-item">
                                <div className="health-labels">
                                    <span className="h-label">Active Streak</span>
                                    <b className="h-val orange">{displayData?.health?.streak || 0} Days</b>
                                </div>
                                <div className="progress-bg"><div className="progress-bar orange" style={{ width: `${Math.min((displayData?.health?.streak || 0) * 5, 100)}%` }}></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .analytics-main-container { display: flex; flex-direction: column; gap: 32px; padding-bottom: 40px; }
                .analytics-header { display: flex; justify-content: space-between; align-items: center; gap: 24px; }
                .analytics-title { font-size: 1.85rem; font-weight: 900; margin: 0; color: var(--color-text-main); letter-spacing: -0.01em; }
                .analytics-subtitle { color: var(--color-text-muted); font-size: 0.95rem; margin-top: 6px; font-weight: 600; }
                
                .header-actions { display: flex; gap: 12px; }
                
                .date-picker-dropdown {
                    position: relative;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    padding: 0 12px 0 38px;
                    box-shadow: var(--shadow-sm);
                    cursor: pointer;
                }

                .filter-select {
                    appearance: none;
                    background: transparent;
                    border: none;
                    outline: none;
                    padding: 10px 24px 10px 0;
                    font-size: 0.85rem;
                    font-weight: 800;
                    color: var(--color-text-main);
                    cursor: pointer;
                    z-index: 2;
                }

                .cal-icon { position: absolute; left: 14px; color: var(--color-primary); z-index: 1; }
                .chevron-icon { position: absolute; right: 12px; color: var(--color-text-muted); pointer-events: none; }

                .download-btn {
                    background: var(--color-text-main);
                    color: white;
                    border: none;
                    padding: 10px 18px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.85rem;
                    font-weight: 800;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    transition: all 0.2s;
                    cursor: pointer;
                }
                .download-btn:hover { background: var(--color-primary); transform: translateY(-2px); }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                }
                .stat-card { padding: 24px; display: flex; flex-direction: column; gap: 16px; border: 1px solid var(--color-border); }
                .stat-header { display: flex; justify-content: space-between; align-items: center; }
                .stat-icon-wrapper { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
                .stat-trend { font-size: 0.65rem; font-weight: 900; color: #10B981; padding: 5px 10px; background: #E1FDF4; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
                .stat-value { font-size: 1.75rem; font-weight: 950; line-height: 1; color: var(--color-text-main); margin: 0; }
                .stat-label { font-size: 0.7rem; font-weight: 800; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }

                .charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
                .activity-card, .mastery-card { padding: 32px; border: 1px solid var(--color-border); }
                .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .card-title { font-size: 1.1rem; font-weight: 900; margin: 0; color: var(--color-text-main); }
                
                .chart-legend { display: flex; gap: 20px; }
                .legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.65rem; font-weight: 800; color: var(--color-text-muted); }
                .dot { width: 10px; height: 10px; border-radius: 50%; }
                .dot.questions { background: var(--color-primary); }
                .dot.hours { background: #10B981; }

                .chart-container-lg { height: 320px; width: 100%; margin-top: 10px; }
                .chart-container-sm { height: 260px; width: 100%; margin: 20px 0; }
                .chart-container-md { height: 200px; width: 100%; margin-top: 24px; }

                .subject-pills { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: auto; }
                .subject-pill { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; }
                .sub-name { font-size: 0.65rem; font-weight: 800; color: var(--color-text-muted); text-transform: uppercase; }
                .sub-val { font-size: 0.9rem; font-weight: 900; color: var(--color-text-main); }

                .details-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
                .detail-card { padding: 24px; border: 1px solid var(--color-border); }

                .health-stat-list { display: flex; flex-direction: column; gap: 28px; margin-top: 24px; }
                .health-item { display: flex; flex-direction: column; gap: 10px; }
                .health-labels { display: flex; justify-content: space-between; align-items: flex-end; }
                .h-label { font-size: 0.75rem; font-weight: 800; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
                .h-val { font-size: 1rem; font-weight: 950; line-height: 1; }
                .h-val.green { color: #10B981; }
                .h-val.purple { color: var(--color-primary); }
                .h-val.orange { color: #f59e0b; }
                
                .progress-bg { width: 100%; height: 10px; background: #f1f5f9; border-radius: 5px; overflow: hidden; }
                .progress-bar { height: 100%; border-radius: 5px; }
                .progress-bar.green { background: #10B981; }
                .progress-bar.purple { background: var(--color-primary); }
                .progress-bar.orange { background: #f59e0b; }

                @media (max-width: 1200px) {
                    .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
                    .charts-row { grid-template-columns: 1fr; gap: 32px; }
                    .details-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
                    .health-card { grid-column: span 2; }
                    .chart-container-sm { height: 300px; }
                }

                @media (max-width: 768px) {
                    .analytics-main-container { padding-bottom: 80px; gap: 24px; }
                    .analytics-header { flex-direction: column; align-items: flex-start; gap: 16px; }
                    .analytics-title { font-size: 1.75rem; line-height: 1.1; }
                    .stats-grid { grid-template-columns: 1fr; gap: 12px; }
                    .stat-card { padding: 20px; flex-direction: row; align-items: center; justify-content: space-between; }
                    .stat-header { order: 2; }
                    .stat-body { order: 1; display: flex; flex-direction: column-reverse; gap: 4px; }
                    .stat-value { font-size: 1.5rem; }
                    .stat-label { font-size: 0.65rem; margin: 0; }
                    
                    .details-grid { grid-template-columns: 1fr; gap: 24px; }
                    .details-grid .card { padding: 20px; }
                    .health-card { grid-column: span 1; }
                    
                    .header-actions { width: 100%; display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px; }
                    .date-picker-dropdown { width: 100%; padding: 0 12px 0 36px; }
                    .date-picker-dropdown select { width: 100%; }
                    .download-btn { width: 100%; justify-content: center; }
                    
                    .subject-pills { grid-template-columns: 1fr; }
                    .activity-card, .mastery-card { padding: 20px; }
                    .chart-legend { display: none; }
                }

                @media (max-width: 480px) {
                    .analytics-title { font-size: 1.5rem; }
                    .header-actions { grid-template-columns: 1fr; }
                }
            `}</style>
        </AppShell>
    );
}
