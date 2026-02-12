"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, ArrowRight, Sparkles, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import api, { setCookie } from "@/lib/api";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [otp, setOtp] = useState("");
    const router = useRouter();

    const handleSignup = async (e) => {
        e.preventDefault();

        if (password.length < 8) {
            setError("Password should be at least 8 characters");
            return;
        }

        setLoading(true);
        setError("");

        const cleanEmail = email.trim().toLowerCase();

        try {
            // Register at Django
            await api.post("/register/", {
                username: cleanEmail,
                email: cleanEmail,
                password: password,
                first_name: name
            });

            // Registration success - Wait for verification
            setIsRegistered(true);
        } catch (err) {
            console.error("Signup error:", err);

            // Extract the most relevant error message from Django's response
            let detail = "Signup failed.";
            if (err.response?.data) {
                const data = err.response.data;
                if (data.username) detail = data.username[0];
                else if (data.email) detail = data.email[0];
                else if (data.password) detail = `Password error: ${data.password[0]}`;
                else if (data.non_field_errors) detail = data.non_field_errors[0];
                else if (typeof data === 'string') detail = data;
                else detail = "Account might already exist or data is invalid.";
            }

            setError(detail);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.post("/verify-otp/", {
                email: email,
                otp: otp
            });

            if (res.status === 200 || res.status === 201) {
                router.push("/login?verified=true");
            }
        } catch (err) {
            console.error("OTP Error:", err);
            setError(err.response?.data?.error || "Invalid code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError("");
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Send Google user data to our backend to get REAL tokens
            const res = await api.post("/google-login/", {
                email: user.email,
                first_name: user.displayName || 'Student',
            });

            if (res.data.access) {
                setCookie('token', res.data.access);
                setCookie('refresh_token', res.data.refresh);
                router.push("/dashboard");
            } else {
                setError("Authentication failed. Please try again.");
            }
        } catch (error) {
            console.error("Google login error:", error);
            setError("Google login failed. Please check your internet connection.");
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
                    <h1>{isRegistered ? "Verify Email" : "Create Account"}</h1>
                </div>

                {isRegistered ? (
                    <div className="registration-success">
                        <div className="success-content">
                            <div className="icon-pulse">
                                <div className="icon-inner">
                                    <Mail size={32} />
                                </div>
                            </div>

                            <h2 className="success-title">Verify Your OTP</h2>
                            <p className="success-text">
                                We've sent a 6-digit code to:<br />
                                <span className="email-display">{email}</span>
                            </p>

                            <div className="bg-indigo-50 p-3 rounded-xl mb-6 text-indigo-700 text-xs font-semibold border border-indigo-100">
                                If you don't receive the email, use code <span className="text-indigo-900 font-extrabold underline">112233</span> to complete verification for now.
                            </div>

                            <div className="otp-container">
                                <input
                                    type="text"
                                    maxLength="6"
                                    placeholder="Enter 6-digit code"
                                    className="otp-input"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                />
                                {error && <p className="otp-error">{error}</p>}
                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={otp.length !== 6 || loading}
                                    className="verify-btn"
                                >
                                    {loading ? "Verifying..." : "Verify & Complete"}
                                </button>
                            </div>

                            <button
                                onClick={() => setIsRegistered(false)}
                                className="resend-btn"
                            >
                                Try another email
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="subtitle">Sign up to start your journey with NEETMentor AI</p>

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

                        <div className="divider">
                            <span>OR</span>
                        </div>

                        <button onClick={handleGoogleLogin} className="google-btn" disabled={loading}>
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" />
                            Continue with Google
                        </button>
                    </>
                )}

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

                .subtitle {
                    text-align: center;
                    color: #64748B;
                    font-size: 0.95rem;
                    font-weight: 500;
                    margin-bottom: 2rem;
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

                .input-wrapper :global(.icon) {
                    margin-left: 1.25rem;
                    color: #94A3B8;
                    transition: color 0.2s ease;
                    flex-shrink: 0;
                }

                .input-wrapper:focus-within :global(.icon) {
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
                    width: 100%;
                }

                .signup-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px -5px rgba(99, 102, 241, 0.4);
                    background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%);
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
                }

                .divider {
                    display: flex;
                    align-items: center;
                    text-align: center;
                    margin: 1.5rem 0;
                    color: #94A3B8;
                    font-size: 0.8rem;
                    font-weight: 700;
                }

                .divider::before,
                .divider::after {
                    content: "";
                    flex: 1;
                    border-bottom: 1px solid #F1F5F9;
                }

                .divider span {
                    margin: 0 1rem;
                }

                .google-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    background: white;
                    border: 2px solid #F1F5F9;
                    padding: 0.9rem;
                    border-radius: 16px;
                    color: #1E293B;
                    font-size: 0.95rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .google-btn:hover {
                    background: #F8FAFC;
                    border-color: #E2E8F0;
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

                /* Success UI Styling */
                .success-content {
                    text-align: center;
                    padding: 1rem 0;
                }

                .icon-pulse {
                    width: 80px;
                    height: 80px;
                    background: #EEF2FF;
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    position: relative;
                }

                .icon-pulse::after {
                    content: '';
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 24px;
                    background: #6366F1;
                    opacity: 0.15;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.2; }
                    70% { transform: scale(1.4); opacity: 0; }
                    100% { transform: scale(1.4); opacity: 0; }
                }

                .icon-inner {
                    color: #6366F1;
                    position: relative;
                    z-index: 1;
                }

                .success-title {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #0F172A;
                    margin-bottom: 0.75rem;
                }

                .success-text {
                    color: #64748B;
                    font-size: 0.95rem;
                    line-height: 1.6;
                    margin-bottom: 2rem;
                }

                .email-display {
                    color: #0F172A;
                    font-weight: 700;
                    background: #F1F5F9;
                    padding: 2px 8px;
                    border-radius: 6px;
                }

                .instruction-card {
                    background: #F8FAFC;
                    border: 1px dashed #CBD5E1;
                    padding: 1.25rem;
                    border-radius: 16px;
                    color: #475569;
                    font-size: 0.85rem;
                    margin-bottom: 2rem;
                    line-height: 1.5;
                }

                .login-redirect-btn {
                    width: 100%;
                    background: white;
                    border: 2px solid #6366F1;
                    color: #6366F1;
                    padding: 1rem;
                    border-radius: 16px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .otp-input {
                    width: 100%;
                    padding: 1.25rem;
                    border: 2px solid #E2E8F0;
                    border-radius: 16px;
                    font-size: 1.5rem;
                    font-weight: 800;
                    text-align: center;
                    letter-spacing: 0.5rem;
                    outline: none;
                    transition: all 0.2s;
                    margin-bottom: 1rem;
                    background: #F8FAFC;
                }

                .otp-input:focus {
                    border-color: #6366F1;
                    background: white;
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
                }

                .verify-btn {
                    width: 100%;
                    background: #6366F1;
                    color: white;
                    border: none;
                    padding: 1.15rem;
                    border-radius: 16px;
                    font-weight: 800;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.3);
                }

                .verify-btn:hover:not(:disabled) {
                    background: #4F46E5;
                    transform: translateY(-2px);
                }

                .verify-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .otp-error {
                    color: #E11D48;
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                }

                .resend-btn {
                    background: none;
                    border: none;
                    color: #94A3B8;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    margin-top: 2rem;
                    text-decoration: underline;
                }
                
                .resend-btn:hover {
                    color: #6366F1;
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
