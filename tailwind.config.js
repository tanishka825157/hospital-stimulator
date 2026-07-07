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
                command: "var(--color-command)",
                panel: "var(--color-panel)",
                elevated: "var(--color-elevated)",
                line: "var(--color-line)",
                ink: "var(--color-ink)",
                muted: "var(--color-muted)",
                accent: "var(--color-accent)",
                critical: "#EF4444",
                serious: "#F97316",
                moderate: "#EAB308",
                mild: "#22C55E"
            },
            boxShadow: { lightPanel: "0 16px 40px rgba(15, 23, 42, 0.08)" }
        }
    },
    plugins: []
};
