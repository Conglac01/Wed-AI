import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50";

  const variants: Record<string, string> = {
    primary: "text-white hover:opacity-90",
    secondary:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      style={variant === "primary" ? { backgroundColor: "#0047CC" } : undefined}
      {...props}
    >
      {children}
    </button>
  );
}
