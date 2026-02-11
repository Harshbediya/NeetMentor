"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import {
    BookOpen, Clock, ChevronRight, ArrowLeft, Trophy, RotateCcw,
    FileText, Download, Layers, CheckCircle, Plus, Trash2, X, Edit
} from "lucide-react";
import "./pyqs.css";
import { auth } from "@/lib/firebase";
import { saveData, loadData } from "@/lib/progress";
import api from "@/lib/api";

/* --- 1. MOCK DATA FOR QUIZ --- */
const GENERATE_MOCK_QUESTIONS = () => {
    const subjects = ['Physics', 'Chemistry', 'Biology'];
    const topics = {
        'Physics': ['Mechanics', 'Electrodynamics', 'Optics', 'Thermodynamics', 'Modern Physics'],
        'Chemistry': ['Physical', 'Organic', 'Inorganic', 'Electrochemistry', 'Chemical Bonding'],
        'Biology': ['Genetics', 'Ecology', 'Human Physiology', 'Plant Physiology', 'Cell Biology']
    };

    const realQuestions = [
        {
            id: 1,
            subject: 'Physics',
            question: "A particle moves with a velocity v = (5i + 2j) m/s under the influence of a constant force F = (2i + 5j) N. The instantaneous power applied to the particle is:",
            options: ["20 W", "10 W", "5 W", "15 W"],
            correct: 0,
            explanation: "Power P = F · v = (2i + 5j) · (5i + 2j) = 10 + 10 = 20 W."
        },
        {
            id: 2,
            subject: 'Biology',
            question: "Which of the following cell organelles is responsible for extracting energy from carbohydrates to form ATP?",
            options: ["Ribosome", "Chloroplast", "Mitochondrion", "Lysosome"],
            correct: 2,
            explanation: "Mitochondria are the powerhouses of the cell, performing cellular respiration to generate ATP."
        },
        {
            id: 3,
            subject: 'Physics',
            question: "In the Young's double-slit experiment, the intensity of light at a point on the screen where the path difference is λ is K units. What is the intensity at a point where the path difference is λ/4?",
            options: ["K/4", "K/2", "K", "Zero"],
            correct: 1,
            explanation: "Intensity I = I_max * cos^2(φ/2). Phase diff φ = (2π/λ) * (λ/4) = π/2. I = K * cos^2(π/4) = K * (1/√2)^2 = K/2."
        },
        {
            id: 4,
            subject: 'Chemistry',
            question: "The correct order of increasing thermal stability of K2CO3, MgCO3, CaCO3, and BeCO3 is:",
            options: ["BeCO3 < MgCO3 < CaCO3 < K2CO3", "MgCO3 < BeCO3 < CaCO3 < K2CO3", "K2CO3 < MgCO3 < CaCO3 < BeCO3", "BeCO3 < MgCO3 < K2CO3 < CaCO3"],
            correct: 0,
            explanation: "Thermal stability increases down the group for alkaline earth metal carbonates. Group 1 carbonates (K2CO3) are more stable than Group 2."
        },
        {
            id: 5,
            subject: 'Chemistry',
            question: "The acidic strength of monosubstituted nitrophenol is higher than phenol because of electron withdrawing nitro group.",
            options: ["Both Statement I and Statement II are correct.", "Both Statement I and Statement II are incorrect.", "Statement I is correct but Statement II is incorrect.", "Statement I is incorrect but Statement II is correct."],
            correct: 2,
            explanation: "Nitro group is electron withdrawing (-I, -M), increasing acidity."
        }
    ];

    const generated = [];
    for (let i = 6; i <= 200; i++) {
        const sub = subjects[i % 3];
        const topic = topics[sub][i % 5];
        generated.push({
            id: i,
            subject: sub,
            question: `[MOCK ${sub} Q${i}] A conceptual question about ${topic} ensuring deep understanding of the core principles. Specific scenario #${i} related to NEET syllabus.`,
            options: [
                `Option A for ${topic} concept`,
                `Option B for ${topic} concept`,
                `Option C for ${topic} concept`,
                `Option D for ${topic} concept`
            ],
            correct: Math.floor(Math.random() * 4),
            explanation: `Detailed explanation for Question ${i} covering ${topic}. This explains why the correct option is the right answer using standard NEET concepts.`
        });
    }

    return [...realQuestions, ...generated];
};

const SAMPLE_QUESTIONS = GENERATE_MOCK_QUESTIONS();

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
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("practice"); // 'practice' | 'downloads'
    const [view, setView] = useState("selection"); // selection, year_select, chapter_select, custom_setup, quiz, result
    const [selectedMode, setSelectedMode] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState("Physics");
    const [customCount, setCustomCount] = useState(10);
    const [customQuestionText, setCustomQuestionText] = useState(""); // For manual input
    const [yearQuestionCount, setYearQuestionCount] = useState(200); // New State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [historyFilterDate, setHistoryFilterDate] = useState(""); // For history filtering
    const [userAnswers, setUserAnswers] = useState({});
    const [reviewedQuestions, setReviewedQuestions] = useState({}); // { questionId: boolean }
    const [timer, setTimer] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Performance & Gamification States
    const [streak, setStreak] = useState(0);
    const [testHistory, setTestHistory] = useState([]);
    const [wrongQuestions, setWrongQuestions] = useState([]); // Array of IDs

    // Custom Quiz State
    const [customQuizzes, setCustomQuizzes] = useState([]);
    const [newQuiz, setNewQuiz] = useState({ title: "", questions: [] });
    const [questionForm, setQuestionForm] = useState({
        question: "", options: ["", "", "", ""], correct: 0, explanation: ""
    });
    const [isAddingQuestion, setIsAddingQuestion] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Auth is handled by the API interceptor which will 401 if token is missing/invalid
        // The AppShell or a central auth check would handle the redirect.

        // Load Data
        const loadHistory = async () => {
            try {
                const res = await api.get('/quiz-attempts/');
                const backendHistory = res.data.map(item => ({
                    id: item.id,
                    date: item.created_at || item.date,
                    score: item.score,
                    correctCount: item.correct_answers,
                    incorrectCount: item.incorrect_answers,
                    mode: item.category === 'Full Mock' ? 'year' : 'chapter',
                    quiz_name: item.quiz_name,
                    mistakes: item.mistake_data || []
                }));

                // Set history directly from backend
                setTestHistory(backendHistory);

                // Derive wrong questions from backend history
                const allMistakes = new Set();
                backendHistory.forEach(h => {
                    if (h.mistakes && Array.isArray(h.mistakes)) {
                        h.mistakes.forEach(m => allMistakes.add(typeof m === 'object' ? parseInt(m.id) : parseInt(m)));
                    }
                });
                setWrongQuestions(Array.from(allMistakes));

            } catch (err) {
                console.error("Failed to load history from backend", err);
                if (err.response?.status === 401) {
                    router.push("/login");
                }
                // Fallback: Empty state to avoid showing stale/other user data
                setTestHistory([]);
                setWrongQuestions([]);
            }
        };
        loadHistory();

        // Load Custom Quizzes
        loadData("custom_quizzes", []).then(data => setCustomQuizzes(data));

        // Load Streak from DB instead of localStorage (Audit Rule: No localStorage for persistence)
        loadData("study_streak", { count: 0, lastDate: null }).then(data => {
            updateStreak(data);
        });
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
            saveData("study_streak", { count: 0, lastDate: today });
        } else {
            setStreak(0);
        }
    };

    const saveTestResult = async (result, answers) => {
        const newEntry = {
            date: new Date().toISOString(),
            ...result,
            mode: selectedMode
        };

        // Try to save to Secure Backend
        try {
            const payload = {
                quiz_name: selectedMode === 'year' ? `NEET ${selectedYear}` : `${selectedSubject} Quiz`,
                category: selectedMode === 'year' ? 'Full Mock' : 'Topic Practice',
                score: result.score,
                total_questions: currentQuestions.length,
                correct_answers: result.correctCount,
                incorrect_answers: result.incorrectCount,
                time_taken: timer,
                mistake_data: Object.entries(answers)
                    .filter(([qId, ans]) => ans !== currentQuestions.find(q => q.id === parseInt(qId))?.correct)
                    .map(([qId, ans]) => ({ id: qId, selected: ans }))
            };
            await api.post('/quiz-attempts/', payload);
            console.log("Saved securely to cloud.");
        } catch (err) {
            console.error("Backend save failed", err);
            if (err.response?.status === 401) {
                router.push("/login");
            }
        }

        const updatedHistory = [newEntry, ...testHistory].slice(0, 10);
        setTestHistory(updatedHistory);

        // Track Wrong Questions
        const currentWrong = [...wrongQuestions];
        currentQuestions.forEach(q => {
            if (answers[q.id] !== undefined && answers[q.id] !== q.correct) {
                if (!currentWrong.includes(q.id)) currentWrong.push(q.id);
            } else if (answers[q.id] === q.correct) {
                const idx = currentWrong.indexOf(q.id);
                if (idx > -1) currentWrong.splice(idx, 1);
            }
        });
        setWrongQuestions(currentWrong);

        // Update streak on successful test completion
        const today = new Date().toDateString();
        const savedStreak = await loadData("study_streak", { count: 0, lastDate: null });
        if (savedStreak.lastDate !== today) {
            const newStreak = { count: savedStreak.count + 1, lastDate: today };
            setStreak(newStreak.count);
            await saveData("study_streak", newStreak);
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

    const startQuiz = (mode, data = null) => {
        setSelectedMode(mode);
        let qSet = [...SAMPLE_QUESTIONS];

        if (mode === 'custom_saved') {
            qSet = data?.questions || [];
            if (qSet.length === 0) return alert("This quiz has no questions!");
        } else if (mode === 'year') {
            // For year/full mock mode, allow custom question count
            if (qSet.length > yearQuestionCount) {
                qSet = qSet.slice(0, yearQuestionCount);
            }
        } else if (mode === 'revision') {
            qSet = SAMPLE_QUESTIONS.filter(q => wrongQuestions.includes(q.id));
            if (qSet.length === 0) {
                alert("No wrong questions to revise! Great job!");
                return;
            }
        } else if (mode === 'chapter' || mode === 'custom') {
            // Precise filtering based on subject property
            if (selectedSubject !== "All") {
                qSet = SAMPLE_QUESTIONS.filter(q => q.subject === selectedSubject);
            }

            // Shuffle questions for variety
            qSet = qSet.sort(() => Math.random() - 0.5);

            if (mode === 'custom') {
                if (qSet.length < customCount) {
                    alert(`Only ${qSet.length} questions available for ${selectedSubject}. Starting with max available.`);
                }
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
                {wrongQuestions.length > 0 ? (
                    <button className="pyq-mode-card revision" onClick={() => startQuiz('revision')}>
                        <div className="pyq-card-icon"><RotateCcw size={32} /></div>
                        <div className="pyq-card-content">
                            <h3>Smart Revision Mode</h3>
                            <p>Re-attempt {wrongQuestions.length} questions you got wrong previously.</p>
                            <div className="pyq-start-btn">Start Revision <ChevronRight size={16} /></div>
                        </div>
                    </button>
                ) : (
                    <div className="pyq-mode-card revision disabled">
                        <div className="pyq-card-icon"><CheckCircle size={32} color="#10b981" /></div>
                        <div className="pyq-card-content">
                            <h3>Smart Revision Mode</h3>
                            <p>No wrong questions to revise! You're doing great!</p>
                            <div className="pyq-start-btn" style={{ opacity: 0.5 }}>All Clear</div>
                        </div>
                    </div>
                )}
            </div>

            {testHistory.length > 0 && (
                <div className="recent-performance">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Recent Performance Analysis</h3>
                        <button
                            onClick={() => setView("history_log")}
                            style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            View All History <ChevronRight size={16} />
                        </button>
                    </div>
                    <div className="performance-history-grid">
                        {testHistory.slice(0, 3).map((test, idx) => (
                            <div key={idx} className="perf-mini-card">
                                <div className="perf-meta">
                                    <span className="perf-date">{new Date(test.date).toLocaleDateString()}</span>
                                    <span className="perf-mode">{test.quiz_name || (test.mode === 'year' ? 'Mock' : 'Topic')}</span>
                                </div>
                                <div className="perf-score">{test.score} / {(test.correctCount + test.incorrectCount) * 4}</div>
                                <div className="perf-bar">
                                    <div className="fill" style={{ width: `${(test.correctCount / (test.correctCount + test.incorrectCount || 1)) * 100}%` }}></div>
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

                <div className="year-q-selector" style={{ marginTop: '1rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4b5563' }}>Questions to Attempt:</span>
                    {[45, 90, 180, 200].map(count => (
                        <button
                            key={count}
                            onClick={() => setYearQuestionCount(count)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: `1px solid ${yearQuestionCount === count ? '#4f46e5' : '#e5e7eb'}`,
                                background: yearQuestionCount === count ? '#eef2ff' : 'white',
                                color: yearQuestionCount === count ? '#4f46e5' : '#374151',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {count}
                        </button>
                    ))}
                </div>
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
                    <div className="count-selector-custom" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {[10, 20, 45].map(count => (
                            <button
                                key={count}
                                className={`count-btn ${customCount === count && customQuestionText === "" ? 'active' : ''}`}
                                onClick={() => {
                                    setCustomCount(count);
                                    setCustomQuestionText("");
                                }}
                            >
                                {count} Qs
                            </button>
                        ))}
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                                type="number"
                                placeholder="Custom"
                                value={customQuestionText}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setCustomQuestionText(val);
                                    if (val && !isNaN(val) && Number(val) > 0) {
                                        setCustomCount(Number(val));
                                    }
                                }}
                                style={{
                                    width: '100px',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: customQuestionText ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                                    outline: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.95rem'
                                }}
                            />
                            {customQuestionText && <span style={{ position: 'absolute', right: '10px', fontSize: '0.75rem', fontWeight: 800, color: '#4f46e5' }}>Qs</span>}
                        </div>
                    </div>
                </div>

                <div className="setup-section" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0 }}>My Custom Quizzes</h4>
                        <button onClick={() => setView("create_quiz")} style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Plus size={16} /> Create New
                        </button>
                    </div>

                    {customQuizzes.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>You haven't created any quizzes yet.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {customQuizzes.map(q => (
                                <button
                                    key={q.id}
                                    onClick={() => startQuiz('custom_saved', q)}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        background: 'white',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>{q.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{q.questions.length} Questions</div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newQ = customQuizzes.filter(i => i.id !== q.id);
                                            setCustomQuizzes(newQ);
                                            saveData("custom_quizzes", newQ);
                                        }}
                                        style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
                                    >
                                        <X size={14} />
                                    </button>
                                </button>
                            ))}
                        </div>
                    )}
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

    const CreateQuizScreen = () => {
        const addQuestion = () => {
            if (!questionForm.question || questionForm.options.some(o => !o)) return alert("Please fill all fields");
            setNewQuiz({ ...newQuiz, questions: [...newQuiz.questions, { ...questionForm, id: Date.now() }] });
            setQuestionForm({ question: "", options: ["", "", "", ""], correct: 0, explanation: "" });
            setIsAddingQuestion(false);
        };

        const saveCustomQuiz = () => {
            if (!newQuiz.title || newQuiz.questions.length === 0) return alert("Add title and at least one question");
            const updatedQuizzes = [...customQuizzes, { ...newQuiz, id: Date.now() }];
            setCustomQuizzes(updatedQuizzes);
            saveData("custom_quizzes", updatedQuizzes);
            setNewQuiz({ title: "", questions: [] });
            setView("selection");
        };

        return (
            <div className="create-quiz-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <button onClick={() => setView("custom_setup")} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', fontWeight: 600, color: '#64748b' }}>
                    <ArrowLeft size={18} /> Back
                </button>

                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.5rem' }}>Create Your Quiz</h2>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>QUIZ TITLE</label>
                    <input
                        value={newQuiz.title}
                        onChange={e => setNewQuiz({ ...newQuiz, title: e.target.value })}
                        placeholder="e.g. Tough Physics Mechanics Test"
                        style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '1.1rem', fontWeight: 600, outline: 'none' }}
                    />
                </div>

                <div className="added-questions-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    {newQuiz.questions.map((q, idx) => (
                        <div key={q.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#4f46e5', background: '#eef2ff', padding: '4px 10px', borderRadius: '6px' }}>Q{idx + 1}</span>
                                <p style={{ fontWeight: 700, color: '#1e293b', marginTop: '10px' }}>{q.question}</p>
                            </div>
                            <button onClick={() => setNewQuiz({ ...newQuiz, questions: newQuiz.questions.filter(i => i.id !== q.id) })} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                {isAddingQuestion ? (
                    <div className="add-question-form" style={{ background: '#f8fafc', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                        <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 800 }}>New Question</h4>
                        <input
                            placeholder="Type your question here..."
                            value={questionForm.question}
                            onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })}
                            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '1rem', fontWeight: 600 }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                            {questionForm.options.map((opt, idx) => (
                                <input
                                    key={idx}
                                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                    value={opt}
                                    onChange={e => {
                                        const newOpts = [...questionForm.options];
                                        newOpts[idx] = e.target.value;
                                        setQuestionForm({ ...questionForm, options: newOpts });
                                    }}
                                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                />
                            ))}
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 700, marginRight: '10px' }}>Correct Option:</label>
                            <select
                                value={questionForm.correct}
                                onChange={e => setQuestionForm({ ...questionForm, correct: parseInt(e.target.value) })}
                                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            >
                                {questionForm.options.map((_, idx) => <option key={idx} value={idx}>Option {String.fromCharCode(65 + idx)}</option>)}
                            </select>
                        </div>
                        <textarea
                            placeholder="Explanation (Optional)"
                            value={questionForm.explanation}
                            onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '1rem', minHeight: '80px' }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={addQuestion} style={{ flex: 1, background: '#1e293b', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Add to Quiz</button>
                            <button onClick={() => setIsAddingQuestion(false)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setIsAddingQuestion(true)} style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '2px dashed #cbd5e1', background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '2rem' }}>
                        <Plus size={20} /> Add New Question
                    </button>
                )}

                <button onClick={saveCustomQuiz} style={{ width: '100%', padding: '18px', borderRadius: '16px', background: '#4f46e5', color: 'white', fontWeight: 800, fontSize: '1.1rem', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)' }}>
                    Save & Finish Quiz
                </button>
            </div>
        );
    };

    const HistoryLogScreen = () => {
        const filteredHistory = historyFilterDate
            ? testHistory.filter(t => new Date(t.date).toISOString().split('T')[0] === historyFilterDate)
            : testHistory;

        return (
            <div className="history-log-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <button onClick={() => setView("selection")} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#64748b' }}>
                        <ArrowLeft size={18} /> Back to Dashboard
                    </button>
                    <input
                        type="date"
                        value={historyFilterDate}
                        onChange={(e) => setHistoryFilterDate(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#334155', fontWeight: 600 }}
                    />
                </div>

                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.5rem' }}>
                    {historyFilterDate ? `Attempts on ${new Date(historyFilterDate).toLocaleDateString()}` : "All Quiz Attempts"}
                </h2>

                {filteredHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        <Trophy size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>{historyFilterDate ? "No attempts found for this date." : "No attempts recorded yet. Start practicing!"}</p>
                    </div>
                ) : (
                    <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredHistory.map((test, idx) => (
                            <div key={idx} style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: '#1e293b' }}>{test.quiz_name || "Quiz Session"}</h4>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', display: 'flex', gap: '10px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {new Date(test.date).toLocaleDateString()} at {new Date(test.date).toLocaleTimeString()}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> {((test.correctCount / (test.correctCount + test.incorrectCount || 1)) * 100).toFixed(0)}% Accuracy</span>
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 800, color: test.score >= 0 ? '#10b981' : '#ef4444' }}>{test.score > 0 ? '+' : ''}{test.score}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Score</span>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (confirm("Are you sure you want to delete this record?")) {
                                                const originalIndex = testHistory.findIndex(t => t === test);
                                                if (originalIndex > -1) {
                                                    try {
                                                        if (test.id) {
                                                            await api.delete(`/quiz-attempts/${test.id}/`);
                                                        }
                                                        const newHistory = [...testHistory];
                                                        newHistory.splice(originalIndex, 1);
                                                        setTestHistory(newHistory);
                                                    } catch (e) {
                                                        console.error("Failed to delete record", e);
                                                    }
                                                }
                                            }
                                        }}
                                        style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
                            {view === "create_quiz" && <CreateQuizScreen />}
                            {view === "history_log" && <HistoryLogScreen />}
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
