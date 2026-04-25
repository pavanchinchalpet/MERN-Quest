import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
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
              Built For Students & Freshers
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-text-primary leading-[1.1] tracking-tight mb-8">
              Practice coding.<br />
              Crack interviews.<br />
              <span className="text-brand-primary">Get hired.</span>
            </h1>

            <p className="text-lg text-text-secondary mb-10 max-w-lg leading-relaxed font-medium">
              We help thousands of companies hire and upskill the next generation of developers, and millions of developers to become one. Build real skills through coding practice, problem solving, assessments, and mock interviews.
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
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent rounded-[40px] border border-dark-border/50 transform rotate-3"></div>
            <div className="w-full max-w-full aspect-[4/3] bg-white rounded-[40px] shadow-2xl overflow-hidden border border-dark-border relative p-10 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="text-xs font-mono text-text-tertiary">app.js</div>
              </div>
              <div className="space-y-4 font-mono text-sm">
                <div className="flex">
                  <span className="text-brand-primary mr-4">1</span>
                  <span className="text-text-primary"><span className="text-brand-accent">function</span> twoSum(nums, target) {'{'}</span>
                </div>
                <div className="flex pl-4">
                  <span className="text-brand-primary mr-4">2</span>
                  <span className="text-text-secondary">const map = new Map();</span>
                </div>
                <div className="flex pl-4">
                  <span className="text-brand-primary mr-4">3</span>
                  <span className="text-text-secondary">for (let i = 0; i &lt; nums.length; i++) {'{'}</span>
                </div>
                <div className="flex pl-8">
                  <span className="text-brand-primary mr-4">4</span>
                  <span className="text-text-secondary">const complement = target - nums[i];</span>
                </div>
                <div className="flex pl-8">
                  <span className="text-brand-primary mr-4">5</span>
                  <span className="text-text-primary">if (map.has(complement)) {'{'}</span>
                </div>
                <div className="flex pl-12">
                  <span className="text-brand-primary mr-4">6</span>
                  <span className="text-brand-primary font-bold">return [map.get(complement), i];</span>
                </div>
                <div className="flex pl-8">
                  <span className="text-brand-primary mr-4">7</span>
                  <span className="text-text-primary">{'}'}</span>
                </div>
                <div className="flex pl-8">
                  <span className="text-brand-primary mr-4">8</span>
                  <span className="text-text-secondary">map.set(nums[i], i);</span>
                </div>
                <div className="flex pl-4">
                  <span className="text-brand-primary mr-4">9</span>
                  <span className="text-text-secondary">{'}'}</span>
                </div>
                <div className="flex">
                  <span className="text-brand-primary mr-4">10</span>
                  <span className="text-text-primary">{'}'}</span>
                </div>
              </div>

              <div className="absolute right-2 bottom-10 w-40 h-40 bg-brand-primary/10 rounded-2xl transform rotate-12 backdrop-blur-3xl"></div>
            </div>
          </div>
        </div>
      </main>

      {/* Companies Section */}
      <section className="border-t border-dark-border py-12 px-6 sm:px-12 bg-dark-surface/30">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-8">
            Trusted by developers at leading companies
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {['Airbnb', 'Stripe', 'LinkedIn', 'Atlassian', 'Snap Inc.', 'DoorDash', 'PayPal'].map((company) => (
              <div key={company} className="text-xl font-bold font-sans text-text-secondary flex items-center justify-center">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
