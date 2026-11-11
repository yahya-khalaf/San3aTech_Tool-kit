//
// note
//
// Neil Gershenfeld
// (c) Massachusetts Institute of Technology 2017
// Modified by Francisco Sanchez 2019
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
    var name = 'note'
    var description = 'Yellow sticky note textarea for annotations and comments. Resizes dynamically and persists text and dimensions within the program.'
    //
    // initialization
    //
    var init = function() {
        mod.text.value = 'place your notes here'
    }
    //
    // inputs
    //
    var inputs = {}
    //
    // outputs
    //
    var outputs = {}
    //
    // interface
    //
    var interface = function(div) {
        mod.div = div
        //
        // hidden inputs to persist dimensions
        //
        var w = document.createElement('input')
        w.type = 'hidden'
        w.addEventListener('input', function() {
            if (w.value) mod.text.style.width = w.value
        })
        div.appendChild(w)
        mod.width = w
        var h = document.createElement('input')
        h.type = 'hidden'
        h.addEventListener('input', function() {
            if (h.value) mod.text.style.height = h.value
        })
        div.appendChild(h)
        mod.height = h
        //
        // text
        //
        var text = document.createElement('textarea')
        text.style.backgroundColor = '#D4E157';
        text.style.fontFamily = 'monospace';
        text.setAttribute('spellcheck', 'false')
        text.setAttribute('rows', mods.ui.rows)
        text.setAttribute('cols', mods.ui.cols)
        //
        // watch textarea for resize
        //
        new ResizeObserver(function() {
            w.value = text.style.width || text.offsetWidth + 'px'
            h.value = text.style.height || text.offsetHeight + 'px'
            mods.fit(mod.div)
        }).observe(text)
        text.addEventListener('wheel', function(e) {
            e.stopPropagation()
        })
        div.appendChild(text)
        mod.text = text
        div.appendChild(document.createElement('br'))
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
