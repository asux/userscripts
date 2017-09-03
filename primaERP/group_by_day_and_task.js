"use strict";
// ==UserScript==
// @name           primaERP - group billable time by day and task
// @namespace      http://tampermonkey.net/
// @version        0.4.1
// @description    primaERP - group billable time by day and task
// @author         Alex Ulianytskyi <a.ulyanitsky@gmail.com>
// @homepage       https://github.com/asux/userscripts/blob/master/primaERP/aggregate_by_day_and_time.js
// @downloadURL    https://raw.githubusercontent.com/asux/userscripts/master/primaERP/aggregate_by_day_and_time.js
// @match          https://*.primaerp.com/reports/complete*
// @grant          none
// @require        https://gist.github.com/BrockA/2625891/raw/waitForKeyElements.js
// @run-at         document-idle
// ==/UserScript==
// When run inside Fluid application
if (typeof fluid === 'object') {
    fluid.include(fluid.resourcePath + 'scripts/waitForKeyElements.js');
}
var GroupByDateAndTask;
(function (GroupByDateAndTask) {
    function roundBy15Min(text) {
        var matches = text.match(/(\d{2}):(\d{2})/);
        if (Array.isArray(matches)) {
            var hours = parseFloat(matches[1]);
            var part = Math.ceil(parseFloat(matches[2]) / 15) / 4;
            return hours + part;
        }
        return parseFloat(text);
    }
    function updateTimeRecords(root) {
        root.find('td.right span.help').text(function (index, text) {
            return roundBy15Min(text).toFixed(2);
        });
    }
    GroupByDateAndTask.updateTimeRecords = updateTimeRecords;
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
                billableHours: roundBy15Min(getCellText(cells, 7)),
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
        var box = $("<div class=\"row space-after\">\n                        <div class=\"col-md-12\">\n                            <div class=\"box border space-after space-right\">\n                                <h2>Tasks summary</h2>\n                                <div class=\"boxcontent\"></div>\n                            </div>\n                        </div>\n                    </div>");
        var table = $('<table class="table table-condensed primaReportTable tasks-table"></table>');
        var header = $("<thead>\n                            <tr>\n                            <th>Date</th>\n                            <th>Task</th>\n                            <th class=\"right\">Billable Hours</th>\n                            </tr>\n                        </thead>");
        var tbody = $('<tbody></tbody>');
        results.forEach(function (timeRecord, index, array) {
            var row = $("<tr>\n                            <td>" + timeRecord.date + "</td>\n                            <td>" + timeRecord.task + "</td>\n                            <td class=\"right\">" + timeRecord.billableHours.toFixed(2) + "</td>\n                        </tr>");
            tbody.append(row);
        });
        table.append(header);
        table.append(tbody);
        $('.boxcontent', box).append(table);
        container.append(box);
    }
    function collectAndGroupByDateAndTask(root) {
        var results = groupByDateAndTask(collectTimeRecords(root));
        renderTableWithResults(root.parents('.report'), results);
    }
    GroupByDateAndTask.collectAndGroupByDateAndTask = collectAndGroupByDateAndTask;
})(GroupByDateAndTask || (GroupByDateAndTask = {}));
if (typeof waitForKeyElements === 'function') {
    var tableSel = 'table.table-condensed.primaReportTable.summary-table';
    waitForKeyElements(tableSel, function (root) {
        GroupByDateAndTask.updateTimeRecords(root);
        GroupByDateAndTask.collectAndGroupByDateAndTask(root);
    });
}
