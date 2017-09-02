// ==UserScript==
// @name         primaERP - round timerecords by 15 min
// @namespace    http://tampermonkey.net/
// @version      0.4.1
// @description  primaERP - round timerecords by 15 min
// @author       Alex Ulianytskyi <a.ulyanitsky@gmail.com>
// @homepage     https://github.com/asux/userscripts/blob/master/primaERP/primaerp_round_timerecords.js
// @downloadURL  https://raw.githubusercontent.com/asux/userscripts/master/primaERP/primaerp_round_timerecords.js
// @match        https://*.primaerp.com/reports/*
// @grant        none
// @require      https://gist.github.com/BrockA/2625891/raw/waitForKeyElements.js
// @run-at       document-idle
// ==/UserScript==

'use strict';
declare var waitForKeyElements: (selector: string, callback: () => void) => void;

// When run inside Fluid application
if (typeof fluid === 'object') {
  fluid.include(fluid.resourcePath + 'scripts/waitForKeyElements.js');
}

function roundBy15Min(text: string): number {
    var matches = text.match(/(\d{2}):(\d{2})/);
    if (Array.isArray(matches)) {
        let hours: number = parseFloat(matches[1]);
        let part: number =  Math.ceil(parseFloat(matches[2]) / 15) / 4;
        return hours + part;
    }
    return null;
}

function updateTimeRecords(): void {
    $('table.primaReportTable td.right span.help').text(function() {
        var text = $(this).text();
        var rounded = roundBy15Min(text);
        if (rounded !== null) {
            return rounded.toFixed(2);
        }
    });
}

if (typeof waitForKeyElements === 'function') {
    waitForKeyElements('table.primaReportTable', updateTimeRecords);
}