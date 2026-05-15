// src/components/dashboard/widgets/AptitudeMiniQuiz.jsx
// 3-question daily aptitude quiz — static question bank, 60s timer per question.
// Quiz state is persisted in localStorage keyed to today's date so it resets daily.
// Zero API calls.

import { useState, useEffect, useRef, useMemo } from 'react';
import { Brain, Clock, CheckCircle2, XCircle, ArrowRight, RefreshCw, Trophy } from 'lucide-react';

// ─── Question bank ────────────────────────────────────────────────────────────
// 60 questions: 20 Quantitative · 20 Verbal · 20 Logical
const BANK = [
  // ── Quantitative (Q) ─────────────────────────────────────────────────────
  { id:'q1',  cat:'Quantitative', q:'If 20% of a number is 40, what is 30% of that number?',                             opts:['50','55','60','65'],   ans:2 },
  { id:'q2',  cat:'Quantitative', q:'A train 150 m long passes a pole in 15 s. Find its speed in km/h.',                  opts:['36','40','54','60'],   ans:0 },
  { id:'q3',  cat:'Quantitative', q:'The ratio of two numbers is 3:5. Their LCM is 75. What is their HCF?',               opts:['3','5','15','25'],     ans:1 },
  { id:'q4',  cat:'Quantitative', q:'A shopkeeper marks goods 25% above cost and gives 10% discount. Profit %?',          opts:['10.5%','12.5%','15%','17.5%'], ans:1 },
  { id:'q5',  cat:'Quantitative', q:'Pipes A and B fill a tank in 12 h and 15 h. Both open together — time to fill?',     opts:['6 h','6 h 20 min','6 h 40 min','7 h'], ans:2 },
  { id:'q6',  cat:'Quantitative', q:'Simple interest on ₹8000 at 10% p.a. for 2½ years is?',                             opts:['₹1600','₹1800','₹2000','₹2500'], ans:2 },
  { id:'q7',  cat:'Quantitative', q:'What is the value of √(0.0001)?',                                                    opts:['0.001','0.01','0.1','1'],       ans:1 },
  { id:'q8',  cat:'Quantitative', q:'If a:b = 2:3 and b:c = 4:5, find a:b:c.',                                           opts:['8:12:15','6:9:12','4:6:8','2:3:5'], ans:0 },
  { id:'q9',  cat:'Quantitative', q:'A can do a work in 10 days, B in 15 days. A works alone for 5 days, then B joins. Days to finish?', opts:['8','9','10','11'], ans:2 },
  { id:'q10', cat:'Quantitative', q:'Compound interest on ₹10000 at 10% p.a. for 2 years?',                              opts:['₹2000','₹2050','₹2100','₹2200'], ans:2 },
  { id:'q11', cat:'Quantitative', q:'The average of five numbers is 27. If one number is excluded, average becomes 25. Excluded number?',opts:['35','37','40','33'], ans:0 },
  { id:'q12', cat:'Quantitative', q:'A number when divided by 56 gives remainder 29. Remainder when divided by 8?',       opts:['3','5','7','4'], ans:1 },
  { id:'q13', cat:'Quantitative', q:'Speed of a boat in still water is 15 km/h, stream is 3 km/h. Upstream speed?',       opts:['18 km/h','12 km/h','11 km/h','13 km/h'], ans:1 },
  { id:'q14', cat:'Quantitative', q:'In how many ways can 4 boys and 3 girls sit in a row so that no two girls sit together?', opts:['720','1440','5040','2880'], ans:1 },
  { id:'q15', cat:'Quantitative', q:'The sum of first 50 natural numbers is?',                                            opts:['1275','1225','1250','1350'], ans:0 },
  { id:'q16', cat:'Quantitative', q:'15% of 180 + 20% of 150 = ?',                                                       opts:['57','60','55','62'], ans:0 },
  { id:'q17', cat:'Quantitative', q:'A rectangle\'s length is 3 times its breadth. Perimeter = 96 cm. Area?',             opts:['432 cm²','540 cm²','480 cm²','432 cm²'], ans:0 },
  { id:'q18', cat:'Quantitative', q:'If 6 men can do a piece of work in 10 days, 10 men can do it in how many days?',     opts:['4','5','6','8'], ans:2 },
  { id:'q19', cat:'Quantitative', q:'What is the next number in: 2, 6, 12, 20, 30, ?',                                   opts:['40','42','44','48'], ans:1 },
  { id:'q20', cat:'Quantitative', q:'If x + y = 12 and xy = 35, find x² + y².',                                          opts:['74','100','144','144'], ans:0 },
  // ── Verbal (V) ────────────────────────────────────────────────────────────
  { id:'v1',  cat:'Verbal', q:'Choose the synonym of LUCID.',                                           opts:['Confused','Clear','Murky','Cloudy'],    ans:1 },
  { id:'v2',  cat:'Verbal', q:'Choose the antonym of BENEVOLENT.',                                     opts:['Kind','Generous','Malicious','Caring'],  ans:2 },
  { id:'v3',  cat:'Verbal', q:'Fill in: "The committee ___ decided to postpone the meeting."',          opts:['have','has','had','having'],             ans:1 },
  { id:'v4',  cat:'Verbal', q:'Identify the error: "She don\'t know what she is doing."',              opts:['She','don\'t','know','doing'],            ans:1 },
  { id:'v5',  cat:'Verbal', q:'Rearrange: P-river Q-the R-across S-swam T-man U-the to make a sentence.', opts:['TUSPQR','TUSPRQ','TUSRPQ','UTSRQP'],  ans:1 },
  { id:'v6',  cat:'Verbal', q:'Choose the correctly spelled word.',                                     opts:['Accomodate','Accommodate','Acommodate','Acomodate'], ans:1 },
  { id:'v7',  cat:'Verbal', q:'The idiom "bite the bullet" means:',                                     opts:['To cheat','To endure pain stoically','To quit','To lie'], ans:1 },
  { id:'v8',  cat:'Verbal', q:'Select the word that means "to make amends for wrongdoing":',            opts:['Atone','Condone','Pardon','Forgive'],    ans:0 },
  { id:'v9',  cat:'Verbal', q:'"Neither the manager nor the employees ___ satisfied." — correct verb?', opts:['is','was','are','were'],                 ans:2 },
  { id:'v10', cat:'Verbal', q:'Analogy — Book : Library :: Painting : ?',                              opts:['Artist','Museum','Canvas','Gallery'],    ans:3 },
  { id:'v11', cat:'Verbal', q:'Choose the one-word substitute: "One who hates mankind".',               opts:['Misanthrope','Philanthropist','Egoist','Altruist'], ans:0 },
  { id:'v12', cat:'Verbal', q:'Indirect speech: He said, "I am tired." →',                             opts:['He said he is tired.','He said he was tired.','He said he were tired.','He told he was tired.'], ans:1 },
  { id:'v13', cat:'Verbal', q:'"The book ___ on the table since morning." — correct form?',            opts:['is lying','has been lying','was lying','had lain'], ans:1 },
  { id:'v14', cat:'Verbal', q:'Odd one out: Rose, Lily, Jasmine, Mango.',                              opts:['Rose','Lily','Jasmine','Mango'],          ans:3 },
  { id:'v15', cat:'Verbal', q:'Choose the correct passive voice: "She wrote a letter."',               opts:['A letter is written by her.','A letter was written by her.','A letter has been written.','A letter had been written.'], ans:1 },
  { id:'v16', cat:'Verbal', q:'The word EPHEMERAL means:',                                             opts:['Lasting','Short-lived','Eternal','Recurring'], ans:1 },
  { id:'v17', cat:'Verbal', q:'Passage inference: "All managers are leaders. Some leaders are visionaries." Can we conclude all managers are visionaries?', opts:['Yes, definitely','No, not necessarily','Yes, by inference','Cannot be determined'], ans:1 },
  { id:'v18', cat:'Verbal', q:'Which sentence is grammatically correct?',                              opts:['He is more smarter than me.','He is smarter than me.','He is most smarter.','He is smart more than me.'], ans:1 },
  { id:'v19', cat:'Verbal', q:'Preposition: "She is good ___ mathematics."',                           opts:['in','at','on','with'],                   ans:1 },
  { id:'v20', cat:'Verbal', q:'The ANTONYM of TACITURN is:',                                           opts:['Silent','Reserved','Talkative','Morose'], ans:2 },
  // ── Logical (L) ───────────────────────────────────────────────────────────
  { id:'l1',  cat:'Logical', q:'Series: 2, 5, 10, 17, 26, ?',                                         opts:['36','37','38','35'],                    ans:1 },
  { id:'l2',  cat:'Logical', q:'Odd one out: 8, 27, 64, 100, 125.',                                   opts:['8','27','100','125'],                   ans:2 },
  { id:'l3',  cat:'Logical', q:'A is to the North of B. C is to the East of B. In which direction is A relative to C?', opts:['North','South','North-West','North-East'], ans:2 },
  { id:'l4',  cat:'Logical', q:'Coding: In a certain language, BATTER = DCVVGT. What is MASTER?',    opts:['OCUVGT','OCUVGR','OBUVGT','OCUVGQ'],    ans:0 },
  { id:'l5',  cat:'Logical', q:'If P + Q means P is father of Q, P × Q means P is sister of Q, P – Q means P is mother of Q, then M – N + O means:', opts:['M is grandmother of O','O is grandson of M','M is mother of O\'s father','M is aunt of O'], ans:0 },
  { id:'l6',  cat:'Logical', q:'A clock shows 3:15. What is the angle between hour and minute hands?', opts:['0°','7.5°','15°','22.5°'],              ans:1 },
  { id:'l7',  cat:'Logical', q:'Statements: All A are B. All B are C. Conclusion: All A are C?',      opts:['True','False','Partially true','Cannot determine'], ans:0 },
  { id:'l8',  cat:'Logical', q:'A cube is painted red on all faces then cut into 27 equal smaller cubes. How many have no painted face?', opts:['1','4','6','8'], ans:0 },
  { id:'l9',  cat:'Logical', q:'Series: AZ, CX, EV, GT, ?',                                          opts:['HR','IS','IR','IQ'],                    ans:2 },
  { id:'l10', cat:'Logical', q:'Blood relation: Pointing to a boy, a woman says, "His mother is my mother\'s only daughter." How is the woman related to the boy?', opts:['Aunt','Mother','Sister','Grandmother'], ans:1 },
  { id:'l11', cat:'Logical', q:'How many triangles are in a regular pentagram (5-pointed star)?',      opts:['5','10','11','15'],                     ans:1 },
  { id:'l12', cat:'Logical', q:'Mirror image: If PENCIL is mirrored, which letter appears first?',    opts:['L','P','E','N'],                        ans:0 },
  { id:'l13', cat:'Logical', q:'Seating: 5 people sit in a circle. How many distinct arrangements?',  opts:['120','24','60','5'],                    ans:1 },
  { id:'l14', cat:'Logical', q:'Which number should replace ?: 3 9 27 81 ?',                          opts:['162','243','324','729'],                ans:1 },
  { id:'l15', cat:'Logical', q:'Dice rolled: if 1 is opposite to 5, 2 is opposite to 4, 3 is opposite to 6 — what is opposite 3?', opts:['1','4','6','2'], ans:2 },
  { id:'l16', cat:'Logical', q:'Ranking: In a row of 20, Anu is 8th from the left and Binu is 12th from the right. How many between them?', opts:['0','1','2','3'], ans:0 },
  { id:'l17', cat:'Logical', q:'Matrix: 4 9 16 \\ 25 36 49 \\ 64 81 ? What replaces ?',              opts:['100','99','90','121'],                  ans:0 },
  { id:'l18', cat:'Logical', q:'Code: if CAT = 48, DOG = 52, then COT = ?',                          opts:['48','50','54','52'],                    ans:1 },
  { id:'l19', cat:'Logical', q:'Logical deduction: Some cats are dogs. Some dogs are cows. Can we say some cats are cows?', opts:['Yes','No','Maybe','Always'], ans:1 },
  { id:'l20', cat:'Logical', q:'Series: 1, 1, 2, 3, 5, 8, 13, ?',                                   opts:['18','20','21','24'],                    ans:2 },
];

const CAT_COLOR = {
  Quantitative: 'bg-blue-50 text-blue-700 border-blue-100',
  Verbal:       'bg-violet-50 text-violet-700 border-violet-100',
  Logical:      'bg-teal-50 text-teal-700 border-teal-100',
};

// Pick 3 daily questions deterministically by date
const todayKey  = () => new Date().toISOString().slice(0, 10);
const STORAGE_K = 'icl_daily_quiz';

const pickQuestions = () => {
  const seed = todayKey().replace(/-/g, '') | 0;  // crude seed from date digits
  const shuffled = [...BANK].sort((a, b) => {
    // deterministic shuffle: use question id hash mixed with seed
    const ha = (seed * a.id.charCodeAt(1)) % BANK.length;
    const hb = (seed * b.id.charCodeAt(1)) % BANK.length;
    return ha - hb;
  });
  // One from each category
  const quant = shuffled.find(q => q.cat === 'Quantitative');
  const verb  = shuffled.find(q => q.cat === 'Verbal');
  const logic = shuffled.find(q => q.cat === 'Logical');
  return [quant, verb, logic].filter(Boolean);
};

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_K);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.date !== todayKey()) return null; // stale — new day
    return s;
  } catch { return null; }
};

const saveState = (s) => {
  try { localStorage.setItem(STORAGE_K, JSON.stringify({ ...s, date: todayKey() })); } catch {}
};

const TIMER_MAX = 60;

export const AptitudeMiniQuiz = () => {
  const questions = useMemo(pickQuestions, []);

  // Quiz state
  const [step, setStep]       = useState(0);    // 0-2 active, 3 = done
  const [selected, setSelected] = useState([null, null, null]);
  const [revealed, setRevealed] = useState([false, false, false]);
  const [timeLeft, setTimeLeft] = useState(TIMER_MAX);
  const [timedOut, setTimedOut] = useState([false, false, false]);
  const [started, setStarted]   = useState(false);
  const [done, setDone]         = useState(false);
  const timerRef = useRef(null);

  // Load persisted state
  useEffect(() => {
    const saved = loadState();
    if (saved?.done) {
      setSelected(saved.selected);
      setRevealed([true, true, true]);
      setDone(true);
      setStep(3);
      setStarted(true);
    }
  }, []);

  // Timer
  useEffect(() => {
    if (!started || done || step >= 3) return;
    setTimeLeft(TIMER_MAX);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [step, started, done]);

  const handleTimeout = () => {
    setTimedOut(prev => { const n=[...prev]; n[step]=true; return n; });
    setRevealed(prev => { const n=[...prev]; n[step]=true; return n; });
    setTimeout(() => advance(), 1200);
  };

  const handleSelect = (optIdx) => {
    if (revealed[step]) return;
    clearInterval(timerRef.current);
    const newSel = [...selected]; newSel[step] = optIdx;
    const newRev = [...revealed]; newRev[step] = true;
    setSelected(newSel);
    setRevealed(newRev);
    setTimeout(() => advance(newSel, newRev), 900);
  };

  const advance = (sel = selected, rev = revealed) => {
    if (step < questions.length - 1) {
      setStep(s => s + 1);
    } else {
      setDone(true);
      setStep(3);
      saveState({ selected: sel, done: true });
    }
  };

  const score = useMemo(() =>
    questions.reduce((acc, q, i) => acc + (selected[i] === q.ans ? 1 : 0), 0),
    [selected, questions]
  );

  const timerPct = (timeLeft / TIMER_MAX) * 100;
  const timerColor = timeLeft > 20 ? '#3b82f6' : timeLeft > 10 ? '#f59e0b' : '#ef4444';

  // ── Pre-start ──────────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-gray-400" />
          <h3 className="text-[14px] font-bold text-gray-900">Daily Aptitude Quiz</h3>
          <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 uppercase tracking-wide">New</span>
        </div>
        <div className="flex justify-center gap-3 mb-5">
          {['Quantitative','Verbal','Logical'].map((cat, i) => (
            <div key={cat} className="flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border ${CAT_COLOR[cat]}`}>
                {cat === 'Quantitative' ? '🔢' : cat === 'Verbal' ? '💬' : '🧩'}
              </div>
              <span className="text-[10px] text-gray-500 font-medium">{cat}</span>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-gray-500 mb-1">3 questions · 60s per question · Instant result</p>
        <p className="text-[11px] text-gray-400 mb-5">Resets every day at midnight</p>
        <button
          onClick={() => setStarted(true)}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-xl transition-colors"
        >
          Start Quiz →
        </button>
      </div>
    );
  }

  // ── Done state ─────────────────────────────────────────────────────────────
  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const msg = score === 3 ? 'Perfect! 🎉' : score === 2 ? 'Good job! 👍' : score === 1 ? 'Keep practising 💪' : 'Better luck tomorrow 📚';
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-[14px] font-bold text-gray-900">Daily Aptitude Quiz</h3>
        </div>
        {/* Score circle */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg viewBox="0 0 64 64" className="-rotate-90 w-16 h-16">
              <circle cx="32" cy="32" r="26" stroke="#f1f5f9" strokeWidth="5" fill="none" />
              <circle cx="32" cy="32" r="26" stroke={pct === 100 ? '#10b981' : pct >= 67 ? '#3b82f6' : '#f59e0b'}
                strokeWidth="5" fill="none" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * (1 - pct / 100)}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[15px] font-extrabold text-gray-800">{score}/3</span>
            </div>
          </div>
          <div>
            <p className="text-[15px] font-bold text-gray-900">{msg}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">Score: {pct}%</p>
            <p className="text-[11px] text-gray-400 mt-1">Next quiz resets at midnight</p>
          </div>
        </div>
        {/* Answer review */}
        <div className="space-y-2">
          {questions.map((q, i) => {
            const correct = selected[i] === q.ans;
            const skipped = selected[i] === null;
            return (
              <div key={q.id} className={`rounded-xl p-3 border ${
                skipped ? 'bg-gray-50 border-gray-100' :
                correct  ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                <div className="flex items-start gap-2">
                  {skipped ? <Clock className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                   : correct ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                   : <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />}
                  <div>
                    <p className="text-[11px] font-semibold text-gray-700 leading-snug">{q.q}</p>
                    <p className={`text-[10px] mt-0.5 font-medium ${correct ? 'text-emerald-600' : 'text-red-500'}`}>
                      {skipped ? 'Timed out' : correct ? `Correct: ${q.opts[q.ans]}` : `You: ${q.opts[selected[i]]} · Correct: ${q.opts[q.ans]}`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Active question ────────────────────────────────────────────────────────
  const q    = questions[step];
  const isRev = revealed[step];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-gray-400" />
          <h3 className="text-[14px] font-bold text-gray-900">Daily Aptitude Quiz</h3>
        </div>
        <span className="text-[11px] text-gray-400 font-medium">{step + 1}/3</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-4">
        {questions.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i < step ? 'bg-blue-400' : i === step ? 'bg-blue-600' : 'bg-gray-100'}`} />
        ))}
      </div>

      {/* Timer */}
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: timerColor }} />
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000 linear"
            style={{ width: `${timerPct}%`, background: timerColor }} />
        </div>
        <span className="text-[11px] font-bold w-8 text-right" style={{ color: timerColor }}>
          {timeLeft}s
        </span>
      </div>

      {/* Category */}
      <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border mb-3 ${CAT_COLOR[q.cat]}`}>
        {q.cat}
      </span>

      {/* Question */}
      <p className="text-[13px] font-semibold text-gray-800 leading-relaxed mb-4">{q.q}</p>

      {/* Options */}
      <div className="grid grid-cols-1 gap-2">
        {q.opts.map((opt, idx) => {
          const isCorrect = idx === q.ans;
          const isChosen  = selected[step] === idx;
          let cls = 'bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50';
          if (isRev) {
            if (isCorrect)       cls = 'bg-emerald-50 border-emerald-400 text-emerald-800';
            else if (isChosen)   cls = 'bg-red-50 border-red-400 text-red-700';
            else                 cls = 'bg-gray-50 border-gray-100 text-gray-400';
          }
          return (
            <button key={idx} onClick={() => handleSelect(idx)} disabled={isRev}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-[12px] font-medium text-left transition-all duration-200 ${cls}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 border
                ${isRev && isCorrect ? 'bg-emerald-400 border-emerald-400 text-white' :
                  isRev && isChosen && !isCorrect ? 'bg-red-400 border-red-400 text-white' :
                  'bg-white border-gray-300 text-gray-500'}`}>
                {String.fromCharCode(65 + idx)}
              </span>
              {opt}
              {isRev && isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto flex-shrink-0" />}
              {isRev && isChosen && !isCorrect && <XCircle className="w-3.5 h-3.5 text-red-500 ml-auto flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {isRev && step < questions.length - 1 && (
        <button onClick={() => advance()} className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-[12px] font-semibold text-blue-600 hover:text-blue-700">
          Next question <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default AptitudeMiniQuiz;