const base = import.meta.env.BASE_URL;

export const PRODUCT_NAME = "San3a Academy PCB fabrication kit";
export const LOCAL_MODS_PATH = `${base}tools/mods-mill-2d-pcb/index.html`;
export const LOGO = {
    primaryRed: `${base}brand/logos/svg/san3a-primary-red.svg`,
    primaryWhite: `${base}brand/logos/svg/san3a-primary-white.svg`,
    symbolWhite: `${base}brand/logos/svg/san3a-symbol-white.svg`,
};
export const SAMPLE_TRACES = `${base}test.png`;
export const GERBER2PNG_LICENSE = `${base}licenses/gerber2png-LICENSE.txt`;
