// ==UserScript==
// @name           primaERP - group billable time by day and task
// @namespace      http://tampermonkey.net/
// @version        0.4.0
// @description    primaERP - group billable time by day and task
// @author         Alex Ulianytskyi <a.ulyanitsky@gmail.com>
// @homepage       https://github.com/asux/userscripts/blob/master/primaERP/aggregate_by_day_and_time.js
// @downloadURL    https://raw.githubusercontent.com/asux/userscripts/master/primaERP/aggregate_by_day_and_time.js
// @match          https://*.primaerp.com/reports/*
// @grant          none
// @require        https://gist.github.com/BrockA/2625891/raw/waitForKeyElements.js
// @run-at         document-idle
// ==/UserScript==

// When run inside Fluid application
if (typeof fluid === 'object') {
    fluid.include(fluid.resourcePath + 'scripts/waitForKeyElements.js');
}

namespace GroupByDateAndTask {
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

    function roundBy15Min(text: string): number {
        let matches = text.match(/(\d{2}):(\d{2})/);
        if (Array.isArray(matches)) {
            let hours: number = parseFloat(matches[1]);
            let part: number =  Math.ceil(parseFloat(matches[2]) / 15) / 4;
            return hours + part;
        }
        return parseFloat(text);
    }

    export function updateTimeRecords(root: JQuery): void {
        root.find('td.right span.help').text((index, text) => {
            return roundBy15Min(text).toFixed(2);
        });
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
                billableHours: roundBy15Min(getCellText(cells, 7)),
                price: parseFloat(getCellText(cells, 8)),
                billableUSD: parseFloat(getCellText(cells, 9))
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
            if (existed) { return; };
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
            console.log(`${resultItem.date} | ${resultItem.task} | ${resultItem.billableHours.toFixed(2)}`);
            result.push(resultItem);
        });
        return result;
    }

    function renderTableWithResults (container: JQuery<HTMLElement>, results: TimeRecord[]): void {
        let box = $(`<div class="row space-after">
                        <div class="col-md-12">
                            <div class="box border space-after space-right">
                                <h2>Tasks summary</h2>
                                <div class="boxcontent"></div>
                            </div>
                        </div>
                    </div>`);
        let table = $('<table class="table table-condensed primaReportTable tasks-table"></table>');
        let header = $(`<thead>
                            <tr>
                            <th>Date</th>
                            <th>Task</th>
                            <th class="right">Billable Hours</th>
                            </tr>
                        </thead>`);
        let tbody = $('<tbody></tbody>');
        results.forEach((timeRecord, index, array) => {
            let row = $(`<tr>
                            <td>${timeRecord.date}</td>
                            <td>${timeRecord.task}</td>
                            <td class="right">${timeRecord.billableHours.toFixed(2)}</td>
                        </tr>`);
            tbody.append(row);
        });
        table.append(header);
        table.append(tbody);
        $('.boxcontent', box).append(table);
        container.append(box);
    }

    export function collectAndGroupByDateAndTask(root: JQuery): void {
        let results = groupByDateAndTask(collectTimeRecords(root));
        renderTableWithResults(root.parents('.report'), results);
    }

}

if (typeof waitForKeyElements === 'function') {
    let tableSel = 'table.table-condensed.primaReportTable.summary-table';
    waitForKeyElements(tableSel, (root) => {
        GroupByDateAndTask.updateTimeRecords(root);
        GroupByDateAndTask.collectAndGroupByDateAndTask(root);
    });
}