"use client";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { User, Mail, Shield, LogOut, Loader2, Award, Zap, BookOpen, Target, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import api, { getCookie, removeCookie } from "@/lib/api";
import { loadProgress, loadData } from "@/lib/progress";

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [stats, setStats] = useState({
        streak: 0,
        solved: 0,
        accuracy: 0
    });

    const updateProfile = async () => {
        try {
            await api.patch("/user-profile/", { first_name: editName });
            setUser({ ...user, first_name: editName });
            setIsEditing(false);
        } catch (err) {
            alert("Failed to update profile");
        }
    };
    const router = useRouter();

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        const token = getCookie('token');
        if (!token) {
            router.push("/login");
            return;
        }

        try {
            const res = await api.get("/user-profile/");
            setUser(res.data);

            // Fetch real progress stats
            const progress = await loadProgress();
            const solvedData = await loadData('solved_stats', { count: 0, accuracy: 0 });

            setStats({
                streak: progress?.streak?.streak || 0,
                solved: solvedData.count || 0,
                accuracy: solvedData.accuracy || 0
            });
        } catch (err) {
            console.error("Profile fetch failed", err);
            if (err.response?.status === 401) {
                removeCookie('token');
                router.push("/login");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        removeCookie('token');
        removeCookie('refresh_token');
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <Loader2 className="animate-spin" size={40} color="#6366F1" />
            </div>
        );
    }

    return (
        <AppShell>
            <div className="profile-container">
                <div className="profile-hero">
                    <div className="profile-header-card">
                        <div className="avatar-section">
                            <div className="avatar-wrapper">
                                {user?.first_name?.charAt(0) || user?.username?.charAt(0) || "U"}
                                <div className="status-indicator"></div>
                            </div>
                            <div className="header-text">
                                <h1>{user?.first_name || user?.username}</h1>
                                <div className="badge-row">
                                    <span className="premium-badge"><Award size={12} /> Pro Aspirant</span>
                                    <span className="id-pill">ID: #{String(user?.id || '').slice(0, 5)}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="logout-btn-top">
                            <LogOut size={16} /> Logout
                        </button>
                    </div>

                    <div className="stats-mini-grid">
                        <div className="stat-pill-card">
                            <div className="icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}><Zap size={18} /></div>
                            <div className="txt">
                                <span className="val">{stats.streak} Days</span>
                                <span className="lbl">Highest Streak</span>
                            </div>
                        </div>
                        <div className="stat-pill-card">
                            <div className="icon" style={{ background: '#ECFDF5', color: '#10B981' }}><BookOpen size={18} /></div>
                            <div className="txt">
                                <span className="val">{stats.solved.toLocaleString()}</span>
                                <span className="lbl">Solved MCQs</span>
                            </div>
                        </div>
                        <div className="stat-pill-card">
                            <div className="icon" style={{ background: '#FFF7ED', color: '#F59E0B' }}><Target size={18} /></div>
                            <div className="txt">
                                <span className="val">{stats.accuracy}%</span>
                                <span className="lbl">Accuracy</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-content-grid">
                    <div className="info-card main-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Personal Details</h3>
                            {isEditing ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="save-btn" onClick={updateProfile}>Save</button>
                                    <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                                </div>
                            ) : (
                                <button className="edit-btn" onClick={() => {
                                    setEditName(user?.first_name || "");
                                    setIsEditing(true);
                                }}>Edit</button>
                            )}
                        </div>
                        <div className="details-list">
                            <div className="detail-item">
                                <div className="detail-label"><User size={14} /> Full Name</div>
                                {isEditing ? (
                                    <input
                                        className="edit-input"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        autoFocus
                                    />
                                ) : (
                                    <div className="detail-value">{user?.first_name || user?.username || 'NEET Aspirant'}</div>
                                )}
                            </div>
                            <div className="detail-item">
                                <div className="detail-label"><Mail size={14} /> Email Address</div>
                                <div className="detail-value">{user?.email}</div>
                            </div>
                            <div className="detail-item">
                                <div className="detail-label"><Calendar size={14} /> Member Since</div>
                                <div className="detail-value">
                                    {user?.date_joined
                                        ? new Date(user.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                        : 'February 2026'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="info-card status-info">
                        <h3>Account Security</h3>
                        <div className="details-list">
                            <div className="detail-item">
                                <div className="detail-label"><Shield size={14} /> Auth Status</div>
                                <div className="status-tag success">Verified Account</div>
                            </div>
                            <div className="detail-item">
                                <div className="detail-label"><Zap size={14} /> Subscription</div>
                                <div className="status-tag premium">{user?.subscription || 'Pro'} Plan Active</div>
                            </div>
                        </div>
                        <div className="security-notice">
                            <p>All your data is encrypted and synced with your NEETMentor account across devices.</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .loading-screen {
                    height: 100vh; display: flex; align-items: center; justify-content: center;
                }

                .profile-container {
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                .profile-header-card {
                    background: white;
                    border-radius: 28px;
                    padding: 32px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border: 1px solid var(--color-border);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                    margin-bottom: 24px;
                }

                .edit-btn {
                    padding: 6px 16px; border-radius: 99px; border: 1px solid #E2E8F0;
                    background: white; color: #64748B; font-weight: 600; font-size: 0.85rem;
                    cursor: pointer; transition: all 0.2s;
                }
                .edit-btn:hover { background: #F8FAFC; border-color: #CBD5E1; color: #1E293B; }

                .save-btn {
                    padding: 6px 16px; border-radius: 99px; border: none;
                    background: #4F46E5; color: white; font-weight: 600; font-size: 0.85rem;
                    cursor: pointer; transition: all 0.2s;
                }
                .save-btn:hover { background: #4338CA; transform: translateY(-1px); }

                .cancel-btn {
                    padding: 6px 16px; border-radius: 99px; border: 1px solid #E2E8F0;
                    background: #F1F5F9; color: #64748B; font-weight: 600; font-size: 0.85rem;
                    cursor: pointer; transition: all 0.2s;
                }
                .cancel-btn:hover { background: #E2E8F0; }

                .edit-input {
                    padding: 12px 16px; border-radius: 12px; border: 2px solid #4F46E5;
                    font-size: 1rem; color: #1E293B; font-weight: 600; outline: none;
                    width: 100%; max-width: 300px; background: #F5F3FF;
                }

                .avatar-section {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                }

                .avatar-wrapper {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #4F46E5, #818CF8);
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 2rem;
                    font-weight: 800;
                    position: relative;
                    box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2);
                }

                .status-indicator {
                    position: absolute;
                    bottom: -4px;
                    right: -4px;
                    width: 18px;
                    height: 18px;
                    background: #10B981;
                    border: 3px solid white;
                    border-radius: 50%;
                }

                .header-text h1 {
                    font-size: 1.75rem;
                    font-weight: 900;
                    margin: 0 0 8px 0;
                    color: var(--color-text-main);
                }

                .badge-row {
                    display: flex;
                    gap: 10px;
                }

                .premium-badge {
                    background: #FFFBEB;
                    color: #D97706;
                    padding: 4px 12px;
                    border-radius: 100px;
                    font-size: 0.7rem;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    border: 1px solid #FEF3C7;
                }

                .id-pill {
                    color: var(--color-text-muted);
                    font-size: 0.75rem;
                    font-weight: 600;
                    padding: 4px 0;
                }

                .logout-btn-top {
                    background: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    color: #64748B;
                    padding: 8px 16px;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                }

                .logout-btn-top:hover {
                    background: #FEF2F2;
                    color: #EF4444;
                    border-color: #FEE2E2;
                }

                .stats-mini-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                }

                .stat-pill-card {
                    background: white;
                    padding: 20px;
                    border-radius: 24px;
                    border: 1px solid var(--color-border);
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .stat-pill-card .icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-pill-card .txt {
                    display: flex;
                    flex-direction: column;
                }

                .stat-pill-card .val {
                    font-size: 1.15rem;
                    font-weight: 800;
                    color: var(--color-text-main);
                }

                .stat-pill-card .lbl {
                    font-size: 0.75rem;
                    color: var(--color-text-muted);
                    font-weight: 600;
                }

                .profile-content-grid {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr;
                    gap: 24px;
                }

                .info-card {
                    background: white;
                    border-radius: 28px;
                    padding: 32px;
                    border: 1px solid var(--color-border);
                }

                .info-card h3 {
                    margin: 0 0 24px 0;
                    font-size: 1.1rem;
                    font-weight: 800;
                    color: var(--color-text-main);
                }

                .details-list {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .detail-item {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .detail-label {
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: var(--color-text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .detail-value {
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--color-text-main);
                    background: #F8FAFC;
                    padding: 12px 16px;
                    border-radius: 12px;
                    border: 1px solid #F1F5F9;
                }

                .status-tag {
                    padding: 12px 16px;
                    border-radius: 12px;
                    font-weight: 800;
                    font-size: 0.9rem;
                    text-align: center;
                }

                .status-tag.success { background: #ECFDF5; color: #059669; }
                .status-tag.premium { background: #EEF2FF; color: #4F46E5; }

                .security-notice {
                    margin-top: 32px;
                    padding: 16px;
                    background: #F8FAFC;
                    border-radius: 16px;
                    font-size: 0.8rem;
                    color: var(--color-text-muted);
                    line-height: 1.5;
                }

                @media (max-width: 900px) {
                    .profile-content-grid { grid-template-columns: 1fr; }
                }

                @media (max-width: 600px) {
                    .profile-header-card { flex-direction: column; gap: 20px; text-align: center; padding: 24px; }
                    .avatar-section { flex-direction: column; gap: 16px; }
                    .badge-row { justify-content: center; }
                    .logout-btn-top { width: 100%; justify-content: center; }
                    .stats-mini-grid { grid-template-columns: 1fr; }
                    .profile-container { padding: 16px; }
                }
            `}</style>
        </AppShell>
    );
}
