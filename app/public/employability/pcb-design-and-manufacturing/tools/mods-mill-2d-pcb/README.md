# Mill 2D PCB (G-code)

A trimmed copy of [mods CE](https://modsproject.org) that contains only the **G-code > mill 2D PCB** program and the 19 modules it uses. It opens directly on that program.

## Run it

The page has to be served over HTTP. Opening `index.html` by double-click will not work.

```bash
cd mods-mill-2d-pcb
python3 -m http.server 8080
```

Then open <http://localhost:8080> in Chrome. Everything runs locally, and it can also be hosted on any static web host.

## Use it

1. Load a PNG from gerber2png in **read png**.
2. Pick a preset in **set PCB defaults** and adjust the tool settings in **mill raster 2D**.
3. Click **calculate**, then check the result with **view**.
4. Click **save file** in the **save file** module to download the `.nc` G-code.

## Differences from mods CE

- `index.html` opens this program by default and drops the mods CE site metadata.
- `js/mods.js` has the online version check turned off (one line).
- `programs/index.json`, `modules/index.json` and `files.html` list only the files in this folder.

In the San3a Academy PCB fabrication kit, this copy also differs in these ways:

- `index.html` loads the San3a favicon and brand stylesheets (`../../brand/san3a-brand.css`, `san3a-mods.css`) and adds a home link to the kit.
- `modules/path/view/simulate toolpath.js` treats a simulation window closed by the browser as not open. Without this, the next calculation stopped before **save file** and Save offered the previous G-code.

Everything else, including the other module code, is unchanged.

## Credit

mods was created by Neil Gershenfeld at the MIT Center for Bits and Atoms, and mods CE is maintained by its community. The copyright notices in the source files must stay in place. See the [mods CE project](https://modsproject.org).
