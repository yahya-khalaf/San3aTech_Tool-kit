//
// simulate toolpath
//
// Francisco Sanchez Arroyo 2026
//
// CNC material-removal simulation using voxel carving and marching cubes.
// Supports flat, ball-nose, and V-bit tools with PCB, wax, wood, and aluminum materials.
// Web Worker progressive rendering with section plane cross-section view.
//
// This work may be reproduced, modified, distributed, performed, and
// displayed for any purpose, but must acknowledge the mods
// project. Copyright is retained and must be preserved. The work is
// provided as is; no warranty is provided, and users accept all
// liability.
//
// closure
//
(function(){
   //
   // module globals
   //
   var mod = {}
   var sim_unit = 'mm'
   var sim_fields = []
   var toggle_cb
   //
   // name
   //
   var name = 'simulate toolpath'
   var description = "3D CNC material-removal simulation with flat, ball-nose, and V-bit tools. Supports PCB, wax, wood, plywood, and aluminum materials with progressive Web Worker rendering, toolpath overlay, and section plane cross-section view."
   //
   // initialization
   //
   var init = function() {
      }
   //
   // inputs
   //
   var inputs = {
      toolpath:{type:'object',
         event:function(evt){
            mod.path = evt.detail.path
            mod.name = evt.detail.name
            mod.dpi = evt.detail.dpi
            mod.width = evt.detail.width
            mod.height = evt.detail.height
            mod.depth = evt.detail.depth
            if (evt.detail.tool_dia != undefined) {
               mod.tool_dia_input._full = evt.detail.tool_dia
               set_field_display(mod.tool_dia_input, 4)
               }
            //
            // auto-fill stock X/Y/Z from image dimensions
            //
            if (evt.detail.width && evt.detail.dpi) {
               mod.stock_x_input._full = evt.detail.width * 25.4 / evt.detail.dpi
               set_field_display(mod.stock_x_input, 3)
               }
            if (evt.detail.height && evt.detail.dpi) {
               mod.stock_y_input._full = evt.detail.height * 25.4 / evt.detail.dpi
               set_field_display(mod.stock_y_input, 3)
               }
            if (evt.detail.depth && evt.detail.dpi) {
               var toolpath_z = evt.detail.depth * 25.4 / evt.detail.dpi
               var current_z = mod.stock_z_input._full || 0
               var final_z = Math.max(toolpath_z, current_z)
               mod.stock_z_input._full = final_z
               set_field_display(mod.stock_z_input, 3)
               }
            //
            // auto-fill tool type from event
            //
            if (evt.detail.tool_type != undefined) {
               mod.tool_type_select.value = evt.detail.tool_type
               var isVbit = evt.detail.tool_type === 'vbit'
               mod.tool_angle_row.style.display = isVbit ? '' : 'none'
               mod.tool_tip_row.style.display = isVbit ? '' : 'none'
               }
            if (evt.detail.tool_angle != undefined) {
               mod.tool_angle_input.value = evt.detail.tool_angle
               }
            if (evt.detail.tool_tip_dia != undefined) {
               mod.tool_tip_input._full = evt.detail.tool_tip_dia
               set_field_display(mod.tool_tip_input, 4)
               }
            show_path_info()
            show_simulation()
            outputs.toolpath.event()
            }}}
   //
   // outputs
   //
   var outputs = {
      toolpath:{type:'object',
         event:function(){
            var cmd = {}
            cmd.path = mod.path
            cmd.name = mod.name
            cmd.dpi = mod.dpi
            cmd.width = mod.width
            cmd.height = mod.height
            cmd.depth = mod.depth
            mods.output(mod,'toolpath',cmd)
            }}}
   //
   // interface
   //
   var interface = function(div){
      mod.div = div
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
      var lbl_mm = document.createElement('span')
         lbl_mm.textContent = 'mm'
         lbl_mm.style.fontWeight = 'bold'
      var sw = document.createElement('label')
         sw.style.cssText = 'position:relative;display:inline-block;width:40px;height:22px;margin:0;flex-shrink:0'
      toggle_cb = document.createElement('input')
         toggle_cb.type = 'checkbox'
         toggle_cb.checked = true
         toggle_cb.style.cssText = 'opacity:0;width:0;height:0'
      var slider = document.createElement('span')
         slider.style.cssText = 'position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#4CAF50;border-radius:22px;transition:.3s'
      var knob = document.createElement('span')
         knob.style.cssText = 'position:absolute;content:"";height:16px;width:16px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;transform:translateX(18px)'
      slider.appendChild(knob)
      sw.appendChild(toggle_cb)
      sw.appendChild(slider)
      toggle_row.appendChild(lbl_in)
      toggle_row.appendChild(sw)
      toggle_row.appendChild(lbl_mm)
      div.appendChild(toggle_row)
      toggle_cb.addEventListener('change', function() {
         sim_unit = toggle_cb.checked ? 'mm' : 'in'
         slider.style.background = toggle_cb.checked ? '#4CAF50' : '#5B8DEF'
         knob.style.transform = toggle_cb.checked ? 'translateX(18px)' : 'translateX(0)'
         lbl_mm.style.fontWeight = toggle_cb.checked ? 'bold' : 'normal'
         lbl_in.style.fontWeight = toggle_cb.checked ? 'normal' : 'bold'
         sim_fields.forEach(function(f) {
            if (sim_unit === 'mm') {
               f.input.value = f.input._full.toFixed(f.decimals)
               f.label_node.nodeValue = f.base_label + ' (mm): '
            } else {
               f.input.value = (f.input._full / 25.4).toFixed(f.decimals)
               f.label_node.nodeValue = f.base_label + ' (in): '
            }
         })
         show_path_info()
         mods.fit(mod.div)
         })
      //
      // toggled field helper — shows mm or in based on toggle
      //
      function add_toggled_field(div, base_label, mm_val, mm_key, decimals) {
         var label_node = document.createTextNode(base_label + ' (mm): ')
         div.appendChild(label_node)
         var input = document.createElement('input')
            input.type = 'text'
            input.size = 8
            input._full = parseFloat(mm_val)
            input.value = parseFloat(mm_val).toFixed(decimals)
            div.appendChild(input)
            mod[mm_key] = input
         div.appendChild(document.createElement('br'))
         input.addEventListener('input', function() {
            var v = parseFloat(input.value)
            if (!isNaN(v)) {
               input._full = sim_unit === 'mm' ? v : v * 25.4
            }
            })
         sim_fields.push({
            input: input, label_node: label_node,
            base_label: base_label, decimals: decimals
            })
         }
      //
      // stock X
      //
      add_toggled_field(div, 'stock X', '100', 'stock_x_input', 3)
      //
      // stock Y
      //
      add_toggled_field(div, 'stock Y', '80', 'stock_y_input', 3)
      //
      // stock Z
      //
      add_toggled_field(div, 'stock Z', '1.6', 'stock_z_input', 3)
      //
      // tool diameter
      //
      add_toggled_field(div, 'tool dia', '0.4', 'tool_dia_input', 4)
      div.appendChild(document.createElement('br'))
      //
      // tool type
      //
      div.appendChild(document.createTextNode('tool type: '))
      var select = document.createElement('select')
         var options = ['flat','ball','vbit']
         for (var i = 0; i < options.length; i++) {
            var opt = document.createElement('option')
            opt.value = options[i]
            opt.textContent = options[i]
            select.appendChild(opt)
            }
         select.addEventListener('input', function() {
            mod.tool_angle_row.style.display = select.value === 'vbit' ? '' : 'none'
            mod.tool_tip_row.style.display = select.value === 'vbit' ? '' : 'none'
            mods.fit(mod.div)
            })
         div.appendChild(select)
         mod.tool_type_select = select
      div.appendChild(document.createElement('br'))
      //
      // tool angle (vbit only)
      //
      var angleRow = document.createElement('span')
         angleRow.style.display = 'none'
         angleRow.appendChild(document.createTextNode('tool angle (\u00b0): '))
         var input = document.createElement('input')
            input.type = 'text'
            input.size = 6
            input.value = '30'
            angleRow.appendChild(input)
            mod.tool_angle_input = input
         angleRow.appendChild(document.createElement('br'))
         div.appendChild(angleRow)
         mod.tool_angle_row = angleRow
      //
      // tool tip diameter (vbit only)
      //
      var tipRow = document.createElement('span')
         tipRow.style.display = 'none'
         var tip_label_node = document.createTextNode('tool tip (mm): ')
         tipRow.appendChild(tip_label_node)
         var tipInput = document.createElement('input')
            tipInput.type = 'text'
            tipInput.size = 8
            tipInput._full = 0.1
            tipInput.value = '0.1000'
            tipRow.appendChild(tipInput)
            mod.tool_tip_input = tipInput
         tipInput.addEventListener('input', function() {
            var v = parseFloat(tipInput.value)
            if (!isNaN(v)) {
               tipInput._full = sim_unit === 'mm' ? v : v * 25.4
            }
            })
         sim_fields.push({
            input: tipInput, label_node: tip_label_node,
            base_label: 'tool tip', decimals: 4
            })
         tipRow.appendChild(document.createElement('br'))
         div.appendChild(tipRow)
         mod.tool_tip_row = tipRow
      //
      // material
      //
      div.appendChild(document.createTextNode('material: '))
      var matSelect = document.createElement('select')
         var materials = ['PCB','Wax','Wood','Plywood','Aluminum']
         for (var i = 0; i < materials.length; i++) {
            var opt = document.createElement('option')
            opt.value = materials[i]
            opt.textContent = materials[i]
            matSelect.appendChild(opt)
            }
         div.appendChild(matSelect)
         mod.material_select = matSelect
      div.appendChild(document.createElement('br'))
      //
      // info
      //
      var text = document.createTextNode('name: ')
         div.appendChild(text)
         mod.nametext = text
      div.appendChild(document.createElement('br'))
      var text = document.createTextNode('')
         div.appendChild(text)
         mod.sizetext = text
      //
      // view button
      //
      div.appendChild(document.createElement('br'))
      var btn = document.createElement('button')
         btn.style.padding = mods.ui.padding
         btn.style.margin = 1
         var span = document.createElement('span')
            var text = document.createTextNode('view')
               span.appendChild(text)
            btn.appendChild(span)
         btn.addEventListener('click',function(){
            open_view_window()
            })
         div.appendChild(btn)
      }
   //
   // local functions
   //
   // set_field_display — updates input.value from _full based on current unit
   //
   function set_field_display(input, decimals) {
      if (sim_unit === 'mm')
         input.value = input._full.toFixed(decimals)
      else
         input.value = (input._full / 25.4).toFixed(decimals)
      }
   //
   // show_path_info
   //
   function show_path_info() {
      mod.nametext.nodeValue = 'name: '+mod.name
      if (!mod.width || !mod.dpi) return
      var is_mm = toggle_cb.checked
      var factor = is_mm ? 25.4 / mod.dpi : 1 / mod.dpi
      var u = is_mm ? 'mm' : 'in'
      var w = (mod.width * factor).toFixed(3)
      var h = (mod.height * factor).toFixed(3)
      if (mod.depth == undefined)
         mod.sizetext.nodeValue = w+' x '+h+' ('+u+')'
      else {
         var d = (mod.depth * factor).toFixed(3)
         mod.sizetext.nodeValue = w+' x '+h+' x '+d+' ('+u+')'
         }
      mods.fit(mod.div)
      }
   //
   // simulation worker (self-contained, runs in Web Worker)
   //
   function simulation_worker() {
      //
      // marching cubes tables (Paul Bourke)
      //
      var MC_EDGE_TABLE = [
         0x0,0x109,0x203,0x30a,0x406,0x50f,0x605,0x70c,
         0x80c,0x905,0xa0f,0xb06,0xc0a,0xd03,0xe09,0xf00,
         0x190,0x99,0x393,0x29a,0x596,0x49f,0x795,0x69c,
         0x99c,0x895,0xb9f,0xa96,0xd9a,0xc93,0xf99,0xe90,
         0x230,0x339,0x33,0x13a,0x636,0x73f,0x435,0x53c,
         0xa3c,0xb35,0x83f,0x936,0xe3a,0xf33,0xc39,0xd30,
         0x3a0,0x2a9,0x1a3,0xaa,0x7a6,0x6af,0x5a5,0x4ac,
         0xbac,0xaa5,0x9af,0x8a6,0xfaa,0xea3,0xda9,0xca0,
         0x460,0x569,0x663,0x76a,0x66,0x16f,0x265,0x36c,
         0xc6c,0xd65,0xe6f,0xf66,0x86a,0x963,0xa69,0xb60,
         0x5f0,0x4f9,0x7f3,0x6fa,0x1f6,0xff,0x3f5,0x2fc,
         0xdfc,0xcf5,0xfff,0xef6,0x9fa,0x8f3,0xbf9,0xaf0,
         0x650,0x759,0x453,0x55a,0x256,0x35f,0x55,0x15c,
         0xe5c,0xf55,0xc5f,0xd56,0xa5a,0xb53,0x859,0x950,
         0x7c0,0x6c9,0x5c3,0x4ca,0x3c6,0x2cf,0x1c5,0xcc,
         0xfcc,0xec5,0xdcf,0xcc6,0xbca,0xac3,0x9c9,0x8c0,
         0x8c0,0x9c9,0xac3,0xbca,0xcc6,0xdcf,0xec5,0xfcc,
         0xcc,0x1c5,0x2cf,0x3c6,0x4ca,0x5c3,0x6c9,0x7c0,
         0x950,0x859,0xb53,0xa5a,0xd56,0xc5f,0xf55,0xe5c,
         0x15c,0x55,0x35f,0x256,0x55a,0x453,0x759,0x650,
         0xaf0,0xbf9,0x8f3,0x9fa,0xef6,0xfff,0xcf5,0xdfc,
         0x2fc,0x3f5,0xff,0x1f6,0x6fa,0x7f3,0x4f9,0x5f0,
         0xb60,0xa69,0x963,0x86a,0xf66,0xe6f,0xd65,0xc6c,
         0x36c,0x265,0x16f,0x66,0x76a,0x663,0x569,0x460,
         0xca0,0xda9,0xea3,0xfaa,0x8a6,0x9af,0xaa5,0xbac,
         0x4ac,0x5a5,0x6af,0x7a6,0xaa,0x1a3,0x2a9,0x3a0,
         0xd30,0xc39,0xf33,0xe3a,0x936,0x83f,0xb35,0xa3c,
         0x53c,0x435,0x73f,0x636,0x13a,0x33,0x339,0x230,
         0xe90,0xf99,0xc93,0xd9a,0xa96,0xb9f,0x895,0x99c,
         0x69c,0x795,0x49f,0x596,0x29a,0x393,0x99,0x190,
         0xf00,0xe09,0xd03,0xc0a,0xb06,0xa0f,0x905,0x80c,
         0x70c,0x605,0x50f,0x406,0x30a,0x203,0x109,0x0
      ]
      var MC_TRI_TABLE = [
         [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [0,8,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [0,1,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [1,8,3,9,8,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [1,2,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [0,8,3,1,2,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [9,2,10,0,2,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [2,8,3,2,10,8,10,9,8,-1,-1,-1,-1,-1,-1,-1],
         [3,11,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [0,11,2,8,11,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [1,9,0,2,3,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [1,11,2,1,9,11,9,8,11,-1,-1,-1,-1,-1,-1,-1],
         [3,10,1,11,10,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [0,10,1,0,8,10,8,11,10,-1,-1,-1,-1,-1,-1,-1],
         [3,9,0,3,11,9,11,10,9,-1,-1,-1,-1,-1,-1,-1],
         [9,8,10,10,8,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [4,7,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [4,3,0,7,3,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [0,1,9,8,4,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [4,1,9,4,7,1,7,3,1,-1,-1,-1,-1,-1,-1,-1],
         [1,2,10,8,4,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [3,4,7,3,0,4,1,2,10,-1,-1,-1,-1,-1,-1,-1],
         [9,2,10,9,0,2,8,4,7,-1,-1,-1,-1,-1,-1,-1],
         [2,10,9,2,9,7,2,7,3,7,9,4,-1,-1,-1,-1],
         [8,4,7,3,11,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [11,4,7,11,2,4,2,0,4,-1,-1,-1,-1,-1,-1,-1],
         [9,0,1,8,4,7,2,3,11,-1,-1,-1,-1,-1,-1,-1],
         [4,7,11,9,4,11,9,11,2,9,2,1,-1,-1,-1,-1],
         [3,10,1,3,11,10,7,8,4,-1,-1,-1,-1,-1,-1,-1],
         [1,11,10,1,4,11,1,0,4,7,11,4,-1,-1,-1,-1],
         [4,7,8,9,0,11,9,11,10,11,0,3,-1,-1,-1,-1],
         [4,7,11,4,11,9,9,11,10,-1,-1,-1,-1,-1,-1,-1],
         [9,5,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [9,5,4,0,8,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [0,5,4,1,5,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [8,5,4,8,3,5,3,1,5,-1,-1,-1,-1,-1,-1,-1],
         [1,2,10,9,5,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [3,0,8,1,2,10,4,9,5,-1,-1,-1,-1,-1,-1,-1],
         [5,2,10,5,4,2,4,0,2,-1,-1,-1,-1,-1,-1,-1],
         [2,10,5,3,2,5,3,5,4,3,4,8,-1,-1,-1,-1],
         [9,5,4,2,3,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [0,11,2,0,8,11,4,9,5,-1,-1,-1,-1,-1,-1,-1],
         [0,5,4,0,1,5,2,3,11,-1,-1,-1,-1,-1,-1,-1],
         [2,1,5,2,5,8,2,8,11,4,8,5,-1,-1,-1,-1],
         [10,3,11,10,1,3,9,5,4,-1,-1,-1,-1,-1,-1,-1],
         [4,9,5,0,8,1,8,10,1,8,11,10,-1,-1,-1,-1],
         [5,4,0,5,0,11,5,11,10,11,0,3,-1,-1,-1,-1],
         [5,4,8,5,8,10,10,8,11,-1,-1,-1,-1,-1,-1,-1],
         [9,7,8,5,7,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [9,3,0,9,5,3,5,7,3,-1,-1,-1,-1,-1,-1,-1],
         [0,7,8,0,1,7,1,5,7,-1,-1,-1,-1,-1,-1,-1],
         [1,5,3,3,5,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [9,7,8,9,5,7,10,1,2,-1,-1,-1,-1,-1,-1,-1],
         [10,1,2,9,5,0,5,3,0,5,7,3,-1,-1,-1,-1],
         [8,0,2,8,2,5,8,5,7,10,5,2,-1,-1,-1,-1],
         [2,10,5,2,5,3,3,5,7,-1,-1,-1,-1,-1,-1,-1],
         [7,9,5,7,8,9,3,11,2,-1,-1,-1,-1,-1,-1,-1],
         [9,5,7,9,7,2,9,2,0,2,7,11,-1,-1,-1,-1],
         [2,3,11,0,1,8,1,7,8,1,5,7,-1,-1,-1,-1],
         [11,2,1,11,1,7,7,1,5,-1,-1,-1,-1,-1,-1,-1],
         [9,5,8,8,5,7,10,1,3,10,3,11,-1,-1,-1,-1],
         [5,7,0,5,0,9,7,11,0,1,0,10,11,10,0,-1],
         [11,10,0,11,0,3,10,5,0,8,0,7,5,7,0,-1],
         [11,10,5,7,11,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [10,6,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [0,8,3,5,10,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [9,0,1,5,10,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [1,8,3,1,9,8,5,10,6,-1,-1,-1,-1,-1,-1,-1],
         [1,6,5,2,6,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [1,6,5,1,2,6,3,0,8,-1,-1,-1,-1,-1,-1,-1],
         [9,6,5,9,0,6,0,2,6,-1,-1,-1,-1,-1,-1,-1],
         [5,9,8,5,8,2,5,2,6,3,2,8,-1,-1,-1,-1],
         [2,3,11,10,6,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [11,0,8,11,2,0,10,6,5,-1,-1,-1,-1,-1,-1,-1],
         [0,1,9,2,3,11,5,10,6,-1,-1,-1,-1,-1,-1,-1],
         [5,10,6,1,9,2,9,11,2,9,8,11,-1,-1,-1,-1],
         [6,3,11,6,5,3,5,1,3,-1,-1,-1,-1,-1,-1,-1],
         [0,8,11,0,11,5,0,5,1,5,11,6,-1,-1,-1,-1],
         [3,11,6,0,3,6,0,6,5,0,5,9,-1,-1,-1,-1],
         [6,5,9,6,9,11,11,9,8,-1,-1,-1,-1,-1,-1,-1],
         [5,10,6,4,7,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [4,3,0,4,7,3,6,5,10,-1,-1,-1,-1,-1,-1,-1],
         [1,9,0,5,10,6,8,4,7,-1,-1,-1,-1,-1,-1,-1],
         [10,6,5,1,9,7,1,7,3,7,9,4,-1,-1,-1,-1],
         [6,1,2,6,5,1,4,7,8,-1,-1,-1,-1,-1,-1,-1],
         [1,2,5,5,2,6,3,0,4,3,4,7,-1,-1,-1,-1],
         [8,4,7,9,0,5,0,6,5,0,2,6,-1,-1,-1,-1],
         [7,3,9,7,9,4,3,2,9,5,9,6,2,6,9,-1],
         [3,11,2,7,8,4,10,6,5,-1,-1,-1,-1,-1,-1,-1],
         [5,10,6,4,7,2,4,2,0,2,7,11,-1,-1,-1,-1],
         [0,1,9,4,7,8,2,3,11,5,10,6,-1,-1,-1,-1],
         [9,2,1,9,11,2,9,4,11,7,11,4,5,10,6,-1],
         [8,4,7,3,11,5,3,5,1,5,11,6,-1,-1,-1,-1],
         [5,1,11,5,11,6,1,0,11,7,11,4,0,4,11,-1],
         [0,5,9,0,6,5,0,3,6,11,6,3,8,4,7,-1],
         [6,5,9,6,9,11,4,7,9,7,11,9,-1,-1,-1,-1],
         [10,4,9,6,4,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [4,10,6,4,9,10,0,8,3,-1,-1,-1,-1,-1,-1,-1],
         [10,0,1,10,6,0,6,4,0,-1,-1,-1,-1,-1,-1,-1],
         [8,3,1,8,1,6,8,6,4,6,1,10,-1,-1,-1,-1],
         [1,4,9,1,2,4,2,6,4,-1,-1,-1,-1,-1,-1,-1],
         [3,0,8,1,2,9,2,4,9,2,6,4,-1,-1,-1,-1],
         [0,2,4,4,2,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [8,3,2,8,2,4,4,2,6,-1,-1,-1,-1,-1,-1,-1],
         [10,4,9,10,6,4,11,2,3,-1,-1,-1,-1,-1,-1,-1],
         [0,8,2,2,8,11,4,9,10,4,10,6,-1,-1,-1,-1],
         [3,11,2,0,1,6,0,6,4,6,1,10,-1,-1,-1,-1],
         [6,4,1,6,1,10,4,8,1,2,1,11,8,11,1,-1],
         [9,6,4,9,3,6,9,1,3,11,6,3,-1,-1,-1,-1],
         [8,11,1,8,1,0,11,6,1,9,1,4,6,4,1,-1],
         [3,11,6,3,6,0,0,6,4,-1,-1,-1,-1,-1,-1,-1],
         [6,4,8,11,6,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [7,10,6,7,8,10,8,9,10,-1,-1,-1,-1,-1,-1,-1],
         [0,7,3,0,10,7,0,9,10,6,7,10,-1,-1,-1,-1],
         [10,6,7,1,10,7,1,7,8,1,8,0,-1,-1,-1,-1],
         [10,6,7,10,7,1,1,7,3,-1,-1,-1,-1,-1,-1,-1],
         [1,2,6,1,6,8,1,8,9,8,6,7,-1,-1,-1,-1],
         [2,6,9,2,9,1,6,7,9,0,9,3,7,3,9,-1],
         [7,8,0,7,0,6,6,0,2,-1,-1,-1,-1,-1,-1,-1],
         [7,3,2,6,7,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [2,3,11,10,6,8,10,8,9,8,6,7,-1,-1,-1,-1],
         [2,0,7,2,7,11,0,9,7,6,7,10,9,10,7,-1],
         [1,8,0,1,7,8,1,10,7,6,7,10,2,3,11,-1],
         [11,2,1,11,1,7,10,6,1,6,7,1,-1,-1,-1,-1],
         [8,9,6,8,6,7,9,1,6,11,6,3,1,3,6,-1],
         [0,9,1,11,6,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [7,8,0,7,0,6,3,11,0,11,6,0,-1,-1,-1,-1],
         [7,11,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [7,6,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [3,0,8,11,7,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [0,1,9,11,7,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [8,1,9,8,3,1,11,7,6,-1,-1,-1,-1,-1,-1,-1],
         [10,1,2,6,11,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [1,2,10,3,0,8,6,11,7,-1,-1,-1,-1,-1,-1,-1],
         [2,9,0,2,10,9,6,11,7,-1,-1,-1,-1,-1,-1,-1],
         [6,11,7,2,10,3,10,8,3,10,9,8,-1,-1,-1,-1],
         [7,2,3,6,2,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [7,0,8,7,6,0,6,2,0,-1,-1,-1,-1,-1,-1,-1],
         [2,7,6,2,3,7,0,1,9,-1,-1,-1,-1,-1,-1,-1],
         [1,6,2,1,8,6,1,9,8,8,7,6,-1,-1,-1,-1],
         [10,7,6,10,1,7,1,3,7,-1,-1,-1,-1,-1,-1,-1],
         [10,7,6,1,7,10,1,8,7,1,0,8,-1,-1,-1,-1],
         [0,3,7,0,7,10,0,10,9,6,10,7,-1,-1,-1,-1],
         [7,6,10,7,10,8,8,10,9,-1,-1,-1,-1,-1,-1,-1],
         [6,8,4,11,8,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [3,6,11,3,0,6,0,4,6,-1,-1,-1,-1,-1,-1,-1],
         [8,6,11,8,4,6,9,0,1,-1,-1,-1,-1,-1,-1,-1],
         [9,4,6,9,6,3,9,3,1,11,3,6,-1,-1,-1,-1],
         [6,8,4,6,11,8,2,10,1,-1,-1,-1,-1,-1,-1,-1],
         [1,2,10,3,0,11,0,6,11,0,4,6,-1,-1,-1,-1],
         [4,11,8,4,6,11,0,2,9,2,10,9,-1,-1,-1,-1],
         [10,9,3,10,3,2,9,4,3,11,3,6,4,6,3,-1],
         [8,2,3,8,4,2,4,6,2,-1,-1,-1,-1,-1,-1,-1],
         [0,4,2,4,6,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [1,9,0,2,3,4,2,4,6,4,3,8,-1,-1,-1,-1],
         [1,9,4,1,4,2,2,4,6,-1,-1,-1,-1,-1,-1,-1],
         [8,1,3,8,6,1,8,4,6,6,10,1,-1,-1,-1,-1],
         [10,1,0,10,0,6,6,0,4,-1,-1,-1,-1,-1,-1,-1],
         [4,6,3,4,3,8,6,10,3,0,3,9,10,9,3,-1],
         [10,9,4,6,10,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [4,9,5,7,6,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [0,8,3,4,9,5,11,7,6,-1,-1,-1,-1,-1,-1,-1],
         [5,0,1,5,4,0,7,6,11,-1,-1,-1,-1,-1,-1,-1],
         [11,7,6,8,3,4,3,5,4,3,1,5,-1,-1,-1,-1],
         [9,5,4,10,1,2,7,6,11,-1,-1,-1,-1,-1,-1,-1],
         [6,11,7,1,2,10,0,8,3,4,9,5,-1,-1,-1,-1],
         [7,6,11,5,4,10,4,2,10,4,0,2,-1,-1,-1,-1],
         [3,4,8,3,5,4,3,2,5,10,5,2,11,7,6,-1],
         [7,2,3,7,6,2,5,4,9,-1,-1,-1,-1,-1,-1,-1],
         [9,5,4,0,8,6,0,6,2,6,8,7,-1,-1,-1,-1],
         [3,6,2,3,7,6,1,5,0,5,4,0,-1,-1,-1,-1],
         [6,2,8,6,8,7,2,1,8,4,8,5,1,5,8,-1],
         [9,5,4,10,1,6,1,7,6,1,3,7,-1,-1,-1,-1],
         [1,6,10,1,7,6,1,0,7,8,7,0,9,5,4,-1],
         [4,0,10,4,10,5,0,3,10,6,10,7,3,7,10,-1],
         [7,6,10,7,10,8,5,4,10,4,8,10,-1,-1,-1,-1],
         [6,9,5,6,11,9,11,8,9,-1,-1,-1,-1,-1,-1,-1],
         [3,6,11,0,6,3,0,5,6,0,9,5,-1,-1,-1,-1],
         [0,11,8,0,5,11,0,1,5,5,6,11,-1,-1,-1,-1],
         [6,11,3,6,3,5,5,3,1,-1,-1,-1,-1,-1,-1,-1],
         [1,2,10,9,5,11,9,11,8,11,5,6,-1,-1,-1,-1],
         [0,11,3,0,6,11,0,9,6,5,6,9,1,2,10,-1],
         [11,8,5,11,5,6,8,0,5,10,5,2,0,2,5,-1],
         [6,11,3,6,3,5,2,10,3,10,5,3,-1,-1,-1,-1],
         [5,8,9,5,2,8,5,6,2,3,8,2,-1,-1,-1,-1],
         [9,5,6,9,6,0,0,6,2,-1,-1,-1,-1,-1,-1,-1],
         [1,5,8,1,8,0,5,6,8,3,8,2,6,2,8,-1],
         [1,5,6,2,1,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [1,3,6,1,6,10,3,8,6,5,6,9,8,9,6,-1],
         [10,1,0,10,0,6,9,5,0,5,6,0,-1,-1,-1,-1],
         [0,3,8,5,6,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [10,5,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [11,5,10,7,5,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [11,5,10,11,7,5,8,3,0,-1,-1,-1,-1,-1,-1,-1],
         [5,11,7,5,10,11,1,9,0,-1,-1,-1,-1,-1,-1,-1],
         [10,7,5,10,11,7,9,8,1,8,3,1,-1,-1,-1,-1],
         [11,1,2,11,7,1,7,5,1,-1,-1,-1,-1,-1,-1,-1],
         [0,8,3,1,2,7,1,7,5,7,2,11,-1,-1,-1,-1],
         [9,7,5,9,2,7,9,0,2,2,11,7,-1,-1,-1,-1],
         [7,5,2,7,2,11,5,9,2,3,2,8,9,8,2,-1],
         [2,5,10,2,3,5,3,7,5,-1,-1,-1,-1,-1,-1,-1],
         [8,2,0,8,5,2,8,7,5,10,2,5,-1,-1,-1,-1],
         [9,0,1,5,10,3,5,3,7,3,10,2,-1,-1,-1,-1],
         [9,8,2,9,2,1,8,7,2,10,2,5,7,5,2,-1],
         [1,3,5,3,7,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [0,8,7,0,7,1,1,7,5,-1,-1,-1,-1,-1,-1,-1],
         [9,0,3,9,3,5,5,3,7,-1,-1,-1,-1,-1,-1,-1],
         [9,8,7,5,9,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [5,8,4,5,10,8,10,11,8,-1,-1,-1,-1,-1,-1,-1],
         [5,0,4,5,11,0,5,10,11,11,3,0,-1,-1,-1,-1],
         [0,1,9,8,4,10,8,10,11,10,4,5,-1,-1,-1,-1],
         [10,11,4,10,4,5,11,3,4,9,4,1,3,1,4,-1],
         [2,5,1,2,8,5,2,11,8,4,5,8,-1,-1,-1,-1],
         [0,4,11,0,11,3,4,5,11,2,11,1,5,1,11,-1],
         [0,2,5,0,5,9,2,11,5,4,5,8,11,8,5,-1],
         [9,4,5,2,11,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [2,5,10,3,5,2,3,4,5,3,8,4,-1,-1,-1,-1],
         [5,10,2,5,2,4,4,2,0,-1,-1,-1,-1,-1,-1,-1],
         [3,10,2,3,5,10,3,8,5,4,5,8,0,1,9,-1],
         [5,10,2,5,2,4,1,9,2,9,4,2,-1,-1,-1,-1],
         [8,4,5,8,5,3,3,5,1,-1,-1,-1,-1,-1,-1,-1],
         [0,4,5,1,0,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [8,4,5,8,5,3,9,0,5,0,3,5,-1,-1,-1,-1],
         [9,4,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [4,11,7,4,9,11,9,10,11,-1,-1,-1,-1,-1,-1,-1],
         [0,8,3,4,9,7,9,11,7,9,10,11,-1,-1,-1,-1],
         [1,10,11,1,11,4,1,4,0,7,4,11,-1,-1,-1,-1],
         [3,1,4,3,4,8,1,10,4,7,4,11,10,11,4,-1],
         [4,11,7,9,11,4,9,2,11,9,1,2,-1,-1,-1,-1],
         [9,7,4,9,11,7,9,1,11,2,11,1,0,8,3,-1],
         [11,7,4,11,4,2,2,4,0,-1,-1,-1,-1,-1,-1,-1],
         [11,7,4,11,4,2,8,3,4,3,2,4,-1,-1,-1,-1],
         [2,9,10,2,7,9,2,3,7,7,4,9,-1,-1,-1,-1],
         [9,10,7,9,7,4,10,2,7,8,7,0,2,0,7,-1],
         [3,7,10,3,10,2,7,4,10,1,10,0,4,0,10,-1],
         [1,10,2,8,7,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [4,9,1,4,1,7,7,1,3,-1,-1,-1,-1,-1,-1,-1],
         [4,9,1,4,1,7,0,8,1,8,7,1,-1,-1,-1,-1],
         [4,0,3,7,4,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [4,8,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [9,10,8,10,11,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [3,0,9,3,9,11,11,9,10,-1,-1,-1,-1,-1,-1,-1],
         [0,1,10,0,10,8,8,10,11,-1,-1,-1,-1,-1,-1,-1],
         [3,1,10,11,3,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [1,2,11,1,11,9,9,11,8,-1,-1,-1,-1,-1,-1,-1],
         [3,0,9,3,9,11,1,2,9,2,11,9,-1,-1,-1,-1],
         [0,2,11,8,0,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [3,2,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [2,3,8,2,8,10,10,8,9,-1,-1,-1,-1,-1,-1,-1],
         [9,10,2,0,9,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [2,3,8,2,8,10,0,1,8,1,10,8,-1,-1,-1,-1],
         [1,10,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [1,3,8,9,1,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [0,9,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [0,3,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
         [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
      ]
      //
      // create voxel grid
      //
      function create_voxel_grid(nx, ny, nz) {
         var grid = new Uint8Array(nx * ny * nz)
         for (var iz = 1; iz < nz - 1; ++iz) {
            for (var iy = 1; iy < ny - 1; ++iy) {
               for (var ix = 1; ix < nx - 1; ++ix) {
                  grid[ix + iy * nx + iz * nx * ny] = 1
                  }
               }
            }
         return grid
         }
      //
      // carve path into voxel grid (flat, ball-nose, and V-bit tools)
      //
      function carve_path(grid, path, dpi, tool_dia_mm, tool_type, tool_angle, tool_tip_dia, stock_x, stock_y, stock_z, res, nx, ny, nz) {
         var tool_r = tool_dia_mm / 2
         //
         // precompute masks per Z-offset from tool tip
         // masks[dz] = flat array [dx0,dy0, dx1,dy1, ...]
         //
         var max_dz_vox = Math.ceil(stock_z / res) + 1
         //
         var masks = []
         for (var dz = 0; dz <= max_dz_vox; ++dz) {
            var z_mm = dz * res
            var r_mm
            if (tool_type === 'ball') {
               // hemisphere: r(z) = sqrt(R^2 - (R-z)^2) for z < R, else R
               if (z_mm < tool_r) {
                  r_mm = Math.sqrt(tool_r * tool_r - (tool_r - z_mm) * (tool_r - z_mm))
               } else {
                  r_mm = tool_r
               }
            } else if (tool_type === 'vbit') {
               // cone: r(z) = tip_r + z * tan(half_angle)
               var tip_r = (tool_tip_dia || 0) / 2
               var half_angle_rad = (tool_angle || 30) * Math.PI / 360
               r_mm = tip_r + z_mm * Math.tan(half_angle_rad)
            } else {
               // flat: constant radius at all Z levels
               r_mm = tool_r
            }
            // Marching cubes (MC) compensation
            //
            // MC places surfaces at midpoints between cleared and non-cleared
            // voxels, effectively adding ~res/2 to the visual radius. To match
            // the real tool profile we shrink the carving radius by res/2.
            //
            // However, for small tools (V-bit tips ~1-2 voxels wide), a full
            // res/2 shrink removes 30%+ of the radius. This collapses the
            // circular mask from a 3x3 square to a plus (+) shape, leaving
            // diagonal voxels uncleared between adjacent passes — producing
            // false microtraces that wouldn't exist on a real PCB. Capping
            // compensation at 10% of the tool radius fixes this: tools with
            // r >= 0.16mm (flat endmills, ball-nose) still get the full res/2
            // correction, while V-bit tips get proportionally less, preventing
            // false artifacts at pass boundaries.
            //
            var comp = Math.min(res / 2, r_mm * 0.10)
            r_mm = Math.max(res * 0.5, r_mm - comp)
            var r_vox = r_mm / res
            var r_vox_sq = r_vox * r_vox
            var irad = Math.ceil(r_vox)
            var pairs = []
            for (var dy = -irad; dy <= irad; ++dy) {
               for (var dx = -irad; dx <= irad; ++dx) {
                  if (dx * dx + dy * dy <= r_vox_sq) {
                     pairs.push(dx, dy)
                     }
                  }
               }
            masks.push(pairs)
            }
         //
         // interpolation step size in mm
         //
         var step_mm = res
         //
         // process each path segment
         //
         for (var seg = 0; seg < path.length; ++seg) {
            for (var pt = 0; pt < path[seg].length; ++pt) {
               var px_mm = path[seg][pt][0] * 25.4 / dpi
               var py_mm = path[seg][pt][1] * 25.4 / dpi
               var pz_pixel = path[seg][pt][2] || 0
               var pz_mm = pz_pixel * 25.4 / dpi
               var tool_z_mm = stock_z + pz_mm
               //
               // interpolate between consecutive points
               //
               var next_px_mm, next_py_mm, next_tool_z_mm
               var do_interp = false
               if (pt < path[seg].length - 1) {
                  next_px_mm = path[seg][pt+1][0] * 25.4 / dpi
                  next_py_mm = path[seg][pt+1][1] * 25.4 / dpi
                  var next_pz_pixel = path[seg][pt+1][2] || 0
                  var next_pz_mm = next_pz_pixel * 25.4 / dpi
                  next_tool_z_mm = stock_z + next_pz_mm
                  do_interp = true
                  }
               //
               // carve at this point
               //
               carve_at(px_mm, py_mm, tool_z_mm)
               //
               // interpolate to next point
               //
               if (do_interp) {
                  var ddx = next_px_mm - px_mm
                  var ddy = next_py_mm - py_mm
                  var ddz = next_tool_z_mm - tool_z_mm
                  var dist = Math.sqrt(ddx*ddx + ddy*ddy + ddz*ddz)
                  if (dist > step_mm) {
                     var nsteps = Math.ceil(dist / step_mm)
                     for (var s = 1; s < nsteps; ++s) {
                        var t = s / nsteps
                        carve_at(
                           px_mm + ddx * t,
                           py_mm + ddy * t,
                           tool_z_mm + ddz * t
                           )
                        }
                     }
                  }
               }
            }
         //
         // carve at a single position using per-Z masks
         //
         function carve_at(cx_mm, cy_mm, tz_mm) {
            var vx = Math.round(cx_mm / res) + 1
            var vy = Math.round(cy_mm / res) + 1
            var vz_min = Math.max(1, Math.floor(tz_mm / res) + 1)
            var vz_max = nz - 2
            if (vz_min > vz_max) return
            //
            for (var gz = vz_min; gz <= vz_max; ++gz) {
               // dz = distance from tool tip (in voxels)
               var dz = gz - vz_min
               if (dz >= masks.length) dz = masks.length - 1
               var mask = masks[dz]
               var base = gz * nx * ny
               for (var m = 0; m < mask.length; m += 2) {
                  var gx = vx + mask[m]
                  var gy = vy + mask[m+1]
                  if (gx < 0 || gx >= nx || gy < 0 || gy >= ny) continue
                  grid[gx + gy * nx + base] = 0
                  }
               }
            }
         }
      //
      // march cubes for a single Z slab
      //
      function march_cubes_slab(grid, nx, ny, nz, res, stock_z, material, iz, stock_x, stock_y) {
         var positions = []
         var normals = []
         var colors = []
         var uvs = []
         //
         // edge midpoint positions
         //
         function edge_point(ix, iy, izz, edge) {
            var x = (ix - 1) * res
            var y = (iy - 1) * res
            var z = (izz - 1) * res
            switch (edge) {
               case 0:  return [x + res*0.5, y,           z]
               case 1:  return [x + res,     y + res*0.5, z]
               case 2:  return [x + res*0.5, y + res,     z]
               case 3:  return [x,           y + res*0.5, z]
               case 4:  return [x + res*0.5, y,           z + res]
               case 5:  return [x + res,     y + res*0.5, z + res]
               case 6:  return [x + res*0.5, y + res,     z + res]
               case 7:  return [x,           y + res*0.5, z + res]
               case 8:  return [x,           y,           z + res*0.5]
               case 9:  return [x + res,     y,           z + res*0.5]
               case 10: return [x + res,     y + res,     z + res*0.5]
               case 11: return [x,           y + res,     z + res*0.5]
               }
            return [x, y, z]
            }
         //
         // material colors
         //
         var copperThreshold = stock_z - res * 0.5
         var colR1, colG1, colB1, colR2, colG2, colB2, usePCB
         var usePlywood = false, nPlies = 0, plyThick = 0, glueHalf = 0
         if (material === 'PCB') {
            usePCB = true
            colR1 = 0.72; colG1 = 0.45; colB1 = 0.20 // copper
            colR2 = 0.77; colG2 = 0.64; colB2 = 0.40 // FR1
         } else if (material === 'Wax') {
            usePCB = false
            colR1 = 0.23; colG1 = 0.31; colB1 = 0.73
         } else if (material === 'Wood') {
            usePCB = false
            colR1 = 0.83; colG1 = 0.77; colB1 = 0.63
         } else if (material === 'Plywood') {
            usePCB = false
            usePlywood = true
            nPlies = Math.round(stock_z / 3)
            if (nPlies < 3) nPlies = 3
            if (nPlies % 2 === 0) nPlies += 1
            plyThick = stock_z / nPlies
            glueHalf = Math.min(plyThick * 0.08, 0.15)
            colR1 = 0.86; colG1 = 0.80; colB1 = 0.68 // face veneer
         } else if (material === 'Aluminum') {
            usePCB = false
            colR1 = 0.83; colG1 = 0.83; colB1 = 0.85
         } else {
            usePCB = false
            colR1 = 0.77; colG1 = 0.64; colB1 = 0.40
         }
         //
         // process voxel cubes for this Z slab
         //
         for (var iy = 0; iy < ny - 1; ++iy) {
            for (var ix = 0; ix < nx - 1; ++ix) {
               var cubeindex = 0
               var v0 = grid[ix     + iy     * nx + iz     * nx * ny]
               var v1 = grid[(ix+1) + iy     * nx + iz     * nx * ny]
               var v2 = grid[(ix+1) + (iy+1) * nx + iz     * nx * ny]
               var v3 = grid[ix     + (iy+1) * nx + iz     * nx * ny]
               var v4 = grid[ix     + iy     * nx + (iz+1) * nx * ny]
               var v5 = grid[(ix+1) + iy     * nx + (iz+1) * nx * ny]
               var v6 = grid[(ix+1) + (iy+1) * nx + (iz+1) * nx * ny]
               var v7 = grid[ix     + (iy+1) * nx + (iz+1) * nx * ny]
               if (v0) cubeindex |= 1
               if (v1) cubeindex |= 2
               if (v2) cubeindex |= 4
               if (v3) cubeindex |= 8
               if (v4) cubeindex |= 16
               if (v5) cubeindex |= 32
               if (v6) cubeindex |= 64
               if (v7) cubeindex |= 128
               if (MC_EDGE_TABLE[cubeindex] === 0) continue
               var triRow = MC_TRI_TABLE[cubeindex]
               for (var t = 0; t < 16; t += 3) {
                  if (triRow[t] === -1) break
                  var e0 = triRow[t]
                  var e1 = triRow[t+1]
                  var e2 = triRow[t+2]
                  var p0 = edge_point(ix, iy, iz, e0)
                  var p1 = edge_point(ix, iy, iz, e1)
                  var p2 = edge_point(ix, iy, iz, e2)
                  //
                  // face normal
                  //
                  var ax = p2[0] - p0[0]
                  var ay = p2[1] - p0[1]
                  var az = p2[2] - p0[2]
                  var bx = p1[0] - p0[0]
                  var by = p1[1] - p0[1]
                  var bz = p1[2] - p0[2]
                  var nx_ = ay * bz - az * by
                  var ny_ = az * bx - ax * bz
                  var nz_ = ax * by - ay * bx
                  var len = Math.sqrt(nx_*nx_ + ny_*ny_ + nz_*nz_)
                  if (len > 0) { nx_ /= len; ny_ /= len; nz_ /= len }
                  //
                  // push triangle vertices (reversed winding: p0,p2,p1)
                  //
                  positions.push(p0[0], p0[1], p0[2])
                  positions.push(p2[0], p2[1], p2[2])
                  positions.push(p1[0], p1[1], p1[2])
                  normals.push(nx_, ny_, nz_)
                  normals.push(nx_, ny_, nz_)
                  normals.push(nx_, ny_, nz_)
                  //
                  // vertex colors
                  //
                  var pts = [p0, p2, p1]
                  for (var vi = 0; vi < 3; ++vi) {
                     if (usePCB) {
                        if (pts[vi][2] >= copperThreshold) {
                           colors.push(colR1, colG1, colB1)
                        } else {
                           colors.push(colR2, colG2, colB2)
                        }
                     } else if (usePlywood) {
                        var pz = pts[vi][2]
                        var pi = Math.floor(pz / plyThick)
                        if (pi >= nPlies) pi = nPlies - 1
                        if (pi < 0) pi = 0
                        var distToBoundary = pz - pi * plyThick
                        var isGlue = (pi > 0 && distToBoundary < glueHalf) ||
                                     (pi < nPlies - 1 && (plyThick - distToBoundary) < glueHalf)
                        if (isGlue) {
                           colors.push(0.35, 0.25, 0.14)
                        } else if (pi % 2 === 0) {
                           // light ply (face + even core)
                           colors.push(colR1, colG1, colB1)
                        } else {
                           // dark ply (odd core)
                           colors.push(0.72, 0.64, 0.50)
                        }
                     } else {
                        colors.push(colR1, colG1, colB1)
                     }
                     uvs.push(pts[vi][0] / stock_x, pts[vi][1] / stock_y)
                  }
               }
            }
         }
         if (positions.length === 0) return null
         return {
            positions: new Float32Array(positions),
            normals: new Float32Array(normals),
            colors: new Float32Array(colors),
            uvs: new Float32Array(uvs)
            }
         }
      //
      // message handler
      //
      self.onmessage = function(e) {
         var d = e.data
         var path = d.path
         var dpi = d.dpi
         var tool_dia = d.tool_dia
         var tool_type = d.tool_type || 'flat'
         var tool_angle = d.tool_angle || 30
         var tool_tip_dia = d.tool_tip_dia || 0
         var stock_x = d.stock_x
         var stock_y = d.stock_y
         var stock_z = d.stock_z
         var res = d.res
         var nx = d.nx
         var ny = d.ny
         var nz = d.nz
         var material = d.material
         //
         // create grid and carve
         //
         var grid = create_voxel_grid(nx, ny, nz)
         carve_path(grid, path, dpi, tool_dia, tool_type, tool_angle, tool_tip_dia, stock_x, stock_y, stock_z, res, nx, ny, nz)
         //
         // march cubes slab by slab
         //
         var totalSlabs = nz - 1
         for (var iz = 0; iz < totalSlabs; ++iz) {
            var progress = (iz + 1) / totalSlabs
            var result = march_cubes_slab(grid, nx, ny, nz, res, stock_z, material, iz, stock_x, stock_y)
            if (result) {
               var msg = {
                  type: 'chunk',
                  positions: result.positions,
                  normals: result.normals,
                  colors: result.colors,
                  uvs: result.uvs,
                  progress: progress
                  }
               self.postMessage(msg, [msg.positions.buffer, msg.normals.buffer, msg.colors.buffer, msg.uvs.buffer])
            } else {
               self.postMessage({type: 'progress', progress: progress})
            }
         }
         self.postMessage({type: 'done'})
         }
      }
   //
   // generate procedural wood grain texture
   //
   function generate_wood_texture(light) {
      var canvas = document.createElement('canvas')
      var W = 512
      canvas.width = W
      canvas.height = W
      var ctx = canvas.getContext('2d')
      var imageData = ctx.createImageData(W, W)
      var data = imageData.data
      // base and ring colors — light natural wood (pine/birch)
      var bR = light ? 220 : 212, bG = light ? 208 : 196, bB = light ? 180 : 160
      var rR = light ? 185 : 170, rG = light ? 165 : 148, rB = light ? 130 : 110
      // growth centers well-spaced (knots ~80-200mm apart in real wood)
      // centers can extend beyond canvas for partial-ring realism
      var centers = []
      var nC = 2 + Math.floor(Math.random() * 3)
      for (var c = 0; c < nC; c++) {
         // random turbulence harmonics per center
         var turb = []
         for (var h = 0; h < 5; h++) {
            turb.push({
               freq: 2 + h * 2 + Math.random() * 2,
               amp: (12 - h * 2) * (0.5 + Math.random()),
               phase: Math.random() * Math.PI * 2
            })
         }
         centers.push({
            x: (Math.random() - 0.2) * W * 1.4,
            y: (Math.random() - 0.2) * W * 1.4,
            w: 0.5 + Math.random(), sx: 0.7 + Math.random() * 0.5,
            sy: 0.7 + Math.random() * 0.5, a: Math.random() * Math.PI,
            turb: turb
         })
      }
      // ring spacing ~2-4mm; at ~0.3mm/px that's 7-13px
      var spacing = 7 + Math.random() * 6
      for (var y = 0; y < W; y++) {
         for (var x = 0; x < W; x++) {
            var dist = 0
            for (var c = 0; c < nC; c++) {
               var dx = x - centers[c].x, dy = y - centers[c].y
               var cos = Math.cos(centers[c].a), sin = Math.sin(centers[c].a)
               var rx = (dx * cos - dy * sin) * centers[c].sx
               var ry = (dx * sin + dy * cos) * centers[c].sy
               var d = Math.sqrt(rx * rx + ry * ry)
               // turbulence: angle-dependent perturbation (water ripple drift)
               var angle = Math.atan2(ry, rx)
               for (var h = 0; h < 5; h++) {
                  var t = centers[c].turb[h]
                  d += Math.sin(angle * t.freq + t.phase) * t.amp * (d / (d + 80))
               }
               dist += d * centers[c].w
            }
            dist /= nC
            // broad waviness
            dist += Math.sin(x * 0.015 + y * 0.008) * 4
               + Math.sin(x * 0.007 - y * 0.012) * 3
            var ring = dist / spacing
            var frac = ring - Math.floor(ring)
            var intensity = Math.exp(-frac * frac * 18)
               + Math.exp(-(1 - frac) * (1 - frac) * 18)
            if (intensity > 1) intensity = 1
            intensity *= 0.25 + Math.sin(ring * 0.4) * 0.12
            var noise = (Math.random() - 0.5) * 10
            var idx = (y * W + x) * 4
            data[idx]     = bR + (rR - bR) * intensity + noise
            data[idx + 1] = bG + (rG - bG) * intensity + noise
            data[idx + 2] = bB + (rB - bB) * intensity + noise
            data[idx + 3] = 255
         }
      }
      ctx.putImageData(imageData, 0, 0)
      return new THREE.CanvasTexture(canvas)
      }
   //
   // create material for simulation mesh
   //
   function create_material() {
      var mat = mod.material_select ? mod.material_select.value : 'PCB'
      var props = {vertexColors: true}
      if (mat === 'PCB') {
         props.metalness = 0.35
         props.roughness = 0.45
         if (mod.envMap) { props.envMap = mod.envMap; props.envMapIntensity = 0.5 }
      } else if (mat === 'Wax') {
         props.metalness = 0.02
         props.roughness = 0.7
      } else if (mat === 'Wood') {
         props.metalness = 0.05
         props.roughness = 0.85
         if (!mod.woodTexture) mod.woodTexture = generate_wood_texture(false)
         props.map = mod.woodTexture
      } else if (mat === 'Plywood') {
         props.metalness = 0.05
         props.roughness = 0.80
         if (!mod.plywoodTexture) mod.plywoodTexture = generate_wood_texture(true)
         props.map = mod.plywoodTexture
      } else if (mat === 'Aluminum') {
         props.metalness = 0.75
         props.roughness = 0.25
         if (mod.envMap) { props.envMap = mod.envMap; props.envMapIntensity = 1.0 }
      } else {
         props.metalness = 0.35
         props.roughness = 0.45
      }
      return new THREE.MeshStandardMaterial(props)
      }
   //
   // merge chunk meshes into one
   //
   function merge_chunk_meshes(scene) {
      if (!mod.chunkMeshes || mod.chunkMeshes.length === 0) return
      //
      // count total vertices
      //
      var totalVerts = 0
      for (var i = 0; i < mod.chunkMeshes.length; ++i) {
         totalVerts += mod.chunkMeshes[i].geometry.attributes.position.count
         }
      if (totalVerts === 0) return
      //
      // allocate combined arrays
      //
      var positions = new Float32Array(totalVerts * 3)
      var normals = new Float32Array(totalVerts * 3)
      var colors = new Float32Array(totalVerts * 3)
      var uvs = new Float32Array(totalVerts * 2)
      var offset3 = 0
      var offset2 = 0
      for (var i = 0; i < mod.chunkMeshes.length; ++i) {
         var geo = mod.chunkMeshes[i].geometry
         var posArr = geo.attributes.position.array
         var normArr = geo.attributes.normal.array
         var colArr = geo.attributes.color.array
         var uvArr = geo.attributes.uv.array
         positions.set(posArr, offset3)
         normals.set(normArr, offset3)
         colors.set(colArr, offset3)
         uvs.set(uvArr, offset2)
         offset3 += posArr.length
         offset2 += uvArr.length
         //
         // dispose old chunk
         //
         geo.dispose()
         mod.chunkMeshes[i].material.dispose()
         scene.remove(mod.chunkMeshes[i])
         }
      //
      // create merged mesh
      //
      var mergedGeo = new THREE.BufferGeometry()
      mergedGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      mergedGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
      mergedGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
      mergedGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
      var mesh = new THREE.Mesh(mergedGeo, create_material())
      scene.add(mesh)
      mod.stockMesh = mesh
      //
      // back-face mesh for section plane interior (pitch black)
      //
      var backMat = new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.BackSide})
      var backMesh = new THREE.Mesh(mergedGeo, backMat)
      backMesh.visible = false
      scene.add(backMesh)
      mod.backMesh = backMesh
      mod.chunkMeshes = []
      }
   //
   // set camera up vector: blends smoothly from spherical up (top views)
   // to Z-up (side views) to avoid gimbal lock near the equator
   //
   function set_camera_up(cam) {
      var ef = Math.cos(mod.thetaxy)
      var ux = Math.sin(mod.thetaz) * ef
      var uy = Math.cos(mod.thetaz) * ef
      var uz = 1 - ef
      var len = Math.sqrt(ux * ux + uy * uy + uz * uz)
      if (len > 0) cam.up.set(ux / len, uy / len, uz / len)
      }
   //
   // show_simulation
   //
   function show_simulation() {
      var scene = mod.scene
      var renderer = mod.renderer
      //
      // check if view window open
      //
      if (mod.win == undefined) {
         open_view_window()
         return
         }
      //
      // check for path
      //
      if (mod.path == undefined)
         return
      //
      // terminate any running worker
      //
      if (mod.worker) {
         mod.worker.terminate()
         mod.worker = null
         }
      //
      // clear scene (dispose GPU resources)
      //
      while (scene.children.length > 0) {
         var child = scene.children[0]
         if (child.geometry) child.geometry.dispose()
         if (child.material) {
            if (child.material.map) child.material.map.dispose()
            child.material.dispose()
            }
         scene.remove(child)
         }
      mod.chunkMeshes = []
      mod.stockMesh = null
      mod.backMesh = null
      mod.toolpathObjects = []
      //
      // lights
      //
      scene.add(new THREE.AmbientLight(0xffffff, 0.3))
      var dir1 = new THREE.DirectionalLight(0xffffff, 0.6)
      dir1.position.set(1, 0.5, 2)
      scene.add(dir1)
      var dir2 = new THREE.DirectionalLight(0xffffff, 0.2)
      dir2.position.set(-1, -0.5, 1)
      scene.add(dir2)
      //
      // read parameters from interface
      //
      var stock_x = mod.stock_x_input._full || 100
      var stock_y = mod.stock_y_input._full || 80
      var stock_z = mod.stock_z_input._full || 1.6
      var tool_dia = mod.tool_dia_input._full || 0.4
      var tool_type = mod.tool_type_select.value || 'flat'
      var tool_angle = parseFloat(mod.tool_angle_input.value) || 30
      var tool_tip_dia = mod.tool_tip_input._full || 0.1
      var material = mod.material_select.value || 'PCB'
      //
      // compute resolution (tool_dia / 4, clamped)
      //
      var res = tool_dia / 4
      if (res < 0.025) res = 0.025
      if (res > 2.0) res = 2.0
      //
      // grid dimensions
      //
      var nx = Math.ceil(stock_x / res) + 2
      var ny = Math.ceil(stock_y / res) + 2
      var nz = Math.ceil(stock_z / res) + 2
      //
      // safety cap: limit voxels to 150M
      //
      while (nx * ny * nz > 150000000) {
         res *= 1.2
         nx = Math.ceil(stock_x / res) + 2
         ny = Math.ceil(stock_y / res) + 2
         nz = Math.ceil(stock_z / res) + 2
         }
      //
      // compute grid interval (nice round mm values)
      //
      var totalMM = Math.max(stock_x, stock_y)
      var rawInterval = totalMM / 5
      var exp = Math.floor(Math.log10(rawInterval))
      var base = Math.pow(10, exp)
      var niceSteps = [1, 2, 5, 10]
      var intervalMM = base
      for (var i = 0; i < niceSteps.length; i++) {
         if (niceSteps[i] * base >= rawInterval) {
            intervalMM = niceSteps[i] * base
            break
            }
         }
      //
      // grid extent (covers stock + padding, aligned to intervals)
      //
      var gridPad = totalMM * 0.3
      var gridStart = -Math.ceil(gridPad / intervalMM) * intervalMM
      var gridEndX = Math.ceil((stock_x + gridPad) / intervalMM) * intervalMM
      var gridEndY = Math.ceil((stock_y + gridPad) / intervalMM) * intervalMM
      //
      // draw subdivision grid lines (5 subdivisions per major interval)
      //
      var subInterval = intervalMM / 5
      var subVerts = []
      for (var gx = gridStart; gx <= gridEndX; gx += subInterval) {
         if (Math.abs(gx % intervalMM) > subInterval * 0.1) {
            subVerts.push(new THREE.Vector3(gx, gridStart, -0.05))
            subVerts.push(new THREE.Vector3(gx, gridEndY, -0.05))
            }
         }
      for (var gy = gridStart; gy <= gridEndY; gy += subInterval) {
         if (Math.abs(gy % intervalMM) > subInterval * 0.1) {
            subVerts.push(new THREE.Vector3(gridStart, gy, -0.05))
            subVerts.push(new THREE.Vector3(gridEndX, gy, -0.05))
            }
         }
      if (subVerts.length > 0) {
         var subGeo = new THREE.BufferGeometry().setFromPoints(subVerts)
         scene.add(new THREE.LineSegments(subGeo, new THREE.LineBasicMaterial({color: 0x444444})))
         }
      //
      // draw major grid lines
      //
      var gridVerts = []
      for (var gx = gridStart; gx <= gridEndX; gx += intervalMM) {
         gridVerts.push(new THREE.Vector3(gx, gridStart, -0.05))
         gridVerts.push(new THREE.Vector3(gx, gridEndY, -0.05))
         }
      for (var gy = gridStart; gy <= gridEndY; gy += intervalMM) {
         gridVerts.push(new THREE.Vector3(gridStart, gy, -0.05))
         gridVerts.push(new THREE.Vector3(gridEndX, gy, -0.05))
         }
      if (gridVerts.length > 0) {
         var gridGeo = new THREE.BufferGeometry().setFromPoints(gridVerts)
         scene.add(new THREE.LineSegments(gridGeo, new THREE.LineBasicMaterial({color: 0x666666})))
         }
      //
      // X and Y axes on grid (highlighted)
      //
      var xAxisGeo = new THREE.BufferGeometry().setFromPoints([
         new THREE.Vector3(gridStart, 0, -0.05), new THREE.Vector3(gridEndX, 0, -0.05)])
      scene.add(new THREE.Line(xAxisGeo, new THREE.LineBasicMaterial({color: 0xff5555})))
      var yAxisGeo = new THREE.BufferGeometry().setFromPoints([
         new THREE.Vector3(0, gridStart, -0.05), new THREE.Vector3(0, gridEndY, -0.05)])
      scene.add(new THREE.Line(yAxisGeo, new THREE.LineBasicMaterial({color: 0x55ff55})))
      //
      // grid labels (mm)
      //
      var labelScale = totalMM / 30
      var labelOff = labelScale * 1.2
      for (var gx = gridStart; gx <= gridEndX; gx += intervalMM) {
         var mm = Math.round(gx)
         scene.add(make_label(mm + '', gx, -labelOff, -0.05, labelScale, '#AAAAAA'))
         }
      for (var gy = gridStart; gy <= gridEndY; gy += intervalMM) {
         var mm = Math.round(gy)
         if (mm === 0) continue
         scene.add(make_label(mm + '', -labelOff * 1.5, gy, -0.05, labelScale, '#AAAAAA'))
         }
      //
      // axis arrows at stock top (user zero point) with labels
      //
      var axLen = totalMM / 8
      var headLen = axLen * 0.18
      var headWid = axLen * 0.09
      var axOrigin = new THREE.Vector3(0, 0, stock_z)
      scene.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), axOrigin, axLen, 0xff5555, headLen, headWid))
      scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), axOrigin, axLen, 0x55ff55, headLen, headWid))
      scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), axOrigin, axLen, 0x5599ff, headLen, headWid))
      scene.add(make_label('X', axLen + labelOff, 0, stock_z, labelScale * 1.1, '#ff5555'))
      scene.add(make_label('Y', 0, axLen + labelOff, stock_z, labelScale * 1.1, '#55ff55'))
      scene.add(make_label('Z', 0, 0, stock_z + axLen + labelOff, labelScale * 1.1, '#5599ff'))
      //
      // grid axis labels (at grid edges)
      //
      scene.add(make_label('X', gridEndX + labelOff, 0, 0, labelScale, '#ff5555'))
      scene.add(make_label('Y', 0, gridEndY + labelOff, 0, labelScale, '#55ff55'))
      //
      // camera setup
      //
      mod.camera = mod.perspCamera
      mod.thetaxy = -0.3
      mod.thetaz = 0
      mod.r = Math.sqrt(stock_x*stock_x + stock_y*stock_y + stock_z*stock_z) * 0.8
      mod.x0 = stock_x / 2
      mod.y0 = stock_y / 2
      mod.stock_x = stock_x
      mod.stock_y = stock_y
      mod.stock_z_val = stock_z
      var camera = mod.camera
      var diagonal = Math.sqrt(stock_x * stock_x + stock_y * stock_y + stock_z * stock_z)
      camera.far = diagonal * 5
      camera.near = diagonal * 0.0001
      if (mod.orthoCamera) {
         mod.orthoCamera.far = diagonal * 5
         mod.orthoCamera.near = diagonal * 0.0001
         }
      camera.position.x = mod.x0 + Math.sin(mod.thetaz) * mod.r * Math.sin(mod.thetaxy)
      camera.position.y = mod.y0 + Math.cos(mod.thetaz) * mod.r * Math.sin(mod.thetaxy)
      camera.position.z = mod.r * Math.cos(mod.thetaxy)
      set_camera_up(camera)
      camera.lookAt(new THREE.Vector3(mod.x0, mod.y0, 0))
      camera.updateProjectionMatrix()
      //
      // update window title and dimensions
      //
      if (mod.win) {
         mod.win.document.title = 'Simulate: ' + mod.name
         }
      //
      // initial HUD: show computing status
      //
      if (mod.winHUDStats) {
         mod.winHUDStats.textContent = 'Computing...'
         }
      if (mod.winHUDDepth) {
         var toolText = 'Tool: '
         if (tool_type === 'ball') {
            toolText += 'ball \u2300' + parseFloat(tool_dia).toFixed(2) + ' mm'
         } else if (tool_type === 'vbit') {
            toolText += 'vbit ' + tool_angle + '\u00b0 \u2300' + parseFloat(tool_dia).toFixed(2) + ' mm'
            if (tool_tip_dia) toolText += ' tip ' + parseFloat(tool_tip_dia).toFixed(2) + ' mm'
         } else {
            toolText += 'flat \u2300' + parseFloat(tool_dia).toFixed(2) + ' mm'
         }
         mod.winHUDDepth.textContent = 'Stock: ' + parseFloat(stock_x).toFixed(2) + ' \u00d7 ' + parseFloat(stock_y).toFixed(2) + ' \u00d7 ' + parseFloat(stock_z).toFixed(1) + ' mm (' + (stock_x/25.4).toFixed(3) + ' \u00d7 ' + (stock_y/25.4).toFixed(3) + ' \u00d7 ' + (stock_z/25.4).toFixed(3) + ' in)  \u2502  ' + toolText
         mod.winHUDDepth.style.display = ''
         }
      update_hud_legend()
      //
      // toolpath overlay
      //
      if (mod.showToolpath) {
         add_toolpath_overlay()
         }
      //
      // render scene with grid/axes visible while computing
      //
      renderer.render(scene, camera)
      //
      // create worker from blob URL
      //
      var blob = new Blob(['(' + simulation_worker.toString() + '())'])
      var url = window.URL.createObjectURL(blob)
      mod.worker = new Worker(url)
      window.URL.revokeObjectURL(url)
      //
      // track triangle count for HUD
      //
      var totalTriangles = 0
      //
      // worker message handler
      //
      mod.worker.onmessage = function(e) {
         var msg = e.data
         if (msg.type === 'chunk') {
            //
            // create mesh from chunk data
            //
            var geo = new THREE.BufferGeometry()
            geo.setAttribute('position', new THREE.Float32BufferAttribute(msg.positions, 3))
            geo.setAttribute('normal', new THREE.Float32BufferAttribute(msg.normals, 3))
            geo.setAttribute('color', new THREE.Float32BufferAttribute(msg.colors, 3))
            geo.setAttribute('uv', new THREE.Float32BufferAttribute(msg.uvs, 2))
            var mesh = new THREE.Mesh(geo, create_material())
            mesh.visible = (mod.showSim !== false)
            scene.add(mesh)
            mod.chunkMeshes.push(mesh)
            totalTriangles += msg.positions.length / 9
            //
            // update HUD progress
            //
            var pct = (msg.progress * 100).toFixed(0)
            if (mod.winHUDStats) {
               mod.winHUDStats.textContent = 'Computing... ' + pct + '%'
               }
            //
            // render with new chunk
            //
            renderer.render(scene, mod.camera)
            }
         else if (msg.type === 'progress') {
            //
            // empty slab, just update HUD
            //
            var pct = (msg.progress * 100).toFixed(0)
            if (mod.winHUDStats) {
               mod.winHUDStats.textContent = 'Computing... ' + pct + '%'
               }
            }
         else if (msg.type === 'done') {
            //
            // merge all chunk meshes into one
            //
            merge_chunk_meshes(scene)
            //
            // final HUD update
            //
            if (mod.winHUDStats) {
               mod.winHUDStats.textContent = ''
               }
            //
            // final render
            //
            renderer.render(scene, mod.camera)
            mod.worker = null
            }
         }
      //
      // post message to worker
      //
      mod.worker.postMessage({
         path: mod.path,
         dpi: mod.dpi,
         tool_dia: tool_dia,
         tool_type: tool_type,
         tool_angle: tool_angle,
         tool_tip_dia: tool_tip_dia,
         stock_x: stock_x,
         stock_y: stock_y,
         stock_z: stock_z,
         res: res,
         nx: nx,
         ny: ny,
         nz: nz,
         material: material
         })
      }
   //
   // HSL to RGB conversion (h: 0-360, s: 0-1, l: 0-1) -> [r, g, b] 0-1
   //
   function hsl2rgb(h, s, l) {
      var c = (1 - Math.abs(2 * l - 1)) * s
      var x = c * (1 - Math.abs((h / 60) % 2 - 1))
      var m = l - c / 2
      var r, g, b
      if (h < 60)       { r = c; g = x; b = 0 }
      else if (h < 120) { r = x; g = c; b = 0 }
      else if (h < 180) { r = 0; g = c; b = x }
      else if (h < 240) { r = 0; g = x; b = c }
      else if (h < 300) { r = x; g = 0; b = c }
      else               { r = c; g = 0; b = x }
      return [r + m, g + m, b + m]
      }
   //
   // add toolpath overlay
   //
   function add_toolpath_overlay() {
      var scene = mod.scene
      var path = mod.path
      var dpi = mod.dpi
      var stock_z = mod.stock_z_input._full || 1.6
      if (!path) return
      mod.toolpathObjects = []
      //
      // count total line segments + find Z range
      //
      var totalPts = 0
      var minZ = Infinity, maxZ = -Infinity
      for (var seg = 0; seg < path.length; ++seg) {
         totalPts += Math.max(0, path[seg].length - 1)
         for (var pt = 0; pt < path[seg].length; ++pt) {
            var pz = (path[seg][pt][2] || 0) * 25.4 / dpi
            if (pz < minZ) minZ = pz
            if (pz > maxZ) maxZ = pz
            }
         }
      var zRange = maxZ - minZ
      var hasDepth = zRange > 0.001
      //
      // material-adaptive rainbow lightness
      // dark materials -> brighter rainbow, light materials -> darker rainbow
      //
      var mat = mod.material_select ? mod.material_select.value : 'PCB'
      var baseL = 0.5
      if (mat === 'PCB') baseL = 0.45
      else if (mat === 'Wax') baseL = 0.65
      else if (mat === 'Wood') baseL = 0.55
      else if (mat === 'Plywood') baseL = 0.55
      else if (mat === 'Aluminum') baseL = 0.45
      //
      // rainbow cut lines: hue=progress (0-240), depth modulates saturation+lightness
      //
      var cutPositions = []
      var cutColors = []
      var ptIndex = 0
      for (var seg = 0; seg < path.length; ++seg) {
         for (var pt = 1; pt < path[seg].length; ++pt) {
            var s = path[seg][pt-1]
            var e = path[seg][pt]
            var sx = s[0] * 25.4 / dpi
            var sy = s[1] * 25.4 / dpi
            var sz_off = (s[2] || 0) * 25.4 / dpi
            var ex = e[0] * 25.4 / dpi
            var ey = e[1] * 25.4 / dpi
            var ez_off = (e[2] || 0) * 25.4 / dpi
            cutPositions.push(sx, sy, stock_z + sz_off, ex, ey, stock_z + ez_off)
            //
            // progress along toolpath -> hue (red 0 -> blue 240)
            //
            var progress = totalPts > 1 ? ptIndex / (totalPts - 1) : 0
            var hue = progress * 240
            //
            // depth -> saturation boost + slight lightness shift
            //
            var dt = hasDepth ? (sz_off - minZ) / zRange : 0.5
            var sat = 0.75 + (1 - dt) * 0.25
            var lit = baseL + dt * 0.1
            var sc = hsl2rgb(hue, sat, lit)
            var ec = sc
            cutColors.push(sc[0], sc[1], sc[2], ec[0], ec[1], ec[2])
            ptIndex++
            }
         }
      if (cutPositions.length > 0) {
         var geo = new THREE.BufferGeometry()
         geo.setAttribute('position', new THREE.Float32BufferAttribute(cutPositions, 3))
         geo.setAttribute('color', new THREE.Float32BufferAttribute(cutColors, 3))
         var mat = new THREE.LineBasicMaterial({
            vertexColors: true,
            depthTest: false,
            depthWrite: false
            })
         var cutLines = new THREE.LineSegments(geo, mat)
         cutLines.renderOrder = 1
         scene.add(cutLines)
         mod.toolpathObjects.push(cutLines)
         }
      //
      // rapids (orange arrows) — retract, travel, plunge
      //
      var arrow_size = Math.max(mod.stock_x, mod.stock_y) / 400 + 0.2
      var jog_z = stock_z + 2
      // origin to first point
      if (path.length > 0 && path[0].length > 0) {
         var fp = path[0][0]
         var fx = fp[0] * 25.4 / dpi
         var fy = fp[1] * 25.4 / dpi
         var fz = stock_z + (fp[2] || 0) * 25.4 / dpi
         add_rapid_arrow([0, 0, jog_z], [fx, fy, jog_z], arrow_size)
         add_rapid_arrow([fx, fy, jog_z], [fx, fy, fz], arrow_size)
         }
      // between segments
      for (var seg = 1; seg < path.length; ++seg) {
         var prevSeg = path[seg-1]
         var lp = prevSeg[prevSeg.length - 1]
         var np = path[seg][0]
         var lx = lp[0] * 25.4 / dpi
         var ly = lp[1] * 25.4 / dpi
         var lz = stock_z + (lp[2] || 0) * 25.4 / dpi
         var nnx = np[0] * 25.4 / dpi
         var nny = np[1] * 25.4 / dpi
         var nnz = stock_z + (np[2] || 0) * 25.4 / dpi
         add_rapid_arrow([lx, ly, lz], [lx, ly, jog_z], arrow_size)
         add_rapid_arrow([lx, ly, jog_z], [nnx, nny, jog_z], arrow_size)
         add_rapid_arrow([nnx, nny, jog_z], [nnx, nny, nnz], arrow_size)
         }
      // last point to origin
      if (path.length > 0) {
         var lastSeg = path[path.length - 1]
         if (lastSeg.length > 0) {
            var ep = lastSeg[lastSeg.length - 1]
            var epx = ep[0] * 25.4 / dpi
            var epy = ep[1] * 25.4 / dpi
            var epz = stock_z + (ep[2] || 0) * 25.4 / dpi
            add_rapid_arrow([epx, epy, epz], [epx, epy, jog_z], arrow_size)
            add_rapid_arrow([epx, epy, jog_z], [0, 0, jog_z], arrow_size)
            }
         }
      //
      // start marker
      //
      if (path.length > 0 && path[0].length > 0) {
         var spx = 0
         var spy = 0
         var spz = stock_z
         var labelScale = Math.max(mod.stock_x, mod.stock_y) / 30
         var labelOff = labelScale * 1.2
         var startLabel = make_label('START', spx, spy + labelOff * 2, spz, labelScale * 1.2, '#FF75B5')
         startLabel.renderOrder = 1
         startLabel.material.depthTest = false
         scene.add(startLabel)
         mod.toolpathObjects.push(startLabel)
         var sphereGeo = new THREE.SphereGeometry(arrow_size * 0.8, 8, 8)
         var sphereMat = new THREE.MeshBasicMaterial({color: 0xFF75B5, depthTest: false})
         var sphere = new THREE.Mesh(sphereGeo, sphereMat)
         sphere.renderOrder = 1
         sphere.position.set(spx, spy, spz)
         scene.add(sphere)
         mod.toolpathObjects.push(sphere)
         }
      //
      // flatten path for scrubber + build tool mesh
      //
      var flatPath = []
      var cumDist = [0]
      function addPt(x, y, z) {
         flatPath.push([x, y, z])
         if (flatPath.length > 1) {
            var prev = flatPath[flatPath.length - 2]
            var dx = x - prev[0], dy = y - prev[1], dz = z - prev[2]
            cumDist.push(cumDist[cumDist.length - 1] + Math.sqrt(dx*dx + dy*dy + dz*dz))
            }
         }
      function ptXYZ(p) {
         return [p[0] * 25.4 / dpi, p[1] * 25.4 / dpi, stock_z + (p[2] || 0) * 25.4 / dpi]
         }
      //
      // build complete machine path: origin → rapids → cuts → rapids → origin
      //
      addPt(0, 0, stock_z)
      addPt(0, 0, jog_z)
      for (var seg = 0; seg < path.length; ++seg) {
         if (path[seg].length === 0) continue
         var fp = ptXYZ(path[seg][0])
         //
         // rapid to segment start
         //
         if (seg === 0) {
            addPt(fp[0], fp[1], jog_z)
            } else {
            var prev = ptXYZ(path[seg-1][path[seg-1].length - 1])
            addPt(prev[0], prev[1], jog_z)
            addPt(fp[0], fp[1], jog_z)
            }
         addPt(fp[0], fp[1], fp[2])
         //
         // cutting points
         //
         for (var pt = 1; pt < path[seg].length; ++pt) {
            var p = ptXYZ(path[seg][pt])
            addPt(p[0], p[1], p[2])
            }
         }
      //
      // retract and return to origin
      //
      if (path.length > 0) {
         var lastSeg = path[path.length - 1]
         if (lastSeg.length > 0) {
            var ep = ptXYZ(lastSeg[lastSeg.length - 1])
            addPt(ep[0], ep[1], jog_z)
            addPt(0, 0, jog_z)
            }
         }
      mod.flatPath = flatPath
      mod.cumDist = cumDist
      //
      // chrome end mill: cutting end + cone + shank
      //
      if (flatPath.length > 0) {
         var tool_dia = mod.tool_dia_input._full || 0.4
         var tool_r = tool_dia / 2
         var tool_type = mod.tool_type_select ? mod.tool_type_select.value : 'flat'
         var tool_angle = parseFloat(mod.tool_angle_input.value) || 30
         var tool_tip_dia = mod.tool_tip_input._full || 0
         var shank_dia = Math.max(tool_dia * 2, 3.175)
         var shank_r = shank_dia / 2
         var shank_len = Math.max(stock_z * 2, 15)
         var chromeMat = new THREE.MeshPhysicalMaterial({
            color: 0x999999,
            metalness: 1.0,
            roughness: 0.1,
            envMap: mod.envMap || null,
            envMapIntensity: 1.2,
            clearcoat: 0.8,
            clearcoatRoughness: 0.05,
            reflectivity: 1.0
            })
         var toolGroup = new THREE.Group()
         var y_top = 0
         //
         if (tool_type === 'vbit') {
            //
            // vbit: truncated v-cone (tip_r to shank_r) → shank
            //
            var tip_r = (tool_tip_dia || 0) / 2
            var half_angle = tool_angle * Math.PI / 360
            var v_height = (shank_r - tip_r) / Math.tan(half_angle)
            if (v_height < 0.1) v_height = 0.1
            var vGeo = new THREE.CylinderGeometry(shank_r, tip_r, v_height, 24)
            vGeo.translate(0, v_height / 2, 0)
            toolGroup.add(new THREE.Mesh(vGeo, chromeMat))
            y_top = v_height
            }
         else if (tool_type === 'ball') {
            //
            // ball: hemisphere + cylindrical flutes
            //
            var ballGeo = new THREE.SphereGeometry(tool_r, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)
            toolGroup.add(new THREE.Mesh(ballGeo, chromeMat))
            var flute_len = Math.max(tool_dia * 3, 2)
            var fluteGeo = new THREE.CylinderGeometry(tool_r, tool_r, flute_len, 16)
            fluteGeo.translate(0, flute_len / 2, 0)
            toolGroup.add(new THREE.Mesh(fluteGeo, chromeMat))
            y_top = flute_len
            }
         else {
            //
            // flat end mill: cylindrical flutes
            //
            var flute_len = Math.max(tool_dia * 3, 2)
            var fluteGeo = new THREE.CylinderGeometry(tool_r, tool_r, flute_len, 16)
            fluteGeo.translate(0, flute_len / 2, 0)
            toolGroup.add(new THREE.Mesh(fluteGeo, chromeMat))
            y_top = flute_len
            }
         //
         // taper from cutting end to shank (skip for vbit — cone already reaches shank)
         //
         if (tool_type !== 'vbit') {
            var cone_len = Math.max((shank_r - tool_r) * 2, 1)
            var coneGeo = new THREE.CylinderGeometry(shank_r, tool_r, cone_len, 16)
            coneGeo.translate(0, y_top + cone_len / 2, 0)
            toolGroup.add(new THREE.Mesh(coneGeo, chromeMat))
            y_top += cone_len
            }
         //
         // shank
         //
         var shankGeo = new THREE.CylinderGeometry(shank_r, shank_r, shank_len, 16)
         shankGeo.translate(0, y_top + shank_len / 2, 0)
         toolGroup.add(new THREE.Mesh(shankGeo, chromeMat))
         //
         // orient tool: Y-up cylinder -> Z-up scene
         //
         toolGroup.rotation.x = Math.PI / 2
         toolGroup.position.set(0, 0, stock_z)
         toolGroup.traverse(function(child) {
            child.renderOrder = 2
            })
         scene.add(toolGroup)
         mod.toolGroup = toolGroup
         mod.toolpathObjects.push(toolGroup)
         //
         // show scrubber
         //
         if (mod.scrubber) {
            mod.scrubber.style.display = 'flex'
            mod.scrubSlider.value = '0'
            mod.scrubPos.textContent = '0%'
            mod.scrubPlaying = false
            }
         }
      //
      // add_rapid_arrow helper
      //
      function add_rapid_arrow(start, end, size) {
         var origin = new THREE.Vector3(start[0], start[1], start[2])
         var target = new THREE.Vector3(end[0], end[1], end[2])
         var length = new THREE.Vector3().subVectors(target, origin).length()
         if (length < 0.001) return
         if (length <= size) {
            var geo = new THREE.BufferGeometry().setFromPoints([origin, target])
            var line = new THREE.Line(geo, new THREE.LineBasicMaterial({
               color: 0xFF8800, depthTest: true, depthWrite: false, transparent: true, opacity: 0.4}))
            line.renderOrder = 1
            scene.add(line)
            mod.toolpathObjects.push(line)
            return
            }
         var direction = new THREE.Vector3().subVectors(target, origin).normalize()
         var arrow = new THREE.ArrowHelper(direction, origin, length, 0xFF8800, size, size)
         arrow.renderOrder = 1
         arrow.traverse(function(child) {
            if (child.material) {
               child.material.depthTest = true
               child.material.depthWrite = false
               child.material.transparent = true
               child.material.opacity = 0.4
               }
            child.renderOrder = 1
            })
         scene.add(arrow)
         mod.toolpathObjects.push(arrow)
         }
      }
   //
   // make_label (text sprite)
   //
   function make_label(text, x, y, z, scale, color) {
      var canvas = document.createElement('canvas')
      var ctx = canvas.getContext('2d')
      canvas.width = 256
      canvas.height = 128
      ctx.font = '48px sans-serif'
      ctx.fillStyle = color || '#888888'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, 128, 64)
      var texture = new THREE.CanvasTexture(canvas)
      var material = new THREE.SpriteMaterial({map: texture, transparent: true})
      var sprite = new THREE.Sprite(material)
      sprite.position.set(x, y, z)
      sprite.scale.set(scale * 2, scale, 1)
      return sprite
      }
   //
   // update_hud_legend — rebuild legend items based on material
   //
   function update_hud_legend() {
      var legend = mod.winHUDLegend
      if (!legend) return
      while (legend.firstChild) legend.removeChild(legend.firstChild)
      var mat = mod.material_select ? mod.material_select.value : 'PCB'
      if (mod.showSim !== false) {
         if (mat === 'PCB') {
            add_legend_item(legend, 'vt-copper', 'Copper')
            add_legend_item(legend, 'vt-fr1', 'FR1')
         } else if (mat === 'Wax') {
            add_legend_item(legend, 'vt-wax', 'Wax')
         } else if (mat === 'Wood') {
            add_legend_item(legend, 'vt-wood', 'Wood')
         } else if (mat === 'Plywood') {
            add_legend_item(legend, 'vt-plyface', 'Face')
            add_legend_item(legend, 'vt-plycore', 'Core')
            add_legend_item(legend, 'vt-plyglue', 'Glue')
         } else if (mat === 'Aluminum') {
            add_legend_item(legend, 'vt-aluminum', 'Aluminum')
         }
      }
      if (mod.showToolpath) {
         add_legend_item(legend, 'vt-start', 'Start')
         //
         // gradient bar between start and end
         //
         var grad = mod.win.document.createElement('span')
         grad.className = 'vt-gradient'
         legend.appendChild(grad)
         add_legend_item(legend, 'vt-end', 'End')
         add_legend_item(legend, 'vt-rapid', 'Rapid')
      }
      }
   function add_legend_item(container, className, label) {
      var win = mod.win
      if (!win) return
      var span = win.document.createElement('span')
      span.className = className
      span.appendChild(win.document.createTextNode(label))
      container.appendChild(span)
      }
   //
   // open_view_window
   //
   function open_view_window() {
      //
      // globals
      //
      var container, scene, camera, renderer, win
      //
      // open the window
      //
      open_window()
      //
      // open_window
      //
      function open_window() {
         //
         // open window
         //
         win = window.open('')
         mod.win = win
         mod.showToolpath = false
         mod.showSim = true
         mod.autoOrbit = true
         mod.sectionActive = false
         mod.sectionAxis = -1
         mod.backMesh = null
         mod.toolpathObjects = []
         //
         // load three.js + RGBELoader
         //
         var script = document.createElement('script')
         script.type = 'text/javascript'
         script.onload = function() {
            var script2 = document.createElement('script')
            script2.type = 'text/javascript'
            script2.onload = init_window
            script2.src = 'js/three.js/RGBELoader.js'
            mod.div.appendChild(script2)
            }
         script.src = 'js/three.js/three.min.js'
         mod.div.appendChild(script)
         }
      //
      // init_window
      //
      function init_window() {
         //
         // window title and favicon
         //
         win.document.title = 'Simulate' + (mod.name ? ': ' + mod.name : '')
         var favicon = win.document.createElement('link')
         favicon.rel = 'icon'
         favicon.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2319F9D8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
         win.document.head.appendChild(favicon)
         //
         // styles
         //
         var style = win.document.createElement('style')
         style.textContent = '* { margin: 0; padding: 0; box-sizing: border-box; }'
            + ' body { background: #3A3B3C; color: #E6E6E6; font-family: monospace; font-size: 13px; overflow: hidden; }'
            + ' .vt-toolbar { display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: #2A2B2C; border-bottom: 1px solid #4A4B4C; height: 38px; }'
            + ' .vt-toolbar button { background: #3A3B3C; color: #E6E6E6; border: none; border-radius: 4px; padding: 4px 10px; font-family: monospace; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; }'
            + ' .vt-toolbar button:hover { background: #4A4B4C; }'
            + ' .vt-toolbar button.active { background: #19F9D8; color: #1E1F20; }'
            + ' .vt-sep { width: 1px; height: 20px; background: #3A3B3C; flex-shrink: 0; }'
            + ' .vt-info { color: #888; font-size: 12px; }'
            + ' .vt-spacer { flex: 1; }'
            + ' .vt-hud { position: fixed; bottom: 12px; left: 12px; background: rgba(30,31,32,0.85); color: #AAA; padding: 8px 12px; border-radius: 4px; font-size: 11px; line-height: 1.6; pointer-events: none; z-index: 10; }'
            + ' .vt-legend { position: fixed; top: 50px; right: 12px; background: rgba(30,31,32,0.85); padding: 8px 14px; border-radius: 4px; display: flex; flex-direction: column; gap: 5px; pointer-events: none; z-index: 10; }'
            + ' .vt-legend span { font-size: 12px; }'
            + ' .vt-gradient { width: 100%; height: 3px; border-radius: 2px; background: linear-gradient(to right, #FF0000, #FFFF00, #00FF00, #00FFFF, #0055FF); }'
            + ' .vt-copper::before { content: "\\25A0 "; color: #B87333; }'
            + ' .vt-fr1::before { content: "\\25A0 "; color: #C4A265; }'
            + ' .vt-start::before { content: "\\25CF "; color: #FF0000; }'
            + ''
            + ' .vt-end::before { content: "\\25CF "; color: #0055FF; }'
            + ' .vt-rapid::before { content: "\\25CF "; color: #FF8800; }'
            + ' .vt-wax::before { content: "\\25A0 "; color: #3A4FBA; }'
            + ' .vt-wood::before { content: "\\25A0 "; color: #D4C4A0; }'
            + ' .vt-plyface::before { content: "\\25A0 "; color: #DBCCA9; }'
            + ' .vt-plycore::before { content: "\\25A0 "; color: #856B47; }'
            + ' .vt-plyglue::before { content: "\\25A0 "; color: #594024; }'
            + ' .vt-aluminum::before { content: "\\25A0 "; color: #D4D4D8; }'
            + ' .vt-scrubber { display: none; align-items: center; gap: 6px; }'
            + ' .vt-scrubber input[type=range] { width: 140px; accent-color: #19F9D8; }'
            + ' .vt-scrubber .vt-pos { color: #888; font-size: 11px; min-width: 32px; text-align: right; }'
         win.document.head.appendChild(style)
         //
         // toolbar
         //
         var toolbar = win.document.createElement('div')
         toolbar.className = 'vt-toolbar'
         //
         // close button
         //
         var closeBtn = win.document.createElement('button')
         closeBtn.appendChild(win.document.createTextNode('\u2715 Close'))
         closeBtn.addEventListener('click', function() {
            win.close()
            mod.win = undefined
            })
         toolbar.appendChild(closeBtn)
         //
         // reset button
         //
         var resetBtn = win.document.createElement('button')
         resetBtn.appendChild(win.document.createTextNode('\u21BA Reset'))
         resetBtn.addEventListener('click', function() {
            show_simulation()
            })
         toolbar.appendChild(resetBtn)
         //
         // separator
         //
         var sep1 = win.document.createElement('div')
         sep1.className = 'vt-sep'
         toolbar.appendChild(sep1)
         //
         // view preset buttons
         //
         var views = [
            {label: 'Top', ortho: true, setup: function(cam) {
               cam.position.set(mod.x0, mod.y0, mod.r)
               cam.up.set(0, 1, 0)
               cam.lookAt(new THREE.Vector3(mod.x0, mod.y0, 0))
               mod.thetaxy = -0.01
               mod.thetaz = 0
               }},
            {label: 'Front', ortho: true, setup: function(cam) {
               cam.position.set(mod.x0, mod.y0 - mod.r, 0)
               cam.up.set(0, 0, 1)
               cam.lookAt(new THREE.Vector3(mod.x0, mod.y0, 0))
               mod.thetaxy = -(Math.PI / 2 - 0.01)
               mod.thetaz = 0
               }},
            {label: 'Left', ortho: true, setup: function(cam) {
               cam.position.set(mod.x0 - mod.r, mod.y0, 0)
               cam.up.set(0, 0, 1)
               cam.lookAt(new THREE.Vector3(mod.x0, mod.y0, 0))
               mod.thetaxy = -(Math.PI / 2 - 0.01)
               mod.thetaz = Math.PI / 2
               }},
            {label: '3D', ortho: false, setup: function(cam) {
               mod.thetaxy = -0.3
               mod.thetaz = 0
               cam.position.x = mod.x0 + Math.sin(mod.thetaz) * mod.r * Math.sin(mod.thetaxy)
               cam.position.y = mod.y0 + Math.cos(mod.thetaz) * mod.r * Math.sin(mod.thetaxy)
               cam.position.z = mod.r * Math.cos(mod.thetaxy)
               set_camera_up(cam)
               cam.lookAt(new THREE.Vector3(mod.x0, mod.y0, 0))
               }}
            ]
         views.forEach(function(v) {
            var btn = win.document.createElement('button')
            btn.appendChild(win.document.createTextNode(v.label))
            btn.addEventListener('click', function() {
               mod.camera = v.ortho ? mod.orthoCamera : mod.perspCamera
               var cam = mod.camera
               v.setup(cam)
               if (cam.isOrthographicCamera) {
                  var aspect = win.innerWidth / (win.innerHeight - 38)
                  cam.left = -mod.r * aspect
                  cam.right = mod.r * aspect
                  cam.top = mod.r
                  cam.bottom = -mod.r
                  }
               cam.updateProjectionMatrix()
               renderer.render(scene, cam)
               })
            toolbar.appendChild(btn)
            })
         //
         // separator
         //
         var sep2 = win.document.createElement('div')
         sep2.className = 'vt-sep'
         toolbar.appendChild(sep2)
         //
         // simulation toggle button
         //
         var simBtn = win.document.createElement('button')
         simBtn.classList.add('active')
         simBtn.appendChild(win.document.createTextNode('Stock'))
         simBtn.addEventListener('click', function() {
            mod.showSim = !mod.showSim
            if (mod.showSim) {
               simBtn.classList.add('active')
            } else {
               simBtn.classList.remove('active')
               }
            if (mod.stockMesh) mod.stockMesh.visible = mod.showSim
            if (mod.backMesh) mod.backMesh.visible = mod.showSim && mod.sectionActive
            for (var i = 0; i < mod.chunkMeshes.length; i++) {
               mod.chunkMeshes[i].visible = mod.showSim
               }
            renderer.render(scene, mod.camera)
            })
         toolbar.appendChild(simBtn)
         //
         // toolpath toggle button
         //
         var tpBtn = win.document.createElement('button')
         tpBtn.appendChild(win.document.createTextNode('Toolpath'))
         tpBtn.addEventListener('click', function() {
            mod.showToolpath = !mod.showToolpath
            if (mod.showToolpath) {
               tpBtn.classList.add('active')
               add_toolpath_overlay()
            } else {
               tpBtn.classList.remove('active')
               // remove toolpath objects
               for (var i = 0; i < mod.toolpathObjects.length; i++) {
                  var obj = mod.toolpathObjects[i]
                  scene.remove(obj)
                  if (obj.geometry) obj.geometry.dispose()
                  if (obj.material) obj.material.dispose()
                  // ArrowHelper children
                  if (obj.traverse) obj.traverse(function(child) {
                     if (child !== obj) {
                        if (child.geometry) child.geometry.dispose()
                        if (child.material) child.material.dispose()
                        }
                     })
                  }
               mod.toolpathObjects = []
               mod.toolGroup = null
               mod.flatPath = []
               mod.scrubPlaying = false
               if (mod.scrubber) mod.scrubber.style.display = 'none'
               }
            update_hud_legend()
            renderer.render(scene, mod.camera)
            })
         toolbar.appendChild(tpBtn)
         //
         // toolpath scrubber (play + slider + position)
         //
         var scrubber = win.document.createElement('div')
         scrubber.className = 'vt-scrubber'
         var playBtn = win.document.createElement('button')
         playBtn.appendChild(win.document.createTextNode('\u25B6'))
         playBtn.style.padding = '4px 6px'
         playBtn.style.minWidth = '28px'
         playBtn.addEventListener('click', function() {
            if (!mod.scrubPlaying && mod.scrubValue >= 1000) {
               mod.scrubValue = 0
               scrubSlider.value = '0'
               move_tool_to(0)
               }
            mod.scrubPlaying = !mod.scrubPlaying
            playBtn.textContent = mod.scrubPlaying ? '\u275A\u275A' : '\u25B6'
            if (mod.scrubPlaying) {
               mod.scrubLastTime = performance.now()
               scrub_animate()
               }
            })
         scrubber.appendChild(playBtn)
         //
         // speed selector
         //
         var speedBtn = win.document.createElement('button')
         speedBtn.style.padding = '4px 6px'
         speedBtn.style.minWidth = '36px'
         speedBtn.style.fontSize = '11px'
         var speeds = [1, 5, 10, 50, 100, 500]
         var speedIdx = 2
         mod.scrubSpeed = speeds[speedIdx]
         speedBtn.textContent = speeds[speedIdx] + 'x'
         speedBtn.addEventListener('click', function() {
            speedIdx = (speedIdx + 1) % speeds.length
            mod.scrubSpeed = speeds[speedIdx]
            speedBtn.textContent = speeds[speedIdx] + 'x'
            })
         scrubber.appendChild(speedBtn)
         var scrubSlider = win.document.createElement('input')
         scrubSlider.type = 'range'
         scrubSlider.min = '0'
         scrubSlider.max = '1000'
         scrubSlider.value = '0'
         mod.scrubValue = 0
         scrubSlider.addEventListener('input', function() {
            mod.scrubValue = parseFloat(scrubSlider.value)
            move_tool_to(mod.scrubValue / 1000)
            })
         scrubber.appendChild(scrubSlider)
         var scrubPos = win.document.createElement('span')
         scrubPos.className = 'vt-pos'
         scrubPos.textContent = '0%'
         scrubber.appendChild(scrubPos)
         toolbar.appendChild(scrubber)
         mod.scrubber = scrubber
         mod.scrubSlider = scrubSlider
         mod.scrubPos = scrubPos
         mod.scrubPlaying = false
         //
         // scrub animation loop
         //
         function scrub_animate() {
            if (!mod.scrubPlaying) return
            var now = performance.now()
            var dt = (now - mod.scrubLastTime) / 1000
            mod.scrubLastTime = now
            //
            // 1x = real machining time (totalDist / 2.5 mm/s)
            //
            var totalDist = (mod.cumDist && mod.cumDist.length > 1)
               ? mod.cumDist[mod.cumDist.length - 1] : 1000
            var realDuration = Math.max(1, totalDist / 2.5)
            var step = (dt * (mod.scrubSpeed || 500) / realDuration) * 1000
            var v = mod.scrubValue
            v += step
            if (v > 1000) {
               v = 1000
               mod.scrubPlaying = false
               playBtn.textContent = '\u25B6'
               }
            mod.scrubValue = v
            scrubSlider.value = v
            move_tool_to(v / 1000)
            win.requestAnimationFrame(scrub_animate)
            }
         //
         // move tool to normalized position (0-1) along flattened path
         //
         function move_tool_to(t) {
            if (!mod.flatPath || mod.flatPath.length === 0 || !mod.cumDist) return
            if (t <= 0) {
               if (mod.toolGroup) mod.toolGroup.position.set(0, 0, mod.stock_z_input._full || 1.6)
               scrubPos.textContent = '0%'
               renderer.render(mod.scene, mod.camera)
               return
               }
            var totalDist = mod.cumDist[mod.cumDist.length - 1]
            var targetDist = t * totalDist
            //
            // binary search for segment
            //
            var lo = 0, hi = mod.cumDist.length - 1
            while (lo < hi - 1) {
               var mid = (lo + hi) >> 1
               if (mod.cumDist[mid] <= targetDist) lo = mid
               else hi = mid
               }
            var segDist = mod.cumDist[hi] - mod.cumDist[lo]
            var frac = segDist > 0 ? (targetDist - mod.cumDist[lo]) / segDist : 0
            var p0 = mod.flatPath[lo]
            var p1 = mod.flatPath[hi]
            var x = p0[0] + frac * (p1[0] - p0[0])
            var y = p0[1] + frac * (p1[1] - p0[1])
            var z = p0[2] + frac * (p1[2] - p0[2])
            if (mod.toolGroup) {
               mod.toolGroup.position.set(x, y, z)
               }
            scrubPos.textContent = Math.round(t * 100) + '%'
            renderer.render(mod.scene, mod.camera)
            }
         //
         // section plane buttons (X|, Y|, Z|) with slider
         //
         var sectionSlider = win.document.createElement('input')
         sectionSlider.type = 'range'
         sectionSlider.min = '0'
         sectionSlider.max = '100'
         sectionSlider.value = '100'
         sectionSlider.style.width = '100px'
         sectionSlider.style.verticalAlign = 'middle'
         sectionSlider.style.display = 'none'
         sectionSlider.style.accentColor = '#19F9D8'
         //
         var sectionAxes = [
            {label: 'X\u2502', normal: new THREE.Vector3(1, 0, 0),
               clipRange: function() { return {min: -mod.stock_x, max: 0} }},
            {label: 'Y\u2502', normal: new THREE.Vector3(0, 1, 0),
               clipRange: function() { return {min: -mod.stock_y, max: 0} }},
            {label: 'Z\u2502', normal: new THREE.Vector3(0, 0, -1),
               clipRange: function() { return {min: 0, max: mod.stock_z_val} }}
         ]
         var sectionBtns = []
         //
         sectionAxes.forEach(function(axis, idx) {
            var btn = win.document.createElement('button')
            btn.appendChild(win.document.createTextNode(axis.label))
            btn.addEventListener('click', function() {
               if (mod.sectionAxis === idx) {
                  // deactivate
                  deactivate_section()
               } else {
                  // activate this axis (deactivate any other)
                  mod.sectionAxis = idx
                  for (var i = 0; i < sectionBtns.length; i++) {
                     sectionBtns[i].classList.remove('active')
                  }
                  btn.classList.add('active')
                  sectionSlider.style.display = ''
                  sectionSlider.value = '100'
                  mod.sectionActive = true
                  mod.clipPlane = new THREE.Plane(axis.normal.clone(), 0)
                  var range = axis.clipRange()
                  mod.clipMin = range.min
                  mod.clipMax = range.max
                  update_clip_plane()
               }
            })
            sectionBtns.push(btn)
            toolbar.appendChild(btn)
         })
         toolbar.appendChild(sectionSlider)
         //
         function deactivate_section() {
            mod.sectionActive = false
            mod.sectionAxis = -1
            for (var i = 0; i < sectionBtns.length; i++) {
               sectionBtns[i].classList.remove('active')
            }
            sectionSlider.style.display = 'none'
            // remove clipping, cap plane, and hide back-face mesh
            scene.traverse(function(obj) {
               if (obj.isMesh && obj.material) {
                  obj.material.clippingPlanes = []
               }
            })
            if (mod.backMesh) mod.backMesh.visible = false
            renderer.render(scene, mod.camera)
         }
         //
         sectionSlider.addEventListener('input', function() {
            update_clip_plane()
         })
         //
         function update_clip_plane() {
            if (!mod.clipPlane) return
            var t = parseFloat(sectionSlider.value) / 100
            mod.clipPlane.constant = mod.clipMin + t * (mod.clipMax - mod.clipMin)
            //
            // apply clipping to stock meshes only (not grid lines)
            //
            scene.traverse(function(obj) {
               if (obj.isMesh && obj.material) {
                  obj.material.clippingPlanes = [mod.clipPlane]
               }
            })
            if (mod.backMesh) mod.backMesh.visible = true
            renderer.render(scene, mod.camera)
         }
         //
         // orbit toggle button
         //
         var orbitBtn = win.document.createElement('button')
         orbitBtn.classList.add('active')
         orbitBtn.appendChild(win.document.createTextNode('Orbit'))
         orbitBtn.addEventListener('click', function() {
            mod.autoOrbit = !mod.autoOrbit
            if (mod.autoOrbit) {
               orbitBtn.classList.add('active')
               orbit_step()
            } else {
               orbitBtn.classList.remove('active')
               }
            })
         toolbar.appendChild(orbitBtn)
         //
         // orbit animation loop
         //
         function orbit_step() {
            if (!mod.autoOrbit) return
            var cam = mod.camera
            mod.thetaz += 0.00125
            cam.position.x = mod.x0 + Math.sin(mod.thetaz) * mod.r * Math.sin(mod.thetaxy)
            cam.position.y = mod.y0 + Math.cos(mod.thetaz) * mod.r * Math.sin(mod.thetaxy)
            cam.position.z = mod.r * Math.cos(mod.thetaxy)
            set_camera_up(cam)
            cam.lookAt(new THREE.Vector3(mod.x0, mod.y0, 0))
            cam.updateProjectionMatrix()
            renderer.render(scene, cam)
            win.requestAnimationFrame(orbit_step)
            }
         //
         // separator
         //
         var sep3 = win.document.createElement('div')
         sep3.className = 'vt-sep'
         toolbar.appendChild(sep3)
         //
         // controls hint
         //
         var info = win.document.createElement('span')
         info.className = 'vt-info'
         info.appendChild(win.document.createTextNode('left: pan \u00a0\u2502\u00a0 right: rotate \u00a0\u2502\u00a0 scroll: zoom'))
         toolbar.appendChild(info)
         //
         win.document.body.appendChild(toolbar)
         //
         // HUD overlay
         //
         mod.winHUDStats = win.document.createElement('div')
         mod.winHUDDepth = win.document.createElement('div')
         var hudLegend = win.document.createElement('div')
         hudLegend.className = 'vt-legend'
         mod.winHUDLegend = hudLegend
         var hud = win.document.createElement('div')
         hud.className = 'vt-hud'
         hud.appendChild(mod.winHUDStats)
         hud.appendChild(mod.winHUDDepth)
         win.document.body.appendChild(hud)
         win.document.body.appendChild(hudLegend)
         //
         // GL container
         //
         container = win.document.createElement('div')
         container.style.width = '100%'
         container.style.height = 'calc(100vh - 38px)'
         container.style.overflow = 'hidden'
         win.document.body.appendChild(container)
         //
         // event handlers
         //
         container.addEventListener('contextmenu', context_menu)
         container.addEventListener('mousedown', mouse_down)
         container.addEventListener('mouseup', mouse_up)
         container.addEventListener('mousemove', mouse_move)
         container.addEventListener('wheel', mouse_wheel)
         //
         // add scene
         //
         scene = new THREE.Scene()
         mod.scene = scene
         var width = win.innerWidth
         var height = win.innerHeight - 38
         var aspect = width / height
         var near = 0.001
         var far = 100000
         camera = new THREE.PerspectiveCamera(90, aspect, near, far)
         mod.perspCamera = camera
         mod.camera = camera
         scene.add(camera)
         mod.orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -far, far)
         scene.add(mod.orthoCamera)
         //
         // add renderer
         //
         renderer = new THREE.WebGLRenderer({antialias: true})
         mod.renderer = renderer
         renderer.localClippingEnabled = true
         renderer.setClearColor(0x3A3B3C)
         renderer.setSize(width, height)
         container.appendChild(renderer.domElement)
         //
         // studio environment map (canvas-painted equirectangular)
         //
         function make_studio_env() {
            var w = 512, h = 256
            var canvas = document.createElement('canvas')
            canvas.width = w
            canvas.height = h
            var ctx = canvas.getContext('2d')
            //
            // sky gradient (top half: blue-gray sky)
            //
            var skyGrad = ctx.createLinearGradient(0, 0, 0, h/2)
            skyGrad.addColorStop(0, '#6B7B8D')
            skyGrad.addColorStop(0.7, '#9EA8B0')
            skyGrad.addColorStop(1, '#C8C4BC')
            ctx.fillStyle = skyGrad
            ctx.fillRect(0, 0, w, h/2)
            //
            // ground gradient (bottom half: dark floor with warm reflection)
            //
            var floorGrad = ctx.createLinearGradient(0, h/2, 0, h)
            floorGrad.addColorStop(0, '#A09888')
            floorGrad.addColorStop(0.15, '#3A3530')
            floorGrad.addColorStop(1, '#1A1816')
            ctx.fillStyle = floorGrad
            ctx.fillRect(0, h/2, w, h/2)
            //
            // softbox lights (bright rectangular panels on ceiling)
            //
            ctx.globalAlpha = 0.9
            var lights = [
               {x: 80, y: 30, w: 70, h: 25},
               {x: 260, y: 20, w: 90, h: 30},
               {x: 400, y: 35, w: 60, h: 20}
               ]
            for (var i = 0; i < lights.length; i++) {
               var l = lights[i]
               var lg = ctx.createRadialGradient(
                  l.x + l.w/2, l.y + l.h/2, 0,
                  l.x + l.w/2, l.y + l.h/2, Math.max(l.w, l.h))
               lg.addColorStop(0, '#FFFFFF')
               lg.addColorStop(0.4, '#F5F0E8')
               lg.addColorStop(1, 'rgba(200,195,185,0)')
               ctx.fillStyle = lg
               ctx.fillRect(l.x - 20, l.y - 10, l.w + 40, l.h + 20)
               ctx.fillStyle = '#FFFEF8'
               ctx.fillRect(l.x, l.y, l.w, l.h)
               }
            //
            // floor reflections of softboxes (faint)
            //
            ctx.globalAlpha = 0.15
            for (var i = 0; i < lights.length; i++) {
               var l = lights[i]
               var ry = h - l.y - l.h
               ctx.fillStyle = '#D0CCC0'
               ctx.fillRect(l.x, ry, l.w, l.h)
               }
            ctx.globalAlpha = 1.0
            //
            // convert to env map
            //
            var texture = new THREE.CanvasTexture(canvas)
            texture.mapping = THREE.EquirectangularReflectionMapping
            var pmrem = new THREE.PMREMGenerator(renderer)
            var env = pmrem.fromEquirectangular(texture).texture
            pmrem.dispose()
            texture.dispose()
            return env
            }
         mod.envMap = make_studio_env()
         //
         // try loading real studio HDR (shipped with mods)
         //
         if (typeof THREE.RGBELoader === 'function') {
            new THREE.RGBELoader().load('js/three.js/studio_env.hdr', function(texture) {
               texture.mapping = THREE.EquirectangularReflectionMapping
               var pmrem = new THREE.PMREMGenerator(renderer)
               mod.envMap = pmrem.fromEquirectangular(texture).texture
               pmrem.dispose()
               texture.dispose()
               scene.traverse(function(obj) {
                  if (obj.isMesh && obj.material && obj.material.envMap) {
                     obj.material.envMap = mod.envMap
                     obj.material.needsUpdate = true
                     }
                  })
               renderer.render(scene, mod.camera)
               })
            }
         //
         // procedural wood texture
         //
         mod.woodTexture = null
         mod.plywoodTexture = null
         //
         // resize handler
         //
         win.addEventListener('resize', function() {
            var cam = mod.camera
            var w = win.innerWidth
            var h = win.innerHeight - 38
            if (cam.isOrthographicCamera) {
               var aspect = w / h
               cam.left = -mod.r * aspect
               cam.right = mod.r * aspect
               cam.top = mod.r
               cam.bottom = -mod.r
            } else {
               cam.aspect = w / h
               }
            cam.updateProjectionMatrix()
            renderer.setSize(w, h)
            renderer.render(scene, cam)
            })
         //
         // show simulation if data available
         //
         show_simulation()
         //
         // start auto-orbit
         //
         if (mod.autoOrbit) orbit_step()
         }
      //
      // context_menu
      //
      function context_menu(evt) {
         evt.preventDefault()
         evt.stopPropagation()
         return false
         }
      //
      // mouse_down
      //
      function mouse_down(evt) {
         evt.preventDefault()
         evt.stopPropagation()
         mod.button = evt.button
         mod.x = evt.clientX
         mod.y = evt.clientY
         }
      //
      // mouse_up
      //
      function mouse_up(evt) {
         mod.button = undefined
         mod.x = evt.clientX
         mod.y = evt.clientY
         }
      //
      // mouse_move
      //
      function mouse_move(evt) {
         var camera = mod.camera
         evt.preventDefault()
         evt.stopPropagation()
         var dx = evt.clientX - mod.x
         var dy = evt.clientY - mod.y
         mod.x = evt.clientX
         mod.y = evt.clientY
         if (mod.button == 0) {
            //
            // pan (scale by stock dimensions in mm)
            //
            var sx = mod.stock_x || 100
            var sy = mod.stock_y || 80
            mod.x0 +=
               Math.sin(mod.thetaz) * sy * dy / win.innerHeight
               - Math.cos(mod.thetaz) * sx * dx / win.innerWidth
            mod.y0 +=
               Math.cos(mod.thetaz) * sy * dy / win.innerHeight
               + Math.sin(mod.thetaz) * sx * dx / win.innerWidth
            camera.position.x = mod.x0 + Math.sin(mod.thetaz) * mod.r * Math.sin(mod.thetaxy)
            camera.position.y = mod.y0 + Math.cos(mod.thetaz) * mod.r * Math.sin(mod.thetaxy)
            camera.position.z = mod.r * Math.cos(mod.thetaxy)
            set_camera_up(camera)
            camera.lookAt(new THREE.Vector3(mod.x0, mod.y0, 0))
            camera.updateProjectionMatrix()
            renderer.render(scene, camera)
            }
         else if (mod.button == 2) {
            //
            // rotate (clamp elevation to avoid gimbal lock)
            //
            mod.thetaxy += 3 * dy / win.innerHeight
            mod.thetaz += 3 * dx / win.innerWidth
            if (mod.thetaxy > -0.01) mod.thetaxy = -0.01
            if (mod.thetaxy < -(Math.PI / 2 - 0.01)) mod.thetaxy = -(Math.PI / 2 - 0.01)
            camera.position.x = mod.x0 + Math.sin(mod.thetaz) * mod.r * Math.sin(mod.thetaxy)
            camera.position.y = mod.y0 + Math.cos(mod.thetaz) * mod.r * Math.sin(mod.thetaxy)
            camera.position.z = mod.r * Math.cos(mod.thetaxy)
            set_camera_up(camera)
            camera.lookAt(new THREE.Vector3(mod.x0, mod.y0, 0))
            camera.updateProjectionMatrix()
            renderer.render(scene, camera)
            }
         }
      //
      // mouse_wheel
      //
      function mouse_wheel(evt) {
         var camera = mod.camera
         evt.preventDefault()
         evt.stopPropagation()
         var dy = evt.deltaY / win.innerHeight
         var sy = mod.stock_y || 80
         mod.r += sy * dy
         if (mod.r < 1) mod.r = 1
         camera.position.x = mod.x0 + Math.sin(mod.thetaz) * mod.r * Math.sin(mod.thetaxy)
         camera.position.y = mod.y0 + Math.cos(mod.thetaz) * mod.r * Math.sin(mod.thetaxy)
         camera.position.z = mod.r * Math.cos(mod.thetaxy)
         set_camera_up(camera)
         camera.lookAt(new THREE.Vector3(mod.x0, mod.y0, 0))
         if (camera.isOrthographicCamera) {
            var aspect = win.innerWidth / (win.innerHeight - 38)
            camera.left = -mod.r * aspect
            camera.right = mod.r * aspect
            camera.top = mod.r
            camera.bottom = -mod.r
            }
         camera.updateProjectionMatrix()
         renderer.render(scene, camera)
         }
      }
   //
   // return values
   //
   return ({
      mod:mod,
      name:name,
      description:description,
      init:init,
      inputs:inputs,
      outputs:outputs,
      interface:interface
      })
   }())
