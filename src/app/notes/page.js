"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import {
    Plus, Trash2, StickyNote, Tag, Calendar,
    Search, Pin, Edit3, MoreVertical,
    Book, Filter, Download, Zap, BookOpen, X
} from "lucide-react";

const SUBJECT_COLORS = {
    Physics: { bg: 'var(--color-primary-light)', text: 'var(--color-primary)', border: 'var(--color-primary)' },
    Chemistry: { bg: '#F0F9FF', text: '#0EA5E9', border: '#0EA5E9' },
    Biology: { bg: '#ECFCCB', text: '#65A30D', border: '#65A30D' },
    Other: { bg: '#F4F4F5', text: '#71717A', border: '#D4D4D8' }
};

export default function NotesPage() {
    const [notes, setNotes] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSubject, setFilterSubject] = useState('All');

    // State for Reading Mode
    const [activeNote, setActiveNote] = useState(null);
    const [readingSettings, setReadingSettings] = useState({ fontSize: 18, theme: 'default' });

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        subject: 'Physics',
        isPinned: false
    });

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('neet_notes_v3');
        if (saved) {
            setNotes(JSON.parse(saved));
        } else {
            // Initial high-yield starter kit for NEET
            setNotes([
                {
                    id: 1,
                    title: 'Butterfly Structure (CrO5)',
                    content: 'In CrO5, Cr has +6 oxidation state (not +10).\nReason: It has two peroxide bonds (-O-O-).\nStructure: Butterfly shape with 4 peroxide oxygens and 1 carbonyl oxygen.',
                    subject: 'Chemistry',
                    isPinned: true,
                    date: new Date().toLocaleDateString()
                },
                {
                    id: 2,
                    title: 'Speed of Light Dimensions',
                    content: 'Expression: 1 / sqrt(μ₀ε₀)\nDimensions: [M⁰ L¹ T⁻¹]\nUnits: m/s\nNote: Frequently asked in Match the Following!',
                    subject: 'Physics',
                    isPinned: true,
                    date: new Date().toLocaleDateString()
                },
                {
                    id: 3,
                    title: 'Biological Classification (NCERT)',
                    content: 'R.H. Whittaker (1969) - 5 Kingdom System\n1. Monera (Prokaryotic)\n2. Protista (Unicellular Eukaryotic)\n3. Fungi\n4. Plantae\n5. Animalia\n\nMain criteria: Cell structure, Body organization, Mode of nutrition.',
                    subject: 'Biology',
                    isPinned: false,
                    date: new Date().toLocaleDateString()
                },
                {
                    id: 4,
                    title: 'Amine Basicity (Aqueous)',
                    content: 'Order of basicity in water:\n- Ethyl groups: 2° > 3° > 1° > NH₃\n- Methyl groups: 2° > 1° > 3° > NH₃\nTrick: Ethyl is Bulky (231), Methyl is Small (213).',
                    subject: 'Chemistry',
                    isPinned: false,
                    date: new Date().toLocaleDateString()
                },
                {
                    id: 5,
                    title: 'Logic Gates - Cheat Sheet',
                    content: 'AND: A.B\nOR: A+B\nNAND: ~(A.B) -> Universal Gate\nNOR: ~(A+B) -> Universal Gate\nXOR: A⊕B (Output 1 only if inputs are different)',
                    subject: 'Physics',
                    isPinned: false,
                    date: new Date().toLocaleDateString()
                }
            ]);
        }
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('neet_notes_v3', JSON.stringify(notes));
        }
    }, [notes, mounted]);

    const loadStarterKit = () => {
        if (confirm('Load pre-made high-yield notes? (Existing notes will remain)')) {
            const starterKit = [
                { id: Date.now() + 1, title: 'Unit & Dimensions Trick', content: 'Force (MLT⁻²) and Energy (ML²T⁻²) are the most used.\nSurface Tension = Surface Energy/Area = Force/Length = [MT⁻²]', subject: 'Physics', date: new Date().toLocaleDateString() },
                { id: Date.now() + 2, title: 'Inorganic exceptions', content: 'Atomic size: B < Ga (Transition contraction)\nIonization Enthalpy: B > Al < Ga (due to 3d electrons)', subject: 'Chemistry', date: new Date().toLocaleDateString() }
            ];
            setNotes([...starterKit, ...notes]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content) return;

        const newNote = {
            ...formData,
            id: Date.now(),
            date: new Date().toLocaleDateString()
        };
        setNotes([newNote, ...notes]);
        setFormData({ title: '', content: '', subject: 'Physics', isPinned: false });
        setIsFormOpen(false);
    };

    const togglePin = (id) => {
        setNotes(notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    };

    const toggleRevised = (id) => {
        setNotes(notes.map(n => n.id === id ? { ...n, isRevised: !n.isRevised } : n));
    };

    const deleteNote = (id) => {
        if (confirm('Permanently delete this study note?')) {
            setNotes(notes.filter(n => n.id !== id));
        }
    };

    const exportNotes = () => {
        const dataStr = JSON.stringify(notes, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = 'neet_mentor_notes.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    if (!mounted) return null;

    const filteredNotes = notes
        .filter(n => filterSubject === 'All' || n.subject === filterSubject)
        .filter(n =>
            n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

    return (
        <AppShell>
            <div className="notes-container">
                {/* Header Banner */}
                <header className="notes-header">
                    <div className="header-visual">
                        <StickyNote size={120} />
                    </div>
                    <div className="header-text">
                        <div className="premium-badge"><Zap size={14} /> ACTIVE RECALL TOOL</div>
                        <h1>My Study Vault</h1>
                        <p>Capture short tricks, formulas, and NCERT exceptions. These are your secrets to cracking NEET.</p>
                    </div>
                    <div className="header-actions">
                        <button className="starter-kit-btn" onClick={loadStarterKit} title="Add High-Yield Samples">
                            <Book size={18} /> Load Starter Kit
                        </button>
                        <button className="add-btn" onClick={() => setIsFormOpen(!isFormOpen)}>
                            <Plus size={20} /> {isFormOpen ? 'Close Editor' : 'Create New Note'}
                        </button>
                    </div>
                </header>

                <div className="controls-row">
                    <div className="search-bar">
                        <div className="search-icon-container">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Find formulas, tricks, topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="clear-search" onClick={() => setSearchQuery('')} aria-label="Clear search">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div className="filters">
                        {['All', 'Physics', 'Chemistry', 'Biology'].map(sub => (
                            <button
                                key={sub}
                                className={`filter-chip ${filterSubject === sub ? 'active' : ''}`}
                                onClick={() => setFilterSubject(sub)}
                            >
                                {sub}
                            </button>
                        ))}
                        <button className="export-btn" onClick={exportNotes} title="Backup Notes">
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                {/* Note Creation Form */}
                {isFormOpen && (
                    <div className="form-card animate-in">
                        <form onSubmit={handleSubmit}>
                            <div className="form-header">
                                <input
                                    type="text"
                                    placeholder="Topic Name (e.g. Modern Physics Shortcuts)"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    className="title-input"
                                />
                                <select
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    className="subject-select"
                                >
                                    <option>Physics</option>
                                    <option>Chemistry</option>
                                    <option>Biology</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <textarea
                                placeholder="Paste NCERT exceptions, draw diagrams with text, or list formulas..."
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                required
                                className="content-textarea"
                            />
                            <div className="form-footer">
                                <label className="pin-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={formData.isPinned}
                                        onChange={e => setFormData({ ...formData, isPinned: e.target.checked })}
                                    />
                                    <Pin size={16} /> Pin to top
                                </label>
                                <div className="btn-group">
                                    <button type="button" className="cancel-btn" onClick={() => setIsFormOpen(false)}>Discard</button>
                                    <button type="submit" className="save-btn">Save to Vault</button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Notes Grid */}
                {filteredNotes.length === 0 ? (
                    <div className="empty-state">
                        <Book size={64} className="empty-icon" />
                        <h2>No matches in your vault</h2>
                        <p>Try a different keyword or create a new revision note.</p>
                        <button onClick={() => { setSearchQuery(''); setFilterSubject('All'); }} className="reset-btn">View All Notes</button>
                    </div>
                ) : (
                    <div className="notes-masonry">
                        {filteredNotes.map((note) => (
                            <div key={note.id} className={`note-card ${note.isPinned ? 'pinned' : ''} ${note.isRevised ? 'revised' : ''}`}>
                                {note.isPinned && (
                                    <div className="pinned-badge"><Pin size={12} fill="currentColor" /> PINNED</div>
                                )}
                                <div className="note-meta">
                                    <div className="meta-left">
                                        <span className="subject-tag" style={{
                                            background: SUBJECT_COLORS[note.subject]?.bg || SUBJECT_COLORS.Other.bg,
                                            color: SUBJECT_COLORS[note.subject]?.text || SUBJECT_COLORS.Other.text
                                        }}>
                                            {note.subject}
                                        </span>
                                        <span className="note-date">{note.isRevised ? '✅ Revised' : note.date}</span>
                                    </div>
                                    <button
                                        className={`pin-toggle-btn ${note.isPinned ? 'active' : ''}`}
                                        onClick={() => togglePin(note.id)}
                                        title={note.isPinned ? "Unpin Note" : "Pin Note"}
                                    >
                                        <Pin size={16} fill={note.isPinned ? "currentColor" : "none"} />
                                    </button>
                                </div>

                                <h3 className="note-title">{note.title}</h3>
                                <div className="note-body">{note.content}</div>

                                <div className="note-footer">
                                    <div className="footer-left">
                                        <button className="delete-note" onClick={() => deleteNote(note.id)} title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                        <button className={`revise-btn ${note.isRevised ? 'active' : ''}`} onClick={() => toggleRevised(note.id)}>
                                            <Zap size={14} /> {note.isRevised ? 'Done' : 'Revise'}
                                        </button>
                                    </div>
                                    <div className="footer-right">
                                        <button className="read-btn" onClick={() => setActiveNote(note)}>
                                            <BookOpen size={16} /> <span>Read</span>
                                        </button>
                                        <button className="edit-note" onClick={() => {
                                            setFormData(note);
                                            setIsFormOpen(true);
                                            setNotes(notes.filter(n => n.id !== note.id));
                                        }}>
                                            <Edit3 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Focused Reading Modal */}
                {activeNote && (
                    <div className="reading-modal-overlay" onClick={() => setActiveNote(null)}>
                        <div className="reading-modal-content" onClick={e => e.stopPropagation()} style={{
                            '--reading-font-size': `${readingSettings.fontSize}px`,
                            background: readingSettings.theme === 'sepia' ? '#F4ECD8' :
                                readingSettings.theme === 'focus' ? '#121212' : 'var(--color-surface)',
                            color: readingSettings.theme === 'sepia' ? '#5B4636' :
                                readingSettings.theme === 'focus' ? '#E0E0E0' : 'var(--color-text-main)'
                        }}>
                            <div className="reading-toolbar">
                                <div className="toolbar-left">
                                    <button onClick={() => setReadingSettings(s => ({ ...s, fontSize: Math.max(12, s.fontSize - 2) }))}>A-</button>
                                    <button onClick={() => setReadingSettings(s => ({ ...s, fontSize: Math.min(32, s.fontSize + 2) }))}>A+</button>
                                    <div className="theme-pickers">
                                        <button className="theme-btn default" onClick={() => setReadingSettings(s => ({ ...s, theme: 'default' }))}></button>
                                        <button className="theme-btn sepia" onClick={() => setReadingSettings(s => ({ ...s, theme: 'sepia' }))}></button>
                                        <button className="theme-btn focus" onClick={() => setReadingSettings(s => ({ ...s, theme: 'focus' }))}></button>
                                    </div>
                                </div>
                                <button className="close-reading" onClick={() => setActiveNote(null)}><X size={24} /></button>
                            </div>

                            <div className="reading-area">
                                <div className="reading-subject">
                                    <span style={{ border: `1px solid ${SUBJECT_COLORS[activeNote.subject]?.border || '#ccc'}`, color: SUBJECT_COLORS[activeNote.subject]?.text || '#666' }}>
                                        {activeNote.subject}
                                    </span>
                                </div>
                                <h1 className="reading-title">{activeNote.title}</h1>
                                <div className="reading-body">
                                    {activeNote.content}
                                </div>
                            </div>

                            <div className="reading-footer">
                                <button className="mark-revised-btn" onClick={() => { toggleRevised(activeNote.id); setActiveNote(null); }}>
                                    {activeNote.isRevised ? 'Unmark as Revised' : 'Finished Reading - Mark Revised'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .notes-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding-bottom: 60px;
                }

                .notes-header {
                    background: linear-gradient(135deg, #1E1B4B 0%, #312E81 100%);
                    border-radius: 24px;
                    padding: 48px;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 32px;
                    margin-bottom: 32px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                }

                .header-visual {
                    opacity: 0.15;
                    transform: rotate(-10deg);
                    flex-shrink: 0;
                }

                .header-text h1 {
                    font-size: 2.75rem;
                    color: white;
                    margin: 8px 0;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                }

                .header-text p {
                    font-size: 1.1rem;
                    opacity: 0.8;
                    max-width: 500px;
                    line-height: 1.5;
                }

                .premium-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 4px 12px;
                    border-radius: 99px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .add-btn {
                    padding: 14px 24px;
                    background: white;
                    color: var(--color-primary);
                    border: none;
                    border-radius: 14px;
                    font-weight: 700;
                    font-size: 1rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: transform 0.2s;
                }

                .add-btn:hover { transform: scale(1.02); }

                /* Controls */
                .controls-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 32px;
                    gap: 20px;
                    flex-wrap: wrap;
                }

                .search-bar {
                    position: relative;
                    flex: 1;
                    max-width: 500px;
                    min-width: 300px;
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
                    pointer-events: none;
                    z-index: 10;
                }

                .search-bar input {
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

                .search-bar input:focus {
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
                    transition: all 0.2s;
                }

                .clear-search:hover { 
                    opacity: 1; 
                    background: var(--color-primary-light);
                    color: var(--color-primary);
                }

                .filters {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .filter-chip {
                    padding: 10px 18px;
                    border-radius: 12px;
                    border: 1px solid var(--color-border);
                    background: var(--color-surface);
                    color: var(--color-text-muted);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .filter-chip.active {
                    background: var(--color-primary);
                    color: white;
                    border-color: var(--color-primary);
                }

                .export-btn {
                    padding: 10px;
                    border-radius: 12px;
                    border: 1px solid var(--color-border);
                    background: var(--color-surface);
                    color: var(--color-text-muted);
                    cursor: pointer;
                }

                /* Form Card */
                .form-card {
                    background: var(--color-surface);
                    padding: 32px;
                    border-radius: 24px;
                    border: 2px dashed var(--color-primary);
                    margin-bottom: 40px;
                    box-shadow: var(--shadow-lg);
                }

                .form-header {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 16px;
                }

                .title-input {
                    flex: 1;
                    padding: 12px;
                    font-size: 1.25rem;
                    font-weight: 700;
                    border: 1px solid var(--color-border);
                    border-radius: 10px;
                    background: var(--color-background);
                    color: var(--color-text-main);
                }

                .subject-select {
                    padding: 12px;
                    border-radius: 10px;
                    border: 1px solid var(--color-border);
                    background: var(--color-background);
                    color: var(--color-text-main);
                    font-weight: 600;
                }

                .content-textarea {
                    width: 100%;
                    min-height: 200px;
                    padding: 16px;
                    border-radius: 12px;
                    border: 1px solid var(--color-border);
                    background: var(--color-background);
                    color: var(--color-text-main);
                    font-family: inherit;
                    font-size: 1rem;
                    line-height: 1.6;
                    margin-bottom: 20px;
                    resize: vertical;
                }

                .form-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .pin-checkbox {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    color: var(--color-text-muted);
                }

                .btn-group {
                    display: flex;
                    gap: 12px;
                }

                .header-actions {
                    display: flex;
                    gap: 12px;
                    flex-shrink: 0;
                }

                .starter-kit-btn {
                    padding: 14px 20px;
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 14px;
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                }

                .starter-kit-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    border-color: white;
                }

                .save-btn {
                    padding: 12px 24px;
                    background: var(--color-primary);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .cancel-btn {
                    padding: 12px 24px;
                    background: var(--color-background);
                    color: var(--color-text-muted);
                    border: 1px solid var(--color-border);
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                }

                /* Notes Grid */
                .notes-masonry {
                    columns: 350px;
                    column-gap: 24px;
                }

                .note-card {
                    break-inside: avoid;
                    background: var(--color-surface);
                    border-radius: 24px;
                    padding: 24px;
                    border: 1px solid var(--color-border);
                    margin-bottom: 24px;
                    position: relative;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: var(--shadow-sm);
                }

                .note-card:hover {
                    box-shadow: var(--shadow-lg);
                    transform: translateY(-4px);
                }

                .note-card.pinned {
                    border-color: var(--color-primary);
                    background: linear-gradient(to bottom right, var(--color-surface), var(--color-primary-light));
                }

                .note-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .meta-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .pin-toggle-btn {
                    background: none;
                    border: none;
                    color: var(--color-text-muted);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 6px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.4;
                }

                .pin-toggle-btn:hover {
                    background: var(--color-primary-light);
                    color: var(--color-primary);
                    opacity: 1;
                }

                .pin-toggle-btn.active {
                    color: var(--color-primary);
                    opacity: 1;
                }

                .subject-tag {
                    font-size: 0.65rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    padding: 4px 10px;
                    border-radius: 6px;
                    letter-spacing: 0.05em;
                }

                .note-date {
                    font-size: 0.75rem;
                    color: var(--color-text-muted);
                }

                .note-title {
                    font-size: 1.25rem;
                    font-weight: 750;
                    margin: 0 0 12px 0;
                    color: var(--color-text-main);
                    line-height: 1.2;
                }

                .note-body {
                    font-size: 0.95rem;
                    line-height: 1.6;
                    color: var(--color-text-main);
                    white-space: pre-wrap;
                    margin-bottom: 20px;
                }

                /* Note Footer Layout Fix */
                .note-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 16px;
                    border-top: 1px solid var(--color-border);
                    gap: 8px;
                }

                .footer-left, .footer-right {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .revise-btn {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 6px 12px;
                    border-radius: 8px;
                    border: 1px solid var(--color-border);
                    background: var(--color-background);
                    color: var(--color-text-muted);
                    font-size: 0.75rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .revise-btn.active {
                    background: var(--color-success-bg);
                    color: var(--color-success-text);
                    border-color: var(--color-success-text);
                }

                .read-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 14px;
                    background: var(--color-primary);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    cursor: pointer;
                }

                .pinned-badge {
                    position: absolute;
                    top: -10px;
                    left: 20px;
                    background: var(--color-primary);
                    color: white;
                    padding: 2px 10px;
                    border-radius: 4px;
                    font-size: 0.65rem;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    box-shadow: var(--shadow-sm);
                }

                /* Reading Mode Modal */
                .reading-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.85);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(8px);
                    padding: 20px;
                }

                .reading-modal-content {
                    width: 100%;
                    max-width: 800px;
                    max-height: 90vh;
                    border-radius: 24px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.5);
                    animation: modal-scale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                @keyframes modal-scale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }

                .reading-toolbar {
                    padding: 16px 24px;
                    border-bottom: 1px solid rgba(0,0,0,0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(255,255,255,0.05);
                }

                .toolbar-left {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .toolbar-left button {
                    background: rgba(128,128,128,0.1);
                    border: 1px solid rgba(128,128,128,0.2);
                    color: inherit;
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    font-weight: bold;
                    cursor: pointer;
                }

                .theme-pickers {
                    display: flex;
                    gap: 8px;
                    margin-left: 12px;
                    padding-left: 12px;
                    border-left: 1px solid rgba(128,128,128,0.2);
                }

                .theme-btn {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: 2px solid rgba(128,128,128,0.3);
                    cursor: pointer;
                }

                .theme-btn.default { background: white; }
                .theme-btn.sepia { background: #F4ECD8; }
                .theme-btn.focus { background: #121212; border-color: #444; }

                .close-reading {
                    background: none;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    opacity: 0.6;
                }

                .reading-area {
                    flex: 1;
                    padding: 40px 60px;
                    overflow-y: auto;
                }

                .reading-subject { margin-bottom: 12px; }
                .reading-subject span {
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    padding: 4px 12px;
                    border-radius: 6px;
                }

                .reading-title {
                    font-size: 2.25rem;
                    font-weight: 800;
                    margin: 0 0 24px 0;
                    line-height: 1.2;
                }

                .reading-body {
                    font-size: var(--reading-font-size);
                    line-height: 1.8;
                    white-space: pre-wrap;
                }

                .reading-footer {
                    padding: 24px;
                    text-align: center;
                    border-top: 1px solid rgba(0,0,0,0.05);
                }

                .mark-revised-btn {
                    background: var(--color-primary);
                    color: white;
                    border: none;
                    padding: 12px 32px;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                }

                .delete-note {
                    color: #EF4444;
                    background: #FEE2E2;
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .edit-note {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: var(--color-primary);
                    background: transparent;
                    border: none;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                }

                .delete-note:hover { transform: scale(1.1); }

                /* Empty State */
                .empty-state {
                    text-align: center;
                    padding: 80px 20px;
                    background: var(--color-surface);
                    border-radius: 32px;
                    border: 1px dashed var(--color-border);
                }

                .empty-icon { color: var(--color-text-muted); margin-bottom: 20px; opacity: 0.5; }
                .reset-btn {
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: var(--color-primary);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                }

                @media (max-width: 768px) {
                    .notes-header { padding: 32px; flex-direction: column; text-align: center; }
                    .notes-masonry { columns: 1; }
                    .header-text h1 { font-size: 2rem; }
                    .controls-row { flex-direction: column; align-items: stretch; }
                }
            `}</style>
        </AppShell>
    );
}
