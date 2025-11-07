/**
 * Tailwind CSS v4 configuration for Futuristic Neubrutalism theme
 */

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./landing-page/*.html"],
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
            boxShadow: "0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor",
            textShadow: "0 0 5px currentColor",
          },
          "100%": {
            boxShadow: "0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor",
            textShadow: "0 0 10px currentColor",
          },
        },
      },
      boxShadow: {
        sm: "0 2px 8px rgba(0, 0, 0, 0.3)",
        DEFAULT: "0 4px 12px rgba(0, 0, 0, 0.4)",
        lg: "0 8px 24px rgba(0, 0, 0, 0.5)",
        glow: "0 0 20px rgba(45, 212, 191, 0.3)",
        "glow-strong": "0 0 30px rgba(45, 212, 191, 0.5)",
      },
      colors: {
        brand: {
          cyan: "#2DD4BF",
          blue: "#38BDF8",
          slate: {
            900: "#0f172a",
            800: "#1e293b",
            700: "#334155",
            400: "#94a3b8",
            100: "#f1f5f9",
          },
        },
        primary: "#2DD4BF",
        secondary: "#38BDF8",
        accent: "#2DD4BF",
        muted: "#94a3b8",
        foreground: "#f1f5f9",
        background: "#0f172a",
        "background-secondary": "#1e293b",
        destructive: "#b9486d",
        border: "#334155",
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #2DD4BF 0%, #38BDF8 100%)",
        "card-gradient": "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
        "button-primary": "linear-gradient(135deg, #2DD4BF 0%, #38BDF8 100%)",
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
    ({ addUtilities, theme }) => {
      addUtilities({
        ".text-shadow-brutal": {
          textShadow: "0 1px 2px rgba(62,75,84,0.4)",
        },
        ".text-shadow-brutal-lg": {
          textShadow: "0 2px 6px rgba(65,101,123,0.5)",
        },
        ".transform-brutal": {
          transform: "translate(0, 0)",
          transition: "all 0.25s cubic-bezier(0.33, 1, 0.68, 1)",
        },
        ".transform-brutal:hover": {
          transform: "translate(0, 0)",
          boxShadow: "0 0 6px 2px rgba(65,101,123,0.35)",
        },
        ".transform-brutal:active": {
          transform: "scale(0.97)",
          boxShadow: "0 0 4px 2px rgba(62,75,84,0.4)",
        },
        ".border-style-brutal": {
          borderStyle: "solid",
          borderColor: "#41657b",
          borderRadius: theme("borderRadius.lg"),
        },
        ".border-glow": {
          boxShadow: "0 0 0 2px #41657b, 0 0 8px 2px rgba(65,101,123,0.45)",
          borderColor: "#41657b",
          borderWidth: "2px",
          borderStyle: "solid",
          borderRadius: theme("borderRadius.lg"),
        },
        ".bg-card-gradient": {
          backgroundImage: theme("backgroundImage.card-gradient"),
        },
        ".bg-button-primary": {
          backgroundImage: theme("backgroundImage.button-primary"),
        },
        ".bg-button-warm": {
          backgroundImage: theme("backgroundImage.button-warm"),
        },
        ".bg-button-accent": {
          backgroundImage: theme("backgroundImage.button-accent"),
        },
        ".text-cyber": {
          fontWeight: "900",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          textShadow: "0 2px 6px rgba(185,72,109,0.5)",
        },
        ".neon-glow": {
          animation: "neon-pulse 1.5s ease-in-out infinite alternate",
        },
      });
    },
  ],
};
