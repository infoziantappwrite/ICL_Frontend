// src/components/assessment/CodeEditor.jsx
// Full-featured code editor for coding assessment questions
// Uses a textarea with monospace font (no external deps needed)
//
// Run modes:
//   "Test Cases"   — runs against the question's visible test cases (pass/fail shown)
//   "Custom Input" — student types their own stdin; raw output shown, no pass/fail

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Send, ChevronDown, Loader2, CheckCircle2, XCircle,
  Terminal, RefreshCw, Code2, Eye, EyeOff, AlertTriangle,
  Clock, Keyboard, FlaskConical,
} from 'lucide-react';
import { codeAPI } from '../../api/Api';

// ── Default starter templates ──────────────────────────────────
const STARTERS = {
  python:     `def solution():\n    # Write your solution here\n    pass\n\n# Call your function\nprint(solution())\n`,
  javascript: `function solution() {\n  // Write your solution here\n}\n\n// Call your function\nconsole.log(solution());\n`,
  java:       `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n`,
  cpp:        `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  c:          `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
};

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

// Test Cases result panel
const TestResultsPanel = ({ results, passedCount, totalCount, runType, errorMessage }) => {
  const [expanded, setExpanded] = useState(null);
  if (!results?.length && !errorMessage) return null;

  // Human-readable label based on Judge0 status id stored in result
  const getStatusLabel = (tc) => {
    if (tc.passed) return null;
    const s = tc.judge0_status_id ?? 0;
    if (s === 5)  return 'Time Limit Exceeded';
    if (s === 6)  return 'Compilation Error';
    if (s >= 7)   return 'Runtime Error';
    if (tc.actual_output == null && tc.stderr) return 'Runtime Error';
    return 'Wrong Answer';
  };

  return (
    <div className="border-t border-gray-100">
      <div className={`px-4 py-2.5 flex items-center justify-between text-sm font-semibold ${
        errorMessage ? 'bg-red-50' : passedCount === totalCount ? 'bg-green-50' : 'bg-amber-50'
      }`}>
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-500" />
          <span className="text-gray-700">{runType === 'run' ? 'Run Results' : 'Submit Results'}</span>
          {!errorMessage && results?.length > 0 && (
            <span className={`font-black ${passedCount === totalCount ? 'text-green-700' : 'text-amber-700'}`}>
              {passedCount}/{totalCount} passed
            </span>
          )}
        </div>
        {errorMessage && <span className="text-red-600 text-xs font-medium truncate max-w-xs">{errorMessage}</span>}
      </div>
      {results && results.length > 0 && (
        <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
          {results.map((tc, idx) => {
            const statusLabel = getStatusLabel(tc);
            const hasError    = tc.stderr && tc.stderr.trim();
            return (
              <div key={idx} className="bg-white">
                <button
                  onClick={() => setExpanded(expanded === idx ? null : idx)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                >
                  <StatusBadge passed={tc.passed} isHidden={tc.is_hidden} />
                  <span className="text-xs text-gray-600 flex-1">
                    Test Case {idx + 1}{tc.is_hidden && <span className="ml-1 text-gray-400">(Hidden)</span>}
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
                    {tc.input && !tc.is_hidden && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Input</p>
                        <pre className="text-xs bg-white border border-gray-100 rounded-lg px-3 py-2 font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap">{tc.input}</pre>
                      </div>
                    )}
                    {tc.expected_output && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Expected</p>
                        <pre className="text-xs bg-white border border-gray-100 rounded-lg px-3 py-2 font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap">{tc.expected_output}</pre>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Your Output</p>
                      {tc.actual_output != null ? (
                        // FIXED: check != null so empty string "" is treated as real output
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

// Custom Input result panel — raw stdout, no pass/fail
const CustomOutputPanel = ({ result }) => {
  if (!result) return null;
  // FIXED: hasOutput is true even when output is "" (empty string) — that IS output.
  // Only null means Judge0 returned nothing at all.
  const hasOutput    = result.output != null;
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
              {result.output === '' ? '(empty output)' : result.output}
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

// ── Main CodeEditor ────────────────────────────────────────────
const CodeEditor = ({
  assessmentId,
  questionId,
  questionText,
  marks,
  boilerplateCode,
  defaultLanguage,
  onCodeSubmitted,
  disabled = false,
}) => {
  const [languages,     setLanguages]     = useState([]);
  const [language,      setLanguage]      = useState(defaultLanguage || 'python');
  const [code,          setCode]          = useState('');
  const [runResult,     setRunResult]     = useState(null);
  const [submitResult,  setSubmitResult]  = useState(null);
  const [running,       setRunning]       = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [submitted,     setSubmitted]     = useState(false);
  const [showEditor,    setShowEditor]    = useState(true);

  // Custom input state
  const [inputMode,     setInputMode]     = useState('testcases'); // 'testcases' | 'custom'
  const [customInput,   setCustomInput]   = useState('');
  const [customResult,  setCustomResult]  = useState(null);
  const [runningCustom, setRunningCustom] = useState(false);

  const textareaRef = useRef(null);

  const getStarter = useCallback((lang) => {
    if (boilerplateCode) return boilerplateCode;
    return STARTERS[lang] || '';
  }, [boilerplateCode]);

  useEffect(() => {
    codeAPI.getLanguages().then(res => {
      if (res?.data?.length) setLanguages(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!assessmentId || !questionId) { setCode(getStarter(language)); return; }
    codeAPI.getHistory(assessmentId, questionId).then(res => {
      if (res?.data?.length) {
        const last = res.data[0];
        if (last.code) { setCode(last.code); setLanguage(last.language || defaultLanguage || 'python'); return; }
      }
      setCode(getStarter(language));
    }).catch(() => setCode(getStarter(language)));
  }, [assessmentId, questionId, getStarter]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    const isDefault = Object.values(STARTERS).includes(code) || code === boilerplateCode || code === '';
    if (isDefault) setCode(getStarter(lang));
  };

  const handleRun = async () => {
    if (!code.trim() || running) return;
    setRunning(true); setRunResult(null);
    try {
      const res = await codeAPI.runCode({ assessment_id: assessmentId, question_id: questionId, code, language });
      setRunResult(res.data);
    } catch (e) {
      setRunResult({ error_message: e.message || 'Run failed', test_results: [] });
    } finally { setRunning(false); }
  };

  const handleRunCustom = async () => {
    if (!code.trim() || runningCustom) return;
    setRunningCustom(true); setCustomResult(null);
    try {
      const res = await codeAPI.runCustom({ code, language, custom_input: customInput });
      setCustomResult(res.data);
    } catch (e) {
      setCustomResult({ execution_status: 'runtime_error', output: null, stderr: e.message || 'Custom run failed' });
    } finally { setRunningCustom(false); }
  };

  const handleSubmit = async () => {
    if (!code.trim() || submitting || submitted) return;
    setSubmitting(true); setSubmitResult(null);
    try {
      const res = await codeAPI.submitCode({ assessment_id: assessmentId, question_id: questionId, code, language });
      setSubmitResult(res.data);
      setSubmitted(true);
      onCodeSubmitted?.({ passedCount: res.data.passed_count, totalCount: res.data.total_count, language, code });
    } catch (e) {
      setSubmitResult({ error_message: e.message || 'Submit failed', test_results: [] });
    } finally { setSubmitting(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      const start = ta.selectionStart, end = ta.selectionEnd;
      const next = code.substring(0, start) + '    ' + code.substring(end);
      setCode(next);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 4; });
    }
  };

  const activeResult = submitResult || runResult;

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border-b border-gray-700">
        <Code2 className="w-4 h-4 text-blue-400 shrink-0" />
        <span className="text-xs font-bold text-gray-300 flex-1">Code Editor</span>
        <div className="relative">
          <select
            value={language}
            onChange={e => handleLanguageChange(e.target.value)}
            disabled={disabled || submitted}
            className="appearance-none bg-gray-800 border border-gray-600 text-gray-200 text-xs font-semibold rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-60"
          >
            {languages.length > 0
              ? languages.map(l => <option key={l.name} value={l.name}>{l.label}</option>)
              : ['python','javascript','java','cpp','c'].map(l => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
          </select>
          <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <button
          onClick={() => { setCode(getStarter(language)); setRunResult(null); setSubmitResult(null); setCustomResult(null); }}
          disabled={disabled || submitted} title="Reset to starter"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors disabled:opacity-40"
        ><RefreshCw className="w-3.5 h-3.5" /></button>
        <button
          onClick={() => setShowEditor(p => !p)} title={showEditor ? 'Hide editor' : 'Show editor'}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
        >{showEditor ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
      </div>

      {/* Code textarea */}
      {showEditor && (
        <div className="relative bg-gray-950">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || submitted}
            rows={16}
            spellCheck={false} autoCorrect="off" autoCapitalize="off"
            className="w-full bg-transparent text-green-300 font-mono text-[13px] px-5 py-4 focus:outline-none resize-none leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="// Write your solution here..."
          />
        </div>
      )}

      {/* ── Input Mode Tabs + Action Buttons ─────────────────── */}
      <div className="flex items-stretch border-t border-gray-700 bg-gray-900">
        {/* Tabs */}
        <button
          onClick={() => setInputMode('testcases')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
            inputMode === 'testcases'
              ? 'border-blue-500 text-blue-400 bg-gray-800'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" /> Test Cases
        </button>
        <button
          onClick={() => setInputMode('custom')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
            inputMode === 'custom'
              ? 'border-purple-500 text-purple-400 bg-gray-800'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <Keyboard className="w-3.5 h-3.5" /> Custom Input
        </button>

        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex items-center gap-2 px-3">
          {inputMode === 'testcases' ? (
            <>
              <button
                onClick={handleRun}
                disabled={disabled || running || submitting || !code.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                {running ? 'Running…' : 'Run'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={disabled || running || submitting || submitted || !code.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {submitting ? 'Submitting…' : submitted ? 'Submitted ✓' : 'Submit Code'}
              </button>
            </>
          ) : (
            <button
              onClick={handleRunCustom}
              disabled={disabled || runningCustom || !code.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runningCustom ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {runningCustom ? 'Running…' : 'Run with Input'}
            </button>
          )}
        </div>
      </div>

      {/* Custom Input textarea */}
      {inputMode === 'custom' && (
        <div className="bg-gray-950 border-t border-gray-800">
          <div className="px-4 pt-3 pb-1">
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1.5">
              stdin — one line per input() call
            </p>
            <textarea
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              rows={4}
              spellCheck={false}
              placeholder={"e.g.\n4\n2 7 11 15\n9"}
              className="w-full bg-gray-900 border border-gray-700 text-gray-200 font-mono text-[13px] px-3 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none leading-relaxed placeholder-gray-600"
            />
          </div>
          <p className="px-4 pb-2.5 text-[11px] text-gray-600 font-medium">
            Each line maps to one <code className="text-gray-400 bg-gray-800 px-1 rounded">input()</code> call.
            This <strong className="text-gray-500">does not affect your score</strong> — for testing only.
          </p>
        </div>
      )}

      {/* Submitted status bar */}
      {inputMode === 'testcases' && submitted && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-t border-gray-700">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span className="text-xs font-semibold text-green-400">Code submitted</span>
          {submitResult && (
            <span className="text-gray-400 text-xs">
              — {submitResult.passed_count}/{submitResult.total_count} test cases passed
            </span>
          )}
        </div>
      )}

      {/* Result panels */}
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
  );
};

export default CodeEditor;