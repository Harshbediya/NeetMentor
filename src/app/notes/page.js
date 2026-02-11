"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import {
    Plus, Trash2, Search, Zap,
    BookOpen, Edit2, Pin, RotateCcw,
    Download, FileText, Layout, X,
    Image as ImageIcon
} from "lucide-react";
import api, { getCookie } from "@/lib/api";

export default function NotesPage() {
    const router = useRouter();
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
        const fetchNotes = async () => {
            const token = typeof window !== 'undefined' ? getCookie('token') : null;
            if (!token) {
                router.push("/login");
                return;
            }

            try {
                const res = await api.get('/notes/');
                const mappedNotes = res.data.map(n => ({
                    ...n,
                    imageUrl: n.image_url,
                    isPinned: n.is_pinned,
                    date: new Date(n.created_at).toLocaleDateString('en-GB')
                }));
                setNotes(mappedNotes);
            } catch (err) {
                if (err.response?.status === 401) {
                    router.push("/login");
                } else {
                    console.error("Failed to fetch notes", err);
                }
            }
        };
        fetchNotes();
    }, []);

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
    const handleSaveNote = async (e) => {
        e.preventDefault();
        if (!newNote.title.trim()) return;

        const payload = {
            title: newNote.title,
            content: newNote.content,
            subject: newNote.subject,
            image_url: newNote.imageUrl,
            tags: newNote.tags || ""
        };

        try {
            if (editingId && editingId < 1000000000) {
                const res = await api.put(`/notes/${editingId}/`, payload);
                setNotes(notes.map(n =>
                    n.id === editingId ? { ...res.data, imageUrl: res.data.image_url, isPinned: res.data.is_pinned, date: new Date(res.data.created_at).toLocaleDateString('en-GB') } : n
                ));
            } else {
                const res = await api.post('/notes/', payload);
                const note = {
                    ...res.data,
                    imageUrl: res.data.image_url,
                    isPinned: res.data.is_pinned,
                    date: new Date(res.data.created_at).toLocaleDateString('en-GB')
                };
                // If we were "editing" a starter note, remove the starter and add the new one
                if (editingId) {
                    setNotes(prev => [note, ...prev.filter(n => n.id !== editingId)]);
                } else {
                    setNotes(prev => [note, ...prev]);
                }
            }
            // Reset and close
            setNewNote({ title: "", content: "", subject: "Physics", tags: "" });
            setEditingId(null);
            setIsAdding(false);
        } catch (err) {
            alert("Failed to save note. Please check if you are logged in.");
        }
    };

    const deleteNote = async (id) => {
        if (confirm("Delete this note?")) {
            // If it's a local starter note, just remove from state
            if (id > 1000000000) {
                setNotes(notes.filter(n => n.id !== id));
                return;
            }
            try {
                await api.delete(`/notes/${id}/`);
                setNotes(notes.filter(n => n.id !== id));
                if (viewingNote?.id === id) setViewingNote(null);
                if (revisingNote?.id === id) setRevisingNote(null);
            } catch (err) {
                alert("Failed to delete note.");
            }
        }
    };

    const togglePin = async (note) => {
        // Handle local starter notes without API call
        if (note.id > 1000000000) {
            setNotes(notes.map(n => n.id === note.id ? { ...n, isPinned: !n.isPinned } : n));
            return;
        }

        try {
            const res = await api.patch(`/notes/${note.id}/`, { is_pinned: !note.isPinned });
            setNotes(notes.map(n => n.id === note.id ? { ...n, isPinned: res.data.is_pinned } : n));
        } catch (err) {
            console.error("Failed to toggle pin", err);
        }
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

    const loadStarterKit = async () => {
        if (notes.length > 0 && !confirm("This will add sample notes to your vault. Continue?")) {
            return;
        }

        const starterNotes = [
            {
                title: "Butterfly Structure (CrO5)",
                subject: "Chemistry",
                content: "In CrO5, Cr has +6 oxidation state (not +10).\nReason: It has two peroxide bonds (-O-O-).\nStructure: Butterfly shape with 4 peroxide oxygens and 1 carbonyl oxygen.\n\nKey for NEET: Frequently asked in redox reactions!",
                is_pinned: true,
                tags: "Inorganic, Bonding"
            },
            {
                title: "Speed of Light Dimensions",
                subject: "Physics",
                content: "Expression: 1 / sqrt(μ₀ε₀)\nDimensions: [M⁰ L¹ T⁻¹]\nUnits: m/s\n\nNote: Dimensional analysis is a 4-mark guarantee. Memorize the permeability and permittivity relations!",
                is_pinned: false,
                tags: "Units, Dimensions"
            },
            {
                title: "Amine Basicity (Aqueous)",
                subject: "Chemistry",
                content: "Order of basicity in water:\n- Ethyl groups (231): 2° > 3° > 1° > NH₃\n- Methyl groups (213): 2° > 1° > 3° > NH₃\n\nTrick: Ethyl is 'Bade Bhaiya' (231), Methyl is 'Chote Bhaiya' (213).",
                is_pinned: false,
                tags: "Organic, Amines"
            },
            {
                title: "Incomplete Dominance (Mirabilis)",
                subject: "Biology",
                content: "Example: Dog flower (Snapdragon) / Antirrhinum sp.\nPhenotypic Ratio: 1:2:1 (Red:Pink:White)\nGenotypic Ratio: 1:2:1 (RR:Rr:rr)\n\nConflict with Mendel: F1 doesn't resemble either parent but is intermediate.",
                is_pinned: false,
                tags: "Genetics"
            },
            {
                title: "Logic Gates - NAND vs NOR",
                subject: "Physics",
                content: "NAND: Universal Gate. Output is 0 only when both inputs are 1.\nNOR: Universal Gate. Output is 1 only when both inputs are 0.\n\nRemember: Bubbled AND = NOR, Bubbled OR = NAND.",
                is_pinned: true,
                tags: "Semiconductors, Logic"
            }
        ];

        try {
            const promises = starterNotes.map(note =>
                api.post('/notes/', {
                    title: note.title,
                    content: note.content,
                    subject: note.subject,
                    is_pinned: note.is_pinned,
                    tags: note.tags,
                    image_url: ""
                })
            );

            const responses = await Promise.all(promises);

            const createdNotes = responses.map(res => ({
                ...res.data,
                imageUrl: res.data.image_url,
                isPinned: res.data.is_pinned,
                date: new Date(res.data.created_at).toLocaleDateString('en-GB')
            }));

            setNotes(prev => [...createdNotes, ...prev]);
        } catch (err) {
            console.error("Failed to add samples", err);
            alert("Failed to save sample notes. Please check your connection.");
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
                            <Layout size={18} /> {notes.length === 0 ? "Load Starter Kit" : "Add Samples"}
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
                        <input
                            type="text"
                            placeholder="Find formulas, tricks, topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="search-icon" size={20} />
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
                                    <span className="subject">{note.subject?.toUpperCase()}</span>
                                    <span className="date">{note.date}</span>
                                </div>
                                <button className={`pin-btn ${note.isPinned ? 'active' : ''}`} onClick={() => togglePin(note)}>
                                    <Pin size={16} className={note.isPinned ? "fill-current" : ""} />
                                </button>
                            </div>

                            {note.imageUrl && (
                                <div className="card-image-preview">
                                    <img src={note.imageUrl} alt={note.title} />
                                </div>
                            )}

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
                        <div className="empty-vault-state">
                            <div className="empty-illustration">
                                <FileText size={100} strokeWidth={0.5} color="var(--primary)" opacity={0.3} />
                                <div className="illustration-blob"></div>
                            </div>
                            <h2>Your Vault is Empty</h2>
                            <p>This is where your high-yield shortcuts, NCERT exceptions, and formulas will live. Start by building your secret weapon.</p>
                            <div className="empty-actions">
                                <button className="btn-solid-premium" onClick={() => {
                                    setNewNote({ title: "", content: "", subject: "Physics", tags: "" });
                                    setEditingId(null);
                                    setIsAdding(true);
                                }}>
                                    <Plus size={20} /> Create First Note
                                </button>
                                <button className="btn-outline-proper" onClick={loadStarterKit}>
                                    <Layout size={18} /> Load Starter Kit
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* EDITOR MODAL */}
                {isAdding && (
                    <div className="modal-overlay" onClick={() => setIsAdding(false)}>
                        <div className={`note-form-card ${(newNote.subject || 'General').toLowerCase()}`} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ padding: '10px', background: 'var(--primary-glow)', borderRadius: '12px', color: 'var(--primary)' }}>
                                        <Edit2 size={20} />
                                    </div>
                                    <div>
                                        <h3>{editingId ? "Update Secret Trick" : "Log New Secret"}</h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>Your personal vault of NEET shortcuts</p>
                                    </div>
                                </div>
                                <button className="close-btn-proper" onClick={() => setIsAdding(false)}><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSaveNote}>
                                <div className="form-group-proper">
                                    <label>TREAD TITLE / TOPIC</label>
                                    <input
                                        className="input-title-proper"
                                        placeholder="Newton's Laws Trick"
                                        value={newNote.title}
                                        onChange={e => setNewNote({ ...newNote, title: e.target.value })}
                                        autoFocus
                                        required
                                    />
                                </div>

                                <div className="form-row-proper">
                                    <div className="form-group-proper">
                                        <label>SUBJECT CATEGORY</label>
                                        <select
                                            value={newNote.subject}
                                            onChange={e => setNewNote({ ...newNote, subject: e.target.value })}
                                            className="select-proper"
                                        >
                                            <option>Physics</option>
                                            <option>Chemistry</option>
                                            <option>Biology</option>
                                        </select>
                                    </div>
                                    <div className="form-group-proper" style={{ flex: 1 }}>
                                        <label>ATTACH DIAGRAM (OPTIONAL)</label>
                                        <label className="file-upload-trigger">
                                            <ImageIcon size={18} />
                                            <span>{newNote.imageUrl ? "Diagram Attached" : "Upload Diagram"}</span>
                                            <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                                        </label>
                                    </div>
                                </div>

                                {newNote.imageUrl && (
                                    <div className="image-preview-box">
                                        <img src={newNote.imageUrl} alt="Preview" />
                                        <button type="button" onClick={() => setNewNote({ ...newNote, imageUrl: null })} className="remove-img-btn"><X size={12} /></button>
                                    </div>
                                )}

                                <div className="form-group-proper">
                                    <label>TRICK CONTENT / NOTES</label>
                                    <textarea
                                        placeholder="Write your short trick, formula, or exception here..."
                                        value={newNote.content}
                                        onChange={e => setNewNote({ ...newNote, content: e.target.value })}
                                        rows={8}
                                        className="textarea-proper"
                                    />
                                </div>

                                <div className="form-btns-proper">
                                    <button type="button" className="cancel-btn-proper" onClick={() => setIsAdding(false)}>Cancel</button>
                                    <button type="submit" className="save-btn-proper">
                                        {editingId ? "Save Changes" : "Add to Vault"}
                                        <Zap size={18} />
                                    </button>
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
                                <span className={`subject-tag ${(viewingNote.subject || 'General').toLowerCase()}`}>{viewingNote.subject}</span>
                                <div className="modal-actions">
                                    <button onClick={() => { startEditing(viewingNote); setViewingNote(null); }}><Edit2 size={18} /></button>
                                    <button onClick={() => setViewingNote(null)}><X size={24} /></button>
                                </div>
                            </div>
                            <h2 className="read-title">{viewingNote.title}</h2>

                            {viewingNote.imageUrl && (
                                <div className="read-image-container">
                                    <img src={viewingNote.imageUrl} alt={viewingNote.title} className="read-image" />
                                </div>
                            )}

                            <div className="read-content">
                                {viewingNote.content.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                            </div>
                        </div>
                    </div>
                )}

                {/* REVISE MODAL (Flashcard Mode) */}
                {revisingNote && (
                    <div className="modal-overlay" onClick={() => setRevisingNote(null)}>
                        <div className="flashcard-container" onClick={e => e.stopPropagation()}>
                            <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
                                <div className="card-face front">
                                    <span className="card-label">QUESTION / TOPIC</span>
                                    <h3>{revisingNote.title}</h3>
                                    <p className="tap-hint">Tap to flip <RotateCcw size={14} /></p>
                                </div>
                                <div className="card-face back">
                                    <div className="flashcard-scroll-area">
                                        <span className="card-label" style={{ marginTop: '2rem' }}>ANSWER / NOTES</span>
                                        <div className="back-content">
                                            {revisingNote.imageUrl && (
                                                <div className="flashcard-image">
                                                    <img src={revisingNote.imageUrl} alt="Diagram" />
                                                </div>
                                            )}
                                            {revisingNote.content.split('\n').map((line, i) => <p key={i} style={{ marginBottom: '12px' }}>{line}</p>)}
                                        </div>
                                    </div>
                                    <p className="tap-hint">Tap to flip <RotateCcw size={14} /></p>
                                </div>
                            </div>
                            <button className="close-flashcard" onClick={() => setRevisingNote(null)}>Stop Revision</button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                    :global(:root) {
                        --primary: #4f46e5;
                        --primary-glow: rgba(79, 70, 229, 0.15);
                        --bg-page: #fafbfc;
                        --bg-card: #ffffff;
                        --border: #f1f5f9;
                        --text-main: #1e293b;
                        --text-muted: #64748b;
                        --text-light: #94a3b8;
                        --radius-lg: 24px;
                        --radius-md: 20px;
                        --radius-sm: 12px;
                        --shadow-soft: 0 4px 15px rgba(0,0,0,0.02);
                        --shadow-lift: 0 12px 35px rgba(79, 70, 229, 0.1);
                    }

                    .notes-page {
                        max-width: 1400px;
                        margin: 0 auto;
                        padding: 2rem;
                        background: var(--bg-page);
                        min-height: 100vh;
                        font-family: var(--font-inter, sans-serif);
                    }

                    /* Vault Header */
                    .vault-header {
                        background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
                        border-radius: var(--radius-lg);
                        padding: 4rem;
                        color: white;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 20px 50px -15px rgba(30, 27, 75, 0.4);
                        margin-bottom: 3rem;
                    }
                    .vault-icon-bg { position: absolute; right: 40px; top: 50%; transform: translateY(-50%) rotate(-10deg); opacity: 0.1; pointer-events: none; }
                    .vault-badge { 
                        display: inline-flex; align-items: center; gap: 8px; 
                        background: rgba(255, 255, 255, 0.12); padding: 8px 16px; 
                        border-radius: 99px; font-size: 0.75rem; font-weight: 900; 
                        margin-bottom: 1.5rem; border: 1px solid rgba(255, 255, 255, 0.1);
                        letter-spacing: 0.05em;
                    }
                    .vault-header h1 { font-size: 3.5rem; font-weight: 900; margin-bottom: 12px; letter-spacing: -0.04em; }
                    .vault-header p { color: rgba(255, 255, 255, 0.8); font-size: 1.15rem; line-height: 1.6; margin-bottom: 2.5rem; max-width: 600px; font-weight: 500; }
                    .header-actions { display: flex; gap: 16px; position: relative; z-index: 2; }

                    .btn-solid { 
                        background: white; color: #1e1b4b; padding: 14px 28px; border-radius: 16px; 
                        font-weight: 800; border: none; display: flex; align-items: center; gap: 10px; 
                        cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                    }
                    .btn-outline { 
                        background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255, 255, 255, 0.3); 
                        padding: 14px 28px; border-radius: 16px; font-weight: 700; display: flex; 
                        align-items: center; gap: 10px; cursor: pointer; transition: all 0.3s;
                        backdrop-filter: blur(10px);
                    }
                    .btn-solid:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 15px 30px rgba(0,0,0,0.2); }
                    .btn-outline:hover { background: rgba(255, 255, 255, 0.1); transform: translateY(-2px); }

                    /* Filter Bar Premium */
                    .filter-bar { 
                        display: flex; justify-content: space-between; align-items: center; 
                        gap: 2rem; margin-bottom: 3.5rem; background: rgba(255, 255, 255, 0.82); 
                        padding: 1rem 1.5rem; border-radius: 22px; 
                        border: 1px solid rgba(255, 255, 255, 0.6);
                        backdrop-filter: blur(20px);
                        box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
                        position: sticky; top: 1rem; z-index: 10;
                    }
                    .search-wrapper { flex: 1; position: relative; display: flex; align-items: center; max-width: 550px; }
                    .search-icon { position: absolute; left: 1.25rem; color: var(--text-light); pointer-events: none; }
                    .search-wrapper input { 
                        width: 100%; padding: 14px 20px 14px 3.5rem; border-radius: 16px; 
                        border: 1px solid var(--border); font-size: 1rem; outline: none; 
                        background: white; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
                        font-weight: 600; color: var(--text-main);
                    }
                    .search-wrapper input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-glow); width: 105%; }
                    .search-wrapper input::placeholder { color: var(--text-light); font-weight: 500; }

                    .filter-chips { display: flex; gap: 12px; align-items: center; }
                    .chip { 
                        background: white; border: 1px solid var(--border); padding: 10px 20px; 
                        border-radius: 14px; color: var(--text-muted); font-weight: 800; cursor: pointer; 
                        transition: all 0.3s; font-size: 0.75rem; text-transform: uppercase; 
                        letter-spacing: 0.08em; white-space: nowrap;
                    }
                    .chip:hover { border-color: var(--primary); color: var(--primary); transform: translateY(-2px); }
                    .chip.active { background: var(--primary); color: white; border-color: var(--primary); box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.4); }

                    /* Grid & Cards */
                    .notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 2rem; }
                    .note-card { 
                        background: white; border-radius: var(--radius-lg); padding: 1.75rem; 
                        box-shadow: var(--shadow-soft); border: 1px solid var(--border); 
                        display: flex; flex-direction: column; position: relative; height: 100%;
                        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .note-card:hover { transform: translateY(-8px) scale(1.01); box-shadow: var(--shadow-lift); border-color: var(--primary-glow); }
                    
                    .note-card.chemistry { border-left: 6px solid #f97316; }
                    .note-card.physics { border-left: 6px solid #3b82f6; }
                    .note-card.biology { border-left: 6px solid #10b981; }

                    .card-top { display: flex; justify-content: space-between; margin-bottom: 1.25rem; }
                    .meta { display: flex; gap: 12px; align-items: center; }
                    .subject { font-size: 0.7rem; font-weight: 950; letter-spacing: 0.1em; color: var(--text-light); }
                    .date { font-size: 0.75rem; font-weight: 600; color: var(--text-light); }

                    .pin-btn { background: transparent; border: none; cursor: pointer; color: var(--text-light); padding: 8px; border-radius: 12px; transition: all 0.3s; }
                    .pin-btn:hover { background: #f1f5f9; color: var(--text-muted); }
                    .pin-btn.active { color: var(--primary); background: var(--primary-glow); }

                    .pinned-badge { 
                        position: absolute; top: -12px; left: 24px; background: var(--primary); color: white; 
                        font-size: 0.65rem; font-weight: 950; padding: 6px 14px; border-radius: 10px; 
                        display: flex; align-items: center; gap: 6px; box-shadow: 0 5px 15px rgba(79, 70, 229, 0.3);
                        letter-spacing: 0.05em; border: 2px solid white;
                    }

                    .note-card h3 { margin: 0 0 1rem 0; font-size: 1.35rem; font-weight: 900; color: var(--text-main); line-height: 1.3; letter-spacing: -0.02em; }
                    .content-preview { font-size: 1rem; color: var(--text-muted); line-height: 1.6; flex: 1; margin-bottom: 1.5rem; font-weight: 500; }

                    .card-actions { display: flex; gap: 10px; padding-top: 1.25rem; border-top: 1px solid var(--border); align-items: center; }
                    .action-pill { 
                        background: #f8fafc; border: 1px solid var(--border); padding: 10px 16px; 
                        border-radius: 12px; font-size: 0.8rem; font-weight: 800; color: var(--text-muted); 
                        display: flex; align-items: center; gap: 6px; cursor: pointer; flex: 1; justify-content: center;
                        transition: all 0.2s;
                    }
                    .action-pill:hover { background: #f1f5f9; color: var(--text-main); border-color: var(--text-light); }
                    .action-pill.primary { background: var(--primary); color: white; border: none; }
                    .action-pill.primary:hover { background: #4338ca; transform: scale(1.05); }

                    .action-icon { width: 40px; height: 40px; border-radius: 12px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; background: white; color: var(--text-light); transition: all 0.2s; }
                    .action-icon:hover { background: #f1f5f9; color: var(--primary); border-color: var(--primary); }
                    .action-icon.delete:hover { background: #fef2f2; color: #ef4444; border-color: #fecdd3; }

                    .card-image-preview { width: 100%; height: 160px; border-radius: 16px; overflow: hidden; margin-bottom: 1.5rem; border: 1px solid var(--border); }
                    .card-image-preview img { width: 100%; height: 100%; object-fit: cover; }

                    /* Empty State Premium */
                    .empty-vault-state { 
                        grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; 
                        padding: 6rem 2rem; text-align: center; background: white; 
                        border-radius: 32px; border: 1px solid var(--border);
                        box-shadow: var(--shadow-soft); margin-top: 2rem;
                    }
                    .empty-illustration { position: relative; margin-bottom: 2.5rem; display: flex; justify-content: center; align-items: center; }
                    .illustration-blob { 
                        position: absolute; width: 160px; height: 160px; background: var(--primary-glow); 
                        border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; 
                        animation: morphBlob 10s ease-in-out infinite; z-index: 0; 
                    }
                    @keyframes morphBlob { 
                        0%, 100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; } 
                        50% { border-radius: 60% 40% 30% 70% / 50% 60% 40% 60%; } 
                    }
                    
                    .empty-vault-state h2 { font-size: 2.5rem; font-weight: 900; color: var(--text-main); margin-bottom: 12px; letter-spacing: -0.03em; z-index: 1; }
                    .empty-vault-state p { color: var(--text-muted); font-size: 1.15rem; max-width: 550px; margin-bottom: 3rem; line-height: 1.6; font-weight: 500; z-index: 1; }
                    
                    .empty-actions { display: flex; gap: 20px; align-items: center; z-index: 1; flex-wrap: wrap; justify-content: center; }
                    .btn-solid-premium { 
                        background: var(--primary); color: white; padding: 16px 36px; border-radius: 18px; 
                        border: none; font-weight: 800; display: flex; align-items: center; gap: 12px; 
                        cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
                        box-shadow: 0 10px 25px var(--primary-glow); 
                    }
                    .btn-solid-premium:hover { transform: translateY(-4px); box-shadow: 0 15px 35px var(--primary-glow); background: #4338ca; }
                    
                    .btn-outline-proper { 
                        background: #f8fafc; color: var(--text-main); padding: 16px 32px; border-radius: 18px; 
                        border: 1px solid var(--border); font-weight: 700; display: flex; 
                        align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s; 
                    }
                    .btn-outline-proper:hover { background: #f1f5f9; border-color: var(--text-light); transform: translateY(-2px); }

                    /* Responsive adjustments */
                    @media (max-width: 1024px) {
                        .notes-grid { grid-template-columns: repeat(2, 1fr); }
                        .vault-header { padding: 3rem; }
                        .vault-header h1 { font-size: 2.75rem; }
                    }

                    @media (max-width: 768px) {
                        .notes-page { padding: 1.25rem; }
                        .vault-header { padding: 2.5rem 1.5rem; margin-bottom: 2rem; border-radius: 20px; }
                        .vault-header h1 { font-size: 2.25rem; }
                        .vault-header p { font-size: 1rem; margin-bottom: 2rem; }
                        .header-actions { flex-direction: column; gap: 12px; }
                        .btn-solid, .btn-outline { width: 100%; justify-content: center; height: 52px; border-radius: 14px; }
                        
                        .filter-bar { flex-direction: column; gap: 1.25rem; padding: 1rem; margin-bottom: 2rem; }
                        .search-wrapper { width: 100%; min-width: unset; }
                        .filter-chips { width: 100%; padding-bottom: 4px; }
                        
                        .notes-grid { grid-template-columns: 1fr; gap: 1.5rem; }
                        .note-card { padding: 1.5rem; border-radius: 20px; }
                        .vault-icon-bg { right: -20px; opacity: 0.05; }
                    }

                    /* --- MODAL SYSTEM --- */
                    .modal-overlay { 
                        position: fixed; inset: 0; background: rgba(15, 23, 42, 0.82); 
                        backdrop-filter: blur(8px); display: flex; align-items: center; 
                        justify-content: center; z-index: 9999; padding: 1.5rem; 
                        animation: fadeIn 0.3s ease;
                    }
                    
                    /* Edit/New Note Form */
                    .note-form-card { 
                        background: white; width: 95%; max-width: 650px; padding: 2.5rem; 
                        border-radius: var(--radius-lg); box-shadow: 0 40px 100px -20px rgba(0,0,0,0.3); 
                        max-height: 92vh; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1);
                        animation: modalScaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                        position: relative; box-sizing: border-box;
                    }
                    .note-form-card.physics { border-top: 10px solid #3b82f6; }
                    .note-form-card.chemistry { border-top: 10px solid #f97316; }
                    .note-form-card.biology { border-top: 10px solid #10b981; }

                    .form-group-proper { display: flex; flex-direction: column; gap: 8px; margin-bottom: 1.5rem; }
                    .form-group-proper label { font-size: 0.7rem; font-weight: 950; color: var(--text-light); letter-spacing: 0.1em; }
                    
                    .input-title-proper { font-size: 1.75rem; padding: 0.5rem 0; border: none; border-bottom: 2px solid var(--border); outline: none; font-weight: 900; color: var(--text-main); width: 100%; background: transparent; transition: all 0.3s; }
                    .input-title-proper:focus { border-color: var(--primary); }

                    .form-row-proper { display: flex; gap: 1.5rem; flex-wrap: wrap; }
                    .select-proper { padding: 12px 16px; border-radius: 12px; border: 2px solid var(--border); width: 100%; font-weight: 800; color: var(--text-main); cursor: pointer; background: var(--bg-page); }
                    
                    .file-upload-trigger { display: flex; align-items: center; gap: 10px; padding: 12px 20px; background: var(--primary-glow); color: var(--primary); border-radius: 12px; cursor: pointer; font-weight: 800; font-size: 0.9rem; transition: all 0.2s; border: 1px dashed var(--primary); }
                    .file-upload-trigger:hover { background: rgba(79, 70, 229, 0.2); }

                    .image-preview-box { position: relative; width: 100%; height: 120px; border-radius: 12px; overflow: hidden; margin-bottom: 1.5rem; border: 1px solid var(--border); }
                    .image-preview-box img { width: 100%; height: 100%; object-fit: cover; }
                    
                    .textarea-proper { width: 100%; padding: 1.25rem; border-radius: var(--radius-sm); border: 2px solid var(--border); font-family: inherit; resize: vertical; font-size: 1rem; line-height: 1.6; font-weight: 500; outline: none; background: var(--bg-page); }
                    .textarea-proper:focus { border-color: var(--primary); background: white; }

                    .form-btns-proper { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
                    .save-btn-proper { background: var(--primary); color: white; padding: 14px 32px; border-radius: 14px; border: none; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: all 0.3s; }
                    .save-btn-proper:hover { transform: translateY(-3px); box-shadow: 0 10px 25px var(--primary-glow); background: #4338ca; }
                    .cancel-btn-proper { padding: 14px 24px; border-radius: 14px; border: none; font-weight: 700; color: var(--text-muted); cursor: pointer; background: #f1f5f9; }
                    
                    .close-btn-proper { background: #f8fafc; border: 1px solid var(--border); color: var(--text-light); width: 44px; height: 44px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                    .close-btn-proper:hover { color: #ef4444; background: #fef2f2; transform: rotate(90deg); }

                    /* REVISE/FLASHCARD MODAL */
                    .flashcard-container { perspective: 2000px; display: flex; flex-direction: column; align-items: center; gap: 2.5rem; width: 100%; max-width: 500px; }
                    .flashcard { 
                        width: 100%; height: 420px; position: relative; 
                        transform-style: preserve-3d; transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); 
                        cursor: pointer; will-change: transform;
                    }
                    .flashcard.flipped { transform: rotateY(180deg); }
                    .card-face { 
                        position: absolute; width: 100%; height: 100%; backface-visibility: hidden; 
                        border-radius: 32px; box-shadow: 0 40px 80px -15px rgba(0,0,0,0.3); 
                        display: flex; flex-direction: column; align-items: center; 
                        justify-content: center; padding: 3rem; text-align: center; border: 1px solid rgba(255,255,255,0.1);
                        transform: translateZ(1px); -webkit-font-smoothing: antialiased;
                    }
                    .card-face.front { background: white; color: var(--text-main); }
                    .card-face.back { background: var(--primary); color: white; transform: rotateY(180deg); }
                    .flashcard-scroll-area { width: 100%; height: 100%; overflow-y: auto; display: flex; flex-direction: column; align-items: center; gap: 1rem; scrollbar-width: none; padding-bottom: 2rem; }
                    .flashcard-scroll-area::-webkit-scrollbar { display: none; }
                    .card-label { font-size: 0.7rem; font-weight: 950; opacity: 0.6; margin-bottom: 1.5rem; letter-spacing: 0.15em; text-transform: uppercase; }
                    .card-face h3 { font-size: 2rem; font-weight: 900; margin: 0; line-height: 1.2; letter-spacing: -0.04em; }
                    .back-content { font-size: 1.1rem; font-weight: 500; line-height: 1.7; width: 100%; text-align: left; }
                    .tap-hint { position: absolute; bottom: 2rem; font-size: 0.8rem; font-weight: 700; opacity: 0.5; display: flex; align-items: center; gap: 8px; }
                    .close-flashcard { background: white; color: var(--text-main); border: none; padding: 14px 32px; border-radius: 99px; font-weight: 800; cursor: pointer; box-shadow: 0 10px 20px rgba(0,0,0,0.1); transition: all 0.2s; }
                    .close-flashcard:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(0,0,0,0.15); }

                    /* READ MODAL */
                    .read-modal-card { 
                        background: white; width: 95%; max-width: min(95vw, 800px); padding: 4rem; 
                        border-radius: var(--radius-lg); max-height: 90vh; overflow-y: auto; 
                        box-shadow: 0 40px 100px -20px rgba(0,0,0,0.3); position: relative;
                        animation: modalScaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                        box-sizing: border-box; overflow-x: hidden;
                        -webkit-font-smoothing: antialiased; backface-visibility: hidden;
                    }
                    .subject-tag { padding: 6px 16px; border-radius: 99px; font-size: 0.75rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.05em; }
                    .subject-tag.physics { background: #eff6ff; color: #3b82f6; }
                    .subject-tag.chemistry { background: #fff7ed; color: #f97316; }
                    .subject-tag.biology { background: #ecfdf5; color: #10b981; }
                    
                    .modal-actions { display: flex; gap: 16px; align-items: center; }
                    .modal-actions button { background: #f8fafc; border: 1px solid var(--border); padding: 10px; border-radius: 12px; color: var(--text-light); cursor: pointer; transition: all 0.2s; }
                    .modal-actions button:hover { color: var(--primary); border-color: var(--primary); transform: scale(1.1); }
                    
                    .read-title { font-size: 2.75rem; font-weight: 950; color: var(--text-main); margin: 1.5rem 0; line-height: 1.1; letter-spacing: -0.05em; }
                    .read-content { font-size: 1.15rem; color: var(--text-muted); line-height: 1.8; font-weight: 500; }
                    .read-content p { margin-bottom: 1.5rem; }

                    .read-image-container { 
                        width: 100%; height: auto; border-radius: var(--radius-md); 
                        overflow: hidden; margin-bottom: 2.5rem; background: #f8fafc; 
                        border: 1px solid var(--border); display: flex; justify-content: center;
                        align-items: center;
                    }
                    .read-image { max-width: 100%; max-height: 70vh; object-fit: contain; display: block; }

                    @media (max-width: 768px) {
                        .note-form-card, .read-modal-card { padding: 2rem 1.25rem; border-radius: 24px; }
                        .read-title { font-size: 1.85rem; margin: 1rem 0; }
                        .read-image-container { max-height: 350px; margin-bottom: 1.5rem; }
                        .flashcard-container { width: 95%; }
                        .flashcard { height: 380px; }
                    }

                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                `}</style>
        </AppShell>
    );
}

