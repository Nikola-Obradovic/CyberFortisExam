const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database
const db = new sqlite3.Database('./quiz.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the quiz database.');
});

// Create tables
db.serialize(() => {
  // Questions table
  db.run(`CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    order_num INTEGER NOT NULL
  )`, (err) => {
    if (err) {
      console.error('Error creating questions table:', err.message);
      return;
    }
    console.log('Questions table created successfully.');
  });

  // Submissions table
  db.run(`CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    answers TEXT NOT NULL,
    score REAL NOT NULL,
    submission_date TEXT NOT NULL
  )`, (err) => {
    if (err) {
      console.error('Error creating submissions table:', err.message);
      return;
    }
    console.log('Submissions table created successfully.');
  });

  // Clear existing questions and insert the 20 cybersecurity questions
  db.run('DELETE FROM questions', (err) => {
    if (err) {
      console.error('Error clearing questions:', err.message);
      return;
    }

    const questions = [
      {
        order_num: 1,
        question: 'Šta je DNS?',
        a: 'Protokol za komunikaciju između domena',
        b: 'Sistem za prevođenje domena u IP adrese',
        c: 'Firewall mehanizam',
        d: 'Enkripcijski algoritam za domene',
        correct: 'B'
      },
      {
        order_num: 2,
        question: 'Koji port se koristi za SSH?',
        a: '21',
        b: '22',
        c: '23',
        d: '3389',
        correct: 'B'
      },
      {
        order_num: 3,
        question: 'Šta znači pojam "least privilege"?',
        a: 'Korisnici imaju potpuni pristup sistemu',
        b: 'Pristup se daje samo kada je potreban',
        c: 'Samo administratori koriste sistem',
        d: 'Privilegije se ne mijenjaju',
        correct: 'B'
      },
      {
        order_num: 4,
        question: 'Koja tvrdnja opisuje Base64 encoding i njegovu ulogu u cyber sigurnosti?',
        a: 'Base64 je enkripcijski algoritam koji štiti podatke od neovlaštenog pristupa',
        b: 'Base64 je hash funkcija koja osigurava integritet podataka',
        c: 'Base64 je metoda enkodiranja koja omogućava siguran prenos binarnih podataka, ali ne pruža sigurnost sama po sebi',
        d: 'Base64 se koristi za autentifikaciju korisnika',
        correct: 'C'
      },
      {
        order_num: 5,
        question: 'Koji fajl u Linuxu sadrži informacije o korisnicima?',
        a: '/etc/network',
        b: '/etc/passwd',
        c: '/etc/hosts',
        d: '/var/log',
        correct: 'B'
      },
      {
        order_num: 6,
        question: 'Koja je osnovna razlika između IDS i IPS sistema?',
        a: 'IDS blokira napade, IPS samo loguje',
        b: 'IDS detektuje, IPS detektuje i aktivno reaguje',
        c: 'IDS je hardver, IPS je softver',
        d: 'Ne postoji razlika',
        correct: 'B'
      },
      {
        order_num: 7,
        question: 'Koji protokol omogućava siguran remote pristup serveru?',
        a: 'Telnet',
        b: 'FTP',
        c: 'SSH',
        d: 'HTTP',
        correct: 'C'
      },
      {
        order_num: 8,
        question: 'Firewall logovi pokazuju veliki broj konekcija sa iste IP adrese prema različitim portovima. Šta to najčešće ukazuje?',
        a: 'Normalan saobraćaj',
        b: 'Port scanning',
        c: 'Pristup djeljenim folderima',
        d: 'DNS problem',
        correct: 'B'
      },
      {
        order_num: 9,
        question: 'Koja je osnovna svrha SIEM sistema?',
        a: 'Aktivno blokiranje napada na endpointu',
        b: 'Centralizovano prikupljanje, korelacija i analiza logova',
        c: 'Enkripcija mrežnog saobraćaja',
        d: 'Upravljanje antivirusnim definicijama',
        correct: 'B'
      },
      {
        order_num: 10,
        question: 'Šta je log file?',
        a: 'Enkriptovani file',
        b: 'Sistemski file',
        c: 'Zapis aktivnosti sistema ili aplikacije',
        d: 'Konfiguracioni file',
        correct: 'C'
      },
      {
        order_num: 11,
        question: 'Primijetiš veliki broj konekcija na port 445. Na koji servis to najčešće ukazuje?',
        a: 'FTP',
        b: 'SMB / Windows file sharing',
        c: 'SMTP',
        d: 'HTTPS',
        correct: 'B'
      },
      {
        order_num: 12,
        question: 'Koji log na Windows serveru se koristi za analizu sumnjivih login pokušaja?',
        a: 'Application log',
        b: 'System log',
        c: 'Authentication / Security log',
        d: 'Backup log',
        correct: 'C'
      },
      {
        order_num: 13,
        question: 'Koji tip napada pokušava preplaviti sistem velikim brojem zahtjeva?',
        a: 'Phishing',
        b: 'SQL Injection',
        c: 'DDoS',
        d: 'Spoofing',
        correct: 'C'
      },
      {
        order_num: 14,
        question: 'Koja je razlika između antivirusnog (AV) rješenja i EDR-a?',
        a: 'AV štiti uređaje, EDR prati komunikaciju',
        b: 'AV reaguje samo na poznate signaturne prijetnje, EDR analizira ponašanje',
        c: 'EDR je samo firewall',
        d: 'AV je tehnološki napredniji od EDR-a',
        correct: 'B'
      },
      {
        order_num: 15,
        question: 'Koja je ključna razlika između phishing i spear phishing napada?',
        a: 'Phishing koristi malware, a spear phishing ne',
        b: 'Phishing cilja veliki broj nasumičnih korisnika, dok spear phishing cilja specifične osobe ili organizacije uz prethodno prikupljene informacije',
        c: 'Spear phishing se dešava samo putem e-maila, phishing ne',
        d: 'Phishing napade je lakše tehnički detektovati jer su uvijek personalizovani',
        correct: 'B'
      },
      {
        order_num: 16,
        question: 'Šta znači "defense in depth"?',
        a: 'Korištenje samo jednog jakog sigurnosnog alata',
        b: 'Fokus samo na mrežnu sigurnost',
        c: 'Korištenje više slojeva sigurnosnih mjera',
        d: 'Backup strategija',
        correct: 'C'
      },
      {
        order_num: 17,
        question: 'Koja je najveća sigurnosna prijetnja vezana za servisne naloge u domenskom okruženju?',
        a: 'Servisni nalozi se često ne koriste, pa predstavljaju mali rizik',
        b: 'Servisni nalozi često imaju visoke privilegije i rijetko se mijenjaju njihove lozinke',
        c: 'Servisni nalozi se automatski brišu nakon nekog vremena',
        d: 'Servisni nalozi ne mogu biti kompromitovani jer nemaju interaktivni login',
        correct: 'B'
      },
      {
        order_num: 18,
        question: 'U logovima vidiš pokušaje konekcije na port 23. Šta je NAJTAČNIJE objašnjenje?',
        a: 'Normalan web saobraćaj',
        b: 'SSH konekcija',
        c: 'Telnet pokušaj',
        d: 'DNS upit',
        correct: 'C'
      },
      {
        order_num: 19,
        question: 'Koji napad cilja ubacivanje zlonamjernog koda u SQL upite?',
        a: 'XSS',
        b: 'CSRF',
        c: 'SQL Injection',
        d: 'MITM',
        correct: 'C'
      },
      {
        order_num: 20,
        question: 'Koja tvrdnja NAJTAČNIJE opisuje ulogu enkripcije, provjere integriteta i AES algoritma u sigurnoj komunikaciji?',
        a: 'AES se koristi za provjeru integriteta poruke, dok se hash funkcije koriste za enkripciju',
        b: 'Enkripcija (npr. AES) osigurava povjerljivost podataka, dok se provjera integriteta postiže korištenjem hash funkcija ili MAC-ova kako bi se otkrile izmjene podataka',
        c: 'Provjera integriteta zamjenjuje potrebu za enkripcijom',
        d: 'AES je asimetrični algoritam koji se koristi za razmjenu ključeva',
        correct: 'B'
      }
    ];

    const stmt = db.prepare(`INSERT INTO questions
      (order_num, question_text, option_a, option_b, option_c, option_d, correct_answer)
      VALUES (?, ?, ?, ?, ?, ?, ?)`);

    questions.forEach(q => {
      stmt.run(q.order_num, q.question, q.a, q.b, q.c, q.d, q.correct, (err) => {
        if (err) {
          console.error('Error inserting question:', err.message);
        }
      });
    });

    stmt.finalize((err) => {
      if (err) {
        console.error('Error finalizing statement:', err.message);
      } else {
        console.log('Successfully inserted all 20 questions.');
      }

      // Close database after all operations complete
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database initialized and closed successfully.');
        }
      });
    });
  });
});
