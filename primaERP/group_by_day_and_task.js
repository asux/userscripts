"use strict";
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
// When run inside Fluid application
if (typeof fluid === 'object') {
    fluid.include(fluid.resourcePath + 'scripts/waitForKeyElements.js');
}
function getCellText(cells, n) {
    return $(cells[n]).text().trim();
}
function collectTimeRecords(root) {
    var timeRecords = [];
    root.find('tbody tr').each(function () {
        var row = $(this);
        if (row.hasClass('group-header')) {
            return;
        }
        if (row.hasClass('record-description')) {
            return;
        }
        if (row.hasClass('group-footer')) {
            return;
        }
        var cells = row.find('td');
        var timeRecord = {
            date: getCellText(cells, 0),
            time: getCellText(cells, 1),
            user: getCellText(cells, 2),
            client: getCellText(cells, 3),
            project: getCellText(cells, 4),
            task: getCellText(cells, 5),
            activity: getCellText(cells, 6),
            billableHours: parseFloat(getCellText(cells, 7)),
            price: parseFloat(getCellText(cells, 8)),
            billableUSD: parseFloat(getCellText(cells, 9))
        };
        timeRecords.push(timeRecord);
    });
    return timeRecords;
}
function groupByDateAndTask(collection) {
    var result = [];
    collection.forEach(function (item, index, array) {
        var existed = result.find(function (element, index, array) {
            return element.date == item.date && element.task == item.task;
        });
        if (existed) {
            return;
        }
        ;
        var grouped = array.filter(function (element, index, array) {
            return element.date == item.date && element.task == item.task;
        });
        var sumBillableHours = grouped.reduce(function (acc, value, index) {
            return acc + value.billableHours;
        }, 0.0);
        var resultItem = {
            date: item.date,
            task: item.task,
            billableHours: sumBillableHours
        };
        console.log(resultItem.date + " | " + resultItem.task + " | " + resultItem.billableHours.toFixed(2));
        result.push(resultItem);
    });
    return result;
}
function renderTableWithResults(container, results) {
    var box = $("<div class=\"row space-after\">\n                  <div class=\"col-md-12\">\n                    <div class=\"box border space-after space-right\">\n                      <h2>Tasks summary</h2>\n                      <div class=\"boxcontent\"></div>\n                    </div>\n                  </div>\n                </div>");
    var table = $('<table class="table table-condensed primaReportTable tasks-table"></table>');
    var header = $("<thead>\n                    <tr>\n                    <th>Date</th>\n                    <th>Task</th>\n                    <th class=\"right\">Billable Hours</th>\n                    </tr>\n                  </thead>");
    var tbody = $('<tbody></tbody>');
    results.forEach(function (timeRecord, index, array) {
        var row = $("<tr>\n                  <td>" + timeRecord.date + "</td>\n                  <td>" + timeRecord.task + "</td>\n                  <td class=\"right\">" + timeRecord.billableHours.toFixed(2) + "</td>\n                </tr>");
        tbody.append(row);
    });
    table.append(header);
    table.append(tbody);
    $('.boxcontent', box).append(table);
    container.append(box);
}
function collectAndGroupByDateAndTask(root) {
    setTimeout(function () {
        var results = groupByDateAndTask(collectTimeRecords(root));
        renderTableWithResults(root.parents('.report'), results);
    }, 1000);
}
if (typeof waitForKeyElements === 'function') {
    var tableSel = 'table.table-condensed.primaReportTable.summary-table';
    waitForKeyElements(tableSel, collectAndGroupByDateAndTask);
}
