//
// read png
//
// Neil Gershenfeld 
// (c) Massachusetts Institute of Technology 2015,6
// Modified by Fran Sanchez June 2021 (add flip v) and ChatGPT Feb 23 (add rotate cw)
// 
// This work may be reproduced, modified, distributed, performed, and 
// displayed for any purpose, but must acknowledge the fab modules 
// project. Copyright is retained and must be preserved. The work is 
// provided as is; no warranty is provided, and users accept all 
// liability.
//
// closure
//
(function() {
    //
    // module globals
    //
    var mod = {}
    //
    // name
    //
    var name = 'read png'
    var description = 'Reads PNG images with DPI detection from the pHYs chunk. Supports invert, flip, and rotate transforms via web workers. Accepts postMessage from external apps (e.g. Gerber2Png).'
    //
    // initialization
    //
    var init = function() {
        // listen for postMessage from external apps (e.g. Gerber2Png)
        // accepts ArrayBuffer, base64 string, or Blob
        window.addEventListener('message', function(e) {
            var data = e.data
            if (!data) return
            // object with type 'png' for explicit targeting
            if (typeof data === 'object' && data.type === 'png') data = data.data
            else if (typeof data === 'object') return
            else if (typeof data === 'string' && !data.match(/^[A-Za-z0-9+/=\s]+$/)) return
            // acknowledge receipt so sender can stop retrying
            if (e.source && e.source !== window) e.source.postMessage('ready', e.origin)
            if (data instanceof ArrayBuffer) {
                file_name = 'postMessage.png'
                mod.name.nodeValue = file_name
                input_file = new Blob([data], {type: 'image/png'})
                png_binary_handler({target: {result: data}})
            } else if (typeof data === 'string') {
                // base64 encoded PNG
                var binary = atob(data)
                var bytes = new Uint8Array(binary.length)
                for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
                var buf = bytes.buffer
                file_name = 'postMessage.png'
                mod.name.nodeValue = file_name
                input_file = new Blob([buf], {type: 'image/png'})
                png_binary_handler({target: {result: buf}})
            }
        })
    }
    //
    // inputs
    //
    var inputs = {}
    //
    // outputs
    //
    var outputs = {
        image: {
            type: 'RGBA',
            event: function() {
                var ctx = mod.img.getContext("2d")
                var img = ctx.getImageData(0, 0, mod.img.width, mod.img.height)
                mods.output(mod, 'image', img)
            }
        },
        imageInfo: {
            type: 'object',
            event: function() {
                var obj = {}
                obj.name = mod.name.nodeValue
                obj.dpi = parseFloat(mod.dpitext.value)
                obj.width = mod.img.width
                obj.height = mod.img.height
                mods.output(mod, 'imageInfo', obj)
            }
        }
    }
    //
    // interface
    //
    var interface = function(div) {
        mod.div = div
        //
        // file input control
        //
        var file = document.createElement('input')
        file.setAttribute('type', 'file')
        file.setAttribute('accept', '.png')
        file.setAttribute('id', div.id + 'file_input')
        file.style.position = 'absolute'
        file.style.left = 0
        file.style.top = 0
        file.style.width = 0
        file.style.height = 0
        file.style.opacity = 0
        file.addEventListener('change', function() {
            png_read_handler()
        })
        div.appendChild(file)
        mod.file = file
        //
        // on-screen drawing canvas
        //
        var canvas = document.createElement('canvas')
        canvas.width = mods.ui.canvas
        canvas.height = mods.ui.canvas
        canvas.style.backgroundColor = 'rgb(245,245,245)'
        canvas.addEventListener('dragover', function(e) {
            e.preventDefault()
            canvas.style.outline = '2px dashed #999'
        })
        canvas.addEventListener('dragleave', function() {
            canvas.style.outline = ''
        })
        canvas.addEventListener('drop', function(e) {
            e.preventDefault()
            canvas.style.outline = ''
            if (e.dataTransfer.files.length > 0) {
                mod.file.files = e.dataTransfer.files
                png_read_handler()
            }
        })
        div.appendChild(canvas)
        mod.canvas = canvas
        draw_drop_hint(canvas)
        div.appendChild(document.createElement('br'))
        //
        // off-screen image canvas
        //
        var canvas = document.createElement('canvas')
        mod.img = canvas
        //
        // file select button
        //
        var btn = document.createElement('button')
        btn.style.padding = mods.ui.padding
        btn.style.margin = 1
        btn.appendChild(document.createTextNode('select png file'))
        btn.addEventListener('click', function() {
            var file = document.getElementById(div.id + 'file_input')
            file.value = null
            file.click()
        })
        div.appendChild(btn)
        var btn = document.createElement('button')
        btn.style.padding = mods.ui.padding
        btn.style.margin = 1
        btn.appendChild(document.createTextNode('clear'))
        btn.addEventListener('click', function() {
            var ctx = mod.canvas.getContext('2d')
            ctx.clearRect(0, 0, mod.canvas.width, mod.canvas.height)
            draw_drop_hint(mod.canvas)
            var ctx2 = mod.img.getContext('2d')
            ctx2.clearRect(0, 0, mod.img.width, mod.img.height)
            mod.name.nodeValue = ''
            if (mod.src) mod.src.value = ''
        })
        div.appendChild(btn)
        div.appendChild(document.createElement('br'))
        div.appendChild(document.createTextNode('src: '))
        var input = document.createElement('input')
            input.type = 'text'
            input.size = 20
            input.placeholder = 'examples/file.png'
            div.appendChild(input)
            mod.src = input
            input.addEventListener('change', function() {
                if (mod.src.value) load_from_url(mod.src.value)
            })
            input.addEventListener('input', function() {
                if (mod.src.value && mod.src.value.endsWith('.png'))
                    load_from_url(mod.src.value)
            })
        div.appendChild(document.createElement('br'))
        //
        // view button
        //
        var btn = document.createElement('button')
        btn.style.padding = mods.ui.padding
        btn.style.margin = 1
        btn.appendChild(document.createTextNode('view'))
        btn.addEventListener('click', function() {
            var win = window.open('')
            var btn = document.createElement('button')
            btn.appendChild(document.createTextNode('close'))
            btn.style.padding = mods.ui.padding
            btn.style.margin = 1
            btn.addEventListener('click', function() {
                win.close()
            })
            win.document.body.appendChild(btn)
            win.document.body.appendChild(document.createElement('br'))
            var canvas = document.createElement('canvas')
            canvas.width = mod.img.width
            canvas.height = mod.img.height
            win.document.body.appendChild(canvas)
            var ctx = canvas.getContext("2d")
            ctx.drawImage(mod.img, 0, 0)
        })
        div.appendChild(btn)
        div.appendChild(document.createTextNode(' '))
        //
        // invert button
        //
        var btn = document.createElement('button')
        btn.style.padding = mods.ui.padding
        btn.style.margin = 1
        btn.appendChild(document.createTextNode('invert'))
        btn.addEventListener('click', function() {
            invert_image()
        })
        div.appendChild(btn)
        div.appendChild(document.createElement('br'))
        //
        // flip button
        //
        var flip_btn = document.createElement('button')
        flip_btn.style.padding = mods.ui.padding
        flip_btn.style.margin = 1
        flip_btn.appendChild(document.createTextNode('flip H'))
        flip_btn.addEventListener('click', function() {
            flip_image()
        })
        div.appendChild(flip_btn)
        div.appendChild(document.createTextNode(' '))
        //
        //
        // flipv button
        //
        var flipv_btn = document.createElement('button')
        flipv_btn.style.padding = mods.ui.padding
        flipv_btn.style.margin = 1
        flipv_btn.appendChild(document.createTextNode('flip V'))
        flipv_btn.addEventListener('click', function() {
            flipv_image()
        })
        div.appendChild(flipv_btn)
        div.appendChild(document.createTextNode(' '))
        //
        // rotate button
        //
        var rot_btn = document.createElement('button')
        rot_btn.style.padding = mods.ui.padding
        rot_btn.style.margin = 1
        rot_btn.disabled = false
        rot_btn.appendChild(document.createTextNode('rotate 90CW'))
        rot_btn.addEventListener('click', function() {
            rotate90cw_image()
        })
        div.appendChild(rot_btn)
        div.appendChild(document.createElement('br'))
        //
        // info div
        //
        var info = document.createElement('div')
        info.setAttribute('id', div.id + 'info')
        info.appendChild(document.createTextNode('dpi: '))
        var input = document.createElement('input')
        input.type = 'text'
        input.size = 6
        input.addEventListener('input', function() {
            mod.dpi = parseFloat(mod.dpitext.value)
            mod.mmtext.nodeValue = (25.4 * mod.img.width / mod.dpi).toFixed(3) +
                ' x ' + (25.4 * mod.img.height / mod.dpi).toFixed(3) + ' mm'
            mod.intext.nodeValue = (mod.img.width / mod.dpi).toFixed(3) +
                ' x ' + (mod.img.height / mod.dpi).toFixed(3) + ' in'
            outputs.imageInfo.event()
        })
        info.appendChild(input)
        mod.dpitext = input
        info.appendChild(document.createElement('br'))
        var text = document.createTextNode('px: ')
        info.appendChild(text)
        mod.pxtext = text
        info.appendChild(document.createElement('br'))
        var text = document.createTextNode('mm: ')
        info.appendChild(text)
        mod.mmtext = text
        info.appendChild(document.createElement('br'))
        var text = document.createTextNode('in: ')
        info.appendChild(text)
        mod.intext = text
        info.appendChild(document.createElement('br'))
        var text = document.createTextNode('')
        info.appendChild(text)
        mod.name = text
        div.appendChild(info)
    }
    //
    // local functions
    //
    function draw_drop_hint(canvas) {
        var ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ccc'
        ctx.font = '14px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('drop file here', canvas.width / 2, canvas.height / 2)
    }
    //
    // load from URL
    //
    function load_from_url(url) {
        fetch(url).then(function(r) {
            if (!r.ok) { set_prompt('error: could not fetch ' + url); return }
            return r.arrayBuffer()
        }).then(function(buf) {
            if (!buf) return
            file_name = url.split('/').pop()
            mod.name.nodeValue = file_name
            input_file = new Blob([buf], {type: 'image/png'})
            png_binary_handler({target: {result: buf}})
        })
    }
    //
    // read handler
    //
    function png_read_handler(event) {
        input_file = mod.file.files[0]
        file_name = input_file.name
        if (!file_name.toLowerCase().endsWith('.png')) {
            set_prompt("error: not a PNG file")
            return
        }
        mod.name.nodeValue = file_name
        var file_reader = new FileReader()
        file_reader.onload = png_binary_handler
        file_reader.readAsArrayBuffer(input_file)
    }
    //
    // binary load handler
    //
    function png_binary_handler(event) {
        //
        // get DPI
        //
        // 8 header
        // 4 len, 4 type, data, 4 crc
        // pHYs 4 ppx, 4 ppy, 1 unit: 0 ?, 1 meter
        // IEND
        //
        var units = ppx = ppy = 0
        var buf = event.target.result
        var view = new DataView(buf)
        var ptr = 8
        if (!((view.getUint8(1) == 80) && (view.getUint8(2) == 78) && (view.getUint8(3) == 71))) {
            set_prompt("error: PNG header not found")
            return
        }
        while (1) {
            var length = view.getUint32(ptr)
            ptr += 4
            var type = String.fromCharCode(
                view.getUint8(ptr), view.getUint8(ptr + 1),
                view.getUint8(ptr + 2), view.getUint8(ptr + 3))
            ptr += 4
            if (type == "pHYs") {
                ppx = view.getUint32(ptr)
                ppy = view.getUint32(ptr + 4)
                units = view.getUint8(ptr + 8)
            }
            if (type == "IEND")
                break
            ptr += length + 4
        }
        if (units == 0) {
            set_prompt("no PNG units not found, assuming 72 DPI")
            ppx = 72 * 1000 / 25.4
        }
        dpi = ppx * 25.4 / 1000
        //
        // read as URL for display
        //
        var file_reader = new FileReader()
        file_reader.onload = png_URL_handler
        file_reader.readAsDataURL(input_file)
    }
    //
    // URL load handler
    //
    function png_URL_handler(event) {
        var img = new Image()
        img.setAttribute("src", event.target.result)
        img.onload = function() {
            if (img.width > img.height) {
                var x0 = 0
                var y0 = mod.canvas.height * .5 * (1 - img.height / img.width)
                var w = mod.canvas.width
                var h = mod.canvas.width * img.height / img.width
            } else {
                var x0 = mod.canvas.width * .5 * (1 - img.width / img.height)
                var y0 = 0
                var w = mod.canvas.height * img.width / img.height
                var h = mod.canvas.height
            }

            var ctx = mod.img.getContext("2d")
            ctx.canvas.width = img.width
            ctx.canvas.height = img.height
            ctx.drawImage(img, 0, 0)

            // Remove transparency
            var imgData = ctx.getImageData(0, 0, mod.img.width, mod.img.height)
            var data = imgData.data
            for (var i = 3; i < data.length; i += 4) {
                data[i] = 255;  // set alpha channel to opaque
            }
            ctx.putImageData(imgData, 0, 0)

            var ctx = mod.canvas.getContext("2d")
            ctx.clearRect(0, 0, mod.canvas.width, mod.canvas.height)
            ctx.drawImage(mod.img, x0, y0, w, h)

            mod.dpitext.value = dpi.toFixed(3)
            mod.pxtext.nodeValue = img.width + ' x ' + img.height + ' px'
            mod.mmtext.nodeValue = (25.4 * img.width / dpi).toFixed(3) +
                ' x ' + (25.4 * img.height / dpi).toFixed(3) + ' mm'
            mod.intext.nodeValue = (img.width / dpi).toFixed(3) +
                ' x ' + (img.height / dpi).toFixed(3) + ' in'
            outputs.image.event()
            outputs.imageInfo.event()
        }
    }
    //
    // invert image
    //
    function invert_image() {
        var blob = new Blob(['(' + worker.toString() + '())'])
        var url = window.URL.createObjectURL(blob)
        var webworker = new Worker(url)
        webworker.addEventListener('message', function(evt) {
            window.URL.revokeObjectURL(url)
            var h = mod.img.height
            var w = mod.img.width
            var buf = new Uint8ClampedArray(evt.data.buffer) //canvas pixels contain 4 elements: RGBA
            var imgdata = new ImageData(buf, w, h)
            var ctx = mod.img.getContext("2d")
            ctx.putImageData(imgdata, 0, 0)
            if (w > h) {
                var x0 = 0
                var y0 = mod.canvas.height * .5 * (1 - h / w)
                var wd = mod.canvas.width
                var hd = mod.canvas.width * h / w
            } else {
                var x0 = mod.canvas.width * .5 * (1 - w / h)
                var y0 = 0
                var wd = mod.canvas.height * w / h
                var hd = mod.canvas.height
            }
            var ctx = mod.canvas.getContext("2d")
            ctx.drawImage(mod.img, x0, y0, wd, hd)
            webworker.terminate()
            outputs.image.event()
        })
        var ctx = mod.canvas.getContext("2d")
        ctx.clearRect(0, 0, mod.canvas.width, mod.canvas.height)
        var h = mod.img.height
        var w = mod.img.width
        var ctx = mod.img.getContext("2d")
        var img = ctx.getImageData(0, 0, w, h)
        webworker.postMessage({
            height: img.height,
            width: img.width,
            buffer: img.data.buffer
        }, [img.data.buffer])
    }

    function worker() {
        self.addEventListener('message', function(evt) {
            var h = evt.data.height
            var w = evt.data.width
            var buf = new Uint8ClampedArray(evt.data.buffer)
            for (var row = 0; row < h; ++row) {
                for (var col = 0; col < w; ++col) {
                    buf[(h - 1 - row) * w * 4 + col * 4 + 0] = 255 - buf[(h - 1 - row) * w * 4 + col * 4 + 0]
                    buf[(h - 1 - row) * w * 4 + col * 4 + 1] = 255 - buf[(h - 1 - row) * w * 4 + col * 4 + 1]
                    buf[(h - 1 - row) * w * 4 + col * 4 + 2] = 255 - buf[(h - 1 - row) * w * 4 + col * 4 + 2]
                    buf[(h - 1 - row) * w * 4 + col * 4 + 3] = 255
                }
            }
            self.postMessage({
                buffer: buf.buffer
            }, [buf.buffer])
        })
    }
    //
    // flip image
    //
    function flip_image() {
        var blob = new Blob(['(' + flip_worker.toString() + '())'])
        var url = window.URL.createObjectURL(blob)
        var webworker = new Worker(url)
        webworker.addEventListener('message', function(evt) {
            window.URL.revokeObjectURL(url)
            var h = mod.img.height
            var w = mod.img.width
            var buf = new Uint8ClampedArray(evt.data.buffer)
            var imgdata = new ImageData(buf, w, h)
            var ctx = mod.img.getContext("2d")
            ctx.putImageData(imgdata, 0, 0)
            if (w > h) {
                var x0 = 0
                var y0 = mod.canvas.height * .5 * (1 - h / w)
                var wd = mod.canvas.width
                var hd = mod.canvas.width * h / w
            } else {
                var x0 = mod.canvas.width * .5 * (1 - w / h)
                var y0 = 0
                var wd = mod.canvas.height * w / h
                var hd = mod.canvas.height
            }
            var ctx = mod.canvas.getContext("2d")
            ctx.drawImage(mod.img, x0, y0, wd, hd)
            webworker.terminate()
            outputs.image.event()
        })
        var ctx = mod.canvas.getContext("2d")
        ctx.clearRect(0, 0, mod.canvas.width, mod.canvas.height)
        var h = mod.img.height
        var w = mod.img.width
        var ctx = mod.img.getContext("2d")
        var img = ctx.getImageData(0, 0, w, h)
        webworker.postMessage({
            height: img.height,
            width: img.width,
            buffer: img.data.buffer
        }, [img.data.buffer])
    }

    function flip_worker() {
        self.addEventListener('message', function(evt) {
            var h = evt.data.height
            var w = evt.data.width
            var buf = new Uint8ClampedArray(evt.data.buffer)
            // image stored as RGBA array first row 0 of w*4 elements followed by row 1... until row h-1
            var index = 0  // index for the 1D array image
            for (var row = 0; row < h; ++row) {
                for (var col = 0; col < w / 2; ++col) {
                    index = row * w * 4 + col * 4    //  given row,col coordinates it returns its index in the 1D array
                    r_index = row* w * 4 + (w - 1 - col) * 4 // the index where this value should be
                    // Replace RGB values
                    temp_1 = buf[index + 0]   //R
                    temp_2 = buf[index + 1]   //G
                    temp_3 = buf[index + 2]   //B
                    buf[index + 0] = buf[r_index + 0]  //R
                    buf[index + 1] = buf[r_index + 1]  //G
                    buf[index + 2] = buf[r_index + 2]  //B
                    buf[index + 3] = 255  //A
                    buf[r_index + 0] = temp_1  //R
                    buf[r_index + 1] = temp_2  //G
                    buf[r_index + 2] = temp_3  //B  
                    buf[r_index + 3] = 255  //A
                }
            }
            self.postMessage({
                buffer: buf.buffer
            }, [buf.buffer])
        })
    }


    //
    // flip v image
    //
    function flipv_image() {
        var blob = new Blob(['(' + flipv_worker.toString() + '())'])
        var url = window.URL.createObjectURL(blob)
        var webworker = new Worker(url)
        webworker.addEventListener('message', function(evt) {
            window.URL.revokeObjectURL(url)
            var h = mod.img.height
            var w = mod.img.width
            var buf = new Uint8ClampedArray(evt.data.buffer)
            var imgdata = new ImageData(buf, w, h)
            var ctx = mod.img.getContext("2d")
            ctx.putImageData(imgdata, 0, 0)
            if (w > h) {
                var x0 = 0
                var y0 = mod.canvas.height * .5 * (1 - h / w)
                var wd = mod.canvas.width
                var hd = mod.canvas.width * h / w
            } else {
                var x0 = mod.canvas.width * .5 * (1 - w / h)
                var y0 = 0
                var wd = mod.canvas.height * w / h
                var hd = mod.canvas.height
            }
            var ctx = mod.canvas.getContext("2d")
            ctx.drawImage(mod.img, x0, y0, wd, hd)
            webworker.terminate()
            outputs.image.event()
        })
        var ctx = mod.canvas.getContext("2d")
        ctx.clearRect(0, 0, mod.canvas.width, mod.canvas.height)
        var h = mod.img.height
        var w = mod.img.width
        var ctx = mod.img.getContext("2d")
        var img = ctx.getImageData(0, 0, w, h)
        webworker.postMessage({
            height: img.height,
            width: img.width,
            buffer: img.data.buffer
        }, [img.data.buffer])
    }

    function flipv_worker() {
        self.addEventListener('message', function(evt) {
            var h = evt.data.height
            var w = evt.data.width
            var buf = new Uint8ClampedArray(evt.data.buffer)
            var index = 0
            for (var col = 0; col < w; ++col) {
                for (var row = 0; row < h / 2; ++row) {
                    index = row * w * 4 + col * 4
                    r_index = (h - 1 - row) * w * 4 + col * 4
                    temp_1 = buf[index + 0]
                    temp_2 = buf[index + 1]
                    temp_3 = buf[index + 2]
                    buf[index + 0] = buf[r_index + 0]
                    buf[index + 1] = buf[r_index + 1]
                    buf[index + 2] = buf[r_index + 2]
                    buf[r_index + 0] = temp_1
                    buf[r_index + 1] = temp_2
                    buf[r_index + 2] = temp_3
                    buf[index + 3] = 255
                    buf[r_index + 3] = 255
                }
            }
            self.postMessage({
                buffer: buf.buffer
            }, [buf.buffer])
        })
    }

    //
    // rotate image 90 CW by ChatGPT
    //
    function rotate90cw_worker() {
        // by ChatGPT
        self.addEventListener('message', function(evt) {
            var h = evt.data.height;
            var w = evt.data.width;
            var img = new ImageData(new Uint8ClampedArray(evt.data.buffer), w, h);
            var rotated = new ImageData(new Uint8ClampedArray(w * h * 4), h, w);
    
            for (var y = 0; y < h; y++) {
                for (var x = 0; x < w; x++) {
                    var srcPos = (y * w + x) * 4;
                    var destPos = (x * h + (h - y - 1)) * 4;
                    rotated.data[destPos + 0] = img.data[srcPos + 0];
                    rotated.data[destPos + 1] = img.data[srcPos + 1];
                    rotated.data[destPos + 2] = img.data[srcPos + 2];
                    rotated.data[destPos + 3] = img.data[srcPos + 3];
                }
            }
    
            self.postMessage({
                height: rotated.height,
                width: rotated.width,
                buffer: rotated.data.buffer
            }, [rotated.data.buffer]);
        });
    }
    


    function rotate90cw_image() {
        // by ChatGPT
        var blob = new Blob(['(' + rotate90cw_worker.toString() + '())'])
        var url = window.URL.createObjectURL(blob)
        var webworker = new Worker(url)
        webworker.addEventListener('message', function(evt) {
            window.URL.revokeObjectURL(url)
            var h = evt.data.height
            var w = evt.data.width
            var buf = new Uint8ClampedArray(evt.data.buffer)
            var imgdata = new ImageData(buf, w, h)
            var canvas = mod.img
            canvas.width = w
            canvas.height = h
            var ctx = canvas.getContext("2d")
            ctx.putImageData(imgdata, 0, 0)
            if (w > h) {
                var x0 = 0
                var y0 = mod.canvas.height * .5 * (1 - h / w)
                var wd = mod.canvas.width
                var hd = mod.canvas.width * h / w
            } else {
                var x0 = mod.canvas.width * .5 * (1 - w / h)
                var y0 = 0
                var wd = mod.canvas.height * w / h
                var hd = mod.canvas.height
            }
            var ctx = mod.canvas.getContext("2d")
            ctx.clearRect(0, 0, mod.canvas.width, mod.canvas.height)
            ctx.drawImage(canvas, x0, y0, wd, hd)
            webworker.terminate()
            var dpi = parseFloat(mod.dpitext.value)
            mod.pxtext.nodeValue = w + ' x ' + h + ' px'
            mod.mmtext.nodeValue = (25.4 * w / dpi).toFixed(3) +
                ' x ' + (25.4 * h / dpi).toFixed(3) + ' mm'
            mod.intext.nodeValue = (w / dpi).toFixed(3) +
                ' x ' + (h / dpi).toFixed(3) + ' in'
            outputs.image.event()
            outputs.imageInfo.event()
        })
        var canvas = mod.canvas
        var ctx = canvas.getContext("2d")
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        var h = mod.img.height
        var w = mod.img.width
        var ctx = mod.img.getContext("2d")
        var img = ctx.getImageData(0, 0, w, h)
        webworker.postMessage({
            height: img.height,
            width: img.width,
            buffer: img.data.buffer
        }, [img.data.buffer])
    }
         
    //
    // return values
    //
    return ({
        mod: mod,
        name: name,
        description: description,
        init: init,
        inputs: inputs,
        outputs: outputs,
        interface: interface
    })
}())
