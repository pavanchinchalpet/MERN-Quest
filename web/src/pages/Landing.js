import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const learningHighlights = [
    {
      title: 'Visual DSA Practice',
      description: 'Understand arrays, strings, linked lists, stacks, queues, trees, and graphs with problem solving that feels clear instead of overwhelming.'
    },
    {
      title: 'See Code As It Runs',
      description: 'Watch how loops, conditions, class objects, and step-by-step logic affect data while you write code in the editor.'
    },
    {
      title: 'Quiz + Assessment Flow',
      description: 'Build confidence through topic quizzes, coding assessments, and guided checkpoints that make daily practice easier to stick with.'
    },
    {
      title: 'Interview-Focused Growth',
      description: 'Bring together hands-on coding, technical knowledge, and easy-to-follow explanations inspired by the best parts of platforms like HackerRank and LeetCode.'
    }
  ];

  const experienceSections = [
    {
      eyebrow: 'Learn By Seeing',
      title: 'A platform where every DSA concept becomes easier to understand visually',
      description:
        'We are building CodeSprint as a learning platform where users do not just read theory and submit answers. They understand what is happening inside the code. As they solve DSA problems, they can follow the movement of arrays, strings, variables, and logic in a more visual and practical way.',
      points: [
        'Track how values move inside arrays and strings while the algorithm executes.',
        'Make conditions, iterations, and nested loops easier to understand with visual feedback.',
        'Turn abstract problem statements into something students and freshers can actually follow.'
      ]
    },
    {
      eyebrow: 'Write And Watch',
      title: 'Visualize code behavior while writing loops, classes, objects, and conditions',
      description:
        'The goal is to help learners connect syntax with behavior. When a user writes a loop, a condition, or class-based logic, the platform can show how the data changes, how the flow moves, and why the output happens. That makes debugging and learning feel much more natural.',
      points: [
        'See each iteration update the data structure step by step.',
        'Understand how objects, methods, and class-based patterns affect state.',
        'Reduce confusion by showing the problem, the code, and the result together.'
      ]
    }
  ];

  const roadmap = [
    'Structured DSA tracks for arrays, strings, recursion, trees, graphs, and dynamic programming.',
    'Problem pages that combine explanations, code editor practice, and visual execution.',
    'Quiz and coding assessment modules for technical knowledge and interview preparation.',
    'A learner-friendly experience that keeps advanced topics understandable for beginners.',
    'Optional AI assistance to improve explanations, feedback, and future UI learning experiences.'
  ];

  const codeLines = [
    'class DynamicArray {',
    '  constructor(capacity = 1) {',
    '    this.arr = new Array(capacity);',
    '    this.size = 0;',
    '  }',
    '',
    '  pushBack(n) {',
    '    if (this.size === this.arr.length) {',
    '      this.resize();',
    '    }',
    '    this.arr[this.size] = n;',
    '    this.size++;',
    '  }',
    '}'
  ];

  const traceSteps = [
    { label: 'Create array', active: false },
    { label: 'pushBack(7)', active: true },
    { label: 'pushBack(11)', active: false },
    { label: 'resize()', active: false }
  ];

  const visualCells = [7, 11, null, null];

  return (
    <div className="flex flex-col min-h-screen w-full bg-white overflow-x-hidden">
      {/* Top Navigation for Landing */}
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-12 box-border">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand-primary text-white flex items-center justify-center font-bold text-xl shrink-0">
              C
            </div>
            <span className="text-xl font-bold tracking-tight text-text-primary">CodeSprint</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-semibold text-sm text-text-secondary">
            <Link to="/home" className="hover:text-brand-primary transition-colors">Practice</Link>
            <Link to="/home" className="hover:text-brand-primary transition-colors">Problems</Link>
            <Link to="/home" className="hover:text-brand-primary transition-colors">Assessments</Link>
            <Link to="/home" className="hover:text-brand-primary transition-colors">Contests</Link>
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <Link to="/login" className="text-sm font-semibold text-text-primary hover:text-brand-primary transition-colors">
              Login
            </Link>
            <Link to="/register" className="btn-primary py-2 px-5 text-sm hidden sm:inline-flex">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex items-center pt-24 pb-16 px-6 sm:px-12 max-w-7xl mx-auto w-full relative overflow-hidden box-border">
        <div className="absolute top-20 right-10 w-64 h-64 bg-brand-primary/10 rounded-full blur-[80px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-emerald-300/10 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="grid lg:grid-cols-2 gap-12 items-center w-full min-w-0">
          <div className="flex flex-col items-start z-10">
            <div className="text-xs font-bold tracking-[0.2em] text-brand-primary uppercase mb-6 flex items-center gap-3">
              <span className="w-8 h-px bg-brand-primary"></span>
              Built For Students, Freshers, And Self-Learners
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-text-primary leading-[1.1] tracking-tight mb-8">
              Learn DSA better.<br />
              Practice with visuals.<br />
              <span className="text-brand-primary">Build real tech confidence.</span>
            </h1>

            <p className="text-lg text-text-secondary mb-10 max-w-lg leading-relaxed font-medium">
              CodeSprint is growing into a learning platform where users can understand data structures and algorithms in a much clearer way. Practice problems, quizzes, coding assessments, and visual execution will work together so learners can see how their code behaves while they build strong technical skills.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link to="/register" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto flex items-center justify-center gap-2">
                Start Practicing
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
              <Link to="/login" className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto">
                Explore Problems
              </Link>
            </div>
          </div>

          <div className="relative hidden lg:block z-0 animate-float overflow-hidden min-w-0">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-white to-emerald-100/40 rounded-[40px] border border-dark-border/50 transform rotate-2"></div>
            <div className="relative w-full max-w-full aspect-[1.18/1] rounded-[36px] border border-dark-border bg-white shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-dark-border px-6 py-4 bg-dark-surface/30">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  </div>
                  <div className="text-sm font-semibold text-text-primary">Dynamic Array Visual Lab</div>
                </div>
                <div className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary">
                  AI Assisted
                </div>
              </div>

              <div className="grid h-[calc(100%-65px)] grid-cols-[1.1fr_0.9fr]">
                <div className="border-r border-dark-border bg-white">
                  <div className="flex items-center justify-between border-b border-dark-border px-5 py-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-text-tertiary font-bold">Editor</p>
                      <p className="text-sm font-semibold text-text-primary">dynamic-array.js</p>
                    </div>
                    <div className="rounded-lg border border-dark-border bg-dark-surface/40 px-3 py-1 text-xs font-semibold text-text-secondary">
                      JavaScript
                    </div>
                  </div>

                  <div className="px-5 py-4 font-mono text-sm space-y-2">
                    {codeLines.map((line, index) => (
                      <div key={`${index}-${line}`} className={`flex gap-4 ${index === 7 || index === 10 ? 'rounded-lg bg-brand-primary/5 px-2 py-1 -mx-2' : ''}`}>
                        <span className="w-5 text-right text-brand-primary/80">{index + 1}</span>
                        <span className={`${index === 7 || index === 10 ? 'text-text-primary' : 'text-text-secondary'}`}>
                          {line || ' '}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-dark-border px-5 py-4 bg-dark-surface/20">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-emerald-600">Accepted</p>
                      <p className="text-xs font-semibold text-text-secondary">3 / 3 test cases passed</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
                        Visualize code
                      </div>
                      <div className="rounded-lg border border-dark-border px-4 py-2 text-sm font-semibold text-text-secondary">
                        Run again
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 text-white flex flex-col">
                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-white/50 font-bold">CodeSprint Bot</p>
                      <p className="text-sm font-semibold">Visualization Trace</p>
                    </div>
                    <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                      Step 2 / 4
                    </div>
                  </div>

                  <div className="p-5 space-y-4 flex-1">
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-cyan-300 font-bold mb-3">Narration</p>
                      <p className="text-sm leading-relaxed text-white/85">
                        The learner called <span className="font-semibold text-white">pushBack(11)</span>. The bot explains that the array still has space, so the value is inserted at index 1 and size increases to 2.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300 font-bold">Internal Array</p>
                        <p className="text-xs text-white/50">this.arr</p>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {visualCells.map((value, index) => (
                          <div key={`${value}-${index}`} className={`rounded-xl border p-3 text-center ${index === 1 ? 'border-cyan-300 bg-cyan-300/20' : 'border-white/10 bg-white/5'}`}>
                            <div className="text-lg font-bold text-white">{value ?? '_'}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/45">idx {index}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300 font-bold">Execution Flow</p>
                        <p className="text-xs text-white/50">guided replay</p>
                      </div>
                      <div className="space-y-2">
                        {traceSteps.map((step) => (
                          <div key={step.label} className={`flex items-center justify-between rounded-xl px-3 py-2 ${step.active ? 'bg-cyan-300/15 border border-cyan-300/30' : 'bg-white/5 border border-white/5'}`}>
                            <span className={`text-sm ${step.active ? 'text-white font-semibold' : 'text-white/65'}`}>{step.label}</span>
                            <span className={`h-2.5 w-2.5 rounded-full ${step.active ? 'bg-cyan-300' : 'bg-white/20'}`}></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Learning Section */}
      <section className="border-t border-dark-border py-12 px-6 sm:px-12 bg-dark-surface/30">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">
            Everything You Need To Grow
          </p>
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-text-primary mb-10">
            Learn coding with focused practice, visual clarity, and real interview prep
          </h2>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {learningHighlights.map((item) => (
              <div
                key={item.title}
                className="glass-card p-6 h-full"
              >
                <h3 className="text-xl font-bold text-text-primary mb-3">{item.title}</h3>
                <p className="text-text-secondary leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-2">
          {experienceSections.map((section) => (
            <div key={section.title} className="glass-card p-8 sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-primary mb-4">{section.eyebrow}</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-text-primary leading-tight mb-5">
                {section.title}
              </h2>
              <p className="text-text-secondary leading-relaxed mb-6">
                {section.description}
              </p>
              <div className="space-y-3">
                {section.points.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-primary shrink-0"></div>
                    <p className="text-sm sm:text-base text-text-secondary leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 sm:px-12 pb-20">
        <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-start">
          <div className="glass-panel p-8 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-primary mb-4">Platform Vision</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-5">
              More than practice problems, this is a guided field for visual technical learning
            </h2>
            <p className="text-text-secondary leading-relaxed mb-6">
              We want the platform to feel approachable for someone who is learning from scratch and still useful for someone preparing seriously for interviews. That means combining coding practice, quizzes, assessments, and strong visual explanations so every topic becomes easier to understand and remember.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {roadmap.map((item) => (
                <div key={item} className="rounded-xl border border-dark-border bg-dark-surface/40 p-4">
                  <p className="text-sm text-text-secondary leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-8 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-primary mb-4">Future Support</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-5">
              AI can support the learning experience without replacing the fundamentals
            </h2>
            <p className="text-text-secondary leading-relaxed mb-6">
              If needed, AI models can help explain confusing steps, improve the UI learning flow, and give students better support while they practice. The core idea stays the same: make technical concepts easier to understand through guided visual learning.
            </p>
            <div className="rounded-2xl bg-brand-primary text-white p-6">
              <p className="text-sm uppercase tracking-[0.24em] font-bold mb-3">Why It Matters</p>
              <p className="text-base leading-relaxed text-white/90">
                Better explanations, better visuals, and better practice can help learners move from confusion to confidence much faster.
              </p>
            </div>
            <div className="mt-6">
              <Link to="/register" className="btn-primary w-full sm:w-auto">
                Join The Learning Journey
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
