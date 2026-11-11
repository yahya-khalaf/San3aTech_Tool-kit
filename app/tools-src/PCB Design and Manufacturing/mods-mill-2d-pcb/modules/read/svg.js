//
// read SVG
//
// Neil Gershenfeld
// (c) Massachusetts Institute of Technology 2016
//
// This work may be reproduced, modified, distributed, performed, and
// displayed for any purpose, but must acknowledge the mods
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
    var name = 'read SVG'
    var description = 'Reads SVG files with unit detection (px, mm, cm, in) and viewBox parsing. Supports file input and postMessage from SvgPcb.'
    //
    // initialization
    //
    var init = function() {
        // listen for postMessage from external apps (e.g. SvgPcb)
        // accepts {type: 'svg', data: svgString} or raw SVG string
        window.addEventListener('message', function(e) {
            var data = e.data
            if (!data) return
            // support typed wrapper for explicit targeting
            if (data && data.type === 'svg') data = data.data
            // only accept strings that look like SVG
            if (typeof data !== 'string' || data.indexOf('<svg') === -1) return
            // notify sender that we received the message
            if (e.source) e.source.postMessage('ready', e.origin)
            svg_load_handler({target: {result: data}})
        })
    }
    //
    // inputs
    //
    var inputs = {
        SVG: {
            type: 'string',
            event: function(evt) {
                svg_load_handler({
                    target: {
                        result: evt.detail
                    }
                })
            }
        }
    }
    //
    // outputs
    //
    var outputs = {
        SVG: {
            type: 'string',
            event: function() {
                mods.output(mod, 'SVG', mod.str)
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
        file.setAttribute('accept', '.svg')
        file.setAttribute('id', div.id + 'file_input')
        file.style.position = 'absolute'
        file.style.left = 0
        file.style.top = 0
        file.style.width = 0
        file.style.height = 0
        file.style.opacity = 0
        file.addEventListener('change', function() {
            svg_read_handler()
        })
        div.appendChild(file)
        mod.file = file
        //
        // on-screen drawing canvas
        //
        var canvas = document.createElement('canvas')
        canvas.width = mods.ui.canvas
        canvas.height = mods.ui.canvas
        canvas.style.backgroundColor = 'rgb(255,255,255)'
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
                svg_read_handler()
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
        btn.appendChild(document.createTextNode('select SVG file'))
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
            input.placeholder = 'examples/file.svg'
            div.appendChild(input)
            mod.src = input
            input.addEventListener('change', function() {
                if (mod.src.value) load_from_url(mod.src.value)
            })
            input.addEventListener('input', function() {
                if (mod.src.value && mod.src.value.endsWith('.svg'))
                    load_from_url(mod.src.value)
            })
        div.appendChild(document.createElement('br'))
        //
        // pull from SvgPcb button
        //
        var btn = document.createElement('button')
        btn.style.padding = mods.ui.padding
        btn.style.margin = 1
        btn.appendChild(document.createTextNode('Pull from SvgPcb'))
        btn.addEventListener('click', function() {
            console.log("pull...");
        })
        div.appendChild(btn)
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
        div.appendChild(document.createElement('br'))
        //
        // info div
        //
        var info = document.createElement('div')
        info.setAttribute('id', div.id + 'info')
        var text = document.createTextNode('file:')
        info.appendChild(text)
        mod.name = text
        info.appendChild(document.createElement('br'))
        var text = document.createTextNode('width:')
        info.appendChild(text)
        mod.width = text
        info.appendChild(document.createElement('br'))
        var text = document.createTextNode('height:')
        info.appendChild(text)
        mod.height = text
        info.appendChild(document.createElement('br'))
        var text = document.createTextNode('units per inch:')
        info.appendChild(text)
        mod.units = text
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
    // read handler
    //
    function load_from_url(url) {
        fetch(url).then(function(r) {
            if (!r.ok) { set_prompt('error: could not fetch ' + url); return }
            return r.text()
        }).then(function(text) {
            if (!text) return
            mod.name.nodeValue = 'file: ' + url.split('/').pop()
            svg_load_handler({target: {result: text}})
        })
    }

    function svg_read_handler(event) {
        //
        // read as text
        //
        var input_file = mod.file.files[0]
        var file_name = input_file.name
        if (!file_name.toLowerCase().endsWith('.svg')) {
            set_prompt("error: not an SVG file")
            return
        }
        mod.name.nodeValue = "file: " + file_name
        var file_reader = new FileReader()
        file_reader.onload = svg_load_handler
        file_reader.readAsText(input_file)
    }
    //
    // load handler
    //
    function svg_load_handler(event) {
        mod.str = event.target.result
        //
        // validate SVG content
        //
        if (mod.str.indexOf('<svg') == -1) {
            set_prompt("error: SVG content not found")
            return
        }
        //
        // parse size
        //
        var i = mod.str.indexOf("width")
        if (i == -1) {
	    // get from viewbox instead
	    i = mod.str.indexOf("viewBox")
	    var i1 = mod.str.indexOf("\"", i + 1) // get the next " after viewbox, ex: viewBox="0 0 300 300"
	    var i2 = mod.str.indexOf("\ ", i1 + 1)
            var i3 = mod.str.indexOf("\ ", i2 + 1)
	    var i4 = mod.str.indexOf("\ ", i3 + 1)
            var i5 = mod.str.indexOf("\"", i4 + 1)
	    var width = mod.str.substring(i3 + 1, i4)
            var height = mod.str.substring(i4 + 1, i5)
	    var units = 90
            mod.width.nodeValue = "width: " + width
            mod.height.nodeValue = "height: " + height
	    mod.units.nodeValue = "units per inch: " + units
        } else {
            var i1 = mod.str.indexOf("\"", i + 1)
            var i2 = mod.str.indexOf("\"", i1 + 1)
            var width = mod.str.substring(i1 + 1, i2)
            i = mod.str.indexOf("height")
            i1 = mod.str.indexOf("\"", i + 1)
            i2 = mod.str.indexOf("\"", i1 + 1)
            var height = mod.str.substring(i1 + 1, i2)
            ih = mod.str.indexOf("height")
            if (width.indexOf("px") != -1) {
                width = width.slice(0, -2)
                height = height.slice(0, -2)
                var units = 90
            } else if (width.indexOf("mm") != -1) {
                width = width.slice(0, -2)
                height = height.slice(0, -2)
                var units = 25.4
            } else if (width.indexOf("cm") != -1) {
                width = width.slice(0, -2)
                height = height.slice(0, -2)
                var units = 2.54
            } else if (width.indexOf("in") != -1) {
                width = width.slice(0, -2)
                height = height.slice(0, -2)
                var units = 1
            } else {
                var units = 90
            }
            mod.width.nodeValue = "width: " + width
            mod.height.nodeValue = "height: " + height
            mod.units.nodeValue = "units per inch: " + units
        }
        //
        // display
        //
        var img = new Image()
        var src = "data:image/svg+xml;base64," + window.btoa(mod.str)
        img.setAttribute("src", src)
	img.setAttribute("width", width)
        img.setAttribute("height", height)

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
            var ctx = mod.canvas.getContext("2d")
            ctx.clearRect(0, 0, mod.canvas.width, mod.canvas.height)
            ctx.drawImage(img, x0, y0, w, h)
            var ctx = mod.img.getContext("2d")
	    //console.log(ctx)
            ctx.canvas.width = img.width
            ctx.canvas.height = img.height
            ctx.drawImage(img, 0, 0)
            outputs.SVG.event()
        }
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
