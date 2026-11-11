# San3a Academy PCB fabrication kit

This tool is built on open-source projects and is provided by San3a Academy to help makers and students process fabrication on the machines at Fab Lab Egypt.

It has a landing page, a student guide and two tools in the San3a visual identity:

1. **Gerber to PNG** (`#/gerber`): turn Gerber and drill files into 1000 DPI PNGs for traces, drills and outline.
2. **PNG to G-code** (`tools/mods-mill-2d-pcb/`): the Mods mill 2D PCB program. Load a PNG, calculate the toolpath, check it and save the `.nc` file.

The student guide (`#/guide`) covers exporting from KiCad, the PNG settings, which Mods preset to use for each PNG, and a checklist before milling.

## Run it

```bash
npm install
npm run dev       # development server
npm run build     # production build in dist/
npm run preview   # serve the production build
```

Everything the tools need is in the build, so the kit works without internet access. Only the links to outside sites need it, as do the converter's machines other than G-code, which open modsproject.org.

`dist/` can go on any static web server, including `python3 -m http.server`, because pages use `#` routes. Set `BASE_PATH=/your-path/` when building for a sub-path. Open in Mods and the Mods preview windows open new tabs, so allow pop-ups for the site.

The Mods files in `public/tools/` are served as they are. Do not rename them: the program refers to them by path, and some paths contain spaces.

## How it differs from the original projects

Conversion, PNG output and the Mods program, modules and defaults behave as in the originals. The PNGs and the G-code were checked to be byte-identical. The differences:

- The look follows the San3a Academy media kit, with a landing page, a student guide, credits and an attribution footer.
- The G-code entry in the converter's Mods machine list opens the local Mods copy and is the default.
- The Microsoft Clarity analytics tag is removed.
- `pcb-stackup` 4.2.8 and the brand fonts are bundled locally (`public/vendor/`, `public/brand/fonts/`).
- The unfinished `/gcode` generator is removed. The Mods step produces the G-code.
- The converter moved to `#/gerber`. Links with `?source=` or `?port=&token=` (the KiCad plugin) are forwarded to it.
- The converter shows a message when uploaded files cannot be read, and icon buttons have accessible names.
- Mods: `modules/path/view/simulate toolpath.js` has a one-line fix. Before it, closing the simulation window with the browser's own close button stopped the next calculation from reaching **save file**, so Save offered the previous G-code. Mods also has a brand stylesheet (`san3a-mods.css`) and a home link.

## Credits

- **gerber2png**: [Fab Lab Kerala and its contributors](https://github.com/fablabkerala/gerber2png), with the original converter credited to [MidlajN (react-gerber-converter)](https://github.com/MidlajN/react-gerber-converter). MIT License, see `LICENSE`.
- **mods and mods CE**: Neil Gershenfeld and the [MIT Center for Bits and Atoms](https://cba.mit.edu), with the [mods CE](https://modsproject.org) community. The terms in its source files read: "This work may be reproduced, modified, distributed, performed, and displayed for any purpose, but must acknowledge the mods project. Copyright is retained and must be preserved. The work is provided as is; no warranty is provided, and users accept all liability."
- **Other libraries**: [pcb-stackup](https://github.com/tracespace/tracespace) (MIT), [three.js](https://threejs.org) (MIT), [D3](https://d3js.org) (ISC), [CodeMirror](https://codemirror.net/5/) (MIT).
- **Fonts**: Montserrat, Arvo and Inter, the media kit's free web substitutes, under the SIL Open Font License 1.1.

Fab Lab Kerala, MIT and the mods project do not endorse and are not partners in this product.

This software is provided as is, without warranty. Students must follow the lab's safety rules and check every toolpath before milling.
