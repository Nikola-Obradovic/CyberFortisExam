// CMS JavaScript for Cyber Fortis Question Management

// State
let questions = [];
let currentQuestionId = null;
let validatedQuestions = null; // Holds validated questions for bulk import

// DOM Elements
const loginSection = document.getElementById('login-section');
const cmsSection = document.getElementById('cms-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const questionList = document.getElementById('question-list');
const questionForm = document.getElementById('question-form');
const editorPlaceholder = document.getElementById('editor-placeholder');
const addQuestionBtn = document.getElementById('add-question-btn');
const cancelBtn = document.getElementById('cancel-btn');
const deleteBtn = document.getElementById('delete-btn');
const formTitle = document.getElementById('form-title');
const formMessage = document.getElementById('form-message');
const viewSubmissionsBtn = document.getElementById('view-submissions-btn');
const submissionsModal = document.getElementById('submissions-modal');
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupEventListeners();
});

// Check if user is authenticated
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/cms/auth-status');
        const data = await response.json();

        if (data.authenticated) {
            showCMS();
            loadQuestions();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        showLogin();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Add new question
    addQuestionBtn.addEventListener('click', () => {
        switchToTab('single');
        showQuestionForm(null);
    });

    // Cancel editing
    cancelBtn.addEventListener('click', hideQuestionForm);

    // Question form submission
    questionForm.addEventListener('submit', handleQuestionSubmit);

    // Delete button
    deleteBtn.addEventListener('click', () => showDeleteModal());

    // Confirm delete
    confirmDeleteBtn.addEventListener('click', handleDelete);

    // View submissions
    viewSubmissionsBtn.addEventListener('click', showSubmissions);

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            submissionsModal.style.display = 'none';
            deleteModal.style.display = 'none';
        });
    });

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === submissionsModal) submissionsModal.style.display = 'none';
        if (e.target === deleteModal) deleteModal.style.display = 'none';
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchToTab(btn.dataset.tab);
        });
    });

    // Bulk import event listeners
    const validateBtn = document.getElementById('validate-json-btn');
    const importBtn = document.getElementById('import-json-btn');
    const bulkJsonTextarea = document.getElementById('bulk-json');

    if (validateBtn) {
        validateBtn.addEventListener('click', handleValidateJson);
    }

    if (importBtn) {
        importBtn.addEventListener('click', handleBulkImport);
    }

    // Reset validation when JSON changes
    if (bulkJsonTextarea) {
        bulkJsonTextarea.addEventListener('input', () => {
            validatedQuestions = null;
            const importBtn = document.getElementById('import-json-btn');
            if (importBtn) importBtn.disabled = true;
            const validationResult = document.getElementById('validation-result');
            if (validationResult) {
                validationResult.classList.remove('visible', 'success', 'error');
            }
        });
    }
}

// Switch tab
function switchToTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabName}`);
    });
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/cms/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            showCMS();
            loadQuestions();
            loginForm.reset();
            loginError.textContent = '';
        } else {
            loginError.textContent = data.error || 'Login failed';
        }
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = 'Connection error. Please try again.';
    }
}

// Handle Logout
async function handleLogout() {
    try {
        await fetch('/api/cms/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    }
    showLogin();
}

// Show/Hide Sections
function showLogin() {
    loginSection.style.display = 'flex';
    cmsSection.style.display = 'none';
}

function showCMS() {
    loginSection.style.display = 'none';
    cmsSection.style.display = 'flex';
}

// Load Questions
async function loadQuestions() {
    try {
        const response = await fetch('/api/cms/questions');

        if (response.status === 401) {
            showLogin();
            return;
        }

        questions = await response.json();
        renderQuestionList();
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

// Render Question List
function renderQuestionList() {
    questionList.innerHTML = '';

    questions.forEach(q => {
        const item = document.createElement('div');
        item.className = 'question-item' + (q.id === currentQuestionId ? ' active' : '');
        item.dataset.id = q.id;
        item.innerHTML = `
            <div class="question-number">Question ${q.order_num}</div>
            <div class="question-preview">${escapeHtml(q.question_text)}</div>
        `;
        item.addEventListener('click', () => showQuestionForm(q.id));
        questionList.appendChild(item);
    });
}

// Show Question Form
function showQuestionForm(questionId) {
    currentQuestionId = questionId;
    editorPlaceholder.style.display = 'none';
    questionForm.style.display = 'block';
    formMessage.style.display = 'none';

    // Update active state in list
    document.querySelectorAll('.question-item').forEach(item => {
        item.classList.toggle('active', parseInt(item.dataset.id) === questionId);
    });

    if (questionId) {
        // Edit existing question
        formTitle.textContent = 'Edit Question';
        deleteBtn.style.display = 'block';

        const question = questions.find(q => q.id === questionId);
        if (question) {
            document.getElementById('question-id').value = question.id;
            document.getElementById('order-num').value = question.order_num;
            document.getElementById('question-text').value = question.question_text;
            document.getElementById('option-a').value = question.option_a;
            document.getElementById('option-b').value = question.option_b;
            document.getElementById('option-c').value = question.option_c;
            document.getElementById('option-d').value = question.option_d;

            // Set correct answer radio
            const correctRadio = document.querySelector(`input[name="correct_answer"][value="${question.correct_answer}"]`);
            if (correctRadio) correctRadio.checked = true;
        }
    } else {
        // New question
        formTitle.textContent = 'Add New Question';
        deleteBtn.style.display = 'none';
        questionForm.reset();
        document.getElementById('question-id').value = '';

        // Set default order number
        const maxOrder = questions.reduce((max, q) => Math.max(max, q.order_num), 0);
        document.getElementById('order-num').value = maxOrder + 1;
    }
}

// Hide Question Form
function hideQuestionForm() {
    currentQuestionId = null;
    editorPlaceholder.style.display = 'flex';
    questionForm.style.display = 'none';
    formMessage.style.display = 'none';

    // Remove active state from list
    document.querySelectorAll('.question-item').forEach(item => {
        item.classList.remove('active');
    });
}

// Handle Question Submit
async function handleQuestionSubmit(e) {
    e.preventDefault();

    const questionId = document.getElementById('question-id').value;
    const correctAnswer = document.querySelector('input[name="correct_answer"]:checked');

    if (!correctAnswer) {
        showFormMessage('Please select the correct answer', 'error');
        return;
    }

    const questionData = {
        question_text: document.getElementById('question-text').value.trim(),
        option_a: document.getElementById('option-a').value.trim(),
        option_b: document.getElementById('option-b').value.trim(),
        option_c: document.getElementById('option-c').value.trim(),
        option_d: document.getElementById('option-d').value.trim(),
        correct_answer: correctAnswer.value,
        order_num: parseInt(document.getElementById('order-num').value)
    };

    try {
        const url = questionId
            ? `/api/cms/questions/${questionId}`
            : '/api/cms/questions';

        const method = questionId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(questionData)
        });

        if (response.status === 401) {
            showLogin();
            return;
        }

        const data = await response.json();

        if (response.ok) {
            showFormMessage(data.message || 'Question saved successfully', 'success');
            await loadQuestions();

            // If new question, select it
            if (!questionId && data.id) {
                currentQuestionId = data.id;
                document.getElementById('question-id').value = data.id;
                formTitle.textContent = 'Edit Question';
                deleteBtn.style.display = 'block';
            }

            // Re-render to show updated active state
            renderQuestionList();
        } else {
            showFormMessage(data.error || 'Failed to save question', 'error');
        }
    } catch (error) {
        console.error('Error saving question:', error);
        showFormMessage('Connection error. Please try again.', 'error');
    }
}

// Show Delete Modal
function showDeleteModal() {
    deleteModal.style.display = 'flex';
}

// Handle Delete
async function handleDelete() {
    if (!currentQuestionId) return;

    try {
        const response = await fetch(`/api/cms/questions/${currentQuestionId}`, {
            method: 'DELETE'
        });

        if (response.status === 401) {
            showLogin();
            return;
        }

        const data = await response.json();

        if (response.ok) {
            deleteModal.style.display = 'none';
            hideQuestionForm();
            await loadQuestions();
        } else {
            alert(data.error || 'Failed to delete question');
        }
    } catch (error) {
        console.error('Error deleting question:', error);
        alert('Connection error. Please try again.');
    }
}

// Show Submissions
async function showSubmissions() {
    try {
        const response = await fetch('/api/cms/submissions');

        if (response.status === 401) {
            showLogin();
            return;
        }

        const submissions = await response.json();
        const tbody = document.querySelector('#submissions-table tbody');
        tbody.innerHTML = '';

        if (submissions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">No submissions yet</td></tr>';
        } else {
            submissions.forEach(sub => {
                const scoreClass = sub.score >= 70 ? 'score-high' : (sub.score >= 50 ? 'score-medium' : 'score-low');
                const date = new Date(sub.submission_date).toLocaleString();

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${sub.id}</td>
                    <td>${escapeHtml(sub.first_name)} ${escapeHtml(sub.last_name)}</td>
                    <td>${escapeHtml(sub.email)}</td>
                    <td>${escapeHtml(sub.phone)}</td>
                    <td class="${scoreClass}">${sub.score.toFixed(1)}%</td>
                    <td>${date}</td>
                    <td><a href="/api/download/${sub.id}" target="_blank">Download</a></td>
                `;
                tbody.appendChild(row);
            });
        }

        submissionsModal.style.display = 'flex';
    } catch (error) {
        console.error('Error loading submissions:', error);
        alert('Failed to load submissions');
    }
}

// Show Form Message
function showFormMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = 'form-message ' + type;
    formMessage.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 3000);
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Validate JSON for bulk import
function handleValidateJson() {
    const bulkJson = document.getElementById('bulk-json').value.trim();
    const importBtn = document.getElementById('import-json-btn');

    validatedQuestions = null;
    importBtn.disabled = true;

    if (!bulkJson) {
        showValidationResult('error', 'Please paste JSON data first.');
        return;
    }

    let parsed;
    try {
        parsed = JSON.parse(bulkJson);
    } catch (e) {
        showValidationResult('error', `Invalid JSON syntax: ${e.message}`);
        return;
    }

    // Check if it's an array
    if (!Array.isArray(parsed)) {
        showValidationResult('error', 'JSON must be an array of question objects. Wrap your questions in [ ]');
        return;
    }

    if (parsed.length === 0) {
        showValidationResult('error', 'The array is empty. Add at least one question.');
        return;
    }

    // Validate each question
    const errors = [];
    const validQuestions = [];
    const requiredFields = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'];
    const validAnswers = ['A', 'B', 'C', 'D'];

    parsed.forEach((q, index) => {
        const questionNum = index + 1;
        const questionErrors = [];

        // Check for required fields
        requiredFields.forEach(field => {
            if (!q[field] || (typeof q[field] === 'string' && q[field].trim() === '')) {
                questionErrors.push(`Missing or empty "${field}"`);
            }
        });

        // Validate correct_answer
        if (q.correct_answer) {
            const answer = q.correct_answer.toString().toUpperCase().trim();
            if (!validAnswers.includes(answer)) {
                questionErrors.push(`correct_answer must be A, B, C, or D (got "${q.correct_answer}")`);
            }
        }

        // Check for unknown fields (warning only)
        const knownFields = [...requiredFields, 'order_num'];
        Object.keys(q).forEach(key => {
            if (!knownFields.includes(key)) {
                questionErrors.push(`Unknown field "${key}" will be ignored`);
            }
        });

        if (questionErrors.length > 0) {
            errors.push({
                questionNum,
                preview: q.question_text ? q.question_text.substring(0, 50) + '...' : '(no question text)',
                errors: questionErrors
            });
        } else {
            validQuestions.push({
                question_text: q.question_text.trim(),
                option_a: q.option_a.trim(),
                option_b: q.option_b.trim(),
                option_c: q.option_c.trim(),
                option_d: q.option_d.trim(),
                correct_answer: q.correct_answer.toUpperCase().trim(),
                order_num: q.order_num ? parseInt(q.order_num) : null
            });
        }
    });

    if (errors.length > 0) {
        let html = `<h4>Validation Failed</h4><p>${errors.length} question(s) have errors:</p><ul>`;
        errors.forEach(err => {
            html += `<li class="error-item">Question ${err.questionNum}: <span class="question-preview">${escapeHtml(err.preview)}</span>`;
            html += `<ul>`;
            err.errors.forEach(e => {
                html += `<li class="error-item">- ${escapeHtml(e)}</li>`;
            });
            html += `</ul></li>`;
        });
        html += '</ul>';
        showValidationResult('error', html, true);
    } else {
        validatedQuestions = validQuestions;
        importBtn.disabled = false;
        let html = `<h4>Validation Passed</h4>`;
        html += `<p class="success-item">${validQuestions.length} question(s) ready to import:</p><ul>`;
        validQuestions.forEach((q, i) => {
            html += `<li class="success-item">${i + 1}. ${escapeHtml(q.question_text.substring(0, 60))}${q.question_text.length > 60 ? '...' : ''}</li>`;
        });
        html += '</ul>';
        showValidationResult('success', html, true);
    }
}

// Show validation result
function showValidationResult(type, message, isHtml = false) {
    const validationResult = document.getElementById('validation-result');
    validationResult.classList.remove('success', 'error');
    validationResult.classList.add('visible', type);

    if (isHtml) {
        validationResult.innerHTML = message;
    } else {
        validationResult.innerHTML = `<h4>${type === 'success' ? 'Success' : 'Error'}</h4><p>${escapeHtml(message)}</p>`;
    }
}

// Handle bulk import
async function handleBulkImport() {
    if (!validatedQuestions || validatedQuestions.length === 0) {
        showBulkMessage('Please validate the JSON first.', 'error');
        return;
    }

    const importBtn = document.getElementById('import-json-btn');
    importBtn.disabled = true;
    importBtn.textContent = 'Importing...';

    try {
        const response = await fetch('/api/cms/questions/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions: validatedQuestions })
        });

        if (response.status === 401) {
            showLogin();
            return;
        }

        const data = await response.json();

        if (response.ok) {
            showBulkMessage(`Successfully imported ${data.imported} question(s)!`, 'success');
            // Clear the form
            document.getElementById('bulk-json').value = '';
            validatedQuestions = null;
            document.getElementById('validation-result').classList.remove('visible', 'success', 'error');
            // Reload questions list
            await loadQuestions();
        } else {
            showBulkMessage(data.error || 'Failed to import questions.', 'error');
        }
    } catch (error) {
        console.error('Error importing questions:', error);
        showBulkMessage('Connection error. Please try again.', 'error');
    } finally {
        importBtn.disabled = false;
        importBtn.textContent = 'Import Questions';
    }
}

// Show bulk import message
function showBulkMessage(message, type) {
    const bulkMessage = document.getElementById('bulk-message');
    bulkMessage.textContent = message;
    bulkMessage.className = 'form-message ' + type;
    bulkMessage.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            bulkMessage.style.display = 'none';
        }, 5000);
    }
}
