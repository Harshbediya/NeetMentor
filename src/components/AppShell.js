"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, BookOpen, Clock, FileText,
    BarChart2, Calendar, Database, Menu, X, Zap, StickyNote, LogOut, Sun, Moon, User,
    TrendingUp
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTimer } from "@/context/TimerContext";
import { useTheme } from "@/context/ThemeContext";

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Analytics', href: '/analytics', icon: TrendingUp },
    { label: 'Study Journal', href: '/study-log', icon: StickyNote },
    { label: 'Topics', href: '/topics', icon: BookOpen },
    { label: 'Syllabus', href: '/syllabus', icon: FileText },
    { label: 'Resources', href: '/resources', icon: Database },
    { label: 'My Notes', href: '/notes', icon: FileText },
    { label: 'PYQs', href: '/pyqs', icon: FileText },
    { label: 'Mock Tests', href: '/tests', icon: BarChart2 },
    { label: 'Study Plan', href: '/plan', icon: Calendar },
    { label: 'Daily History', href: '/history', icon: Clock },
    { label: 'Focus Timer', href: '/timer', icon: Clock },
    { label: 'My Profile', href: '/profile', icon: User },
];

function TimerIndicator() {
    const { isActive, seconds, mode, selectedSubject } = useTimer();

    if (!isActive) return null;

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="global-timer-indicator">
            <div className="pulse-dot"></div>
            <div className="timer-info">
                <span className="mode-label">{mode}</span>
                <span className="time-val">{formatTime(seconds)}</span>
            </div>
            <style jsx>{`
                .global-timer-indicator {
                    background: #1e293b;
                    color: white;
                    padding: 12px 16px;
                    border-radius: 16px;
                    margin: 12px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .pulse-dot {
                    width: 8px;
                    height: 8px;
                    background: #10b981;
                    border-radius: 50%;
                    animation: pulse 1.5s infinite;
                }
                .timer-info { display: flex; flex-direction: column; }
                .mode-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; }
                .time-val { font-size: 1.1rem; font-weight: 800; font-variant-numeric: tabular-nums; }
                @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
}

import { removeCookie } from "@/lib/api";

export default function AppShell({ children, rightPanel }) {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const { theme, toggleTheme } = useTheme();

    const handleLogout = () => {
        removeCookie('token');
        removeCookie('refresh_token');
        router.push("/login");
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
                    <TimerIndicator />


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

            {/* Mobile Header (Glassmorphism) */}
            <div className={`mobile-header ${mobileMenuOpen ? 'menu-open' : ''}`}>
                <Link href="/" className="mobile-brand">
                    <div className="brand-icon-wrapper">
                        <Zap size={20} fill="white" />
                    </div>
                    <span className="brand-text">NEETMentor</span>
                </Link>
                <div className="mobile-header-actions">
                    <button onClick={toggleTheme} className="theme-toggle-btn">
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    </button>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className={`mobile-menu-btn ${mobileMenuOpen ? 'active' : ''}`}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay (Premium Drawer) */}
            {mobileMenuOpen && (
                <div className="mobile-menu-overlay">
                    <div className="menu-drawer-header">
                        <p className="menu-subtitle">TARGET: NEET 2026</p>
                        <h2 className="menu-title">Main Navigation</h2>
                    </div>
                    <nav className="mobile-nav">
                        <ul>
                            {NAV_ITEMS.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                                        >
                                            <div className={`icon-container ${isActive ? 'active' : ''}`}>
                                                <item.icon size={20} />
                                            </div>
                                            <span className="label-container">
                                                <span className="label-text">{item.label}</span>
                                                {isActive && <div className="active-pill"></div>}
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                            <li style={{ marginTop: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                                <button onClick={handleLogout} className="mobile-nav-link logout-btn">
                                    <div className="icon-container" style={{ background: '#FFF1F2', color: '#E11D48' }}>
                                        <LogOut size={20} />
                                    </div>
                                    <span className="label-text">Logout</span>
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}


            {/* Main Content Area */}
            <main className="main-content">
                {rightPanel && (
                    <div className="mobile-right-panel">
                        {rightPanel}
                    </div>
                )}
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
                    position: relative;
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

                .mobile-right-panel {
                    display: none;
                    margin-bottom: 24px;
                }

                /* Tablet: Stack right panel below main content */
                @media (max-width: 1200px) {
                    .app-shell-wrapper {
                        grid-template-columns: 250px 1fr;
                    }

                    .right-panel {
                        display: none;
                    }

                    .mobile-right-panel {
                        display: block;
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

                /* Mobile Header (Premium Glass) */
                .mobile-header {
                    display: none;
                }

                @media (max-width: 900px) {
                    .mobile-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px 20px;
                        background: var(--glass-bg);
                        backdrop-filter: var(--glass-blur);
                        -webkit-backdrop-filter: var(--glass-blur);
                        border-bottom: 1px solid var(--glass-border);
                        position: sticky;
                        top: 0;
                        z-index: 1000;
                        transition: all var(--transition-normal);
                    }

                    .mobile-header.menu-open {
                        background: var(--color-surface);
                        backdrop-filter: none;
                    }

                    .mobile-brand {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        text-decoration: none;
                    }

                    .brand-icon-wrapper {
                        background: var(--color-primary);
                        padding: 6px;
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);
                    }

                    .brand-text {
                        font-weight: 800;
                        font-size: 1.15rem;
                        color: var(--color-text-main);
                        letter-spacing: -0.02em;
                    }

                    .mobile-header-actions {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }

                    .theme-toggle-btn {
                        background: var(--color-primary-light);
                        color: var(--color-primary);
                        border: none;
                        width: 36px;
                        height: 36px;
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .mobile-menu-btn {
                        background: var(--color-text-main);
                        color: white;
                        border: none;
                        width: 36px;
                        height: 36px;
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all var(--transition-fast);
                    }

                    .mobile-menu-btn.active {
                        background: #F1F5F9;
                        color: #64748B;
                    }

                    /* Mobile Menu Interior */
                    .mobile-menu-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: var(--color-surface);
                        z-index: 999;
                        padding: 80px 24px 24px;
                        overflow-y: auto;
                        animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }

                    .menu-drawer-header {
                        margin-bottom: 24px;
                        padding-left: 8px;
                    }

                    .menu-subtitle {
                        font-size: 0.7rem;
                        font-weight: 800;
                        color: var(--color-primary);
                        letter-spacing: 0.1em;
                        margin-bottom: 4px;
                    }

                    .menu-title {
                        font-size: 1.5rem;
                        font-weight: 800;
                        margin: 0;
                    }

                    .mobile-nav ul {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }

                    .mobile-nav-link {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                        padding: 12px 8px;
                        border-radius: 14px;
                        color: var(--color-text-muted);
                        font-weight: 600;
                        font-size: 1.05rem;
                        transition: all 0.2s;
                        margin-bottom: 4px;
                    }

                    .icon-container {
                        width: 40px;
                        height: 40px;
                        background: #F8FAFC;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #64748B;
                        transition: all 0.2s;
                    }

                    .mobile-nav-link.active {
                        color: var(--color-text-main);
                        background: var(--color-primary-light);
                    }

                    .mobile-nav-link.active .icon-container {
                        background: var(--color-primary);
                        color: white;
                        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
                    }

                    .label-container {
                        flex: 1;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    }

                    .active-pill {
                        width: 6px;
                        height: 6px;
                        background: var(--color-primary);
                        border-radius: 50%;
                    }

                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                }

                @media (max-width: 640px) {
                    .main-content {
                        padding: 16px;
                    }
                    .mobile-header {
                        padding: 10px 16px;
                    }
                }
            `}</style>
        </div>
    );
}
