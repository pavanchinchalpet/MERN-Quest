import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const [showNav, setShowNav] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const heroHeight = window.innerHeight * 0.8;
      setShowNav(scrollPosition < heroHeight);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 bg-slate-900/80 backdrop-blur-md border-b border-white/10 ${
          showNav ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📚</span>
              <span className="font-game font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                MERN Quest
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-slate-300 hover:text-white font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-full font-medium transition-all shadow-lg hover:shadow-indigo-500/25"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
              Master the MERN Stack
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 mt-2">
                Like a Pro
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Transform your coding journey with interactive challenges, real-world projects, 
              and comprehensive learning paths designed for developers of all levels.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-8 py-3.5 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-1"
              >
                <span>🚀</span> Start Learning Free
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-8 py-3.5 rounded-full font-semibold text-lg transition-all hover:-translate-y-1"
              >
                <span>👋</span> Sign In
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-3xl mx-auto border-t border-slate-800/60 pt-10">
              <div className="flex flex-col items-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">10K+</div>
                <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Students</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">50+</div>
                <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Projects</div>
              </div>
              <div className="hidden md:flex flex-col items-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">95%</div>
                <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose MERN Quest?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Comprehensive learning platform designed to take you from beginner to expert
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            {[
              { icon: '🎯', title: 'Interactive Learning', desc: 'Hands-on coding challenges and real-world projects that reinforce your learning.' },
              { icon: '📊', title: 'Progress Tracking', desc: 'Monitor your learning journey with detailed analytics and achievement badges.' },
              { icon: '🏆', title: 'Gamification', desc: 'Earn points, unlock achievements, and compete on leaderboards to stay motivated.' },
              { icon: '🛠️', title: 'Real Projects', desc: 'Build actual applications using industry best practices and modern tools.' },
              { icon: '👥', title: 'Community', desc: 'Connect with fellow learners, share projects, and get help when you need it.' },
              { icon: '📱', title: 'Mobile Ready', desc: 'Learn anywhere, anytime with our responsive design and mobile-optimized interface.' }
            ].map((feature, idx) => (
              <div key={idx} className="bg-slate-800/50 border border-slate-700/50 p-8 rounded-2xl hover:bg-slate-800 transition-colors group">
                <div className="text-4xl mb-6 bg-slate-900 w-16 h-16 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Path Section */}
      <section className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Learning Journey</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Structured paths designed to take you from zero to hero
            </p>
          </div>
          
          <div className="space-y-12 max-w-4xl mx-auto">
            {[
              { num: '01', title: 'Foundation', desc: 'Master the basics of HTML, CSS, JavaScript, and Node.js fundamentals.' },
              { num: '02', title: 'Frontend', desc: 'Dive deep into React.js, state management, and modern frontend development.' },
              { num: '03', title: 'Backend', desc: 'Build robust APIs with Express.js, MongoDB, and authentication systems.' },
              { num: '04', title: 'Integration', desc: 'Connect frontend and backend, deploy applications, and learn DevOps basics.' }
            ].map((step, idx) => (
              <div key={idx} className="flex items-start gap-6 group">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xl group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-lg">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-slate-900 to-indigo-900 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Career?</h2>
          <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto">
            Join thousands of developers who have mastered the MERN stack and built amazing applications. 
            Start your journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="w-full sm:w-auto bg-white text-indigo-900 hover:bg-indigo-50 px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-indigo-900/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <span>🎯</span> Start Learning Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-12 border-t border-slate-800 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-6 opacity-80">
            <span className="text-xl">📚</span>
            <span className="font-game font-bold text-lg text-white">MERN Quest</span>
          </div>
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} MERN Quest. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
