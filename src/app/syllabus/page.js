"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import {
    BookOpen,
    ChevronDown,
    ChevronRight,
    Target,
    Search,
    CheckCircle2,
    Bookmark,
    TrendingUp,
    Info,
    XCircle
} from "lucide-react";

const SYLLABUS_DATA = {
    Physics: [
        {
            class: 11,
            chapter: "Physical World and Measurement",
            importance: "Medium",
            topics: ["Units and Measurements", "Dimensional Analysis", "Significant Figures"]
        },
        {
            class: 11,
            chapter: "Kinematics",
            importance: "High",
            topics: ["Motion in a Straight Line", "Motion in a Plane", "Projectile Motion", "Vector Analysis"]
        },
        {
            class: 11,
            chapter: "Laws of Motion",
            importance: "High",
            topics: ["Newton's Laws", "Friction", "Circular Motion", "Dynamics of Uniform Circular Motion"]
        },
        {
            class: 11,
            chapter: "Work, Energy and Power",
            importance: "High",
            topics: ["Work Done", "Kinetic and Potential Energy", "Collisions", "Power Calculation"]
        },
        {
            class: 11,
            chapter: "Motion of System of Particles and Rigid Body",
            importance: "Critical",
            topics: ["Center of Mass", "Torque", "Angular Momentum", "Moment of Inertia"]
        },
        {
            class: 11,
            chapter: "Gravitation",
            importance: "Medium",
            topics: ["Kepler's Laws", "Universal Law of Gravitation", "Gravitational Potential Energy", "Escape Velocity"]
        },
        {
            class: 12,
            chapter: "Electrostatics",
            importance: "Critical",
            topics: ["Electric Charges", "Coulomb's Law", "Electric Field", "Gauss's Theorem", "Capacitors"]
        },
        {
            class: 12,
            chapter: "Current Electricity",
            importance: "Critical",
            topics: ["Ohm's Law", "Kirchhoff's Laws", "Potentiometer", "Wheatstone Bridge"]
        },
        {
            class: 12,
            chapter: "Magnetic Effects of Current and Magnetism",
            importance: "High",
            topics: ["Biot-Savart Law", "Ampere's Law", "Cyclotron", "Magnetic Properties of Materials"]
        },
        {
            class: 12,
            chapter: "Optics",
            importance: "Critical",
            topics: ["Reflection and Refraction", "Lenses", "Optical Instruments", "Wavefronts", "Interference and Diffraction"]
        },
        {
            class: 12,
            chapter: "Modern Physics",
            importance: "High",
            topics: ["Photoelectric Effect", "De Broglie Hypothesis", "Atomic Models", "Radioactivity", "Semiconductors"]
        }
    ],
    Chemistry: [
        {
            class: 11,
            chapter: "Some Basic Concepts of Chemistry",
            importance: "High",
            topics: ["Mole Concept", "Stoichiometry", "Atomic and Molecular Masses", "Empirical Formulas"]
        },
        {
            class: 11,
            chapter: "Structure of Atom",
            importance: "High",
            topics: ["Bohr's Model", "Quantum Numbers", "Electronic Configuration", "Photoelectric Effect"]
        },
        {
            class: 11,
            chapter: "Chemical Bonding",
            importance: "Critical",
            topics: ["VSEPR Theory", "Hybridization", "Molecular Orbital Theory", "Dipole Moment"]
        },
        {
            class: 11,
            chapter: "Thermodynamics",
            importance: "Medium",
            topics: ["First Law", "Enthalpy and Entropy", "Gibbs Free Energy", "Spontaneity"]
        },
        {
            class: 11,
            chapter: "Organic Chemistry: Some Basic Principles",
            importance: "Critical",
            topics: ["Isomerism", "IUPAC Nomenclature", "Inductive Effect", "Resonance"]
        },
        {
            class: 12,
            chapter: "Solutions",
            importance: "High",
            topics: ["Raoult's Law", "Colligative Properties", "Van't Hoff Factor", "Solubility"]
        },
        {
            class: 12,
            chapter: "Electrochemistry",
            importance: "High",
            topics: ["Nernst Equation", "Faraday's Laws", "Kohlrausch Law", "Electrolytic Cells"]
        },
        {
            class: 12,
            chapter: "Chemical Kinetics",
            importance: "High",
            topics: ["Rate of Reaction", "Arrhenius Equation", "Order and Molecularity", "Half-life"]
        },
        {
            class: 12,
            chapter: "Coordination Compounds",
            importance: "High",
            topics: ["Werner's Theory", "Ligands", "Crystal Field Theory", "Naming"]
        },
        {
            class: 12,
            chapter: "Aldehydes, Ketones and Carboxylic Acids",
            importance: "Critical",
            topics: ["Named Reactions", "Mechanism of Addition", "Acidity of Alpha Hydrogen", "Oxidation and Reduction"]
        }
    ],
    Biology: [
        {
            class: 11,
            chapter: "The Living World & Biological Classification",
            importance: "Medium",
            topics: ["Taxonomy", "Kingdom Monera", "Kingdom Protista", "Fungi", "Viruses"]
        },
        {
            class: 11,
            chapter: "Plant Kingdom",
            importance: "High",
            topics: ["Algae", "Bryophytes", "Pteridophytes", "Gymnosperms", "Angiosperms"]
        },
        {
            class: 11,
            chapter: "Cell: The Unit of Life",
            importance: "Critical",
            topics: ["Cell Organelles", "Membrane Structure", "Nucleus", "Chromosomes"]
        },
        {
            class: 11,
            chapter: "Cell Cycle and Cell Division",
            importance: "Critical",
            topics: ["Mitosis", "Meiosis Stages", "Cell Cycle Control", "Significance"]
        },
        {
            class: 11,
            chapter: "Human Physiology (Digestion to Locomotion)",
            importance: "Critical",
            topics: ["Enzymes", "Breathing Mechanism", "Cardiac Cycle", "ECG", "Nephron Function", "Muscle Contraction"]
        },
        {
            class: 12,
            chapter: "Sexual Reproduction in Flowering Plants",
            importance: "Critical",
            topics: ["Microsporogenesis", "Megasporogenesis", "Pollination Types", "Double Fertilization", "Embryo Development"]
        },
        {
            class: 12,
            chapter: "Human Reproduction & Reproductive Health",
            importance: "High",
            topics: ["Gametogenesis", "Menstrual Cycle", "Fertilization", "IVF and Contraception"]
        },
        {
            class: 12,
            chapter: "Genetics (Principles & Molecular Basis)",
            importance: "Critical",
            topics: ["Mendelian Laws", "DNA Replication", "Transcription", "Translation", "DNA Fingerprinting"]
        },
        {
            class: 12,
            chapter: "Biotechnology & Its Applications",
            importance: "Critical",
            topics: ["Restriction Enzymes", "PCR", "Gel Electrophoresis", "Bt Cotton", "Gene Therapy"]
        },
        {
            class: 12,
            chapter: "Ecology and Environment",
            importance: "High",
            topics: ["Population Interactions", "Pyramids", "Biodiversity", "Waste Management"]
        }
    ]
};

const SUBJECT_COLORS = {
    Physics: "#3b82f6",
    Chemistry: "#f97316",
    Biology: "#10b981"
};

const IMPORTANCE_COLORS = {
    Critical: "#ef4444",
    High: "#f59e0b",
    Medium: "#6366f1"
};

export default function SyllabusPage() {
    const [activeSubject, setActiveSubject] = useState('Physics');
    const [expandedChapters, setExpandedChapters] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [completedTopics, setCompletedTopics] = useState({});
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        fetchProgress();
    }, []);

    const fetchProgress = async () => {
        try {
            const res = await fetch("/api/syllabus");
            const result = await res.json();
            if (result.success) setCompletedTopics(result.data || {});
        } catch (error) {
            console.error("Failed to fetch syllabus progress", error);
        }
    };

    const saveProgressToDB = async (newProgress) => {
        try {
            await fetch("/api/syllabus", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ progress: newProgress })
            });
        } catch (error) {
            console.error("Failed to save syllabus progress", error);
        }
    };

    const toggleChapter = (subject, chapterId) => {
        const id = `${subject}-${chapterId}`;
        setExpandedChapters(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const toggleTopic = async (subject, chapter, topic) => {
        const id = `${subject}-${chapter}-${topic}`;
        const newCompletedTopics = {
            ...completedTopics,
            [id]: !completedTopics[id]
        };
        setCompletedTopics(newCompletedTopics);
        await saveProgressToDB(newCompletedTopics);
    };

    const calculateProgress = (subject) => {
        const chapters = SYLLABUS_DATA[subject];
        let totalTopics = 0;
        let doneTopics = 0;

        chapters.forEach(ch => {
            ch.topics.forEach(t => {
                totalTopics++;
                if (completedTopics[`${subject}-${ch.chapter}-${t}`]) doneTopics++;
            });
        });

        return {
            percentage: totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0,
            done: doneTopics,
            total: totalTopics
        };
    };

    const filteredSyllabus = SYLLABUS_DATA[activeSubject].filter(ch =>
        ch.chapter.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ch.topics.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!isMounted) return null;

    const currentProgress = calculateProgress(activeSubject);

    return (
        <AppShell>
            <div className="syllabus-container">
                {/* Hero Section */}
                <div className="syllabus-hero" style={{ background: SUBJECT_COLORS[activeSubject] }}>
                    <div className="hero-content">
                        <div className="badge-row">
                            <span className="class-badge">NEET 2026</span>
                            <span className="live-badge">Updated Curriculum</span>
                        </div>
                        <h1>{activeSubject} Syllabus</h1>
                        <p>Master the core concepts of {activeSubject} with our detailed breakdown.</p>

                        <div className="hero-stats">
                            <div className="stat-item">
                                <span className="stat-value">{SYLLABUS_DATA[activeSubject].length}</span>
                                <span className="stat-label">Core Chapters</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <div className="progress-circle">
                                    <svg viewBox="0 0 36 36">
                                        <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        <path className="circle" strokeDasharray={`${currentProgress.percentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    </svg>
                                    <div className="percentage-text">{currentProgress.percentage}%</div>
                                </div>
                                <span className="stat-label">Subject Mastery</span>
                            </div>
                        </div>
                    </div>
                    <div className="hero-pill-decoration"></div>
                </div>

                <div className="content-layout">
                    {/* Main Content Area */}
                    <div className="main-content">
                        {/* Improved Search Bar */}
                        <div className="search-section">
                            <div className="search-bar-container">
                                <Search className="search-icon" size={22} />
                                <input
                                    type="text"
                                    placeholder={`Search in ${activeSubject} (e.g. "Mechanics" or "Mole Concept")...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        className="clear-search"
                                        onClick={() => setSearchTerm("")}
                                        title="Clear search"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Subject Toggle */}
                        <div className="controls-card">
                            <div className="subject-tabs">
                                {Object.keys(SYLLABUS_DATA).map(subject => (
                                    <button
                                        key={subject}
                                        onClick={() => { setActiveSubject(subject); setSearchTerm(""); }}
                                        className={`subject-tab ${activeSubject === subject ? 'active' : ''}`}
                                        style={{ '--active-color': SUBJECT_COLORS[subject] }}
                                    >
                                        {subject === 'Biology' ? <CheckCircle2 size={18} /> :
                                            subject === 'Physics' ? <TrendingUp size={18} /> : <Target size={18} />}
                                        {subject}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Syllabus List */}
                        <div className="chapters-list">
                            {filteredSyllabus.map((ch, index) => {
                                const isOpen = expandedChapters[`${activeSubject}-${ch.chapter}`];
                                const chCompletedTopics = ch.topics.filter(t => completedTopics[`${activeSubject}-${ch.chapter}-${t}`]).length;
                                const isFullyDone = chCompletedTopics === ch.topics.length;

                                return (
                                    <div key={index} className={`chapter-card ${isOpen ? 'open' : ''} ${isFullyDone ? 'fully-done' : ''}`}>
                                        <div className="chapter-header" onClick={() => toggleChapter(activeSubject, ch.chapter)}>
                                            <div className="chapter-info">
                                                <div className="class-indicator">Class {ch.class}</div>
                                                <div className="importance-pill" style={{ background: IMPORTANCE_COLORS[ch.importance] }}>
                                                    {ch.importance}
                                                </div>
                                                <h3 className="chapter-title">{ch.chapter}</h3>
                                                <div className="topic-count">
                                                    {chCompletedTopics}/{ch.topics.length} topics finished
                                                </div>
                                            </div>
                                            <div className="header-actions">
                                                {isFullyDone && <CheckCircle2 size={22} className="success-check" />}
                                                {isOpen ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                                            </div>
                                        </div>

                                        {isOpen && (
                                            <div className="chapter-body">
                                                <div className="topics-grid">
                                                    {ch.topics.map((topic, tIndex) => {
                                                        const isTopicDone = completedTopics[`${activeSubject}-${ch.chapter}-${topic}`];
                                                        return (
                                                            <div
                                                                key={tIndex}
                                                                className={`topic-item ${isTopicDone ? 'done' : ''}`}
                                                                onClick={() => toggleTopic(activeSubject, ch.chapter, topic)}
                                                            >
                                                                <div className="topic-checkbox">
                                                                    {isTopicDone && <CheckCircle2 size={14} />}
                                                                </div>
                                                                <span className="topic-name">{topic}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sidebar / Info */}
                    <div className="sidebar-content">
                        <div className="card guide-card">
                            <h3 className="card-title"><Info size={20} /> Study Guide</h3>
                            <div className="guide-points">
                                <div className="guide-point">
                                    <div className="point-icon critical"></div>
                                    <div className="point-text">
                                        <strong>Critical Chapters</strong>
                                        <p>High weightage (8-10 Qs). Master these first.</p>
                                    </div>
                                </div>
                                <div className="guide-point">
                                    <div className="point-icon high"></div>
                                    <div className="point-text">
                                        <strong>High Priority</strong>
                                        <p>Important for conceptual depth (5-7 Qs).</p>
                                    </div>
                                </div>
                                <div className="guide-point">
                                    <div className="point-icon medium"></div>
                                    <div className="point-text">
                                        <strong>Concept Builders</strong>
                                        <p>Essential basics for building speed.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card bookmark-card">
                            <h3 className="card-title"><Bookmark size={20} /> Quick Prep Links</h3>
                            <ul className="prep-links">
                                <li>
                                    <a href="https://ncert.nic.in/textbook.php" target="_blank" rel="noopener noreferrer">
                                        NCERT Textbook Solutions
                                    </a>
                                </li>
                                <li>
                                    <a href="/pdfs/NEET_High_Weightage_Chart_2026.pdf" target="_blank" rel="noopener noreferrer">
                                        High Weightage Analysis
                                    </a>
                                </li>
                                <li>
                                    <a href="https://www.vedantu.com/formula/physics-formulas" target="_blank" rel="noopener noreferrer">
                                        Revision Formula Sheets
                                    </a>
                                </li>
                                <li>
                                    <a href="https://www.nta.ac.in/Quiz" target="_blank" rel="noopener noreferrer">
                                        NTA Mock Test Pattern
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .syllabus-container {
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                /* Hero Section */
                .syllabus-hero {
                    margin-top: -1rem;
                    padding: 3rem 2rem;
                    border-radius: 20px;
                    color: white;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
                }
                .hero-content { position: relative; z-index: 2; max-width: 800px; }
                .hero-content h1 { font-size: 3rem; font-weight: 800; margin: 0.5rem 0; letter-spacing: -0.02em; }
                .hero-content p { font-size: 1.1rem; opacity: 0.9; margin-bottom: 2rem; }
                
                .badge-row { display: flex; gap: 0.75rem; align-items: center; }
                .class-badge { background: rgba(255,255,255,0.2); padding: 0.4rem 0.8rem; border-radius: 8px; font-weight: 700; font-size: 0.8rem; }
                .live-badge { background: #facc15; color: #854d0e; padding: 0.4rem 0.8rem; border-radius: 8px; font-weight: 800; font-size: 0.7rem; text-transform: uppercase; }

                .hero-stats { display: flex; align-items: center; gap: 2rem; }
                .stat-item { display: flex; flex-direction: column; }
                .stat-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.3); }
                .stat-value { font-size: 2.5rem; font-weight: 800; line-height: 1; }
                .stat-label { font-size: 0.85rem; opacity: 0.8; font-weight: 600; text-transform: uppercase; margin-top: 0.5rem; }

                .progress-circle { position: relative; width: 60px; height: 60px; }
                .progress-circle svg { width: 100%; height: 100%; transform: rotate(-90deg); }
                .circle-bg { fill: none; stroke: rgba(255,255,255,0.2); stroke-width: 3.8; }
                .circle { fill: none; stroke: white; stroke-width: 3.8; stroke-linecap: round; transition: stroke-dasharray 0.5s; }
                .percentage-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; }

                /* Layout */
                .content-layout { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }
                @media (max-width: 1100px) { .content-layout { grid-template-columns: 1fr; } }

                /* Controls */
                .search-section { margin-bottom: 1rem; }
                .search-bar-container {
                    position: relative;
                    background: white;
                    border-radius: 14px;
                    border: 1px solid #e2e8f0;
                    padding: 0.25rem 0.25rem 0.25rem 0.25rem;
                    display: flex;
                    align-items: center;
                    box-shadow: var(--shadow-sm);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .search-bar-container:focus-within {
                    border-color: var(--color-primary);
                    box-shadow: 0 0 0 4px var(--color-primary-light);
                    transform: translateY(-1px);
                }
                .search-icon { 
                    margin-left: 1rem; 
                    color: #94a3b8;
                    transition: color 0.3s;
                }
                .search-bar-container:focus-within .search-icon { color: var(--color-primary); }
                
                .search-bar-container input { 
                    flex: 1; 
                    padding: 0.8rem 1rem; 
                    border: none; 
                    outline: none; 
                    font-size: 1rem; 
                    font-weight: 500;
                    background: transparent;
                }
                .clear-search {
                    background: #f1f5f9;
                    border: none;
                    color: #94a3b8;
                    padding: 0.5rem;
                    margin-right: 0.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .clear-search:hover { background: #fee2e2; color: #ef4444; }

                .controls-card { 
                    background: white; 
                    padding: 0.75rem; 
                    border-radius: 14px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between; 
                    gap: 2rem; 
                    border: 1px solid var(--color-border); 
                    box-shadow: var(--shadow-sm); 
                }
                .subject-tabs { display: flex; gap: 0.5rem; width: 100%; }
                .subject-tab { 
                    flex: 1;
                    display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem;
                    border: none; background: #f8fafc; border-radius: 10px; font-weight: 700; color: #64748b;
                    transition: all 0.2s; cursor: pointer;
                }
                .subject-tab.active { background: var(--active-color); color: white; transform: translateY(-2px); box-shadow: 0 4px 12px -2px rgba(0,0,0,0.1); }
                
                /* Chapter Cards */
                .chapters-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
                .chapter-card { 
                    background: white; border-radius: 16px; border: 1px solid var(--color-border); 
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .chapter-card.fully-done { border-color: #10b981; }
                .chapter-header { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; position: relative; }
                .chapter-info { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
                
                .class-indicator { background: #f1f5f9; color: #475569; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 800; }
                .importance-pill { padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.7rem; font-weight: 800; color: white; text-transform: uppercase; letter-spacing: 0.05em; }
                .chapter-title { margin: 0; font-size: 1.2rem; font-weight: 700; color: var(--color-text-main); }
                .topic-count { font-size: 0.85rem; color: #94a3b8; font-weight: 600; }
                
                .success-check { color: #10b981; margin-right: 0.5rem; }
                .header-actions { display: flex; align-items: center; color: #94a3b8; }

                .chapter-body { padding: 0 1.5rem 1.5rem; border-top: 1px solid #f1f5f9; background: #f8fafc; }
                .topics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.75rem; padding-top: 1.5rem; }
                .topic-item { 
                    display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem;
                    background: white; border-radius: 10px; border: 1px solid #e2e8f0;
                    cursor: pointer; transition: all 0.2s;
                }
                .topic-item:hover { transform: translateX(5px); border-color: var(--color-primary); }
                .topic-item.done { background: #f0fdf4; border-color: #dcfce7; }
                .topic-item.done .topic-name { text-decoration: line-through; color: #94a3b8; }
                
                .topic-checkbox { width: 18px; height: 18px; border: 2px solid #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
                .topic-item.done .topic-checkbox { background: #10b981; border-color: #10b981; color: white; }
                .topic-name { font-size: 0.9rem; font-weight: 600; color: #334155; }

                /* Sidebar */
                .sidebar-content { display: flex; flex-direction: column; gap: 1.5rem; }
                .card-title { display: flex; align-items: center; gap: 0.6rem; font-size: 1.1rem; font-weight: 800; margin-bottom: 1.5rem; }
                
                .guide-points { display: flex; flex-direction: column; gap: 1.25rem; }
                .guide-point { display: flex; gap: 1rem; }
                .point-icon { width: 12px; height: 12px; border-radius: 3px; margin-top: 4px; flex-shrink: 0; }
                .point-icon.critical { background: #ef4444; }
                .point-icon.high { background: #f59e0b; }
                .point-icon.medium { background: #6366f1; }
                .point-text strong { display: block; font-size: 0.95rem; margin-bottom: 2px; }
                .point-text p { font-size: 0.8rem; color: #94a3b8; margin: 0; }

                .prep-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }
                .prep-links li { 
                    border-radius: 8px; border: 1px solid #e2e8f0; 
                    background: #f8fafc; transition: all 0.2s;
                }
                .prep-links li a { 
                    display: block; padding: 0.85rem 1rem; 
                    text-decoration: none; color: #475569; 
                    font-weight: 700; font-size: 0.85rem; 
                }
                .prep-links li:hover { background: var(--color-primary-light); border-color: var(--color-primary); transform: translateX(5px); }
                .prep-links li:hover a { color: var(--color-primary); }

                @media (max-width: 640px) {
                    .controls-card { flex-direction: column; align-items: stretch; gap: 1rem; }
                    .subject-tabs { overflow-x: auto; padding-bottom: 0.5rem; }
                    .hero-content h1 { font-size: 2rem; }
                    .hero-stats { gap: 1rem; }
                    .stat-value { font-size: 1.5rem; }
                }
            `}</style>
        </AppShell>
    );
}
