const base = import.meta.env.BASE_URL;

export const PRODUCT_NAME = "San3a Academy PCB fabrication kit";
export const LOCAL_MODS_PATH = `${base}tools/mods-mill-2d-pcb/index.html`;
export const LOGO = {
    // Official lockups. The brand approves only the red ink, on white or brand-night.
    primaryRed: `${base}brand/logos/san3a-academy-logo-primary.png`,
    primaryWhite: `${base}brand/logos/san3a-academy-logo-primary.png`,
    symbolWhite: `${base}brand/logos/san3a-academy-logo-stacked.png`,
};
export const SAMPLE_TRACES = `${base}test.png`;
export const GERBER2PNG_LICENSE = `${base}licenses/gerber2png-LICENSE.txt`;
