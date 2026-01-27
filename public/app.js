// Application state
let currentQuestionIndex = 0;
let questions = [];
let userAnswers = {};
let userInfo = {};
let submissionId = null;

// DOM elements
const registrationForm = document.getElementById('registration-form');
const quizSection = document.getElementById('quiz-section');
const resultsSection = document.getElementById('results-section');
const userForm = document.getElementById('user-form');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');
const progress = document.getElementById('progress');
const currentQuestionSpan = document.getElementById('current-question');
const totalQuestionsSpan = document.getElementById('total-questions');
const downloadBtn = document.getElementById('download-btn');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    userForm.addEventListener('submit', handleRegistrationSubmit);
    prevBtn.addEventListener('click', showPreviousQuestion);
    nextBtn.addEventListener('click', showNextQuestion);
    submitBtn.addEventListener('click', handleQuizSubmit);
    downloadBtn.addEventListener('click', downloadPDF);

    // Add real-time phone number validation
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', (e) => {
        // Remove any characters that are not digits or + at the start
        let value = e.target.value;
        // Allow + only at the beginning, and only digits elsewhere
        if (value.length > 0) {
            if (value[0] === '+') {
                value = '+' + value.slice(1).replace(/[^0-9]/g, '');
            } else {
                value = value.replace(/[^0-9]/g, '');
            }
            e.target.value = value;
        }
    });
});

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate phone number format (only numbers and optional + at the start)
function isValidPhone(phone) {
    const phoneRegex = /^\+?[0-9]+$/;
    return phoneRegex.test(phone);
}

// Handle registration form submission
async function handleRegistrationSubmit(e) {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();

    // Validate email
    if (!isValidEmail(email)) {
        alert('Molimo unesite ispravnu email adresu.');
        document.getElementById('email').focus();
        return;
    }

    // Validate phone number
    if (!isValidPhone(phone)) {
        alert('Molimo unesite ispravan broj telefona (samo brojevi, + je opciono na početku).');
        document.getElementById('phone').focus();
        return;
    }

    userInfo = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone
    };

    // Load questions
    try {
        const response = await fetch('/api/questions');
        const loadedQuestions = await response.json();

        if (loadedQuestions.length === 0) {
            alert('Greška: Nema dostupnih pitanja. Molimo vas da kontaktirate administratora.');
            return;
        }

        // Shuffle questions on frontend
        questions = shuffleArray(loadedQuestions);

        totalQuestionsSpan.textContent = questions.length;

        // Hide registration form and show quiz
        registrationForm.classList.add('hidden');
        quizSection.classList.remove('hidden');

        // Show first question
        showQuestion(0);
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Greška pri učitavanju pitanja. Molimo provjerite da li je server pokrenut.');
    }
}

// Show question by index
function showQuestion(index) {
    currentQuestionIndex = index;
    const question = questions[index];

    // Update question text
    questionText.textContent = question.question_text;

    // Update progress
    updateProgress();

    // Update question counter
    currentQuestionSpan.textContent = index + 1;

    // Clear previous options
    optionsContainer.innerHTML = '';

    // Create options
    const options = [
        { value: 'A', text: question.option_a },
        { value: 'B', text: question.option_b },
        { value: 'C', text: question.option_c },
        { value: 'D', text: question.option_d }
    ];

    // Shuffle options so the correct answer isn't always in the same position
    const shuffledOptions = shuffleArray(options);

    shuffledOptions.forEach(option => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `question-${question.id}`;
        radio.value = option.value;
        radio.id = `option-${question.id}-${option.value}`;

        // Check if this option was previously selected
        if (userAnswers[question.id] === option.value) {
            radio.checked = true;
            optionDiv.classList.add('selected');
        }

        const label = document.createElement('label');
        label.htmlFor = radio.id;
        // Don't show A, B, C, D labels to prevent users from knowing the answer position
        label.textContent = option.text;

        optionDiv.appendChild(radio);
        optionDiv.appendChild(label);

        // Add click handlers
        optionDiv.addEventListener('click', () => {
            radio.checked = true;
            handleOptionSelect(question.id, option.value);
        });

        radio.addEventListener('change', () => {
            handleOptionSelect(question.id, option.value);
        });

        optionsContainer.appendChild(optionDiv);
    });

    // Update navigation buttons
    updateNavigationButtons();
}

// Handle option selection
function handleOptionSelect(questionId, value) {
    userAnswers[questionId] = value;

    // Update UI to show selected option
    const options = optionsContainer.querySelectorAll('.option');
    options.forEach(opt => {
        opt.classList.remove('selected');
    });

    const selectedOption = document.querySelector(`#option-${questionId}-${value}`).parentElement;
    selectedOption.classList.add('selected');

    // Enable next/submit button after answer is selected
    updateNavigationButtons();
}

// Show previous question
function showPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        showQuestion(currentQuestionIndex - 1);
    }
}

// Show next question
function showNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        showQuestion(currentQuestionIndex + 1);
    }
}

// Update progress bar
function updateProgress() {
    const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
    progress.style.width = `${progressPercentage}%`;
}

// Update navigation buttons
function updateNavigationButtons() {
    // Previous button
    prevBtn.disabled = currentQuestionIndex === 0;

    // Check if current question is answered
    const currentQuestion = questions[currentQuestionIndex];
    const isAnswered = !!userAnswers[currentQuestion.id];

    // Next button and submit button
    if (currentQuestionIndex === questions.length - 1) {
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
        submitBtn.disabled = !isAnswered;
    } else {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
        nextBtn.disabled = !isAnswered;
    }
}

// Handle quiz submission
async function handleQuizSubmit() {
    // Check if all questions are answered
    const unansweredQuestions = questions.filter(q => !userAnswers[q.id]);

    if (unansweredQuestions.length > 0) {
        const confirmSubmit = confirm(
            `Niste odgovorili na ${unansweredQuestions.length} pitanje/a. Da li ste sigurni da želite završiti kviz?`
        );
        if (!confirmSubmit) {
            return;
        }
    }

    // Submit answers to server
    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
                email: userInfo.email,
                phone: userInfo.phone,
                answers: userAnswers
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Unknown error');
        }

        submissionId = result.submissionId;

        // Show results
        showResults(result);
    } catch (error) {
        console.error('Error submitting quiz:', error);
        alert('Greška pri slanju odgovora: ' + error.message);
    }
}

// Show results
function showResults(result) {
    quizSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
}

// Download PDF
function downloadPDF() {
    if (submissionId) {
        window.location.href = `/api/download/${submissionId}`;
    }
}
