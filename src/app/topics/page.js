"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { Star, FileText, Video, Download, BookOpen, TrendingUp, Search, Info, ArrowRight, X } from "lucide-react";

const TOPICS = {
    Physics: [
        { name: 'Current Electricity', weight: '12-15%', reason: 'Asked every year, 3-4 questions consistently appear. Covers Ohm\'s law, Kirchhoff\'s rules.', difficulty: 'Medium', type: 'Numerical' },
        { name: 'Ray Optics', weight: '8-10%', reason: 'High weightage, formula based. Focus on Lens formula, Mirror formula, and Optical instruments.', difficulty: 'Medium', type: 'Conceptual' },
        { name: 'Electrostatics', weight: '8-10%', reason: 'Conceptual foundation for whole electricity. Gauss Law and Capacitors are most important.', difficulty: 'Hard', type: 'Conceptual' },
        { name: 'Semiconductors', weight: '7-9%', reason: 'Easy pickings! Focus on Logic Gates, p-n junction diode, and Zener diode applications.', difficulty: 'Easy', type: 'Theory' },
        { name: 'Modern Physics', weight: '10-12%', reason: 'High yield, less calculation. Covers Dual nature, Atoms, Nuclei. Very scoring.', difficulty: 'Easy', type: 'Theory' },
        { name: 'Thermodynamics', weight: '8-10%', reason: 'Significant overlap with Chemistry. Focus on Laws and Engine efficiency.', difficulty: 'Medium', type: 'Numerical' },
        { name: 'SHM & Waves', weight: '5-7%', reason: 'Standard questions on Doppler effect and Resonance. Understand the math clearly.', difficulty: 'Medium', type: 'Conceptual' },
        { name: 'Rotational Motion', weight: '6-8%', reason: 'Hardest chapter but critical for top ranks. Moment of Inertia is the key topic.', difficulty: 'Hard', type: 'Numerical' },
    ],
    Chemistry: [
        { name: 'Chemical Bonding', weight: '10-12%', reason: 'Backbone of Inorganic. VSEPR theory and Molecular Orbital Theory are high yield.', difficulty: 'Medium', type: 'Conceptual' },
        { name: 'Organic Basics', weight: '8-10%', reason: 'GOC is essential for 50%+ of Organic questions. Master Isomerism and Inductive effect.', difficulty: 'Medium', type: 'Conceptual' },
        { name: 'Coordination Compounds', weight: '9-11%', reason: 'Guaranteed 2-3 questions. Nomenclature and VBT/CFT are frequently asked.', difficulty: 'Medium', type: 'Theory' },
        { name: 'Equilibrium', weight: '6-8%', reason: 'Ionic equilibrium is tricky but important. Le Chatelier\'s principle is a favorite.', difficulty: 'Hard', type: 'Numerical' },
        { name: 'Electrochemistry', weight: '7-9%', reason: 'Formula based. Nernst equation and Faraday\'s laws cover most questions.', difficulty: 'Medium', type: 'Numerical' },
        { name: 'Biomolecules', weight: '4-6%', reason: 'Pure memorization. High link with Biology. Direct NCERT lines are often used.', difficulty: 'Easy', type: 'Theory' },
        { name: 'Aldehydes & Ketones', weight: '8-10%', reason: 'Major organic chapter. Named reactions like Aldol and Cannizzaro are vital.', difficulty: 'Hard', type: 'Conceptual' },
        { name: 'Solutions', weight: '5-7%', reason: 'Simple numericals. Focus on Raoult\'s law and Colligative properties.', difficulty: 'Easy', type: 'Numerical' },
    ],
    Biology: [
        { name: 'Human Physiology', weight: '20%', reason: 'Biggest chunk! Covers 7 systems. Digestion (removed but basics needed) to Locomotion.', difficulty: 'Medium', type: 'Mixed' },
        { name: 'Genetics & Evolution', weight: '15-18%', reason: 'Tricky but logical. Pedigree analysis and DNA replication are core topics.', difficulty: 'Hard', type: 'Conceptual' },
        { name: 'Ecology', weight: '12-15%', reason: 'Scoring and easy. Focus on Population interactions and Environmental issues.', difficulty: 'Easy', type: 'Theory' },
        { name: 'Biotechnology', weight: '8-10%', reason: 'Small chapters, high weightage. PCR and Recombinant DNA are key segments.', difficulty: 'Medium', type: 'Theory' },
        { name: 'Plant Physiology', weight: '10-12%', reason: 'Cycles are key! Photosynthesis and Respiration cycles must be on tips.', difficulty: 'Medium', type: 'Mixed' },
        { name: 'Reproduction', weight: '8-10%', reason: 'Direct NCERT based questions. Human reproduction and Genetics are interlinked.', difficulty: 'Easy', type: 'Theory' },
        { name: 'Biomolecules', weight: '4-6%', reason: 'Shared with Chemistry. Enzymes and classification are high yield.', difficulty: 'Medium', type: 'Theory' },
        { name: 'Microbes in Welfare', weight: '3-5%', reason: 'Direct, very easy. Sewerage treatment and Industrial use are important.', difficulty: 'Easy', type: 'Theory' },
    ]
};

const getDifficultyStyle = (diff) => {
    switch (diff) {
        case 'Easy': return { color: '#059669', bg: '#D1FAE5', darkBg: '#064E3B', darkText: '#6EE7B7' };
        case 'Medium': return { color: '#D97706', bg: '#FEF3C7', darkBg: '#78350F', darkText: '#FDE68A' };
        case 'Hard': return { color: '#DC2626', bg: '#FEE2E2', darkBg: '#7F1D1D', darkText: '#FCA5A5' };
        default: return { color: '#2563EB', bg: '#DBEAFE', darkBg: '#1E3A8A', darkText: '#93C5FD' };
    }
};

export default function TopicsPage() {
    const [activeTab, setActiveTab] = useState('Physics');
    const [searchQuery, setSearchQuery] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const filteredTopics = TOPICS[activeTab].filter(topic =>
        topic.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AppShell>
            <div className="topics-page-container">

                {/* Header Banner */}
                <header className="hero-banner">
                    <div className="hero-pattern">
                        <BookOpen size={200} />
                    </div>
                    <div className="hero-content">
                        <div className="badge">10 Years Data Analysis</div>
                        <h1>High-Yield Topics</h1>
                        <p>We've mapped the most frequently asked concepts from 2015-2025. Master these strategically to secure your selection.</p>
                    </div>
                </header>

                {/* Filters Row */}
                <div className="filters-row">
                    <div className="subject-tabs">
                        {Object.keys(TOPICS).map(subject => (
                            <button
                                key={subject}
                                onClick={() => {
                                    setActiveTab(subject);
                                    setSearchQuery(''); // Reset search when switching subjects
                                }}
                                className={`tab-btn ${activeTab === subject ? 'active' : ''}`}
                            >
                                {subject}
                            </button>
                        ))}
                    </div>

                    <div className="search-wrapper">
                        <div className="search-icon-container">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder={`Search ${activeTab} topics...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="clear-search" onClick={() => setSearchQuery('')} aria-label="Clear search">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Info Card */}
                <div className="pro-tip-card">
                    <div className="tip-icon">✨</div>
                    <div className="tip-text">
                        <strong>Strategic Tip:</strong> Start with topics marked as <strong>Easy</strong> but having <strong>High Weightage</strong>. This builds momentum and secures 50% marks in half the time.
                    </div>
                </div>

                {/* Topics Grid */}
                {filteredTopics.length > 0 ? (
                    <div className="topics-grid">
                        {filteredTopics.map((topic, idx) => {
                            const style = getDifficultyStyle(topic.difficulty);
                            return (
                                <div key={idx} className="topic-card">
                                    <div className="card-top">
                                        <div className="tags-row">
                                            <span className="diff-tag" style={{
                                                '--diff-bg': style.bg,
                                                '--diff-text': style.color,
                                                '--diff-dark-bg': style.darkBg,
                                                '--diff-dark-text': style.darkText
                                            }}>
                                                {topic.difficulty}
                                            </span>
                                            <span className="type-tag">{topic.type}</span>
                                        </div>
                                        <div className="weight-badge">
                                            <TrendingUp size={14} />
                                            {topic.weight}
                                        </div>
                                    </div>

                                    <h3 className="topic-title">{topic.name}</h3>

                                    <div className="analysis-box">
                                        <div className="analysis-label">NEET ANALYSIS</div>
                                        <p className="analysis-text">{topic.reason}</p>
                                    </div>

                                    <div className="action-grid">
                                        <button onClick={() => window.open(`https://www.google.com/search?q=NEET+${topic.name.replace(/ /g, '+')}+notes+pdf`, '_blank')}>
                                            <FileText size={16} /> <span>Notes</span>
                                        </button>
                                        <button onClick={() => window.open(`https://www.youtube.com/results?search_query=NEET+${topic.name.replace(/ /g, '+')}+one+shot`, '_blank')}>
                                            <Video size={16} /> <span>Video</span>
                                        </button>
                                        <button onClick={() => window.open(`https://www.google.com/search?q=NEET+${topic.name.replace(/ /g, '+')}+PYQs`, '_blank')}>
                                            <Download size={16} /> <span>PYQs</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="no-results">
                        <div className="no-results-icon">🔍</div>
                        <h3>No topics found</h3>
                        <p>We couldn't find any topics matching "{searchQuery}" in {activeTab}.</p>
                        <button className="btn btn-primary" onClick={() => setSearchQuery('')}>Clear Search</button>
                    </div>
                )}
            </div>

            <style jsx>{`
                .topics-page-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 16px 60px 16px;
                }

                /* Hero Banner */
                .hero-banner {
                    background: linear-gradient(135deg, #1E1B4B 0%, #312E81 100%[data-theme='dark'] &), 
                                linear-gradient(135deg, #2563EB 0%, #4338CA 100%);
                    background: linear-gradient(135deg, var(--color-primary) 0%, #4338CA 100%);
                    border-radius: 24px;
                    padding: 48px;
                    margin-top: 20px;
                    margin-bottom: 32px;
                    position: relative;
                    overflow: hidden;
                    color: white;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                }

                .hero-pattern {
                    position: absolute;
                    top: -20px;
                    right: -20px;
                    opacity: 0.1;
                    transform: rotate(-10deg);
                }

                .hero-content h1 {
                    font-size: 2.75rem;
                    margin: 12px 0;
                    color: white;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                }

                .hero-content p {
                    font-size: 1.1rem;
                    opacity: 0.9;
                    max-width: 550px;
                    line-height: 1.6;
                }

                .badge {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 6px 14px;
                    border-radius: 99px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    display: inline-block;
                }

                /* Filters Row */
                .filters-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                }

                .subject-tabs {
                    background: var(--color-surface);
                    padding: 6px;
                    border-radius: 16px;
                    border: 1px solid var(--color-border);
                    display: flex;
                    gap: 4px;
                }

                .tab-btn {
                    padding: 10px 24px;
                    border-radius: 12px;
                    border: none;
                    background: transparent;
                    color: var(--color-text-muted);
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .tab-btn.active {
                    background: var(--color-primary);
                    color: white;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
                }

                .search-wrapper {
                    position: relative;
                    flex: 1;
                    max-width: 380px;
                    min-width: 280px;
                }

                .search-icon-container {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--color-text-muted);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    pointer-events: none; /* Prevents icon from blocking input clicks */
                }

                .search-wrapper input {
                    width: 100%;
                    padding: 14px 16px 14px 48px;
                    border-radius: 16px;
                    border: 1px solid var(--color-border);
                    background: var(--color-surface);
                    color: var(--color-text-main);
                    font-size: 1rem;
                    outline: none;
                    transition: border-color 0.2s;
                }

                .search-wrapper input:focus {
                    border-color: var(--color-primary);
                }

                .clear-search {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: var(--color-border);
                    border: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-text-main);
                    cursor: pointer;
                    opacity: 0.6;
                    transition: opacity 0.2s;
                }

                .clear-search:hover { opacity: 1; }

                /* No Results State */
                .no-results {
                    text-align: center;
                    padding: 60px 20px;
                    background: var(--color-surface);
                    border-radius: 24px;
                    border: 1px dashed var(--color-border);
                }

                .no-results-icon {
                    font-size: 3rem;
                    margin-bottom: 16px;
                }

                .no-results h3 {
                    font-size: 1.5rem;
                    margin-bottom: 8px;
                    color: var(--color-text-main);
                }

                .no-results p {
                    color: var(--color-text-muted);
                    margin-bottom: 24px;
                }

                /* Pro Tip */
                .pro-tip-card {
                    background: var(--color-primary-light);
                    padding: 20px;
                    border-radius: 20px;
                    border: 1px solid var(--color-border);
                    display: flex;
                    gap: 16px;
                    align-items: center;
                    margin-bottom: 32px;
                }

                .tip-icon { font-size: 1.5rem; }
                .tip-text { font-size: 0.95rem; line-height: 1.5; color: var(--color-text-main); }

                /* Grid & Cards */
                .topics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 24px;
                }

                .topic-card {
                    background: var(--color-surface);
                    border-radius: 24px;
                    padding: 24px;
                    border: 1px solid var(--color-border);
                    display: flex;
                    flex-direction: column;
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s;
                    box-shadow: var(--shadow-sm);
                    overflow: hidden; /* THE PROPER FIX: Prevents children from escaping */
                }

                .topic-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.1);
                }

                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .tags-row {
                    display: flex;
                    gap: 8px;
                }

                .diff-tag {
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    padding: 4px 10px;
                    border-radius: 6px;
                    background: var(--diff-bg);
                    color: var(--diff-text);
                }

                [data-theme='dark'] .diff-tag {
                    background: var(--diff-dark-bg);
                    color: var(--diff-dark-text);
                }

                .type-tag {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    padding: 4px 10px;
                    border-radius: 6px;
                    background: #F3F4F6;
                    color: #4B5563;
                }

                [data-theme='dark'] .type-tag {
                    background: #1F2937;
                    color: #9CA3AF;
                }

                .weight-badge {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: #F59E0B;
                    background: #FFFBEB;
                    padding: 4px 10px;
                    border-radius: 8px;
                }

                [data-theme='dark'] .weight-badge {
                    background: #451A03;
                }

                .topic-title {
                    font-size: 1.4rem;
                    font-weight: 750;
                    margin: 0 0 16px 0;
                    color: var(--color-text-main);
                    line-height: 1.2;
                    word-wrap: break-word; /* Prevents long titles from overflowing */
                }

                .analysis-box {
                    background: var(--color-background);
                    border: 1px solid var(--color-border);
                    border-radius: 16px;
                    padding: 16px;
                    margin-bottom: 24px;
                    flex: 1;
                }

                .analysis-label {
                    font-size: 0.65rem;
                    font-weight: 800;
                    color: var(--color-text-muted);
                    letter-spacing: 0.1em;
                    margin-bottom: 8px;
                }

                .analysis-text {
                    font-size: 0.9rem;
                    line-height: 1.5;
                    margin: 0;
                    color: var(--color-text-main);
                    /* Limits text to stay inside box */
                    display: -webkit-box;
                    -webkit-line-clamp: 4;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .action-grid {
                    display: flex;
                    gap: 8px;
                }

                .action-grid button {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 12px 4px;
                    border-radius: 14px;
                    border: 1px solid var(--color-border);
                    background: var(--color-surface);
                    color: var(--color-text-main);
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    /* THE PROPER FIX: Ensures buttons don't push outside */
                    min-width: 0;
                }

                .action-grid button span {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }

                .action-grid button:hover {
                    background: var(--color-primary-light);
                    border-color: var(--color-primary);
                    color: var(--color-primary);
                }

                @media (max-width: 768px) {
                    .hero-banner { padding: 32px; }
                    .hero-content h1 { font-size: 2rem; }
                    .filters-row { flex-direction: column; align-items: stretch; }
                    .search-wrapper { max-width: 100%; }
                }
            `}</style>
        </AppShell>
    );
}
