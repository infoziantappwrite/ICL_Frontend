// src/components/dashboard/widgets/DailyInterviewTip.jsx
// Zero API cost — picks today's tip by day-of-year index from a static bank.
// Drop into ProfileDashboard feed with: <DailyInterviewTip />

import { useState, useMemo } from 'react';
import { Lightbulb, ChevronLeft, ChevronRight, Share2, BookOpen, Code2, Users } from 'lucide-react';

// ─── Static tip bank (72 tips — 24 per category) ─────────────────────────────
const TIPS = [
  // ── HR / Behavioural ─────────────────────────────────────────────────────
  { cat: 'HR', tip: 'Use the STAR method (Situation, Task, Action, Result) for every behavioural question. Interviewers score you on structure, not just content.' },
  { cat: 'HR', tip: '"Tell me about yourself" is your 90-second pitch. Lead with your strongest achievement, not your education.' },
  { cat: 'HR', tip: 'Research the company\'s mission statement before the interview and weave it naturally into your "why us?" answer.' },
  { cat: 'HR', tip: 'Prepare three stories that each answer multiple HR questions: one teamwork story, one failure story, one leadership story.' },
  { cat: 'HR', tip: 'Never badmouth a previous employer. Reframe negatives as "learning experiences that shaped how I work today".' },
  { cat: 'HR', tip: 'When asked salary expectations, always give a researched range — not a single figure. Research on Glassdoor and AmbitionBox first.' },
  { cat: 'HR', tip: 'Mirror the interviewer\'s energy subtly. If they\'re formal, be precise. If casual, loosen slightly. Rapport-building matters.' },
  { cat: 'HR', tip: 'End every interview by asking: "What does success look like in this role in the first 90 days?" It signals you\'re already thinking like an employee.' },
  { cat: 'HR', tip: 'Body language tip: maintain 70% eye contact — enough to show confidence, not enough to feel like a stare-down.' },
  { cat: 'HR', tip: 'Practise answers out loud, not just in your head. Silent rehearsal and spoken rehearsal use completely different brain pathways.' },
  { cat: 'HR', tip: 'When asked "what\'s your weakness?", name a real one, then describe exactly what you\'re doing to improve it.' },
  { cat: 'HR', tip: '"Where do you see yourself in 5 years?" — align your ambition with the company\'s growth trajectory, not a different company.' },
  { cat: 'HR', tip: 'Send a follow-up thank-you email within 24 hours. Only ~20% of candidates do it — instant differentiator.' },
  { cat: 'HR', tip: 'Quantify every achievement. Not "I improved efficiency" but "I reduced report generation time from 4 hours to 45 minutes".' },
  { cat: 'HR', tip: 'If you blank on a question, say "Let me think for a moment" — a 5-second pause reads as thoughtful, not clueless.' },
  { cat: 'HR', tip: 'Conflict question tip: always make yourself the peacemaker, never the aggressor, even if you were technically right.' },
  { cat: 'HR', tip: 'Dress one level above the company\'s daily standard. When in doubt, err formal — you can always dress down mentally.' },
  { cat: 'HR', tip: 'Ask exactly two questions at the end of an interview. One about the role, one about the team culture. More than three reads as nervous.' },
  { cat: 'HR', tip: 'Virtual interview tip: look at the camera, not the screen, when speaking. It creates eye contact for the interviewer.' },
  { cat: 'HR', tip: '"Are you a team player?" — answer with a specific collaborative win, not a generic "yes, I love working with people".' },
  { cat: 'HR', tip: 'If interrupted mid-answer, let them finish, then say "To complete my thought..." — it shows composure under social pressure.' },
  { cat: 'HR', tip: 'Enthusiasm is a hire signal. Interviewers consistently rank "genuine excitement about the role" above marginal skill gaps.' },
  { cat: 'HR', tip: 'Prepare a crisp answer to "why are you leaving your current role?" — even if you\'re a fresher leaving college, frame it as moving toward, not away from.' },
  { cat: 'HR', tip: 'Connect your hobbies to soft skills: chess = strategic thinking, team sports = collaboration, blogging = communication.' },

  // ── Technical / DSA ───────────────────────────────────────────────────────
  { cat: 'Technical', tip: 'Before writing a single line of code in an interview, clarify: input constraints, edge cases, and expected output format. This alone separates average from strong candidates.' },
  { cat: 'Technical', tip: 'Always state your brute-force solution first, then optimise. Jumping to O(n log n) without acknowledging O(n²) looks like you guessed.' },
  { cat: 'Technical', tip: 'Talk while you code. Interviewers hire people they\'d enjoy debugging with at 2 AM — silence is a red flag.' },
  { cat: 'Technical', tip: 'The sliding window pattern solves most subarray/substring problems. Recognise it when you see "longest", "shortest", or "maximum" with a contiguous constraint.' },
  { cat: 'Technical', tip: 'Two pointers reduce O(n²) nested loops to O(n) in sorted arrays. Think of it whenever you see "pairs that satisfy a condition".' },
  { cat: 'Technical', tip: 'HashMap/frequency-map is almost always the right move when a brute-force solution uses nested loops for lookups.' },
  { cat: 'Technical', tip: 'BFS = shortest path / level-order. DFS = pathfinding / cycle detection. Internalise this before any graph question.' },
  { cat: 'Technical', tip: 'Dynamic programming = recursion + memoisation. If a recursive solution has overlapping subproblems, DP will optimise it.' },
  { cat: 'Technical', tip: 'Know your time complexities cold: binary search O(log n), merge sort O(n log n), hash lookup O(1) average.' },
  { cat: 'Technical', tip: 'Practise on a whiteboard or blank paper at least once before an in-person interview — coding without autocomplete is a different skill.' },
  { cat: 'Technical', tip: 'System design tip: start with requirements (functional + non-functional), then scale estimates, then architecture — in that order.' },
  { cat: 'Technical', tip: 'When stuck in a coding interview, think aloud: "I\'m considering X but worried about Y edge case — let me try Z." The process matters as much as the solution.' },
  { cat: 'Technical', tip: 'Stack problems often involve "find the nearest greater/smaller element". Recognise the pattern, implement once, reuse the template.' },
  { cat: 'Technical', tip: 'SQL tip: understand the order of execution — FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. Helps reason about query performance.' },
  { cat: 'Technical', tip: 'OOPS interview: know encapsulation, inheritance, polymorphism, and abstraction with one real-world example each. Avoid textbook definitions.' },
  { cat: 'Technical', tip: 'For tree problems, always ask: should this be recursive or iterative? Recursive is cleaner to write; iterative avoids stack overflow on deep trees.' },
  { cat: 'Technical', tip: 'REST interview: know the difference between PUT (full replace) and PATCH (partial update) — it trips up ~60% of candidates.' },
  { cat: 'Technical', tip: 'After solving a problem, proactively discuss trade-offs: "This is O(n) space. If memory is constrained, here\'s an O(1) alternative..."' },
  { cat: 'Technical', tip: 'Priority queues (min/max heap) solve "top K" problems in O(n log k) — far better than sorting the whole array.' },
  { cat: 'Technical', tip: 'Union-Find (Disjoint Set) is the go-to for "number of connected components" or "detect cycle in undirected graph".' },
  { cat: 'Technical', tip: 'Test your code on at least three cases before saying "done": a normal case, an empty/null case, and a single-element case.' },
  { cat: 'Technical', tip: 'Git interview: know rebase vs merge conceptually. Rebase = linear history, merge = preserves branch history with a merge commit.' },
  { cat: 'Technical', tip: 'Async JS tip: understand the event loop order — synchronous → microtasks (Promises) → macrotasks (setTimeout). Draws well on a whiteboard.' },
  { cat: 'Technical', tip: 'When asked "how would you improve this system?", always mention observability (logging, metrics, alerts) — it signals production mindset.' },

  // ── Aptitude / Logical ────────────────────────────────────────────────────
  { cat: 'Aptitude', tip: 'For percentage problems, memorise: X% of Y = Y% of X. So 18% of 50 = 50% of 18 = 9. Much faster mentally.' },
  { cat: 'Aptitude', tip: 'Time & Work: If A does a job in x days and B in y days, together they do it in xy/(x+y) days. Derive it once, remember it forever.' },
  { cat: 'Aptitude', tip: 'Speed, Distance, Time: average speed for equal distances = 2xy/(x+y), not (x+y)/2. The arithmetic mean trap is set deliberately.' },
  { cat: 'Aptitude', tip: 'Syllogism tip: draw Venn diagrams for all possibilities. "Some A are B" means ≥1 element in the intersection — not all.' },
  { cat: 'Aptitude', tip: 'For number series, check: differences, ratio, squares, cubes, alternating, and prime sequences — in that order.' },
  { cat: 'Aptitude', tip: 'Profit & Loss shortcut: if cost price is x and profit % is p, selling price = x × (100+p)/100. Use this template to avoid sign errors.' },
  { cat: 'Aptitude', tip: 'In seating arrangement problems, fix one person first to eliminate rotational duplicates, then arrange the rest.' },
  { cat: 'Aptitude', tip: 'Permutation vs combination: order matters → P, order doesn\'t → C. "Arrange" = P, "Select/Choose" = C.' },
  { cat: 'Aptitude', tip: 'For blood relation questions, draw a family tree immediately. Verbal reasoning without a diagram wastes 70% of your time.' },
  { cat: 'Aptitude', tip: 'Clock problems: angle = |30H − 5.5M| degrees. For hands coinciding, use 60H/11 minutes past 12 formula.' },
  { cat: 'Aptitude', tip: 'Pipes & Cisterns: emptying pipes are negative. Total rate = sum of all individual rates (with sign). Convert to LCM for cleaner numbers.' },
  { cat: 'Aptitude', tip: 'In coding-decoding, check: letter shift, reverse, ASCII offset, and positional logic — one of these four covers 90% of questions.' },
  { cat: 'Aptitude', tip: 'For critical reasoning, identify the conclusion first, then find the premise. The answer that strengthens/weakens only the link between them.' },
  { cat: 'Aptitude', tip: 'Simple Interest = PRT/100. Compound Interest = P(1+R/100)^T − P. The difference between them on 2-year problems is P(R/100)².' },
  { cat: 'Aptitude', tip: 'Mixture problems: use alligation when mixing two concentrations. The ratio of quantities = (C2 − Mean) : (Mean − C1).' },
  { cat: 'Aptitude', tip: 'Direction sense: draw a compass. North is always up, East always right. Track each turn from the last facing, not from North.' },
  { cat: 'Aptitude', tip: 'For "odd one out" in figures, isolate one property at a time: size, shading, rotation, number of sides, symmetry.' },
  { cat: 'Aptitude', tip: 'Ratio and proportion: if A:B = 2:3 and B:C = 4:5, make B common. B = 12, so A:B:C = 8:12:15.' },
  { cat: 'Aptitude', tip: 'In data interpretation, read the chart title and units first. Most errors come from confusing \'000s with raw numbers.' },
  { cat: 'Aptitude', tip: 'Probability = favourable outcomes / total outcomes. For "at least one" problems, use P(at least 1) = 1 − P(none).' },
  { cat: 'Aptitude', tip: 'When a question has 4 answer options and you eliminate 2, guess from the remaining 2 — expected value is positive in most tests.' },
  { cat: 'Aptitude', tip: 'Squares 11–25 and cubes 1–15 must be memorised. They appear in simplification, estimation, and series questions constantly.' },
  { cat: 'Aptitude', tip: 'Logical matrix puzzles: fill in what you know for certain first, then use elimination. Never assume — always derive.' },
  { cat: 'Aptitude', tip: 'In odd statement sets, test each statement against all others. The odd one is the statement that contradicts the group\'s common theme.' },
];

const CAT_META = {
  HR:        { label: 'HR',        color: 'bg-violet-50 text-violet-700 border-violet-100', icon: Users },
  Technical: { label: 'Technical', color: 'bg-blue-50 text-blue-700 border-blue-100',       icon: Code2 },
  Aptitude:  { label: 'Aptitude',  color: 'bg-amber-50 text-amber-700 border-amber-100',    icon: BookOpen },
};

// Deterministic day seed — same tip for everyone on the same date
const dayOfYear = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
};

export const DailyInterviewTip = () => {
  const baseTipIndex = useMemo(() => dayOfYear() % TIPS.length, []);
  const [offset, setOffset]   = useState(0);
  const [copied, setCopied]   = useState(false);

  const tipIndex = (baseTipIndex + offset + TIPS.length) % TIPS.length;
  const tip      = TIPS[tipIndex];
  const meta     = CAT_META[tip.cat];
  const CatIcon  = meta.icon;

  const isToday   = offset === 0;
  const isPreview = Math.abs(offset) <= 2;

  const handleShare = () => {
    navigator.clipboard?.writeText(`💡 Interview tip:\n\n${tip.tip}\n\n— ICL Career Portal`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h3 className="text-[14px] font-bold text-gray-900">Daily Interview Tip</h3>
          {isToday && (
            <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100 uppercase tracking-wide">
              Today
            </span>
          )}
        </div>
        <button
          onClick={handleShare}
          title="Copy tip"
          className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-blue-500 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>

      {/* Category badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>
          <CatIcon className="w-3 h-3" />
          {meta.label}
        </span>
        <span className="text-[10px] text-gray-300">Tip #{tipIndex + 1} of {TIPS.length}</span>
      </div>

      {/* Tip text */}
      <p className="text-[13px] text-gray-700 leading-relaxed min-h-[60px]">
        {tip.tip}
      </p>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-gray-50">
        <button
          onClick={() => setOffset(o => o - 1)}
          disabled={offset <= -5}
          className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Prev tip
        </button>

        {/* Dot indicators */}
        <div className="flex gap-1">
          {[-2,-1,0,1,2].map(d => (
            <button
              key={d}
              onClick={() => setOffset(d)}
              className={`rounded-full transition-all duration-200 ${
                offset === d
                  ? 'w-4 h-2 bg-amber-400'
                  : 'w-2 h-2 bg-gray-200 hover:bg-gray-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setOffset(o => o + 1)}
          disabled={offset >= 5}
          className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"
        >
          Next tip
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {!isToday && (
        <button
          onClick={() => setOffset(0)}
          className="mt-2 w-full text-[11px] font-semibold text-amber-600 hover:text-amber-700 text-center"
        >
          ← Back to today's tip
        </button>
      )}
    </div>
  );
};

export default DailyInterviewTip;