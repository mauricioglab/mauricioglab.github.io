import type { Signal } from '@preact/signals';

export interface OpStep {
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

export interface OpState {
  id: string;
  label: string;
  startedAt: number;
  elapsed: string;
  messages: string[];
  msgIndex: number;
  stepIndex: number;
  steps: OpStep[];
  finished: boolean;
}

interface BusyOverlayProps {
  busy: Signal<boolean>;
  op: Signal<OpState | null>;
  status: Signal<string>;
}

export default function BusyOverlay({ busy, op, status }: BusyOverlayProps) {
  if (!busy.value) return null;

  return (
    <div class="absolute inset-0 z-10 bg-slate-900/90 backdrop-blur-sm rounded-b-xl flex items-center justify-center p-6">
      <div class="w-full max-w-sm space-y-3">
        {op.value && (
          <div class="space-y-3">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2 text-sm font-bold text-indigo-200">
                <span class="spinner spinner-sm"></span>
                <span>{op.value.label}</span>
              </div>
              <span class="text-xs font-mono text-slate-400">⏱ {op.value.elapsed}</span>
            </div>
            <p class="text-xs text-indigo-300 text-center">{op.value.messages?.[op.value.msgIndex]}</p>
            <div class="space-y-1.5">
              {(op.value.steps ?? []).map((step, i) => (
                <div key={i} class="flex items-center gap-2 text-xs">
                  {step.status === 'active' && <span class="spinner spinner-xs"></span>}
                  {step.status === 'done' && <span class="text-green-400 font-bold">✓</span>}
                  {step.status === 'error' && <span class="text-red-400 font-bold">✗</span>}
                  {step.status === 'pending' && <span class="w-2 h-2 rounded-full bg-slate-600"></span>}
                  <span
                    class={
                      step.status === 'active'
                        ? 'text-slate-100 font-bold'
                        : step.status === 'done'
                          ? 'text-green-300'
                          : step.status === 'error'
                            ? 'text-red-300'
                            : 'text-slate-500'
                    }
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {!op.value && status.value && (
          <div class="px-4 py-3 rounded-lg bg-indigo-600/15 border border-indigo-500/30 text-sm text-center">
            {status.value}
          </div>
        )}
      </div>
    </div>
  );
}
