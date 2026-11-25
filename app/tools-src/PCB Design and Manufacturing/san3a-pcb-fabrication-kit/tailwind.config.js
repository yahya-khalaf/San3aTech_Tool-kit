// Every colour below comes from the San3a Academy brand kit (san3a-brand.css). The Tailwind colour names are remapped so the utility classes
// used throughout the two tools can only ever produce brand colours.
const neutral = {
    50: "#F7F3F4",  // surface
    100: "#F7F3F4", // surface
    200: "#E2D6DA", // border
    300: "#CDBEC4", // muted text on dark
    400: "#8C7A80", // border-strong
    500: "#6B5A60", // muted text
    600: "#6B5A60", // muted text
    700: "#3D1221", // Maroon
    800: "#3D1221", // Maroon
    900: "#3D1221", // Maroon, the surface colour on dark
    950: "#240D18", // Ink
};

const success = {
    50: "#E6F4EC",
    100: "#E6F4EC",
    200: "#5FD39A",
    300: "#5FD39A",
    400: "#5FD39A",
    500: "#5FD39A", // success (dark theme value)
    600: "#1F7A4D", // success
    700: "#17603C",
    800: "#17603C",
    900: "#16352A",
};

const signature = {
    50: "#FBE9EA",  // primary-subtle
    100: "#FBE9EA",
    200: "#E2D6DA",
    300: "#FBE9EA",
    400: "#FBE9EA",
    500: "#CF2027", // brand-red
    600: "#A91B24", // primary-hover
    700: "#781629", // Wine
    800: "#781629",
    900: "#781629",
};

const highlight = {
    50: "#FBE9EA",
    100: "#FBE9EA",
    200: "#FFB3B6",
    300: "#FFB3B6",
    400: "#FFB3B6",
    500: "#FFB3B6", // light red highlight (dark-theme focus ring)
    600: "#781629",
    700: "#781629",
    800: "#781629",
    900: "#781629",
};

// Accent used by the tools for "selected": maroon on light, light red on dark.
const selection = {
    50: "#FBE9EA",
    100: "#FBE9EA",
    200: "#FFB3B6",
    300: "#FFB3B6",
    400: "#FFB3B6",
    500: "#FFB3B6",
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
                paper: "#F7F3F4",
                blush: "#FBE9EA",
                sand: "#E2D6DA",
                sun: "#FFB3B6",
            },
            fontFamily: {
                headline: ['"Big John"', "Montserrat", '"Segoe UI"', "sans-serif"],
                subhead: ["Arvo", "Georgia", "serif"],
                body: ['"Myriad Pro"', '"Source Sans 3"', "Inter", "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
            },
            // Square brand corners: buttons and inputs 2px, cards 0
            borderRadius: {
                sm: "2px",
                DEFAULT: "2px",
                md: "2px",
                lg: "2px",
                xl: "0px",
                "2xl": "0px",
                "3xl": "0px",
            },
            boxShadow: {
                sm: "0 1px 2px rgba(36, 13, 24, 0.10)",
                DEFAULT: "0 1px 2px rgba(36, 13, 24, 0.10)",
                md: "0 1px 2px rgba(36, 13, 24, 0.10)",
                lg: "0 4px 12px rgba(36, 13, 24, 0.14)",
                xl: "0 4px 12px rgba(36, 13, 24, 0.14)",
                "2xl": "0 12px 32px rgba(36, 13, 24, 0.20)",
            },
        },
    },
    plugins: [
        require('@butterfail/tailwindcss-inverted-radius'),
    ],
}
