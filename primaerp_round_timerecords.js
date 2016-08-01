// ==UserScript==
// @name         primaERP - round timerecords by 15 min
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  primaERP - round timerecords by 15 min
// @author       Alex Ulianytskyi <a.ulyanitsky@gmail.com>
// @homepage     https://github.com/asux/userscripts/blob/master/primaerp_round_timerecords.js
// @downloadURL  https://raw.githubusercontent.com/asux/userscripts/master/primaerp_round_timerecords.js
// @match        https://*.primaerp.com/reports/*
// @grant        none
// @require      https://gist.github.com/BrockA/2625891/raw/waitForKeyElements.js
// @run-at       document-idle
// ==/UserScript==

// When run inside Fluid application
if (typeof fluid === 'object') {
  fluid.include(fluid.resourcePath + 'scripts/waitForKeyElements.js');
}

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
                return rounded.toFixed(2);
            }
        });
    }

    waitForKeyElements('table.primaReportTable', updateTimeRecords);

})();
