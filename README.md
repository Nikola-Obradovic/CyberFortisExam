# Cyber Fortis - Quiz aplikacija za zapošljavanje

Offline quiz aplikacija za procjenu kandidata koji aplikuju za posao u Cyber Fortis-u. Aplikacija sadrži 20 pitanja iz oblasti Cybersecurity-ja i radi potpuno lokalno bez potrebe za internetom.

## Karakteristike

- Potpuno offline funkcionisanje
- 20 pitanja iz oblasti Cybersecurity-ja
- Mogućnost prelaska na prethodno/sledeće pitanje
- Promjena odgovora u bilo kom trenutkuF
- Automatsko generisanje PDF rezultata
- Lokalna SQLite baza podataka
- Jednostavan web interfejs
- **Desktop launcher** - Pokretanje aplikacije jednim klikom (Windows, macOS, Linux)
- **Fullscreen mod** - Automatski fullscreen za fokusiranje kandidata
- **Auto-zatvaranje** - Browser se automatski zatvara nakon završetka kviza

## Brzo pokretanje (Quick Start)

Nakon što ste instalirali Node.js, možete pokrenuti aplikaciju jednostavno:

### Linux/macOS:
```bash
./start.sh
```

### Windows:
```cmd
start.bat
```

Skripta će automatski:
1. Instalirati zavisnosti (ako nisu već instalirane)
2. Inicijalizovati bazu podataka (ako već ne postoji)
3. Pokrenuti server na http://localhost:3000

## Tehnologije

- **Backend**: Node.js, Express
- **Database**: SQLite3
- **Frontend**: HTML, CSS, JavaScript
- **PDF generisanje**: PDFKit

## Preduvjeti

Prije pokretanja aplikacije, potrebno je imati instalirano:

- [Node.js](https://nodejs.org/) (verzija 14 ili novija)
- npm (dolazi sa Node.js instalacijom)

### Dodatni preduvjeti za macOS

Na Mac-u je potrebno instalirati Xcode Command Line Tools za kompilaciju sqlite3 modula:

```bash
xcode-select --install
```

Alternativno, ako koristite Homebrew:

```bash
brew install node
```

Homebrew instalacija Node.js-a automatski podešava sve potrebne alate za kompilaciju.

## Instalacija i pokretanje

### 1. Instalacija Node.js zavisnosti

Otvorite terminal/command prompt u folderu projekta i pokrenite:

```bash
npm install
```

Ova komanda će instalirati sve potrebne pakete:
- express
- sqlite3
- pdfkit
- body-parser

### 2. Inicijalizacija baze podataka

Kreirajte i popunite bazu podataka sa pitanjima:

```bash
npm run init-db
```

Ova komanda će:
- Kreirati SQLite bazu podataka (`quiz.db`)
- Kreirati tabele (`questions` i `submissions`)
- Dodati 20 pitanja iz oblasti Cybersecurity-ja

Trebali biste vidjeti poruke:
```
Connected to the quiz database.
Questions table created successfully.
Submissions table created successfully.
Successfully inserted all 20 questions.
Database initialized and closed successfully.
```

### 3. Pokretanje aplikacije

Pokrenite server:

```bash
npm start
```

Server će se pokrenuti na portu 3000. Trebali biste vidjeti:
```
Connected to the quiz database.
Server is running on http://localhost:3000
Press Ctrl+C to stop the server
```

### 4. Pristup aplikaciji

Otvorite web browser i idite na:

```
http://localhost:3000
```

### 5. Zaustavljanje aplikacije

Za zaustavljanje servera pritisnite `Ctrl+C` u terminalu.

## Kako koristiti aplikaciju

### Korak 1: Registracija kandidata
Kandidat unosi:
- Ime
- Prezime
- Email adresu
- Broj telefona

### Korak 2: Rješavanje kviza
- Prikazuju se pitanja jedno po jedno
- Kandidat bira jedan od ponuđenih odgovora (A, B, C ili D)
- Dugme "Prethodno" omogućava vraćanje na prethodno pitanje
- Dugme "Sledeće" vodi na sledeće pitanje
- Odgovori se mogu mijenjati u bilo kom trenutku
- Progres bar pokazuje napredak kroz kviz

### Korak 3: Završetak kviza
Nakon završetka kviza:
- Prikazuje se poruka: "Hvala što ste učestvovali, kontaktirat ćemo Vas uskoro!"
- PDF dokument sa detaljnim rezultatima se automatski generiše i čuva na serveru
- PDF sadrži:
  - Informacije o kandidatu
  - Svako pitanje sa ponuđenim odgovorima
  - Kandidatov odgovor vs tačan odgovor sa bojama
  - ✓ Zelena oznaka za tačne odgovore
  - ✗ Crvena oznaka za netačne odgovore sa prikazom tačnog odgovora
  - Ukupan procenat uspješnosti

## Struktura projekta

```
CyberFortisExam/
│
├── public/                  # Frontend fajlovi
│   ├── index.html          # Glavni HTML fajl
│   ├── styles.css          # Stilovi
│   ├── app.js              # JavaScript logika
│   └── Logo.png            # Logo aplikacije
│
├── results/                # PDF rezultati se čuvaju ovdje
│
├── CyberFortisQuiz.app/    # macOS aplikacija
│
├── server.js               # Express server
├── init-db.js              # Script za inicijalizaciju baze
├── package.json            # npm zavisnosti
├── quiz.db                 # SQLite baza podataka (kreira se nakon init-db)
│
├── start.sh                # Jednostavno pokretanje (Linux/macOS)
├── start.bat               # Jednostavno pokretanje (Windows)
├── launch-quiz.sh          # Pokretač sa browserom (Linux/macOS)
├── launch-quiz.bat         # Pokretač sa browserom (Windows)
├── launch-quiz.vbs         # Pokretač bez konzole (Windows)
├── create-desktop-shortcut.sh   # Kreiranje prečice (Linux/macOS)
├── create-desktop-shortcut.bat  # Kreiranje prečice (Windows)
│
└── README.md               # Ova dokumentacija
```

## Pristup bazi podataka

### Korištenje SQLite komandne linije

#### Windows:

1. Preuzmite SQLite tools sa [sqlite.org/download.html](https://www.sqlite.org/download.html)
2. Ekstraktujte `sqlite3.exe`
3. Otvorite command prompt u folderu projekta
4. Pokrenite:
```bash
sqlite3 quiz.db
```

#### Linux/macOS:

SQLite je obično već instaliran. U terminalu:

```bash
sqlite3 quiz.db
```

### Osnovne SQL komande

#### Prikaz svih tabela:
```sql
.tables
```

#### Pregled strukture tabele:
```sql
.schema questions
.schema submissions
```

#### Pregled svih pitanja:
```sql
SELECT * FROM questions;
```

#### Pregled svih rezultata:
```sql
SELECT id, first_name, last_name, email, score, submission_date
FROM submissions
ORDER BY submission_date DESC;
```

#### Pregled određenog rezultata:
```sql
SELECT * FROM submissions WHERE id = 1;
```

#### Statistika rezultata:
```sql
SELECT
    COUNT(*) as total_submissions,
    AVG(score) as average_score,
    MAX(score) as highest_score,
    MIN(score) as lowest_score
FROM submissions;
```

#### Pregled PDF rezultata kroz bazu:
```sql
-- Prikaži putanju do PDF fajla za određeni submission
SELECT 'results/rezultat_' || id || '.pdf' as pdf_path
FROM submissions
WHERE id = 1;
```

#### Formatiran prikaz tabele:
```sql
-- Uključi header-e i mod za lijepi prikaz
.headers on
.mode column

-- Prikaži sve submission-e sa formatiranjem
SELECT id, first_name, last_name, email, ROUND(score, 2) || '%' as score
FROM submissions
ORDER BY submission_date DESC;
```

#### Izlaz iz SQLite:
```sql
.quit
```

## Pristup bazi za developere - Brzi pristup

### Pregled svih submission-a iz terminala

```bash
# Otvorite terminal u folderu projekta i pokrenite:
sqlite3 quiz.db "SELECT id, first_name, last_name, email, phone, ROUND(score,2) as score, submission_date FROM submissions ORDER BY submission_date DESC;"
```

### Pregled određenog submission-a

```bash
# Zamijenite '1' sa ID-em submission-a
sqlite3 quiz.db "SELECT * FROM submissions WHERE id = 1;"
```

### Statistika

```bash
sqlite3 quiz.db "SELECT COUNT(*) as total, AVG(score) as avg_score, MAX(score) as max_score, MIN(score) as min_score FROM submissions;"
```

### Pregled svih pitanja

```bash
sqlite3 quiz.db "SELECT id, order_num, question_text, correct_answer FROM questions ORDER BY order_num;"
```

### Korištenje DB Browser for SQLite (GUI)

Za lakši pristup bazi podataka možete koristiti grafički alat:

1. Preuzmite [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Instalirajte program
3. Otvorite fajl `quiz.db` iz foldera projekta
4. Pregledajte tabele, izvršavajte upite, eksportujte podatke

### Direktno iz Node.js

Možete kreirati jednostavan script za čitanje baze:

```javascript
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./quiz.db');

db.all('SELECT * FROM submissions', [], (err, rows) => {
  if (err) throw err;
  console.log(rows);
});

db.close();
```

## Dodavanje novih pitanja (budući CMS)

Trenutno se pitanja dodaju kroz `init-db.js` fajl. Za dodavanje novih pitanja:

1. Otvorite `init-db.js`
2. Dodajte novi objekat u `questions` niz:

```javascript
{
  order_num: 21,
  question: 'Tekst pitanja?',
  a: 'Opcija A',
  b: 'Opcija B',
  c: 'Opcija C',
  d: 'Opcija D',
  correct: 'B'  // Tačan odgovor
}
```

3. Pokrenite ponovo `npm run init-db`

**Napomena**: U budućnosti će biti razvijen CMS (Content Management System) za lakše upravljanje pitanjima kroz web interfejs.

## Backup baze podataka

Za čuvanje backup-a:

```bash
# Linux/macOS
cp quiz.db quiz_backup_$(date +%Y%m%d).db

# Windows
copy quiz.db quiz_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.db
```

## Troubleshooting

### Problem: `npm install` ne radi

**Rješenje**: Provjerite da li je Node.js pravilno instaliran:
```bash
node --version
npm --version
```

### Problem: Greška pri instalaciji sqlite3 na macOS

**Rješenje**: Instalirajte Xcode Command Line Tools:
```bash
xcode-select --install
```

Ako i dalje ne radi, pokušajte:
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

### Problem: `start.sh` se ne može pokrenuti na macOS

**Rješenje**: Dodajte execute permisije:
```bash
chmod +x start.sh
./start.sh
```

### Problem: Port 3000 je zauzet

**Rješenje**: Promijenite port u `server.js`:
```javascript
const PORT = 3001; // ili bilo koji drugi slobodan port
```

### Problem: Baza podataka se ne kreira

**Rješenje**:
1. Provjerite da li imate write permisije u folderu
2. Obrišite `quiz.db` ako postoji i pokrenite ponovo `npm run init-db`

### Problem: PDF se ne generiše

**Rješenje**:
1. Provjerite da li postoji folder `results/`
2. Ako ne postoji, kreiraće se automatski pri prvom pokretanju servera

### Problem: Pitanja nisu na pravom jeziku (čudni karakteri)

**Rješenje**:
- Provjerite da su svi fajlovi sačuvani u UTF-8 enkodingu
- SQLite i Node.js pravilno podržavaju UTF-8 karaktere

## Sigurnosne napomene

Ova aplikacija je dizajnirana za **lokalno korištenje**:
- Nema autentifikacije korisnika
- Nema enkripcije podataka
- Ne bi trebala biti izložena na internetu bez dodatnih sigurnosnih mjera

## Desktop Launcher (Pokretač)

Aplikacija uključuje desktop pokretače za sve platforme koji omogućavaju jednostavno pokretanje kviza jednim klikom.

### Karakteristike pokretača

- **Automatsko pokretanje servera** - Server se pokreće u pozadini
- **Fullscreen mod** - Browser se otvara u fullscreen modu za fokusiranje kandidata
- **Automatsko zatvaranje** - Nakon završetka kviza, browser se automatski zatvara nakon 3 sekunde

### Kreiranje desktop prečice

#### macOS:
```bash
chmod +x create-desktop-shortcut.sh
./create-desktop-shortcut.sh
```
Ovo će:
- Kreirati macOS aplikaciju sa ikonom
- Instalirati je u Applications folder
- Kreirati prečicu na Desktop-u

#### Linux:
```bash
chmod +x create-desktop-shortcut.sh
./create-desktop-shortcut.sh
```
Ovo će:
- Kreirati .desktop fajl u `~/.local/share/applications/`
- Kreirati prečicu na Desktop-u

**Napomena**: Na nekim Linux distribucijama potrebno je desnim klikom na ikonu odabrati "Allow Launching" ili "Trust and Launch".

#### Windows:
```cmd
create-desktop-shortcut.bat
```
Ovo će kreirati prečicu na Desktop-u sa ikonom aplikacije.

### Ručno pokretanje

Ako ne želite koristiti desktop prečicu, možete pokrenuti aplikaciju ručno:

#### macOS/Linux:
```bash
./launch-quiz.sh
```

#### Windows:
Dvostruki klik na `launch-quiz.vbs` (pokreće bez vidljive konzole)
ili
```cmd
launch-quiz.bat
```

### Preporučeni browser

Za najbolje iskustvo u kiosk/fullscreen modu, preporučuje se **Google Chrome** ili **Chromium**. Safari i Firefox takođe rade, ali bez pune kiosk podrške.

## Budući razvoj

Planirane funkcionalnosti:
- [ ] CMS za upravljanje pitanjima
- [ ] Autentifikacija administratora
- [ ] Kategorije pitanja
- [ ] Težina pitanja
- [ ] Nasumični redoslijed pitanja
- [ ] Timer za kviz
- [ ] Export rezultata u Excel
- [ ] Dashboard sa statistikama

## Podrška

Za dodatne informacije ili probleme kontaktirajte IT tim Cyber Fortis-a.

## Licenca

Ovaj softver je vlasništvo Cyber Fortis-a i namijenjen je isključivo za internu upotrebu.
