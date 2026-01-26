/**
 * ============================================================================
 * LEAN MEAN VPS - UI Component Library (Tailwind 4)
 * ============================================================================
 *
 * WAS:
 * Eine Sammlung atomarer UI-Komponenten, die als Grundlage für die
 * HonoX-Islands dienen.
 *
 * WIE:
 * 1. Styling: Nutzt TailwindCSS 4 mit strikter Verwendung von CSS-Custom-Properties.
 * 2. Performance: Minimale DOM-Tiefe und Verzicht auf komplexe Transition-Libraries.
 * 3. Type-Safety: Nutzt Hono 'Child' und 'FC' (Functional Component) Typen,
 *    um Typsicherheit beim Server-Side Rendering (SSR) zu gewährleisten.
 * 4. Design-Trends 2026: Fokus auf Glasmorphismus, OKLCH-Farbräumen und
 *    subtilere Schattenwürfe.
 *
 * WARUM:
 * Zentralisierung des UI-Codes reduziert die Bundle-Größe und sichert
 * ein konsistentes Look-and-Feel über alle Islands hinweg.
 *
 * @version 2.1.0
 * ============================================================================
 */

import type { Child, FC } from 'hono/jsx';

/**
 * Button Komponente
 * Bietet verschiedene Varianten für interaktive Aktionen.
 * Nutzt Event-Delegation-kompatible Props.
 */
export const Button: FC<{
  children: Child;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  className?: string;
  onClick?: (e: MouseEvent) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}> = ({
  children,
  variant = 'primary',
  className = '',
  onClick,
  disabled = false,
  type = 'button',
}) => {
  const base =
    'px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2';
  const variants = {
    primary: 'bg-primary text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]',
    secondary: 'bg-surface text-text hover:bg-surface-hover border border-white/5',
    outline: 'bg-transparent border border-white/10 text-text hover:bg-white/5',
    ghost: 'bg-transparent text-text-muted hover:text-text hover:bg-white/5',
    danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

/**
 * Input Komponente
 * Standardisierte Texteingabe mit Fokus-Zuständen.
 */
export const Input: FC<{
  type?: string;
  placeholder?: string;
  className?: string;
  value?: string;
  // biome-ignore lint/suspicious/noExplicitAny: Hono JSX event mismatch
  onChange?: (e: any) => void;
  // biome-ignore lint/suspicious/noExplicitAny: Hono JSX event mismatch
  onKeyDown?: (e: any) => void;
  name?: string;
  id?: string;
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
}> = ({
  type = 'text',
  placeholder,
  className = '',
  value,
  onChange,
  onKeyDown,
  name,
  id,
  required,
  minLength,
  disabled,
}) => {
  return (
    <input
      type={type}
      name={name}
      id={id}
      required={required}
      minLength={minLength}
      disabled={disabled}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      className={`w-full bg-surface-dark border border-white/5 rounded-xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all ${className}`}
    />
  );
};

/**
 * Card Komponente
 * Container für gruppierte Inhalte mit modernem Backdrop-Filter.
 */
export const Card: FC<{ children: Child; className?: string }> = ({ children, className = '' }) => (
  <div
    className={`bg-surface border border-white/5 rounded-2xl p-6 backdrop-blur-xl shadow-2xl ${className}`}
  >
    {children}
  </div>
);

/**
 * Badge Komponente
 * Kleine Status-Indikatoren.
 */
export const Badge: FC<{
  children: Child;
  color?: 'primary' | 'success' | 'warning';
}> = ({ children, color = 'primary' }) => {
  const colors = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[color]}`}>
      {children}
    </span>
  );
};
