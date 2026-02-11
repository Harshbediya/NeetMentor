"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState("loading"); // loading, success, error

    useEffect(() => {
        const token = searchParams.get('token');
        const email = searchParams.get('email');

        if (token && email) {
            verify(token, email);
        } else {
            setStatus("error");
        }
    }, [searchParams]);

    const verify = async (token, email) => {
        try {
            await api.post('/verify-email/', { token, email });
            setStatus("success");
            // Auto redirect after 5 seconds
            setTimeout(() => {
                router.push('/login');
            }, 5000);
        } catch (err) {
            console.error("Verification failed", err);
            setStatus("error");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center">
                {status === "loading" && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Verifying Email</h1>
                        <p className="text-slate-500">Please wait while we confirm your email address.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Email Verified!</h1>
                        <p className="text-slate-500">Your account is now active. You can start your journey with NEETMentor.</p>
                        <button
                            onClick={() => router.push('/login')}
                            className="mt-4 flex items-center justify-center gap-2 w-full py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                        >
                            Go to Login
                            <ArrowRight size={20} />
                        </button>
                        <p className="text-xs text-slate-400 mt-2">Redirecting you in a few seconds...</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Verification Failed</h1>
                        <p className="text-slate-500 text-sm">The link might be expired, invalid, or already used. Please try signing up again.</p>
                        <button
                            onClick={() => router.push('/signup')}
                            className="mt-4 w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-semibold hover:bg-slate-200 transition-all"
                        >
                            Back to Signup
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
