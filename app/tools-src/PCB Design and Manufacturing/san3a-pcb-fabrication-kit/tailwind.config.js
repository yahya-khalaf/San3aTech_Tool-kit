// Every colour below comes from the San3a Academy media kit (san3a-brand.css and
// media-kit.css). The Tailwind colour names are remapped so the utility classes
// used throughout the two tools can only ever produce brand colours.
const neutral = {
    50: "#FFF7F3",  // Paper
    100: "#FFF7F3", // Paper
    200: "#E7D4D0", // Sand
    300: "#D8C7CD", // muted text on dark
    400: "#A8929B", // input border
    500: "#6B5761", // muted text
    600: "#6B5761", // muted text
    700: "#3D1221", // Maroon
    800: "#3D1221", // Maroon
    900: "#3D1221", // Maroon, the surface colour on dark
    950: "#240D18", // Ink
};

const success = {
    50: "#D5F5EF",
    100: "#D5F5EF",
    200: "#2EC4B6",
    300: "#2EC4B6",
    400: "#2EC4B6",
    500: "#2EC4B6", // Teal
    600: "#0B7A6D",
    700: "#0B5A50",
    800: "#0B5A50",
    900: "#0B5A50",
};

const signature = {
    50: "#F9DFE1",  // Blush
    100: "#F9DFE1",
    200: "#E7D4D0",
    300: "#F9DFE1",
    400: "#F9DFE1",
    500: "#CF2027", // Red
    600: "#B01A21", // Red hover
    700: "#781629", // Wine
    800: "#781629",
    900: "#781629",
};

const highlight = {
    50: "#FFF0C6",
    100: "#FFF0C6",
    200: "#FFC93C",
    300: "#FFC93C",
    400: "#FFC93C",
    500: "#FFC93C", // Sun
    600: "#6A4B00",
    700: "#6A4B00",
    800: "#6A4B00",
    900: "#6A4B00",
};

// Accent used by the tools for "selected": Wine on light, Sun on dark.
const selection = {
    50: "#F9DFE1",
    100: "#F9DFE1",
    200: "#FFC93C",
    300: "#FFC93C",
    400: "#FFC93C",
    500: "#FFC93C",
    600: "#781629",
    700: "#781629",
    800: "#781629",
    900: "#781629",
};

export default {
    darkMode: "class",
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                slate: neutral,
                gray: neutral,
                zinc: { ...neutral, 0: "#FFFFFF" },
                neutral,
                emerald: success,
                teal: success,
                green: success,
                rose: signature,
                red: signature,
                orange: signature,
                indigo: signature,
                amber: highlight,
                yellow: highlight,
                cyan: selection,
                sky: selection,
                blue: selection,
                ink: "#240D18",
                maroon: "#3D1221",
                wine: "#781629",
                brandred: "#CF2027",
                paper: "#FFF7F3",
                blush: "#F9DFE1",
                sand: "#E7D4D0",
                sun: "#FFC93C",
            },
            fontFamily: {
                headline: ['"Big John"', "Montserrat", '"Segoe UI"', "sans-serif"],
                subhead: ["Arvo", "Georgia", "serif"],
                body: ['"Myriad Pro"', "Inter", "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
            },
            borderRadius: {
                md: "8px",
                lg: "8px",
                xl: "16px",
                "2xl": "24px",
            },
            boxShadow: {
                sm: "0 4px 12px rgba(36, 13, 24, 0.05)",
                DEFAULT: "0 4px 12px rgba(36, 13, 24, 0.05)",
                md: "0 10px 30px rgba(36, 13, 24, 0.08)",
                lg: "0 10px 30px rgba(36, 13, 24, 0.08)",
                xl: "0 18px 40px rgba(36, 13, 24, 0.15)",
                "2xl": "0 18px 40px rgba(36, 13, 24, 0.15)",
            },
        },
    },
    plugins: [
        require('@butterfail/tailwindcss-inverted-radius'),
    ],
}
