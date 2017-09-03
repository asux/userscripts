// ==UserScript==
// @name         primaERP - group billable time by day and task
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  primaERP - group billable time by day and task
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
  time?: string;
  user?: string;
  client?: string;
  project?: string;
  task: string;
  activity?: string;
  billableHours: number;
  price?: number;
  billableUSD?: number;
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
  root.find('tbody tr').each(function() {
    let row: jQuery<HTMLTableRowElement> = $(this);
    if (row.hasClass('group-header')) { return; }
    if (row.hasClass('record-description')) { return; }
    if (row.hasClass('group-footer')) { return; }
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

function groupByDateAndTask(collection: TimeRecord[]): TimeRecord[] {
  var result: TimeRecord[] = [];
  collection.forEach((item, index, array) => {
    let existed = result.find((element, index, array) => {
      return element.date == item.date && element.task == item.task;
    });
    if (existed) { return };
    let grouped: TimeRecord[] = array.filter((element, index, array) => {
      return element.date == item.date && element.task == item.task;
    });
    let sumBillableHours: number = grouped.reduce((acc, value, index) => {
      return acc + value.billableHours;
    }, 0.0);
    let resultItem: TimeRecord = {
      date: item.date,
      task: item.task,
      billableHours: sumBillableHours
    }
    console.log(`${resultItem.date} | ${resultItem.task} | ${resultItem.billableHours}`);
    result.push(resultItem);
  });
  return result;
}

function collectAndGroupByDateAndTask(root: JQuery): void {
  groupByDateAndTask(collectTimeRecords(root));
}

if (typeof waitForKeyElements === 'function') {
  waitForKeyElements('table.table-condensed.primaReportTable.summary-table', collectAndGroupByDateAndTask);
}
