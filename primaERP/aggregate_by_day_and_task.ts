// ==UserScript==
// @name         primaERP - aggreagte billable time by day and task
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  primaERP - aggreagte billable time by day and task
// @author       Alex Ulianytskyi <a.ulyanitsky@gmail.com>
// @homepage     https://github.com/asux/userscripts/blob/master/primaERP/aggregate_by_day_and_time.js
// @downloadURL  https://raw.githubusercontent.com/asux/userscripts/master/primaERP/aggregate_by_day_and_time.js
// @match        https://*.primaerp.com/reports/*
// @grant        none
// @require      https://gist.github.com/BrockA/2625891/raw/waitForKeyElements.js
// @run-at       document-idle
// ==/UserScript==

interface TimeRecord {
  date: string;
  time: string;
  user: string;
  client: string;
  project: string;
  task: string;
  activity: string;
  billableHours: number;
  price?: number;
  billableUSD: number;
}

// When run inside Fluid application
if (typeof fluid === 'object') {
  fluid.include(fluid.resourcePath + 'scripts/waitForKeyElements.js');
}

function getCellText(cells: HTMLTableElement[], n: number) {
  return $(cells[n]).text().trim();
}

function collectTimeRecords(root: JQuery): TimeRecord[] {
  var timeRecords: TimeRecord[] = [];

  root.find('tr').each(function() {
    let row: jQuery<HTMLTableRowElement> = $(this);
    if (row.hasClass('group-header')) { return; }
    if (row.hasClass('record-description-header')) { return; }
    let cells = row.find('td');
    let timeRecord: TimeRecord = {
      date: getCellText(cells, 0),
      time: getCellText(cells, 1),
      user: getCellText(cells, 2),
      client: getCellText(cells, 3),
      project: getCellText(cells, 4),
      task: getCellText(cells, 5),
      activity: getCellText(cells, 6),
      billableHours: parseFloat(getCellText(cells, 7)),
      price:  parseFloat(getCellText(cells, 8)),
      billableUSD:  parseFloat(getCellText(cells, 9))
    }
    timeRecords.push(timeRecord);
  });
  return timeRecords;
}

if (typeof waitForKeyElements === 'function') {
  waitForKeyElements('table.primaReportTable tbody', collectTimeRecords);
}
