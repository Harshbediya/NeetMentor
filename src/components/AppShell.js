"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, BookOpen, Clock, FileText,
    BarChart2, Calendar, Database, Menu, X, Zap, StickyNote, LogOut, Sun, Moon, User
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Study Journal', href: '/study-log', icon: StickyNote },
    { label: 'Topics', href: '/topics', icon: BookOpen },
    { label: 'Syllabus', href: '/syllabus', icon: FileText },
    { label: 'Resources', href: '/resources', icon: Database },
    { label: 'My Notes', href: '/notes', icon: FileText },
    { label: 'PYQs', href: '/pyqs', icon: FileText },
    { label: 'Mock Tests', href: '/tests', icon: BarChart2 },
    { label: 'Study Plan', href: '/plan', icon: Calendar },
    { label: 'Focus Timer', href: '/timer', icon: Clock },
    { label: 'My Profile', href: '/profile', icon: User },
];

export default function AppShell({ children, rightPanel }) {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [theme, setTheme] = useState("light");

    useEffect(() => {
        const savedTheme = localStorage.getItem("neet-theme") ||
            (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("neet-theme", newTheme);
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/");
            router.refresh();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <div className="app-shell-wrapper">
            {/* Sidebar (Desktop) */}
            <aside className="sidebar-desktop">
                <Link href="/" className="sidebar-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ padding: '8px', background: 'var(--color-primary)', borderRadius: '12px', color: 'white' }}>
                        <Zap size={22} fill="white" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>NEETMentor</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Target 2026</span>
                    </div>
                </Link>

                <nav className="sidebar-nav">
                    <ul>
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`nav-link ${isActive ? 'active' : ''}`}
                                    >
                                        <item.icon size={20} weight={isActive ? "bold" : "regular"} />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="sidebar-actions">
                    <button onClick={handleLogout} className="nav-link logout-btn" style={{ marginTop: 'auto', marginBottom: '16px' }}>
                        <LogOut size={20} />
                        Logout
                    </button>

                    <div className="sidebar-footer">
                        <p className="footer-title">STUDY TIP</p>
                        <p className="footer-text">Don't break your streak today.</p>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="mobile-header">
                <Link href="/" className="mobile-brand" style={{ textDecoration: 'none' }}>
                    <Zap size={24} fill="var(--color-primary)" /> NEETMentor
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={toggleTheme} className="theme-toggle-btn">
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="mobile-menu-btn">
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="mobile-menu-overlay">
                    <nav>
                        <ul>
                            {NAV_ITEMS.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`mobile-nav-link ${pathname === item.href ? 'active' : ''}`}
                                    >
                                        <item.icon size={24} />
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <button onClick={handleLogout} className="mobile-nav-link logout-btn">
                                    <LogOut size={24} />
                                    Logout
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}

            {/* Main Content Area */}
            <main className="main-content">
                {children}
            </main>

            {/* Right Panel (Desktop Only) */}
            {rightPanel && (
                <aside className="right-panel">
                    {rightPanel}
                </aside>
            )}

            <style jsx global>{`
                .app-shell-wrapper {
                    display: grid;
                    grid-template-columns: 260px 1fr ${rightPanel ? '380px' : '0px'};
                    min-height: 100vh;
                    background: var(--color-background);
                }

                /* Left Sidebar */
                .sidebar-desktop {
                    background: var(--color-surface);
                    border-right: 1px solid var(--color-border);
                    padding: 32px 16px;
                    display: flex;
                    flex-direction: column;
                    position: sticky;
                    top: 0;
                    height: 100vh;
                    overflow-y: auto;
                    z-index: 100;
                }

                .sidebar-brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 0 12px;
                    margin-bottom: 40px;
                }

                .sidebar-nav {
                    flex: 1;
                }

                .sidebar-nav ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .sidebar-nav li {
                    margin-bottom: 4px;
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-radius: 14px;
                    color: var(--color-text-muted);
                    background: transparent;
                    font-weight: 600;
                    font-size: 0.95rem;
                    transition: all var(--transition-normal);
                }

                .nav-link:hover {
                    background: var(--color-primary-light);
                    color: var(--color-primary);
                    transform: translateX(4px);
                }

                .nav-link.active {
                    background: var(--color-primary);
                    color: white;
                    box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.4);
                }

                .logout-btn {
                    width: 100%;
                    border: none;
                    cursor: pointer;
                    text-align: left;
                    font-family: inherit;
                }

                .logout-btn:hover {
                    background: #FFF1F2 !important;
                    color: #E11D48 !important;
                }

                .sidebar-footer {
                    padding: 20px;
                    background: linear-gradient(135deg, var(--color-primary-light) 0%, #FFFFFF 100%);
                    border-radius: 20px;
                    border: 1px solid var(--color-border);
                }

                .footer-title {
                    font-size: 0.7rem;
                    color: var(--color-primary);
                    font-weight: 800;
                    letter-spacing: 0.1em;
                    margin-bottom: 8px;
                }

                .footer-text {
                    font-size: 0.85rem;
                    color: var(--color-text-main);
                    font-weight: 600;
                    margin: 0;
                }

                /* Main Content */
                .main-content {
                    padding: 24px;
                    overflow-y: auto;
                    max-width: 100%;
                }

                /* Right Panel */
                .right-panel {
                    background: white;
                    border-left: 1px solid #e2e8f0;
                    padding: 24px;
                    position: sticky;
                    top: 0;
                    height: 100vh;
                    overflow-y: auto;
                }

                /* Mobile Header */
                .mobile-header {
                    display: none;
                }

                .mobile-menu-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--color-text-main);
                }

                /* Tablet: Stack right panel below main content */
                @media (max-width: 1200px) {
                    .app-shell-wrapper {
                        grid-template-columns: 250px 1fr;
                    }

                    .right-panel {
                        display: none;
                    }
                }

                /* Mobile: Hide sidebar, show hamburger menu */
                @media (max-width: 900px) {
                    .app-shell-wrapper {
                        grid-template-columns: 1fr;
                    }

                    .sidebar-desktop {
                        display: none;
                    }

                    .mobile-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 16px;
                        background: white;
                        border-bottom: 1px solid #e2e8f0;
                        position: sticky;
                        top: 0;
                        z-index: 90;
                    }

                    .mobile-brand {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        color: var(--color-primary);
                        font-weight: 700;
                        font-size: 1.25rem;
                    }

                    .mobile-menu-overlay {
                        position: fixed;
                        top: 64px;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: white;
                        z-index: 80;
                        padding: 24px;
                        overflow-y: auto;
                    }

                    .mobile-menu-overlay ul {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }

                    .mobile-menu-overlay li {
                        margin-bottom: 12px;
                    }

                    .mobile-nav-link {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                        padding: 16px;
                        border-radius: 8px;
                        background: transparent;
                        color: var(--color-text-muted);
                        font-weight: 600;
                        font-size: 1.1rem;
                    }

                    .mobile-nav-link.active {
                        background: var(--color-primary-light);
                        color: var(--color-primary);
                    }

                    .main-content {
                        padding: 20px;
                    }
                }

                @media (max-width: 640px) {
                    .main-content {
                        padding: 16px;
                    }
                }
            `}</style>
        </div>
    );
}
