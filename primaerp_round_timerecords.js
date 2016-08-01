// ==UserScript==
// @name         primaERP - round timerecords by 15 min
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  primaERP - round timerecords by 15 min
// @author       Alex Ulianytskyi <a.ulyanitsky@gmail.com>
// @match        https://*.primaerp.com/reports/*
// @grant        none
// @require      https://gist.github.com/BrockA/2625891/raw/waitForKeyElements.js
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    function roundBy15Min(text) {
        var m = text.match(/(\d{2}):(\d{2})/);
        if (Array.isArray(m)) {
            var hours = parseFloat(m[1]);
            var part =  Math.ceil(parseFloat(m[2]) / 15) / 4;
            var roundedValue = hours + part;
            return roundedValue;
        }
        return null;
    }

    function updateTimeRecords() {
        $('table.primaReportTable td.right span.help').text(function(index){
            var text = $(this).text();
            var rounded = roundBy15Min(text);
            if (rounded !== null) {
                return text + ' [ ' + rounded + ' ]';
            }
        });
    }

    waitForKeyElements('table.primaReportTable', updateTimeRecords);

})();
