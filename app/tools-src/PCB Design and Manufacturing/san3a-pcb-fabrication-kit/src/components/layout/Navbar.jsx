import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { Link, NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LOCAL_MODS_PATH, LOGO, PRODUCT_NAME } from '../../config/links';

export default function Navbar() {
    const { theme, toggleTheme } = useApp();
    const isDark = theme === 'dark';

    return (
        <header className="s3-site-header s3-on-dark shrink-0">
            <nav aria-label="Main" className="flex h-16 items-center justify-between gap-4 px-4">
                <Link to="/" className="flex min-w-0 items-center gap-3 py-2" aria-label={`${PRODUCT_NAME}, home`}>
                    <img className="h-11 w-auto" src={LOGO.symbolWhite} alt="" />
                    <span className="flex min-w-0 flex-col leading-tight">
                        <span className="truncate font-headline text-sm font-extrabold">San3a Academy</span>
                        <span className="truncate text-xs text-slate-300">PCB fabrication kit</span>
                    </span>
                </Link>

                <div className="flex items-center gap-1">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) => `s3-nav-link ${isActive ? 'is-active' : ''}`}
                    >
                        Home
                    </NavLink>
                    <NavLink
                        to="/guide"
                        className={({ isActive }) => `s3-nav-link ${isActive ? 'is-active' : ''}`}
                    >
                        Student guide
                    </NavLink>
                    <NavLink
                        to="/gerber"
                        className={({ isActive }) => `s3-nav-link ${isActive ? 'is-active' : ''}`}
                    >
                        Gerber to PNG
                    </NavLink>
                    <a className="s3-nav-link" href={LOCAL_MODS_PATH} target="_blank" rel="noopener">
                        PNG to G-code
                    </a>
                    <Link className="s3-nav-link" to="/" state={{ section: 'credits' }}>
                        Credits
                    </Link>
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="s3-nav-link ml-1 gap-2"
                        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                    >
                        {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                    </button>
                </div>
            </nav>
            <hr className="s3-signal-bar" />
        </header>
    )
}
