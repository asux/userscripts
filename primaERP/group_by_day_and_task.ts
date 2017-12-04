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

namespace GroupByDateAndTask {
  class Duration {
    constructor(public hours: number, public minutes: number) {}
    public static parse(text: String): Duration {
      let hours = 0;
      let minutes = 0;
      let matches = text.match(/(\d{2}):(\d{2})/);
      if (Array.isArray(matches)) {
        hours = parseInt(matches[1]);
        minutes = parseInt(matches[2]);
      }
      return new Duration(hours, minutes);
    }
    public add(other: Duration | undefined): Duration {
      if (!other) {
        return this;
      }
      let hours = this.hours + other.hours;
      let minutes = this.minutes + other.minutes;
      if (minutes >= 60) {
        let hours_more = Math.floor(minutes / 60);
        minutes = minutes - hours_more * 60;
        hours += hours_more;
      }
      return new Duration(hours, minutes);
    }
    public toRoundedFloat(period: number = 15): number {
      let part: number = Math.ceil(this.minutes / period) * period / 60.0;
      return this.hours + part;
    }
    public toString(): String {
      return this.formattedHours() + ':' + this.formattedMinutes();
    }
    private formattedHours(): String {
      return ('0' + this.hours).slice(-2);
    }
    private formattedMinutes(): String {
      return ('0' + this.minutes).slice(-2);
    }
  }

  interface TimeRecord {
    date: string;
    time?: Duration;
    user?: string;
    client?: string;
    project?: string;
    task: string;
    activity?: string;
    billableHours: number;
    price?: number;
    billableUSD?: number;
  }

  export function updateTimeRecords(root: JQuery): void {
    root.find('td.right span.help').text((index, text) => {
      return Duration.parse(text)
        .toRoundedFloat()
        .toFixed(2);
    });
  }

  function getCellText(cells: HTMLTableElement[], n: number) {
    return $(cells[n])
      .text()
      .trim();
  }

  function collectTimeRecords(root: JQuery): TimeRecord[] {
    var timeRecords: TimeRecord[] = [];
    root.find('tbody tr').each(function() {
      let row: jQuery<HTMLTableRowElement> = $(this);
      if (row.hasClass('group-header')) {
        return;
      }
      if (row.hasClass('record-description')) {
        return;
      }
      if (row.hasClass('group-footer')) {
        return;
      }
      let cells = row.find('td');
      let timeRecord: TimeRecord = {
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

  function groupByDateProjectTask(collection: TimeRecord[]): TimeRecord[] {
    var result: TimeRecord[] = [];
    let uniqTest = (element: TimeRecord, item: TimeRecord) => {
      return element.date == item.date && element.project == item.project && element.task == item.task;
    };
    collection.forEach((item, index, array) => {
      let existed = result.find((element: TimeRecord, index: number, array: TimeRecord[]) => {
        return uniqTest(element, item);
      });
      if (existed) {
        return;
      }
      let grouped: TimeRecord[] = array.filter((element, index, array) => {
        return uniqTest(element, item);
      });
      let sumTime: Duration = grouped.reduce((acc, value, index) => {
        return acc.add(value.time);
      }, new Duration(0, 0));
      let sumBillableHours: number = grouped.reduce((acc, value, index) => {
        return acc + value.billableHours;
      }, 0.0);
      let resultItem: TimeRecord = {
        date: item.date,
        project: item.project,
        task: item.task,
        time: sumTime,
        billableHours: sumBillableHours
      };
      console.log(
        `${resultItem.date} | ${item.project} | ${resultItem.task} | ${
          resultItem.time
        } | ${resultItem.billableHours.toFixed(2)}`
      );
      result.push(resultItem);
    });
    return result;
  }

  function renderTableWithResults(container: JQuery<HTMLElement>, results: TimeRecord[]): void {
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
                            <th>Project</th>
                            <th>Task</th>
                            <th class="right">Time</th>
                            <th class="right">Billable Hours</th>
                            </tr>
                        </thead>`);
    let tbody = $('<tbody></tbody>');
    results.forEach((timeRecord, index, array) => {
      let row = $(`<tr>
                            <td>${timeRecord.date}</td>
                            <td>${timeRecord.project}</td>
                            <td>${timeRecord.task}</td>
                            <td class="right">${timeRecord.time}</td>
                            <td class="right">${timeRecord.billableHours.toFixed(2)}</td>
                        </tr>`);
      tbody.append(row);
    });
    table.append(header);
    table.append(tbody);
    $('.boxcontent', box).append(table);
    container.append(box);
  }

  export function collectAndGroup(root: JQuery): void {
    let results = groupByDateProjectTask(collectTimeRecords(root));
    renderTableWithResults(root.parents('.report'), results);
  }
}

if (typeof waitForKeyElements === 'function') {
  let tableSel = 'table.table-condensed.primaReportTable.summary-table';
  waitForKeyElements(tableSel, root => {
    GroupByDateAndTask.updateTimeRecords(root);
    GroupByDateAndTask.collectAndGroup(root);
  });
}
