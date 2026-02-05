"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, ArrowRight, Sparkles, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async (e) => {
        e.preventDefault();

        // Client-side validation
        if (password.length < 6) {
            setError("Password should be at least 6 characters");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (data.success) {
                router.push("/dashboard");
            } else {
                setError(data.message || "Signup failed");
            }
        } catch (err) {
            console.error("Signup error:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-card">
                <Link href="/" className="back-link">
                    <ArrowLeft size={16} /> Back to Home
                </Link>

                <div className="brand">
                    <div className="brand-icon">
                        <Sparkles size={24} color="#6366F1" />
                    </div>
                    <h1>Create Account</h1>
                    <p>Join NEETMentor AI and start your journey</p>
                </div>

                {error && (
                    <div className="error-message">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSignup} className="signup-form">
                    <div className="input-field">
                        <div className="input-wrapper">
                            <User className="icon" size={20} />
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-field">
                        <div className="input-wrapper">
                            <Mail className="icon" size={20} />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-field">
                        <div className="input-wrapper">
                            <Lock className="icon" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Create Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="signup-btn" disabled={loading}>
                        {loading ? "Creating Account..." : <>Sign Up <ArrowRight size={18} /></>}
                    </button>
                </form>

                <div className="footer">
                    Already have an account? <Link href="/login">Log In</Link>
                </div>
            </div>

            <style jsx>{`
                .signup-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: radial-gradient(circle at top right, #EEF2FF 0%, #F8FAFC 50%),
                                radial-gradient(circle at bottom left, #F0FDF4 0%, #F8FAFC 50%);
                    padding: 1.5rem;
                }

                .signup-card {
                    background: white;
                    padding: 4rem 2.5rem 3rem;
                    border-radius: 32px;
                    box-shadow: 0 40px 100px -20px rgba(0,0,0,0.08);
                    width: 100%;
                    max-width: 440px;
                    border: 1px solid rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(10px);
                    animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
                    position: relative;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .back-link {
                    position: absolute;
                    top: 1.5rem;
                    left: 2rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #94A3B8;
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-decoration: none;
                    transition: all 0.2s;
                }

                .back-link:hover {
                    color: #6366F1;
                    transform: translateX(-3px);
                }

                .brand {
                    text-align: center;
                    margin-bottom: 2.5rem;
                }

                .brand-icon {
                    width: 64px;
                    height: 64px;
                    background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    color: white;
                    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 12px 24px -6px rgba(99, 102, 241, 0.3);
                }

                .brand-icon:hover {
                    transform: rotate(12deg) scale(1.1);
                }

                .brand h1 {
                    font-size: 1.85rem;
                    font-weight: 900;
                    color: #0F172A;
                    margin-bottom: 0.5rem;
                    letter-spacing: -0.02em;
                }

                .brand p {
                    color: #64748B;
                    font-size: 0.95rem;
                    font-weight: 500;
                }

                .signup-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }

                .input-field {
                    width: 100%;
                }

                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    background: #F8FAFC;
                    border: 2px solid #F1F5F9;
                    border-radius: 16px;
                    transition: all 0.2s ease;
                }

                .input-wrapper:focus-within {
                    border-color: #6366F1;
                    background: white;
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
                }

                .input-wrapper .icon {
                    margin-left: 1.25rem;
                    color: #94A3B8;
                    transition: color 0.2s ease;
                    flex-shrink: 0;
                }

                .input-wrapper:focus-within .icon {
                    color: #6366F1;
                }

                .input-wrapper input {
                    width: 100%;
                    padding: 1.15rem 1.25rem;
                    padding-left: 1rem;
                    border: none;
                    background: transparent;
                    font-size: 1rem;
                    outline: none;
                    font-weight: 600;
                    color: #1E293B;
                }

                .input-wrapper input::placeholder {
                    color: #94A3B8;
                    font-weight: 500;
                }

                .toggle-password {
                    margin-right: 1rem;
                    background: none;
                    border: none;
                    color: #94A3B8;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: color 0.2s;
                    padding: 4px;
                    flex-shrink: 0;
                }

                .toggle-password:hover {
                    color: #6366F1;
                }

                .signup-btn {
                    margin-top: 1rem;
                    background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
                    color: white;
                    border: none;
                    padding: 1.2rem;
                    border-radius: 16px;
                    font-size: 1rem;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    transition: all 0.3s ease;
                    box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.3);
                }

                .signup-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px -5px rgba(99, 102, 241, 0.4);
                    background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%);
                }

                .signup-btn:active {
                    transform: translateY(0);
                }

                .signup-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .error-message {
                    background: #FFF1F2;
                    color: #E11D48;
                    padding: 1rem;
                    border-radius: 12px;
                    margin-bottom: 1.5rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    border: 1px solid #FFE4E6;
                    text-align: center;
                }

                .footer {
                    margin-top: 2rem;
                    text-align: center;
                    color: #64748B;
                    font-size: 0.95rem;
                    font-weight: 500;
                }

                .footer :global(a) {
                    color: #6366F1;
                    font-weight: 700;
                    text-decoration: none;
                }

                /* Mobile Adjustments */
                @media (max-width: 480px) {
                    .signup-container {
                        padding: 1rem;
                    }

                    .signup-card {
                        padding: 3.5rem 1.5rem 2.5rem;
                        border-radius: 24px;
                    }

                    .back-link {
                        top: 1.25rem;
                        left: 1.5rem;
                    }
                    
                    .brand h1 {
                        font-size: 1.6rem;
                    }
                }
            `}</style>
        </div>
    );
}
