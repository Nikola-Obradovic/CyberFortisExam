const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

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

// Get all questions
app.get('/api/questions', (req, res) => {
  db.all('SELECT * FROM questions ORDER BY order_num', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Submit quiz answers
app.post('/api/submit', (req, res) => {
  const { firstName, lastName, email, phone, answers } = req.body;

  // Validate input
  if (!firstName || !lastName || !email || !phone || !answers) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Get correct answers from database
  db.all('SELECT id, correct_answer FROM questions ORDER BY order_num', [], (err, questions) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Calculate score
    let correctCount = 0;
    const results = [];

    questions.forEach((q, index) => {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) correctCount++;

      results.push({
        questionId: q.id,
        userAnswer: userAnswer || 'Nije odgovoreno',
        correctAnswer: q.correct_answer,
        isCorrect
      });
    });

    const score = (correctCount / questions.length) * 100;
    const submissionDate = new Date().toISOString();

    // Save to database
    db.run(
      'INSERT INTO submissions (first_name, last_name, email, phone, answers, score, submission_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [firstName, lastName, email, phone, JSON.stringify(answers), score, submissionDate],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const submissionId = this.lastID;

        // Generate PDF
        generatePDF(
          submissionId,
          { firstName, lastName, email, phone },
          results,
          questions,
          score,
          submissionDate,
          (pdfPath) => {
            res.json({
              submissionId,
              score: score.toFixed(2),
              correctCount,
              totalQuestions: questions.length,
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
function generatePDF(submissionId, userInfo, results, questions, score, date, callback) {
  const doc = new PDFDocument({ margin: 50 });
  const pdfPath = path.join(resultsDir, `rezultat_${submissionId}.pdf`);
  const stream = fs.createWriteStream(pdfPath);

  doc.pipe(stream);

  // Register a font that supports UTF-8 Serbian characters
  // Try to use DejaVu Sans font (common on Linux systems)
  const fontPaths = [
    // Linux fonts
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    // macOS fonts (multiple options for compatibility)
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/System/Library/Fonts/Helvetica.ttc',
    '/Library/Fonts/Arial.ttf',
    '/System/Library/Fonts/SFNS.ttf',
    // Windows fonts
    'C:\\Windows\\Fonts\\arial.ttf',
    'C:\\Windows\\Fonts\\segoeui.ttf'
  ];

  let fontRegistered = false;
  for (const fontPath of fontPaths) {
    if (fs.existsSync(fontPath)) {
      doc.font(fontPath);
      fontRegistered = true;
      break;
    }
  }

  if (!fontRegistered) {
    console.warn('Warning: Could not find a TrueType font with UTF-8 support. Serbian characters may not display correctly.');
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
  doc.text(`Tačnih odgovora: ${results.filter(r => r.isCorrect).length} / ${questions.length}`);
  doc.moveDown(2);

  // Questions and answers
  doc.fontSize(14).text('Detaljni pregled odgovora:', { underline: true });
  doc.moveDown();

  // Get full question details
  db.all('SELECT * FROM questions ORDER BY order_num', [], (err, fullQuestions) => {
    if (err) {
      console.error('Error fetching questions for PDF:', err.message);
      doc.end();
      return;
    }

    fullQuestions.forEach((q, index) => {
      const result = results.find(r => r.questionId === q.id);

      // Question text
      doc.fontSize(11).fillColor('black').text(`${index + 1}. ${q.question_text}`);
      doc.moveDown(0.3);

      // Options
      doc.fontSize(10);
      doc.text(`   A. ${q.option_a}`);
      doc.text(`   B. ${q.option_b}`);
      doc.text(`   C. ${q.option_c}`);
      doc.text(`   D. ${q.option_d}`);
      doc.moveDown(0.3);

      if (result) {
        // User's answer with color
        if (result.isCorrect) {
          doc.fillColor('#008000').text(`   ✓ Vaš odgovor: ${result.userAnswer}`, { continued: false });
        } else {
          doc.fillColor('#FF0000').text(`   ✗ Vaš odgovor: ${result.userAnswer}`, { continued: false });
          doc.fillColor('#008000').text(`   ✓ Tačan odgovor: ${result.correctAnswer}`, { continued: false });
        }
        doc.fillColor('black');
      } else {
        doc.fillColor('#808080').text(`   Nije odgovoreno`, { continued: false });
        doc.fillColor('black');
      }

      doc.moveDown(1);

      // Add new page if needed
      if (index < fullQuestions.length - 1 && doc.y > 650) {
        doc.addPage();
      }
    });

    doc.end();
  });

  stream.on('finish', () => {
    callback(pdfPath);
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
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
