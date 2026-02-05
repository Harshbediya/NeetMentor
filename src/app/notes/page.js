"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import {
    Plus, Trash2, Search, Zap,
    BookOpen, Edit2, Pin, RotateCcw,
    Download, FileText, Layout, X
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { saveData, loadData } from "@/lib/progress";

export default function NotesPage() {
    const [notes, setNotes] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");

    // Modal States
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null); // ID of note being edited
    const [viewingNote, setViewingNote] = useState(null); // Note object for "Read" mode
    const [revisingNote, setRevisingNote] = useState(null); // Note object for "Revise" mode (Flashcard)
    const [isFlipped, setIsFlipped] = useState(false); // For flashcard flip animation

    const [newNote, setNewNote] = useState({ title: "", content: "", subject: "Physics", tags: "" });

    useEffect(() => {
        setMounted(true);
        const syncNotes = async () => {
            const serverNotes = await loadData("notes", { notes: [] });
            if (serverNotes && serverNotes.notes) {
                setNotes(serverNotes.notes);
            }
        };
        syncNotes();
    }, []);

    useEffect(() => {
        if (mounted) {
            saveData("notes", { notes });
        }
    }, [notes, mounted]);

    // Handle Image Upload
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewNote(prev => ({ ...prev, imageUrl: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Create or Update Note
    const handleSaveNote = (e) => {
        e.preventDefault();
        if (!newNote.title.trim()) return;

        if (editingId) {
            // Update existing
            setNotes(notes.map(n =>
                n.id === editingId ? { ...n, ...newNote } : n
            ));
        } else {
            // Create new
            const note = {
                id: Date.now() + Math.random(),
                ...newNote,
                date: new Date().toLocaleDateString('en-GB'),
                isPinned: false
            };
            setNotes(prev => [note, ...prev]);
        }

        // Reset and close
        setNewNote({ title: "", content: "", subject: "Physics", tags: "" });
        setEditingId(null);
        setIsAdding(false);
    };

    const deleteNote = (id) => {
        if (confirm("Delete this note?")) {
            setNotes(notes.filter(n => n.id !== id));
            if (viewingNote?.id === id) setViewingNote(null);
            if (revisingNote?.id === id) setRevisingNote(null);
        }
    };

    const togglePin = (id) => {
        setNotes(notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    };

    // Open Edit Modal
    const startEditing = (note) => {
        setNewNote({
            title: note.title,
            content: note.content,
            subject: note.subject,
            tags: note.tags || ""
        });
        setEditingId(note.id);
        setIsAdding(true);
    };

    // Open Revise Modal (Flashcard)
    const startRevision = (note) => {
        setRevisingNote(note);
        setIsFlipped(false);
    };

    const loadStarterKit = () => {
        const timestamp = Date.now();
        const starterNotes = [
            {
                id: timestamp,
                title: "Butterfly Structure (CrO5)",
                subject: "Chemistry",
                content: "In CrO5, Cr has +6 oxidation state (not +10).\nReason: It has two peroxide bonds (-O-O-).\nStructure: Butterfly shape with 4 peroxide oxygens and 1 carbonyl oxygen.",
                date: "05/02/2026",
                isPinned: true
            },
            {
                id: timestamp + 1,
                title: "Speed of Light Dimensions",
                subject: "Physics",
                content: "Expression: 1 / sqrt(μ₀ε₀)\nDimensions: [M⁰ L¹ T⁻¹]\nUnits: m/s\nNote: Frequently asked in Match the Following!",
                date: "05/02/2026",
                isPinned: false
            },
            {
                id: timestamp + 2,
                title: "Amine Basicity (Aqueous)",
                subject: "Chemistry",
                content: "Order of basicity in water:\n- Ethyl groups: 2° > 3° > 1° > NH₃\n- Methyl groups: 2° > 1° > 3° > NH₃\nTrick: Ethyl is Bulky (231), Methyl is Small (213).",
                date: "05/02/2026",
                isPinned: false
            }
        ];

        if (confirm("Load sample notes?")) {
            setNotes(prev => [...starterNotes, ...prev]);
        }
    };

    if (!mounted) return null;

    const filteredNotes = notes.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === "All" || n.subject === activeFilter;
        return matchesSearch && matchesFilter;
    }).sort((a, b) => b.isPinned - a.isPinned);

    return (
        <AppShell>
            <div className="notes-page">
                {/* Header */}
                <div className="vault-header">
                    <div className="vault-badge">
                        <Zap size={14} fill="#fbbf24" color="#fbbf24" /> ACTIVE RECALL TOOL
                    </div>
                    <h1>My Study Vault</h1>
                    <p>Capture short tricks, formulas, and NCERT exceptions.<br />These are your secrets to cracking NEET.</p>

                    <div className="header-actions">
                        <button className="btn-outline" onClick={loadStarterKit}>
                            <Layout size={18} /> Load Starter Kit
                        </button>
                        <button className="btn-solid" onClick={() => {
                            setNewNote({ title: "", content: "", subject: "Physics", tags: "" });
                            setEditingId(null);
                            setIsAdding(true);
                        }}>
                            <Plus size={18} /> Create New Note
                        </button>
                    </div>
                    <div className="vault-icon-bg"><FileText size={180} strokeWidth={1} /></div>
                </div>

                {/* Filters */}
                <div className="filter-bar">
                    <div className="search-wrapper">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Find formulas, tricks, topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="filter-chips">
                        {['All', 'Physics', 'Chemistry', 'Biology'].map(subject => (
                            <button
                                key={subject}
                                className={`chip ${activeFilter === subject ? 'active' : ''}`}
                                onClick={() => setActiveFilter(subject)}
                            >
                                {subject}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="notes-grid">
                    {filteredNotes.map(note => (
                        <div key={note.id} className={`note-card ${(note.subject || 'General').toLowerCase()}`}>
                            {note.isPinned && (
                                <div className="pinned-badge"><Pin size={12} fill="white" /> PINNED</div>
                            )}

                            <div className="card-top">
                                <div className="meta">
                                    <span className="subject">{note.subject.toUpperCase()}</span>
                                    <span className="date">{note.date}</span>
                                </div>
                                <button className={`pin-btn ${note.isPinned ? 'active' : ''}`} onClick={() => togglePin(note.id)}>
                                    <Pin size={16} className={note.isPinned ? "fill-current" : ""} />
                                </button>
                            </div>

                            <h3>{note.title}</h3>
                            <div className="content-preview">
                                {note.content.length > 100 ? note.content.substring(0, 100) + "..." : note.content}
                            </div>

                            <div className="card-actions">
                                <button className="action-icon delete" onClick={() => deleteNote(note.id)} title="Delete">
                                    <Trash2 size={16} />
                                </button>
                                <button className="action-pill" onClick={() => startRevision(note)} title="Flashcard Mode">
                                    <Zap size={14} /> Revise
                                </button>
                                <button className="action-pill primary" onClick={() => setViewingNote(note)} title="Focus Read">
                                    <BookOpen size={14} /> Read
                                </button>
                                <button className="action-icon edit" onClick={() => startEditing(note)} title="Edit">
                                    <Edit2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredNotes.length === 0 && !isAdding && (
                        <div className="empty-placeholder">
                            <p>No notes found. Create one or load the starter kit!</p>
                        </div>
                    )}
                </div>

                {/* EDITOR MODAL */}
                {isAdding && (
                    <div className="modal-overlay">
                        <div className="note-form-card">
                            <div className="modal-header">
                                <h3>{editingId ? "Edit Note" : "New Flash Note"}</h3>
                                <button className="close-btn" onClick={() => setIsAdding(false)}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSaveNote}>
                                <input
                                    className="input-title"
                                    placeholder="Title (e.g. Newton's 2nd Law Trick)"
                                    value={newNote.title}
                                    onChange={e => setNewNote({ ...newNote, title: e.target.value })}
                                    autoFocus
                                    required
                                />
                                <div className="row">
                                    <select
                                        value={newNote.subject}
                                        onChange={e => setNewNote({ ...newNote, subject: e.target.value })}
                                    >
                                        <option>Physics</option>
                                        <option>Chemistry</option>
                                        <option>Biology</option>
                                    </select>
                                </div>
                                <textarea
                                    placeholder="Write your short trick, formula, or exception here..."
                                    value={newNote.content}
                                    onChange={e => setNewNote({ ...newNote, content: e.target.value })}
                                    rows={8}
                                />

                                <div className="file-input-wrapper">
                                    <label className="file-label">
                                        <span className="file-text">{newNote.imageUrl ? "Change Diagram" : "Add Diagram / Image"}</span>
                                        <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                                    </label>
                                    {newNote.imageUrl && (
                                        <div className="image-preview-mini">
                                            <img src={newNote.imageUrl} alt="Preview" />
                                            <button type="button" onClick={() => setNewNote({ ...newNote, imageUrl: null })} className="remove-img-btn"><X size={12} /></button>
                                        </div>
                                    )}
                                </div>

                                <div className="form-btns">
                                    <button type="button" className="cancel-btn" onClick={() => setIsAdding(false)}>Cancel</button>
                                    <button type="submit" className="save-btn">{editingId ? "Update Note" : "Save to Vault"}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* READ MODAL (Focus Mode) */}
                {viewingNote && (
                    <div className="modal-overlay">
                        <div className="read-modal-card">
                            <div className="modal-header">
                                <span className={`subject-tag ${viewingNote.subject.toLowerCase()}`}>{viewingNote.subject}</span>
                                <div className="modal-actions">
                                    <button onClick={() => { startEditing(viewingNote); setViewingNote(null); }}><Edit2 size={18} /></button>
                                    <button onClick={() => setViewingNote(null)}><X size={24} /></button>
                                </div>
                            </div>
                            <h2 className="read-title">{viewingNote.title}</h2>
                            <div className="read-content">
                                {viewingNote.content.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                            </div>
                        </div>
                    </div>
                )}

                {/* REVISE MODAL (Flashcard Mode) */}
                {revisingNote && (
                    <div className="modal-overlay">
                        <div className="flashcard-container">
                            <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
                                <div className="card-face front">
                                    <span className="card-label">QUESTION / TOPIC</span>
                                    <h3>{revisingNote.title}</h3>
                                    <p className="tap-hint">Tap to flip <RotateCcw size={14} /></p>
                                </div>
                                <div className="card-face back">
                                    <span className="card-label">ANSWER / NOTES</span>
                                    <div className="back-content">
                                        {revisingNote.content.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                                    </div>
                                </div>
                            </div>
                            <button className="close-flashcard" onClick={() => setRevisingNote(null)}>Stop Revision</button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .notes-page {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 24px;
                    font-family: var(--font-inter, sans-serif);
                }

                /* Reuse Vault Header & Filter css from before... putting core structure back */
                .vault-header {
                    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
                    border-radius: 24px;
                    padding: 48px;
                    color: white;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 10px 30px -10px rgba(49, 46, 129, 0.4);
                    margin-bottom: 32px;
                }
                .vault-icon-bg { position: absolute; right: 40px; top: 50%; transform: translateY(-50%) rotate(-10deg); opacity: 0.1; pointer-events: none; }
                .vault-badge { display: inline-flex;  align-items: center; gap: 8px; background: rgba(255, 255, 255, 0.15); padding: 6px 16px; border-radius: 99px; font-size: 0.75rem; font-weight: 800; margin-bottom: 16px; border: 1px solid rgba(255, 255, 255, 0.2); }
                .vault-header h1 { font-size: 3rem; font-weight: 800; margin-bottom: 12px; }
                .vault-header p { color: #cbd5e1; font-size: 1.1rem; line-height: 1.6; margin-bottom: 32px; max-width: 600px; }
                .header-actions { display: flex; gap: 16px; position: relative; z-index: 2; }

                .btn-solid { background: white; color: #312e81; padding: 12px 24px; border-radius: 12px; font-weight: 700; border: none; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: transform 0.2s; }
                .btn-outline { background: transparent; color: white; border: 2px solid rgba(255, 255, 255, 0.3); padding: 12px 24px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; }
                .btn-solid:hover, .btn-outline:hover { transform: translateY(-2px); }

                /* Filter Bar */
                .filter-bar { display: flex; justify-content: space-between; align-items: center; gap: 24px; margin-bottom: 32px; flex-wrap: wrap; }
                .search-wrapper { flex: 1; position: relative; min-width: 300px; }
                .search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
                .search-wrapper input { width: 100%; padding: 16px 16px 16px 48px; border-radius: 16px; border: 1px solid #e2e8f0; font-size: 1rem; outline: none; }
                .filter-chips { display: flex; gap: 12px; }
                .chip { background: white; border: 1px solid #e2e8f0; padding: 10px 20px; border-radius: 99px; color: #64748b; font-weight: 600; cursor: pointer; }
                .chip.active { background: #4f46e5; color: white; border-color: #4f46e5; }

                /* Grid */
                .notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }
                .note-card { background: white; border-radius: 20px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; display: flex; flex-direction: column; position: relative; transition: transform 0.2s; height: 100%; }
                .note-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1); }
                
                .note-card.chemistry { border-top: 6px solid #f97316; }
                .note-card.physics { border-top: 6px solid #3b82f6; }
                .note-card.biology { border-top: 6px solid #10b981; }
                .note-card.general { border-top: 6px solid #64748b; } /* General Fallback */

                .card-top { display: flex; justify-content: space-between; margin-bottom: 16px; }
                .meta { display: flex; gap: 12px; align-items: center; }
                .subject { font-size: 0.75rem; font-weight: 800; letter-spacing: 0.05em; color: #64748b; }
                .note-card.chemistry .subject { color: #f97316; }
                .note-card.physics .subject { color: #3b82f6; }
                .note-card.biology .subject { color: #10b981; }

                .pinned-badge { position: absolute; top: -12px; left: 24px; background: #4f46e5; color: white; font-size: 0.65rem; font-weight: 800; padding: 4px 12px; border-radius: 99px; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 8px rgba(79, 70, 229, 0.3); }

                .note-card h3 { margin: 0 0 12px 0; font-size: 1.25rem; font-weight: 700; color: #1e293b; line-height: 1.3; }
                .content-preview { font-size: 0.95rem; color: #475569; line-height: 1.6; flex: 1; margin-bottom: 24px; white-space: pre-line; overflow: hidden; }

                .card-actions { display: flex; gap: 8px; padding-top: 16px; border-top: 1px solid #f1f5f9; align-items: center; }
                .action-pill { background: #f1f5f9; border: none; padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; color: #64748b; display: flex; align-items: center; gap: 6px; cursor: pointer; flex: 1; justify-content: center; }
                .action-pill:hover { background: #e2e8f0; color: #334155; }
                .action-pill.primary { background: #4f46e5; color: white; }
                .action-pill.primary:hover { background: #4338ca; }
                .action-icon { width: 36px; height: 36px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; background: white; color: #94a3b8; }
                .action-icon:hover { background: #f1f5f9; color: #4f46e5; }
                .action-icon.delete:hover { background: #fef2f2; color: #ef4444; }

                /* MODAL OVERLAYS */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); animation: fadeIn 0.2s; }
                
                /* EDIT FORM */
                .note-form-card { background: white; width: 90%; max-width: 600px; padding: 32px; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .modal-header h3 { margin: 0; font-size: 1.5rem; color: #1e293b; }
                .input-title { font-size: 1.5rem; padding: 12px 0; border: none; border-bottom: 2px solid #e2e8f0; outline: none; font-weight: 800; color: #1e293b; width: 100%; margin-bottom: 20px; }
                .input-title:focus { border-color: #4f46e5; }
                .note-form-card textarea { width: 100%; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; font-family: inherit; resize: vertical; margin-top: 16px; font-size: 1rem; line-height: 1.6; }
                .note-form-card select { padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; width: 100%; }
                .form-btns { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
                .save-btn { background: #4f46e5; color: white; padding: 12px 24px; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; }
                .cancel-btn { background: transparent; color: #64748b; padding: 12px 24px; border: none; font-weight: 600; cursor: pointer; }
                .close-btn { background: none; border: none; cursor: pointer; color: #94a3b8; }

                /* REVISE/FLASHCARD MODAL */
                .flashcard-container { perspective: 1000px; display: flex; flex-direction: column; align-items: center; gap: 24px; }
                .flashcard { width: 500px; height: 350px; position: relative; transform-style: preserve-3d; transition: transform 0.6s; cursor: pointer; }
                .flashcard.flipped { transform: rotateY(180deg); }
                .card-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center; }
                .card-face.front { background: white; color: #1e293b; }
                .card-face.back { background: #4f46e5; color: white; transform: rotateY(180deg); }
                .card-label { font-size: 0.75rem; font-weight: 800; opacity: 0.6; margin-bottom: 16px; letter-spacing: 0.1em; }
                .card-face h3 { font-size: 2rem; font-weight: 800; margin: 0; }
                .back-content { font-size: 1.25rem; font-weight: 500; line-height: 1.6; overflow-y: auto; max-width: 100%; }
                .tap-hint { position: absolute; bottom: 24px; font-size: 0.85rem; opacity: 0.5; display: flex; align-items: center; gap: 6px; }
                .close-flashcard { background: white; color: #1e293b; border: none; padding: 12px 24px; border-radius: 99px; font-weight: 700; cursor: pointer; }

                /* READ MODAL */
                .read-modal-card { background: white; width: 90%; max-width: 700px; padding: 48px; border-radius: 24px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
                .subject-tag { padding: 4px 12px; border-radius: 99px; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; }
                .subject-tag.physics { background: #eff6ff; color: #3b82f6; }
                .subject-tag.chemistry { background: #fff7ed; color: #f97316; }
                .subject-tag.biology { background: #ecfdf5; color: #10b981; }
                .modal-actions { display: flex; gap: 16px; }
                .modal-actions button { background: none; border: none; color: #94a3b8; cursor: pointer; }
                .modal-actions button:hover { color: #1e293b; }
                .read-title { font-size: 2.5rem; font-weight: 800; color: #1e293b; margin: 24px 0; line-height: 1.2; }
                .read-content { font-size: 1.15rem; color: #334155; line-height: 1.8; }
                .read-content p { margin-bottom: 16px; }

                @media(max-width: 640px) {
                    .vault-header h1 { font-size: 2rem; }
                    .flashcard { width: 90vw; height: 60vh; }
                    .read-modal-card { padding: 24px; }
                    .read-title { font-size: 1.8rem; }
                }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </AppShell>
    );
}

