import { useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { GERBER2PNG_LICENSE, LOCAL_MODS_PATH, LOGO, PRODUCT_NAME, SAMPLE_TRACES } from '../../config/links';
import Footer from '../layout/Footer';

const WORKFLOW = [
    { title: 'Export from KiCad', body: 'Plot the Gerber and drill files for your board.' },
    { title: 'Generate PNGs', body: 'Upload the files and create 1000 DPI PNGs for traces, drills and outline.' },
    { title: 'Calculate G-code', body: 'Send each PNG to Mods, calculate the toolpath, check it and save the .nc file.' },
    { title: 'Mill the board', body: 'Run the G-code on the machine at the lab, following its safety rules.' },
];

const LIBRARIES = [
    { name: 'pcb-stackup', href: 'https://github.com/tracespace/tracespace', license: 'MIT License', use: 'Renders Gerber and drill files in the converter.' },
    { name: 'three.js', href: 'https://threejs.org', license: 'MIT License', use: 'Draws the 3D toolpath preview in Mods.' },
    { name: 'D3', href: 'https://d3js.org', license: 'ISC License', use: 'Draws the Mods node graph.' },
    { name: 'CodeMirror', href: 'https://codemirror.net/5/', license: 'MIT License', use: 'Provides the module code editor in Mods.' },
    { name: 'Montserrat, Arvo and Inter', href: 'https://openfontlicense.org', license: 'SIL Open Font License 1.1', use: 'The media kit\'s free web fonts, bundled for offline use.' },
];

const External = ({ href, children }) => (
    <a className="s3-text-link" href={href} target="_blank" rel="noopener noreferrer">{children}</a>
);

export default function Landing() {
    const location = useLocation();
    // The KiCad plugin and ?source= links put their query before the # route.
    const params = new URLSearchParams(window.location.search);
    const isToolLink = params.has('source') || (params.has('port') && params.has('token'));

    useEffect(() => {
        const section = location.state?.section;
        if (section) document.getElementById(section)?.scrollIntoView();
    }, [location.key, location.state]);

    // Links that load a board on arrival (including the KiCad plugin) belong to the converter.
    if (isToolLink) return <Navigate to="/gerber" replace />;

    return (
        <div className="s3-landing flex-1 overflow-y-auto">
            <section className="relative overflow-hidden bg-[image:var(--s3-gradient-brand)] text-white s3-on-dark" style={{ background: 'var(--s3-gradient-brand)' }}>
                <img className="pointer-events-none absolute -bottom-24 -right-16 w-[420px] opacity-[0.07]" src={LOGO.symbolWhite} alt="" />
                <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[minmax(0,1fr)_300px] md:items-center">
                    <div>
                        <p className="s3-eyebrow">For makers and students at Fab Lab Egypt</p>
                        <h1 className="mt-3 text-[length:var(--s3-text-3xl)]">{PRODUCT_NAME}</h1>
                        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#F3E7EA]">
                            Take your KiCad board from Gerber files to G-code you can mill. Generate clean 1000 DPI
                            images, then calculate and check each toolpath before you go to the machine.
                        </p>
                        <div className="mt-7 flex flex-wrap gap-3">
                            <Link className="s3-btn s3-btn--sun" to="/gerber">Start with your Gerber files</Link>
                            <Link className="s3-btn s3-btn--ghost" to="/guide">Read the student guide</Link>
                        </div>
                    </div>
                    <div className="s3-pcb-frame hidden rounded-xl border border-white/20 p-4 md:block">
                        <img className="mx-auto max-h-64 w-auto" src={SAMPLE_TRACES} alt="Example 1000 DPI trace image: white copper traces and pads on black" />
                        <p className="mt-3 text-center text-xs text-[#D8C7CD]">A trace PNG, ready for Mods</p>
                    </div>
                </div>
                <hr className="s3-signal-bar" />
            </section>

            <main className="mx-auto max-w-6xl px-6">
                <section aria-labelledby="tools-heading" className="py-12">
                    <p className="s3-eyebrow">The tools</p>
                    <h2 id="tools-heading" className="mt-2 text-[length:var(--s3-text-2xl)]">Two steps, one board</h2>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <article className="s3-card flex flex-col dark:!bg-maroon dark:!border-white/20">
                            <p className="s3-step-number text-5xl">1</p>
                            <h3 className="mt-3 text-xl">Gerber to PNG</h3>
                            <p className="mt-2 flex-1 text-[color:var(--s3-text-muted)] dark:text-slate-300">
                                View your layers and create the trace, drill and outline images. Double-sided boards,
                                outline tabs and multi-board layouts are all here.
                            </p>
                            <Link className="s3-btn s3-btn--primary mt-5 self-start" to="/gerber">Open the converter</Link>
                        </article>
                        <article className="s3-card flex flex-col dark:!bg-maroon dark:!border-white/20">
                            <p className="s3-step-number text-5xl">2</p>
                            <h3 className="mt-3 text-xl">PNG to G-code</h3>
                            <p className="mt-2 flex-1 text-[color:var(--s3-text-muted)] dark:text-slate-300">
                                Load each PNG into the mill 2D PCB program, pick a preset, calculate the toolpath, view
                                it and save the .nc file. Let each calculation finish before you change a preset.
                            </p>
                            <a className="s3-btn s3-btn--primary mt-5 self-start" href={LOCAL_MODS_PATH} target="_blank" rel="noopener">Open Mods</a>
                        </article>
                    </div>
                </section>

                <section aria-labelledby="workflow-heading" className="border-t border-sand py-12 dark:border-white/20">
                    <p className="s3-eyebrow">How it works</p>
                    <h2 id="workflow-heading" className="mt-2 text-[length:var(--s3-text-2xl)]">From design to milled board</h2>
                    <p className="mt-2 text-[color:var(--s3-text-muted)] dark:text-slate-300">
                        New to milling? The <Link className="s3-text-link" to="/guide">student guide</Link> walks through every click.
                    </p>
                    <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {WORKFLOW.map((step, index) => (
                            <li key={step.title}>
                                <p className="s3-step-number text-2xl">{String(index + 1).padStart(2, '0')}</p>
                                <h3 className="mt-2 text-lg">{step.title}</h3>
                                <p className="mt-1 text-sm text-[color:var(--s3-text-muted)] dark:text-slate-300">{step.body}</p>
                            </li>
                        ))}
                    </ol>
                </section>

                <section id="credits" aria-labelledby="credits-heading" className="border-t border-sand py-12 dark:border-white/20">
                    <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_200px]">
                        <div>
                            <p className="s3-eyebrow">Credits</p>
                            <h2 id="credits-heading" className="mt-2 text-[length:var(--s3-text-2xl)]">Built on open source</h2>
                            <p className="mt-3 max-w-3xl">
                                This tool is built on open-source projects and is provided by San3a Academy to help
                                makers and students process fabrication on the machines at Fab Lab Egypt.
                            </p>
                        </div>
                        <img className="hidden w-40 self-center justify-self-end dark:hidden md:block" src={LOGO.primaryRed} alt="San3a Academy" />
                        <img className="hidden w-40 self-center justify-self-end dark:md:block" src={LOGO.primaryWhite} alt="San3a Academy" />
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                        <article className="s3-card dark:!bg-maroon dark:!border-white/20">
                            <h3 className="text-lg">gerber2png</h3>
                            <p className="mt-2 text-sm">
                                By <External href="https://github.com/fablabkerala/gerber2png">Fab Lab Kerala and its contributors</External>.
                                The original converter is credited to <External href="https://github.com/MidlajN/react-gerber-converter">MidlajN (react-gerber-converter)</External>.
                                Released under the <External href={GERBER2PNG_LICENSE}>MIT License</External>.
                                Its <External href="https://github.com/fablabkerala/gerber2png/wiki">documentation</External> applies to the converter here.
                            </p>
                        </article>
                        <article className="s3-card dark:!bg-maroon dark:!border-white/20">
                            <h3 className="text-lg">mods and mods CE</h3>
                            <p className="mt-2 text-sm">
                                By Neil Gershenfeld and the <External href="https://cba.mit.edu">MIT Center for Bits and Atoms</External>,
                                with the <External href="https://modsproject.org">mods CE</External> community. From the terms in its source files:
                            </p>
                            <blockquote className="mt-2 border-l-4 border-sand pl-3 text-sm italic dark:border-white/20">
                                This work may be reproduced, modified, distributed, performed, and displayed for any
                                purpose, but must acknowledge the mods project. Copyright is retained and must be
                                preserved. The work is provided as is; no warranty is provided, and users accept all
                                liability.
                            </blockquote>
                        </article>
                    </div>

                    <h3 className="mt-8 text-lg">Other bundled libraries</h3>
                    <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {LIBRARIES.map((lib) => (
                            <li key={lib.name} className="text-sm">
                                <External href={lib.href}>{lib.name}</External>
                                <span className="text-[color:var(--s3-text-muted)] dark:text-slate-300">, {lib.license}. {lib.use}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8 rounded-lg bg-blush p-4 text-sm text-ink">
                        <p className="font-semibold">Before you mill</p>
                        <p className="mt-1">
                            This software is provided as is, without warranty. Follow the lab&apos;s safety rules and check
                            every toolpath before milling. Fab Lab Kerala, MIT and the mods project do not endorse and
                            are not partners in this product.
                        </p>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
