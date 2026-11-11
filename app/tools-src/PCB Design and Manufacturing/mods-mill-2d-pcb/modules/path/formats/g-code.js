//
// path to G-code
//
// Neil Gershenfeld
// (c) Massachusetts Institute of Technology 2018
//
// This work may be reproduced, modified, distributed, performed, and
// displayed for any purpose, but must acknowledge the mods
// project. Copyright is retained and must be preserved. The work is
// provided as is; no warranty is provided, and users accept all
// liability.
//
// Updated: Neil Gershenfeld
// Date: Nov 3 2024
// Comments: retract at end for tool change
//
// Updated: Quentin Bolsee
// Date: Oct 26 2023
// Comments: time estimate
//
// Updated: Neil Gershenfeld
// Date: Aug 26 2023
// Comments: compatibility tweaks
//
// Updated: Neil Gershenfeld
// Date: Oct 28 2020
// Comments: added mm/s vs mm/min option
//
// Updated: Steven Chew
// Date:    Feb 20 2019
// Comments: Added option to output in inch or mm
// Date:... Oct 28 2019
// Comments: Corrected feedrate conversion
//           - inch/s to inch/min
//...........- mm/s to mm/min
//
// closure
//
(function(){
//
// module globals
//
var mod = {}
//
// name
//
var name = 'path to G-code'
var description = 'Converts toolpaths to standard G-code with configurable speeds, coolant, inch/mm format, and time estimate'
//
// initialization
//
var init = function() {
   mod.cutspeed.value = '2.5'
   mod.plungespeed.value = '2.5'
   mod.jogheight.value = '2'
   mod.finishheight.value = '20'
   mod.spindlespeed.value = '11000'
   mod.dwell.value = '0'
   mod.tool.value = '0'
   mod.coolantoff.checked = true
   mod.formatMm.checked = true
   }
//
// inputs
//
var inputs = {
   path:{type:'',
      event:function(evt){
         mod.name = evt.detail.name
         mod.path = evt.detail.path
         mod.dpi = evt.detail.dpi
         mod.width = evt.detail.width
         mod.height = evt.detail.height
         make_path()
         }}}
//
// outputs
//
var outputs = {
   file:{type:'',
      event:function(str){
         obj = {}
         obj.name = mod.name+".nc"
         obj.contents = str
         mods.output(mod,'file',obj)
         }}}
//
// interface
//
var interface = function(div){
   mod.div = div
   //
   // cut speed
   //
   div.appendChild(document.createTextNode('cut speed: '))
   var input = document.createElement('input')
      input.type = 'text'
      input.size = 6
      div.appendChild(input)
      mod.cutspeed = input
   div.appendChild(document.createTextNode(' (mm/s)'))
   div.appendChild(document.createElement('br'))
   //
   // plunge speed
   //
   div.appendChild(document.createTextNode('plunge speed: '))
   var input = document.createElement('input')
      input.type = 'text'
      input.size = 6
      div.appendChild(input)
      mod.plungespeed = input
   div.appendChild(document.createTextNode(' (mm/s)'))
   div.appendChild(document.createElement('br'))
   //
   // jog height
   //
   div.appendChild(document.createTextNode('jog height: '))
   var input = document.createElement('input')
      input.type = 'text'
      input.size = 6
      div.appendChild(input)
      mod.jogheight = input
   div.appendChild(document.createTextNode(' (mm)'))
   div.appendChild(document.createElement('br'))
   //
   // finish height
   //
   div.appendChild(document.createTextNode('finish height: '))
   var input = document.createElement('input')
      input.type = 'text'
      input.size = 6
      div.appendChild(input)
      mod.finishheight = input
   div.appendChild(document.createTextNode(' (mm)'))
   div.appendChild(document.createElement('br'))
   //
   // spindle speed
   //
   div.appendChild(document.createTextNode('spindle: '))
   var input = document.createElement('input')
      input.type = 'text'
      input.size = 6
      div.appendChild(input)
      mod.spindlespeed = input
   div.appendChild(document.createTextNode(' (RPM)'))
   div.appendChild(document.createElement('br'))
   //
   // dwell
   //
   div.appendChild(document.createTextNode('dwell: '))
   var input = document.createElement('input')
      input.type = 'text'
      input.size = 6
      div.appendChild(input)
      mod.dwell = input
   div.appendChild(document.createTextNode(' (0:skip)'))
   div.appendChild(document.createElement('br'))
   //
   // tool
   //
   div.appendChild(document.createTextNode('tool: '))
   var input = document.createElement('input')
      input.type = 'text'
      input.size = 6
      div.appendChild(input)
      mod.tool = input
   div.appendChild(document.createTextNode(' (0:skip)'))
   div.appendChild(document.createElement('br'))
   //
   // coolant
   //
   div.appendChild(document.createTextNode('coolant:'))
   var input = document.createElement('input')
      input.type = 'radio'
      input.name = mod.div.id+'coolant'
      input.id = mod.div.id+'coolanton'
      div.appendChild(input)
      mod.coolanton = input
   div.appendChild(document.createTextNode('on'))
   var input = document.createElement('input')
      input.type = 'radio'
      input.name = mod.div.id+'coolant'
      input.id = mod.div.id+'coolantoff'
      div.appendChild(input)
      mod.coolantoff = input
   div.appendChild(document.createTextNode('off'))
   div.appendChild(document.createElement('br'))
   //
   // inch or mm format
   //
   div.appendChild(document.createTextNode('format:'))
   var input = document.createElement('input')
      input.type = 'radio'
      input.name = mod.div.id+'format'
      input.id = mod.div.id+'formatInch'
      input.checked = true
      div.appendChild(input)
      mod.formatInch = input
   div.appendChild(document.createTextNode('inch'))
   var input = document.createElement('input')
      input.type = 'radio'
      input.name = mod.div.id+'format'
      input.id = mod.div.id+'formatMm'
      div.appendChild(input)
      mod.formatMm = input
   div.appendChild(document.createTextNode('mm'))
   div.appendChild(document.createElement('br'))
   //
   // time
   //
   div.appendChild(document.createElement('br'))
   div.appendChild(document.createTextNode('Estimated time: '))
   var timeTxt = document.createTextNode('--:--:--')
   div.appendChild(timeTxt)
   mod.timeTxt = timeTxt
   div.appendChild(document.createElement('br'))
   }
//
// local functions
//
function toHHMMSS(sec_num) {
  sec_num = Math.floor(sec_num)
  var hours   = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  var seconds = sec_num - (hours * 3600) - (minutes * 60);

  if (hours   < 10) {hours   = "0"+hours;}
  if (minutes < 10) {minutes = "0"+minutes;}
  if (seconds < 10) {seconds = "0"+seconds;}
  return hours+':'+minutes+':'+seconds;
  }
function make_path() {
   var total_minutes = 0.0 // in minutes
   var dx = 25.4*mod.width/mod.dpi
   var cut_speed = parseFloat(mod.cutspeed.value)
   var plunge_speed = parseFloat(mod.plungespeed.value)
   var jog_height = parseFloat(mod.jogheight.value)
   var finish_height = parseFloat(mod.finishheight.value)
   var nx = mod.width
   var scale = dx/(nx-1)
   var in_mm_scale = 1
   if (mod.formatInch.checked) {
      dx /= 25.4
      scale /= 25.4
      cut_speed /= 25.4
      plunge_speed /= 25.4
      jog_height /= 25.4
      finish_height /= 25.4
      }
   var spindle_speed = parseFloat(mod.spindlespeed.value)
   var dwell = parseFloat(mod.dwell.value)
   var tool = parseInt(mod.tool.value)
   str = "%\n" // tape start
   str += "G17\n" // xy plane
   if (mod.formatInch.checked)
      str += "G20\n" // inches
   if (mod.formatMm.checked)
      str += "G21\n" // mm
   str += "G40\n" // cancel tool radius compensation
   str += "G49\n" // cancel tool length compensation
   str += "G54\n" // coordinate system 1
   str += "G80\n" // cancel canned cycles
   str += "G90\n" // absolute coordinates
   str += "G94\n" // feed/minute units
   cut_speed *= 60 // feed/sec -> /minute units
   plunge_speed *= 60 // feed/sec -> /minute units
   if (tool != 0)
      str += "T"+tool+"M06\n" // tool selection, tool change
   str += "F"+cut_speed.toFixed(4)+"\n" // feed rate
   str += "S"+spindle_speed+"\n" // spindle speed
   if (mod.coolanton.checked)
      str += "M08\n" // coolant on
   str += "G00Z"+jog_height.toFixed(4)+"\n" // move up before starting spindle
   str += "M03\n" // spindle on clockwise
   if (dwell != 0)
      str += "G04 P"+dwell+"\n" // give spindle time to spin up
   //
   // simulate tool motion to estimate time
   //
   var toolxyz = {
      xp: null,
      yp: null,
      zp: null,
      move: function(xn, yn, zn) {
        var dist = 0
        if ((this.xp !== null) && (this.yp !== null) && (this.zp !== null)) {
          dist = Math.sqrt((xn-this.xp)**2+(yn-this.yp)**2+(zn-this.zp)**2)
          }
        this.xp = xn
        this.yp = yn
        this.zp = zn
        return dist
        }
      }
   //
   // follow segments
   //
   for (var seg = 0; seg < mod.path.length; ++seg) {
      //
      // move up to starting point
      //
      x = scale*mod.path[seg][0][0]
      y = scale*mod.path[seg][0][1]
      z = jog_height
      str += "G00Z"+jog_height.toFixed(4)+"\n"
      str += "G00X"+x.toFixed(4)+"Y"+y.toFixed(4)+"Z"+jog_height.toFixed(4)+"\n"
      total_minutes += toolxyz.move(x, y, z) / cut_speed
      //
      // move down
      //
      z = scale*mod.path[seg][0][2]
      str += "G01Z"+z.toFixed(4)+" F"+plunge_speed.toFixed(4)+"\n"
      str += "F"+cut_speed.toFixed(4)+"\n" //restore xy feed rate
      for (var pt = 1; pt < mod.path[seg].length; ++pt) {
         //
         // move to next point
         //
         x = scale*mod.path[seg][pt][0]
         y = scale*mod.path[seg][pt][1]
         z = scale*mod.path[seg][pt][2]
         str += "G01X"+x.toFixed(4)+"Y"+y.toFixed(4)+"Z"+z.toFixed(4)+"\n"
         total_minutes += toolxyz.move(x, y, z) / cut_speed
         }
      }
   //
   // finish
   //
   z = jog_height
   str += "G00Z"+jog_height.toFixed(4)+"\n" // move up
   str += "G00X0.0000Y0.0000"+"Z"+finish_height.toFixed(4)+"\n" // finish up at origin
   str += "M05\n" // spindle stop
   total_minutes += toolxyz.move(x, y, z) / cut_speed
   if (mod.coolanton.checked)
      str += "M09\n" // coolant off
   str += "M30\n" // program end and reset
   str += "%\n" // tape end
   //
   // print time
   //
   mod.timeTxt.textContent = toHHMMSS(total_minutes * 60)
   //
   // output file
   //
   outputs.file.event(str)
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
