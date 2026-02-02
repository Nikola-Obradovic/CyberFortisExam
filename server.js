const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// CMS Configuration - Admin credentials from environment variables
const CMS_USERNAME = process.env.CMS_USERNAME;
const CMS_PASSWORD = process.env.CMS_PASSWORD;
const CMS_SECRET_PATH = process.env.CMS_SECRET_PATH || ''; // Dynamic UUID path for CMS

if (!CMS_USERNAME || !CMS_PASSWORD) {
  console.error('ERROR: CMS_USERNAME and CMS_PASSWORD environment variables must be set.');
  console.error('Example: CMS_USERNAME=admin CMS_PASSWORD=secret npm start');
  process.exit(1);
}

// Quiz Configuration
const QUESTIONS_PER_QUIZ = 20;

// Session storage (in-memory)
const sessions = new Map();
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Middleware
app.use(bodyParser.json());
app.use(cookieParser());

// Block direct access to cms.html and cms-related files when CMS_SECRET_PATH is set
app.use((req, res, next) => {
  if (CMS_SECRET_PATH) {
    // Block direct access to CMS files
    if (req.path === '/cms.html' || req.path === '/cms.js' || req.path === '/cms-styles.css') {
      return res.status(404).send('Not found');
    }
  }
  next();
});

// Serve CMS at secret path when CMS_SECRET_PATH is set
if (CMS_SECRET_PATH) {
  app.get(`/${CMS_SECRET_PATH}/cms.html`, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cms.html'));
  });
  app.get(`/${CMS_SECRET_PATH}/cms.js`, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cms.js'));
  });
  app.get(`/${CMS_SECRET_PATH}/cms-styles.css`, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cms-styles.css'));
  });
  // Serve images and other assets needed by CMS from secret path
  app.get(`/${CMS_SECRET_PATH}/:file`, (req, res, next) => {
    const file = req.params.file;
    const filePath = path.join(__dirname, 'public', file);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      next();
    }
  });
}

app.use(express.static('public'));

// CMS Authentication Middleware
function cmsAuth(req, res, next) {
  const sessionId = req.cookies.cms_session;
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized - Please login' });
  }

  const session = sessions.get(sessionId);
  if (Date.now() > session.expires) {
    sessions.delete(sessionId);
    return res.status(401).json({ error: 'Session expired - Please login again' });
  }

  // Refresh session expiry
  session.expires = Date.now() + SESSION_EXPIRY;
  next();
}

// Database connection
const db = new sqlite3.Database('./quiz.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the quiz database.');
});

// Create results directory if it doesn't exist
const resultsDir = path.join(__dirname, 'results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir);
}

// API Routes

// Get random questions for quiz (20 random questions from the pool)
app.get('/api/questions', (req, res) => {
  db.all('SELECT * FROM questions ORDER BY RANDOM() LIMIT ?', [QUESTIONS_PER_QUIZ], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Submit quiz answers
app.post('/api/submit', (req, res) => {
  const { firstName, lastName, email, phone, answers, questionIds } = req.body;

  // Validate input
  if (!firstName || !lastName || !email || !phone || !answers) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Get the question IDs that were asked in this quiz
  const askedQuestionIds = questionIds || Object.keys(answers).map(id => parseInt(id));

  if (askedQuestionIds.length === 0) {
    return res.status(400).json({ error: 'No questions answered' });
  }

  // Get only the questions that were asked in this quiz
  const placeholders = askedQuestionIds.map(() => '?').join(',');
  db.all(`SELECT id, correct_answer, question_text, option_a, option_b, option_c, option_d FROM questions WHERE id IN (${placeholders})`, askedQuestionIds, (err, questions) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Calculate score based only on asked questions
    let correctCount = 0;
    const results = [];

    questions.forEach((q) => {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) correctCount++;

      results.push({
        questionId: q.id,
        questionText: q.question_text,
        optionA: q.option_a,
        optionB: q.option_b,
        optionC: q.option_c,
        optionD: q.option_d,
        userAnswer: userAnswer || 'Nije odgovoreno',
        correctAnswer: q.correct_answer,
        isCorrect
      });
    });

    const totalQuestions = questions.length;
    const score = (correctCount / totalQuestions) * 100;
    const submissionDate = new Date().toISOString();

    // Save to database (store which questions were asked)
    const submissionData = {
      answers: answers,
      questionIds: askedQuestionIds
    };

    db.run(
      'INSERT INTO submissions (first_name, last_name, email, phone, answers, score, submission_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [firstName, lastName, email, phone, JSON.stringify(submissionData), score, submissionDate],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const submissionId = this.lastID;

        // Generate PDF with only the asked questions
        generatePDF(
          submissionId,
          { firstName, lastName, email, phone },
          results,
          totalQuestions,
          score,
          submissionDate,
          (pdfPath) => {
            res.json({
              submissionId,
              score: score.toFixed(2),
              correctCount,
              totalQuestions: totalQuestions,
              pdfPath
            });
          }
        );
      }
    );
  });
});

// Download PDF
app.get('/api/download/:submissionId', (req, res) => {
  const submissionId = req.params.submissionId;
  const pdfPath = path.join(resultsDir, `rezultat_${submissionId}.pdf`);

  if (fs.existsSync(pdfPath)) {
    res.download(pdfPath);
  } else {
    res.status(404).json({ error: 'PDF not found' });
  }
});

// Generate PDF function
function generatePDF(submissionId, userInfo, results, totalQuestions, score, date, callback) {
  const doc = new PDFDocument({ margin: 50 });
  const pdfPath = path.join(resultsDir, `rezultat_${submissionId}.pdf`);
  const stream = fs.createWriteStream(pdfPath);

  doc.pipe(stream);

  // Register a font that supports UTF-8 Serbian characters AND Unicode symbols (✓ ✗)
  const fontPaths = [
    // Linux fonts (DejaVu has excellent Unicode support including symbols)
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/TTF/DejaVuSans.ttf',
    // macOS fonts - prioritize fonts with good Unicode symbol support
    '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
    '/Library/Fonts/Arial Unicode.ttf',
    '/System/Library/Fonts/Apple Symbols.ttf',
    '/System/Library/Fonts/Supplemental/Apple Symbols.ttf',
    '/System/Library/Fonts/LucidaGrande.ttc',
    '/System/Library/Fonts/Supplemental/Lucida Grande.ttf',
    '/System/Library/Fonts/Menlo.ttc',
    // Windows fonts (Segoe UI has good symbol support)
    'C:\\Windows\\Fonts\\seguisym.ttf',
    'C:\\Windows\\Fonts\\segoeui.ttf',
    'C:\\Windows\\Fonts\\arial.ttf'
  ];

  let fontRegistered = false;
  for (const fontPath of fontPaths) {
    if (fs.existsSync(fontPath)) {
      try {
        doc.font(fontPath);
        fontRegistered = true;
        console.log(`PDF using font: ${fontPath}`);
        break;
      } catch (e) {
        // Font couldn't be loaded (e.g., .ttc files), try next
        continue;
      }
    }
  }

  if (!fontRegistered) {
    console.warn('Warning: Could not find a TrueType font with full Unicode support. Some symbols may not display correctly.');
  }

  // Title
  doc.fontSize(20).text('Cyber Fortis - Rezultati Kviza', { align: 'center' });
  doc.moveDown();

  // User information
  doc.fontSize(14).text('Informacije o kandidatu:', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`Ime: ${userInfo.firstName}`);
  doc.text(`Prezime: ${userInfo.lastName}`);
  doc.text(`Email: ${userInfo.email}`);
  doc.text(`Broj telefona: ${userInfo.phone}`);
  doc.text(`Datum: ${new Date(date).toLocaleString('sr-RS')}`);
  doc.moveDown();

  // Score summary
  doc.fontSize(14).text('Rezultat:', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`Ukupan rezultat: ${score.toFixed(2)}%`);
  doc.text(`Tačnih odgovora: ${results.filter(r => r.isCorrect).length} / ${totalQuestions}`);
  doc.moveDown(2);

  // Questions and answers
  doc.fontSize(14).text('Detaljni pregled odgovora:', { underline: true });
  doc.moveDown();

  // Use results directly (already contains question data)
  results.forEach((result, index) => {
    // Question text
    doc.fontSize(11).fillColor('black').text(`${index + 1}. ${result.questionText}`);
    doc.moveDown(0.3);

    // Options
    doc.fontSize(10);
    doc.text(`   A. ${result.optionA}`);
    doc.text(`   B. ${result.optionB}`);
    doc.text(`   C. ${result.optionC}`);
    doc.text(`   D. ${result.optionD}`);
    doc.moveDown(0.3);

    // User's answer with color
    if (result.isCorrect) {
      doc.fillColor('#008000').text(`   ✓ Vaš odgovor: ${result.userAnswer}`, { continued: false });
    } else {
      doc.fillColor('#FF0000').text(`   ✗ Vaš odgovor: ${result.userAnswer}`, { continued: false });
      doc.fillColor('#008000').text(`   ✓ Tačan odgovor: ${result.correctAnswer}`, { continued: false });
    }
    doc.fillColor('black');

    doc.moveDown(1);

    // Add new page if needed
    if (index < results.length - 1 && doc.y > 650) {
      doc.addPage();
    }
  });

  doc.end();

  stream.on('finish', () => {
    callback(pdfPath);
  });
}

// ==================== CMS API ROUTES ====================

// CMS Login
app.post('/api/cms/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (username !== CMS_USERNAME || password !== CMS_PASSWORD) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Create session
  const sessionId = uuidv4();
  sessions.set(sessionId, {
    createdAt: Date.now(),
    expires: Date.now() + SESSION_EXPIRY
  });

  res.cookie('cms_session', sessionId, {
    httpOnly: true,
    maxAge: SESSION_EXPIRY,
    sameSite: 'strict'
  });

  res.json({ success: true, message: 'Login successful' });
});

// CMS Logout
app.post('/api/cms/logout', (req, res) => {
  const sessionId = req.cookies.cms_session;
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.clearCookie('cms_session');
  res.json({ success: true, message: 'Logged out' });
});

// CMS Check Auth Status
app.get('/api/cms/auth-status', (req, res) => {
  const sessionId = req.cookies.cms_session;
  if (!sessionId || !sessions.has(sessionId)) {
    return res.json({ authenticated: false });
  }

  const session = sessions.get(sessionId);
  if (Date.now() > session.expires) {
    sessions.delete(sessionId);
    return res.json({ authenticated: false });
  }

  res.json({ authenticated: true });
});

// CMS Get All Questions (with auth)
app.get('/api/cms/questions', cmsAuth, (req, res) => {
  db.all('SELECT * FROM questions ORDER BY order_num', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// CMS Get Single Question
app.get('/api/cms/questions/:id', cmsAuth, (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM questions WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json(row);
  });
});

// CMS Create Question
app.post('/api/cms/questions', cmsAuth, (req, res) => {
  const { question_text, option_a, option_b, option_c, option_d, correct_answer, order_num } = req.body;

  // Validate required fields
  if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Validate correct_answer
  if (!['A', 'B', 'C', 'D'].includes(correct_answer.toUpperCase())) {
    return res.status(400).json({ error: 'Correct answer must be A, B, C, or D' });
  }

  // Get next order_num if not provided
  const getNextOrder = new Promise((resolve, reject) => {
    if (order_num) {
      resolve(order_num);
    } else {
      db.get('SELECT MAX(order_num) as max_order FROM questions', [], (err, row) => {
        if (err) reject(err);
        else resolve((row.max_order || 0) + 1);
      });
    }
  });

  getNextOrder.then(orderNum => {
    db.run(
      'INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, order_num) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [question_text, option_a, option_b, option_c, option_d, correct_answer.toUpperCase(), orderNum],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({
          success: true,
          id: this.lastID,
          message: 'Question created successfully'
        });
      }
    );
  }).catch(err => {
    res.status(500).json({ error: err.message });
  });
});

// CMS Update Question
app.put('/api/cms/questions/:id', cmsAuth, (req, res) => {
  const { id } = req.params;
  const { question_text, option_a, option_b, option_c, option_d, correct_answer, order_num } = req.body;

  // Validate required fields
  if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Validate correct_answer
  if (!['A', 'B', 'C', 'D'].includes(correct_answer.toUpperCase())) {
    return res.status(400).json({ error: 'Correct answer must be A, B, C, or D' });
  }

  db.run(
    'UPDATE questions SET question_text = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_answer = ?, order_num = ? WHERE id = ?',
    [question_text, option_a, option_b, option_c, option_d, correct_answer.toUpperCase(), order_num || 0, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Question not found' });
      }
      res.json({ success: true, message: 'Question updated successfully' });
    }
  );
});

// CMS Delete Question
app.delete('/api/cms/questions/:id', cmsAuth, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM questions WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ success: true, message: 'Question deleted successfully' });
  });
});

// CMS Get All Submissions (for viewing results)
app.get('/api/cms/submissions', cmsAuth, (req, res) => {
  db.all('SELECT * FROM submissions ORDER BY submission_date DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// CMS Bulk Import Questions
app.post('/api/cms/questions/bulk', cmsAuth, (req, res) => {
  const { questions } = req.body;

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Questions array is required and must not be empty' });
  }

  const requiredFields = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'];
  const validAnswers = ['A', 'B', 'C', 'D'];

  // Validate all questions first
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    for (const field of requiredFields) {
      if (!q[field] || (typeof q[field] === 'string' && q[field].trim() === '')) {
        return res.status(400).json({ error: `Question ${i + 1}: Missing or empty "${field}"` });
      }
    }
    if (!validAnswers.includes(q.correct_answer.toUpperCase())) {
      return res.status(400).json({ error: `Question ${i + 1}: correct_answer must be A, B, C, or D` });
    }
  }

  // Get current max order_num
  db.get('SELECT MAX(order_num) as max_order FROM questions', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    let currentOrder = (row.max_order || 0);

    // Insert all questions
    const stmt = db.prepare(
      'INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, order_num) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    let imported = 0;
    let errors = [];

    const insertNext = (index) => {
      if (index >= questions.length) {
        stmt.finalize();
        if (errors.length > 0) {
          return res.status(500).json({ error: `Imported ${imported} questions, but ${errors.length} failed`, errors });
        }
        return res.json({ success: true, imported, message: `Successfully imported ${imported} question(s)` });
      }

      const q = questions[index];
      const orderNum = q.order_num || (++currentOrder);

      stmt.run(
        [q.question_text.trim(), q.option_a.trim(), q.option_b.trim(), q.option_c.trim(), q.option_d.trim(), q.correct_answer.toUpperCase(), orderNum],
        function(err) {
          if (err) {
            errors.push({ index: index + 1, error: err.message });
          } else {
            imported++;
          }
          insertNext(index + 1);
        }
      );
    };

    insertNext(0);
  });
});

// CMS Reorder Questions
app.post('/api/cms/questions/reorder', cmsAuth, (req, res) => {
  const { orders } = req.body; // Array of { id, order_num }

  if (!orders || !Array.isArray(orders)) {
    return res.status(400).json({ error: 'Orders array is required' });
  }

  const updatePromises = orders.map(item => {
    return new Promise((resolve, reject) => {
      db.run('UPDATE questions SET order_num = ? WHERE id = ?', [item.order_num, item.id], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  Promise.all(updatePromises)
    .then(() => res.json({ success: true, message: 'Questions reordered successfully' }))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  if (CMS_SECRET_PATH) {
    console.log(`CMS available at http://localhost:${PORT}/${CMS_SECRET_PATH}/cms.html`);
  } else {
    console.log(`CMS available at http://localhost:${PORT}/cms.html`);
  }
  console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    }
    console.log('\nDatabase connection closed.');
    process.exit(0);
  });
});
