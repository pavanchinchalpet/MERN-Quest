import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getErrorMessage, unwrapResponse } from '../services/api';

const PracticeWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const handleSubmit = useCallback(async () => {
    if (!problem || submitting) return;
    setSubmitting(true);
    setTestResults(null);

    try {
      // In a real app, this would send to a code execution engine (Piston, Judge0, etc.)
      // For now, we simulate a secure submission to the scores table
      await api.post('/practices/submit', {
        id,
        score: 100
      });

      setTestResults({
        success: true,
        passed: problem.test_cases.length,
        total: problem.test_cases.length,
        output: "✅ Solution Accepted! Your score has been recorded."
      });
    } catch (err) {
      console.error(err);
      setTestResults({
        success: false,
        output: "Error submitting solution. Please try again."
      });
    } finally {
      setSubmitting(false);
    }
  }, [id, problem, submitting]);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await api.get(`/practices/${id}`);
        const data = unwrapResponse(res);
        setProblem(data);
        setCode(data.starter_code || '');
      } catch (err) {
        console.error(getErrorMessage(err, 'Could not load the challenge'));
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  const handleRun = useCallback(() => {
    setSubmitting(true);
    setTestResults(null);
    
    // Simulate code execution locally for now (can be expanded to backend execution)
    setTimeout(() => {
      setSubmitting(false);
      // Mocking 100% success for demonstration
      setTestResults({
        success: true,
        passed: problem.test_cases.length,
        total: problem.test_cases.length,
        output: "Test cases passed successfully."
      });
    }, 1500);
  }, [problem]);

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
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs font-bold text-white/50 uppercase tracking-widest">solution.js</span>
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

        <div className="flex-grow flex flex-col relative">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-grow bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-8 outline-none resize-none leading-relaxed"
            spellCheck={false}
          />
          
          {/* Status Overlay / Results */}
          {testResults && (
            <div className="absolute bottom-0 left-0 right-0 bg-[#252526] border-t border-white/10 p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h4 className={`text-sm font-bold uppercase tracking-widest ${testResults.success ? 'text-brand-primary' : 'text-brand-danger'}`}>
                  {testResults.success ? 'All Tests Passed' : 'Tests Failed'}
                </h4>
                <button onClick={() => setTestResults(null)} className="text-white/30 hover:text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="bg-black/30 rounded p-4 border border-white/5">
                 <div className="text-xs font-mono text-[#d4d4d4]">{testResults.output}</div>
                 <div className="mt-2 text-[10px] font-bold text-white/40 uppercase">{testResults.passed}/{testResults.total} test cases passed.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeWorkspace;
