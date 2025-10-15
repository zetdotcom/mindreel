/**
 * Tailwind CSS v4 configuration for Futuristic Neubrutalism theme
 */

export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "brutal-bounce": "brutal-bounce 0.3s ease-in-out",
        "brutal-shake": "brutal-shake 0.5s ease-in-out",
        glitch: "glitch 2s linear infinite",
        "neon-pulse": "neon-pulse 1.5s ease-in-out infinite alternate",
      },
      keyframes: {
        "brutal-bounce": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(2px, 2px)" },
        },
        "brutal-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-2px)" },
          "75%": { transform: "translateX(2px)" },
        },
        glitch: {
          "0%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
          "100%": { transform: "translate(0)" },
        },
        "neon-pulse": {
          "0%": {
            boxShadow:
              "0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor",
            textShadow: "0 0 5px currentColor",
          },
          "100%": {
            boxShadow:
              "0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor",
            textShadow: "0 0 10px currentColor",
          },
        },
      },
      boxShadow: {
        brutal: "4px 4px 0px oklch(0.1 0 0)",
        "brutal-lg": "8px 8px 0px oklch(0.1 0 0)",
        "brutal-xl": "12px 12px 0px oklch(0.1 0 0)",
        "brutal-2xl": "16px 16px 0px oklch(0.1 0 0)",
        "brutal-primary": "4px 4px 0px oklch(0.6 0.3 270)",
        "brutal-primary-lg": "8px 8px 0px oklch(0.6 0.3 270)",
        "brutal-secondary": "4px 4px 0px oklch(0.85 0.15 60)",
        "brutal-accent": "4px 4px 0px oklch(0.7 0.25 180)",
        "brutal-destructive": "4px 4px 0px oklch(0.65 0.3 15)",
        neon: "0 0 20px currentColor, inset 0 0 20px currentColor",
        "neon-lg": "0 0 30px currentColor, inset 0 0 30px currentColor",
      },
      borderWidth: {
        3: "3px",
        5: "5px",
        6: "6px",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        100: "25rem",
        112: "28rem",
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem", fontWeight: "700" }],
        sm: ["0.875rem", { lineHeight: "1.25rem", fontWeight: "600" }],
        base: ["1rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        lg: ["1.125rem", { lineHeight: "1.75rem", fontWeight: "700" }],
        xl: ["1.25rem", { lineHeight: "1.75rem", fontWeight: "800" }],
        "2xl": ["1.5rem", { lineHeight: "2rem", fontWeight: "800" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem", fontWeight: "900" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem", fontWeight: "900" }],
        "5xl": ["3rem", { lineHeight: "1", fontWeight: "900" }],
        "6xl": ["3.75rem", { lineHeight: "1", fontWeight: "900" }],
      },
      letterSpacing: {
        tightest: "-0.075em",
        cyber: "0.1em",
        brutal: "0.15em",
      },
    },
  },
  plugins: [
    function ({ addUtilities, theme }) {
      addUtilities({
        ".text-shadow-brutal": {
          textShadow: "2px 2px 0px oklch(0.1 0 0)",
        },
        ".text-shadow-brutal-lg": {
          textShadow: "4px 4px 0px oklch(0.1 0 0)",
        },
        ".transform-brutal": {
          transform: "translate(0, 0)",
          transition: "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        },
        ".transform-brutal:hover": {
          transform: "translate(2px, 2px)",
        },
        ".transform-brutal:active": {
          transform: "translate(4px, 4px)",
        },
        ".border-style-brutal": {
          borderStyle: "solid",
          borderColor: "oklch(0.1 0 0)",
        },
        ".bg-glitch": {
          background:
            "linear-gradient(45deg, oklch(0.6 0.3 270) 0%, oklch(0.7 0.25 180) 50%, oklch(0.85 0.15 60) 100%)",
          backgroundSize: "400% 400%",
          animation: "glitch 3s ease-in-out infinite",
        },
        ".text-cyber": {
          fontWeight: "900",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          textShadow: "2px 2px 0px oklch(0.8 0.25 180)",
        },
        ".neon-glow": {
          animation: "neon-pulse 1.5s ease-in-out infinite alternate",
        },
      });
    },
  ],
};
