"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import {
    BookOpen, Clock, ChevronRight, ArrowLeft, Trophy, RotateCcw,
    FileText, Download, Layers, CheckCircle
} from "lucide-react";
import "./pyqs.css";

/* --- 1. MOCK DATA FOR QUIZ --- */
const SAMPLE_QUESTIONS = [
    {
        id: 1,
        question: "A particle moves with a velocity v = (5i + 2j) m/s under the influence of a constant force F = (2i + 5j) N. The instantaneous power applied to the particle is:",
        options: ["20 W", "10 W", "5 W", "15 W"],
        correct: 0,
        explanation: "Power P = F · v = (2i + 5j) · (5i + 2j) = 10 + 10 = 20 W."
    },
    {
        id: 2,
        question: "Which of the following cell organelles is responsible for extracting energy from carbohydrates to form ATP?",
        options: ["Ribosome", "Chloroplast", "Mitochondrion", "Lysosome"],
        correct: 2,
        explanation: "Mitochondria are the powerhouses of the cell, performing cellular respiration to generate ATP."
    },
    {
        id: 3,
        question: "In the Young's double-slit experiment, the intensity of light at a point on the screen where the path difference is λ is K units. What is the intensity at a point where the path difference is λ/4?",
        options: ["K/4", "K/2", "K", "Zero"],
        correct: 1,
        explanation: "Intensity I = I_max * cos^2(φ/2). Phase diff φ = (2π/λ) * (λ/4) = π/2. I = K * cos^2(π/4) = K * (1/√2)^2 = K/2."
    },
    {
        id: 4,
        question: "The correct order of increasing thermal stability of K2CO3, MgCO3, CaCO3, and BeCO3 is:",
        options: ["BeCO3 < MgCO3 < CaCO3 < K2CO3", "MgCO3 < BeCO3 < CaCO3 < K2CO3", "K2CO3 < MgCO3 < CaCO3 < BeCO3", "BeCO3 < MgCO3 < K2CO3 < CaCO3"],
        correct: 0,
        explanation: "Thermal stability increases down the group for alkaline earth metal carbonates. Group 1 carbonates (K2CO3) are more stable than Group 2."
    },
    {
        id: 5,
        question: "Given below are two statements:\nStatement I: The acidic strength of monosubstituted nitrophenol is higher than phenol because of electron withdrawing nitro group.\nStatement II: o-nitrophenol, m-nitrophenol and p-nitrophenol will have same acidic strength as they have one nitro group attached to the phenolic ring.\nIn the light of the above statements, choose the most appropriate answer:",
        options: ["Both Statement I and Statement II are correct.", "Both Statement I and Statement II are incorrect.", "Statement I is correct but Statement II is incorrect.", "Statement I is incorrect but Statement II is correct."],
        correct: 2,
        explanation: "Nitro group is electron withdrawing (-I, -M), increasing acidity. However, position matters (o/p have -M, m has only -I), so strengths differ."
    }
];

/* --- 2. DATA FOR PDF DOWNLOADS --- */
const PAPERS_DATA = [
    { year: 2025, examDate: 'May 4, 2025', questionPdf: '/pdfs/neet-2025-question.pdf' },
    { year: 2024, examDate: 'May 5, 2024', questionPdf: '/pdfs/neet-2024-question.pdf' },
    { year: 2023, examDate: 'May 7, 2023', questionPdf: '/pdfs/neet-2023-question.pdf' },
    { year: 2022, examDate: 'July 17, 2022', questionPdf: '/pdfs/neet-2022-question.pdf' },
    { year: 2021, examDate: 'Sept 12, 2021', questionPdf: '/pdfs/neet-2021-question.pdf' },
    { year: 2020, examDate: 'Sept 13, 2020', questionPdf: '/pdfs/neet-2020-question.pdf' },
    { year: 2019, examDate: 'May 5, 2019', questionPdf: '/pdfs/neet-2019-question.pdf' },
    { year: 2018, examDate: 'May 6, 2018', questionPdf: '/pdfs/neet-2018-question.pdf' },
    { year: 2017, examDate: 'May 7, 2017', questionPdf: '/pdfs/neet-2017-question.pdf' },
];

const CHAPTER_DATA = {
    "Physics": [
        { id: "p1", name: "Units and Measurements", qCount: 45 },
        { id: "p2", name: "Motion in a Straight Line", qCount: 38 },
        { id: "p3", name: "Laws of Motion", qCount: 52 },
        { id: "p4", name: "Work, Energy and Power", qCount: 41 },
        { id: "p5", name: "Modern Physics", qCount: 65 }
    ],
    "Chemistry": [
        { id: "c1", name: "Some Basic Concepts", qCount: 30 },
        { id: "c2", name: "Structure of Atom", qCount: 42 },
        { id: "c3", name: "Chemical Bonding", qCount: 55 },
        { id: "c4", name: "Organic Chemistry Basics", qCount: 48 },
        { id: "c5", name: "Equilibrium", qCount: 39 }
    ],
    "Biology": [
        { id: "b1", name: "The Living World", qCount: 25 },
        { id: "b2", name: "Cell: The Unit of Life", qCount: 60 },
        { id: "b3", name: "Genetics & Evolution", qCount: 85 },
        { id: "b4", name: "Human Physiology", qCount: 120 },
        { id: "b5", name: "Plant Physiology", qCount: 45 }
    ]
};

const STUDY_INSIGHTS = [
    { topic: "Modern Physics", weightage: "12%", tips: "Focus on de-Broglie wavelength and photoelectric effect." },
    { topic: "Organic Chemistry", weightage: "15%", tips: "Practice name reactions like Aldol and Cannizzaro." },
    { topic: "Genetics & Evolution", weightage: "18%", tips: "Master Mendelian ratios and DNA replication steps." },
    { topic: "Equilibrium", weightage: "10%", tips: "Le-Chatelier's principle and pH calculations are vital." },
    { topic: "Human Physiology", weightage: "20%", tips: "Heart cycles and hormone functions are frequently asked." },
];

export default function PYQsPage() {
    const [activeTab, setActiveTab] = useState("practice"); // 'practice' | 'downloads'
    const [view, setView] = useState("selection"); // selection, year_select, chapter_select, custom_setup, quiz, result
    const [selectedMode, setSelectedMode] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState("Physics");
    const [customCount, setCustomCount] = useState(10);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [reviewedQuestions, setReviewedQuestions] = useState({}); // { questionId: boolean }
    const [timer, setTimer] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Performance & Gamification States
    const [streak, setStreak] = useState(0);
    const [testHistory, setTestHistory] = useState([]);
    const [wrongQuestions, setWrongQuestions] = useState([]); // Array of IDs

    useEffect(() => {
        setMounted(true);
        // Load Data
        const savedHistory = JSON.parse(localStorage.getItem("pyq_history") || "[]");
        setTestHistory(savedHistory);

        const savedWrong = JSON.parse(localStorage.getItem("pyq_wrong_ids") || "[]");
        setWrongQuestions(savedWrong);

        const savedStreak = JSON.parse(localStorage.getItem("study_streak") || '{"count": 0, "lastDate": null}');
        updateStreak(savedStreak);
    }, []);

    const updateStreak = (savedStreak) => {
        const today = new Date().toDateString();
        const lastDate = savedStreak.lastDate;

        if (lastDate === today) {
            setStreak(savedStreak.count);
            return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDate === yesterday.toDateString()) {
            setStreak(savedStreak.count);
        } else if (lastDate) {
            setStreak(0);
            localStorage.setItem("study_streak", JSON.stringify({ count: 0, lastDate: today }));
        } else {
            setStreak(0);
        }
    };

    const saveTestResult = (result, answers) => {
        const newEntry = {
            date: new Date().toISOString(),
            ...result,
            mode: selectedMode
        };
        const updatedHistory = [newEntry, ...testHistory].slice(0, 10);
        setTestHistory(updatedHistory);
        localStorage.setItem("pyq_history", JSON.stringify(updatedHistory));

        // Track Wrong Questions
        const currentWrong = [...wrongQuestions];
        SAMPLE_QUESTIONS.forEach(q => {
            if (answers[q.id] !== undefined && answers[q.id] !== q.correct) {
                if (!currentWrong.includes(q.id)) currentWrong.push(q.id);
            } else if (answers[q.id] === q.correct) {
                const idx = currentWrong.indexOf(q.id);
                if (idx > -1) currentWrong.splice(idx, 1);
            }
        });
        setWrongQuestions(currentWrong);
        localStorage.setItem("pyq_wrong_ids", JSON.stringify(currentWrong));

        // Update streak on successful test completion
        const today = new Date().toDateString();
        const savedStreak = JSON.parse(localStorage.getItem("study_streak") || '{"count": 0, "lastDate": null}');
        if (savedStreak.lastDate !== today) {
            const newStreak = { count: savedStreak.count + 1, lastDate: today };
            setStreak(newStreak.count);
            localStorage.setItem("study_streak", JSON.stringify(newStreak));
        }
    };

    // Timer Logic
    useEffect(() => {
        let interval;
        if (view === "quiz" && !isPaused) {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [view, isPaused]);

    const [currentQuestions, setCurrentQuestions] = useState(SAMPLE_QUESTIONS);

    const startQuiz = (mode) => {
        setSelectedMode(mode);
        let qSet = [...SAMPLE_QUESTIONS];

        if (mode === 'revision') {
            qSet = SAMPLE_QUESTIONS.filter(q => wrongQuestions.includes(q.id));
            if (qSet.length === 0) {
                alert("No wrong questions to revise! Great job!");
                return;
            }
        } else if (mode === 'chapter' || mode === 'custom') {
            // Mock filtering: if subject is not "All", assume some questions belong to it
            // In a real app, questions would have a 'subject' or 'chapter' field
            if (selectedSubject !== "All") {
                // For mock purposes, just take every 2nd or 3rd question as a specific subject
                const subIndex = ["Physics", "Chemistry", "Biology"].indexOf(selectedSubject);
                qSet = SAMPLE_QUESTIONS.filter((_, idx) => idx % 3 === subIndex);
            }

            if (mode === 'custom') {
                qSet = qSet.slice(0, customCount);
            }
        }

        if (qSet.length === 0) {
            alert("No questions found for this selection. Try different settings.");
            return;
        }

        setCurrentQuestions(qSet);
        setView("quiz");
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setReviewedQuestions({});
        setTimer(0);
        setIsPaused(false);
    };

    const handleAnswerSelect = (optionIndex) => {
        setUserAnswers(prev => ({
            ...prev,
            [SAMPLE_QUESTIONS[currentQuestionIndex].id]: optionIndex
        }));
    };

    const [aiExplanation, setAiExplanation] = useState(null); // { questionId, text }

    const toggleReview = (questionId) => {
        setReviewedQuestions(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    };

    const askAI = (q) => {
        setAiExplanation({ loading: true, id: q.id });
        setTimeout(() => {
            setAiExplanation({
                id: q.id,
                text: `[AI PRO TIP]: This question tests your knowledge of ${q.explanation.split('.')[0]}. Remember that in NEET, these concepts often repeat with different values. Focus on the formula and unit consistency!`
            });
        }, 800);
    };

    const quitQuiz = () => {
        if (confirm("Stop practice and go back to selection? Progress will be lost.")) {
            setView("selection");
        }
    };

    const calculateScore = () => {
        let score = 0;
        let correctCount = 0;
        let incorrectCount = 0;
        currentQuestions.forEach(q => {
            const userAnswer = userAnswers[q.id];
            if (userAnswer !== undefined) {
                if (userAnswer === q.correct) {
                    score += 4;
                    correctCount++;
                } else {
                    score -= 1;
                    incorrectCount++;
                }
            }
        });
        return { score, correctCount, incorrectCount };
    };

    const submitQuiz = () => {
        if (confirm("Are you sure you want to submit?")) {
            const result = calculateScore();
            saveTestResult(result, userAnswers);
            setView("result");
        }
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (!mounted) return null;

    /* --- COMPONENTS --- */

    const TabNavigation = () => (
        <div className="pyq-tabs">
            <button
                className={`pyq-tab-btn ${activeTab === 'practice' ? 'active' : ''}`}
                onClick={() => setActiveTab('practice')}
            >
                <Layers size={18} /> Interactive Quiz
            </button>
            <button
                className={`pyq-tab-btn ${activeTab === 'downloads' ? 'active' : ''}`}
                onClick={() => setActiveTab('downloads')}
            >
                <Download size={18} /> Official PDF Papers
            </button>
        </div>
    );

    const DownloadsSection = () => (
        <div className="downloads-container">
            <div className="downloads-header">
                <h2>Official Question Papers</h2>
                <p>Access high-quality PDFs and interactive quizzes for NEET past year papers.</p>
            </div>
            <div className="papers-grid-v2">
                {PAPERS_DATA.map((paper) => (
                    <div key={paper.year} className="paper-card-v2">
                        <div className="paper-card-main">
                            <div className="paper-icon-box"><FileText size={28} /></div>
                            <div className="paper-info-box">
                                <h3>NEET {paper.year}</h3>
                                <span>{paper.examDate}</span>
                            </div>
                        </div>
                        <div className="paper-actions-v2">
                            <button className="paper-quiz-btn" onClick={() => {
                                setSelectedYear(paper.year);
                                startQuiz('year');
                                setActiveTab('practice');
                            }}>
                                <Clock size={16} /> Start Quiz
                            </button>
                            <a href={paper.questionPdf} target="_blank" className="paper-pdf-btn">
                                <Download size={16} /> PDF Repo
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const SelectionScreen = () => (
        <div className="pyq-selection">
            <div className="stats-row">
                <div className="stat-pill streak">
                    <Trophy size={18} /> {streak} Day Study Streak
                </div>
                <div className="stat-pill accuracy">
                    <CheckCircle size={18} /> Avg. Accuracy: {testHistory.length > 0 ? (testHistory.reduce((acc, curr) => acc + (curr.correctCount / (curr.correctCount + curr.incorrectCount || 1)), 0) / testHistory.length * 100).toFixed(0) : 0}%
                </div>
            </div>

            <div className="pyq-mode-grid">
                <button className="pyq-mode-card year" onClick={() => setView("year_select")}>
                    <div className="pyq-card-icon"><Clock size={32} /></div>
                    <div className="pyq-card-content">
                        <h3>Full-Length Papers</h3>
                        <p>Simulate the real exam with comprehensive year-wise mock tests.</p>
                        <div className="pyq-start-btn">Select Year <ChevronRight size={16} /></div>
                    </div>
                </button>
                <button className="pyq-mode-card chapter" onClick={() => setView("chapter_select")}>
                    <div className="pyq-card-icon"><BookOpen size={32} /></div>
                    <div className="pyq-card-content">
                        <h3>Topic-wise Practice</h3>
                        <p>Master specific chapters. Filter by subject for targeted revision.</p>
                        <div className="pyq-start-btn">Choose Topic <ChevronRight size={16} /></div>
                    </div>
                </button>
                <button className="pyq-mode-card custom" onClick={() => setView("custom_setup")}>
                    <div className="pyq-card-icon"><Layers size={32} /></div>
                    <div className="pyq-card-content">
                        <h3>Custom Mock Test</h3>
                        <p>Create a test with your preferred subject and question count.</p>
                        <div className="pyq-start-btn">Build Test <ChevronRight size={16} /></div>
                    </div>
                </button>
                {wrongQuestions.length > 0 && (
                    <button className="pyq-mode-card revision" onClick={() => startQuiz('revision')}>
                        <div className="pyq-card-icon"><RotateCcw size={32} /></div>
                        <div className="pyq-card-content">
                            <h3>Smart Revision Mode</h3>
                            <p>Re-attempt {wrongQuestions.length} questions you got wrong previously.</p>
                            <div className="pyq-start-btn">Start Revision <ChevronRight size={16} /></div>
                        </div>
                    </button>
                )}
            </div>

            {testHistory.length > 0 && (
                <div className="recent-performance">
                    <h3>Recent Performance Analysis</h3>
                    <div className="performance-history-grid">
                        {testHistory.slice(0, 3).map((test, idx) => (
                            <div key={idx} className="perf-mini-card">
                                <div className="perf-meta">
                                    <span className="perf-date">{new Date(test.date).toLocaleDateString()}</span>
                                    <span className="perf-mode">{test.mode === 'year' ? 'Mock' : 'Topic'}</span>
                                </div>
                                <div className="perf-score">{test.score} / {SAMPLE_QUESTIONS.length * 4}</div>
                                <div className="perf-bar">
                                    <div className="fill" style={{ width: `${(test.correctCount / SAMPLE_QUESTIONS.length) * 100}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="study-insights-container">
                <div className="section-title-box">
                    <h3>High-Weightage Topics & Strategy</h3>
                    <span className="ai-badge">AI Insights</span>
                </div>
                <div className="insights-grid">
                    {STUDY_INSIGHTS.map((insight, idx) => (
                        <div key={idx} className="insight-card">
                            <div className="insight-badge">{insight.weightage}</div>
                            <h4>{insight.topic}</h4>
                            <p>{insight.tips}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const YearSelectScreen = () => (
        <div className="selection-sub-view">
            <button className="back-link" onClick={() => setView("selection")}><ArrowLeft size={16} /> Back</button>
            <div className="sub-view-header">
                <h2>Select NEET Paper Year</h2>
                <p>Choose a full-length authentic paper from previous years.</p>
            </div>
            <div className="year-grid">
                {PAPERS_DATA.map(paper => (
                    <button
                        key={paper.year}
                        className={`year-card ${selectedYear === paper.year ? 'active' : ''}`}
                        onClick={() => {
                            setSelectedYear(paper.year);
                            startQuiz('year');
                        }}
                    >
                        <h3>{paper.year}</h3>
                        <span>{paper.examDate}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    const ChapterSelectScreen = () => (
        <div className="selection-sub-view">
            <button className="back-link" onClick={() => setView("selection")}><ArrowLeft size={16} /> Back</button>
            <div className="sub-view-header">
                <h2>Topic-wise Practice</h2>
                <p>Select a subject and then a chapter to start focused practice.</p>
            </div>

            <div className="subject-tabs-small">
                {Object.keys(CHAPTER_DATA).map(sub => (
                    <button
                        key={sub}
                        className={`sub-pill-small ${selectedSubject === sub ? 'active' : ''}`}
                        onClick={() => setSelectedSubject(sub)}
                    >
                        {sub}
                    </button>
                ))}
            </div>

            <div className="chapter-grid">
                {CHAPTER_DATA[selectedSubject].map(chapter => (
                    <button
                        key={chapter.id}
                        className="chapter-card"
                        onClick={() => {
                            setSelectedChapter(chapter);
                            startQuiz('chapter');
                        }}
                    >
                        <div className="chapter-info">
                            <h4>{chapter.name}</h4>
                            <span>{chapter.qCount} Questions available</span>
                        </div>
                        <ChevronRight size={18} />
                    </button>
                ))}
            </div>
        </div>
    );

    const CustomSetupScreen = () => (
        <div className="custom-setup-container">
            <button className="back-link" onClick={() => setView("selection")}><ArrowLeft size={16} /> Back to Selection</button>
            <div className="custom-setup-header">
                <h2>Configure Custom Mock Test</h2>
                <p>Tailor your practice session to your needs.</p>
            </div>

            <div className="setup-card">
                <div className="setup-section">
                    <h4>Select Subject</h4>
                    <div className="sub-grid">
                        {["All", "Physics", "Chemistry", "Biology"].map(sub => (
                            <button
                                key={sub}
                                className={`sub-pill ${selectedSubject === sub ? 'active' : ''}`}
                                onClick={() => setSelectedSubject(sub)}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="setup-section">
                    <h4>Number of Questions</h4>
                    <div className="count-selector">
                        {[5, 10, 20, 45].map(count => (
                            <button
                                key={count}
                                className={`count-btn ${customCount === count ? 'active' : ''}`}
                                onClick={() => setCustomCount(count)}
                            >
                                {count} Qs
                            </button>
                        ))}
                    </div>
                </div>

                <button className="start-custom-btn" onClick={() => startQuiz('custom')}>
                    Start Custom Test <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );

    const QuizInterface = () => {
        const question = SAMPLE_QUESTIONS[currentQuestionIndex];
        return (
            <div className="quiz-wrapper">
                <div className="quiz-top-bar">
                    <button className="quit-btn" onClick={quitQuiz}><ArrowLeft size={16} /> Exit</button>
                    <div className="quiz-timer"><Clock size={16} /> {formatTime(timer)}</div>
                    <div className="quiz-prog">Q {currentQuestionIndex + 1} / {currentQuestions.length}</div>
                    <button className="quiz-submit" onClick={submitQuiz}>Submit</button>
                </div>
                <div className="quiz-layout-grid">
                    <div className="question-card">
                        <div className="question-text"><span className="q-label">Q{currentQuestionIndex + 1}.</span> {question.question}</div>
                        <div className="options-list">
                            {question.options.map((opt, idx) => (
                                <button key={idx} className={`option-item ${userAnswers[question.id] === idx ? 'selected' : ''}`} onClick={() => handleAnswerSelect(idx)}>
                                    <div className="opt-circle">{String.fromCharCode(65 + idx)}</div> {opt}
                                </button>
                            ))}
                        </div>
                        <div className="quiz-nav">
                            <button className="nav-button" disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(prev => prev - 1)}><ArrowLeft size={16} /> Prev</button>
                            <button
                                className={`nav-button ${reviewedQuestions[question.id] ? 'reviewed' : ''}`}
                                onClick={() => toggleReview(question.id)}
                            >
                                {reviewedQuestions[question.id] ? "Marked" : "Review Later"}
                            </button>
                            <button className="nav-button primary" disabled={currentQuestionIndex === currentQuestions.length - 1} onClick={() => setCurrentQuestionIndex(prev => prev + 1)}>Next <ChevronRight size={16} /></button>
                        </div>
                    </div>
                    <div className="palette-card">
                        <h3>Question Palette</h3>
                        <div className="palette-grid">
                            {currentQuestions.map((q, idx) => (
                                <button
                                    key={q.id}
                                    className={`palette-num ${currentQuestionIndex === idx ? 'active' : ''} ${userAnswers[q.id] !== undefined ? 'done' : ''} ${reviewedQuestions[q.id] ? 'review' : ''}`}
                                    onClick={() => setCurrentQuestionIndex(idx)}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const ResultScreen = () => {
        const { score, correctCount, incorrectCount } = calculateScore();
        return (
            <div className="results-screen">
                <header className="results-header">
                    <Trophy size={64} color="#F59E0B" />
                    <h1>Performance Analysis</h1>
                    <p>You scored <strong>{score}</strong> out of {currentQuestions.length * 4}</p>
                </header>
                <div className="solutions-container">
                    <h3>Detailed Solutions & AI Help</h3>
                    {currentQuestions.map((q, idx) => (
                        <div key={q.id} className={`sol-card ${userAnswers[q.id] === q.correct ? 'correct' : 'wrong'}`}>
                            <div className="sol-card-header">
                                <p><strong>Q{idx + 1}.</strong> {q.question}</p>
                                <button className="ask-ai-btn" onClick={() => askAI(q)}>
                                    <RotateCcw size={14} className="spark" /> Ask AI Mentor
                                </button>
                            </div>
                            <div className="sol-explanation">
                                <strong>Answer:</strong> {q.options[q.correct]}<br />
                                <strong>Explanation:</strong> {q.explanation}
                            </div>
                            {aiExplanation?.id === q.id && (
                                <div className="ai-box">
                                    {aiExplanation.loading ? "Consulting AI Mentor..." : aiExplanation.text}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button className="nav-button" onClick={() => setView("selection")}><ArrowLeft size={18} /> Home</button>
                    <button className="nav-button primary" onClick={() => startQuiz(selectedMode)}><RotateCcw size={18} /> Re-Attempt</button>
                </div>
            </div>
        );
    };

    return (
        <AppShell>
            <div className="pyq-page-container">
                <header className="pyq-main-header">
                    <h1>Past Year Papers</h1>
                    <p>Practice with actual NEET questions from 2017-2025.</p>
                </header>
                <TabNavigation />
                <div className="pyq-content">
                    {activeTab === 'practice' ? (
                        <>
                            {view === "selection" && <SelectionScreen />}
                            {view === "year_select" && <YearSelectScreen />}
                            {view === "chapter_select" && <ChapterSelectScreen />}
                            {view === "custom_setup" && <CustomSetupScreen />}
                            {view === "quiz" && <QuizInterface />}
                            {view === "result" && <ResultScreen />}
                        </>
                    ) : (
                        <DownloadsSection />
                    )}
                </div>
            </div>
        </AppShell>
    );
}
