import React, { useState } from 'react';

const VisualizationBotPanel = ({ visualization, loading }) => {
  const [activeStep, setActiveStep] = useState(0);

  if (!visualization) {
    return null;
  }

  const selectedStep = visualization.steps[activeStep] || visualization.steps[0];

  return (
    <aside className="h-full min-h-0 border-l border-white/10 bg-[#111315] text-white flex flex-col">
      <div className="border-b border-white/10 px-5 py-4 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">CodeSprint Bot</p>
            <h3 className="text-lg font-bold mt-1">{visualization.title}</h3>
          </div>
          <div className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
            {visualization.status}
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/70">{visualization.headline}</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300 mb-2">Bot narration</p>
          <p className="text-sm leading-relaxed text-white/85">
            {loading ? 'Generating the latest replay...' : visualization.botMessage}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Visual state</p>
            <p className="text-xs text-white/45">{visualization.visualState.structure}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {visualization.visualState.cells.map((cell) => (
              <div
                key={`${cell.index}-${cell.value}`}
                className={`rounded-xl border p-3 text-center ${cell.active ? 'border-cyan-300 bg-cyan-300/20' : 'border-white/10 bg-white/[0.04]'}`}
              >
                <div className="text-lg font-bold text-white">{cell.value ?? '_'}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/45">idx {cell.index}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {visualization.visualState.metrics.map((metric) => (
              <div key={metric.label} className="rounded-xl bg-black/20 px-3 py-2">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">{metric.label}</div>
                <div className="mt-1 text-sm font-bold text-white">{metric.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300 mb-3">Execution steps</p>
          <div className="space-y-2">
            {visualization.steps.map((step, index) => (
              <button
                key={step.label}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${index === activeStep ? 'border-cyan-300/40 bg-cyan-300/15' : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.05]'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm ${index === activeStep ? 'font-semibold text-white' : 'text-white/70'}`}>{step.label}</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${index === activeStep ? 'bg-cyan-300' : 'bg-white/20'}`}></span>
                </div>
              </button>
            ))}
          </div>
          {selectedStep && (
            <div className="mt-3 rounded-xl bg-black/20 px-3 py-3 text-sm leading-relaxed text-white/75">
              {selectedStep.detail}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300 mb-3">What the bot noticed</p>
          <div className="space-y-3">
            {visualization.summaries.map((item) => (
              <div key={item.title} className="rounded-xl bg-black/20 px-3 py-3">
                <div className="text-sm font-semibold text-white">{item.title}</div>
                <div className="mt-1 text-sm leading-relaxed text-white/65">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {visualization.consoleNotes.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300 mb-3">Console notes</p>
            <div className="space-y-2 font-mono text-xs text-emerald-300/90">
              {visualization.consoleNotes.map((note, index) => (
                <div key={`${note}-${index}`} className="rounded-lg bg-black/20 px-3 py-2">{note}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default VisualizationBotPanel;
