//
// save file
//
// Neil Gershenfeld
// (c) Massachusetts Institute of Technology 2016
// Modified by Fran Sanchez 17 Apr 2026 - hold file, save on click (match WebSerial/WebUSB pattern)
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
    var name = 'save file'
    var description = 'Holds the incoming file object until you click save, then triggers a browser download via a temporary data-URI link. Mirrors the waiting-for-file pattern used by WebSerial and WebUSB.'
    //
    // initialization
    //
    var init = function() {
        mod.name = ''
        mod.contents = ''
    }
    //
    // inputs
    //
    var inputs = {
        file: {
            type: 'object',
            event: function(evt) {
                mod.name = evt.detail.name
                mod.contents = evt.detail.contents
                mod.nametext.nodeValue = 'name: ' + mod.name
                mod.sizetext.nodeValue = 'size: ' + mod.contents.length
                mod.label.nodeValue = 'save file'
                mod.labelspan.style.fontWeight = 'bold'
                mods.setStatus(mod.status, 'ready')
                mods.fit(mod.div)
            }
        }
    }
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
        // status
        //
        var status = document.createElement('span')
        status.className = 'mods-status-lcd'
        status.textContent = 'waiting for file'
        div.appendChild(status)
        mod.status = status
        div.appendChild(document.createElement('br'))
        //
        // info
        //
        var text = document.createTextNode('name:')
        div.appendChild(text)
        mod.nametext = text
        div.appendChild(document.createElement('br'))
        var text = document.createTextNode('size:')
        div.appendChild(text)
        mod.sizetext = text
        div.appendChild(document.createElement('br'))
        //
        // save button
        //
        var btn = document.createElement('button')
        btn.style.margin = '1px'
        var span = document.createElement('span')
        var text = document.createTextNode('waiting for file')
        mod.label = text
        span.appendChild(text)
        mod.labelspan = span
        btn.appendChild(span)
        btn.addEventListener('click', function() {
            save_file()
        })
        div.appendChild(btn)
    }
    //
    // local functions
    //
    function save_file() {
        if (!mod.contents) {
            mods.setStatus(mod.status, 'no file')
            return
        }
        var a = document.createElement('a')
        a.setAttribute('href', 'data:text/plain;charset=utf-8,' +
            encodeURIComponent(mod.contents))
        a.setAttribute('download', mod.name)
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        mods.setStatus(mod.status, 'saved ' + mod.contents.length + ' bytes')
        mod.label.nodeValue = 'waiting for file'
        mod.labelspan.style.fontWeight = 'normal'
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
