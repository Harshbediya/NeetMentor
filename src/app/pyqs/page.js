"use client";

import AppShell from "@/components/AppShell";
import { Download, Eye, FileText } from "lucide-react";

const PAPERS_DATA = [
    {
        year: 2025,
        examDate: 'May 4, 2025',
        questionPdf: '/pdfs/neet-2025-question.pdf',
        solutionPdf: null
    },
    {
        year: 2024,
        examDate: 'May 5, 2024',
        questionPdf: '/pdfs/neet-2024-question.pdf',
        solutionPdf: null
    },
    {
        year: 2023,
        examDate: 'May 7, 2023',
        questionPdf: '/pdfs/neet-2023-question.pdf',
        solutionPdf: null
    },
    {
        year: 2022,
        examDate: 'July 17, 2022',
        questionPdf: '/pdfs/neet-2022-question.pdf',
        solutionPdf: null
    },
    {
        year: 2021,
        examDate: 'Sept 12, 2021',
        questionPdf: '/pdfs/neet-2021-question.pdf',
        solutionPdf: null
    },
    {
        year: 2020,
        examDate: 'Sept 13, 2020',
        questionPdf: '/pdfs/neet-2020-question.pdf',
        solutionPdf: null
    },
    {
        year: 2019,
        examDate: 'May 5, 2019',
        questionPdf: '/pdfs/neet-2019-question.pdf',
        solutionPdf: null
    },
    {
        year: 2018,
        examDate: 'May 6, 2018',
        questionPdf: '/pdfs/neet-2018-question.pdf',
        solutionPdf: null
    },
    {
        year: 2017,
        examDate: 'May 7, 2017',
        questionPdf: '/pdfs/neet-2017-question.pdf',
        solutionPdf: null
    },
];

export default function PYQsPage() {
    const handlePdfClick = (e, pdfPath) => {
        if (!pdfPath) {
            e.preventDefault();
            alert("PDF will be uploaded soon");
        }
    };

    return (
        <AppShell>
            <div className="pyqs-container">
                <div className="pyqs-header">
                    <h1>Past Year Papers</h1>
                    <p>Master your preparation with official NEET question papers and detailed solutions.</p>
                </div>

                <div className="pyqs-grid">
                    {PAPERS_DATA.map((paper) => (
                        <div key={paper.year} className="card pyq-card">
                            <div className="pyq-info">
                                <div className="pyq-icon">
                                    <FileText size={28} />
                                </div>
                                <div className="pyq-text">
                                    <h3>NEET {paper.year}</h3>
                                    <p>📅 {paper.examDate}</p>
                                </div>
                            </div>

                            <div className="btn-row">
                                <a
                                    href={paper.questionPdf || "#"}
                                    target={paper.questionPdf ? "_blank" : "_self"}
                                    rel="noopener noreferrer"
                                    className="btn download"
                                    onClick={(e) => handlePdfClick(e, paper.questionPdf)}
                                >
                                    <Download size={18} /> Download
                                </a>
                                <a
                                    href={paper.solutionPdf || "#"}
                                    target={paper.solutionPdf ? "_blank" : "_self"}
                                    rel="noopener noreferrer"
                                    className="btn solution"
                                    onClick={(e) => handlePdfClick(e, paper.solutionPdf)}
                                >
                                    <Eye size={18} /> Solutions
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .pyqs-container {
                    maxWidth: 1000px;
                    margin: 0 auto;
                    padding: 2rem 1rem;
                }
                .pyqs-header {
                    margin-bottom: 3rem;
                }
                .pyqs-header h1 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: var(--color-text-main);
                    margin-bottom: 0.5rem;
                    text-transform: uppercase;
                    letter-spacing: -0.02em;
                }
                .pyqs-header p {
                    color: var(--color-text-muted);
                    font-size: 1.1rem;
                }
                .pyqs-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 2rem;
                }
                .pyq-card {
                    display: flex;
                    flex-direction: column;
                    padding: 1.5rem;
                    border: 1px solid var(--color-border);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .pyq-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 12px 24px -8px rgba(0,0,0,0.15);
                    border-color: var(--color-primary-light);
                }
                .pyq-info {
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    margin-bottom: 2rem;
                }
                .pyq-icon {
                    width: 56px;
                    height: 56px;
                    background: var(--color-primary-light);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-primary);
                }
                .pyq-text h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0;
                    color: var(--color-text-main);
                }
                .pyq-text p {
                    color: var(--color-text-muted);
                    font-size: 0.95rem;
                    margin-top: 4px;
                    font-weight: 500;
                }
                .btn-row {
                    margin-top: auto;
                    display: flex;
                    gap: 1rem;
                    width: 100%;
                }
                .btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.8rem 0;
                    border-radius: 8px;
                    font-size: 0.95rem;
                    font-weight: 700;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    text-align: center;
                    min-width: 0;
                }
                
                .btn.download {
                    background-color: var(--color-primary);
                    color: white;
                    border: 1px solid var(--color-primary);
                }
                .btn.download:hover {
                    background-color: #1a4ab9;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                }

                .btn.solution {
                    background-color: white;
                    color: var(--color-primary);
                    border: 2px solid var(--color-primary);
                }
                .btn.solution:hover {
                    background-color: var(--color-primary-light);
                }

                .btn:active {
                    transform: scale(0.97);
                }

                @media (max-width: 640px) {
                    .btn-row {
                        flex-direction: column;
                    }
                }
            `}</style>
        </AppShell>
    );
}
