"use client";

import { useState, useMemo, useEffect } from "react";
import AppShell from "@/components/AppShell";
import {
    Search, ChevronRight, ChevronDown, BookOpen,
    Target, Zap, Clock, Info, ExternalLink,
    FileText, Video, Layout, CheckCircle, Circle
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { saveData, loadData } from "@/lib/progress";

// Detailed Syllabus Data based on User Request
import { SYLLABUS_DATA } from "@/lib/syllabus-data";

export default function SyllabusPage() {
    const [activeTab, setActiveTab] = useState("Biology");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedChapter, setExpandedChapter] = useState(null);
    const [topicProgress, setTopicProgress] = useState({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const syncSyllabus = async () => {
            const serverProgress = await loadData("syllabus", {});
            if (serverProgress) {
                setTopicProgress(serverProgress);
            }
        };
        syncSyllabus();
    }, []);

    const toggleSubTopic = (chapterId, subTopicName) => {
        const key = `${chapterId}-${subTopicName}`;
        const newProgress = {
            ...topicProgress,
            [key]: !topicProgress[key]
        };
        setTopicProgress(newProgress);
        saveData("syllabus", newProgress);
    };

    const toggleChapterBox = (chapterId) => {
        if (expandedChapter === chapterId) {
            setExpandedChapter(null);
        } else {
            setExpandedChapter(chapterId);
        }
    };

    const filteredChapters = useMemo(() => {
        return SYLLABUS_DATA[activeTab].filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.subTopics.some(st => st.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [activeTab, searchQuery]);

    const calculateProgress = (chapter) => {
        const total = chapter.subTopics.length;
        const completed = chapter.subTopics.filter(st => topicProgress[`${chapter.id}-${st}`]).length;
        return { completed, total, percent: Math.round((completed / total) * 100) };
    };

    const overallMastery = useMemo(() => {
        let totalTopics = 0;
        let completedTopics = 0;
        SYLLABUS_DATA[activeTab].forEach(chap => {
            totalTopics += chap.subTopics.length;
            completedTopics += chap.subTopics.filter(st => topicProgress[`${chap.id}-${st}`]).length;
        });
        return totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);
    }, [activeTab, topicProgress]);

    if (!mounted) return null;

    return (
        <AppShell>
            <div className="syllabus-page">
                {/* Hero Header */}
                <div className="hero-section">
                    <div className="hero-badges">
                        <span className="badge">NEET 2026</span>
                        <span className="badge yellow">UPDATED CURRICULUM</span>
                    </div>
                    <h1>{activeTab} Syllabus</h1>
                    <p>Master the core concepts of {activeTab} with our detailed breakdown.</p>

                    <div className="hero-stats">
                        <div className="stat-item">
                            <span className="stat-val">{SYLLABUS_DATA[activeTab].length}</span>
                            <span className="stat-lab">UNITS</span>
                        </div>
                        <div className="divider"></div>
                        <div className="stat-item mastery">
                            <div className="progress-circle">
                                <span>{overallMastery}%</span>
                            </div>
                            <span className="stat-lab">MASTERY</span>
                        </div>
                    </div>
                </div>

                <div className="main-layout">
                    {/* Left Content */}
                    <div className="content-left">
                        {/* Search Bar */}
                        <div className="search-container">
                            <Search className="search-icon" size={20} />
                            <input
                                type="text"
                                placeholder={`Search in ${activeTab}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Custom Tabs */}
                        <div className="tab-switcher">
                            {['Biology', 'Chemistry', 'Physics'].map(tab => (
                                <button
                                    key={tab}
                                    className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab === 'Biology' && <Target size={18} />}
                                    {tab === 'Chemistry' && <Layout size={18} />}
                                    {tab === 'Physics' && <Zap size={18} />}
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Chapters List */}
                        <div className="chapters-list">
                            {filteredChapters.map((chapter) => {
                                const progress = calculateProgress(chapter);
                                const isExpanded = expandedChapter === chapter.id;

                                return (
                                    <div key={chapter.id} className={`chapter-item ${isExpanded ? 'expanded' : ''}`}>
                                        <div className="chapter-header" onClick={() => toggleChapterBox(chapter.id)}>
                                            <div className="chapter-info">
                                                <div className="chapter-meta">
                                                    <span className="class-label">{chapter.class}</span>
                                                    <span className={`weight-badge ${chapter.weight.replace(' ', '-').toLowerCase()}`}>
                                                        {chapter.weight} WEIGHTAGE
                                                    </span>
                                                    {chapter.avgQs && (
                                                        <span className="avg-qs-badge">
                                                            Avg {chapter.avgQs} Qs
                                                        </span>
                                                    )}
                                                </div>
                                                <h3>{chapter.name}</h3>
                                                <div className="mini-progress">
                                                    <div className="bar-bg">
                                                        <div className="bar-fill" style={{ width: `${progress.percent}%` }}></div>
                                                    </div>
                                                    <span>{progress.completed}/{progress.total} topics</span>
                                                </div>
                                            </div>
                                            {isExpanded ? <ChevronDown className="arrow" /> : <ChevronRight className="arrow" />}
                                        </div>

                                        {isExpanded && (
                                            <div className="sub-topics-list">
                                                {chapter.subTopics.map((subTopic) => {
                                                    const isChecked = !!topicProgress[`${chapter.id}-${subTopic}`];
                                                    return (
                                                        <div
                                                            key={subTopic}
                                                            className={`sub-topic-item ${isChecked ? 'done' : ''}`}
                                                            onClick={() => toggleSubTopic(chapter.id, subTopic)}
                                                        >
                                                            <div className="check-circle">
                                                                {isChecked ? <CheckCircle size={18} className="checked-icon" /> : <Circle size={18} />}
                                                            </div>
                                                            <span>{subTopic}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <aside className="content-right">
                        <div className="sidebar-card">
                            <div className="card-header">
                                <Info size={20} />
                                <h3>Study Guide</h3>
                            </div>
                            <div className="guide-item">
                                <span className="emoji">⚠️</span>
                                <div>
                                    <p className="guide-title">Important Topics</p>
                                    <p className="guide-desc">Focus heavily on topics marked with ⚠️. These are high yield.</p>
                                </div>
                            </div>
                            <div className="guide-item">
                                <span className="emoji">⚠️⚠️</span>
                                <div>
                                    <p className="guide-title">Critical Topics</p>
                                    <p className="guide-desc">Do NOT skip these. They carry maximum marks.</p>
                                </div>
                            </div>
                        </div>

                        <div className="sidebar-card">
                            <div className="card-header">
                                <BookOpen size={20} />
                                <h3>Quick Prep Links</h3>
                            </div>
                            <div className="prep-links">
                                <a href="#" className="prep-link"><Video size={16} /> One Shot Lectures</a>
                                <a href="#" className="prep-link"><FileText size={16} /> Revision Notes</a>
                                <a href="#" className="prep-link"><ExternalLink size={16} /> Previous Year Questions</a>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <style jsx>{`
                .syllabus-page {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }

                /* Hero Section */
                .hero-section {
                    background: ${activeTab === 'Physics' ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' :
                    activeTab === 'Chemistry' ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' :
                        'linear-gradient(135deg, #10B981 0%, #059669 100%)' // Biology
                };
                    border-radius: 24px;
                    padding: 48px;
                    color: white;
                    margin-bottom: 32px;
                    position: relative;
                    overflow: hidden;
                    transition: background 0.5s ease;
                }

                .hero-badges {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .badge {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 6px 16px;
                    border-radius: 999px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.02em;
                }

                .badge.yellow {
                    background: #FACC15;
                    color: #854D0E;
                }

                .hero-section h1 {
                    font-size: 3rem;
                    font-weight: 800;
                    margin-bottom: 16px;
                    color: white;
                }

                .hero-section p {
                    font-size: 1.1rem;
                    opacity: 0.9;
                    margin-bottom: 40px;
                    max-width: 600px;
                }

                .hero-stats {
                    display: flex;
                    align-items: center;
                    gap: 48px;
                    flex-wrap: wrap;
                }

                .stat-item {
                    display: flex;
                    flex-direction: column;
                }

                .stat-val {
                    font-size: 2.5rem;
                    font-weight: 800;
                    line-height: 1;
                }

                .stat-lab {
                    font-size: 0.8rem;
                    font-weight: 700;
                    opacity: 0.8;
                    margin-top: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .divider {
                    width: 1px;
                    height: 40px;
                    background: rgba(255, 255, 255, 0.3);
                    display: block;
                }

                .stat-item.mastery {
                    flex-direction: row;
                    align-items: center;
                    gap: 16px;
                }

                .progress-circle {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    border: 4px solid rgba(255, 255, 255, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 0.9rem;
                }

                /* Layout */
                .main-layout {
                    display: grid;
                    grid-template-columns: 1fr 320px;
                    gap: 32px;
                }

                /* Search container */
                .search-container {
                    background: white;
                    border-radius: 16px;
                    padding: 16px 24px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    border: 1px solid #E2E8F0;
                    margin-bottom: 24px;
                }

                .search-icon {
                    color: #94A3B8;
                }

                .search-container input {
                    border: none;
                    outline: none;
                    width: 100%;
                    font-size: 1rem;
                    color: #1E293B;
                }

                /* Tab Switcher */
                .tab-switcher {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-bottom: 32px;
                }

                .tab-btn {
                    padding: 14px;
                    border-radius: 14px;
                    border: 1px solid #E2E8F0;
                    background: white;
                    color: #64748B;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .tab-btn.active {
                    background: ${activeTab === 'Physics' ? '#3B82F6' :
                    activeTab === 'Chemistry' ? '#F97316' :
                        '#10B981'
                };
                    color: white;
                    border-color: ${activeTab === 'Physics' ? '#3B82F6' :
                    activeTab === 'Chemistry' ? '#F97316' :
                        '#10B981'
                };
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                /* Chapters List */
                .chapters-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .chapter-item {
                    background: white;
                    border: 1px solid #E2E8F0;
                    border-radius: 16px;
                    overflow: hidden;
                    transition: all 0.2s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }
                
                .chapter-item.expanded {
                    border-color: ${activeTab === 'Physics' ? '#3B82F6' :
                    activeTab === 'Chemistry' ? '#F97316' :
                        '#10B981'
                };
                    box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
                }

                .chapter-header {
                    padding: 20px 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                }

                .chapter-header:hover {
                    background: #F8FAFC;
                }
                
                .chapter-info {
                    flex: 1;
                }

                .chapter-meta {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 6px;
                    flex-wrap: wrap;
                }

                .class-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #94A3B8;
                    text-transform: uppercase;
                }

                .weight-badge {
                    font-size: 0.65rem;
                    font-weight: 800;
                    padding: 4px 8px;
                    border-radius: 6px;
                    text-align: center;
                    color: white;
                    text-transform: uppercase;
                }

                .weight-badge.very-high { background: #DC2626; }
                .weight-badge.high { background: #F97316; }
                .weight-badge.medium { background: #8B5CF6; }
                
                .avg-qs-badge {
                    font-size: 0.65rem;
                    font-weight: 700;
                    color: #059669;
                    background: #D1FAE5;
                    padding: 4px 8px;
                    border-radius: 6px;
                }

                .chapter-info h3 {
                    font-size: 1.15rem;
                    font-weight: 700;
                    color: #1E293B;
                    margin-bottom: 8px;
                }
                
                .mini-progress {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 0.8rem;
                    color: #64748B;
                    font-weight: 600;
                }
                
                .bar-bg {
                    width: 100px;
                    height: 6px;
                    background: #E2E8F0;
                    border-radius: 99px;
                    overflow: hidden;
                }
                
                .bar-fill {
                    height: 100%;
                    background: ${activeTab === 'Physics' ? '#3B82F6' :
                    activeTab === 'Chemistry' ? '#F97316' :
                        '#10B981'
                };
                    transition: width 0.3s ease;
                }

                .arrow {
                    color: #94A3B8;
                    margin-left: 16px;
                }

                /* Sub Topics */
                .sub-topics-list {
                    background: #F8FAFC;
                    border-top: 1px solid #E2E8F0;
                    padding: 12px 24px 24px;
                }

                .sub-topic-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #475569;
                    font-weight: 500;
                }

                .sub-topic-item:hover {
                    background: white;
                    color: #1E293B;
                }

                .sub-topic-item.done {
                    color: #10B981;
                    text-decoration: line-through;
                    opacity: 0.8;
                }

                .check-circle {
                    color: #CBD5E1;
                    display: flex;
                    align-items: center;
                }

                .sub-topic-item:hover .check-circle {
                    color: #94A3B8;
                }

                .checked-icon {
                    color: #10B981;
                }

                /* Sidebar */
                .content-right {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .sidebar-card {
                    background: white;
                    border: 1px solid #E2E8F0;
                    border-radius: 20px;
                    padding: 24px;
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                    color: #1E293B;
                }

                .card-header h3 {
                    font-size: 1.1rem;
                    font-weight: 800;
                }

                .guide-item {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 20px;
                }
                
                .emoji {
                    font-size: 1.2rem;
                }

                .guide-title {
                    font-size: 0.95rem;
                    font-weight: 800;
                    color: #1E293B;
                    margin-bottom: 4px;
                }

                .guide-desc {
                    font-size: 0.85rem;
                    color: #64748B;
                    line-height: 1.4;
                }

                .prep-links {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .prep-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: #475569;
                    text-decoration: none;
                }

                .prep-link:hover {
                    color: #3B82F6;
                }

                @media (max-width: 1024px) {
                    .main-layout {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 640px) {
                    .hero-section {
                        padding: 32px 24px;
                    }

                    .hero-section h1 {
                        font-size: 2rem;
                    }

                    .hero-stats {
                        gap: 24px;
                    }

                    .divider {
                        display: none;
                    }

                    .stat-item {
                        padding-right: 20px;
                        border-right: 1px solid rgba(255,255,255,0.2);
                        margin-right: 20px;
                    }

                    .stat-item:last-child {
                        border-right: none;
                        margin-right: 0;
                        padding-right: 0;
                    }

                    .tab-switcher {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </AppShell>
    );
}
