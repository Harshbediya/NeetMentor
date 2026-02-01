"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();

            if (data.success) {
                router.push("/dashboard");
            } else {
                setError(data.message || "Signup failed");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-card">
                <div className="brand">
                    <div className="brand-icon">
                        <Sparkles size={24} color="#6366F1" />
                    </div>
                    <h1>Create Account</h1>
                    <p>Join NEETMentor AI and start your journey</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSignup} className="signup-form">
                    <div className="input-field">
                        <User className="icon" size={20} />
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-field">
                        <Mail className="icon" size={20} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-field">
                        <Lock className="icon" size={20} />
                        <input
                            type="password"
                            placeholder="Create Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
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
                    background: #F8FAFC;
                    padding: 2rem;
                    font-family: inherit;
                }

                .signup-card {
                    background: white;
                    padding: 3rem;
                    border-radius: 32px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.05);
                    width: 100%;
                    max-width: 450px;
                }

                .brand {
                    text-align: center;
                    margin-bottom: 2.5rem;
                }

                .brand-icon {
                    width: 50px;
                    height: 50px;
                    background: #EEF2FF;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                }

                .brand h1 {
                    font-size: 1.75rem;
                    font-weight: 950;
                    color: #0F172A;
                    margin-bottom: 0.5rem;
                }

                .brand p {
                    color: #64748B;
                    font-size: 0.95rem;
                }

                .signup-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }

                .input-field {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-field .icon {
                    position: absolute;
                    left: 1.25rem;
                    color: #94A3B8;
                }

                .input-field input {
                    width: 100%;
                    padding: 1rem 1.25rem 1rem 3.5rem;
                    border: 2px solid #F1F5F9;
                    border-radius: 16px;
                    font-size: 1rem;
                    transition: all 0.2s;
                    outline: none;
                    font-weight: 500;
                }

                .input-field input:focus {
                    border-color: #6366F1;
                    background: #F5F7FF;
                }

                .signup-btn {
                    margin-top: 1rem;
                    background: #6366F1;
                    color: white;
                    border: none;
                    padding: 1.15rem;
                    border-radius: 16px;
                    font-size: 1rem;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    transition: all 0.2s;
                }

                .signup-btn:hover {
                    background: #4F46E5;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2);
                }

                .signup-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .error-message {
                    background: #FEF2F2;
                    color: #EF4444;
                    padding: 1rem;
                    border-radius: 12px;
                    margin-bottom: 1.5rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                    text-align: center;
                    border: 1px solid #FEE2E2;
                }

                .footer {
                    margin-top: 2rem;
                    text-align: center;
                    color: #64748B;
                    font-size: 0.95rem;
                }

                .footer :global(a) {
                    color: #6366F1;
                    font-weight: 700;
                    text-decoration: none;
                }

                .footer :global(a:hover) {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}
