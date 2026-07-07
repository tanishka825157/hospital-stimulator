declare const _default: {
    darkMode: ["class"];
    content: string[];
    theme: {
        extend: {
            fontFamily: {
                sans: [string, string, string];
                mono: [string, string, string, string];
            };
            colors: {
                command: string;
                panel: string;
                elevated: string;
                line: string;
                ink: string;
                muted: string;
                accent: string;
                critical: string;
                serious: string;
                moderate: string;
                mild: string;
            };
            boxShadow: {
                lightPanel: string;
            };
        };
    };
    plugins: any[];
};
export default _default;
