/**
 * Global type declarations for shared components
 */

interface PromptModalOptions {
  title?: string;
  message?: string;
  inputType?: 'text' | 'password' | 'number' | 'email';
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmModalOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

interface AlertModalOptions {
  title?: string;
  message?: string;
  confirmText?: string;
}

interface SelectModalOption {
  value: string;
  label: string;
}

interface SelectModalOptions {
  title?: string;
  message?: string;
  options?: SelectModalOption[];
  cancelText?: string;
}

declare global {
  interface Window {
    // PromptModal functions
    showPromptModal: (options?: PromptModalOptions) => Promise<string | null>;
    showConfirmModal: (options?: ConfirmModalOptions) => Promise<boolean | null>;
    showAlertModal: (options?: AlertModalOptions) => Promise<boolean>;
    showSelectModal: (options?: SelectModalOptions) => Promise<string | null>;
    
    // Calculadora functions
    calcular: () => Promise<void>;
    cargarReferencias: () => Promise<void>;
    resetear: () => Promise<void>;
    limpiarHistorial: () => Promise<void>;
    toggleTestInterno: () => Promise<void>;
    nombrarEntrada: () => Promise<void>;
    cargarDesdeHistorial: (id: string) => Promise<void>;
    eliminarDelHistorial: (id: string) => Promise<void>;
    guardarDatos: () => void;
    mostrarHistorial: () => void;
    toggleHistorial: () => void;
    exportarJSON: () => void;
    REF: {
      precioKg: number;
      precioKwh: number;
      consumoW: number;
      desgasteHoras: number;
      valorImpresora: number;
      margenError: number;
      comisionML: number;
    };
  }
}

export {};
