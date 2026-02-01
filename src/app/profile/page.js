"use client";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { User, Mail, Lock, Shield, Calendar, LogOut, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            const res = await fetch("/api/auth/me");
            const data = await res.json();
            if (data.success) {
                setUser(data.user);
            } else {
                router.push("/login");
            }
        } catch (err) {
            console.error("Profile fetch failed");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/");
        } catch (err) {
            // Fallback: clear cookie manually if API fails
            document.cookie = "neet_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            router.push("/");
        }
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
            <div className="profile-wrapper">
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="avatar-large">
                            {user?.name?.charAt(0) || "U"}
                        </div>
                        <div className="header-info">
                            <h1>{user?.name}</h1>
                            <p>NEET Aspirant • Verified Profile</p>
                        </div>
                    </div>

                    <div className="profile-details">
                        <div className="detail-group">
                            <label><User size={16} /> FULL NAME</label>
                            <div className="detail-value">{user?.name}</div>
                        </div>

                        <div className="detail-group">
                            <label><Mail size={16} /> EMAIL ADDRESS</label>
                            <div className="detail-value">{user?.email}</div>
                        </div>

                        <div className="detail-group">
                            <label><Lock size={16} /> PASSWORD</label>
                            <div className="password-box">
                                <div className="detail-value">
                                    {showPassword ? user?.password : "••••••••••••"}
                                </div>
                                <button
                                    className="toggle-visibility"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="detail-group">
                            <label><Shield size={16} /> ACCOUNT STATUS</label>
                            <div className="status-pill">ACTIVE</div>
                        </div>
                    </div>

                    <div className="profile-actions">
                        <button onClick={handleLogout} className="logout-btn">
                            <LogOut size={18} /> Log Out Device
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .loading-screen {
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .profile-wrapper {
                    max-width: 800px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                }

                .profile-card {
                    background: white;
                    border-radius: 32px;
                    padding: 3rem;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.03);
                    border: 1px solid #F1F5F9;
                }

                .profile-header {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    margin-bottom: 3rem;
                    padding-bottom: 2rem;
                    border-bottom: 1px solid #F1F5F9;
                }

                .avatar-large {
                    width: 100px;
                    height: 100px;
                    background: linear-gradient(135deg, #6366F1, #4F46E5);
                    border-radius: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 2.5rem;
                    font-weight: 900;
                    box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2);
                }

                .header-info h1 {
                    font-size: 2rem;
                    font-weight: 950;
                    color: #0F172A;
                    margin-bottom: 0.25rem;
                }

                .header-info p {
                    color: #64748B;
                    font-weight: 700;
                    font-size: 0.9rem;
                    letter-spacing: 0.02em;
                }

                .profile-details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                }

                .detail-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .detail-group label {
                    font-size: 0.75rem;
                    font-weight: 900;
                    color: #94A3B8;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    letter-spacing: 0.05em;
                }

                .detail-value {
                    background: #F8FAFC;
                    padding: 1.15rem 1.5rem;
                    border-radius: 16px;
                    font-weight: 800;
                    color: #1E293B;
                    font-size: 1rem;
                    border: 1px solid #F1F5F9;
                }

                .password-box {
                    position: relative;
                }

                .toggle-visibility {
                    position: absolute;
                    right: 1.25rem;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: #64748B;
                    cursor: pointer;
                    padding: 4px;
                }

                .status-pill {
                    background: #DCFCE7;
                    color: #166534;
                    padding: 1.15rem 1.5rem;
                    border-radius: 16px;
                    font-weight: 900;
                    font-size: 0.8rem;
                    text-align: center;
                    letter-spacing: 0.05em;
                }

                .profile-actions {
                    margin-top: 4rem;
                    display: flex;
                    justify-content: flex-end;
                }

                .logout-btn {
                    background: #FEF2F2;
                    color: #EF4444;
                    border: none;
                    padding: 1rem 2.5rem;
                    border-radius: 16px;
                    font-weight: 800;
                    font-size: 0.95rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    transition: all 0.2s;
                }

                .logout-btn:hover {
                    background: #FEE2E2;
                    transform: translateY(-2px);
                }

                @media (max-width: 600px) {
                    .profile-details {
                        grid-template-columns: 1fr;
                    }
                    
                    .profile-header {
                        flex-direction: column;
                        text-align: center;
                        gap: 1.5rem;
                    }

                    .profile-card {
                        padding: 2rem;
                    }
                }
            `}</style>
        </AppShell>
    );
}
