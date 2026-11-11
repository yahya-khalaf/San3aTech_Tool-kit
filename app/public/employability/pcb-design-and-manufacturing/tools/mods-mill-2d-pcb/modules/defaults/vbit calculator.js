//
// V-bit calculator
//
// Neil Gershenfeld
// (c) Massachusetts Institute of Technology 2018
// Modified by Francisco Sanchez Arroyo 2022-2026
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
    var name = 'V-bit calculator'
    var description = 'Calculates cut depth and width for V-shaped engraving bits given tip diameter and angle. Includes a D3.js diagram and outputs milling settings.'
    //
    // state
    //
    var unit = 'mm'
    //
    // initialization
    //
    var init = function() {
        unit = 'mm'
        mod.unit_toggle.checked = true
        style_toggle()
        set_field(mod.tip_dia, 0.1)
        mod.angle.value = 30
        set_field(mod.cut_depth, 0.1016)
        recalc_width()
        mod.offset_number.value = 4
        mod.offset_stepover.value = 0.5
        mod.speed.value = 4
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
        //
        // load d3.js
        //
        if (typeof d3 !== 'undefined') {
            setTimeout(draw, 0)
        } else {
            var existing = document.querySelector('script[src="js/d3.js/d3.min.js"]')
            if (existing) {
                existing.addEventListener('load', draw)
            } else {
                var script = document.createElement('script')
                script.type = 'text/javascript'
                script.onload = draw
                script.src = 'js/d3.js/d3.min.js'
                document.head.appendChild(script)
            }
        }
        //
        // send settings
        //
        var btn = document.createElement('button')
        btn.style.padding = mods.ui.padding
        btn.style.margin = 1
        btn.style.width = '100%'
        var span = document.createElement('span')
        span.appendChild(document.createTextNode('send calculated settings'))
        btn.appendChild(span)
        btn.addEventListener('click', send_settings)
        div.appendChild(btn)
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
        var sw = document.createElement('label')
        sw.style.cssText = 'position:relative;display:inline-block;width:40px;height:22px;margin:0;flex-shrink:0'
        var cb = document.createElement('input')
        cb.type = 'checkbox'
        cb.style.cssText = 'opacity:0;width:0;height:0'
        var slider = document.createElement('span')
        slider.style.cssText = 'position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#5B8DEF;border-radius:22px;transition:.3s'
        var knob = document.createElement('span')
        knob.style.cssText = 'position:absolute;height:16px;width:16px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s'
        slider.appendChild(knob)
        sw.appendChild(cb)
        sw.appendChild(slider)
        toggle_row.appendChild(lbl_in)
        toggle_row.appendChild(sw)
        toggle_row.appendChild(lbl_mm)
        div.appendChild(toggle_row)
        mod._lbl_in = lbl_in
        mod._lbl_mm = lbl_mm
        mod._slider = slider
        mod._knob = knob
        mod.unit_toggle = cb
        cb.addEventListener('change', toggle_unit)
        // sync unit from checkbox on param restore
        cb.addEventListener('input', function() {
            unit = cb.checked ? 'mm' : 'in'
            style_toggle()
            display_all()
        })
        //
        // V-bit parameters
        //
        div.appendChild(document.createElement('hr'))
        div.appendChild(document.createTextNode('V-bit parameters:'))
        div.appendChild(document.createElement('br'))
        mod.tip_dia = add_field(div, 'tip diameter', true, function() {
            recalc_width()
        })
        mod.angle = add_field(div, 'angle (\u00b0)', false, function() {
            recalc_width()
        })
        //
        // Milling parameters
        //
        div.appendChild(document.createElement('hr'))
        div.appendChild(document.createTextNode('Milling parameters:'))
        div.appendChild(document.createElement('br'))
        mod.offset_number = add_field(div, 'offsets', false)
        mod.offset_stepover = add_field(div, 'stepover', false)
        mod.speed = add_field(div, 'speed (mm/s)', false)
        //
        // Calculator
        //
        div.appendChild(document.createElement('hr'))
        div.appendChild(document.createTextNode('Calculator:'))
        div.appendChild(document.createElement('br'))
        mod.cut_width = add_field(div, 'cut width', true, function() {
            recalc_depth()
        })
        mod.cut_depth = add_field(div, 'cut depth', true, function() {
            recalc_width()
        })
        //
        // D3 diagram
        //
        function draw() {
            var data = [{x: 35, y: 10}, {x: 35, y: 30}, {x: 70, y: 110}, {x: 80, y: 110}, {x: 115, y: 30}, {x: 115, y: 10}]
            var data2 = [{x: -5, y: 200}, {x: -5, y: 160}, {x: 59, y: 160}, {x: 70, y: 185}, {x: 80, y: 185}, {x: 91, y: 160}, {x: 175, y: 160}, {x: 175, y: 200}]
            var data3 = [{x: 39, y: 160}, {x: 50, y: 185}, {x: 60, y: 185}, {x: 71, y: 160}]
            var div2 = document.createElement('div')
            div2.id = mod.div.id + 'd3svg'
            div.appendChild(div2)
            var svg = d3.select('#' + CSS.escape(mod.div.id + 'd3svg'))
                .append('svg')
                .attr('width', 160)
                .attr('height', 195)
            var lineFunc = d3.line()
                .x(function(d) { return d.x })
                .y(function(d) { return d.y })
            svg.append('path')
                .attr('d', lineFunc(data))
                .attr('stroke', 'black')
                .attr('stroke-width', 2)
                .attr('fill', 'lightgray')
            svg.append('path')
                .attr('d', lineFunc(data2))
                .attr('stroke', 'black')
                .attr('stroke-width', 2)
                .attr('fill', 'tan')
            svg.append('path')
                .attr('d', lineFunc(data3))
                .attr('stroke', 'red')
                .attr('stroke-width', 2)
                .attr('fill', 'none')
            svg.append('text').attr('x', 35).attr('y', 125).text('tip diameter')
            svg.append('text').attr('x', 57).attr('y', 60).text('angle')
            svg.append('text').attr('x', 90).attr('y', 180).text('cut depth')
            svg.append('text').attr('x', 5).attr('y', 150).attr('fill', 'red').text('stepover')
            svg.append('text').attr('x', 72).attr('y', 150).text('cut width')
            mods.fit(mod.div)
        }
    }
    //
    // local functions
    //
    // all unit-sensitive fields store _full in mm
    //
    var unit_fields = []

    function add_field(container, base_label, has_unit, on_input) {
        var row = document.createElement('div')
        row.style.display = 'flex'
        row.style.alignItems = 'center'
        row.style.marginBottom = '1px'
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
        var input = document.createElement('input')
        input.type = 'text'
        input.size = 6
        row.appendChild(input)
        container.appendChild(row)
        if (has_unit) {
            input._full = 0
            input.addEventListener('input', function() {
                if (unit === 'mm') {
                    input._full = parseFloat(input.value)
                } else {
                    input._full = parseFloat(input.value) * 25.4
                }
                if (on_input) on_input()
            })
            unit_fields.push({
                input: input,
                label_node: label_node,
                label_in: label_in,
                label_mm: label_mm
            })
        } else if (on_input) {
            input.addEventListener('input', function() { on_input() })
        }
        return input
    }

    function set_field(input, mm_val) {
        input._full = mm_val
        display_field(input)
    }

    function display_field(input) {
        if (unit === 'mm') {
            input.value = input._full.toFixed(4)
        } else {
            input.value = (input._full / 25.4).toFixed(4)
        }
    }

    function display_all() {
        unit_fields.forEach(function(f) {
            display_field(f.input)
            f.label_node.nodeValue = (unit === 'mm' ? f.label_mm : f.label_in) + ':'
        })
    }

    function get_half_tan() {
        return Math.tan(parseFloat(mod.angle.value) * Math.PI / 360)
    }

    function recalc_width() {
        var tip_mm = mod.tip_dia._full
        var depth_mm = mod.cut_depth._full
        var width_mm = tip_mm + 2 * depth_mm * get_half_tan()
        set_field(mod.cut_width, width_mm)
    }

    function recalc_depth() {
        var tip_mm = mod.tip_dia._full
        var width_mm = mod.cut_width._full
        var depth_mm = (width_mm - tip_mm) / (2 * get_half_tan())
        set_field(mod.cut_depth, depth_mm)
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
        display_all()
    }

    function send_settings() {
        var dia_key = unit === 'mm' ? 'tool diameter (mm)' : 'tool diameter (in)'
        var depth_key = unit === 'mm' ? 'cut depth (mm)' : 'cut depth (in)'
        var max_key = unit === 'mm' ? 'max depth (mm)' : 'max depth (in)'
        var dia_val = unit === 'mm' ? mod.cut_width._full : mod.cut_width._full / 25.4
        var depth_val = unit === 'mm' ? mod.cut_depth._full : mod.cut_depth._full / 25.4
        var vars = {}
        vars[dia_key] = dia_val
        vars[depth_key] = depth_val
        vars[max_key] = depth_val
        vars['offset number'] = mod.offset_number.value
        vars['offset stepover'] = mod.offset_stepover.value
        vars['speed (mm/s)'] = mod.speed.value
        vars['tool type'] = 'vbit'
        vars['tool angle'] = mod.angle.value
        vars['tool tip diameter (mm)'] = mod.tip_dia._full
        outputs.settings.event(vars)
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
