import { Link } from 'react-router-dom';
import { LOCAL_MODS_PATH } from '../../config/links';
import { MODS_PRESETS } from '../../config/presets';
import Footer from '../layout/Footer';

const Section = ({ id, number, title, children }) => (
    <section id={id} aria-labelledby={`${id}-heading`} className="grid gap-4 border-t border-sand py-10 first:border-t-0 dark:border-white/20 md:grid-cols-[120px_minmax(0,1fr)]">
        <p className="s3-step-number text-4xl" aria-hidden="true">{number}</p>
        <div>
            <h2 id={`${id}-heading`} className="text-[length:var(--s3-text-xl)]">{title}</h2>
            <div className="mt-4 space-y-4">{children}</div>
        </div>
    </section>
);

const Steps = ({ items }) => (
    <ol className="list-decimal space-y-2 pl-5 marker:font-bold marker:text-brandred dark:marker:text-sun">
        {items.map((item, i) => <li key={i}>{item}</li>)}
    </ol>
);

const Note = ({ children }) => (
    <p className="rounded-lg bg-blush px-4 py-3 text-sm text-ink">{children}</p>
);

const Ui = ({ children }) => <strong className="font-semibold">{children}</strong>;

export default function Guide() {
    return (
        <div className="flex-1 overflow-y-auto">
            <main className="mx-auto max-w-4xl px-6 pb-6 pt-10">
                <p className="s3-eyebrow">Student guide</p>
                <h1 className="mt-2 text-[length:var(--s3-text-3xl)]">From KiCad to a milled board</h1>
                <p className="mt-3 max-w-2xl text-lg text-[color:var(--s3-text-muted)] dark:text-slate-300">
                    Follow these steps for every board. Ask the lab staff before you start if you are unsure which
                    bit the machine will use.
                </p>

                <Section id="export" number="01" title="Export your files from KiCad">
                    <Steps items={[
                        <>In the PCB Editor, open <Ui>File › Fabrication Outputs › Gerbers (.gbr)</Ui>.</>,
                        <>Tick the copper layers you will mill, <Ui>F.Cu</Ui> and, for a double-sided board, <Ui>B.Cu</Ui>, plus the board outline layer <Ui>Edge.Cuts</Ui>. Then click <Ui>Plot</Ui>.</>,
                        <>In the same window, click <Ui>Generate Drill Files…</Ui>, keep the Excellon format and click <Ui>Generate</Ui>.</>,
                        <>Keep all the files from that folder together. You can upload them one by one or as a single .zip.</>,
                    ]} />
                </Section>

                <Section id="png" number="02" title="Turn them into PNGs">
                    <Steps items={[
                        <>Open <Link className="s3-text-link" to="/gerber">Gerber to PNG</Link> and drop all your files on the upload area.</>,
                        <>Under <Ui>Copper Mode</Ui>, choose <Ui>Top</Ui> or <Ui>Bottom</Ui> for a single-sided board, or <Ui>2-Side</Ui> for a double-sided one. For 2-Side, set <Ui>Tool Width</Ui> to match the cutting bit the lab uses for the outline.</>,
                        <>Leave <Ui>Quick Setup</Ui> on <Ui>Generate All</Ui> and click <Ui>Generate PNG</Ui>. You get a trace, drill and outline image for each side you mill, all at 1000 DPI.</>,
                        <>Click each PNG to preview it and check that no trace or pad is missing.</>,
                        <>Optional: use <Ui>Add Tabs</Ui> on the outline to keep the board attached to the stock, or <Ui>Layout</Ui> to place several copies.</>,
                    ]} />
                </Section>

                <Section id="gcode" number="03" title="Calculate G-code in Mods">
                    <Steps items={[
                        <>In Gerber to PNG, click <Ui>Open in Mods</Ui>. Keep the machine set to <Ui>G-code</Ui> and click <Ui>Open Mods</Ui>. Mods opens in a new tab with your first PNG loaded. If nothing opens, allow pop-ups for this site.</>,
                        <>In the <Ui>set PCB defaults</Ui> module, click the preset for this job (see the table below).</>,
                        <>In <Ui>mill raster 2D</Ui>, click <Ui>calculate</Ui>. Wait until the button reads <Ui>calculate</Ui> again before you click anything else. A simulation window opens; you can look at it and close it.</>,
                        <>Click <Ui>view</Ui> in <Ui>mill raster 2D</Ui> and check the toolpath.</>,
                        <>In <Ui>save file</Ui>, click <Ui>save file</Ui> to download the .nc file. Rename it straight away, for example <code>board-top-trace.nc</code>, because every file starts with the same name.</>,
                        <>Back in Gerber to PNG, click <Ui>Send to Mods</Ui> for the next step and repeat. Work through the steps in the order shown.</>,
                    ]} />
                    <div className="overflow-x-auto rounded-xl border border-sand bg-white dark:border-white/20 dark:bg-maroon">
                        <table className="w-full text-left text-sm">
                            <caption className="sr-only">Mods preset for each PNG</caption>
                            <thead>
                                <tr className="border-b border-sand dark:border-white/20">
                                    <th scope="col" className="px-4 py-3 font-headline">PNG</th>
                                    <th scope="col" className="px-4 py-3 font-headline">Preset group in set PCB defaults</th>
                                    <th scope="col" className="px-4 py-3 font-headline">Presets in that group</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(MODS_PRESETS).map(([job, p]) => (
                                    <tr key={job} className="border-b border-sand last:border-0 dark:border-white/20">
                                        <th scope="row" className="px-4 py-3 capitalize">{job}</th>
                                        <td className="px-4 py-3">{p.group}</td>
                                        <td className="px-4 py-3">{p.examples}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Note>
                        Pick the preset that matches the bit actually in the machine. If you change a preset, wait for
                        the calculation to finish first, or the saved file may not match what you see.
                    </Note>
                    <p className="text-sm">
                        You can also <a className="s3-text-link" href={LOCAL_MODS_PATH} target="_blank" rel="noopener">open Mods on its own</a> and
                        load a PNG with <Ui>select png file</Ui> in the <Ui>read png</Ui> module.
                    </p>
                </Section>

                <Section id="mill" number="04" title="Before you mill">
                    <ul className="space-y-2">
                        {[
                            'Each .nc file matches the bit that is in the machine.',
                            'You checked every toolpath with view, and nothing is missing.',
                            'The outline is cut last, after traces and drills on that side.',
                            'For a double-sided board, ask the lab staff how to flip and align it.',
                            "You follow the lab's safety rules, and a staff member has approved the job.",
                        ].map((item) => (
                            <li key={item} className="flex gap-3">
                                <span aria-hidden="true" className="font-bold text-teal-700 dark:text-teal-500">✓</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                    <Note>
                        This software is provided as is, without warranty. Check every toolpath before milling.
                    </Note>
                </Section>
            </main>
            <Footer />
        </div>
    );
}
