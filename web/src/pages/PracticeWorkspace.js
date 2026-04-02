import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import api, { getErrorMessage, unwrapResponse } from '../services/api';

const PracticeWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [language, setLanguage] = useState('javascript');

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const executeCode = useCallback(async (isTest = false) => {
    if (!problem || submitting) return;
    setSubmitting(true);
    setTestResults(null);

    try {
      const res = await api.post('/practices/submit', {
        id,
        code,
        language,
        isTest
      });
      
      const result = unwrapResponse(res);
      
      setTestResults({
        success: result.status === 'Accepted',
        status: result.status,
        passed: result.passedCount,
        total: result.totalCount,
        runtime: result.runtime,
        userLogs: result.userLogs || [],
        output: result.results?.map((r, i) => 
          `${r.passed ? '✅' : '❌'} Case ${i + 1}: ${r.passed ? 'Passed' : r.error || 'Wrong Answer'}`
        ).join('\n') || result.error,
        pointsEarned: result.pointsEarned
      });

      if (result.status === 'Accepted' && !isTest) {
        // Points already updated on backend
      }
    } catch (err) {
      setTestResults({
        success: false,
        status: 'Error',
        output: getErrorMessage(err, 'Execution failed'),
        userLogs: [],
        passed: 0,
        total: problem.test_cases?.length || 0
      });
    } finally {
      setSubmitting(false);
    }
  }, [id, problem, code, language, submitting]);

  const handleSubmit = () => executeCode(false);
  const handleRun = () => executeCode(true);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await api.get(`/practices/${id}`);
        const data = unwrapResponse(res);
        setProblem(data);
        const initialLang = data.category?.toLowerCase() || 'javascript';
        setLanguage(initialLang === 'dsa' ? 'javascript' : initialLang);
        setCode(data.starter_code || '');
      } catch (err) {
        console.error(getErrorMessage(err, 'Could not load the challenge'));
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);


  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[70vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-dark-border border-t-brand-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-[64px] bg-white flex flex-col md:flex-row overflow-hidden animate-fade-in z-40">
      {/* Left Pane: Problem Description */}
      <div className="w-full md:w-[40%] flex flex-col border-b md:border-b-0 md:border-r border-dark-border bg-dark-surface overflow-y-auto p-8">
        <div className="mb-6 flex items-center justify-between">
          <button 
            onClick={() => navigate('/practice')}
            className="text-xs font-bold text-text-tertiary hover:text-brand-primary flex items-center gap-1 uppercase tracking-wider transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Library
          </button>
          <span className={`badge ${
            problem.difficulty === 'easy' ? 'badge-success' : 
            problem.difficulty === 'medium' ? 'badge-warning' : 'badge-danger'
          }`}>
            {problem.difficulty}
          </span>
        </div>

        <h1 className="text-2xl font-black text-text-primary mb-4">{problem.title}</h1>
        <p className="text-text-secondary leading-relaxed mb-8 whitespace-pre-wrap">{problem.description}</p>

        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-tertiary border-b border-dark-border pb-2">Example Test Cases</h3>
          {problem.test_cases.map((t, idx) => (
            <div key={idx} className="bg-white border border-dark-border rounded-md p-4 shadow-sm">
              <div className="text-[10px] font-black text-text-tertiary uppercase mb-2">Case {idx + 1}</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-text-tertiary mb-1">Input</div>
                  <code className="text-xs font-mono bg-dark-surface px-2 py-1 rounded block truncate">{t.input}</code>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-text-tertiary mb-1">Output</div>
                  <code className="text-xs font-mono bg-brand-primary/10 text-brand-primary px-2 py-1 rounded block truncate">{t.output}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane: Code Editor */}
      <div className="w-full md:w-[60%] flex flex-col bg-[#1e1e1e] relative">
        <div className="h-12 border-b border-white/10 flex items-center justify-between px-6 bg-[#252526] shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[#3c3c3c] text-white text-[10px] font-bold uppercase tracking-widest border-none rounded px-3 py-1 outline-none cursor-pointer hover:bg-[#4a4a4a] transition-colors"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="sql">SQL</option>
              </select>
            </div>
            <span className="font-mono text-[10px] font-bold text-white/30 uppercase tracking-widest">
              {language === 'sql' ? 'query.sql' : language === 'python' ? 'solution.py' : language === 'java' ? 'Solution.java' : 'solution.js'}
            </span>
          </div>
          <div className="flex items-center gap-3">
             <button
               onClick={handleRun}
               disabled={submitting}
               className="px-4 py-1.5 bg-[#404040] hover:bg-[#505050] text-white rounded text-xs font-bold transition-colors disabled:opacity-50"
             >
               {submitting ? 'Running...' : 'Run Code'}
             </button>
             <button
               onClick={handleSubmit}
               disabled={submitting}
               className="px-4 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
             >
               Submit
             </button>
          </div>
        </div>

        <div className="flex-grow flex flex-col relative overflow-hidden">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 20 },
              lineNumbers: 'on',
              fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
              fontLigatures: true,
            }}
          />
          
          {/* Status Overlay / Results */}
          {testResults && (
            <div className="absolute bottom-0 left-0 right-0 bg-[#252526] border-t border-white/10 p-6 animate-slide-up z-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h4 className={`text-sm font-bold uppercase tracking-widest ${
                    testResults.status === 'Accepted' ? 'text-brand-primary' : 'text-brand-danger'
                  }`}>
                    {testResults.status}
                  </h4>
                  {testResults.runtime !== undefined && (
                    <span className="text-[10px] font-bold text-white/30 uppercase">
                      Runtime: {testResults.runtime}ms
                    </span>
                  )}
                </div>
                <button onClick={() => setTestResults(null)} className="text-white/30 hover:text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-4 overflow-hidden max-h-[300px]">
                {/* Test Results */}
                <div className="flex-1 bg-black/30 rounded p-4 border border-white/5 overflow-y-auto">
                   <div className="text-[10px] font-black text-white/30 uppercase mb-2 tracking-widest">Test Results</div>
                   <div className="text-xs font-mono text-[#d4d4d4] whitespace-pre-wrap">{testResults.output}</div>
                   <div className="mt-4 text-[10px] font-bold text-white/40 uppercase">{testResults.passed}/{testResults.total} test cases passed.</div>
                </div>

                {/* Console Logs */}
                {testResults.userLogs && testResults.userLogs.length > 0 && (
                  <div className="flex-1 bg-black/30 rounded p-4 border border-white/5 overflow-y-auto border-l-4 border-l-brand-primary">
                    <div className="text-[10px] font-black text-white/30 uppercase mb-2 tracking-widest">Console Output</div>
                    <div className="text-xs font-mono text-brand-primary/80 space-y-1">
                      {testResults.userLogs.map((log, i) => (
                        <div key={i} className="border-b border-white/5 pb-1 last:border-0">{log}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeWorkspace;
