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
        brutal: "0 0 0 2px #3e4b54, 0 0 8px 2px rgba(65,101,123,0.4)",
        "brutal-lg": "0 0 0 2px #41657b, 0 0 10px 3px rgba(65,101,123,0.45)",
        "brutal-xl": "0 0 0 2px #41657b, 0 0 14px 4px rgba(62,75,84,0.5)",
        "brutal-2xl": "0 0 0 2px #41657b, 0 0 18px 6px rgba(62,75,84,0.55)",
        "brutal-primary": "0 0 0 2px #c78226, 0 0 10px 2px rgba(199,130,38,0.45)",
        "brutal-primary-lg": "0 0 0 2px #c78226, 0 0 14px 3px rgba(199,130,38,0.5)",
        "brutal-secondary": "0 0 0 2px #41657b, 0 0 8px 2px rgba(65,101,123,0.4)",
        "brutal-accent": "0 0 0 2px #b9486d, 0 0 12px 3px rgba(185,72,109,0.5)",
        "brutal-destructive": "0 0 0 2px #b9486d, 0 0 12px 3px rgba(149,51,86,0.55)",
        glow: "0 0 4px 1px rgba(65,101,123,0.4), 0 0 10px 4px rgba(199,130,38,0.25)",
        "glow-subtle": "0 0 3px 1px rgba(62,75,84,0.35)",
      },
      colors: {
        brand: {
          dark: "#3e4b54",
          steel: "#41657b",
          light: "#c2d0db",
          warm: "#c78226",
        },
        spice: {
          DEFAULT: "#b9486d",
          light: "#d8648b",
          dark: "#953356",
        },
        primary: "#41657b",
        secondary: "#3e4b54",
        accent: "#c78226",
        muted: "#c2d0db",
        foreground: "#3e4b54",
        background: "#ffffff",
        destructive: "#b9486d",
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      backgroundImage: {
        "card-gradient": "linear-gradient(135deg, #c2d0db 0%, #ffffff 45%, #e3e9ed 100%)",
        "button-primary": "linear-gradient(135deg, #41657b 0%, #3e4b54 60%, #41657b 100%)",
        "button-warm": "linear-gradient(135deg, #c78226 0%, #d69745 55%, #e3a857 100%)",
        "button-accent": "linear-gradient(135deg, #b9486d 0%, #953356 70%, #b9486d 100%)",
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
