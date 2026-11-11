//
// image tabs
//
// Neil Gershenfeld
// (c) Massachusetts Institute of Technology 2023
//
// This work may be reproduced, modified, distributed, performed, and
// displayed for any purpose, but must acknowledge the mods
// project. Copyright is retained and must be preserved. The work is
// provided as is; no warranty is provided, and users accept all
// liability.
//
// closure
//
(function () {
    //
    // module globals
    //
    var mod = {};
    //
    // name
    //
    var name = "image tabs";
    var description = 'Adds holding tabs to East/West edges of an image for CNC milling workholding'
    //
    // initialization
    //
    var init = function () {
        mod.length_in.value = 0;
        mod.length_mm.value = 25.4 * parseFloat(mod.length_in.value);
        mod.width_in.value = 0;
        mod.width_mm.value = 25.4 * parseFloat(mod.width_in.value);
        mod.E.checked = true;
        mod.W.checked = true;
        //mod.N.checked = false // NS path bug?
        //mod.S.checked = false
    };
    //
    // inputs
    //
    var inputs = {
        image: {
            type: "RGBA",
            event: function (evt) {
                mod.input = evt.detail;
                var ctx = mod.img.getContext("2d");
                ctx.canvas.width = mod.input.width;
                ctx.canvas.height = mod.input.height;
                ctx.putImageData(mod.input, 0, 0);
                image_tabs();
            },
        },
        imageInfo: {
            type: "object",
            event: function (evt) {
                mod.name = evt.detail.name;
                mod.dpi = evt.detail.dpi;
                mod.width = evt.detail.width;
                mod.height = evt.detail.height;
                image_tabs();
                // race condition, assuming imageInfo comes 2nd
            },
        },
        settings: {
            type: "object",
            event: function (evt) {
                set_values(evt.detail);
                image_tabs();
            },
        },
    };
    //
    // outputs
    //
    var outputs = {
        image: {
            type: "RGBA",
            event: function () {
                var ctx = mod.img.getContext("2d");
                var img = ctx.getImageData(0, 0, mod.img.width, mod.img.height);
                mods.output(mod, "image", img);
            },
        },
    };
    //
    // interface
    //
    var interface = function (div) {
        mod.div = div;
        //
        // on-screen drawing canvas
        //
        var canvas = document.createElement("canvas");
        canvas.width = mods.ui.canvas;
        canvas.height = mods.ui.canvas;
        canvas.style.backgroundColor = "rgb(255,255,255)";
        div.appendChild(canvas);
        mod.canvas = canvas;
        div.appendChild(document.createElement("br"));
        //
        // off-screen image canvas
        //
        var canvas = document.createElement("canvas");
        mod.img = canvas;
        //
        // tab width
        //
        div.appendChild(document.createTextNode("tab width"));
        div.appendChild(document.createElement("br"));
        div.appendChild(document.createTextNode("mm: "));
        var input = document.createElement("input");
        input.type = "text";
        input.size = 6;
        input.addEventListener("input", function () {
            mod.width_in.value = parseFloat(mod.width_mm.value) / 25.4;
            image_tabs();
        });
        div.appendChild(input);
        mod.width_mm = input;
        div.appendChild(document.createTextNode(" in: "));
        var input = document.createElement("input");
        input.type = "text";
        input.size = 6;
        input.addEventListener("input", function () {
            mod.width_mm.value = parseFloat(mod.width_in.value) * 25.4;
            image_tabs();
        });
        div.appendChild(input);
        mod.width_in = input;
        div.appendChild(document.createElement("br"));
        //
        // tab length
        //
        div.appendChild(document.createTextNode("tab length"));
        div.appendChild(document.createElement("br"));
        div.appendChild(document.createTextNode("mm: "));
        var input = document.createElement("input");
        input.type = "text";
        input.size = 6;
        input.addEventListener("input", function () {
            mod.length_in.value = parseFloat(mod.length_mm.value) / 25.4;
            image_tabs();
        });
        div.appendChild(input);
        mod.length_mm = input;
        div.appendChild(document.createTextNode(" in: "));
        var input = document.createElement("input");
        input.type = "text";
        input.size = 6;
        input.addEventListener("input", function () {
            mod.length_mm.value = parseFloat(mod.length_in.value) * 25.4;
            image_tabs();
        });
        div.appendChild(input);
        mod.length_in = input;
        div.appendChild(document.createElement("br"));
        //
        // tab sides
        //
        div.appendChild(document.createTextNode("tab sides: "));
        div.appendChild(document.createTextNode("E"));
        var input = document.createElement("input");
        input.type = "checkbox";
        input.addEventListener("change", function () {
            image_tabs();
        });
        div.appendChild(input);
        mod.E = input;
        div.appendChild(document.createTextNode(" W"));
        var input = document.createElement("input");
        input.type = "checkbox";
        input.addEventListener("change", function () {
            image_tabs();
        });
        div.appendChild(input);
        mod.W = input;
        /*
        div.appendChild(document.createTextNode(' N'))
        var input = document.createElement('input')
        input.type = 'checkbox'
        input.addEventListener('change',function() {
            image_tabs()
            })
        div.appendChild(input)
        mod.N = input
        div.appendChild(document.createTextNode(' S'))
        var input = document.createElement('input')
        input.type = 'checkbox'
        input.addEventListener('change',function() {
            image_tabs()
            })
        div.appendChild(input)
        mod.S = input
        */
        div.appendChild(document.createElement("br"));
        //
        // view button
        //
        var btn = document.createElement("button");
        btn.style.padding = mods.ui.padding;
        btn.style.margin = 1;
        btn.appendChild(document.createTextNode("view"));
        btn.addEventListener("click", function () {
            var win = window.open("");
            var btn = document.createElement("button");
            btn.appendChild(document.createTextNode("close"));
            btn.style.padding = mods.ui.padding;
            btn.style.margin = 1;
            btn.addEventListener("click", function () {
                win.close();
            });
            win.document.body.appendChild(btn);
            win.document.body.appendChild(document.createElement("br"));
            var canvas = document.createElement("canvas");
            canvas.width = mod.img.width;
            canvas.height = mod.img.height;
            win.document.body.appendChild(canvas);
            var ctx = canvas.getContext("2d");
            ctx.drawImage(mod.img, 0, 0);
        });
        div.appendChild(btn);
    };
    //
    // local functions
    //
    // set_values
    //
    function set_values(settings) {
        for (var s in settings) {
            switch (s) {
                case "tab width (in)":
                    mod.width_in.value = settings[s];
                    mod.width_mm.value = parseFloat(mod.width_in.value) * 25.4;
                    break;
                case "tab width (mm)":
                    mod.width_mm.value = settings[s];
                    mod.width_in.value = parseFloat(mod.width_mm.value) / 25.4;
                    break;
                case "tab length (in)":
                    mod.length_in.value = settings[s];
                    mod.length_mm.value =
                        parseFloat(mod.length_in.value) * 25.4;
                    break;
                case "tab length (mm)":
                    mod.length_mm.value = settings[s];
                    mod.length_in.value =
                        parseFloat(mod.length_mm.value) / 25.4;
                    break;
            }
        }
    }
    //
    // image tabs
    //
    function image_tabs() {
        var blob = new Blob(["(" + worker.toString() + "())"]);
        var url = window.URL.createObjectURL(blob);
        var webworker = new Worker(url);
        webworker.addEventListener("message", function (evt) {
            window.URL.revokeObjectURL(url);
            var h = mod.img.height;
            var w = mod.img.width;
            var buf = new Uint8ClampedArray(evt.data.buffer);
            var imgdata = new ImageData(buf, w, h);
            var ctx = mod.img.getContext("2d");
            ctx.putImageData(imgdata, 0, 0);
            if (w > h) {
                var x0 = 0;
                var y0 = mod.canvas.height * 0.5 * (1 - h / w);
                var wd = mod.canvas.width;
                var hd = (mod.canvas.width * h) / w;
            } else {
                var x0 = mod.canvas.width * 0.5 * (1 - w / h);
                var y0 = 0;
                var wd = (mod.canvas.height * w) / h;
                var hd = mod.canvas.height;
            }
            var ctx = mod.canvas.getContext("2d");
            ctx.clearRect(0, 0, mod.canvas.width, mod.canvas.height);
            ctx.drawImage(mod.img, x0, y0, wd, hd);
            webworker.terminate();
            outputs.image.event();
        });
        var ctx = mod.canvas.getContext("2d");
        ctx.clearRect(0, 0, mod.canvas.width, mod.canvas.height);
        var E = parseFloat(mod.E.value);
        var ctx = mod.img.getContext("2d");
        ctx.putImageData(mod.input, 0, 0);
        var img = ctx.getImageData(0, 0, mod.img.width, mod.img.height);
        webworker.postMessage(
            {
                height: mod.input.height,
                width: mod.input.width,
                E: mod.E.checked,
                W: mod.W.checked,
                //N: mod.N.checked,
                //S: mod.S.checked,
                dpi: mod.dpi,
                lenin: mod.length_in.value,
                widin: mod.width_in.value,
                buffer: img.data.buffer,
            },
            [img.data.buffer],
        );
    }

    function worker() {
        self.addEventListener("message", function (evt) {
            var h = evt.data.height;
            var w = evt.data.width;
            console.log(evt.data.lenin, evt.data.dpi);
            var dl = evt.data.lenin * evt.data.dpi;
            var dw = evt.data.widin * evt.data.dpi;
            var E = evt.data.E;
            var W = evt.data.W;
            //var N = evt.data.N
            //var S = evt.data.S
            var buf = new Uint8ClampedArray(evt.data.buffer);
            console.log(evt.data.widin, dl, dw);
            for (var row = 0; row < h; ++row) {
                for (var col = 0; col < w; ++col) {
                    if (E) {
                        if (
                            row > h / 2 - dw / 2 &&
                            row < h / 2 + dw / 2 &&
                            col > w - dl
                        ) {
                            buf[(h - 1 - row) * w * 4 + col * 4 + 0] = 255;
                            buf[(h - 1 - row) * w * 4 + col * 4 + 1] = 255;
                            buf[(h - 1 - row) * w * 4 + col * 4 + 2] = 255;
                            buf[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
                        }
                    }
                    if (W) {
                        if (
                            row > h / 2 - dw / 2 &&
                            row < h / 2 + dw / 2 &&
                            col < dl
                        ) {
                            buf[(h - 1 - row) * w * 4 + col * 4 + 0] = 255;
                            buf[(h - 1 - row) * w * 4 + col * 4 + 1] = 255;
                            buf[(h - 1 - row) * w * 4 + col * 4 + 2] = 255;
                            buf[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
                        }
                    }
                    /*
                   if (N) {
                      if ((col > (w/2-dw/2)) && (col < (w/2+dw/2))
                            && (row > (h-dl))) {
                         buf[(h-1-row)*w*4+col*4+0] = 255
                         buf[(h-1-row)*w*4+col*4+1] = 255
                         buf[(h-1-row)*w*4+col*4+2] = 255
                         buf[(h-1-row)*w*4+col*4+3] = 255
                         }
                      }
                   if (S) {
                      if ((col > (w/2-dw/2)) && (col < (w/2+dw/2))
                            && (row < dl)) {
                         buf[(h-1-row)*w*4+col*4+0] = 255
                         buf[(h-1-row)*w*4+col*4+1] = 255
                         buf[(h-1-row)*w*4+col*4+2] = 255
                         buf[(h-1-row)*w*4+col*4+3] = 255
                         }
                      }
                   */
                }
            }
            self.postMessage(
                {
                    buffer: buf.buffer,
                },
                [buf.buffer],
            );
        });
    }
    //
    // return values
    //
    return {
        mod: mod,
        name: name,
        description: description,
        init: init,
        inputs: inputs,
        outputs: outputs,
        interface: interface,
    };
})();
