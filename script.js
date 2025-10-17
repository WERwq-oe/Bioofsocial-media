// Global variables
let currentTheme = 'light';
let generatedReport = '';
let generatedQuiz = null;

// Gemini AI Configuration
const GEMINI_API_KEY = 'AIzaSyAOCRjlOumCIXF_0idUzvYCZp4-80Y_GOw';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    // Set up navigation
    setupNavigation();
    
    // Load Google Fonts for handwritten text
    loadHandwrittenFont();
}

// Theme Management
function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
}

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    
    const themeIcon = document.querySelector('.theme-toggle i');
    if (themeIcon) {
        themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.getAttribute('data-page');
            showPage(page);
        });
    });
}

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === pageId) {
            item.classList.add('active');
        }
    });
}

// Load handwritten font
function loadHandwrittenFont() {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
}

// Helper function to create prompts
function createReportPrompt(data) {
    const lengthGuide = {
        short: '500-800 words',
        medium: '1000-1500 words',
        long: '2000+ words'
    };
    
    const formatInstructions = data.formatting.includes('bullet') ? 'Include bullet points where appropriate. ' : '';
    const numberedInstructions = data.formatting.includes('numbered') ? 'Use numbered lists for sequential information. ' : '';
    const tableInstructions = data.formatting.includes('tables') ? 'Include tables for data comparison where relevant. ' : '';
    const headingInstructions = data.formatting.includes('headings') ? 'Use clear section headings (## for main sections, ### for subsections). ' : '';
    
    return `Create a comprehensive report about "${data.topic}" that is ${lengthGuide[data.length]}.

Format Requirements:
- Use markdown formatting for structure
- ${headingInstructions}
- Use **bold** for important terms and concepts
- Use *italics* for emphasis
- Use __underline__ for key definitions
- ${formatInstructions}
- ${numberedInstructions}
- ${tableInstructions}
- Include an introduction, main content sections, and conclusion
- Make it informative, well-structured, and engaging
- Ensure proper paragraph breaks for readability

The report should be educational and factual, covering key aspects of the topic in depth.`;
}

function createQuizPrompt(data) {
    const totalQuestions = data.numQuestions;
    let questionsPerType = {};
    
    // Calculate questions per type based on selection
    if (data.types.length === 1) {
        questionsPerType[data.types[0]] = totalQuestions;
    } else if (data.types.length === 2) {
        questionsPerType[data.types[0]] = Math.ceil(totalQuestions * 0.6);
        questionsPerType[data.types[1]] = totalQuestions - questionsPerType[data.types[0]];
    } else if (data.types.length === 3) {
        questionsPerType[data.types[0]] = Math.ceil(totalQuestions * 0.5);
        questionsPerType[data.types[1]] = Math.ceil(totalQuestions * 0.3);
        questionsPerType[data.types[2]] = totalQuestions - questionsPerType[data.types[0]] - questionsPerType[data.types[1]];
    }
    
    const typeInstructions = data.types.map(type => {
        const count = questionsPerType[type];
        switch (type) {
            case 'mcq': return `${count} multiple choice questions with 4 options each`;
            case 'oneword': return `${count} one-word answer questions`;
            case 'flashcard': return `${count} flashcard-style Q&A pairs`;
            default: return '';
        }
    }).filter(Boolean).join(', ');

    return `Create a ${data.difficulty} difficulty quiz about "${data.topic}" with exactly ${data.numQuestions} questions total.

Include exactly: ${typeInstructions}

IMPORTANT: Create questions in the exact order and quantities specified above. Do not exceed ${totalQuestions} total questions.

Format the response as JSON with this structure:
{
    "topic": "${data.topic}",
    "difficulty": "${data.difficulty}",
    "questions": [
        {
            "type": "mcq",
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0
        },
        {
            "type": "oneword",
            "question": "Question text",
            "answer": "correct answer"
        },
        {
            "type": "flashcard",
            "question": "Question text",
            "answer": "Answer text"
        }
    ]
}

Make questions engaging and educational, testing understanding rather than just memorization.`;
}
async function callGeminiAPI(prompt) {
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error('Failed to generate content. Please try again.');
    }
}

// Report Generation
async function generateReport() {
    const topic = document.getElementById('reportTopic').value.trim();
    if (!topic) {
        alert('Please enter a topic for the report.');
        return;
    }

    const reportLength = document.querySelector('input[name="reportLength"]:checked').value;
    const textFormat = document.querySelector('input[name="textFormat"]:checked').value;
    const formatting = Array.from(document.querySelectorAll('input[name="formatting"]:checked')).map(cb => cb.value);

    // Show loading modal
    showLoadingModal('report');

    try {
        const prompt = createReportPrompt({
            topic,
            length: reportLength,
            format: textFormat,
            formatting
        });

        const content = await callGeminiAPI(prompt);
        generatedReport = content;
        
        hideLoadingModal();
        showReportPreview(content);
    } catch (error) {
        console.error('Error generating report:', error);
        hideLoadingModal();
        alert('Failed to generate report. Please check your internet connection and try again.');
    }
}

// Quiz Generation
async function generateQuiz() {
    const topic = document.getElementById('quizTopic').value.trim();
    if (!topic) {
        alert('Please enter a topic for the quiz.');
        return;
    }

    const quizTypes = Array.from(document.querySelectorAll('input[name="quizType"]:checked')).map(cb => cb.value);
    if (quizTypes.length === 0) {
        alert('Please select at least one quiz type.');
        return;
    }

    const numQuestions = document.getElementById('numQuestions').value;
    const difficulty = document.getElementById('difficulty').value;

    // Show loading modal
    showLoadingModal('quiz');

    try {
        const prompt = createQuizPrompt({
            topic,
            types: quizTypes,
            numQuestions: parseInt(numQuestions),
            difficulty
        });

        const content = await callGeminiAPI(prompt);
        
        // Clean and parse JSON response
        let cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const quizData = JSON.parse(cleanContent);
        
        generatedQuiz = quizData;
        
        hideLoadingModal();
        showQuizPreview(quizData);
    } catch (error) {
        console.error('Error generating quiz:', error);
        hideLoadingModal();
        alert('Failed to generate quiz. Please check your internet connection and try again.');
    }
}

// Loading Modal
function showLoadingModal(type) {
    const modal = document.getElementById('loadingModal');
    const messageElement = document.getElementById('loadingMessage');
    
    const messages = [
        'Th Logic is thinking...',
        'Th Logic is creating...',
        'Th Logic is analyzing...',
        'Th Logic is formatting...'
    ];
    
    let messageIndex = 0;
    
    // Animate loading messages
    const messageInterval = setInterval(() => {
        messageElement.textContent = messages[messageIndex];
        messageIndex = (messageIndex + 1) % messages.length;
    }, 1500);
    
    modal.classList.add('active');
    modal.messageInterval = messageInterval;
}

function hideLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal.messageInterval) {
        clearInterval(modal.messageInterval);
    }
    modal.classList.remove('active');
}

// Report Preview
function showReportPreview(content) {
    const modal = document.getElementById('reportModal');
    const preview = document.getElementById('reportPreview');
    
    // Format the content with proper HTML
    const formattedContent = formatReportContent(content);
    preview.innerHTML = formattedContent;
    
    modal.classList.add('active');
}

function formatReportContent(content) {
    // Apply formatting based on markdown-like syntax
    let formatted = content
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<u>$1</u>')
        .replace(/^\* (.*$)/gm, '<li>$1</li>')
        .replace(/^(\d+)\. (.*$)/gm, '<li>$1. $2</li>');
    
    // Handle tables - convert markdown tables to HTML
    formatted = formatted.replace(/\|(.+)\|\n\|[-:\s\|]+\|\n((?:\|.+\|\n?)*)/g, (match, header, rows) => {
        const headerCells = header.split('|').map(cell => cell.trim()).filter(cell => cell);
        const tableRows = rows.trim().split('\n').map(row => 
            row.split('|').map(cell => cell.trim()).filter(cell => cell)
        );
        
        let tableHTML = '<table class="preview-table"><thead><tr>';
        headerCells.forEach(cell => {
            tableHTML += `<th>${cell}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';
        
        tableRows.forEach(row => {
            if (row.length > 0) {
                tableHTML += '<tr>';
                row.forEach(cell => {
                    tableHTML += `<td>${cell}</td>`;
                });
                tableHTML += '</tr>';
            }
        });
        
        tableHTML += '</tbody></table>';
        return tableHTML;
    });
    
    formatted = formatted
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<[hlu])/gm, '<p>')
        .replace(/(?<![hlu]>)$/gm, '</p>');
    
    // Wrap consecutive list items in ul/ol tags
    formatted = formatted.replace(/(<li>(?:(?!<li>).)*<\/li>\s*)+/g, '<ul>$&</ul>');
    formatted = formatted.replace(/(<li>\d+\.(?:(?!<li>).)*<\/li>\s*)+/g, '<ol>$&</ol>');
    
    return formatted;
}

// Quiz Preview
function showQuizPreview(quiz) {
    const modal = document.getElementById('quizModal');
    const preview = document.getElementById('quizPreview');
    
    let html = '<div class="quiz-info"><h3>' + quiz.topic + '</h3>';
    html += '<p>Questions: ' + quiz.questions.length + ' | Difficulty: ' + quiz.difficulty + '</p></div>';
    
    quiz.questions.forEach((question, index) => {
        html += '<div class="question-item">';
        html += '<div class="question-title">' + (index + 1) + '. ' + question.question + '</div>';
        
        if (question.type === 'mcq') {
            question.options.forEach((option, optIndex) => {
                html += '<div class="option" onclick="selectOption(this)">';
                html += '<input type="radio" name="q' + index + '" value="' + optIndex + '">';
                html += '<span>' + option + '</span></div>';
            });
        } else if (question.type === 'oneword') {
            html += '<input type="text" class="form-control" placeholder="Your answer...">';
        } else if (question.type === 'flashcard') {
            html += '<div class="flashcard" onclick="flipCard(this)">';
            html += '<div class="card-front">' + question.question + '</div>';
            html += '<div class="card-back" style="display:none;">' + question.answer + '</div>';
            html += '</div>';
        }
        
        html += '</div>';
    });
    
    preview.innerHTML = html;
    modal.classList.add('active');
}

// Quiz Functionality
function selectOption(element) {
    const radio = element.querySelector('input[type="radio"]');
    radio.checked = true;
}

function flipCard(element) {
    const front = element.querySelector('.card-front');
    const back = element.querySelector('.card-back');
    
    if (front.style.display !== 'none') {
        front.style.display = 'none';
        back.style.display = 'block';
    } else {
        front.style.display = 'block';
        back.style.display = 'none';
    }
}

function startQuiz() {
    if (!generatedQuiz) return;
    
    // Close the preview modal
    closeModal('quizModal');
    
    // Create and show interactive quiz
    showInteractiveQuiz(generatedQuiz);
}

// Interactive Quiz Functionality
function showInteractiveQuiz(quiz) {
    const modal = document.getElementById('quizModal');
    const preview = document.getElementById('quizPreview');
    
    let currentQuestion = 0;
    let userAnswers = [];
    let score = 0;
    
    function renderQuestion() {
        const question = quiz.questions[currentQuestion];
        let html = `
            <div class="interactive-quiz">
                <div class="quiz-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${((currentQuestion + 1) / quiz.questions.length) * 100}%"></div>
                    </div>
                    <span>Question ${currentQuestion + 1} of ${quiz.questions.length}</span>
                </div>
                
                <div class="current-question">
                    <h4>${question.question}</h4>
        `;
        
        if (question.type === 'mcq') {
            question.options.forEach((option, index) => {
                html += `
                    <button class="quiz-option" onclick="selectQuizAnswer(${index})">
                        ${option}
                    </button>
                `;
            });
        } else if (question.type === 'oneword') {
            html += `
                <input type="text" id="onewordAnswer" class="form-control quiz-input" 
                       placeholder="Enter your answer..." onkeypress="handleEnterKey(event)">
            `;
        } else if (question.type === 'flashcard') {
            html += `
                <div class="flashcard-container">
                    <div class="flashcard-interactive" id="flashcard-${currentQuestion}">
                        <div class="card-front-interactive">${question.question}</div>
                        <div class="card-back-interactive" style="display:none;">${question.answer}</div>
                    </div>
                    <button class="btn btn-secondary" onclick="flipInteractiveCard()">
                        <i class="fas fa-sync-alt"></i> Flip Card
                    </button>
                </div>
            `;
        }
        
        html += `
                </div>
                
                <div class="quiz-navigation">
        `;
        
        if (currentQuestion > 0) {
            html += `<button class="btn btn-secondary" onclick="previousQuestion()">Previous</button>`;
        }
        
        if (question.type === 'flashcard') {
            html += `<button class="btn btn-primary" onclick="nextQuestion()">Next</button>`;
        } else if (currentQuestion === quiz.questions.length - 1) {
            html += `<button class="btn btn-primary" onclick="finishQuiz()">Finish Quiz</button>`;
        } else {
            html += `<button class="btn btn-primary" onclick="nextQuestion()" disabled id="nextBtn">Next</button>`;
        }
        
        html += `
                </div>
            </div>
        `;
        
        preview.innerHTML = html;
    }
    
    // Store functions in global scope
    window.selectQuizAnswer = function(answerIndex) {
        userAnswers[currentQuestion] = answerIndex;
        document.querySelectorAll('.quiz-option').forEach((btn, index) => {
            btn.classList.remove('selected');
            if (index === answerIndex) {
                btn.classList.add('selected');
            }
        });
        document.getElementById('nextBtn').disabled = false;
    };
    
    window.handleEnterKey = function(event) {
        if (event.key === 'Enter') {
            const answer = event.target.value.trim();
            if (answer) {
                userAnswers[currentQuestion] = answer;
                nextQuestion();
            }
        }
    };
    
    window.flipInteractiveCard = function() {
        const front = document.querySelector('.card-front-interactive');
        const back = document.querySelector('.card-back-interactive');
        
        if (front.style.display !== 'none') {
            front.style.display = 'none';
            back.style.display = 'block';
        } else {
            front.style.display = 'block';
            back.style.display = 'none';
        }
    };
    
    window.nextQuestion = function() {
        const question = quiz.questions[currentQuestion];
        
        if (question.type === 'oneword') {
            const answer = document.getElementById('onewordAnswer').value.trim();
            if (!answer) {
                alert('Please enter an answer before proceeding.');
                return;
            }
            userAnswers[currentQuestion] = answer;
        }
        
        currentQuestion++;
        if (currentQuestion < quiz.questions.length) {
            renderQuestion();
        } else {
            finishQuiz();
        }
    };
    
    window.previousQuestion = function() {
        currentQuestion--;
        renderQuestion();
    };
    
    window.finishQuiz = function() {
        // Calculate score
        quiz.questions.forEach((question, index) => {
            if (question.type === 'mcq' && userAnswers[index] === question.correctAnswer) {
                score++;
            } else if (question.type === 'oneword' && userAnswers[index] && 
                      userAnswers[index].toLowerCase() === question.answer.toLowerCase()) {
                score++;
            } else if (question.type === 'flashcard') {
                score++; // Flashcards always count as correct for engagement
            }
        });
        
        showQuizResults();
    };
    
    function showQuizResults() {
        const percentage = Math.round((score / quiz.questions.length) * 100);
        let html = `
            <div class="quiz-results">
                <div class="results-header">
                    <i class="fas fa-trophy"></i>
                    <h3>Quiz Complete!</h3>
                </div>
                
                <div class="score-display">
                    <div class="score-circle">
                        <span class="score-number">${percentage}%</span>
                    </div>
                    <p>You scored ${score} out of ${quiz.questions.length} questions correctly!</p>
                </div>
                
                <div class="performance-message">
        `;
        
        if (percentage >= 90) {
            html += `<p class="excellent">🎉 Excellent work! You have a great understanding of ${quiz.topic}!</p>`;
        } else if (percentage >= 70) {
            html += `<p class="good">👍 Good job! You have a solid grasp of ${quiz.topic}!</p>`;
        } else if (percentage >= 50) {
            html += `<p class="average">📚 Not bad! Consider reviewing ${quiz.topic} to improve your understanding.</p>`;
        } else {
            html += `<p class="needs-work">💪 Keep studying! ${quiz.topic} requires more practice.</p>`;
        }
        
        html += `
                </div>
                
                <div class="results-actions">
                    <button class="btn btn-secondary" onclick="retakeQuiz()">
                        <i class="fas fa-redo"></i> Retake Quiz
                    </button>
                    <button class="btn btn-primary" onclick="closeModal('quizModal')">
                        <i class="fas fa-check"></i> Done
                    </button>
                </div>
            </div>
        `;
        
        preview.innerHTML = html;
    }
    
    window.retakeQuiz = function() {
        currentQuestion = 0;
        userAnswers = [];
        score = 0;
        renderQuestion();
    };
    
    // Update modal header for interactive mode
    const modalHeader = modal.querySelector('.modal-header h3');
    modalHeader.textContent = `${quiz.topic} - Interactive Quiz`;
    
    // Hide download buttons during interactive mode
    const modalFooter = modal.querySelector('.modal-footer');
    modalFooter.style.display = 'none';
    
    // Start the quiz
    renderQuestion();
    modal.classList.add('active');
}

// Download Functions - Client-side implementation
async function downloadReport(format) {
    if (!generatedReport) return;
    
    try {
        if (format === 'pdf') {
            // Create HTML content for PDF
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 800px;
                            margin: 0 auto;
                            padding: 25px 20px 40px 20px;
                            position: relative;
                        }
                        .watermark {
                            position: fixed;
                            top: 5px;
                            left: 5px;
                            font-size: 8px;
                            color: #000000;
                            font-weight: 700;
                            opacity: 0.3;
                            z-index: 1000;
                            font-family: Arial, sans-serif;
                            letter-spacing: 0.5px;
                        }
                        h1, h2, h3 { color: #2c3e50; margin-top: 30px; margin-bottom: 15px; }
                        h1 { font-size: 28px; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
                        h2 { font-size: 22px; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; }
                        h3 { font-size: 18px; color: #34495e; }
                        p { margin-bottom: 15px; text-align: justify; }
                        ul, ol { margin: 15px 0; padding-left: 30px; }
                        li { margin-bottom: 8px; }
                        strong { color: #2c3e50; font-weight: 600; }
                        em { color: #7f8c8d; font-style: italic; }
                        u { text-decoration: underline; color: #e74c3c; }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin: 20px 0; 
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                        th, td { 
                            border: 1px solid #bdc3c7; 
                            padding: 12px 8px; 
                            text-align: left; 
                            vertical-align: top;
                        }
                        th { 
                            background-color: #ecf0f1; 
                            font-weight: 600; 
                            color: #2c3e50;
                        }
                        tr:nth-child(even) { background-color: #f8f9fa; }
                        @media print { @page { margin: 1in; size: A4; } }
                    </style>
                </head>
                <body>
                    <div class="watermark">Th Logic</div>
                    ${formatContentForHTML(generatedReport)}
                </body>
                </html>
            `;
            
            // Create and download HTML file that can be printed to PDF
            downloadAsFile(html, 'report.html', 'text/html');
            alert('HTML file downloaded! Please open it and use your browser\'s "Print to PDF" feature to get a PDF.');
            
        } else if (format === 'docx') {
            // For DOCX, we'll create a formatted text file that can be opened in Word
            const textContent = convertMarkdownToText(generatedReport);
            downloadAsFile(textContent, 'report.txt', 'text/plain');
            alert('Text file downloaded! You can open this in Microsoft Word and save as DOCX.');
        }
        
    } catch (error) {
        console.error('Error downloading report:', error);
        alert('Failed to download report. Please try again.');
    }
}

async function downloadQuiz() {
    if (!generatedQuiz) return;
    
    try {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 25px 40px 40px 40px; 
                        line-height: 1.6; 
                        position: relative;
                    }
                    .watermark {
                        position: fixed;
                        top: 5px;
                        left: 5px;
                        font-size: 8px;
                        color: #000000;
                        font-weight: 700;
                        opacity: 0.3;
                        z-index: 1000;
                        font-family: Arial, sans-serif;
                        letter-spacing: 0.5px;
                    }
                    .quiz-header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                    .question { margin-bottom: 30px; page-break-inside: avoid; }
                    .question-title { font-weight: bold; margin-bottom: 10px; font-size: 16px; }
                    .options { margin-left: 20px; }
                    .option { margin: 8px 0; }
                    .answer-key { margin-top: 50px; page-break-before: always; }
                    @media print { @page { margin: 1in; size: A4; } }
                </style>
            </head>
            <body>
                <div class="watermark">Th Logic</div>
                ${generateQuizHTML(generatedQuiz)}
            </body>
            </html>
        `;
        
        downloadAsFile(html, 'quiz.html', 'text/html');
        alert('HTML file downloaded! Please open it and use your browser\'s "Print to PDF" feature to get a PDF.');
        
    } catch (error) {
        console.error('Error downloading quiz:', error);
        alert('Failed to download quiz. Please try again.');
    }
}

// Helper functions for client-side downloads
function downloadAsFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function formatContentForHTML(content) {
    let formatted = content
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<u>$1</u>')
        .replace(/^\* (.*$)/gm, '<li>$1</li>')
        .replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>');
    
    // Handle tables
    formatted = formatted.replace(/\|(.+)\|\n\|[-:\s\|]+\|\n((?:\|.+\|\n?)*)/g, (match, header, rows) => {
        const headerCells = header.split('|').map(cell => cell.trim()).filter(cell => cell);
        const tableRows = rows.trim().split('\n').map(row => 
            row.split('|').map(cell => cell.trim()).filter(cell => cell)
        );
        
        let tableHTML = '<table><thead><tr>';
        headerCells.forEach(cell => {
            tableHTML += `<th>${cell}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';
        
        tableRows.forEach(row => {
            if (row.length > 0) {
                tableHTML += '<tr>';
                row.forEach(cell => {
                    tableHTML += `<td>${cell}</td>`;
                });
                tableHTML += '</tr>';
            }
        });
        
        tableHTML += '</tbody></table>';
        return tableHTML;
    });
    
    // Convert paragraphs
    formatted = formatted
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?![<\s])/gm, '<p>')
        .replace(/(?<![>])$/gm, '</p>')
        .replace(/(<li>.*?<\/li>\s*)+/g, '<ul>$&</ul>');
    
    return formatted;
}

function convertMarkdownToText(content) {
    return content
        .replace(/^# (.*$)/gm, '$1\n' + '='.repeat(50) + '\n')
        .replace(/^## (.*$)/gm, '\n$1\n' + '-'.repeat(30) + '\n')
        .replace(/^### (.*$)/gm, '\n$1\n')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        .replace(/^\* /gm, '• ')
        .replace(/^(\d+)\. /gm, '$1. ');
}

function generateQuizHTML(quizData) {
    let html = `
        <div class="quiz-header">
            <h1>${quizData.topic}</h1>
            <p>Difficulty: ${quizData.difficulty} | Questions: ${quizData.questions.length}</p>
        </div>
    `;
    
    quizData.questions.forEach((question, index) => {
        html += `<div class="question">`;
        html += `<div class="question-title">${index + 1}. ${question.question}</div>`;
        
        if (question.type === 'mcq') {
            html += `<div class="options">`;
            question.options.forEach((option, optIndex) => {
                html += `<div class="option">○ ${option}</div>`;
            });
            html += `</div>`;
        } else if (question.type === 'oneword') {
            html += `<div class="answer-space">Answer: _________________</div>`;
        }
        
        html += `</div>`;
    });
    
    // Answer key
    html += `<div class="answer-key">`;
    html += `<h2>Answer Key</h2>`;
    quizData.questions.forEach((question, index) => {
        if (question.type === 'mcq') {
            const correctOption = question.options[question.correctAnswer];
            html += `<p>${index + 1}. ${correctOption}</p>`;
        } else if (question.type === 'oneword') {
            html += `<p>${index + 1}. ${question.answer}</p>`;
        }
    });
    html += `</div>`;
    
    return html;
}

// Modal Functions
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

// FAQ Functions
function toggleFAQ(element) {
    const faqItem = element.parentElement;
    const isActive = faqItem.classList.contains('active');
    
    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Open clicked item if it wasn't active
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

// Event Listeners for modals
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            activeModal.classList.remove('active');
        }
    }
});