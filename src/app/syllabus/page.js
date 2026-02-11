"use client";

import { useState, useMemo, useEffect } from "react";
import AppShell from "@/components/AppShell";
import {
    Search, ChevronRight, ChevronDown, BookOpen,
    Target, Zap, Clock, Info, ExternalLink,
    FileText, Video, Layout, CheckCircle, Circle, Bookmark, TrendingUp,
    Plus, X
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
    const [customSyllabus, setCustomSyllabus] = useState({ Biology: [], Chemistry: [], Physics: [] });
    const [mounted, setMounted] = useState(false);
    const [isAddingUnit, setIsAddingUnit] = useState(false);
    const [isAddingTopic, setIsAddingTopic] = useState(null); // chapterId
    const [newUnit, setNewUnit] = useState({ name: "", class: "Class 11", weight: "MEDIUM" });
    const [newTopic, setNewTopic] = useState("");

    useEffect(() => {
        setMounted(true);
        const syncSyllabus = async () => {
            const [serverProgress, customData] = await Promise.all([
                loadData("syllabus", {}),
                loadData("custom_syllabus", { Biology: [], Chemistry: [], Physics: [] })
            ]);
            if (serverProgress) setTopicProgress(serverProgress);
            if (customData) setCustomSyllabus(customData);
        };
        syncSyllabus();
    }, []);

    const mergedSyllabus = useMemo(() => {
        return {
            Biology: [...SYLLABUS_DATA.Biology, ...customSyllabus.Biology],
            Chemistry: [...SYLLABUS_DATA.Chemistry, ...customSyllabus.Chemistry],
            Physics: [...SYLLABUS_DATA.Physics, ...customSyllabus.Physics]
        };
    }, [customSyllabus]);

    const handleAddUnit = () => {
        if (!newUnit.name) return;
        const unitId = `CUSTOM-${Date.now()}`;
        const updated = {
            ...customSyllabus,
            [activeTab]: [...customSyllabus[activeTab], { ...newUnit, id: unitId, subTopics: [] }]
        };
        setCustomSyllabus(updated);
        saveData("custom_syllabus", updated);
        setIsAddingUnit(false);
        setNewUnit({ name: "", class: "Class 11", weight: "MEDIUM" });
    };

    const handleAddTopic = (chapterId) => {
        if (!newTopic) return;

        // If it's a custom chapter, update it in customSyllabus
        if (chapterId.startsWith("CUSTOM-")) {
            const updated = {
                ...customSyllabus,
                [activeTab]: customSyllabus[activeTab].map(chap =>
                    chap.id === chapterId ? { ...chap, subTopics: [...chap.subTopics, newTopic] } : chap
                )
            };
            setCustomSyllabus(updated);
            saveData("custom_syllabus", updated);
        } else {
            // If it's a default chapter, we need special storage for added topics to default chapters
            // or just allow adding to default chapters by tracking them in customSyllabus too?
            // Let's keep it simple: any default chapter with added topics gets a clone in customSyllabus or we use a separate mapping.
            // Better: use a separate mapping for 'extra_topics'
            const updated = {
                ...customSyllabus,
                extraTopics: {
                    ...(customSyllabus.extraTopics || {}),
                    [chapterId]: [...(customSyllabus.extraTopics?.[chapterId] || []), newTopic]
                }
            };
            setCustomSyllabus(updated);
            saveData("custom_syllabus", updated);
        }
        setNewTopic("");
        setIsAddingTopic(null);
    };

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
        setExpandedChapter(expandedChapter === chapterId ? null : chapterId);
    };

    const currentSyllabusList = useMemo(() => {
        const base = mergedSyllabus[activeTab];
        return base.map(chap => ({
            ...chap,
            subTopics: [...chap.subTopics, ...(customSyllabus.extraTopics?.[chap.id] || [])]
        }));
    }, [mergedSyllabus, activeTab, customSyllabus.extraTopics]);

    const filteredChapters = useMemo(() => {
        return currentSyllabusList.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.subTopics.some(st => st.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [currentSyllabusList, searchQuery]);

    const calculateProgress = (chapter) => {
        const total = chapter.subTopics.length;
        const completed = chapter.subTopics.filter(st => topicProgress[`${chapter.id}-${st}`]).length;
        return { completed, total, percent: Math.round((completed / total) * 100) };
    };

    const overallMastery = useMemo(() => {
        let totalTopics = 0;
        let completedTopics = 0;
        currentSyllabusList.forEach(chap => {
            totalTopics += chap.subTopics.length;
            completedTopics += chap.subTopics.filter(st => topicProgress[`${chap.id}-${st}`]).length;
        });
        return totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);
    }, [currentSyllabusList, topicProgress]);

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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h1>{activeTab} Syllabus</h1>
                        <button className="add-unit-hero" onClick={() => setIsAddingUnit(true)}>
                            <Plus size={20} /> Add New Unit
                        </button>
                    </div>
                    <p>Master the core concepts of {activeTab} with our detailed breakdown.</p>

                    <div className="hero-stats">
                        <div className="stat-item">
                            <span className="stat-val">{currentSyllabusList.length}</span>
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
                        {/* Search & Actions Bar */}
                        <div className="actions-bar">
                            <div className="search-container">
                                <Search className="search-icon" size={20} />
                                <input
                                    type="text"
                                    placeholder={`Search in ${activeTab}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
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
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleSubTopic(chapter.id, subTopic);
                                                            }}
                                                        >
                                                            <div className="check-circle">
                                                                {isChecked ? <CheckCircle size={18} className="checked-icon" /> : <Circle size={18} />}
                                                            </div>
                                                            <span>{subTopic}</span>
                                                        </div>
                                                    );
                                                })}

                                                {/* Add Topic UI */}
                                                {isAddingTopic === chapter.id ? (
                                                    <div className="add-topic-form">
                                                        <input
                                                            type="text"
                                                            placeholder="New topic name..."
                                                            value={newTopic}
                                                            onChange={e => setNewTopic(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <button className="confirm-btn-mini" onClick={() => handleAddTopic(chapter.id)}>Add</button>
                                                        <button className="cancel-btn-mini" onClick={() => setIsAddingTopic(null)}>Cancel</button>
                                                    </div>
                                                ) : (
                                                    <button className="add-topic-btn" onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsAddingTopic(chapter.id);
                                                    }}>
                                                        <Plus size={14} /> Add Topic
                                                    </button>
                                                )}
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

                        <div className="sidebar-card bookmark-card premium-links-card">
                            <div className="card-header banner-header">
                                <Bookmark size={20} />
                                <h3>Quick Prep Links</h3>
                            </div>
                            <div className="links-container">
                                <a href="https://ncert.nic.in/textbook.php" target="_blank" rel="noopener noreferrer" className="premium-link-item">
                                    <div className="link-icon-box blue">
                                        <BookOpen size={18} />
                                    </div>
                                    <div className="link-text-box">
                                        <span className="link-title">NCERT Solutions</span>
                                        <span className="link-tag">Official</span>
                                    </div>
                                    <ChevronRight size={14} className="link-arrow" />
                                </a>

                                <a href="/pdfs/NEET_High_Weightage_Chart_2026.pdf" target="_blank" rel="noopener noreferrer" className="premium-link-item">
                                    <div className="link-icon-box orange">
                                        <TrendingUp size={18} />
                                    </div>
                                    <div className="link-text-box">
                                        <span className="link-title">High Weightage</span>
                                        <span className="link-tag trending">Hot</span>
                                    </div>
                                    <ChevronRight size={14} className="link-arrow" />
                                </a>

                                <a href="https://www.vedantu.com/formula/physics-formulas" target="_blank" rel="noopener noreferrer" className="premium-link-item">
                                    <div className="link-icon-box emerald">
                                        <FileText size={18} />
                                    </div>
                                    <div className="link-text-box">
                                        <span className="link-title">Formula Sheets</span>
                                        <span className="link-tag">Revise</span>
                                    </div>
                                    <ChevronRight size={14} className="link-arrow" />
                                </a>

                                <a href="https://www.nta.ac.in/Quiz" target="_blank" rel="noopener noreferrer" className="premium-link-item">
                                    <div className="link-icon-box purple">
                                        <Zap size={18} />
                                    </div>
                                    <div className="link-text-box">
                                        <span className="link-title">NTA Mock Quiz</span>
                                        <span className="link-tag">Practice</span>
                                    </div>
                                    <ChevronRight size={14} className="link-arrow" />
                                </a>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* ADD UNIT MODAL */}
                {isAddingUnit && (
                    <div className="modal-overlay" onClick={() => setIsAddingUnit(false)}>
                        <div className="modal-card" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Add New Study Unit</h3>
                                <button className="close-btn" onClick={() => setIsAddingUnit(false)}><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label>UNIT NAME</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Advanced Quantum Mechanics"
                                        value={newUnit.name}
                                        onChange={e => setNewUnit({ ...newUnit, name: e.target.value })}
                                    />
                                </div>
                                <div className="input-row">
                                    <div className="input-group">
                                        <label>CLASS</label>
                                        <select value={newUnit.class} onChange={e => setNewUnit({ ...newUnit, class: e.target.value })}>
                                            <option>Class 11</option>
                                            <option>Class 12</option>
                                            <option>Extra</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>WEIGHTAGE</label>
                                        <select value={newUnit.weight} onChange={e => setNewUnit({ ...newUnit, weight: e.target.value })}>
                                            <option>LOW</option>
                                            <option>MEDIUM</option>
                                            <option>HIGH</option>
                                            <option>VERY HIGH</option>
                                        </select>
                                    </div>
                                </div>
                                <button className="submit-btn" onClick={handleAddUnit}>Create Unit</button>
                            </div>
                        </div>
                    </div>
                )}
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

                .add-unit-hero {
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.4);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 12px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    backdrop-filter: blur(10px);
                }
                .add-unit-hero:hover { background: white; color: #1e293b; transform: translateY(-2px); }

                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(8px);
                    display: flex; align-items: center; justify-content: center; z-index: 1000;
                }
                .modal-card {
                    background: white; border-radius: 24px; width: 100%; max-width: 500px;
                    padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
                }
                .modal-header { display: flex; justify-content: space-between; margin-bottom: 24px; }
                .modal-header h3 { font-size: 1.5rem; font-weight: 800; color: #1e293b; }
                .close-btn { background: transparent; border: none; cursor: pointer; color: #64748b; }

                .input-group { margin-bottom: 20px; }
                .input-group label { display: block; font-size: 0.75rem; font-weight: 800; color: #94a3b8; margin-bottom: 8px; }
                .input-group input, .input-group select {
                    width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0;
                    font-size: 1rem; color: #1e293b; outline: none;
                }
                .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .submit-btn {
                    width: 100%; padding: 16px; border-radius: 14px; border: none;
                    background: #4f46e5; color: white; font-weight: 700; font-size: 1rem;
                    cursor: pointer; transition: all 0.2s;
                }
                .submit-btn:hover { background: #4338ca; transform: translateY(-2px); }

                .add-topic-btn {
                    margin-top: 12px; background: white; border: 1px dashed #cbd5e1;
                    padding: 8px 16px; border-radius: 8px; color: #64748b;
                    font-size: 0.85rem; font-weight: 700; cursor: pointer; 
                    display: flex; align-items: center; gap: 8px; width: fit-content;
                }
                .add-topic-btn:hover { border-color: #4f46e5; color: #4f46e5; }
                
                .add-topic-form { display: flex; gap: 8px; margin-top: 12px; }
                .add-topic-form input {
                    flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid #4f46e5;
                    font-size: 0.85rem; outline: none;
                }
                .confirm-btn-mini { background: #4f46e5; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 700; }
                .cancel-btn-mini { background: #f1f5f9; color: #64748b; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 700; }

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

                .premium-links-card {
                    padding: 0 !important;
                    overflow: hidden;
                    border: 1px solid #E2E8F0;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
                }

                .banner-header {
                    background: linear-gradient(135deg, #1E293B 0%, #334155 100%);
                    color: white;
                    padding: 20px 24px;
                    margin-bottom: 0 !important;
                }

                .links-container {
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .premium-link-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 12px;
                    border-radius: 12px;
                    text-decoration: none;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid transparent;
                }

                .premium-link-item:hover {
                    background: #F8FAFC;
                    border-color: #E2E8F0;
                    transform: translateX(4px);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }

                .link-icon-box {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .link-icon-box.blue { background: #EFF6FF; color: #3B82F6; }
                .link-icon-box.orange { background: #FFF7ED; color: #F97316; }
                .link-icon-box.emerald { background: #ECFDF5; color: #10B981; }
                .link-icon-box.purple { background: #F5F3FF; color: #8B5CF6; }

                .link-text-box {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .link-title {
                    font-size: 0.9rem;
                    font-weight: 800;
                    color: #1E293B;
                }

                .link-tag {
                    font-size: 0.65rem;
                    font-weight: 700;
                    color: #94A3B8;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }

                .link-tag.trending {
                    color: #EF4444;
                }

                .link-arrow {
                    color: #CBD5E1;
                    transition: transform 0.2s;
                }

                .premium-link-item:hover .link-arrow {
                    color: #94A3B8;
                    transform: translateX(2px);
                }

                @media (max-width: 1024px) {
                    .main-layout {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 640px) {
                    .hero-section {
                        padding: 32px 24px;
                        border-radius: 20px;
                    }

                    .hero-section h1 {
                        font-size: 2rem;
                        line-height: 1.1;
                    }

                    .hero-stats {
                        gap: 24px;
                        flex-direction: row;
                        align-items: flex-start;
                    }

                    .divider {
                        display: none;
                    }

                    .stat-item {
                        border-right: 1px solid rgba(255,255,255,0.2);
                        padding-right: 24px;
                        margin-right: 24px;
                    }

                    .stat-item:last-child {
                        border: none;
                        padding: 0;
                        margin: 0;
                    }

                    .tab-switcher {
                        display: flex;
                        overflow-x: auto;
                        padding-bottom: 4px;
                        gap: 12px;
                        margin-right: -20px;
                        padding-right: 20px;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: none;
                    }
                    .tab-switcher::-webkit-scrollbar { display: none; }
                    
                    .tab-btn {
                        white-space: nowrap;
                        flex-shrink: 0;
                        padding: 10px 16px;
                    }

                    .chapter-header {
                        padding: 16px;
                    }
                    
                    .chapter-info h3 { font-size: 1rem; }
                    .weight-badge { font-size: 0.6rem; }
                    .mini-progress { font-size: 0.75rem; }
                }
            `}</style>
        </AppShell>
    );
}
