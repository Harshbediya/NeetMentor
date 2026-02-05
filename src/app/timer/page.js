"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import {
    Play, Pause, RotateCcw, Edit3, Check, Target
} from "lucide-react";
import { useTimer } from "@/context/TimerContext";

export default function TimerPage() {
    const {
        seconds, setSeconds,
        isActive, setIsActive,
        mode, setMode,
        selectedSubject, setSelectedSubject,
        initialTime, setInitialTime,
        dailyGoal, updateDailyGoal,
        realStats,
        saveSession
    } = useTimer();

    const [mounted, setMounted] = useState(false);
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [customInput, setCustomInput] = useState("25");
    const [goalInput, setGoalInput] = useState("6");
    const [showLoggingModal, setShowLoggingModal] = useState(false);
    const [sessionDetails, setSessionDetails] = useState({ topic: "", difficulty: "Medium" });

    useEffect(() => {
        setMounted(true);
        setGoalInput((dailyGoal / 3600).toString());
    }, [dailyGoal]);

    const handleTimerCompleteUI = () => {
        setShowLoggingModal(true);
    };

    useEffect(() => {
        if (seconds === 0 && !isActive && initialTime > 0 && !showLoggingModal) {
            // Timer completion logic handled in context
        }
    }, [seconds, isActive]);

    const toggleTimer = () => {
        if (!isActive && !selectedSubject) {
            alert("Please select a subject (Physics/Chemistry/Biology) before starting.");
            return;
        }
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setSeconds(initialTime);
    };

    const switchMode = (newMode, minutes) => {
        setMode(newMode);
        setIsEditingTime(false);
        setIsActive(false);
        const secs = minutes * 60;
        setSeconds(secs);
        setInitialTime(secs);
        setCustomInput(minutes.toString());
    };

    const handleCustomTimeSubmit = () => {
        const mins = parseInt(customInput);
        if (!isNaN(mins) && mins > 0) {
            const secs = mins * 60;
            setInitialTime(secs);
            setSeconds(secs);
            setIsEditingTime(false);
            setMode("Custom");
        }
    };

    const handleGoalSubmit = () => {
        const hours = parseFloat(goalInput);
        if (!isNaN(hours) && hours > 0) {
            updateDailyGoal(hours * 3600);
            setIsEditingGoal(false);
        }
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const onSave = async () => {
        const success = await saveSession(sessionDetails);
        if (success) {
            setShowLoggingModal(false);
            setSessionDetails({ topic: "", difficulty: "Medium" });
        } else {
            alert("Error saving session. Check your connection.");
        }
    };

    if (!mounted) return null;

    // SVG Circular Progress Calculations
    const radius = 110;
    const circumference = 2 * Math.PI * radius;
    const progress = initialTime > 0 ? (seconds / initialTime) : 1;
    const strokeDashoffset = circumference * (1 - progress);

    const progressPercentage = Math.min((realStats.todaySeconds / dailyGoal) * 100, 100);
    const remainingMinutes = Math.max(0, Math.ceil((dailyGoal - realStats.todaySeconds) / 60));

    return (
        <AppShell>
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                            <span>⏱</span> NEET MENTOR FOCUS
                        </div>
                        <h1 className="text-5xl font-black text-gray-900 mb-3">Your Study Sanctuary</h1>
                        <p className="text-xl text-gray-600">Stay disciplined. Every second counts towards your dream college.</p>
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid lg:grid-cols-[1fr_400px] gap-6">
                        {/* LEFT SECTION */}
                        <div className="space-y-6">
                            {/* Subject Selection */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                    STEP 1: CHOOSE YOUR WEAPON
                                </h3>
                                <div className="flex gap-3">
                                    {["Physics", "Chemistry", "Biology"].map(sub => (
                                        <button
                                            key={sub}
                                            className={`flex-1 py-3 px-6 rounded-2xl font-bold transition-all ${selectedSubject === sub
                                                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105"
                                                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                                                } ${isActive ? "opacity-60 cursor-not-allowed" : ""}`}
                                            onClick={() => !isActive && setSelectedSubject(sub)}
                                            disabled={isActive}
                                        >
                                            {sub}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Main Timer Area - Horizontal Layout */}
                            <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
                                <div className="flex items-center justify-between gap-12">
                                    {/* SVG Circular Timer */}
                                    <div className="relative flex-shrink-0">
                                        <svg width="300" height="300" className="transform -rotate-90">
                                            {/* Background Ring */}
                                            <circle
                                                cx="150"
                                                cy="150"
                                                r={radius}
                                                fill="none"
                                                stroke="#e5e7eb"
                                                strokeWidth="14"
                                            />
                                            {/* Progress Ring */}
                                            <circle
                                                cx="150"
                                                cy="150"
                                                r={radius}
                                                fill="none"
                                                stroke="url(#blueGradient)"
                                                strokeWidth="14"
                                                strokeLinecap="round"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={strokeDashoffset}
                                                style={{
                                                    transition: isActive
                                                        ? "stroke-dashoffset 1s linear"
                                                        : "stroke-dashoffset 0.3s ease"
                                                }}
                                            />
                                            {/* Gradient Definition */}
                                            <defs>
                                                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#6366f1" />
                                                    <stop offset="100%" stopColor="#8b5cf6" />
                                                </linearGradient>
                                            </defs>
                                        </svg>

                                        {/* Center Content */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">
                                                {mode}
                                            </div>

                                            {isEditingTime ? (
                                                <div className="flex items-center gap-2 mb-6">
                                                    <input
                                                        type="number"
                                                        value={customInput}
                                                        onChange={(e) => setCustomInput(e.target.value)}
                                                        className="w-32 text-5xl font-black text-center border-b-4 border-indigo-600 outline-none"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={handleCustomTimeSubmit}
                                                        className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                                                    >
                                                        <Check size={20} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div
                                                    className="text-7xl font-black text-gray-900 mb-6 cursor-pointer group relative leading-none"
                                                    onClick={() => !isActive && setIsEditingTime(true)}
                                                >
                                                    {formatTime(seconds)}
                                                    {!isActive && (
                                                        <Edit3
                                                            size={18}
                                                            className="absolute -right-7 top-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            {/* Play/Pause Button */}
                                            <button
                                                onClick={toggleTimer}
                                                className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all shadow-2xl ${isActive
                                                        ? "bg-indigo-600 hover:bg-indigo-700 scale-105"
                                                        : "bg-gray-900 hover:bg-gray-800"
                                                    }`}
                                            >
                                                {isActive ? (
                                                    <Pause size={32} className="text-white" fill="white" />
                                                ) : (
                                                    <Play size={32} className="text-white ml-1" fill="white" />
                                                )}
                                            </button>

                                            {/* Reset Button Below Play */}
                                            <button
                                                onClick={resetTimer}
                                                className="mt-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                                title="Reset"
                                            >
                                                <RotateCcw size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Preset Buttons on Right */}
                                    <div className="flex flex-col gap-4 flex-1">
                                        <button
                                            className={`flex items-center gap-4 py-4 px-6 rounded-2xl font-bold transition-all text-left ${mode === "Pomodoro"
                                                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200"
                                                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                                                }`}
                                            onClick={() => switchMode("Pomodoro", 25)}
                                        >
                                            <span className="text-2xl">⚡</span>
                                            <span className="text-lg">25m</span>
                                        </button>
                                        <button
                                            className={`flex items-center gap-4 py-4 px-6 rounded-2xl font-bold transition-all text-left ${mode === "Deep Work"
                                                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200"
                                                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                                                }`}
                                            onClick={() => switchMode("Deep Work", 50)}
                                        >
                                            <span className="text-2xl">📖</span>
                                            <span className="text-lg">50m</span>
                                        </button>
                                        <button
                                            className={`flex items-center gap-4 py-4 px-6 rounded-2xl font-bold transition-all text-left ${mode === "Mock Test"
                                                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200"
                                                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                                                }`}
                                            onClick={() => switchMode("Mock Test", 180)}
                                        >
                                            <span className="text-2xl">🎓</span>
                                            <span className="text-lg">3h</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Motivation Card */}
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 flex items-center gap-4">
                                <div className="text-4xl">🏆</div>
                                <div>
                                    <h4 className="font-bold text-amber-900 text-lg mb-1">
                                        Focusing on {selectedSubject || "your goals"}
                                    </h4>
                                    <p className="text-amber-700 italic">
                                        "The pain of discipline is far less than the pain of regret."
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT SECTION */}
                        <div className="space-y-6">
                            {/* Daily Goal Card */}
                            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <Target size={20} className="text-indigo-600" />
                                        <h3 className="font-bold text-gray-900">Daily Goal</h3>
                                    </div>
                                    {isEditingGoal ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={goalInput}
                                                onChange={(e) => setGoalInput(e.target.value)}
                                                className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                                            />
                                            <button
                                                onClick={handleGoalSubmit}
                                                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                                            >
                                                OK
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditingGoal(true)}
                                            className="text-sm text-indigo-600 font-semibold hover:text-indigo-700"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-5xl font-black text-gray-900">
                                            {(realStats.todaySeconds / 3600).toFixed(1)}h
                                        </span>
                                        <span className="text-2xl text-gray-400 font-bold">
                                            / {(dailyGoal / 3600).toFixed(1)}h
                                        </span>
                                    </div>
                                    <div className="flex gap-6 text-xs font-bold uppercase tracking-wide">
                                        <span className="text-gray-500">STUDIED</span>
                                        <span className="text-gray-400">TARGET</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-3">
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="text-sm font-semibold text-gray-600">
                                    {progressPercentage >= 100 ? (
                                        <span className="text-green-600">Goal achieved! You are a champion! 🏆</span>
                                    ) : (
                                        <span>
                                            {Math.round(100 - progressPercentage)}% remaining to reach your goal.
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Subject Distribution Card */}
                            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-5">Subject Distribution</h3>

                                <div className="space-y-4">
                                    {Object.entries(realStats.bySubject).map(([sub, secs]) => {
                                        const percentage = realStats.todaySeconds > 0
                                            ? (secs / realStats.todaySeconds) * 100
                                            : 0;
                                        const colors = {
                                            Physics: "bg-indigo-600",
                                            Chemistry: "bg-green-600",
                                            Biology: "bg-amber-600"
                                        };

                                        return (
                                            <div key={sub}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-bold text-gray-700">
                                                        {sub}
                                                    </span>
                                                    <span className="text-sm font-black text-gray-900">
                                                        {Math.round(secs / 60)}m
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${colors[sub]} rounded-full transition-all duration-500`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Mode History Card */}
                            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-4">Mode History</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {Object.entries(realStats.byMode).map(([m, secs]) => (
                                        <div
                                            key={m}
                                            className="bg-gray-50 rounded-xl p-4 text-center"
                                        >
                                            <div className="text-2xl font-black text-gray-900">
                                                {Math.round(secs / 60)}m
                                            </div>
                                            <div className="text-xs text-gray-500 uppercase font-bold tracking-wide mt-1">
                                                {m}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LOGGING MODAL */}
                {showLoggingModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Session Complete! 🎉</h2>
                            <p className="text-gray-600 mb-6">Great focus! Log this to keep your streak alive.</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        What exactly did you study?
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Organic Chemistry, Kinematics..."
                                        value={sessionDetails.topic}
                                        onChange={(e) =>
                                            setSessionDetails({ ...sessionDetails, topic: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        How difficult was it?
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {["Easy", "Medium", "Hard"].map((d) => (
                                            <button
                                                key={d}
                                                className={`py-3 px-4 rounded-xl font-semibold transition-all ${sessionDetails.difficulty === d
                                                        ? d === "Easy"
                                                            ? "bg-green-100 text-green-700 border-2 border-green-500"
                                                            : d === "Medium"
                                                                ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-500"
                                                                : "bg-red-100 text-red-700 border-2 border-red-500"
                                                        : "bg-gray-100 text-gray-600 border-2 border-gray-200"
                                                    }`}
                                                onClick={() =>
                                                    setSessionDetails({ ...sessionDetails, difficulty: d })
                                                }
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onSave}
                                className="w-full mt-6 py-4 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                            >
                                Save & Celebrate
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
}