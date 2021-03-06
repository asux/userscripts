"use strict";
// ==UserScript==
// @name         primaERP - round timerecords by 15 min
// @namespace    http://tampermonkey.net/
// @version      0.5.1
// @description  primaERP - round timerecords by 15 min
// @author       Alex Ulianytskyi <a.ulyanitsky@gmail.com>
// @homepage     https://github.com/asux/userscripts/blob/master/primaERP/round_timerecords.js
// @downloadURL  https://raw.githubusercontent.com/asux/userscripts/master/primaERP/round_timerecords.js
// @match        https://*.primaerp.com/reports/*
// @grant        none
// @require      https://gist.github.com/BrockA/2625891/raw/waitForKeyElements.js
// @run-at       document-idle
// ==/UserScript==
// When run inside Fluid application
if (typeof fluid === 'object') {
    fluid.include(fluid.resourcePath + 'scripts/waitForKeyElements.js');
}
var RoundTimerecords;
(function (RoundTimerecords) {
    function roundBy15Min(text) {
        var matches = text.match(/(\d{2}):(\d{2})/);
        if (Array.isArray(matches)) {
            var hours = parseFloat(matches[1]);
            var part = Math.ceil(parseFloat(matches[2]) / 15) / 4;
            return hours + part;
        }
        return parseFloat(text);
    }
    RoundTimerecords.roundBy15Min = roundBy15Min;
    function updateTimeRecords(root) {
        root.find('td.right span.help').text(function () {
            var text = $(this).text();
            var rounded = roundBy15Min(text);
            if (rounded !== null) {
                return rounded.toFixed(2);
            }
        });
    }
    RoundTimerecords.updateTimeRecords = updateTimeRecords;
})(RoundTimerecords || (RoundTimerecords = {}));
if (typeof waitForKeyElements === 'function') {
    waitForKeyElements('table.primaReportTable', RoundTimerecords.updateTimeRecords);
}
