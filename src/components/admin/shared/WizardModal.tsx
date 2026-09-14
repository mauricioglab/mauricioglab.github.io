import type { Signal } from '@preact/signals';
import type { ComponentChildren } from 'preact';
import BusyOverlay, { type OpState } from './BusyOverlay';

interface WizardModalProps {
  steps: string[];
  newLabel: string;
  editLabel: string;
  isEditing: boolean;
  wizardOpen: Signal<boolean>;
  wizardStep: Signal<number>;
  busy: Signal<boolean>;
  op: Signal<OpState | null>;
  status: Signal<string>;
  children?: ComponentChildren;
}

export default function WizardModal({
  steps,
  newLabel,
  editLabel,
  isEditing,
  wizardOpen,
  wizardStep,
  busy,
  op,
  status,
  children,
}: WizardModalProps) {
  if (!wizardOpen.value) return null;

  const close = () => {
    if (!busy.value) wizardOpen.value = false;
  };

  return (
    <div
      class="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div class="bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <div>
            <h2 class="text-lg font-bold">{isEditing ? editLabel : newLabel}</h2>
            <div class="flex items-center gap-1.5 mt-2">
              {steps.map((label, i) => (
                <>
                  <span
                    key={`dot-${i}`}
                    class={
                      'w-2 h-2 rounded-full ' +
                      (wizardStep.value === i + 1
                        ? 'bg-indigo-500'
                        : wizardStep.value > i + 1
                          ? 'bg-indigo-500/50'
                          : 'bg-slate-600')
                    }
                    title={label}
                  />
                  {i < steps.length - 1 && <span key={`sep-${i}`} class="w-3 h-px bg-slate-600" />}
                </>
              ))}
            </div>
          </div>
          <button
            onClick={close}
            disabled={busy.value}
            class="text-slate-400 hover:text-white disabled:opacity-30 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div class="flex-1 overflow-y-auto p-5 space-y-4 relative">
          {children}
          <BusyOverlay busy={busy} op={op} status={status} />
        </div>

        {/* Footer */}
        <div class="flex items-center justify-between px-5 py-3 border-t border-slate-700 shrink-0">
          {wizardStep.value > 1 ? (
            <button
              onClick={() => (wizardStep.value = wizardStep.value - 1)}
              disabled={busy.value}
              class="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white disabled:opacity-30"
            >
              ← Atrás
            </button>
          ) : (
            <span></span>
          )}
          <button
            onClick={close}
            disabled={busy.value}
            class="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white disabled:opacity-30"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
