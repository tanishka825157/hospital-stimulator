export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "ui-sans-serif", "system-ui"],
                mono: ["JetBrains Mono", "SFMono-Regular", "Consolas", "monospace"]
            },
            colors: {
                // Use RGB channel vars so Tailwind opacity modifiers (bg-panel/80) work.
                // Format: --color-x-rgb: r g b  → used as rgb(var(--color-x-rgb) / <alpha>)
                command:  "rgb(var(--color-command-rgb) / <alpha-value>)",
                panel:    "rgb(var(--color-panel-rgb)   / <alpha-value>)",
                elevated: "rgb(var(--color-elevated-rgb)/ <alpha-value>)",
                line:     "rgb(var(--color-line-rgb)    / <alpha-value>)",
                ink:      "rgb(var(--color-ink-rgb)     / <alpha-value>)",
                muted:    "rgb(var(--color-muted-rgb)   / <alpha-value>)",
                accent:   "rgb(var(--color-accent-rgb)  / <alpha-value>)",
                critical: "#EF4444",
                serious:  "#F97316",
                moderate: "#EAB308",
                mild:     "#22C55E"
            },
            boxShadow: { lightPanel: "0 16px 40px rgba(15, 23, 42, 0.08)" }
        }
    },
    plugins: []
};
