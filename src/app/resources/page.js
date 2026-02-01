"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import {
    Plus,
    Trash2,
    FileText,
    Video,
    BookOpen,
    Link2,
    X,
    Image as ImageIcon,
    ExternalLink,
    Search,
    Filter,
} from "lucide-react";

const DEFAULT_RESOURCES = [
    {
        id: 1,
        title: "NCERT Physics Class 11",
        description: "Complete textbook with all chapters and exercises - Foundation for NEET Physics",
        link: "https://ncert.nic.in/textbook.php?keph1=0-16",
        subject: "Physics",
        type: "PDF",
    },
    {
        id: 2,
        title: "NCERT Chemistry Class 11",
        description: "Essential reading for NEET Chemistry preparation with detailed explanations",
        link: "https://ncert.nic.in/textbook.php?kech1=0-16",
        subject: "Chemistry",
        type: "PDF",
    },
    {
        id: 3,
        title: "NCERT Biology Class 11",
        description: "Most important book for NEET Biology - covers entire syllabus comprehensively",
        link: "https://ncert.nic.in/textbook.php?kebo1=0-22",
        subject: "Biology",
        type: "PDF",
    },
    {
        id: 4,
        title: "Modern Physics One Shot Revision",
        description: "Complete Modern Physics chapter explained in one comprehensive video lecture",
        link: "https://www.youtube.com/watch?v=example",
        subject: "Physics",
        type: "YouTube",
    },
    {
        id: 5,
        title: "Organic Chemistry Reactions",
        description: "All named reactions and mechanisms with detailed notes and examples",
        link: "https://example.com/organic-notes",
        subject: "Chemistry",
        type: "Notes",
    },
    {
        id: 6,
        title: "Human Anatomy Diagrams",
        description: "High-quality labeled diagrams for all body systems and organs",
        link: "https://example.com/anatomy-diagrams",
        subject: "Biology",
        type: "Diagram",
    },
];

export default function ResourcesPage() {
    const [resources, setResources] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [form, setForm] = useState({
        title: "",
        description: "",
        link: "",
        subject: "Physics",
        type: "PDF",
    });

    useEffect(() => {
        const saved = localStorage.getItem("neet_resources_master");
        if (!saved || JSON.parse(saved).length === 0) {
            setResources(DEFAULT_RESOURCES);
        } else {
            setResources(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        if (resources.length > 0) {
            localStorage.setItem("neet_resources_master", JSON.stringify(resources));
        }
    }, [resources]);

    const addResource = () => {
        if (!form.title.trim() || !form.link.trim()) {
            alert("Please fill in Title and Link");
            return;
        }
        const newResource = {
            id: Date.now(),
            ...form,
        };
        setResources([newResource, ...resources]);
        setShowModal(false);
        setForm({
            title: "",
            description: "",
            link: "",
            subject: "Physics",
            type: "PDF",
        });
    };

    const deleteResource = (id) => {
        if (confirm("Are you sure you want to delete this resource?")) {
            setResources(resources.filter((r) => r.id !== id));
        }
    };

    const filteredResources = resources.filter((resource) => {
        const matchesFilter = filter === "All" || resource.subject === filter;
        const matchesSearch =
            searchQuery === "" ||
            resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resource.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getIcon = (type) => {
        const iconProps = { size: 22, strokeWidth: 2 };
        switch (type) {
            case "PDF":
                return <FileText {...iconProps} className="resource-icon pdf" />;
            case "YouTube":
                return <Video {...iconProps} className="resource-icon youtube" />;
            case "Notes":
                return <BookOpen {...iconProps} className="resource-icon notes" />;
            case "Diagram":
                return <ImageIcon {...iconProps} className="resource-icon diagram" />;
            default:
                return <Link2 {...iconProps} className="resource-icon link" />;
        }
    };

    const getSubjectColor = (subject) => {
        switch (subject) {
            case "Physics":
                return "#3B82F6";
            case "Chemistry":
                return "#10B981";
            case "Biology":
                return "#F59E0B";
            default:
                return "#64748B";
        }
    };

    const subjectCounts = {
        All: resources.length,
        Physics: resources.filter((r) => r.subject === "Physics").length,
        Chemistry: resources.filter((r) => r.subject === "Chemistry").length,
        Biology: resources.filter((r) => r.subject === "Biology").length,
    };

    return (
        <AppShell>
            <div className="resources-page">
                {/* Header Section */}
                <div className="page-header">
                    <div className="header-left">
                        <h1 className="page-title">NEET Resources Library</h1>
                        <p className="page-description">
                            Curated study materials for your NEET preparation journey
                        </p>
                    </div>
                    <button className="btn-add" onClick={() => setShowModal(true)}>
                        <Plus size={20} strokeWidth={2.5} />
                        <span>Add Resource</span>
                    </button>
                </div>

                {/* Search & Filter Bar */}
                <div className="controls-section">
                    <div className="search-box">

                        <input
                            type="text"
                            placeholder="Search resources..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="filter-section">
                        {["All", "Physics", "Chemistry", "Biology"].map((subject) => (
                            <button
                                key={subject}
                                onClick={() => setFilter(subject)}
                                className={`filter-chip ${filter === subject ? "active" : ""}`}
                                style={
                                    filter === subject
                                        ? {
                                            backgroundColor: getSubjectColor(subject),
                                            borderColor: getSubjectColor(subject),
                                        }
                                        : {}
                                }
                            >
                                <span className="chip-label">{subject}</span>
                                <span className="chip-count">{subjectCounts[subject]}</span>
                            </button>
                        ))}
                    </div>
                </div>
                {/* Results Count */}
                <div className="results-info">
                    <p>
                        Showing <strong>{filteredResources.length}</strong> resource
                        {filteredResources.length !== 1 ? "s" : ""}
                    </p>
                </div>

                {/* Resources Grid */}
                {filteredResources.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <BookOpen size={56} strokeWidth={1.5} />
                        </div>
                        <h3 className="empty-title">No resources found</h3>
                        <p className="empty-text">
                            {searchQuery
                                ? "Try adjusting your search or filters"
                                : "Add your first resource to get started"}
                        </p>
                        {!searchQuery && (
                            <button
                                className="btn-add-empty"
                                onClick={() => setShowModal(true)}
                            >
                                <Plus size={18} />
                                Add Your First Resource
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="resources-grid">
                        {filteredResources.map((resource) => (
                            <div key={resource.id} className="resource-card">
                                <div className="card-header">
                                    <div className="card-icon-wrapper">{getIcon(resource.type)}</div>
                                    <div className="card-actions">
                                        <button
                                            className="action-btn delete"
                                            onClick={() => deleteResource(resource.id)}
                                            title="Delete resource"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="card-content">
                                    <h3 className="card-title">{resource.title}</h3>
                                    <p className="card-description">{resource.description}</p>
                                </div>

                                <div className="card-footer">
                                    <div className="card-meta">
                                        <span
                                            className="subject-tag"
                                            style={{
                                                backgroundColor: `${getSubjectColor(resource.subject)}15`,
                                                color: getSubjectColor(resource.subject),
                                                borderColor: `${getSubjectColor(resource.subject)}30`,
                                            }}
                                        >
                                            {resource.subject}
                                        </span>
                                        <span className="type-label">{resource.type}</span>
                                    </div>

                                    <a href={resource.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-open"
                                    >
                                        <span>Open</span>
                                        <ExternalLink size={16} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {/* Add Resource Modal */}
                {showModal && (
                    <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <h2 className="modal-title">Add New Resource</h2>
                                    <p className="modal-subtitle">
                                        Add a helpful resource to your library
                                    </p>
                                </div>
                                <button className="modal-close" onClick={() => setShowModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="form-field">
                                    <label className="form-label" htmlFor="title">
                                        Title <span className="required">*</span>
                                    </label>
                                    <input
                                        id="title"
                                        type="text"
                                        placeholder="e.g., NCERT Physics Class 12"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="form-label" htmlFor="description">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        placeholder="Brief description of the resource..."
                                        value={form.description}
                                        onChange={(e) =>
                                            setForm({ ...form, description: e.target.value })
                                        }
                                        className="form-textarea"
                                        rows={3}
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="form-label" htmlFor="link">
                                        Link <span className="required">*</span>
                                    </label>
                                    <input
                                        id="link"
                                        type="url"
                                        placeholder="https://example.com/resource"
                                        value={form.link}
                                        onChange={(e) => setForm({ ...form, link: e.target.value })}
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-field">
                                        <label className="form-label" htmlFor="subject">
                                            Subject
                                        </label>
                                        <select
                                            id="subject"
                                            value={form.subject}
                                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                            className="form-select"
                                        >
                                            <option value="Physics">Physics</option>
                                            <option value="Chemistry">Chemistry</option>
                                            <option value="Biology">Biology</option>
                                        </select>
                                    </div>

                                    <div className="form-field">
                                        <label className="form-label" htmlFor="type">
                                            Type
                                        </label>
                                        <select
                                            id="type"
                                            value={form.type}
                                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                                            className="form-select"
                                        >
                                            <option value="PDF">PDF Document</option>
                                            <option value="YouTube">YouTube Video</option>
                                            <option value="Notes">Notes</option>
                                            <option value="Diagram">Diagram/Image</option>
                                            <option value="Website">Website</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button
                                        className="btn-cancel"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button className="btn-submit" onClick={addResource}>
                                        <Plus size={18} />
                                        Add Resource
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <style jsx>{`
          .resources-page {
            min-height: 100vh;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 40px 32px;
            max-width: 1440px;
            margin: 0 auto;
          }

          /* Header */
          .page-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            gap: 24px;
          }

          .header-left {
            flex: 1;
          }

          .page-title {
            font-size: 36px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 8px 0;
            letter-spacing: -0.5px;
          }

          .page-description {
            font-size: 16px;
            color: #64748b;
            margin: 0;
            font-weight: 500;
          }

          .btn-add {
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            color: white;
            border: none;
            padding: 14px 28px;
            border-radius: 14px;
            font-size: 15px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 16px rgba(79, 70, 229, 0.25),
              0 2px 8px rgba(79, 70, 229, 0.15);
          }

          .btn-add:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(79, 70, 229, 0.35),
              0 4px 12px rgba(79, 70, 229, 0.2);
          }

          .btn-add:active {
            transform: translateY(0);
          }
.controls-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  border: 1px solid #e2e8f0;
}

.search-box {
  position: relative;
  margin-bottom: 20px;
  width: 100%;
  height: fit-content;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 16px;
  color: #94a3b8;
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  height: 52px;
  padding-left: 48px;
  padding-right: 20px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 15px;
  color: #0f172a;
  background: #f8fafc;
  box-sizing: border-box;
}
.search-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
}

.search-input::placeholder {
  color: #94a3b8;
}

.filter-section {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

          .filter-chip {
            padding: 10px 18px;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
            background: white;
            color: #64748b;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .filter-chip:hover {
            border-color: #cbd5e1;
            background: #f8fafc;
          }

          .filter-chip.active {
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .chip-label {
            font-size: 14px;
          }

          .chip-count {
            background: rgba(255, 255, 255, 0.25);
            padding: 3px 8px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 800;
          }

          .filter-chip:not(.active) .chip-count {
            background: #f1f5f9;
            color: #64748b;
          }

          /* Results Info */
          .results-info {
            margin-bottom: 20px;
          }

          .results-info p {
            color: #64748b;
            font-size: 14px;
            margin: 0;
            font-weight: 500;
          }

          .results-info strong {
            color: #0f172a;
            font-weight: 700;
          }

          /* Resources Grid */
          .resources-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
            gap: 24px;
          }

          .resource-card {
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
            border: 1px solid #e2e8f0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
            gap: 16px;
            position: relative;
            overflow: hidden;
          }

          .resource-card::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #4f46e5, #7c3aed);
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          .resource-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
            border-color: #cbd5e1;
          }

          .resource-card:hover::before {
            opacity: 1;
          }

          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }

          .card-icon-wrapper {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border: 1px solid #e2e8f0;
          }

          :global(.resource-icon.pdf) {
            color: #ef4444;
          }
          :global(.resource-icon.youtube) {
            color: #dc2626;
          }
          :global(.resource-icon.notes) {
            color: #10b981;
          }
          :global(.resource-icon.diagram) {
            color: #f59e0b;
          }
          :global(.resource-icon.link) {
            color: #3b82f6;
          }

          .card-actions {
            display: flex;
            gap: 6px;
          }

          .action-btn {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            border: none;
            background: transparent;
            color: #94a3b8;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .action-btn.delete:hover {
            background: #fef2f2;
            color: #dc2626;
          }

          .card-content {
            flex: 1;
          }

          .card-title {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 8px 0;
            line-height: 1.4;
          }

          .card-description {
            color: #64748b;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
          }

          .card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding-top: 16px;
            border-top: 1px solid #f1f5f9;
          }

          .card-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .subject-tag {
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 700;
            border: 1px solid;
          }

          .type-label {
            color: #94a3b8;
            font-size: 12px;
            font-weight: 600;
          }

          .btn-open {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            background: #4f46e5;
            color: white;
            text-decoration: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 700;
            transition: all 0.2s ease;
          }

          .btn-open:hover {
            background: #4338ca;
            transform: translateX(2px);
          }

          /* Empty State */
          .empty-state {
            text-align: center;
            padding: 80px 24px;
            background: white;
            border-radius: 16px;
            border: 2px dashed #e2e8f0;
          }

          .empty-icon {
            display: inline-flex;
            padding: 20px;
            background: #f8fafc;
            border-radius: 20px;
            color: #94a3b8;
            margin-bottom: 20px;
          }

          .empty-title {
            font-size: 22px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 8px 0;
          }

          .empty-text {
            font-size: 15px;
            color: #64748b;
            margin: 0 0 24px 0;
          }

          .btn-add-empty {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            background: #4f46e5;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .btn-add-empty:hover {
            background: #4338ca;
            transform: translateY(-2px);
          }

          /* Modal */
          .modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
            animation: fadeIn 0.2s ease;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          .modal-container {
            background: white;
            border-radius: 20px;
            width: 100%;
            max-width: 580px;
            box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
            max-height: 90vh;
            overflow-y: auto;
            animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          @keyframes slideUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 28px 28px 20px 28px;
            border-bottom: 1px solid #e2e8f0;
          }

          .modal-title {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 4px 0;
          }

          .modal-subtitle {
            font-size: 14px;
            color: #64748b;
            margin: 0;
          }

          .modal-close {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            border: none;
            background: #f8fafc;
            color: #64748b;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .modal-close:hover {
            background: #f1f5f9;
            color: #0f172a;
          }

          .modal-body {
            padding: 28px;
          }

          .form-field {
            margin-bottom: 20px;
          }

          .form-label {
            display: block;
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 8px;
          }

          .required {
            color: #ef4444;
          }

          .form-input,
          .form-textarea,
          .form-select {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 15px;
            color: #0f172a;
            transition: all 0.2s ease;
            box-sizing: border-box;
            font-family: inherit;
          }

          .form-textarea {
            resize: vertical;
            min-height: 80px;
          }

          .form-input:focus,
          .form-textarea:focus,
          .form-select:focus {
            outline: none;
            border-color: #4f46e5;
            box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
          }

          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }

          .modal-actions {
            display: flex;
            gap: 12px;
            margin-top: 28px;
          }

          .btn-cancel {
            flex: 1;
            padding: 14px;
            background: #f8fafc;
            color: #64748b;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .btn-cancel:hover {
            background: #f1f5f9;
            color: #0f172a;
          }

          .btn-submit {
            flex: 1;
            padding: 14px;
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
          }

          /* Responsive */
          @media (max-width: 768px) {
            .resources-page {
              padding: 24px 16px;
            }

            .page-title {
              font-size: 28px;
            }

            .page-header {
              flex-direction: column;
            }

            .btn-add {
              width: 100%;
              justify-content: center;
            }

            .resources-grid {
              grid-template-columns: 1fr;
            }

            .form-row {
              grid-template-columns: 1fr;
            }

            .modal-container {
              max-width: 100%;
              border-radius: 16px 16px 0 0;
              max-height: 95vh;
            }
          }

          @media (min-width: 769px) and (max-width: 1024px) {
            .resources-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
        `}</style>
            </div>
        </AppShell>
    );
} 