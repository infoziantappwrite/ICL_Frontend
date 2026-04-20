// src/components/assessment/CodeEditor.jsx
// Upgraded: Monaco Editor replaces textarea
// Features: syntax highlighting, real-time validation, IntelliSense
// Bug 2 Fix: Fullscreen mode for the editor panel (Maximize2/Minimize2 button)
// Bug 3 Fix: Error line/column markers drawn on Monaco editor after Run/Submit

import { useState, useEffect, useRef, useCallback } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import {
  Play, Send, ChevronDown, Loader2, CheckCircle2, XCircle,
  Terminal, RefreshCw, Code2, Eye, EyeOff, AlertTriangle,
  Clock, Keyboard, FlaskConical, Save, ChevronUp, ChevronRight,
  Maximize2, Minimize2
} from 'lucide-react';
import { codeAPI } from '../../api/Api';

// ── Language → Monaco language id mapping ──────────────────────
const MONACO_LANG = {
  python:     'python',
  javascript: 'javascript',
  java:       'java',
  cpp:        'cpp',
  c:          'c',
  sql:        'sql',   // Monaco has built-in SQL syntax highlighting
};

// ── Default starter templates ──────────────────────────────────
const STARTERS = {
  python:     `def solution():\n    # Write your solution here\n    pass\n\n# Call your function\nprint(solution())\n`,
  javascript: `function solution() {\n  // Write your solution here\n}\n\n// Call your function\nconsole.log(solution());\n`,
  java:       `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n`,
  cpp:        `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  c:          `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  sql:        `-- Write your SQL query below\n-- The table schema and data are already set up for you\n\nSELECT *\nFROM table_name\nWHERE condition;\n`,
};

// ── Monaco editor options ───────────────────────────────────────
const EDITOR_OPTIONS = {
  fontSize: 13,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace",
  fontLigatures: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: 'on',
  roundedSelection: true,
  automaticLayout: true,
  tabSize: 4,
  insertSpaces: true,
  wordWrap: 'on',
  padding: { top: 12, bottom: 12 },
  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
  overviewRulerLanes: 0,
  renderLineHighlight: 'line',
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  smoothScrolling: true,
  quickSuggestions: { other: true, comments: true, strings: true },
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: 'on',
  parameterHints: { enabled: true },
  hover: { enabled: true },
  'semanticHighlighting.enabled': true,
};

// ── Monaco theme definition ─────────────────────────────────────
const DARK_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment',    foreground: '6b7280', fontStyle: 'italic' },
    { token: 'keyword',    foreground: '818cf8' },
    { token: 'string',     foreground: '34d399' },
    { token: 'number',     foreground: 'fb923c' },
    { token: 'type',       foreground: '38bdf8' },
    { token: 'function',   foreground: 'fbbf24' },
    { token: 'variable',   foreground: 'e2e8f0' },
    { token: 'operator',   foreground: 'f472b6' },
    { token: 'delimiter',  foreground: '94a3b8' },
    { token: 'annotation', foreground: 'a78bfa' },
  ],
  colors: {
    'editor.background':              '#030712',
    'editor.foreground':              '#e2e8f0',
    'editor.lineHighlightBackground': '#111827',
    'editorLineNumber.foreground':    '#374151',
    'editorLineNumber.activeForeground': '#6b7280',
    'editor.selectionBackground':     '#1e3a5f',
    'editor.inactiveSelectionBackground': '#172a45',
    'editorCursor.foreground':        '#60a5fa',
    'editorWidget.background':        '#111827',
    'editorWidget.border':            '#1f2937',
    'editorSuggestWidget.background': '#111827',
    'editorSuggestWidget.border':     '#1f2937',
    'editorSuggestWidget.selectedBackground': '#1e3a5f',
    'editorHoverWidget.background':   '#111827',
    'editorHoverWidget.border':       '#1f2937',
    'scrollbarSlider.background':     '#1f2937',
    'scrollbarSlider.hoverBackground':'#374151',
  },
};

// ── Bug 3: Parse error line/col from stderr for all 5 languages ─
const parseErrorLines = (stderr, language) => {
  if (!stderr) return [];
  const errors = [];
  const lines = stderr.split('\n');

  if (language === 'python') {
    // "  File "...", line N" pattern
    lines.forEach((line, idx) => {
      const m = line.match(/\bline (\d+)\b/i);
      if (m) {
        const msg =
          lines.slice(idx + 1).find(l => l.trim() && !l.trim().startsWith('File'))?.trim()
          || line.trim();
        errors.push({ line: parseInt(m[1], 10), col: 1, message: msg });
      }
    });
  } else if (language === 'javascript') {
    // "something:N:M" Node.js/V8 format
    lines.forEach(line => {
      const m = line.match(/:(\d+):(\d+)/);
      if (m) {
        errors.push({ line: parseInt(m[1], 10), col: parseInt(m[2], 10), message: lines[0]?.trim() || 'Error' });
      }
    });
  } else if (language === 'java') {
    // "ClassName.java:N: error: message"
    lines.forEach(line => {
      const m = line.match(/\.java:(\d+):/);
      if (m) {
        const errPart = line.split(/:\d+:\s*/)[1]?.trim() || line.trim();
        errors.push({ line: parseInt(m[1], 10), col: 1, message: errPart });
      }
    });
  } else if (language === 'c' || language === 'cpp') {
    // "file.c:N:M: error: message"
    lines.forEach(line => {
      const m = line.match(/:(\d+):(\d+):\s*(?:error|warning):\s*(.*)/);
      if (m) {
        errors.push({ line: parseInt(m[1], 10), col: parseInt(m[2], 10), message: m[3]?.trim() || line.trim() });
      }
    });
  }

  // Deduplicate by line number
  const seen = new Set();
  return errors.filter(e => { if (seen.has(e.line)) return false; seen.add(e.line); return true; });
};

// ── Bug 3: ErrorLocationBar — shows ⚠ Line N:M — message badges ─
const ErrorLocationBar = ({ errors }) => {
  if (!errors?.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-red-950/30 border-t border-red-900/30 shrink-0">
      <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest mr-1">Errors</span>
      {errors.slice(0, 4).map((e, i) => (
        <span key={i} className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/50 border border-red-900/50 px-2 py-0.5 rounded font-mono">
          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
          Line {e.line}{e.col > 1 ? `:${e.col}` : ''} — {e.message.length > 45 ? e.message.slice(0, 45) + '…' : e.message}
        </span>
      ))}
    </div>
  );
};

// ── StatusBadge ─────────────────────────────────────────────────
const StatusBadge = ({ passed, isHidden }) => {
  if (isHidden && !passed) {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Hidden</span>;
  }
  return passed ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 ring-1 ring-green-200">
      <CheckCircle2 className="w-3 h-3" /> Passed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 ring-1 ring-red-200">
      <XCircle className="w-3 h-3" /> Failed
    </span>
  );
};

// ── TestResultsPanel ────────────────────────────────────────────
const TestResultsPanel = ({ results, passedCount, totalCount, runType, errorMessage }) => {
  const [expanded, setExpanded] = useState(null);
  if (!results?.length && !errorMessage) return null;

  const visibleResults = (results || []).filter((tc) => !tc.is_hidden);
  const visiblePassed  = visibleResults.filter((tc) => tc.passed).length;
  const visibleTotal   = visibleResults.length;

  const getStatusLabel = (tc) => {
    if (tc.passed) return null;
    const s = tc.judge0_status_id ?? 0;
    if (s === 5) return 'Time Limit Exceeded';
    if (s === 6) return 'Compilation Error';
    if (s >= 7)  return 'Runtime Error';
    if (tc.actual_output == null && tc.stderr) return 'Runtime Error';
    return 'Wrong Answer';
  };

  return (
    <div className="border-t border-gray-100">
      <div className={`px-4 py-2.5 flex items-center justify-between text-sm font-semibold ${
        errorMessage ? 'bg-red-50' : visiblePassed === visibleTotal ? 'bg-green-50' : 'bg-amber-50'
      }`}>
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-500" />
          <span className="text-gray-700">{runType === 'run' ? 'Run Results' : 'Submit Results'}</span>
          {!errorMessage && visibleResults.length > 0 && (
            <span className={`font-black ${visiblePassed === visibleTotal ? 'text-green-700' : 'text-amber-700'}`}>
              {visiblePassed}/{visibleTotal} passed
            </span>
          )}
        </div>
        {errorMessage && <span className="text-red-600 text-xs font-medium truncate max-w-xs">{errorMessage}</span>}
      </div>
      {visibleResults.length > 0 && (
        <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
          {visibleResults.map((tc, idx) => {
            const statusLabel = getStatusLabel(tc);
            const hasError    = tc.stderr && tc.stderr.trim();
            return (
              <div key={idx} className="bg-white">
                <button
                  onClick={() => setExpanded(expanded === idx ? null : idx)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                >
                  <StatusBadge passed={tc.passed} isHidden={false} />
                  <span className="text-xs text-gray-600 flex-1">
                    Test Case {idx + 1}
                    {!tc.passed && statusLabel && (
                      <span className="ml-2 text-[10px] font-bold text-red-500">— {statusLabel}</span>
                    )}
                  </span>
                  {tc.execution_time && (
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{tc.execution_time}s</span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded === idx ? 'rotate-180' : ''}`} />
                </button>
                {expanded === idx && (
                  <div className="px-4 pb-3 space-y-2 bg-gray-50/50">
                    {/* SQL questions: never show setup_sql to student — it's internal schema */}
                    {tc.input && !tc.is_hidden && !tc.setup_sql && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Input</p>
                        <pre className="text-xs bg-white border border-gray-100 rounded-lg px-3 py-2 font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap">{tc.input}</pre>
                      </div>
                    )}
                    {tc.setup_sql && !tc.is_hidden && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Schema (read-only)</p>
                        <pre className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">{tc.setup_sql}</pre>
                      </div>
                    )}
                    {tc.expected_output && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          {tc.setup_sql ? 'Expected Output' : 'Expected'}
                        </p>
                        <pre className="text-xs bg-white border border-gray-100 rounded-lg px-3 py-2 font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap">{tc.expected_output}</pre>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {tc.setup_sql ? 'Your Query Output' : 'Your Output'}
                      </p>
                      {tc.actual_output != null ? (
                        <pre className={`text-xs border rounded-lg px-3 py-2 font-mono overflow-x-auto whitespace-pre-wrap ${
                          tc.passed ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
                        }`}>{tc.actual_output === '' ? '(empty output)' : tc.actual_output}</pre>
                      ) : (
                        <div className="text-xs bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-gray-500 italic">
                          (no output{statusLabel ? ` — ${statusLabel}` : ''})
                        </div>
                      )}
                    </div>
                    {hasError && (
                      <div>
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">
                          {(tc.judge0_status_id ?? 0) === 6 ? 'Compilation Error' : 'Error / stderr'}
                        </p>
                        <pre className="text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2 font-mono text-red-700 overflow-x-auto whitespace-pre-wrap">{tc.stderr}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── CustomOutputPanel ───────────────────────────────────────────
const CustomOutputPanel = ({ result }) => {
  if (!result) return null;
  const hasOutput    = result.stdout != null;
  const hasError     = result.stderr != null && result.stderr !== '';
  const isCompileErr = result.execution_status === 'compile_error';
  const isTimeout    = result.execution_status === 'timeout';
  const isRuntimeErr = result.execution_status === 'runtime_error';
  const isErr        = isCompileErr || isRuntimeErr;

  return (
    <div className="border-t border-gray-100">
      <div className={`px-4 py-2.5 flex items-center gap-2 text-sm font-semibold ${
        isErr ? 'bg-red-50' : isTimeout ? 'bg-amber-50' : 'bg-gray-900'
      }`}>
        <Terminal className={`w-4 h-4 ${isErr || isTimeout ? 'text-gray-500' : 'text-green-400'}`} />
        <span className={isErr || isTimeout ? 'text-gray-700' : 'text-gray-300'}>Custom Run Output</span>
        {result.execution_time && (
          <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />{result.execution_time}s
          </span>
        )}
        {isTimeout && <span className="ml-auto text-xs font-bold text-amber-700">Time Limit Exceeded</span>}
      </div>
      <div className="p-3 bg-gray-950 space-y-2 max-h-56 overflow-y-auto">
        {hasOutput && (
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Output</p>
            <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap leading-relaxed">
              {result.stdout === '' ? '(empty output)' : result.stdout}
            </pre>
          </div>
        )}
        {!hasOutput && !hasError && !isTimeout && (
          <p className="text-xs text-gray-500 font-mono italic">(no output — your program printed nothing)</p>
        )}
        {hasError && (
          <div className="mt-1">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">
              {isCompileErr ? 'Compilation Error' : 'Error / stderr'}
            </p>
            <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap leading-relaxed">{result.stderr}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Auto-save helpers ───────────────────────────────────────────
const autosaveKey = (assessmentId, questionId, language) =>
  `icl_autosave_${assessmentId}_${questionId}_${language}`;

const saveToLocal = (assessmentId, questionId, language, code) => {
  try {
    localStorage.setItem(
      autosaveKey(assessmentId, questionId, language),
      JSON.stringify({ code, savedAt: Date.now() })
    );
  } catch (_) {}
};

const loadFromLocal = (assessmentId, questionId, language) => {
  try {
    const raw = localStorage.getItem(autosaveKey(assessmentId, questionId, language));
    if (!raw) return null;
    const { code } = JSON.parse(raw);
    return code || null;
  } catch (_) { return null; }
};

const clearLocal = (assessmentId, questionId, language) => {
  try { localStorage.removeItem(autosaveKey(assessmentId, questionId, language)); } catch (_) {}
};

// ── Main CodeEditor ─────────────────────────────────────────────
const CodeEditor = ({
  assessmentId,
  questionId,
  questionText,
  marks,
  boilerplateCode,
  defaultLanguage,
  isSql = false,
  onCodeSubmitted,
  disabled = false,
}) => {
  const monaco = useMonaco();

  const [languages,     setLanguages]     = useState([]);
  // SQL questions must always use 'sql' regardless of what defaultLanguage says
  const [language,      setLanguage]      = useState(isSql ? 'sql' : (defaultLanguage || 'python'));
  const [code,          setCode]          = useState('');
  const [runResult,     setRunResult]     = useState(null);
  const [submitResult,  setSubmitResult]  = useState(null);
  const [running,       setRunning]       = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [submitted,     setSubmitted]     = useState(false);
  const [showEditor,    setShowEditor]    = useState(true);
  const [editorReady,   setEditorReady]   = useState(false);

  // Custom input state
  const [inputMode,     setInputMode]     = useState('testcases');
  const [customInput,   setCustomInput]   = useState('');
  const [customResult,  setCustomResult]  = useState(null);
  const [runningCustom, setRunningCustom] = useState(false);

  // Bug 2: Fullscreen state + container ref
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Bug 3: Error locations for ErrorLocationBar
  const [errorLocations, setErrorLocations] = useState([]);

  const editorRef = useRef(null);
  const autosaveTimerRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'

  const getStarter = useCallback((lang) => STARTERS[lang] || '', []);
  const getInitialCode = useCallback((lang) => boilerplateCode || STARTERS[lang] || '', [boilerplateCode]);

  // Register custom Monaco theme
  useEffect(() => {
    if (!monaco) return;
    monaco.editor.defineTheme('icl-dark', DARK_THEME);
    monaco.editor.setTheme('icl-dark');
  }, [monaco]);

  // Configure JS/TS IntelliSense
  useEffect(() => {
    if (!monaco) return;
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
    });
  }, [monaco]);

  // Fetch available languages
  useEffect(() => {
    codeAPI.getLanguages().then(res => {
      if (res?.data?.length) setLanguages(res.data);
    }).catch(() => {});
  }, []);

  // Load saved code: localStorage draft first (instant), then fall back to API history
  useEffect(() => {
    setSubmitted(false);
    setSubmitResult(null);
    setRunResult(null);
    setCustomResult(null);
    setErrorLocations([]);
    setSaveStatus('idle');

    if (!assessmentId || !questionId) { setCode(getInitialCode(language)); return; }

    // 1. Restore draft from localStorage immediately (no network wait)
    // For SQL questions: purge any stale drafts saved under wrong language keys
    // (old broken sessions saved SQL code under 'python' key — clean those up)
    if (isSql) {
      ['python', 'javascript', 'java', 'cpp', 'c'].forEach(stale =>
        clearLocal(assessmentId, questionId, stale)
      );
    }
    const draft = loadFromLocal(assessmentId, questionId, language);
    if (draft) {
      setCode(draft);
      setSaveStatus('saved');
      return; // skip API call — user's latest draft is here
    }

    // 2. Fall back to server history
    codeAPI.getHistory(assessmentId, questionId).then(res => {
      if (res?.data?.length) {
        // For SQL questions: only restore history from a matching 'sql' run.
        // Old broken submissions were stored as language='python' and may contain
        // CREATE TABLE / INSERT lines — restoring them would corrupt the editor.
        const last = isSql
          ? res.data.find(r => r.language === 'sql')
          : res.data[0];
        if (last?.code) {
          setCode(last.code);
          setLanguage(isSql ? 'sql' : (last.language || defaultLanguage || 'python'));
          return;
        }
      }
      setCode(getInitialCode(language));
    }).catch(() => setCode(getInitialCode(language)));
  }, [assessmentId, questionId]);

  // Auto-save: debounce 800ms after every keystroke
  useEffect(() => {
    if (!assessmentId || !questionId || !code) return;
    setSaveStatus('saving');
    clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      saveToLocal(assessmentId, questionId, language, code);
      setSaveStatus('saved');
    }, 800);
    return () => clearTimeout(autosaveTimerRef.current);
  }, [code, language, assessmentId, questionId]);

  // Bug 2: Sync fullscreen state with browser fullscreenchange event
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Bug 2: Toggle fullscreen on editor container
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    const isDefault = Object.values(STARTERS).includes(code) || code === boilerplateCode || code === '';
    if (isDefault) setCode(getStarter(lang));
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    setEditorReady(true);
    editor.addCommand(
      (monaco?.KeyMod?.CtrlCmd ?? 0) | (monaco?.KeyCode?.Enter ?? 0),
      () => { if (inputMode === 'testcases') handleRun(); else handleRunCustom(); }
    );
  };

  // Bug 3: Apply Monaco error markers + scroll to first error
  const applyErrorMarkers = useCallback((stderr, lang) => {
    if (!monaco || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    const errors = parseErrorLines(stderr, lang);
    setErrorLocations(errors);
    const markers = errors.map(e => ({
      severity: monaco.MarkerSeverity.Error,
      startLineNumber: e.line,
      startColumn: e.col,
      endLineNumber: e.line,
      endColumn: model.getLineMaxColumn(Math.min(e.line, model.getLineCount())) || 100,
      message: e.message,
    }));
    monaco.editor.setModelMarkers(model, 'judge0', markers);
    if (errors.length > 0) editorRef.current.revealLineInCenter(errors[0].line);
  }, [monaco]);

  // Bug 3: Clear Monaco error markers
  const clearErrorMarkers = useCallback(() => {
    if (!monaco || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (model) monaco.editor.setModelMarkers(model, 'judge0', []);
    setErrorLocations([]);
  }, [monaco]);

  // ── Run against test cases (can be done multiple times before submit) ──
  const handleRun = async () => {
    if (!code.trim() || running) return;
    setRunning(true);
    setRunResult(null);
    setInputMode('testcases');
    clearErrorMarkers();
    try {
      const res = await codeAPI.runCode({ assessment_id: assessmentId, question_id: questionId, code, language });
      setRunResult(res.data);
      // Bug 3: Show error markers from first failing test case stderr
      const firstError = res.data?.test_results?.find(tc => !tc.passed && tc.stderr);
      if (firstError?.stderr) applyErrorMarkers(firstError.stderr, language);
    } catch (e) {
      setRunResult({ error_message: e.message || 'Run failed', test_results: [] });
    } finally { setRunning(false); }
  };

  const handleRunCustom = async () => {
    if (!code.trim() || runningCustom) return;
    setRunningCustom(true);
    setCustomResult(null);
    clearErrorMarkers();
    try {
      const res = await codeAPI.runCustom({ code, language, custom_input: customInput });
      setCustomResult(res.data);
      if (res.data?.stderr) applyErrorMarkers(res.data.stderr, language);
    } catch (e) {
      setCustomResult({ execution_status: 'runtime_error', output: null, stderr: e.message || 'Custom run failed' });
    } finally { setRunningCustom(false); }
  };

  const handleSubmit = async () => {
    if (!code.trim() || submitting || submitted) return;
    setSubmitting(true);
    setSubmitResult(null);
    clearErrorMarkers();
    try {
      const res = await codeAPI.submitCode({ assessment_id: assessmentId, question_id: questionId, code, language });
      setSubmitResult(res.data);
      setSubmitted(true);
      clearLocal(assessmentId, questionId, language); // draft fulfilled — clean up
      onCodeSubmitted?.({ passedCount: res.data.passed_count, totalCount: res.data.total_count, language, code });
      // Bug 3: Show error markers if any test failed with stderr
      const firstError = res.data?.test_results?.find(tc => !tc.passed && tc.stderr);
      if (firstError?.stderr) applyErrorMarkers(firstError.stderr, language);
    } catch (e) {
      setSubmitResult({ error_message: e.message || 'Submit failed', test_results: [] });
    } finally { setSubmitting(false); }
  };

  const handleReset = () => {
    setCode(getInitialCode(language));
    setRunResult(null);
    setSubmitResult(null);
    setCustomResult(null);
    clearErrorMarkers();
  };

  const activeResult = submitResult || runResult;

  return (
    // Bug 2: containerRef wraps entire editor — requestFullscreen() targets this element
    <div ref={containerRef} className="flex flex-col h-full overflow-hidden">

      {/* ── Code Editor Block ── */}
      <div className="border border-slate-800 rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden bg-[#0f172a] shadow-lg">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#0f172a] border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>

          <div className="relative">
            <>
              <select
                value={language}
                onChange={e => handleLanguageChange(e.target.value)}
                disabled={disabled || submitted}
                className="appearance-none bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] uppercase tracking-wider font-bold rounded-lg px-4 py-1.5 pr-8 outline-none border border-slate-700 transition-colors cursor-pointer"
              >
                {languages.length > 0
                  ? languages.map(l => <option key={l.name} value={l.name}>{l.label}</option>)
                  : ['python', 'javascript', 'java', 'cpp', 'c', 'sql'].map(l => (
                      <option key={l} value={l}>{l === 'java' ? 'JAVA - Java 11+' : l === 'sql' ? 'SQL - SQLite 3' : l.toUpperCase()}</option>
                    ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-slate-300">
              <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {code.split('\n').length} lines
              </span>
              <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {code.length} chars
              </span>
            </div>
            <button onClick={handleReset} disabled={disabled || submitted}
              className="p-1.5 rounded-md bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 transition-colors border border-blue-500/20" title="Reset code">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            {/* Auto-save status indicator */}
            <span className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all border ${
              saveStatus === 'saving'
                ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                : saveStatus === 'saved'
                ? 'bg-teal-600/20 border-teal-500/20 text-teal-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`} title="Auto-saved to browser">
              {saveStatus === 'saving' ? (
                <><Loader2 className="w-2.5 h-2.5 animate-spin" /> Saving…</>
              ) : saveStatus === 'saved' ? (
                <><Save className="w-2.5 h-2.5" /> Saved</>
              ) : (
                <><Save className="w-2.5 h-2.5" /> Auto-save</>
              )}
            </span>
            {/* Bug 2: Fullscreen button — fullscreens just the editor panel */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-md bg-slate-700/50 hover:bg-slate-600/70 text-slate-300 hover:text-white transition-colors border border-slate-600/50"
              title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen editor'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="bg-[#0f172a] flex-1 min-h-0 relative">
          <Editor
            height="100%"
            language={MONACO_LANG[language] || language}
            value={code}
            onChange={(val) => setCode(val ?? '')}
            theme="icl-dark"
            options={{ ...EDITOR_OPTIONS, readOnly: disabled || submitted }}
            onMount={handleEditorDidMount}
            loading={
              <div className="flex items-center justify-center h-full bg-[#0f172a] text-slate-500 text-xs gap-2 font-bold">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> Loading IDE…
              </div>
            }
          />
        </div>

        {/* Bug 3: Error location badges — shown above footer when errors exist */}
        <ErrorLocationBar errors={errorLocations} />

        {/* Footer */}
        <div className="px-3 py-1.5 border-t border-slate-800/80 bg-[#0b1222] shrink-0">
          <p className="text-[10px] font-bold text-slate-500 font-mono tracking-wider">
            {language === 'sql'
              ? 'SQL — SQLite 3 • Schema is pre-loaded • Write only your SELECT query'
              : 'Ready to Execute • Press Run Code'}
          </p>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex flex-wrap items-center gap-2 mt-2 shrink-0">
        {/* Custom input toggle — hidden when SQL language selected (SQL has no stdin) */}
        {language !== 'sql' && (
          <button
            onClick={() => setInputMode(p => p === 'custom' ? 'testcases' : 'custom')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-[11px] font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
          >
            {inputMode === 'custom' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {inputMode === 'custom' ? 'Hide Custom Input' : 'Show Custom Input'}
          </button>
        )}

        <div className="flex-1" />

        {/* Run Code — switches to testcases mode so results are visible */}
        <button onClick={handleRun} disabled={disabled || running || submitting || !code.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] hover:bg-blue-600 text-white rounded-lg text-[12px] font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50">
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Run Code
        </button>

        <button onClick={() => { setInputMode('testcases'); handleRun(); }} disabled={disabled || running || submitting || !code.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#a855f7] hover:bg-purple-600 text-white rounded-lg text-[12px] font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50">
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
          Run Test Cases
        </button>

        <button onClick={handleSubmit} disabled={disabled || running || submitting || submitted || !code.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#22c55e] hover:bg-green-600 text-white rounded-lg text-[12px] font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50">
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5" />}
          {submitting ? 'Submitting...' : submitted ? 'Submitted ✓' : 'Submit'}
        </button>
      </div>

      {/* ── Custom Input / Results ── */}
      {(inputMode === 'custom' || activeResult || customResult) && (
        <div className="mt-2 shrink-0 max-h-[180px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          {inputMode === 'custom' && (
            <>
              <div className="bg-gray-50 border-b border-gray-100 px-3 py-2 flex items-center justify-between sticky top-0">
                <span className="text-[12px] font-bold text-gray-700 flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" /> Custom Input (stdin)
                  <span className="text-gray-400 text-[10px] font-medium ml-1">- Type your input here...</span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {customInput.split('\n').length} lines | {customInput.length} chars
                  </span>
                  <button onClick={() => setCustomInput('')} className="text-[10px] text-blue-600 font-bold hover:underline">Reset</button>
                </div>
              </div>
              <textarea
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                rows={3}
                spellCheck={false}
                className="w-full text-[12px] font-mono p-3 outline-none resize-none text-gray-800 placeholder-gray-300"
                placeholder="leetcode"
              />
            </>
          )}
          {inputMode === 'testcases' && activeResult && (
            <TestResultsPanel
              results={activeResult.test_results}
              passedCount={activeResult.passed_count}
              totalCount={activeResult.total_count}
              runType={activeResult.run_type || (submitResult ? 'submit' : 'run')}
              errorMessage={activeResult.error_message}
            />
          )}
          {inputMode === 'custom' && customResult && (
            <CustomOutputPanel result={customResult} />
          )}
        </div>
      )}

    </div>
  );
};

export default CodeEditor;