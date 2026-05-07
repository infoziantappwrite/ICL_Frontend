// pages/Trainer/pages/TrainerQuestionManager.jsx
import { useState, useEffect } from 'react';
import TrainerWizardProgress from '../../../components/assessment/TrainerWizardProgress';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Plus, Trash2, Edit, Save, X, ChevronLeft,
  AlertCircle, CheckCircle2, BookOpen, Users, UserPlus,
  Mail, Phone, Search, ChevronRight, Eye, ListChecks,
  Target, Clock, Hash, Award, ClipboardPaste, Send,
  FileText, Check, ChevronDown, ChevronUp, Filter,
  UserCheck, Layers, RefreshCw, Star, ShieldAlert,
  CircleDot, Circle, ArrowRight, Tag, Zap, Code2, Database,
} from 'lucide-react';
import TrainerDashboardLayout from '../../../components/layout/Trainerdashboardlayout';
import { InlineSkeleton } from '../../../components/common/SkeletonLoader';
import { assessmentAPI, jobAPI, collegeAdminAPI, sectionAPI } from '../../../api/Api';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const inp = "w-full border border-gray-200 rounded-lg px-4 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#003399]/30 focus:border-[#003399] bg-white transition-colors placeholder:text-slate-400";

const questionToForm = (q) => ({
  question: q.question || '',
  type: q.type || 'single_answer',
  level: q.level || 'Beginner',
  options: q.options?.length ? q.options.map(o => o.text || '') : ['', '', '', ''],
  correct_answer: Array.isArray(q.correct_answer) ? q.correct_answer : (q.correct_answer || 'A'),
  explanation: q.explanation || '',
  marks: q.marks || 1,
  problem_description:  q.problem_description  || q.description || '',
  input_format:         q.input_format         || '',
  output_format:        q.output_format        || '',
  constraints:          q.constraints          || '',
  algorithm_tags:       q.algorithm_tags       || [],
  boilerplate_code:     q.boilerplate_code     || q.starter_code || '',
  default_coding_language: q.language || q.default_coding_language || 'python',
  test_cases: q.test_cases?.length
    ? q.test_cases.map(tc => ({
        input:           tc.input           || '',
        expected_output: tc.expected_output || '',
        is_hidden:       tc.is_hidden       ?? false,
        marks_weightage: tc.marks_weightage ?? 1,
        time_limit_ms:   tc.time_limit_ms   ?? 2000,
        explanation:     tc.explanation     || '',
      }))
    : [{ input: '', expected_output: '', is_hidden: false, marks_weightage: 1, time_limit_ms: 2000, explanation: '' }],
});

const BLANK_TC     = { input: '', expected_output: '', is_hidden: false, marks_weightage: 1, time_limit_ms: 2000, explanation: '' };
const BLANK_SQL_TC = { setup_sql: '', expected_output: '', is_hidden: false, marks_weightage: 1, time_limit_ms: 2000, explanation: '' };
const BLANK_FORM = {
  question: '', type: 'single_answer', level: 'Beginner',
  options: ['', '', '', ''], correct_answer: 'A', explanation: '', marks: 1,
  problem_description: '', input_format: '', output_format: '', constraints: '',
  algorithm_tags: [], boilerplate_code: '', default_coding_language: 'python',
  test_cases: [{ ...BLANK_TC }],
};

const BULK_FORMAT_EXAMPLE = `1. What is React?
A. A JavaScript library
B. A CSS framework
C. A database
D. A server
Answer: A
Explanation: React is a JS library for building UIs

2. Which hook is used for side effects?
A. useState
B. useEffect
C. useContext
D. useRef
Answer: B
Explanation: useEffect handles side effects in React

3. What does JSX stand for?
A. JavaScript Syntax Extension
B. JavaScript XML
C. Java Syntax XML
D. None of the above
Answer: B`;

const BULK_CODING_FORMAT_EXAMPLE = `1. Sum of Two Numbers
Description: Given two integers A and B, compute and print their sum.
Input Format: Two space-separated integers A and B on a single line.
Output Format: Print a single integer — the sum of A and B.
Constraints: 1 <= A, B <= 10^9
Level: Beginner
Language: python
Tags: math, implementation
Boilerplate:
a, b = map(int, input().split())
# Write your solution here
TestCase:
Input: 5 3
Output: 8
Hidden: false
TestCase:
Input: 100 200
Output: 300
Hidden: true
TimeLimit: 2000

2. Find Maximum Element
Description: Given an array of N integers, find the maximum element.
Input Format: First line contains N. Second line contains N space-separated integers.
Output Format: Print the maximum element.
Constraints: 1 <= N <= 10^5 · -10^9 <= arr[i] <= 10^9
Level: Intermediate
Language: python
Tags: arrays
Boilerplate:
n = int(input())
arr = list(map(int, input().split()))
# Write your solution here
TestCase:
Input:
5
3 1 4 1 5
Output: 5
Hidden: false
TestCase:
Input:
4
-3 -1 -4 -2
Output: -1
Hidden: true`;

const BULK_SQL_FORMAT_EXAMPLE = `1. Find High Salary Employees
Description: Write a query to find all employees with salary above 80000, ordered by name.
Level: Beginner
Boilerplate:
SELECT name, salary FROM employees WHERE salary > 80000 ORDER BY name;
TestCase:
SetupSQL:
CREATE TABLE employees (id INTEGER, name TEXT, salary INTEGER);
INSERT INTO employees VALUES (1,'Alice',90000),(2,'Bob',75000),(3,'Carol',95000);
Output:
Alice|90000
Carol|95000
Hidden: false

2. Count Orders Per Customer
Description: Write a query to count how many orders each customer has placed.
Level: Intermediate
TestCase:
SetupSQL:
CREATE TABLE orders (id INTEGER, customer TEXT, amount REAL);
INSERT INTO orders VALUES (1,'Alice',100),(2,'Bob',200),(3,'Alice',150);
Output:
Alice|2
Bob|1
Hidden: false
TestCase:
SetupSQL:
CREATE TABLE orders (id INTEGER, customer TEXT, amount REAL);
INSERT INTO orders VALUES (1,'X',10),(2,'Y',20),(3,'X',30),(4,'Y',40),(5,'Z',50);
Output:
X|2
Y|2
Z|1
Hidden: true`;

// ─── MCQ Bulk Parser ──────────────────────────────────────────────
const parseBulkText = (text) => {
  const questions = [];
  const errors = [];
  const blocks = text.split(/\n(?=\d+[\.\)]\s)/).map(b => b.trim()).filter(Boolean);

  blocks.forEach((block, blockIdx) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const q = { options: [] };
    let valid = true;

    lines.forEach(line => {
      const qMatch   = line.match(/^\d+[\.\)]\s+(.+)$/);
      const optMatch = line.match(/^([A-Da-d])[\.\):\s]\s*(.+)$/);
      const ansMatch = line.match(/^Answer:\s*([A-D,\s]+)$/i);
      const marksMatch = line.match(/^Marks:\s*(\d+(?:\.\d+)?)$/i);
      const expMatch = line.match(/^Explanation:\s*(.+)$/i);

      if (qMatch && !q.question) q.question = qMatch[1].trim();
      else if (optMatch && optMatch[1].match(/[A-Da-d]/)) {
        q.options.push({ label: optMatch[1].toUpperCase(), text: optMatch[2].trim() });
      }
      else if (ansMatch) {
        const ans = ansMatch[1].toUpperCase().replace(/\s/g, '').split(',').filter(Boolean);
        q.correct_answer = ans.length === 1 ? ans[0] : ans;
      }
      else if (marksMatch) q.marks = parseFloat(marksMatch[1]);
      else if (expMatch) q.explanation = expMatch[1].trim();
    });

    const num = blockIdx + 1;
    if (!q.question)             { errors.push(`Q${num}: Missing question text`); valid = false; }
    else if (q.options.length < 2) { errors.push(`Q${num}: Need at least 2 options (A. B. C. D.)`); valid = false; }
    else if (!q.correct_answer)  { errors.push(`Q${num}: Missing Answer line`); valid = false; }

    if (valid) {
      questions.push({
        question: q.question,
        type: Array.isArray(q.correct_answer) && q.correct_answer.length > 1 ? 'multiple_answer' : 'single_answer',
        level: 'Beginner',
        options: q.options,
        correct_answer: q.correct_answer,
        marks: q.marks || 1,
        explanation: q.explanation || '',
      });
    }
  });

  return { questions, errors };
};

// ─── Coding Bulk Parser ───────────────────────────────────────────
const parseBulkCodingText = (text) => {
  const questions = [];
  const errors = [];
  const blocks = text.split(/\n(?=\d+[\.\)]\s)/).map(b => b.trim()).filter(Boolean);

  blocks.forEach((block, blockIdx) => {
    const lines = block.split('\n');
    const q = {
      question: '',
      type: 'coding',
      level: 'Beginner',
      default_coding_language: 'python',
      problem_description: '',
      input_format: '',
      output_format: '',
      constraints: '',
      algorithm_tags: [],
      boilerplate_code: '',
      test_cases: [],
    };

    let currentField = null;
    let currentTC = null;
    let fieldBuffer = [];

    const flushBuffer = () => {
      if (!currentField || fieldBuffer.length === 0) { fieldBuffer = []; return; }
      const val = fieldBuffer.join('\n').trim();
      if (currentField === 'description')  q.problem_description = val;
      else if (currentField === 'input_format')  q.input_format = val;
      else if (currentField === 'output_format') q.output_format = val;
      else if (currentField === 'constraints')   q.constraints = val;
      else if (currentField === 'boilerplate')   q.boilerplate_code = val;
      else if (currentField === 'tc_input'  && currentTC) currentTC.input = val;
      else if (currentField === 'tc_output' && currentTC) currentTC.expected_output = val;
      fieldBuffer = [];
    };

    const flushTC = () => {
      if (currentTC !== null) {
        if (currentTC.input.trim() || currentTC.expected_output.trim()) {
          q.test_cases.push({ ...currentTC });
        }
        currentTC = null;
      }
    };

    const FIELD_PATTERNS = [
      { re: /^Description:\s*(.*)$/i,          field: 'description' },
      { re: /^Input\s*Format:\s*(.*)$/i,        field: 'input_format' },
      { re: /^Output\s*Format:\s*(.*)$/i,       field: 'output_format' },
      { re: /^Constraints:\s*(.*)$/i,           field: 'constraints' },
      { re: /^Boilerplate:\s*(.*)$/i,           field: 'boilerplate' },
    ];
    const SINGLE_PATTERNS = [
      { re: /^Level:\s*(.+)$/i,                 key: 'level' },
      { re: /^Tags:\s*(.+)$/i,                  key: 'tags' },
      { re: /^Language:\s*(.+)$/i,              key: 'language' },
    ];
    const TC_PATTERNS = [
      { re: /^TestCase:\s*$/i,                  key: 'tc_start' },
      { re: /^Input:\s*(.*)$/i,                 key: 'tc_input' },
      { re: /^Output:\s*(.*)$/i,                key: 'tc_output' },
      { re: /^Hidden:\s*(true|false)$/i,        key: 'tc_hidden' },
      { re: /^TimeLimit:\s*(\d+)$/i,            key: 'tc_timelimit' },
      { re: /^Explanation:\s*(.*)$/i,           key: 'tc_explanation' },
    ];

    lines.forEach((rawLine, lineIdx) => {
      const trimmed = rawLine.trim();

      if (lineIdx === 0) {
        const m = trimmed.match(/^\d+[\.\)]\s+(.+)$/);
        if (m) { q.question = m[1].trim(); return; }
      }

      let matched = false;
      for (const { re, key } of TC_PATTERNS) {
        const m = trimmed.match(re);
        if (m) {
          if (key === 'tc_start') {
            flushBuffer(); currentField = null;
            flushTC();
            currentTC = { input: '', expected_output: '', is_hidden: false, marks_weightage: 1, time_limit_ms: 2000, explanation: '' };
          } else if (key === 'tc_input') {
            flushBuffer();
            currentField = 'tc_input';
            if (m[1].trim()) fieldBuffer.push(m[1].trim());
          } else if (key === 'tc_output') {
            flushBuffer();
            currentField = 'tc_output';
            if (m[1].trim()) fieldBuffer.push(m[1].trim());
          } else if (key === 'tc_hidden' && currentTC) {
            flushBuffer(); currentField = null;
            currentTC.is_hidden = m[1].toLowerCase() === 'true';
          } else if (key === 'tc_timelimit' && currentTC) {
            flushBuffer(); currentField = null;
            currentTC.time_limit_ms = parseInt(m[1], 10);
          } else if (key === 'tc_explanation' && currentTC) {
            flushBuffer(); currentField = null;
            currentTC.explanation = m[1].trim();
          }
          matched = true;
          break;
        }
      }
      if (matched) return;

      for (const { re, field } of FIELD_PATTERNS) {
        const m = trimmed.match(re);
        if (m) {
          flushBuffer(); flushTC();
          currentField = field;
          if (m[1].trim()) fieldBuffer.push(m[1].trim());
          matched = true;
          break;
        }
      }
      if (matched) return;

      for (const { re, key } of SINGLE_PATTERNS) {
        const m = trimmed.match(re);
        if (m) {
          flushBuffer(); flushTC(); currentField = null;
          if (key === 'level') {
            const lv = m[1].trim();
            if (['Beginner', 'Intermediate', 'Advanced'].includes(lv)) q.level = lv;
          } else if (key === 'tags') {
            q.algorithm_tags = m[1].split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
          } else if (key === 'language') {
            const lang = m[1].trim().toLowerCase();
            const langMap = { python: 'python', 'python3': 'python', javascript: 'javascript', js: 'javascript', java: 'java', 'c++': 'cpp', cpp: 'cpp', c: 'c' };
            q.language = langMap[lang] || 'python';
          }
          matched = true;
          break;
        }
      }
      if (matched) return;

      if (currentField) {
        if (currentField === 'boilerplate') {
          fieldBuffer.push(rawLine.replace(/^\t/, '  '));
        } else if (trimmed) {
          fieldBuffer.push(trimmed);
        }
      }
    });

    flushBuffer();
    flushTC();

    const num = blockIdx + 1;
    if (!q.question) {
      errors.push(`Q${num}: Missing problem title (line must start with "N. Title")`);
    } else if (q.test_cases.length === 0) {
      errors.push(`Q${num}: "${q.question}" — No test cases found. Add at least one TestCase: block.`);
    } else {
      questions.push(q);
    }
  });

  return { questions, errors };
};

// ─── SQL Bulk Parser ──────────────────────────────────────────────
const parseBulkSqlText = (text) => {
  const questions = [];
  const errors = [];
  const blocks = text.split(/\n(?=\d+[\.\)]\s)/).map(b => b.trim()).filter(Boolean);

  blocks.forEach((block, blockIdx) => {
    const lines = block.split('\n');
    const q = {
      question: '',
      type: 'sql',
      level: 'Beginner',
      problem_description: '',
      boilerplate_code: '',
      test_cases: [],
    };

    let currentField = null;
    let currentTC = null;
    let fieldBuffer = [];

    const flushBuffer = () => {
      if (!currentField || fieldBuffer.length === 0) { fieldBuffer = []; return; }
      const val = fieldBuffer.join('\n').trim();
      if (currentField === 'description') q.problem_description = val;
      else if (currentField === 'boilerplate') q.boilerplate_code = val;
      else if (currentField === 'setup_sql' && currentTC) currentTC.setup_sql = val;
      else if (currentField === 'tc_output' && currentTC) currentTC.expected_output = val;
      fieldBuffer = [];
    };

    const flushTC = () => {
      if (currentTC !== null) {
        if ((currentTC.setup_sql || '').trim() && (currentTC.expected_output || '').trim()) {
          q.test_cases.push({ ...currentTC });
        }
        currentTC = null;
      }
    };

    lines.forEach((rawLine, lineIdx) => {
      const trimmed = rawLine.trim();

      if (lineIdx === 0) {
        const m = trimmed.match(/^\d+[\.\)]\s+(.+)$/);
        if (m) { q.question = m[1].trim(); return; }
      }

      // TestCase block start
      if (/^TestCase:\s*$/i.test(trimmed)) {
        flushBuffer(); currentField = null;
        flushTC();
        currentTC = { setup_sql: '', expected_output: '', is_hidden: false, marks_weightage: 1, explanation: '' };
        return;
      }

      // Within a TestCase
      if (/^SetupSQL:\s*$/i.test(trimmed)) {
        flushBuffer();
        currentField = 'setup_sql';
        return;
      }
      if (/^Output:\s*$/i.test(trimmed)) {
        flushBuffer();
        currentField = 'tc_output';
        return;
      }
      const hiddenM = trimmed.match(/^Hidden:\s*(true|false)$/i);
      if (hiddenM && currentTC) {
        flushBuffer(); currentField = null;
        currentTC.is_hidden = hiddenM[1].toLowerCase() === 'true';
        return;
      }
      const expM = trimmed.match(/^Explanation:\s*(.+)$/i);
      if (expM && currentTC) {
        flushBuffer(); currentField = null;
        currentTC.explanation = expM[1].trim();
        return;
      }

      // Top-level fields
      const descM = trimmed.match(/^Description:\s*(.*)$/i);
      if (descM) {
        flushBuffer(); flushTC(); currentField = 'description';
        if (descM[1].trim()) fieldBuffer.push(descM[1].trim());
        return;
      }
      if (/^Boilerplate:\s*$/i.test(trimmed)) {
        flushBuffer(); flushTC(); currentField = 'boilerplate';
        return;
      }
      const levelM = trimmed.match(/^Level:\s*(.+)$/i);
      if (levelM) {
        flushBuffer(); flushTC(); currentField = null;
        const lv = levelM[1].trim();
        if (['Beginner', 'Intermediate', 'Advanced'].includes(lv)) q.level = lv;
        return;
      }

      // Continuation
      if (currentField) {
        if (currentField === 'boilerplate' || currentField === 'setup_sql') {
          fieldBuffer.push(rawLine.replace(/^\t/, '  '));
        } else if (trimmed) {
          fieldBuffer.push(trimmed);
        }
      }
    });

    flushBuffer();
    flushTC();

    const num = blockIdx + 1;
    if (!q.question) {
      errors.push(`Q${num}: Missing problem title (first line must be "N. Title")`);
    } else if (q.test_cases.length === 0) {
      errors.push(`Q${num}: "${q.question}" — No valid test cases. Each TestCase needs SetupSQL: and Output: blocks.`);
    } else {
      questions.push(q);
    }
  });

  return { questions, errors };
};

/* ─── Completion Checklist Modal ─────────────────────────────────────── */
const CompletionChecklistModal = ({
  assessment,
  savedQs,
  onClose,
  onAssignStudents,
  onProceedAnyway,
}) => {
  const hasQuestions = savedQs.length > 0;
  const meetsQLimit  = !assessment?.num_questions || savedQs.length >= assessment.num_questions;
  // Students are satisfied if eligible_students is populated OR a group was assigned
  const hasStudents  = (assessment?.eligible_students?.length || 0) > 0 || !!(assessment?.group_id);
  const hasSchedule  = !!(assessment?.scheduled_date && assessment?.start_time && assessment?.end_time);
  const hardBlocked  = !hasStudents;

  const items = [
    {
      id: 'questions',
      label: 'Questions added',
      detail: hasQuestions
        ? `${savedQs.length} question${savedQs.length !== 1 ? 's' : ''} saved${assessment?.num_questions ? ` (limit: ${assessment.num_questions})` : ''}`
        : 'No questions have been added yet',
      done: hasQuestions,
      warn: hasQuestions && !meetsQLimit,
      warnMsg: `Only ${savedQs.length}/${assessment?.num_questions} questions added`,
      required: false,
    },
    {
      id: 'students',
      label: 'Students assigned',
      detail: assessment?.eligible_students?.length
        ? `${assessment.eligible_students.length} student${assessment.eligible_students.length !== 1 ? 's' : ''} assigned`
        : assessment?.group_id
        ? 'Students assigned via group'
        : "No students assigned — students won't see this assessment",
      done: hasStudents,
      required: true,
    },
    {
      id: 'schedule',
      label: 'Schedule set',
      detail: hasSchedule
        ? `Scheduled: ${new Date(assessment.scheduled_date).toLocaleDateString('en-IN')} · ${assessment.start_time} – ${assessment.end_time}`
        : 'No schedule set — assessment stays in Draft',
      done: hasSchedule,
      required: false,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className={`px-5 py-4 flex items-center gap-3 ${hardBlocked ? 'bg-red-50 border-b border-red-200' : 'bg-amber-50 border-b border-amber-200'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${hardBlocked ? 'bg-red-100' : 'bg-amber-100'}`}>
            <ShieldAlert className={`w-5 h-5 ${hardBlocked ? 'text-red-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <h3 className={`font-black text-base ${hardBlocked ? 'text-red-800' : 'text-amber-800'}`}>
              {hardBlocked ? 'Cannot Leave Yet' : 'Incomplete Steps'}
            </h3>
            <p className={`text-xs mt-0.5 ${hardBlocked ? 'text-red-600' : 'text-amber-600'}`}>
              {hardBlocked
                ? 'Assign students before leaving this assessment'
                : 'Some steps are incomplete — you can still leave'}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-black/10 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {items.map(item => (
            <div key={item.id}
              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all
                ${item.done ? 'bg-green-50 border-green-200' : item.required ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-200'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                ${item.done ? 'bg-green-500' : item.required ? 'bg-red-200' : 'bg-amber-200'}`}>
                {item.done
                  ? <Check className="w-3.5 h-3.5 text-white" />
                  : item.required
                  ? <X className="w-3 h-3 text-red-600" />
                  : <AlertCircle className="w-3 h-3 text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-bold ${item.done ? 'text-green-800' : item.required ? 'text-red-700' : 'text-amber-800'}`}>
                    {item.label}
                  </p>
                  {item.required && !item.done && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full border border-red-200">Required</span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${item.done ? 'text-green-600' : item.required ? 'text-red-500' : 'text-amber-600'}`}>
                  {item.warn ? item.warnMsg : item.detail}
                </p>
              </div>
              {!item.done && item.id === 'students' && (
                <button
                  onClick={() => { onClose(); onAssignStudents(); }}
                  className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 bg-[#003399] text-white rounded-lg hover:bg-[#003399] transition-colors whitespace-nowrap shrink-0">
                  Assign Now <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-slate-50 font-semibold text-sm transition-all">
            Stay Here
          </button>
          {!hardBlocked ? (
            <button onClick={onProceedAnyway}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all">
              Leave Anyway
            </button>
          ) : (
            <button
              onClick={() => { onClose(); onAssignStudents(); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-[#003399] to-[#00A9CE] text-white rounded-xl font-bold text-sm shadow-md shadow-[#003399]/15 hover:opacity-90 transition-all">
              <Users className="w-4 h-4" /> Assign Students
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Question preview card ──────────────────────────────────────────── */
const QuestionCard = ({ q, idx, onEdit, onRemove, staged = false, locked = false }) => {
  const [open, setOpen] = useState(false);
  const isCorrect = (label) =>
    Array.isArray(q.correct_answer) ? q.correct_answer.includes(label) : q.correct_answer === label;

  return (
    <div className={`rounded-xl border-2 transition-all
      ${staged ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100 bg-white'} shadow-sm`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 text-white shadow-sm
            ${staged ? 'bg-amber-400' : 'bg-[#003399]'}`}>
            {idx + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] bg-[#003399]/5 text-[#003399] border border-[#003399]/10 px-2 py-0.5 rounded-full font-semibold capitalize">
                {q.type?.replace('_', ' ')}
              </span>
              <span className="text-[10px] bg-cyan-50 text-cyan-600 border border-cyan-100 px-2 py-0.5 rounded-full font-semibold">{q.level}</span>
              <span className="text-[10px] text-slate-400 font-medium">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
              {staged && <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">Staged</span>}
            </div>
            <p className="font-semibold text-gray-900 text-sm leading-snug">{q.question}</p>
            {(q.type === 'single_answer' || q.type === 'multiple_answer') && q.options?.length > 0 && (
              <button onClick={() => setOpen(v => !v)}
                className="mt-2 flex items-center gap-1 text-xs text-[#00A9CE] hover:text-[#003399] font-medium">
                {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {open ? 'Hide options' : 'Show options'}
              </button>
            )}
            {open && (
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {q.options.map(opt => {
                  const correct = isCorrect(opt.label);
                  return (
                    <div key={opt.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs
                      ${correct ? 'bg-[#003399]/5 border border-[#003399]/20 text-[#003399] font-medium' : 'bg-gray-50 border border-slate-100 text-gray-600'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                        ${correct ? 'bg-[#003399] text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {opt.label}
                      </span>
                      <span className="flex-1 truncate">{opt.text}</span>
                      {correct && <Check className="w-3 h-3 text-[#003399] shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}
            {q.type === 'fill_up' && (
              <p className="mt-2 text-xs text-[#003399] bg-[#003399]/5 border border-[#003399]/20 px-3 py-1.5 rounded-lg inline-block">
                ✓ {q.correct_answer}
              </p>
            )}
            {q.type === 'coding' && (
              <div className="mt-2 space-y-1.5">
                {q.test_cases?.length > 0 && (
                  <p className="text-xs text-purple-700 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    {q.test_cases.filter(tc => !tc.is_hidden).length} visible · {q.test_cases.filter(tc => tc.is_hidden).length} hidden test cases
                  </p>
                )}
                {q.algorithm_tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {q.algorithm_tags.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-medium">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {q.type === 'sql' && (
              <div className="mt-2 space-y-1.5">
                {q.test_cases?.length > 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                    🗄️ SQL (SQLite) · {q.test_cases.filter(tc => !tc.is_hidden).length} visible · {q.test_cases.filter(tc => tc.is_hidden).length} hidden test cases
                  </p>
                )}
              </div>
            )}
            {q.explanation && <p className="mt-1.5 text-xs text-slate-400 italic">💡 {q.explanation}</p>}
          </div>
          <div className="flex gap-1 shrink-0">
            {onEdit && (
              <button onClick={() => onEdit(idx)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all">
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={() => !locked && onRemove(idx)}
                disabled={locked}
                title={locked ? 'Linked to an assessment — cannot delete' : 'Delete question'}
                className={`p-2 rounded-lg transition-all ${
                  locked
                    ? 'text-gray-200 cursor-not-allowed'
                    : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Add / Edit Modal ───────────────────────────────────────────────── */
const QuestionModal = ({ question, onSave, onClose, defaultMarks = 1, forcedType = null }) => {
  const initialType = forcedType === 'coding' ? 'coding'
    : forcedType === 'sql'  ? 'sql'
    : forcedType === 'quiz' ? 'single_answer'
    : question?.type || 'single_answer';

  const [form, setForm] = useState(
    question ? { ...questionToForm(question), default_coding_language: question.language || question.default_coding_language || 'python' }
             : { ...BLANK_FORM, marks: defaultMarks, type: initialType, default_coding_language: 'python' }
  );
  const [tagInput, setTagInput] = useState('');

  const setOpt = (idx, val) => setForm(prev => { const opts = [...prev.options]; opts[idx] = val; return { ...prev, options: opts }; });

  const isChoice = form.type === 'single_answer' || form.type === 'multiple_answer';
  const isFill   = form.type === 'fill_up';
  const isCoding = form.type === 'coding';
  const isSql    = form.type === 'sql';

  const allowedTypes = forcedType === 'coding'
    ? [{ value: 'coding', label: 'Coding' }]
    : forcedType === 'sql'
    ? [{ value: 'sql', label: 'SQL (SQLite 3)' }]
    : forcedType === 'quiz'
    ? [
        { value: 'single_answer', label: 'Single Answer (MCQ)' },
        { value: 'multiple_answer', label: 'Multiple Answer' },
        { value: 'fill_up', label: 'Fill in the Blank' },
      ]
    : [
        { value: 'single_answer', label: 'Single Answer (MCQ)' },
        { value: 'multiple_answer', label: 'Multiple Answer' },
        { value: 'fill_up', label: 'Fill in the Blank' },
        { value: 'coding', label: 'Coding' },
        { value: 'sql', label: 'SQL (SQLite)' },
      ];

  const toggleMulti = (label) => setForm(prev => {
    const cur = Array.isArray(prev.correct_answer) ? prev.correct_answer : [];
    return { ...prev, correct_answer: cur.includes(label) ? cur.filter(l => l !== label) : [...cur, label] };
  });

  const setTC  = (idx, field, val) => setForm(prev => ({ ...prev, test_cases: prev.test_cases.map((tc, i) => i === idx ? { ...tc, [field]: val } : tc) }));
  const addTC  = () => setForm(prev => ({ ...prev, test_cases: [...prev.test_cases, isSql ? { ...BLANK_SQL_TC } : { ...BLANK_TC }] }));
  const rmTC   = (idx) => setForm(prev => ({ ...prev, test_cases: prev.test_cases.filter((_, i) => i !== idx) }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.algorithm_tags.includes(t)) {
      setForm(prev => ({ ...prev, algorithm_tags: [...prev.algorithm_tags, t] }));
    }
    setTagInput('');
  };
  const rmTag = (tag) => setForm(prev => ({ ...prev, algorithm_tags: prev.algorithm_tags.filter(t => t !== tag) }));

  const hiddenTCCount = form.test_cases.filter(tc => tc.is_hidden).length;
  const marksPerHiddenTC = hiddenTCCount > 0
    ? parseFloat((Number(form.marks) / hiddenTCCount).toFixed(2))
    : 0;

  const handleSave = () => {
    if (!form.question.trim()) return;
    if (isChoice && form.options.some(o => !o.trim())) return;

    const payload = {
      question:    form.question.trim(),
      type:        form.type,
      level:       form.level,
      marks:       Number(form.marks) || 1,
      explanation: form.explanation || undefined,
    };

    if (isChoice) {
      payload.options = form.options.map((text, i) => ({ label: OPTION_LABELS[i], text: text.trim() }));
      payload.correct_answer = form.type === 'multiple_answer'
        ? (Array.isArray(form.correct_answer) ? form.correct_answer : [form.correct_answer])
        : (typeof form.correct_answer === 'string' ? form.correct_answer : 'A');
    }
    if (isFill) payload.correct_answer = typeof form.correct_answer === 'string' ? form.correct_answer : '';

    if (isCoding) {
      if (form.default_coding_language) payload.language = form.default_coding_language;
      if (form.problem_description)  payload.problem_description  = form.problem_description.trim();
      if (form.input_format)         payload.input_format         = form.input_format.trim();
      if (form.output_format)        payload.output_format        = form.output_format.trim();
      if (form.constraints)          payload.constraints          = form.constraints.trim();
      if (form.algorithm_tags?.length) payload.algorithm_tags     = form.algorithm_tags;
      if (form.boilerplate_code)     payload.boilerplate_code     = form.boilerplate_code.trim();
      payload.test_cases = form.test_cases
        .filter(tc => tc.input.trim() || tc.expected_output.trim())
        .map(tc => ({
          input:           tc.input.trim(),
          expected_output: tc.expected_output.trim(),
          is_hidden:       tc.is_hidden,
          marks_weightage: tc.is_hidden ? marksPerHiddenTC : 0,
          ...(tc.is_hidden ? { time_limit_ms: Number(tc.time_limit_ms) || 2000 } : {}),
          explanation:     tc.explanation?.trim() || undefined,
        }));
    }

    if (isSql) {
      // SQL questions always use language = 'sql' (fixed, Judge0 ID 82)
      payload.language = 'sql';
      if (form.problem_description) payload.problem_description = form.problem_description.trim();
      if (form.boilerplate_code)    payload.boilerplate_code    = form.boilerplate_code.trim();
      payload.test_cases = form.test_cases
        .filter(tc => (tc.setup_sql || '').trim() && (tc.expected_output || '').trim())
        .map(tc => ({
          setup_sql:       tc.setup_sql.trim(),
          expected_output: tc.expected_output.trim(),
          is_hidden:       tc.is_hidden,
          marks_weightage: tc.is_hidden ? marksPerHiddenTC : 0,
          explanation:     tc.explanation?.trim() || undefined,
        }));
    }
    onSave(payload);
  };

  const canSave = form.question.trim()
    && (!isChoice || form.options.every(o => o.trim()))
    && (!isFill   || (typeof form.correct_answer === 'string' && form.correct_answer.trim()))
    && (!isCoding || form.test_cases.some(tc => tc.input.trim() && tc.expected_output.trim()))
    && (!isSql    || form.test_cases.some(tc => (tc.setup_sql || '').trim() && (tc.expected_output || '').trim()));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl shadow-[#003399]/15 border border-slate-200 max-w-2xl w-full my-8">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#003399,#00A9CE)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 border border-white/30 rounded-xl flex items-center justify-center">
              {question ? <Edit className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
            </div>
            <h3 className="font-bold text-white text-sm">{question ? 'Edit Question' : 'Add Question'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">Question <span className="text-red-500">*</span></label>
            <textarea rows={3} value={form.question} onChange={e => setForm(prev => ({ ...prev, question: e.target.value }))} placeholder="Enter the question..." className={`${inp} resize-none`} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">Type</label>
              <select value={form.type}
                onChange={e => setForm(prev => ({ ...prev, type: e.target.value, correct_answer: e.target.value === 'multiple_answer' ? [] : 'A' }))}
                disabled={allowedTypes.length === 1}
                className={`${inp} ${allowedTypes.length === 1 ? 'bg-gray-50 cursor-not-allowed' : ''}`}>
                {allowedTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {forcedType && (
                <p className="text-[10px] text-slate-400 mt-1">
                  {forcedType === 'coding' ? '⚡ Coding section — Coding questions only'
                   : forcedType === 'sql'  ? '🗄️ SQL section — SQL questions only'
                   : '📝 Quiz section — MCQ and fill-in-blank only'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">Level</label>
              <select value={form.level} onChange={e => setForm(prev => ({ ...prev, level: e.target.value }))} className={inp}>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">Marks</label>
              <input type="number" min={1} value={form.marks} readOnly
                className={`${inp} bg-gray-50 cursor-not-allowed text-gray-500`}
                title="Marks are auto-assigned based on assessment settings" />
              <p className="text-[10px] text-slate-400 mt-1">Auto-assigned from assessment</p>
            </div>
          </div>

          {isChoice && (
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-2">
                Options <span className="text-red-500">*</span>{' '}
                <span className="text-xs text-slate-400 font-normal">({form.type === 'multiple_answer' ? 'check all correct' : 'click radio for correct'})</span>
              </label>
              <div className="space-y-2">
                {OPTION_LABELS.map((label, idx) => {
                  const isCorr = form.type === 'multiple_answer'
                    ? (Array.isArray(form.correct_answer) ? form.correct_answer.includes(label) : false)
                    : form.correct_answer === label;
                  return (
                    <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${isCorr ? 'border-[#003399]/40 bg-[#003399]/5' : 'border-gray-100 bg-gray-50'}`}>
                      {form.type === 'multiple_answer'
                        ? <input type="checkbox" checked={isCorr} onChange={() => toggleMulti(label)} className="w-4 h-4 text-[#003399] rounded" />
                        : <input type="radio" name="correctAnswer" checked={isCorr} onChange={() => setForm(prev => ({ ...prev, correct_answer: label }))} className="w-4 h-4 text-[#003399]" />}
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isCorr ? 'bg-[#003399] text-white' : 'bg-gray-200 text-gray-600'}`}>{label}</span>
                      <input type="text" value={form.options[idx]} onChange={e => setOpt(idx, e.target.value)} placeholder={`Option ${label}`} className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isFill && (
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">Correct Answer <span className="text-red-500">*</span></label>
              <input type="text" value={typeof form.correct_answer === 'string' ? form.correct_answer : ''} onChange={e => setForm(prev => ({ ...prev, correct_answer: e.target.value }))} placeholder="Enter the exact correct answer" className={inp} />
            </div>
          )}

          {isSql && (
            <>
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <span className="text-base leading-none">🗄️</span>
                <div>
                  <p className="font-bold mb-0.5">SQL Question (Judge0 SQLite 3)</p>
                  <p className="text-amber-700">Each test case has a <strong>Setup SQL</strong> (schema + seed data sent as stdin) and an <strong>Expected Output</strong> (plain text output of the student's query). The student writes only the SELECT query.</p>
                </div>
              </div>

              {/* SQL language locked indicator — so admin knows what students will see */}
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">
                  Default Language <span className="text-xs font-normal text-slate-400">(pre-selected in student editor)</span>
                </label>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-700 text-sm font-bold">
                  <span>🗄️</span>
                  <span>SQL (SQLite 3)</span>
                  <span className="ml-auto text-[10px] font-semibold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200">locked</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Students will see a SQL editor locked to SQLite 3. No other language can be selected.</p>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">
                  Problem Description <span className="text-xs font-normal text-slate-400">(shown to student)</span>
                </label>
                <textarea rows={4} value={form.problem_description}
                  onChange={e => setForm(prev => ({ ...prev, problem_description: e.target.value }))}
                  placeholder="e.g. Write a query to find all employees with salary > 80000, sorted by name."
                  className={`${inp} resize-none`} />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">
                  Starter Query <span className="text-xs font-normal text-slate-400">(optional — pre-filled in student editor)</span>
                </label>
                <textarea rows={3} value={form.boilerplate_code}
                  onChange={e => setForm(prev => ({ ...prev, boilerplate_code: e.target.value }))}
                  placeholder={"SELECT *\nFROM employees\nWHERE salary > 80000;"}
                  className={`${inp} resize-none font-mono text-xs leading-relaxed`} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Test Cases <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-slate-400 ml-1">(setup_sql + expected output per case)</span>
                  </label>
                  <button onClick={addTC} type="button"
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#003399] bg-[#003399]/5 hover:bg-slate-100 rounded-lg border border-[#003399]/20 transition-colors">
                    <Plus className="w-3 h-3" /> Add Case
                  </button>
                </div>
                <div className="space-y-3">
                  {form.test_cases.map((tc, idx) => (
                    <div key={idx} className={`p-3 border rounded-xl space-y-2.5 ${tc.is_hidden ? 'border-purple-200 bg-purple-50/30' : 'border-gray-200 bg-slate-50/50'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                          {tc.is_hidden
                            ? <><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />Hidden Test {idx + 1}</>
                            : <><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Visible Test {idx + 1}</>}
                        </span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 cursor-pointer select-none">
                            <input type="checkbox" checked={tc.is_hidden} onChange={e => setTC(idx, 'is_hidden', e.target.checked)} className="w-3.5 h-3.5 rounded text-purple-600" />
                            Hidden
                          </label>
                          {form.test_cases.length > 1 && (
                            <button onClick={() => rmTC(idx)} type="button" className="text-red-400 hover:text-red-600 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest tracking-wider block mb-1">
                          Setup SQL <span className="text-gray-300">(CREATE TABLE + INSERT — sent as stdin to Judge0)</span>
                        </label>
                        <textarea rows={5} value={tc.setup_sql || ''}
                          onChange={e => setTC(idx, 'setup_sql', e.target.value)}
                          placeholder={"CREATE TABLE employees (id INTEGER, name TEXT, salary INTEGER);\nINSERT INTO employees VALUES (1,'Alice',90000),(2,'Bob',75000),(3,'Carol',95000);"}
                          className={`${inp} font-mono text-xs resize-none leading-relaxed`} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest tracking-wider block mb-1">
                          Expected Output <span className="text-gray-300">(exact plain-text stdout from the correct query)</span>
                        </label>
                        <textarea rows={3} value={tc.expected_output}
                          onChange={e => setTC(idx, 'expected_output', e.target.value)}
                          placeholder={"Alice|90000\nCarol|95000"}
                          className={`${inp} font-mono text-xs resize-none`} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest tracking-wider block mb-1">Explanation (optional)</label>
                        <input type="text" value={tc.explanation || ''}
                          onChange={e => setTC(idx, 'explanation', e.target.value)}
                          placeholder="e.g. Returns employees with salary above 80000"
                          className={`${inp} text-xs`} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  ⚠️ Judge0 compares output as plain text — ensure expected output exactly matches SQLite's stdout (pipe-separated rows, no headers by default).
                </p>
              </div>
            </>
          )}

          {isCoding && (
            <>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">
                  Default Language <span className="text-xs font-normal text-slate-400">(pre-selected in student editor)</span>
                </label>
                <select value={form.default_coding_language || 'python'}
                  onChange={e => setForm(prev => ({ ...prev, default_coding_language: e.target.value }))}
                  className={inp}>
                  <option value="python">Python 3</option>
                  <option value="javascript">JavaScript (Node.js)</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++ (GCC)</option>
                  <option value="c">C (GCC)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">
                  Problem Description <span className="text-xs font-normal text-slate-400">(shown to student)</span>
                </label>
                <textarea rows={4} value={form.problem_description}
                  onChange={e => setForm(prev => ({ ...prev, problem_description: e.target.value }))}
                  placeholder="Describe the problem in detail..."
                  className={`${inp} resize-none`} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">
                    Input Format <span className="text-xs font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea rows={3} value={form.input_format}
                    onChange={e => setForm(prev => ({ ...prev, input_format: e.target.value }))}
                    placeholder={"e.g.\nFirst line: integer N\nNext N lines: integers"}
                    className={`${inp} resize-none text-xs`} />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">
                    Output Format <span className="text-xs font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea rows={3} value={form.output_format}
                    onChange={e => setForm(prev => ({ ...prev, output_format: e.target.value }))}
                    placeholder={"e.g.\nPrint a single integer — the sum"}
                    className={`${inp} resize-none text-xs`} />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">
                  Constraints <span className="text-xs font-normal text-slate-400">(optional)</span>
                </label>
                <textarea rows={2} value={form.constraints}
                  onChange={e => setForm(prev => ({ ...prev, constraints: e.target.value }))}
                  placeholder={"e.g. 1 ≤ N ≤ 10^5 · Time limit: 1s · Memory: 256MB"}
                  className={`${inp} resize-none text-xs`} />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">
                  Algorithm Tags <span className="text-xs font-normal text-slate-400">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="e.g. arrays, sorting, dp…" className={`${inp} flex-1`} />
                  <button type="button" onClick={addTag}
                    className="px-3 py-2 bg-[#003399]/5 hover:bg-slate-100 text-[#003399] text-xs font-bold rounded-xl border border-[#003399]/20 transition-colors whitespace-nowrap">
                    + Add
                  </button>
                </div>
                {form.algorithm_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.algorithm_tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 ring-1 ring-purple-200 rounded-full text-xs font-semibold">
                        <Tag className="w-3 h-3" />{t}
                        <button type="button" onClick={() => rmTag(t)} className="ml-0.5 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">
                  Boilerplate / Starter Code <span className="text-xs font-normal text-slate-400">(optional)</span>
                </label>
                <textarea rows={5} value={form.boilerplate_code}
                  onChange={e => setForm(prev => ({ ...prev, boilerplate_code: e.target.value }))}
                  placeholder={"def solution(n):\n    # write your code here\n    pass"}
                  className={`${inp} resize-none font-mono text-xs leading-relaxed`} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Test Cases <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-slate-400 ml-1">(at least 1 visible + 1 hidden recommended)</span>
                  </label>
                  <button onClick={addTC} type="button"
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#003399] bg-[#003399]/5 hover:bg-slate-100 rounded-lg border border-[#003399]/20 transition-colors">
                    <Plus className="w-3 h-3" /> Add Case
                  </button>
                </div>
                <div className="space-y-3">
                  {form.test_cases.map((tc, idx) => (
                    <div key={idx} className={`p-3 border rounded-xl space-y-2.5 ${tc.is_hidden ? 'border-purple-200 bg-purple-50/30' : 'border-gray-200 bg-slate-50/50'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                          {tc.is_hidden
                            ? <><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />Hidden Test {idx + 1}</>
                            : <><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Visible Test {idx + 1}</>}
                        </span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 cursor-pointer select-none">
                            <input type="checkbox" checked={tc.is_hidden} onChange={e => setTC(idx, 'is_hidden', e.target.checked)} className="w-3.5 h-3.5 rounded text-purple-600" />
                            Hidden
                          </label>
                          {form.test_cases.length > 1 && (
                            <button onClick={() => rmTC(idx)} type="button" className="text-red-400 hover:text-red-600 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest tracking-wider block mb-1">Input (stdin)</label>
                          <textarea rows={3} value={tc.input} onChange={e => setTC(idx, 'input', e.target.value)} placeholder="5 3" className={`${inp} font-mono text-xs resize-none`} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest tracking-wider block mb-1">Expected Output (stdout)</label>
                          <textarea rows={3} value={tc.expected_output} onChange={e => setTC(idx, 'expected_output', e.target.value)} placeholder="8" className={`${inp} font-mono text-xs resize-none`} />
                        </div>
                      </div>
                      {tc.is_hidden ? (
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest tracking-wider block mb-1">Marks Weightage</label>
                            <input type="number" readOnly value={marksPerHiddenTC}
                              className={`${inp} text-xs bg-purple-50 cursor-not-allowed text-purple-700 font-semibold`}
                              title={`Auto: ${form.marks} marks ÷ ${hiddenTCCount} hidden cases`} />
                            <p className="text-[9px] text-purple-400 mt-0.5">Auto ({form.marks}÷{hiddenTCCount})</p>
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest tracking-wider block mb-1">Time Limit (ms)</label>
                            <input type="number" min={500} step={500} value={tc.time_limit_ms}
                              onChange={e => setTC(idx, 'time_limit_ms', e.target.value)}
                              className={`${inp} text-xs`} />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest tracking-wider block mb-1">Explanation</label>
                            <input type="text" value={tc.explanation}
                              onChange={e => setTC(idx, 'explanation', e.target.value)}
                              placeholder="Why this output?"
                              className={`${inp} text-xs`} />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest tracking-wider block mb-1">Explanation</label>
                          <input type="text" value={tc.explanation}
                            onChange={e => setTC(idx, 'explanation', e.target.value)}
                            placeholder="Why this output?"
                            className={`${inp} text-xs`} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {form.test_cases.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 bg-[#003399]/5 border border-[#003399]/20 rounded-xl px-3 py-2">
                    <Zap className="w-3.5 h-3.5 text-[#00A9CE] shrink-0" />
                    <span>
                      {hiddenTCCount > 0 ? (
                        <>
                          <strong className="text-[#003399]">{hiddenTCCount}</strong> hidden case{hiddenTCCount !== 1 ? 's' : ''} ·{' '}
                          <strong className="text-purple-700">{marksPerHiddenTC}</strong> marks each ·{' '}
                          Total: <strong className="text-[#003399]">{form.marks} marks</strong>
                        </>
                      ) : (
                        <>No hidden test cases — add hidden cases to enable scoring</>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {!isCoding && (
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">Explanation (optional)</label>
              <input type="text" value={form.explanation} onChange={e => setForm(prev => ({ ...prev, explanation: e.target.value }))} placeholder="Brief explanation…" className={inp} />
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-slate-50 font-semibold text-sm">Cancel</button>
          <button onClick={handleSave} disabled={!canSave}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#003399] to-[#00A9CE] text-white rounded-xl font-bold text-sm disabled:opacity-60 hover:opacity-90 shadow-md shadow-[#003399]/15">
            <Save className="w-4 h-4" />{question ? 'Update' : 'Stage Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── MCQ Bulk Paste Modal ───────────────────────────────────────────── */
const BulkPasteModal = ({ onAdd, onClose, remaining }) => {
  const [text, setText]             = useState('');
  const [parsed, setParsed]         = useState(null);
  const [showFormat, setShowFormat] = useState(false);
  const [error, setError]           = useState('');

  const handleParse = () => {
    setError('');
    if (!text.trim()) { setError('Paste your questions first'); return; }
    const result = parseBulkText(text);
    if (result.questions.length === 0) { setError(result.errors.length > 0 ? result.errors.join('\n') : 'No valid questions found. Check the format.'); return; }
    if (result.questions.length > remaining) { setError(`Only ${remaining} more question${remaining !== 1 ? 's' : ''} allowed. Parsed ${result.questions.length} — please reduce.`); return; }
    setParsed(result);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl shadow-[#003399]/15 border border-slate-200 max-w-2xl w-full my-8">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#003399,#00A9CE)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 border border-white/30 rounded-xl flex items-center justify-center"><ClipboardPaste className="w-4 h-4 text-white" /></div>
            <div>
              <h3 className="font-bold text-white text-sm">Bulk Paste MCQ Questions</h3>
              <p className="text-white/70 text-[11px]">{remaining} slot{remaining !== 1 ? 's' : ''} remaining</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <button onClick={() => setShowFormat(v => !v)} className="w-full flex items-center justify-between px-4 py-3 bg-[#003399]/5 border border-[#003399]/20 rounded-xl text-sm font-semibold text-[#003399] hover:bg-slate-100 transition-all">
            <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Paste Format Guide</span>
            {showFormat ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showFormat && (
            <div className="bg-gray-900 rounded-xl p-4 text-[11px] font-mono leading-relaxed overflow-auto max-h-52">
              <div className="mb-2 flex items-center gap-2 text-amber-300 text-xs font-semibold">
                <Award className="w-3.5 h-3.5" />
                Marks are auto-assigned from assessment settings — no need to add Marks: field
              </div>
              <pre className="whitespace-pre-wrap text-green-400">{BULK_FORMAT_EXAMPLE}</pre>
            </div>
          )}
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Each question starts with a number like <code className="bg-amber-100 px-1 rounded font-mono">1.</code> Options use <code className="bg-amber-100 px-1 rounded font-mono">A.</code> — <code className="bg-amber-100 px-1 rounded font-mono">D.</code> <strong>Answer:</strong> can be <code className="bg-amber-100 px-1 rounded font-mono">A</code> or <code className="bg-amber-100 px-1 rounded font-mono">A,C</code> for multiple.</span>
          </div>
          {!parsed ? (
            <>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">Paste Questions Here</label>
                <textarea rows={14} value={text} onChange={e => setText(e.target.value)}
                  placeholder={`1. What is React?\nA. A JavaScript library\nB. A CSS framework\nAnswer: A`}
                  className={`${inp} resize-none font-mono text-xs leading-relaxed`} />
              </div>
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <pre className="whitespace-pre-wrap font-sans">{error}</pre>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-slate-50 font-semibold text-sm">Cancel</button>
                <button onClick={handleParse} disabled={!text.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#003399] to-[#00A9CE] text-white rounded-xl font-bold text-sm disabled:opacity-60 hover:opacity-90 shadow-md shadow-[#003399]/15">
                  <Eye className="w-4 h-4" /> Parse & Preview
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span><strong>{parsed.questions.length}</strong> question{parsed.questions.length !== 1 ? 's' : ''} parsed successfully{parsed.errors.length > 0 && ` · ${parsed.errors.length} skipped`}</span>
              </div>
              {parsed.errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  <p className="font-bold mb-1">Skipped:</p>
                  <pre className="whitespace-pre-wrap font-sans">{parsed.errors.join('\n')}</pre>
                </div>
              )}
              <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-3 bg-gray-50">
                {parsed.questions.map((q, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200">
                    <span className="w-6 h-6 bg-[#003399] text-white rounded-lg flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{q.question}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Answer: <strong className="text-[#003399]">{Array.isArray(q.correct_answer) ? q.correct_answer.join(', ') : q.correct_answer}</strong>{' · '}{q.marks} mark{q.marks !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setParsed(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-slate-50 font-semibold text-sm">← Re-edit</button>
                <button onClick={() => onAdd(parsed.questions)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#003399] to-[#00A9CE] text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-md shadow-[#003399]/15">
                  <Plus className="w-4 h-4" /> Add {parsed.questions.length} to Staging
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Coding + SQL Bulk Paste Modal (tabbed) ──────────────────────────── */
const BulkPasteCodingModal = ({ onAdd, onClose, remaining, defaultTab = 'coding', lockTab = false }) => {
  const [tab, setTab]               = useState(defaultTab); // 'coding' | 'sql'

  // Coding tab state
  const [codingText, setCodingText]         = useState('');
  const [codingParsed, setCodingParsed]     = useState(null);
  const [codingError, setCodingError]       = useState('');
  const [showCodingFmt, setShowCodingFmt]   = useState(false);

  // SQL tab state
  const [sqlText, setSqlText]               = useState('');
  const [sqlParsed, setSqlParsed]           = useState(null);
  const [sqlError, setSqlError]             = useState('');
  const [showSqlFmt, setShowSqlFmt]         = useState(false);

  // ── Coding parse ────────────────────────────────────────────────
  const handleParseCoding = () => {
    setCodingError('');
    if (!codingText.trim()) { setCodingError('Paste your coding problems first'); return; }
    const result = parseBulkCodingText(codingText);
    if (result.questions.length === 0) {
      setCodingError(result.errors.length > 0 ? result.errors.join('\n') : 'No valid coding problems found. Check the format.');
      return;
    }
    if (result.questions.length > remaining) {
      setCodingError(`Only ${remaining} more question${remaining !== 1 ? 's' : ''} allowed. Parsed ${result.questions.length} — please reduce.`);
      return;
    }
    setCodingParsed(result);
  };

  // ── SQL parse ────────────────────────────────────────────────────
  const handleParseSql = () => {
    setSqlError('');
    if (!sqlText.trim()) { setSqlError('Paste your SQL problems first'); return; }
    const result = parseBulkSqlText(sqlText);
    if (result.questions.length === 0) {
      setSqlError(result.errors.length > 0 ? result.errors.join('\n') : 'No valid SQL problems found. Check the format.');
      return;
    }
    if (result.questions.length > remaining) {
      setSqlError(`Only ${remaining} more question${remaining !== 1 ? 's' : ''} allowed. Parsed ${result.questions.length} — please reduce.`);
      return;
    }
    setSqlParsed(result);
  };

  const isCoding = tab === 'coding';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className={`bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 max-w-2xl w-full my-8
        ${isCoding ? 'shadow-purple-500/20' : 'shadow-amber-500/20'}`}>

        {/* Header */}
        <div className={`px-5 py-4 rounded-t-2xl flex items-center justify-between
          ${isCoding
            ? 'bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-500'
            : 'bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-500'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 border border-white/30 rounded-xl flex items-center justify-center">
              {isCoding ? <Code2 className="w-4 h-4 text-white" /> : <span className="text-white text-base leading-none">🗄️</span>}
            </div>
            <div>
              <h3 className="font-bold text-white">
                {lockTab ? (isCoding ? 'Bulk Paste: Coding' : 'Bulk Paste: SQL') : 'Bulk Paste: Code & SQL'}
              </h3>
              <p className={`text-[11px] ${isCoding ? 'text-purple-200' : 'text-amber-100'}`}>
                {remaining} slot{remaining !== 1 ? 's' : ''} remaining
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {!lockTab && (
            <button
              onClick={() => setTab('coding')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-2 transition-all
                ${tab === 'coding'
                  ? 'border-purple-600 text-purple-700 bg-purple-50/40'
                  : 'border-transparent text-slate-400 hover:text-gray-600 hover:bg-slate-50'}`}>
              <Code2 className="w-4 h-4" /> Coding
            </button>
          )}
          {(!lockTab || tab === 'sql') && (
            <button
              onClick={() => setTab('sql')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-2 transition-all
                ${tab === 'sql'
                  ? 'border-amber-500 text-amber-700 bg-amber-50/40'
                  : 'border-transparent text-slate-400 hover:text-gray-600 hover:bg-slate-50'}`}>
              <span className="text-base leading-none">🗄️</span> SQL
            </button>
          )}
        </div>

        {/* ── CODING TAB ── */}
        {tab === 'coding' && (
          <div className="p-5 space-y-4">
            <button onClick={() => setShowCodingFmt(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl text-sm font-semibold text-purple-700 hover:bg-purple-100 transition-all">
              <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Paste Format Guide</span>
              {showCodingFmt ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showCodingFmt && (
              <div className="bg-gray-900 rounded-xl p-4 text-[11px] font-mono leading-relaxed overflow-auto max-h-72">
                <div className="mb-3 space-y-1 text-purple-300 text-xs font-semibold font-sans">
                  <p className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 shrink-0" /> Marks auto-assigned from assessment settings</p>
                  <p className="flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5 shrink-0" /> Each problem needs at least one TestCase: block</p>
                </div>
                <pre className="whitespace-pre-wrap text-green-400">{BULK_CODING_FORMAT_EXAMPLE}</pre>
              </div>
            )}
            <div className="flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Each problem starts with <code className="bg-purple-100 px-1 rounded font-mono">1. Title</code>.
                Use <code className="bg-purple-100 px-1 rounded font-mono">TestCase:</code> blocks.
                Mark hidden tests with <code className="bg-purple-100 px-1 rounded font-mono">Hidden: true</code>.
              </span>
            </div>
            {!codingParsed ? (
              <>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">Paste Coding Problems Here</label>
                  <textarea
                    rows={16}
                    value={codingText}
                    onChange={e => setCodingText(e.target.value)}
                    placeholder={`1. Sum of Two Numbers\nDescription: Given two integers A and B, compute their sum.\nTestCase:\nInput: 5 3\nOutput: 8\nHidden: false`}
                    className={`${inp} resize-none font-mono text-xs leading-relaxed`}
                  />
                </div>
                {codingError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <pre className="whitespace-pre-wrap font-sans">{codingError}</pre>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-slate-50 font-semibold text-sm">Cancel</button>
                  <button onClick={handleParseCoding} disabled={!codingText.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-500 text-white rounded-xl font-bold text-sm disabled:opacity-60 hover:opacity-90 shadow-md shadow-purple-500/20">
                    <Eye className="w-4 h-4" /> Parse & Preview
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>{codingParsed.questions.length}</strong> coding problem{codingParsed.questions.length !== 1 ? 's' : ''} parsed
                    {codingParsed.errors.length > 0 && ` · ${codingParsed.errors.length} skipped`}
                  </span>
                </div>
                {codingParsed.errors.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                    <p className="font-bold mb-1">Skipped:</p>
                    <pre className="whitespace-pre-wrap font-sans">{codingParsed.errors.join('\n')}</pre>
                  </div>
                )}
                <div className="max-h-72 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-3 bg-gray-50">
                  {codingParsed.questions.map((q, idx) => {
                    const visibleTC = q.test_cases.filter(tc => !tc.is_hidden).length;
                    const hiddenTC  = q.test_cases.filter(tc => tc.is_hidden).length;
                    return (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200">
                        <span className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 leading-snug">{q.question}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-full font-semibold">{q.level}</span>
                            <span className="text-[10px] text-gray-500">{visibleTC} visible · {hiddenTC} hidden TC{q.test_cases.length !== 1 ? 's' : ''}</span>
                            {q.algorithm_tags?.length > 0 && <span className="text-[10px] text-slate-300 italic">Tags: {q.algorithm_tags.join(', ')}</span>}
                          </div>
                          {q.problem_description && <p className="text-xs text-slate-400 mt-0.5 truncate">{q.problem_description}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setCodingParsed(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-slate-50 font-semibold text-sm">← Re-edit</button>
                  <button onClick={() => onAdd(codingParsed.questions)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-500 text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-md shadow-purple-500/20">
                    <Plus className="w-4 h-4" /> Add {codingParsed.questions.length} to Staging
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── SQL TAB ── */}
        {tab === 'sql' && (
          <div className="p-5 space-y-4">
            <button onClick={() => setShowSqlFmt(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-all">
              <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Paste Format Guide</span>
              {showSqlFmt ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showSqlFmt && (
              <div className="bg-gray-900 rounded-xl p-4 text-[11px] font-mono leading-relaxed overflow-auto max-h-72">
                <div className="mb-3 space-y-1 text-amber-300 text-xs font-semibold font-sans">
                  <p className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 shrink-0" /> Marks auto-assigned from assessment settings</p>
                  <p className="flex items-center gap-1.5"><span className="text-sm">🗄️</span> Each TestCase needs SetupSQL: and Output: blocks</p>
                  <p className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> Output must match SQLite's exact stdout (pipe-separated, no headers)</p>
                </div>
                <pre className="whitespace-pre-wrap text-green-400">{BULK_SQL_FORMAT_EXAMPLE}</pre>
              </div>
            )}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Each problem starts with <code className="bg-amber-100 px-1 rounded font-mono">1. Title</code>.
                Use <code className="bg-amber-100 px-1 rounded font-mono">TestCase:</code> then <code className="bg-amber-100 px-1 rounded font-mono">SetupSQL:</code> (schema + data) and <code className="bg-amber-100 px-1 rounded font-mono">Output:</code> (expected stdout).
              </span>
            </div>
            {!sqlParsed ? (
              <>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">Paste SQL Problems Here</label>
                  <textarea
                    rows={16}
                    value={sqlText}
                    onChange={e => setSqlText(e.target.value)}
                    placeholder={`1. Find All Employees\nDescription: Write a query to select all employees.\nTestCase:\nSetupSQL:\nCREATE TABLE employees (id INTEGER, name TEXT);\nINSERT INTO employees VALUES (1,'Alice'),(2,'Bob');\nOutput:\n1|Alice\n2|Bob\nHidden: false`}
                    className={`${inp} resize-none font-mono text-xs leading-relaxed`}
                  />
                </div>
                {sqlError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <pre className="whitespace-pre-wrap font-sans">{sqlError}</pre>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-slate-50 font-semibold text-sm">Cancel</button>
                  <button onClick={handleParseSql} disabled={!sqlText.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm disabled:opacity-60 hover:opacity-90 shadow-md shadow-amber-500/20">
                    <Eye className="w-4 h-4" /> Parse & Preview
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>{sqlParsed.questions.length}</strong> SQL problem{sqlParsed.questions.length !== 1 ? 's' : ''} parsed
                    {sqlParsed.errors.length > 0 && ` · ${sqlParsed.errors.length} skipped`}
                  </span>
                </div>
                {sqlParsed.errors.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                    <p className="font-bold mb-1">Skipped:</p>
                    <pre className="whitespace-pre-wrap font-sans">{sqlParsed.errors.join('\n')}</pre>
                  </div>
                )}
                <div className="max-h-72 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-3 bg-gray-50">
                  {sqlParsed.questions.map((q, idx) => {
                    const visibleTC = q.test_cases.filter(tc => !tc.is_hidden).length;
                    const hiddenTC  = q.test_cases.filter(tc => tc.is_hidden).length;
                    return (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200">
                        <span className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 leading-snug">{q.question}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-semibold">🗄️ SQL</span>
                            <span className="text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full font-semibold">{q.level}</span>
                            <span className="text-[10px] text-gray-500">{visibleTC} visible · {hiddenTC} hidden TC{q.test_cases.length !== 1 ? 's' : ''}</span>
                          </div>
                          {q.problem_description && <p className="text-xs text-slate-400 mt-0.5 truncate">{q.problem_description}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setSqlParsed(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-slate-50 font-semibold text-sm">← Re-edit</button>
                  <button onClick={() => onAdd(sqlParsed.questions)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-md shadow-amber-500/20">
                    <Plus className="w-4 h-4" /> Add {sqlParsed.questions.length} to Staging
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

/* ─── Assign Students Modal ──────────────────────────────────────────── */
const AssignStudentsModal = ({ assessmentId, assessment, onClose }) => {
  const [tab, setTab]               = useState('all');
  const [allStudents, setAllStudents] = useState([]);
  const [branches, setBranches]     = useState([]);
  const [groups, setGroups]         = useState([]);
  const [selBranch, setSelBranch]   = useState('');
  const [selGroup, setSelGroup]     = useState('');
  const [searchAll, setSearchAll]   = useState('');
  const [selIds, setSelIds]         = useState(new Set());
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [jdStudents, setJdStudents] = useState([]);
  const [loadingJD, setLoadingJD]   = useState(false);
  const [selJdIds, setSelJdIds]     = useState(new Set());
  const [jdFetched, setJdFetched]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [err, setErr]               = useState('');

  const alreadyAssignedIds = new Set(
    (assessment?.eligible_students || []).map(s =>
      typeof s === 'object' ? String(s._id || s) : String(s)
    )
  );
  const alreadyAssignedCount = alreadyAssignedIds.size;

  useEffect(() => {
    if (tab === 'all' || tab === 'branch') fetchAllStudents();
  }, [tab, selBranch]);

  useEffect(() => {
    if (tab === 'group' && groups.length === 0) fetchGroups();
  }, [tab]);

  useEffect(() => {
    if (tab === 'jd' && !jdFetched) fetchJDStudents();
  }, [tab]);

  const fetchAllStudents = async () => {
    setLoadingAll(true);
    try {
      const params = { limit: 500 };
      if (selBranch) params.branch = selBranch;
      const res = await collegeAdminAPI.getStudents(params);
      if (res.success) {
        const list = res.students || [];
        setAllStudents(list);
        if (!selBranch) {
          const uniq = [...new Set(list.map(s => s.studentInfo?.branch).filter(Boolean))].sort();
          setBranches(uniq);
        }
      }
    } catch {} finally { setLoadingAll(false); }
  };

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const res = await collegeAdminAPI.getGroups?.() || { success: false };
      if (res.success) setGroups(res.groups || res.data || []);
    } catch {} finally { setLoadingGroups(false); }
  };

  const fetchJDStudents = async () => {
    const jdId = typeof assessment?.jd_id === 'object' ? assessment?.jd_id?._id : assessment?.jd_id;
    if (!jdId) { setJdFetched(true); return; }
    setLoadingJD(true);
    try {
      const res = await jobAPI.getMatchedStudents(jdId);
      if (res.success) setJdStudents((res.matchedStudents || []).filter(s => s.isEligible));
    } catch {} finally { setLoadingJD(false); setJdFetched(true); }
  };

  const filteredAll = allStudents.filter(s => {
    if (alreadyAssignedIds.has(String(s._id))) return false;
    if (!searchAll.trim()) return true;
    const q = searchAll.toLowerCase();
    return (s.fullName || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
  });

  const filteredBranch = allStudents.filter(s => !alreadyAssignedIds.has(String(s._id)));
  const filteredJD     = jdStudents.filter(s => !alreadyAssignedIds.has(String(s._id || s.userId)));

  const toggleAll = (ids, selSet, setSel) => {
    if (selSet.size === ids.length && ids.length > 0) setSel(new Set());
    else setSel(new Set(ids));
  };

  const handleAssign = async () => {
    setLoading(true); setErr(''); setResult(null);
    try {
      let res;
      if (tab === 'all' || tab === 'branch') {
        if (selIds.size === 0) { setErr('Select at least one student'); setLoading(false); return; }
        const emails = allStudents.filter(s => selIds.has(s._id)).map(s => s.email);
        res = await assessmentAPI.assignStudentsManual(assessmentId, emails);
      } else if (tab === 'group') {
        if (!selGroup) { setErr('Select a group first'); setLoading(false); return; }
        res = await assessmentAPI.assignStudentsFromGroup?.(assessmentId, selGroup)
              || await (async () => {
                const gr = await collegeAdminAPI.getGroupStudents?.(selGroup);
                const emails = (gr?.students || []).map(s => s.email).filter(Boolean);
                if (!emails.length) return { success: false, message: 'No students in this group' };
                return assessmentAPI.assignStudentsManual(assessmentId, emails);
              })();
      } else if (tab === 'jd') {
        if (selJdIds.size === 0) { setErr('Select at least one student'); setLoading(false); return; }
        const emails = jdStudents.filter(s => selJdIds.has(s._id || s.userId)).map(s => s.email);
        res = await assessmentAPI.assignStudentsManual(assessmentId, emails);
      }
      if (res?.success) setResult(`✓ ${res.assigned || 0} student${(res.assigned || 0) !== 1 ? 's' : ''} assigned`);
      else setErr(res?.message || 'Assignment failed');
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  const jdTitle = typeof assessment?.jd_id === 'object' ? assessment?.jd_id?.jobTitle : 'linked JD';
  const tabs = [
    { id: 'all',    label: 'All Students', icon: Users },
    { id: 'branch', label: 'By Branch',    icon: Filter },
    { id: 'group',  label: 'By Group',     icon: Layers },
    { id: 'jd',     label: 'JD Eligible',  icon: UserCheck },
  ];

  const StudentRow = ({ s, checked, onToggle, matchPct }) => {
    const id = s._id || s.userId;
    return (
      <label className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${checked ? 'bg-[#003399]/5 border-[#003399]/20' : 'bg-white border-gray-100 hover:bg-slate-50'}`}>
        <input type="checkbox" checked={checked} onChange={() => onToggle(id)} className="w-4 h-4 text-[#003399] rounded" />
        <div className="w-8 h-8 bg-[#003399] rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
          {(s.fullName || s.studentName || 'S').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{s.fullName || s.studentName || '—'}</p>
          <p className="text-[10px] text-slate-400 truncate">{s.email}{s.studentInfo?.branch && <span className="ml-2 text-[#00A9CE] font-medium">{s.studentInfo.branch}</span>}</p>
        </div>
        {matchPct !== undefined && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${matchPct >= 80 ? 'bg-green-100 text-green-700' : matchPct >= 50 ? 'bg-[#003399]/10 text-[#003399]' : 'bg-gray-100 text-gray-500'}`}>{matchPct}%</span>
        )}
        {checked && <Check className="w-4 h-4 text-[#003399] shrink-0" />}
      </label>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl shadow-[#003399]/15 border border-slate-200 max-w-lg w-full my-8">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#003399,#00A9CE)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 border border-white/30 rounded-xl flex items-center justify-center"><UserPlus className="w-4 h-4 text-white" /></div>
            <div>
              <h3 className="font-bold text-white text-sm">Assign Students</h3>
              {alreadyAssignedCount > 0 && (
                <p className="text-white/70 text-[11px] mt-0.5">{alreadyAssignedCount} already assigned</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex border-b border-slate-100 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setErr(''); setResult(null); setSelIds(new Set()); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all border-b-2 whitespace-nowrap px-2 ${tab === t.id ? 'border-[#003399] text-[#003399] bg-[#003399]/5' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-3">
          {tab === 'all' && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input value={searchAll} onChange={e => setSearchAll(e.target.value)} placeholder="Search students…" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003399]/30 bg-white/80" />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                <button onClick={() => toggleAll(filteredAll.map(s => s._id), selIds, setSelIds)} className="font-semibold text-[#003399] hover:text-[#003399]">
                  {selIds.size === filteredAll.length && filteredAll.length > 0 ? '☑ Deselect All' : '☐ Select All'}
                </button>
                <span>{selIds.size} selected · {filteredAll.length} remaining</span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-100 rounded-xl p-2 bg-gray-50">
                {loadingAll
                  ? <InlineSkeleton rows={3} className="py-6" />
                  : filteredAll.length === 0
                  ? <p className="text-center text-slate-400 text-sm py-8">No students found</p>
                  : filteredAll.map(s => <StudentRow key={s._id} s={s} checked={selIds.has(s._id)} onToggle={id => setSelIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })} />)}
              </div>
            </>
          )}

          {tab === 'branch' && (
            <>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">Select Branch</label>
                <select value={selBranch} onChange={e => { setSelBranch(e.target.value); setSelIds(new Set()); }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/30 bg-white">
                  <option value="">— All Branches —</option>
                  {branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              {selBranch && (
                <>
                  <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                    <button onClick={() => toggleAll(filteredBranch.map(s => s._id), selIds, setSelIds)} className="font-semibold text-[#003399] hover:text-[#003399]">
                      {selIds.size === filteredBranch.length && filteredBranch.length > 0 ? '☑ Deselect All' : '☐ Select All'}
                    </button>
                    <span>{selIds.size} selected · {filteredBranch.length} students</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-100 rounded-xl p-2 bg-gray-50">
                    {loadingAll
                      ? <InlineSkeleton rows={3} />
                      : filteredBranch.length === 0
                      ? <p className="text-center text-slate-400 text-sm py-8">No students in this branch</p>
                      : filteredBranch.map(s => <StudentRow key={s._id} s={s} checked={selIds.has(s._id)} onToggle={id => setSelIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })} />)}
                  </div>
                </>
              )}
              {!selBranch && <p className="text-center text-slate-400 text-sm py-4">Select a branch above to see students</p>}
            </>
          )}

          {tab === 'group' && (
            <>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">Select Group</label>
                {loadingGroups
                  ? <InlineSkeleton rows={1} />
                  : groups.length === 0
                  ? (
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      No groups found. Create groups in the Students section first.
                    </div>
                  ) : (
                    <select value={selGroup} onChange={e => setSelGroup(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/30 bg-white">
                      <option value="">— Select a group —</option>
                      {groups.map(g => <option key={g._id} value={g._id}>{g.name || g.groupName}</option>)}
                    </select>
                  )}
              </div>
              {selGroup && (
                <div className="flex items-center gap-3 bg-[#003399]/5 border border-[#003399]/20 rounded-xl px-4 py-3 text-sm text-[#003399]">
                  <Users className="w-4 h-4 shrink-0" />
                  All students in this group will be assigned to the assessment.
                </div>
              )}
            </>
          )}

          {tab === 'jd' && (
            <>
              {!assessment?.jd_id ? (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />No JD linked. Edit the assessment to link a JD first.
                </div>
              ) : loadingJD ? (
                <div className="flex flex-col items-center py-8 gap-3">
                  <InlineSkeleton rows={4} />
                  <p className="text-sm text-gray-500">Fetching eligible students…</p>
                </div>
              ) : filteredJD.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-3"><CheckCircle2 className="w-6 h-6 text-green-500" /></div>
                  <p className="font-bold text-gray-700 text-sm mb-1">{jdStudents.length === 0 ? 'No eligible students found' : 'All eligible students already assigned'}</p>
                  <p className="text-xs text-slate-400">{jdStudents.length === 0 ? `No students match ${jdTitle}` : `All ${jdStudents.length} eligible students are assigned`}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between bg-[#003399]/5 border border-[#003399]/20 rounded-xl px-3 py-2">
                    <span className="text-xs text-[#003399] font-semibold">{filteredJD.length} eligible remaining</span>
                    <button onClick={() => toggleAll(filteredJD.map(s => s._id || s.userId), selJdIds, setSelJdIds)} className="text-xs text-[#003399] font-semibold hover:text-[#003399]">
                      {selJdIds.size === filteredJD.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-100 rounded-xl p-2 bg-gray-50">
                    {filteredJD.map(s => {
                      const id = s._id || s.userId;
                      return <StudentRow key={id} s={s} checked={selJdIds.has(id)} matchPct={s.matchPercentage}
                        onToggle={id => setSelJdIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })} />;
                    })}
                  </div>
                  <p className="text-xs text-slate-400 px-1">{selJdIds.size} selected</p>
                </>
              )}
            </>
          )}

          {err    && <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{err}</span></div>}
          {result && <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3"><CheckCircle2 className="w-4 h-4 shrink-0" />{result}</div>}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold text-sm hover:bg-slate-50">Close</button>
            {!result && (
              <button onClick={handleAssign}
                disabled={loading || (tab === 'jd' && !assessment?.jd_id) || (tab === 'group' && !selGroup)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#003399] to-[#00A9CE] text-white rounded-xl font-bold text-sm disabled:opacity-60 hover:opacity-90 shadow-md shadow-[#003399]/15">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <UserPlus className="w-4 h-4" />}
                {loading ? 'Assigning…'
                  : tab === 'all'    ? `Assign ${selIds.size} Student${selIds.size !== 1 ? 's' : ''}`
                  : tab === 'branch' ? `Assign ${selIds.size} from ${selBranch || 'Branch'}`
                  : tab === 'group'  ? 'Assign Group'
                  : `Assign ${selJdIds.size} Eligible`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── View Assigned Students Modal ───────────────────────────────────── */
const ViewAssignedModal = ({ assessmentId, assessmentName, level, onClose }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [page, setPage]         = useState(1);
  const [totalPgs, setTotalPgs] = useState(1);
  const [total, setTotal]       = useState(0);
  const [search, setSearch]     = useState('');

  useEffect(() => { fetchStudents(1); }, []);

  const fetchStudents = async (p = 1) => {
    setLoading(true); setError('');
    try {
      const res = await assessmentAPI.getEligibleStudents(assessmentId, { page: p, limit: 10 });
      if (res.success) { setStudents(res.students || []); setTotal(res.total || 0); setTotalPgs(res.pages || 1); setPage(p); }
      else setError(res.message || 'Failed');
    } catch (e) { setError(e.message || 'Failed'); } finally { setLoading(false); }
  };

  const filtered = search.trim()
    ? students.filter(s => (s.fullName || '').toLowerCase().includes(search.toLowerCase()) || (s.email || '').toLowerCase().includes(search.toLowerCase()))
    : students;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl shadow-[#003399]/15 border border-slate-200 w-full max-w-lg flex flex-col max-h-[85vh]">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0" style={{ background: 'linear-gradient(135deg,#003399,#00A9CE)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 border border-white/30 rounded-xl flex items-center justify-center"><Users className="w-4 h-4 text-white" /></div>
            <div>
              <h3 className="font-bold text-white text-sm">Assigned Students</h3>
              <p className="text-white/70 text-[11px] mt-0.5">{assessmentName} · {level} · {total} student{total !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-3 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003399]/30 bg-white/80" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading
            ? <InlineSkeleton rows={4} className="py-10" />
            : error
            ? <div className="flex items-center gap-2 text-red-600 text-sm p-4"><AlertCircle className="w-4 h-4" />{error}</div>
            : filtered.length === 0
            ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="w-14 h-14 bg-[#003399]/10 rounded-2xl flex items-center justify-center mb-3"><Users className="w-7 h-7 text-[#003399]/40" /></div>
                <p className="font-bold text-gray-700 mb-1">{search ? 'No match' : 'No students assigned yet'}</p>
                <p className="text-slate-400 text-sm">{search ? 'Try different search' : 'Use Assign Students to add students'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((s, idx) => (
                  <div key={s._id || idx} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-slate-50/60 rounded-xl border border-slate-100 hover:border-[#003399]/20 transition-all">
                    <div className="w-9 h-9 bg-[#003399] rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs">
                      {(s.fullName || 'S').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{s.fullName || '—'}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {s.email        && <span className="flex items-center gap-1 text-xs text-gray-500"><Mail  className="w-3 h-3" />{s.email}</span>}
                        {s.mobileNumber && <span className="flex items-center gap-1 text-xs text-gray-500"><Phone className="w-3 h-3" />{s.mobileNumber}</span>}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-[#003399]/5 text-[#003399] border border-[#003399]/10 text-[10px] font-bold rounded-full shrink-0">Assigned</span>
                  </div>
                ))}
              </div>
            )}
        </div>
        {!loading && !error && total > 10 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 shrink-0 text-xs text-slate-400">
            <span>Page {page}/{totalPgs} · {total} total</span>
            <div className="flex gap-2">
              <button onClick={() => fetchStudents(page - 1)} disabled={page <= 1} className="p-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => fetchStudents(page + 1)} disabled={page >= totalPgs} className="p-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="w-full py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-slate-50 text-sm">Close</button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════ */
const TrainerQuestionManager = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isNewAssessment = searchParams.get('new') === '1';

  const [assessment,      setAssessment]      = useState(null);
  const [sections,        setSections]        = useState([]);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [savedQs,         setSavedQs]         = useState([]);
  const [stagedQs,        setStagedQs]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [submitting,      setSubmitting]      = useState(false);
  const [error,           setError]           = useState('');
  const [toast,           setToast]           = useState(null);
  const [modal,           setModal]           = useState(null);
  const [showChecklist,   setShowChecklist]   = useState(false);
  const [confirmDelete,   setConfirmDelete]   = useState(null);
  const [deleting,        setDeleting]        = useState(false); // ← NEW: tracks delete in progress
  const [linkedQIds,      setLinkedQIds]      = useState(new Set()); // questions locked to an assessment

  useEffect(() => { fetchData(); }, [assessmentId]);

  // Auto-open Assign Students modal when navigated from ReviewPublish
  useEffect(() => {
    if (location.state?.openAssignStudents) {
      setModal('assign');
      // Clear the state so a refresh doesn't re-open it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const [aRes, sRes] = await Promise.all([
        assessmentAPI.getAssessment(assessmentId),
        sectionAPI.getSections(assessmentId).catch(() => ({ success: true, sections: [] })),
      ]);
      if (aRes.success) {
        setAssessment(aRes.assessment);
        setSavedQs((aRes.assessment.questions_id || []).filter(q => q && q.status !== 'inactive'));
        const secs = sRes.sections || [];
        setSections(secs);
        if (secs.length > 0 && !activeSectionId) setActiveSectionId(secs[0]._id);
      } else setError(aRes.message || 'Failed to load');
    } catch (err) { setError(err.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const handleTryLeave = () => {
    const hasStudents  = (assessment?.eligible_students?.length || 0) > 0 || !!(assessment?.group_id);
    const hasQuestions = savedQs.length > 0;
    if (!hasQuestions && stagedQs.length === 0) { navigate('/dashboard/trainer/assessments'); return; }
    if (!hasStudents) { setShowChecklist(true); return; }
    if (stagedQs.length > 0) { setShowChecklist(true); return; }
    navigate('/dashboard/trainer/assessments');
  };

  const activeSection   = sections.find(s => s._id === activeSectionId) || sections[0] || null;
  const sectionType     = activeSection?.type || null;
  const isCodingSection = sectionType === 'coding';
  const isQuizSection   = sectionType === 'quiz';
  const isSqlSection    = sectionType === 'sql';

  const sectionSavedQs = activeSectionId
    ? savedQs.filter(q => {
        const secQIds = activeSection?.questions?.map(id => String(id?._id || id)) || [];
        return q.section_id === activeSectionId || secQIds.includes(String(q._id));
      })
    : savedQs;
  const sectionStagedQs = stagedQs.filter(q => q._sectionId === activeSectionId);

  const sectionLimit     = activeSection?.configuration?.question_count || 0;
  const sectionCount     = sectionSavedQs.length + sectionStagedQs.length;
  const sectionRemaining = sectionLimit > 0 ? Math.max(0, sectionLimit - sectionCount) : Infinity;
  const atLimit          = sectionLimit > 0 && sectionCount >= sectionLimit;

  const marksPerQ = (() => {
    if (activeSection?.scoring?.marks_per_question) return activeSection.scoring.marks_per_question;
    if (!assessment) return 1;
    const nq = assessment.num_questions || 0;
    const tm = assessment.total_marks   || 0;
    if (nq > 0 && tm > 0) return parseFloat((tm / nq).toFixed(2));
    return 1;
  })();

  const handleStageQuestion = (payload) => {
    const withMeta = { ...payload, marks: marksPerQ, _sectionId: activeSectionId };
    if (modal?.type === 'edit-staged') {
      setStagedQs(prev => { const c = [...prev]; c[modal.idx] = withMeta; return c; });
    } else {
      if (atLimit) { showToast(`Section "${activeSection?.title}" is full (${sectionLimit} questions max)`, 'error'); return; }
      setStagedQs(prev => [...prev, withMeta]);
    }
    setModal(null);
  };

  const handleBulkAdd = (questions) => {
    const allowed = sectionRemaining === Infinity ? questions : questions.slice(0, sectionRemaining);
    const skipped = questions.length - allowed.length;
    const withMeta = allowed.map(q => ({ ...q, marks: marksPerQ, _sectionId: activeSectionId }));
    setStagedQs(prev => [...prev, ...withMeta]);
    setModal(null);
    if (skipped > 0) showToast(`${allowed.length} MCQ staged · ${skipped} skipped (section limit reached)`, 'warning');
    else showToast(`${allowed.length} MCQ questions staged — click Submit to save`);
  };

  const handleBulkCodingAdd = (questions) => {
    const allowed = sectionRemaining === Infinity ? questions : questions.slice(0, sectionRemaining);
    const skipped = questions.length - allowed.length;
    const withMeta = allowed.map(q => ({ ...q, marks: marksPerQ, _sectionId: activeSectionId }));
    setStagedQs(prev => [...prev, ...withMeta]);
    setModal(null);
    if (skipped > 0) showToast(`${allowed.length} coding problem${allowed.length !== 1 ? 's' : ''} staged · ${skipped} skipped (section limit reached)`, 'warning');
    else showToast(`${allowed.length} coding problem${allowed.length !== 1 ? 's' : ''} staged — click Submit to save`);
  };

  const handleSubmitAll = async () => {
    if (stagedQs.length === 0) return;
    setSubmitting(true);
    try {
      const cleanQs = stagedQs.map(({ _sectionId, ...q }) => q);
      const res = await assessmentAPI.bulkAddQuestions(assessmentId, cleanQs);
      if (res.success) {
        const newIds = res.question_ids || res.questions?.map(q => q._id) || [];
        const linkPromises = stagedQs.map((sq, i) => {
          const qId = newIds[i];
          if (qId && sq._sectionId) {
            return sectionAPI.addQuestion(sq._sectionId, qId).catch(() => null);
          }
          return Promise.resolve();
        });
        await Promise.all(linkPromises);
        setStagedQs([]);
        await fetchData();
        showToast(`✓ ${stagedQs.length} questions saved and linked to sections!`);
        const hasStudents = (assessment?.eligible_students?.length || 0) > 0 || !!(assessment?.group_id);
        if (!hasStudents) {
          setTimeout(() => showToast('⚠ Reminder: No students assigned yet!', 'warning'), 4000);
        }
      } else {
        showToast(res.message || 'Submit failed', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── FIX: Proper delete handler with optimistic UI update ─────────────
  const handleDeleteQuestion = async () => {
    if (!confirmDelete) return;
    const { questionId } = confirmDelete;

    setDeleting(true);
    // Do NOT optimistically remove — only remove from UI after server confirms.

    try {
      // ── Step 1: attempt direct delete ─────────────────────────────────
      const res = await assessmentAPI.deleteQuestion(questionId);
      if (res.success) {
        setSavedQs(prev => prev.filter(q => String(q._id) !== String(questionId)));
        setConfirmDelete(null);
        showToast('Question deleted successfully');
        fetchData();
      }
    } catch (e) {
      // 409 = linked to assessment/section; 400 with same message = legacy status code
      const isLinked =
        e.statusCode === 409 ||
        (e.statusCode === 400 && e.message?.toLowerCase().includes('used in an assessment'));

      if (isLinked) {
        // ── Step 2: unlink from all assessments & sections, then delete ───
        try {
          await assessmentAPI.unlinkQuestion(questionId);
          await assessmentAPI.deleteQuestion(questionId);
          setSavedQs(prev => prev.filter(q => String(q._id) !== String(questionId)));
          setConfirmDelete(null);
          showToast('Question removed from assessment and deleted');
          fetchData();
        } catch (unlinkErr) {
          // Still failed after unlink — mark as locked so button is disabled
          setLinkedQIds(prev => new Set([...prev, String(questionId)]));
          showToast(
            unlinkErr.message || 'Could not unlink question — please try again',
            'error'
          );
          setConfirmDelete(null);
        }
      } else {
        // Network / server error — keep modal open so user can retry
        showToast(e.message || 'Delete failed — please try again', 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  const totalMarks = [...savedQs, ...stagedQs].reduce((s, q) => s + (Number(q.marks) || 0), 0);
  const hasStudents = (assessment?.eligible_students?.length || 0) > 0 || !!(assessment?.group_id);

  if (loading) return (
    <TrainerDashboardLayout>
      <div className="flex items-center justify-center py-24">
        <InlineSkeleton rows={4} />
      </div>
    </TrainerDashboardLayout>
  );

  return (
    <TrainerDashboardLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">
        <div className="w-full space-y-3 sm:space-y-4">

          {/* Toast */}
          {toast && (
            <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold max-w-sm
              ${toast.type === 'error' ? 'bg-red-600 text-white' : toast.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-green-600 text-white'}`}>
              {toast.type === 'error' || toast.type === 'warning'
                ? <AlertCircle className="w-4 h-4 shrink-0" />
                : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span className="leading-snug">{toast.msg}</span>
            </div>
          )}

          {/* ── 4-Step Trainer Wizard Progress ── */}
          <TrainerWizardProgress currentStep={3} assessmentId={assessmentId} />

          {/* Back */}
          <button onClick={() => navigate(`/dashboard/trainer/assessments/${assessmentId}/sections`)}
            className="flex items-center gap-2 text-gray-500 hover:text-[#003399] mb-2 transition-colors group text-[13px] font-bold">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Sections
          </button>

          {/* No-students warning banner */}
          {!hasStudents && savedQs.length > 0 && stagedQs.length === 0 && (
            <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-300 rounded-2xl px-5 py-3.5">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <p className="font-bold text-red-800 text-sm">No students assigned</p>
                  <p className="text-xs text-red-600 mt-0.5">Students won't see this assessment. Assign before leaving.</p>
                </div>
              </div>
              <button onClick={() => setModal('assign')}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl whitespace-nowrap transition-colors shrink-0">
                <Users className="w-3.5 h-3.5" /> Assign Now
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-1">
            <div>
              <h1 className="text-[20px] md:text-[24px] font-bold text-gray-900 tracking-tight">
                {assessment?.title || 'Assessment'} — {assessment?.level}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="inline-flex items-center gap-1 bg-white rounded-full px-2.5 py-1 text-[10px] font-bold text-gray-700 border border-gray-200">
                  <Hash className="w-3 h-3" /> {savedQs.length} questions
                </span>
                <span className="inline-flex items-center gap-1 bg-white rounded-full px-2.5 py-1 text-[10px] font-bold text-gray-700 border border-gray-200">
                  <Award className="w-3 h-3" /> {totalMarks} marks
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold border
                  ${hasStudents ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  <Users className="w-3 h-3" />
                  {hasStudents ? (assessment.eligible_students?.length ? `${assessment.eligible_students.length} students` : 'Via group') : '⚠ No students'}
                </span>
                {stagedQs.length > 0 && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 rounded-full px-2.5 py-1 text-[10px] font-bold text-amber-700 border border-amber-200">
                    {stagedQs.length} staged
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setModal('view-students')}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-gray-700 text-[13px] font-bold px-3 py-2 rounded-lg border border-gray-200 shadow-sm transition-colors">
                <Eye className="w-4 h-4" /> View Students
                {hasStudents && assessment.eligible_students?.length > 0 && <span className="ml-1 bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{assessment.eligible_students.length}</span>}
              </button>
              <button onClick={() => setModal('assign')}
                className={`inline-flex items-center gap-1.5 text-white text-[13px] font-bold px-4 py-2 rounded-lg shadow-sm transition-colors
                  ${!hasStudents ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-[#003399] hover:bg-[#003399]'}`}>
                <Users className="w-4 h-4" /> {hasStudents ? 'Assign Students' : 'Assign Students ⚠'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />{error}
            </div>
          )}

          {/* TWO-PANEL LAYOUT */}
          <div className="flex gap-4 items-start">

            {/* LEFT: Sections Sidebar */}
            {sections.length > 0 && (
              <div className="w-56 flex-shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-[#003399] to-[#003399]/80 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#003399]" />
                  <p className="text-xs font-bold text-white">Sections</p>
                </div>
                <div className="p-2 space-y-1">
                  {sections.map((sec) => {
                    const isCoding = sec.type === 'coding';
                    const isSql    = sec.type === 'sql';
                    const isActive = sec._id === activeSectionId;
                    const secSaved = savedQs.filter(q => {
                      const secQIds = sec.questions?.map(id => String(id?._id || id)) || [];
                      return q.section_id === sec._id || secQIds.includes(String(q._id));
                    }).length;
                    const secStaged = stagedQs.filter(q => q._sectionId === sec._id).length;
                    return (
                      <button key={sec._id} onClick={() => setActiveSectionId(sec._id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all border ${isActive
                          ? isCoding ? 'bg-violet-50 border-violet-300 text-violet-800'
                            : isSql  ? 'bg-amber-50 border-amber-300 text-amber-800'
                                     : 'bg-[#003399]/5 border-[#003399]/20 text-[#003399]'
                          : 'border-transparent hover:bg-slate-50 text-gray-600'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${isCoding ? 'bg-violet-100' : isSql ? 'bg-amber-100' : 'bg-[#003399]/10'}`}>
                            {isCoding ? <Code2 className="w-3 h-3 text-violet-600" /> : isSql ? <Database className="w-3 h-3 text-amber-600" /> : <BookOpen className="w-3 h-3 text-[#003399]" />}
                          </div>
                          <span className="text-xs font-semibold truncate flex-1">{sec.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 ml-7">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isCoding ? 'bg-violet-100 text-violet-600' : isSql ? 'bg-amber-100 text-amber-600' : 'bg-[#003399]/10 text-[#003399]'}`}>
                            {isCoding ? 'Coding' : isSql ? 'SQL' : 'Quiz'}
                          </span>
                          <span className="text-[9px] text-slate-400">{secSaved}{secStaged > 0 ? `+${secStaged}` : ''}/{sec.configuration?.question_count || '?'} Qs</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="px-3 pb-3">
                  <button onClick={() => navigate(`/dashboard/trainer/assessments/${assessmentId}/sections`)}
                    className="w-full py-2 text-[11px] font-semibold text-[#003399] hover:bg-slate-50 rounded-xl border border-dashed border-[#003399]/20 transition-all">
                    + Manage Sections
                  </button>
                </div>
              </div>
            )}

            {/* RIGHT: Question Panel */}
            <div className="flex-1 min-w-0 space-y-3">

              {/* Section header + action buttons */}
              {activeSection && (
                <div className="space-y-2">
                  <div className={`rounded-2xl border-2 px-4 py-3 flex items-center justify-between gap-3 flex-wrap
                    ${atLimit ? 'bg-red-50 border-red-200' : isCodingSection ? 'bg-violet-50 border-violet-200' : isSqlSection ? 'bg-amber-50 border-amber-200' : 'bg-[#003399]/5 border-[#003399]/20'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                        ${atLimit ? 'bg-red-100' : isCodingSection ? 'bg-violet-100' : isSqlSection ? 'bg-amber-100' : 'bg-[#003399]/10'}`}>
                        {atLimit
                          ? <AlertCircle className="w-4 h-4 text-red-500" />
                          : isCodingSection ? <Code2 className="w-4 h-4 text-violet-600" />
                          : isSqlSection    ? <Database className="w-4 h-4 text-amber-600" />
                          : <BookOpen className="w-4 h-4 text-[#003399]" />}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${atLimit ? 'text-red-700' : isCodingSection ? 'text-violet-800' : isSqlSection ? 'text-amber-800' : 'text-[#003399]'}`}>
                          {activeSection.title}
                          {atLimit && <span className="ml-2 text-[10px] bg-red-100 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full font-bold">FULL</span>}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                          <span className={`font-semibold ${atLimit ? 'text-red-600' : sectionCount > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                            {sectionCount}/{sectionLimit || '?'}
                          </span>
                          questions used · {activeSection.scoring?.total_marks} marks · {activeSection.configuration?.duration_minutes} min
                          {isCodingSection ? ' · Coding only' : isSqlSection ? ' · SQL (SQLite 3) only' : ' · MCQ / Fill-in-Blank only'}
                        </p>
                        {sectionLimit > 0 && (
                          <div className="mt-1.5 w-40 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${atLimit ? 'bg-red-500' : sectionCount / sectionLimit > 0.8 ? 'bg-amber-400' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(100, (sectionCount / sectionLimit) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {atLimit ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-600 text-[12px] font-bold rounded-lg border border-red-200">
                          <AlertCircle className="w-3.5 h-3.5" /> Section Full — {sectionLimit} / {sectionLimit} Qs
                        </span>
                      ) : (
                        <>
                          {isCodingSection && (
                            <button onClick={() => setModal('bulk-coding')}
                              className="inline-flex items-center gap-1.5 bg-white border border-violet-200 text-violet-700 text-[13px] font-bold px-3 py-2 rounded-lg hover:bg-violet-50 shadow-sm transition-colors">
                              <Code2 className="w-4 h-4" /> Bulk Code 
                            </button>
                          )}
                          {isSqlSection && (
                            <button onClick={() => setModal('bulk-coding')}
                              className="inline-flex items-center gap-1.5 bg-white border border-amber-200 text-amber-700 text-[13px] font-bold px-3 py-2 rounded-lg hover:bg-amber-50 shadow-sm transition-colors">
                              <Database className="w-4 h-4" /> Bulk SQL
                            </button>
                          )}
                          {isQuizSection && (
                            <button onClick={() => setModal('bulk')}
                              className="inline-flex items-center gap-1.5 bg-white border border-[#003399]/20 text-[#003399] text-[13px] font-bold px-3 py-2 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
                              <ClipboardPaste className="w-4 h-4" /> Bulk MCQ
                            </button>
                          )}
                          <button onClick={() => setModal('add')}
                            className={`inline-flex items-center gap-1.5 text-white text-[13px] font-bold px-4 py-2 rounded-lg shadow-sm transition-colors
                              ${isCodingSection ? 'bg-violet-600 hover:bg-violet-700' : isSqlSection ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#003399] hover:bg-[#003399]'}`}>
                            <Plus className="w-4 h-4" /> Add Question
                            {sectionRemaining !== Infinity && (
                              <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{sectionRemaining} left</span>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* No sections yet */}
              {sections.length === 0 && (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
                  <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-600 mb-1">No sections set up</h3>
                  <p className="text-sm text-slate-400 mb-4">Go to Section Manager to add Coding and Quiz sections first.</p>
                  <button onClick={() => navigate(`/dashboard/trainer/assessments/${assessmentId}/sections`)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003399] text-white rounded-xl font-bold text-sm hover:bg-[#003399] shadow-sm">
                    <Layers className="w-4 h-4" /> Go to Section Manager
                  </button>
                </div>
              )}

              {/* Staged preview */}
              {sectionStagedQs.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
                  <div className="px-5 py-3 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-500" />
                      <p className="font-bold text-amber-800 text-sm">{sectionStagedQs.length} Staged — Preview</p>
                      <span className="text-xs text-amber-400">Not saved yet</span>
                    </div>
                    <button onClick={handleSubmitAll} disabled={submitting}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#003399] to-[#00A9CE] text-white rounded-xl text-xs font-bold disabled:opacity-60 hover:opacity-90">
                      {submitting
                        ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Send className="w-3.5 h-3.5" />}
                      {submitting ? 'Saving…' : `Submit ${stagedQs.length} (all sections)`}
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    {sectionStagedQs.map((q, idx) => {
                      const globalIdx = stagedQs.findIndex(sq => sq === q);
                      return (
                        <QuestionCard key={idx} q={q} idx={idx} staged
                          onEdit={() => setModal({ type: 'edit-staged', idx: globalIdx })}
                          onRemove={() => setStagedQs(prev => prev.filter((_, pi) => pi !== globalIdx))} />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Saved questions */}
              {sectionSavedQs.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-[#003399]" />
                    <p className="font-bold text-gray-800 text-sm">{sectionSavedQs.length} Saved Questions</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {sectionSavedQs.map((q, idx) => (
                      <QuestionCard key={q._id} q={q} idx={idx}
                        onEdit={() => setModal({ type: 'edit-saved', question: q })}
                        onRemove={() => setConfirmDelete({ questionId: q._id, questionText: q.question })}
                        locked={linkedQIds.has(String(q._id))} />
                    ))}
                  </div>
                </div>
              ) : sectionStagedQs.length === 0 && activeSection && (
                <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isCodingSection ? 'bg-violet-50' : isSqlSection ? 'bg-amber-50' : 'bg-[#003399]/5'}`}>
                    {isCodingSection ? <Code2 className="w-7 h-7 text-violet-400" /> : isSqlSection ? <Database className="w-7 h-7 text-amber-400" /> : <BookOpen className="w-7 h-7 text-[#003399]/40" />}
                  </div>
                  <h3 className="font-bold text-gray-600 mb-1">No Questions in "{activeSection.title}"</h3>
                  <p className="text-sm text-slate-400 mb-5">
                    {isCodingSection ? 'Add coding problems with test cases' : isSqlSection ? 'Add SQL problems — students get a locked SQL (SQLite 3) editor' : 'Add MCQ or fill-in-the-blank questions'}
                  </p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {isCodingSection && (
                      <button onClick={() => setModal('bulk-coding')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-violet-200 text-violet-600 rounded-xl font-semibold text-sm hover:bg-violet-50">
                        <Code2 className="w-4 h-4" /> Bulk Code 
                      </button>
                    )}
                    {isSqlSection && (
                      <button onClick={() => setModal('bulk-coding')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-amber-200 text-amber-600 rounded-xl font-semibold text-sm hover:bg-amber-50">
                        <Database className="w-4 h-4" /> Bulk SQL Paste
                      </button>
                    )}
                    {isQuizSection && (
                      <button onClick={() => setModal('bulk')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#003399]/20 text-[#003399] rounded-xl font-semibold text-sm hover:bg-slate-50">
                        <ClipboardPaste className="w-4 h-4" /> Bulk Paste MCQ
                      </button>
                    )}
                    <button onClick={() => setModal('add')}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-bold text-sm shadow-md hover:opacity-90
                        ${isCodingSection ? 'bg-gradient-to-r from-violet-600 to-purple-500 shadow-violet-500/20' : isSqlSection ? 'bg-gradient-to-r from-amber-600 to-orange-500 shadow-amber-500/20' : 'bg-gradient-to-r from-[#003399] to-[#00A9CE] shadow-[#003399]/15'}`}>
                      <Plus className="w-4 h-4" /> Add Question
                    </button>
                  </div>
                </div>
              )}

              {/* Finalize banner — shown when questions are saved */}
              {savedQs.length > 0 && stagedQs.length === 0 && (
                <div className="bg-slate-50 border border-[#003399]/20 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#003399]/10 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-[#003399]" />
                    </div>
                    <div>
                      <p className="font-bold text-[#003399] text-sm">Questions saved!</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {savedQs.length} question{savedQs.length !== 1 ? 's' : ''} · {totalMarks} marks · Next: Review &amp; Publish
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/dashboard/trainer/assessments/${assessmentId}/review`)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-md hover:opacity-90 transition-opacity whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg,#003399,#00A9CE)' }}>
                    <ArrowRight className="w-4 h-4" /> Go to Review
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Sticky submit */}
          {stagedQs.length > 0 && (
            <div className="sticky bottom-4">
              <button onClick={handleSubmitAll} disabled={submitting}
                className="w-full flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-white font-bold text-[15px] shadow-lg bg-[#003399] disabled:opacity-60 transition-colors hover:bg-[#003399]">
                {submitting
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Send className="w-5 h-5" />}
                {submitting ? 'Saving to database…' : `Submit ${stagedQs.length} Question${stagedQs.length !== 1 ? 's' : ''} to Assessment`}
              </button>
            </div>
          )}

        </div>

        {/* Modals */}
        {modal === 'add' && (
          <QuestionModal
            onSave={handleStageQuestion}
            onClose={() => setModal(null)}
            defaultMarks={marksPerQ}
            forcedType={isCodingSection ? 'coding' : isSqlSection ? 'sql' : isQuizSection ? 'quiz' : null}
          />
        )}
        {modal === 'bulk' && (
          <BulkPasteModal onAdd={handleBulkAdd} onClose={() => setModal(null)} remaining={sectionRemaining === Infinity ? 9999 : sectionRemaining} />
        )}
        {modal === 'bulk-coding' && (
          <BulkPasteCodingModal onAdd={handleBulkCodingAdd} onClose={() => setModal(null)} remaining={sectionRemaining === Infinity ? 9999 : sectionRemaining} defaultTab={isSqlSection ? 'sql' : 'coding'} lockTab={isSqlSection || isCodingSection} />
        )}
        {modal?.type === 'edit-staged' && (
          <QuestionModal
            question={stagedQs[modal.idx]}
            onSave={handleStageQuestion}
            onClose={() => setModal(null)}
            defaultMarks={marksPerQ}
            forcedType={isCodingSection ? 'coding' : isSqlSection ? 'sql' : isQuizSection ? 'quiz' : null}
          />
        )}
        {modal?.type === 'edit-saved' && (
          <QuestionModal question={modal.question}
            defaultMarks={marksPerQ}
            forcedType={modal.question?.type === 'sql' ? 'sql' : (modal.question?.type === 'coding') ? 'coding' : 'quiz'}
            onSave={async (payload) => {
              const res = await assessmentAPI.updateQuestion(modal.question._id, payload);
              if (res.success) { showToast('Updated'); fetchData(); setModal(null); }
              else showToast(res.message || 'Error', 'error');
            }}
            onClose={() => setModal(null)} />
        )}
        {modal === 'assign' && (
          <AssignStudentsModal assessmentId={assessmentId} assessment={assessment} onClose={() => { setModal(null); fetchData(); }} />
        )}
        {modal === 'view-students' && (
          <ViewAssignedModal assessmentId={assessmentId}
            assessmentName={assessment?.title || 'Assessment'}
            level={assessment?.level} onClose={() => setModal(null)} />
        )}

      </div>

      {showChecklist && (
        <CompletionChecklistModal
          assessment={assessment}
          savedQs={savedQs}
          onClose={() => setShowChecklist(false)}
          onAssignStudents={() => { setShowChecklist(false); setModal('assign'); }}
          onProceedAnyway={() => { setShowChecklist(false); navigate('/dashboard/trainer/assessments'); }}
        />
      )}

      {/* ── Delete Confirmation Modal ── */}
      {confirmDelete && (() => {
        const isLocked = linkedQIds.has(String(confirmDelete.questionId));
        const preview  = confirmDelete.questionText
          ? `"${confirmDelete.questionText.length > 80
              ? confirmDelete.questionText.slice(0, 80) + '\u2026'
              : confirmDelete.questionText}"`
          : 'This question will be permanently removed.';
        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm p-6 flex flex-col items-center text-center gap-4">

              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isLocked ? 'bg-amber-50' : 'bg-red-50'}`}>
                {isLocked
                  ? <AlertCircle className="w-7 h-7 text-amber-500" />
                  : <Trash2 className="w-7 h-7 text-red-500" />}
              </div>

              {/* Text */}
              <div>
                <h3 className="font-bold text-gray-900 text-base mb-1">
                  {isLocked ? 'Cannot Delete Question' : 'Delete Question?'}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{preview}</p>
                {isLocked && (
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
                    This question is still linked to an assessment or section.
                    Remove it from the assessment first, then try again.
                  </p>
                )}
              </div>

              {!isLocked && (
                <p className="text-xs text-red-400 font-medium">This action cannot be undone.</p>
              )}

              {/* Buttons */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmDelete(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-slate-50 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isLocked ? 'Close' : 'Cancel'}
                </button>
                {!isLocked && (
                  <button
                    onClick={handleDeleteQuestion}
                    disabled={deleting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-60"
                  >
                    {deleting
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                )}
              </div>

            </div>
          </div>
        );
      })()}
    </TrainerDashboardLayout>
  );
};

export default TrainerQuestionManager;