/* eslint-disable react-refresh/only-export-components */
import PropTypes from "prop-types";
import { 
  createContext, 
  useState, 
  useMemo, 
  useContext, 
  useEffect 
} from "react";
const AppContext = createContext();
const OUTLINE_TAB_PRESET_STORAGE_KEY = "outlineTabPreset";

export const AppProvider = ({ children }) => {
  const [pngFiles, setPngFiles] = useState([]);
  const [outlineTabPreset, setOutlineTabPreset] = useState(() => {
    if (typeof window === "undefined") return null;

    try {
      const storedPreset = window.localStorage.getItem(OUTLINE_TAB_PRESET_STORAGE_KEY);
      return storedPreset ? JSON.parse(storedPreset) : null;
    } catch (error) {
      console.error("Failed to load outline tab preset", error);
      return null;
    }
  });
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";

    const savedTheme = window.localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === "dark";

    root.classList.toggle("dark", isDark);
    root.style.colorScheme = isDark ? "dark" : "light";
    window.localStorage.setItem("theme", theme);
    // Same origin as the local Mods copy, so it opens in the matching theme.
    window.localStorage.setItem("mods-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!outlineTabPreset) {
      window.localStorage.removeItem(OUTLINE_TAB_PRESET_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      OUTLINE_TAB_PRESET_STORAGE_KEY,
      JSON.stringify(outlineTabPreset)
    );
  }, [outlineTabPreset]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };
  
  const value = useMemo(() => ({
    pngFiles, 
    setPngFiles,
    outlineTabPreset,
    setOutlineTabPreset,
    theme,
    setTheme,
    toggleTheme,
  }), [pngFiles, outlineTabPreset, theme]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

AppProvider.propTypes = {
  children: PropTypes.node.isRequired
}
