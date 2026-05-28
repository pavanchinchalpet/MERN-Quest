import React, { useEffect, useMemo, useState } from 'react';

const MetricCard = ({ label, value }) => (
  <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
    <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</div>
    <div className="mt-1 text-sm font-bold text-white">{value}</div>
  </div>
);

const ArrayBars = ({ array = [], activeIndex, comparisonIndexes = [], foundIndexes = [] }) => {
  const maxValue = Math.max(...array.map((value) => Math.abs(Number(value)) || 0), 1);

  return (
    <div className="rounded-[28px] border border-cyan-300/15 bg-[#0b1114] p-4">
      <div className="flex h-52 items-end gap-3 overflow-x-auto">
        {array.map((value, index) => {
          const isFound = foundIndexes.includes(index);
          const isCompared = comparisonIndexes.includes(index);
          const isActive = index === activeIndex;
          const height = `${Math.max((Math.abs(Number(value)) / maxValue) * 100, 18)}%`;

          let barClass = 'border-white/10 bg-white/[0.05] text-white/75';
          if (isFound) barClass = 'border-emerald-400/50 bg-emerald-400/20 text-emerald-200';
          else if (isCompared) barClass = 'border-amber-400/50 bg-amber-400/20 text-amber-100';
          else if (isActive) barClass = 'border-cyan-300/50 bg-cyan-300/20 text-cyan-100';

          return (
            <div key={`${index}-${value}`} className="flex min-w-[56px] flex-col items-center">
              <div className="mb-2 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-white/60">
                idx {index}
              </div>
              <div
                className={`flex w-full items-end justify-center rounded-t-2xl border text-sm font-bold transition-all ${barClass}`}
                style={{ height }}
              >
                <span className="pb-2">{String(value)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MapView = ({ entries = [] }) => (
  <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Lookup memory</div>
    <div className="space-y-2">
      {entries.length === 0 ? (
        <div className="rounded-2xl bg-black/20 px-3 py-4 text-sm text-white/45">Map is empty right now.</div>
      ) : (
        entries.map((entry) => (
          <div key={`${entry.key}-${entry.value}`} className="flex items-center justify-between rounded-2xl bg-black/20 px-3 py-3 text-sm">
            <span className="font-mono text-cyan-200">{entry.key}</span>
            <span className="text-white/55">index {entry.value}</span>
          </div>
        ))
      )}
    </div>
  </div>
);

const BinarySearchView = ({ state }) => (
  <div className="space-y-4">
    <ArrayBars
      array={state.array}
      activeIndex={state.mid}
      comparisonIndexes={[state.left, state.right].filter((value) => value !== null && value !== undefined)}
      foundIndexes={state.foundIndex !== null ? [state.foundIndex] : []}
    />
    <div className="grid grid-cols-3 gap-2">
      <MetricCard label="left" value={state.left ?? '-'} />
      <MetricCard label="mid" value={state.mid ?? '-'} />
      <MetricCard label="right" value={state.right ?? '-'} />
    </div>
  </div>
);

const ProfitView = ({ state }) => (
  <div className="space-y-4">
    <ArrayBars
      array={state.array}
      activeIndex={state.activeIndex}
      comparisonIndexes={[state.buyIndex, state.sellIndex].filter((value) => value !== null && value !== undefined)}
      foundIndexes={state.sellIndex !== null ? [state.sellIndex] : []}
    />
  </div>
);

const SummaryView = ({ state }) => (
  <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Sample input</div>
    <pre className="mt-3 overflow-x-auto rounded-2xl bg-black/20 p-4 text-sm text-white/75">
      {JSON.stringify(state.inputs, null, 2)}
    </pre>
  </div>
);

const renderState = (state) => {
  if (!state) {
    return null;
  }

  if (state.kind === 'array-map') {
    return (
      <div className="grid gap-4">
        <ArrayBars
          array={state.array}
          activeIndex={state.activeIndex}
          comparisonIndexes={state.comparisonIndexes}
          foundIndexes={state.foundIndexes}
        />
        <MapView entries={state.mapEntries} />
      </div>
    );
  }

  if (state.kind === 'binary-search') {
    return <BinarySearchView state={state} />;
  }

  if (state.kind === 'profit') {
    return <ProfitView state={state} />;
  }

  return <SummaryView state={state} />;
};

const DSALiveTracerPanel = ({ trace, loading }) => {
  const steps = trace?.steps || [];
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1200);

  useEffect(() => {
    setActiveStep(0);
    setIsPlaying(false);
  }, [trace]);

  useEffect(() => {
    if (!isPlaying || steps.length <= 1) {
      return undefined;
    }

    if (activeStep >= steps.length - 1) {
      setIsPlaying(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setActiveStep((current) => Math.min(current + 1, steps.length - 1));
    }, speed);

    return () => window.clearTimeout(timer);
  }, [activeStep, isPlaying, speed, steps.length]);

  const currentStep = steps[activeStep];
  const metrics = useMemo(() => currentStep?.state?.metrics || [], [currentStep]);

  if (!trace) {
    return null;
  }

  return (
    <aside className="h-full min-h-0 border-l border-white/10 bg-[#111315] text-white flex flex-col">
      <div className="border-b border-white/10 px-5 py-4 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Live tracer</p>
            <h3 className="mt-1 text-lg font-bold">{trace.algorithm}</h3>
            <p className="mt-2 text-sm text-white/65">{trace.structure}</p>
          </div>
          <div className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
            {loading ? 'Running' : `${activeStep + 1}/${steps.length}`}
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/75">
          {loading ? 'Refreshing the replay using the latest run...' : currentStep?.detail}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
        {renderState(currentStep?.state)}

        {metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {metrics.map((metric) => (
              <MetricCard key={`${metric.label}-${metric.value}`} label={metric.label} value={metric.value} />
            ))}
          </div>
        )}

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Trace steps</p>
            <p className="text-xs text-white/45">Line {currentStep?.line ?? '-'}</p>
          </div>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <button
                key={`${step.label}-${index}`}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${index === activeStep ? 'border-cyan-300/40 bg-cyan-300/15' : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.05]'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm ${index === activeStep ? 'font-semibold text-white' : 'text-white/70'}`}>{step.label}</span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/40">L{step.line}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveStep((current) => Math.max(current - 1, 0))}
            disabled={activeStep === 0}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setIsPlaying((current) => !current)}
            disabled={steps.length <= 1}
            className="rounded-xl border border-cyan-300/30 bg-cyan-300/15 px-4 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-40"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={() => setActiveStep((current) => Math.min(current + 1, steps.length - 1))}
            disabled={activeStep >= steps.length - 1}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveStep(0);
              setIsPlaying(false);
            }}
            className="ml-auto rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm"
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Speed</span>
          <input
            type="range"
            min="500"
            max="2200"
            step="100"
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
            className="flex-1 accent-cyan-300"
          />
          <span className="w-12 text-right text-xs text-white/55">{(speed / 1000).toFixed(1)}s</span>
        </div>
      </div>
    </aside>
  );
};

export default DSALiveTracerPanel;
