//
// set PCB defaults
//
// Neil Gershenfeld
// (c) Massachusetts Institute of Technology 2018
// Modified by Francisco Sanchez Arroyo 2020-2026
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
    var name = 'set PCB defaults'
    var description = 'PCB milling presets with in/mm toggle. Trace profiles (1/64, 10 mil, 60 and 40 degree V-bits), drill (1/32), and cutout (1/32, 1/16).'
    //
    // state
    //
    var unit = 'in'
    var toggle_cb
    var all_presets = []
    var all_vars_divs = []
    //
    // V-bit effective cut width (inches)
    //
    function vbit_width_in(tip_mm, angle, depth_in) {
        return tip_mm / 25.4 + 2 * depth_in * Math.tan(angle * Math.PI / 360)
    }
    //
    // initialization
    //
    var init = function() {
        var div = mod.div
        //
        // unit toggle: in [slider] mm
        //
        var toggle_row = document.createElement('div')
        toggle_row.style.display = 'flex'
        toggle_row.style.alignItems = 'center'
        toggle_row.style.justifyContent = 'center'
        toggle_row.style.gap = '6px'
        toggle_row.style.margin = '4px 0'
        var lbl_in = document.createElement('span')
        lbl_in.textContent = 'in'
        lbl_in.style.fontWeight = 'bold'
        var lbl_mm = document.createElement('span')
        lbl_mm.textContent = 'mm'
        // mini switch (40x22)
        var sw = document.createElement('label')
        sw.style.cssText = 'position:relative;display:inline-block;width:40px;height:22px;margin:0;flex-shrink:0'
        toggle_cb = document.createElement('input')
        toggle_cb.type = 'checkbox'
        toggle_cb.style.cssText = 'opacity:0;width:0;height:0'
        var slider = document.createElement('span')
        slider.style.cssText = 'position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#5B8DEF;border-radius:22px;transition:.3s'
        var knob = document.createElement('span')
        knob.style.cssText = 'position:absolute;content:"";height:16px;width:16px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s'
        slider.appendChild(knob)
        sw.appendChild(toggle_cb)
        sw.appendChild(slider)
        toggle_row.appendChild(lbl_in)
        toggle_row.appendChild(sw)
        toggle_row.appendChild(lbl_mm)
        div.appendChild(toggle_row)
        // store refs for styling
        mod._lbl_in = lbl_in
        mod._lbl_mm = lbl_mm
        mod._slider = slider
        mod._knob = knob
        toggle_cb.addEventListener('change', function() {
            toggle_unit()
        })
        style_toggle()
        //
        // traces
        //
        add_section('Traces')
        add_preset('1/64 flat', '0.40mm flat', 'flat', {
            dia_in: 0.0156, depth_in: 0.004, max_in: 0.004,
            offsets: 4, stepover: 0.5, speed: 4
        })
        add_preset('10 mil flat', '0.25mm flat', 'flat', {
            dia_in: 0.010, depth_in: 0.004, max_in: 0.004,
            offsets: 4, stepover: 0.5, speed: 2
        })
        add_preset('60\u00b0 #501 V-bit', '60\u00b0 #501 V-bit', 'vbit', {
            tip_mm: 0.254, angle: 60, depth_in: 0.004, max_in: 0.004,
            offsets: 4, stepover: 0.5, speed: 4
        })
        add_preset('40\u00b0 #502 V-bit', '40\u00b0 #502 V-bit', 'vbit', {
            tip_mm: 0.127, angle: 40, depth_in: 0.004, max_in: 0.004,
            offsets: 4, stepover: 0.5, speed: 4
        })
        //
        // drill
        //
        add_section('Drill')
        add_preset('1/32 drill', '0.79mm drill', 'flat', {
            dia_in: 0.0312, depth_in: 0.010, max_in: 0.067,
            offsets: 1, speed: 4
        })
        //
        // cutout
        //
        add_section('Cutout')
        add_preset('1/32 cutout', '0.79mm cutout', 'flat', {
            dia_in: 0.0312, depth_in: 0.024, max_in: 0.072,
            offsets: 1, speed: 4
        })
        add_preset('1/16 cutout', '1.59mm cutout', 'flat', {
            dia_in: 0.0625, depth_in: 0.010, max_in: 0.067,
            offsets: 1, speed: 4
        })
        //
        // lock width to expanded size
        //
        all_vars_divs.forEach(function(d) { d.style.display = 'block' })
        var w = div.offsetWidth
        all_vars_divs.forEach(function(d) { d.style.display = 'none' })
        div.style.minWidth = w + 'px'
    }
    //
    // inputs
    //
    var inputs = {}
    //
    // outputs
    //
    var outputs = {
        settings: {
            type: '',
            event: function(vars) {
                mods.output(mod, 'settings', vars)
            }
        }
    }
    //
    // interface
    //
    var interface = function(div) {
        mod.div = div
    }
    //
    // local functions
    //
    function add_section(label) {
        var hr = document.createElement('hr')
        hr.style.border = '0'
        hr.style.height = '1px'
        hr.style.background = '#888'
        hr.style.margin = '6px 0 2px 0'
        mod.div.appendChild(hr)
        var text = document.createElement('div')
        text.style.fontSize = '11px'
        text.style.color = '#888'
        text.style.textAlign = 'center'
        text.style.margin = '0 0 4px 0'
        text.textContent = label
        mod.div.appendChild(text)
    }

    function add_preset(label_in, label_mm, type, data) {
        var preset = {vars: []}
        //
        // row: button + disclosure arrow
        //
        var row = document.createElement('div')
        row.style.display = 'flex'
        row.style.alignItems = 'center'
        row.style.margin = '1px 0'
        //
        // button
        //
        var btn = document.createElement('button')
        btn.style.padding = mods.ui.padding
        btn.style.margin = 0
        btn.style.flex = '1'
        btn.style.textAlign = 'left'
        var span = document.createElement('span')
        var btn_text = document.createTextNode(label_in)
        span.appendChild(btn_text)
        btn.appendChild(span)
        preset.btn_span = span
        preset.btn_text = btn_text
        preset.label_in = label_in
        preset.label_mm = label_mm
        btn.addEventListener('click', function() {
            all_presets.forEach(function(p) {
                p.btn_span.style.fontWeight = 'normal'
            })
            span.style.fontWeight = 'bold'
            var vars = {}
            preset.vars.forEach(function(v) {
                var key = unit === 'mm' ? v.key_mm : v.key_in
                if (key) vars[key] = v.has_unit ? v.input._full : v.input.value
            })
            vars['tool type'] = type === 'vbit' ? 'vbit' : 'flat'
            if (type === 'vbit') {
                preset.vars.forEach(function(v) {
                    if (v.id === 'angle') vars['tool angle'] = v.input.value
                    if (v.id === 'tip_dia') vars['tool tip diameter (mm)'] = unit === 'mm' ? v.input._full : v.input._full * 25.4
                })
            }
            outputs.settings.event(vars)
        })
        row.appendChild(btn)
        //
        // disclosure arrow
        //
        var vars_div = document.createElement('div')
        vars_div.style.display = 'none'
        all_vars_divs.push(vars_div)
        var arrow = document.createElement('span')
        arrow.style.cursor = 'pointer'
        arrow.style.padding = '2px 0 2px 8px'
        arrow.style.fontSize = '10px'
        arrow.style.color = '#888'
        arrow.style.userSelect = 'none'
        arrow.textContent = '\u25b8'
        arrow.addEventListener('click', function() {
            if (vars_div.style.display === 'none') {
                vars_div.style.display = 'block'
                arrow.textContent = '\u25be'
            } else {
                vars_div.style.display = 'none'
                arrow.textContent = '\u25b8'
            }
        })
        row.appendChild(arrow)
        mod.div.appendChild(row)
        //
        // variables
        //
        var dia_in = type === 'vbit'
            ? vbit_width_in(data.tip_mm, data.angle, data.depth_in)
            : data.dia_in
        var dia_label = type === 'vbit' ? 'eff. width' : 'diameter'
        add_var(vars_div, preset, 'diameter', dia_label, dia_in, true)
        add_var(vars_div, preset, 'cut_depth', 'cut depth', data.depth_in, true)
        add_var(vars_div, preset, 'max_depth', 'max depth', data.max_in, true)
        add_var(vars_div, preset, 'offsets', 'offsets', data.offsets, false)
        if (data.stepover !== undefined) {
            add_var(vars_div, preset, 'stepover', 'stepover', data.stepover, false)
        }
        add_var(vars_div, preset, 'speed', 'speed (mm/s)', data.speed, false)
        if (type === 'vbit') {
            add_var(vars_div, preset, 'angle', 'angle (\u00b0)', data.angle, false)
            add_var(vars_div, preset, 'tip_dia', 'tip dia', data.tip_mm / 25.4, true)
        }
        mod.div.appendChild(vars_div)
        all_presets.push(preset)
    }

    function add_var(container, preset, id, base_label, value, has_unit) {
        var row = document.createElement('div')
        row.style.display = 'flex'
        row.style.alignItems = 'center'
        row.style.marginBottom = '1px'
        //
        // label
        //
        var lbl = document.createElement('span')
        lbl.style.flex = '1'
        lbl.style.textAlign = 'right'
        lbl.style.paddingRight = '4px'
        lbl.style.whiteSpace = 'nowrap'
        var label_in = has_unit ? base_label + ' (in)' : base_label
        var label_mm = has_unit ? base_label + ' (mm)' : base_label
        var label_node = document.createTextNode(label_in + ':')
        lbl.appendChild(label_node)
        row.appendChild(lbl)
        //
        // input
        //
        var input = document.createElement('input')
        input.type = 'text'
        input.size = 6
        if (has_unit) {
            input._full = value
            input.value = value.toFixed(4)
            input.addEventListener('input', function() {
                input._full = parseFloat(input.value)
            })
        } else {
            input.value = value
        }
        row.appendChild(input)
        container.appendChild(row)
        //
        // output key mapping
        //
        var key_in = null, key_mm = null
        switch (id) {
            case 'diameter':
                key_in = 'tool diameter (in)'
                key_mm = 'tool diameter (mm)'
                break
            case 'cut_depth':
                key_in = 'cut depth (in)'
                key_mm = 'cut depth (mm)'
                break
            case 'max_depth':
                key_in = 'max depth (in)'
                key_mm = 'max depth (mm)'
                break
            case 'offsets':
                key_in = 'offset number'
                key_mm = 'offset number'
                break
            case 'stepover':
                key_in = 'offset stepover'
                key_mm = 'offset stepover'
                break
            case 'speed':
                key_in = 'speed (mm/s)'
                key_mm = 'speed (mm/s)'
                break
        }
        preset.vars.push({
            id: id,
            label_node: label_node,
            input: input,
            has_unit: has_unit,
            label_in: label_in,
            label_mm: label_mm,
            key_in: key_in,
            key_mm: key_mm
        })
    }

    function style_toggle() {
        var is_mm = (unit === 'mm')
        mod._slider.style.background = is_mm ? '#4CAF50' : '#5B8DEF'
        mod._knob.style.transform = is_mm ? 'translateX(18px)' : 'translateX(0)'
        mod._lbl_in.style.fontWeight = is_mm ? 'normal' : 'bold'
        mod._lbl_mm.style.fontWeight = is_mm ? 'bold' : 'normal'
    }

    function toggle_unit() {
        unit = (unit === 'in') ? 'mm' : 'in'
        style_toggle()
        all_presets.forEach(function(preset) {
            preset.btn_text.nodeValue = unit === 'mm'
                ? preset.label_mm : preset.label_in
            preset.vars.forEach(function(v) {
                if (v.has_unit) {
                    if (unit === 'mm') {
                        v.input._full = v.input._full * 25.4
                    } else {
                        v.input._full = v.input._full / 25.4
                    }
                    v.input.value = v.input._full.toFixed(4)
                }
                v.label_node.nodeValue = (unit === 'mm' ? v.label_mm : v.label_in) + ':'
            })
        })
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
