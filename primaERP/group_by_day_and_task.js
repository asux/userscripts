"use strict";
// ==UserScript==
// @name           primaERP - group billable time by day, project and task
// @namespace      http://tampermonkey.net/
// @version        0.6.1
// @description    primaERP - group billable time by day, project and task
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
    var Duration = /** @class */ (function () {
        function Duration(hours, minutes) {
            this.hours = hours;
            this.minutes = minutes;
        }
        Duration.parse = function (text) {
            var hours = 0;
            var minutes = 0;
            var matches = text.match(/(\d{2}):(\d{2})/);
            if (Array.isArray(matches)) {
                hours = parseInt(matches[1]);
                minutes = parseInt(matches[2]);
            }
            return new Duration(hours, minutes);
        };
        Duration.prototype.add = function (other) {
            if (!other) {
                return this;
            }
            var hours = this.hours + other.hours;
            var minutes = this.minutes + other.minutes;
            if (minutes >= 60) {
                var hours_more = Math.floor(minutes / 60);
                minutes = minutes - hours_more * 60;
                hours += hours_more;
            }
            return new Duration(hours, minutes);
        };
        Duration.prototype.toRoundedFloat = function (period) {
            if (period === void 0) { period = 15; }
            var part = Math.ceil(this.minutes / period) * period / 60.0;
            return this.hours + part;
        };
        Duration.prototype.toString = function () {
            return this.formattedHours() + ':' + this.formattedMinutes();
        };
        Duration.prototype.formattedHours = function () {
            return ('0' + this.hours).slice(-2);
        };
        Duration.prototype.formattedMinutes = function () {
            return ('0' + this.minutes).slice(-2);
        };
        return Duration;
    }());
    function updateTimeRecords(root) {
        root.find('td.right span.help').text(function (index, text) {
            return Duration.parse(text)
                .toRoundedFloat()
                .toFixed(2);
        });
    }
    GroupByDateAndTask.updateTimeRecords = updateTimeRecords;
    function getCellText(cells, n) {
        return $(cells[n])
            .text()
            .trim();
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
                time: Duration.parse(getCellText(cells, 1)),
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
    function groupByDateProjectTask(collection) {
        var result = [];
        var uniqTest = function (element, item) {
            return element.date == item.date && element.project == item.project && element.task == item.task;
        };
        collection.forEach(function (item, index, array) {
            var existed = result.find(function (element, index, array) {
                return uniqTest(element, item);
            });
            if (existed) {
                return;
            }
            var grouped = array.filter(function (element, index, array) {
                return uniqTest(element, item);
            });
            var sumTime = grouped.reduce(function (acc, value, index) {
                return acc.add(value.time);
            }, new Duration(0, 0));
            var sumBillableHours = grouped.reduce(function (acc, value, index) {
                return acc + value.billableHours;
            }, 0.0);
            var resultItem = {
                date: item.date,
                project: item.project,
                task: item.task,
                time: sumTime,
                billableHours: sumBillableHours
            };
            console.log(resultItem.date + " | " + item.project + " | " + resultItem.task + " | " + resultItem.time + " | " + resultItem.billableHours.toFixed(2));
            result.push(resultItem);
        });
        return result;
    }
    function renderTableWithResults(container, results) {
        var box = $("<div class=\"row space-after\">\n                        <div class=\"col-md-12\">\n                            <div class=\"box border space-after space-right\">\n                                <h2>Tasks summary</h2>\n                                <div class=\"boxcontent\"></div>\n                            </div>\n                        </div>\n                    </div>");
        var table = $('<table class="table table-condensed primaReportTable tasks-table"></table>');
        var header = $("<thead>\n                            <tr>\n                            <th>Date</th>\n                            <th>Project</th>\n                            <th>Task</th>\n                            <th class=\"right\">Time</th>\n                            <th class=\"right\">Billable Hours</th>\n                            </tr>\n                        </thead>");
        var tbody = $('<tbody></tbody>');
        results.forEach(function (timeRecord, index, array) {
            var row = $("<tr>\n                            <td>" + timeRecord.date + "</td>\n                            <td>" + timeRecord.project + "</td>\n                            <td>" + timeRecord.task + "</td>\n                            <td class=\"right\">" + timeRecord.time + "</td>\n                            <td class=\"right\">" + timeRecord.billableHours.toFixed(2) + "</td>\n                        </tr>");
            tbody.append(row);
        });
        table.append(header);
        table.append(tbody);
        $('.boxcontent', box).append(table);
        container.append(box);
    }
    function collectAndGroup(root) {
        var results = groupByDateProjectTask(collectTimeRecords(root));
        renderTableWithResults(root.parents('.report'), results);
    }
    GroupByDateAndTask.collectAndGroup = collectAndGroup;
})(GroupByDateAndTask || (GroupByDateAndTask = {}));
if (typeof waitForKeyElements === 'function') {
    var tableSel = 'table.table-condensed.primaReportTable.summary-table';
    waitForKeyElements(tableSel, function (root) {
        GroupByDateAndTask.updateTimeRecords(root);
        GroupByDateAndTask.collectAndGroup(root);
    });
}
