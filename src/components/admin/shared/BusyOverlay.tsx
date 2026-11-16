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
    <div class="absolute inset-0 z-10 bg-white/90 flex items-center justify-center p-6">
      <div class="w-full max-w-sm space-y-3">
        {op.value && (
          <div class="space-y-3">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2 text-sm font-bold text-[#082D3A]">
                <span class="spinner spinner-sm"></span>
                <span>{op.value.label}</span>
              </div>
              <span class="text-xs font-mono text-[#5c6785]">⏱ {op.value.elapsed}</span>
            </div>
            <p class="text-xs text-[#0b6e7d] text-center">{op.value.messages?.[op.value.msgIndex]}</p>
            <div class="space-y-1.5">
              {(op.value.steps ?? []).map((step, i) => (
                <div key={i} class="flex items-center gap-2 text-xs">
                  {step.status === 'active' && <span class="spinner spinner-xs"></span>}
                  {step.status === 'done' && <span class="text-[#1f7a3d] font-bold">✓</span>}
                  {step.status === 'error' && <span class="text-[#b32d2e] font-bold">✗</span>}
                  {step.status === 'pending' && <span class="w-2 h-2 rounded-full bg-[#d7dce5]"></span>}
                  <span
                    class={
                      step.status === 'active'
                        ? 'text-[#082D3A] font-bold'
                        : step.status === 'done'
                          ? 'text-[#1f7a3d]'
                          : step.status === 'error'
                            ? 'text-[#b32d2e]'
                            : 'text-[#8a93ab]'
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
          <div class="px-4 py-3 rounded-lg bg-[#f4f6fa] border border-[#d7dce5] text-[#082D3A] text-sm text-center">
            {status.value}
          </div>
        )}
      </div>
    </div>
  );
}
