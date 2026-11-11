//
// on-off module
//
// Neil Gershenfeld 
// (c) Massachusetts Institute of Technology 2020
// Modified by Francisco Sanchez Arroyo 27-March-2022
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
    var name = 'on/off'
    var description = 'On/off toggle switch that gates event flow. When on, passes input through to output; when off, blocks the signal.'
    //
    // initialization
    //
    var init = function() {}
    //
    // inputs
    //
    var inputs = {
        in: {
            type: '',
            event: function(evt) {
                outputs.out.event(evt.detail)
            }
        }
    }
    //
    // outputs
    //
    var outputs = {
        out: {
            type: '',
            event: function(obj) {
               checkSwitch(obj)
            }
        }
    }
    //
    // interface
    //
    var interface = function(div) {
        mod.div = div
        var label = document.createElement('label')
        label.className = 'switch'
        var input = document.createElement('input')
        input.type = 'checkbox'
        input.checked = false
        label.appendChild(input)
        mod.switch = input
        var span = document.createElement('span')
        span.className = 'slider round'
        label.appendChild(span)
        div.appendChild(label)
    }
    //
    // local functions
    //

    // switch
    function checkSwitch(obj) {
    if (mod.switch.checked) {
       mods.output(mod, 'out', obj)
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
