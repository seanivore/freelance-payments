/** @type {import('tailwindcss').Config} */
import tailwindAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx,js,jsx}',
    './*.html',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "sans-serif"],
        agency: ["'Agency FB'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        // Portfolio color palette
        portfolio: {
          bg: {
            primary: '#1f1f1f',
            secondary: '#363635',
            dark: '#0f0f0f',
            paper: '#faf9f6',
          },
          text: {
            primary: '#EBEBEB',
            secondary: '#D7CDCC',
          },
          accent: {
            mauve: '#C99CAD',
            blue: '#8FA9B3',
            terracotta: '#C9A68A',
            primary: '#9C528B',
          },
          border: '#474545',
        },
        // shadcn/ui colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'glow': '0 0 20px rgba(201, 156, 173, 0.3)',
        'glow-lg': '0 0 40px rgba(201, 156, 173, 0.4)',
        'paper': '0 4px 20px rgba(0, 0, 0, 0.5), 0 8px 40px rgba(0, 0, 0, 0.3)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in-up": {
          from: { 
            opacity: 0,
            transform: "translateY(1rem)",
          },
          to: { 
            opacity: 1,
            transform: "translateY(0)",
          },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: 0.3 },
          "50%": { opacity: 0.5 },
        },
        "slide-up": {
          from: { 
            transform: "translateY(100%)",
            opacity: 0,
          },
          to: { 
            transform: "translateY(0)",
            opacity: 1,
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "slide-up": "slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      spacing: {
        // Portfolio spacing tokens
        'xs': '0.5rem',
        'sm': '1rem', 
        'md': '1.5rem',
        'lg': '2rem',
        'xl': '3rem',
      },
    },
  },
  plugins: [tailwindAnimate],
}
