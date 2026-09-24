import type { ButtonHTMLAttributes, FC } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
}

const variantClasses: Record<string, string> = {
  primary:
    "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white shadow-lg shadow-purple-900/30",
  secondary: "bg-white/10 hover:bg-white/15 text-gray-100 border border-white/10",
  danger: "bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30",
  ghost: "hover:bg-white/5 text-gray-300",
};

export const Button: FC<ButtonProps> = ({ variant = "primary", loading, className = "", children, disabled, ...rest }) => (
  <button
    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${variantClasses[variant]} ${className}`}
    disabled={disabled || loading}
    {...rest}
  >
    {loading ? "…" : children}
  </button>
);
