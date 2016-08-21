// TODO clean up code

'use strict';

class TimelineView extends CommonView {
  // which === '1'|'2' for which line in the graph
  getDataPoints(which, startDateIndex, endDateIndex, options) {
    var dataSource = this.getDataSource(which, options),
      smoothedData;

    if (dataSource) {
      smoothedData = this.smoothData(dataSource, options);
      return smoothedData.slice(startDateIndex, endDateIndex + 1);
    }
  }

// which === '1'|'2' for which line in the graph
  getDataSource(which, options) {
    var eventName = options['event' + which],
      uaName = options['ua' + which],
      location = options['loc' + which],
      eventTotals = data.eventTotals,
      eventMap = eventTotals.byLocation[location],
      dataSource = eventMap && eventMap[eventName] && eventMap[eventName][uaName];

    return dataSource || [];
  }

  getLabel(options, which) {
    var eventName = options['event' + which],
      uaName = options['ua' + which],
      locName = options['loc' + which],
      labelParts = [];

    if (options.event1 !== options.event2) {
      labelParts.push(eventName);
    }
    if (options.ua1 !== options.ua2) {
      labelParts.push('using ' + uaName);
    }
    if (options.loc1 !== options.loc2) {
      labelParts.push('on ' + locName);
    }

    return labelParts.join(' ');
  }

  getChartTitle(userOptions) {
    return 'Sitecues ' + this.getLabel(userOptions, '1') + ' vs ' + this.getLabel(userOptions, '2');
  }

  updateSummaryBox(total1, total2, avg1, avg2, avgRatio) {
    function toStr(num) {
      return num ? Math.round(num).toLocaleString() : '';
    }

    $('#total1').text(toStr(total1));
    $('#total2').text(toStr(total2));
    $('#avg1').text(toStr(avg1));
    $('#avg2').text(toStr(avg2));
    $('#avg-ratio').text(avgRatio ? avgRatio.toPrecision(3) : '');
  }

  getChartInfo(userOptions) {
    var
      startDateIndex = convertDateToIndex(userOptions.startDate, 0),
      endDateIndex = convertDateToIndex(userOptions.endDate, data.summary.config.dates.length - 1),
      data1 = this.getDataPoints('1', startDateIndex, endDateIndex, userOptions),
      data2 = this.getDataPoints('2', startDateIndex, endDateIndex, userOptions),
      numDays = data1.length || data2.length,
      total1 = this.getTotal(data1),
      total2 = this.getTotal(data2),
      avg1 = total1 / numDays,
      avg2 = total2 / numDays,
      avgRatio = total1 ? total2 / total1 : 0,
      datasets = [],
      doEnableLine1 = userOptions.doEnableLine1 && data1.length,
      doEnableLine2 = userOptions.doEnableLine2 && data2.length,
      doEnableRatioLine = doEnableLine1 && doEnableLine2 &&
        (userOptions.event2 !== userOptions.event1 ||
        userOptions.ua2 !== userOptions.ua1 ||
        userOptions.loc2 !== userOptions.loc1),
      doEnableAverageLines = false,
      yAxis2;

    this.updateSummaryBox(total1, total2, avg1, avg2, avgRatio);

    if (doEnableLine1) {
      datasets = datasets.concat({
        label: this.getLabel(userOptions, '1'),
        backgroundColor: 'rgba(20,20,255,0.1)',
        borderColor: 'rgba(20,20,255,.4)',
        fill: true,
        pointHitRadius: 10,
        data: data1 || [0],
        yAxisID: 'y-axis-1'
      });
      if (doEnableAverageLines) {
        datasets = datasets.concat({
          label: 'average: ' + toPrecision(total1 / numDays, 4).toLocaleString() + ' (' + total1.toLocaleString() + ' total)     ',
          backgroundColor: 'rgba(0,0,0,0)',
          pointBorderColor: 'rgba(0,0,0,0)',
          borderColor: 'rgba(20,20,255,.4)',
          borderDash: [10, 5],
          fill: false,
          pointHitRadius: 0,
          data: new Array(numDays).fill(toPrecision(avg1, 4)),
          yAxisID: 'y-axis-1'
        });
      }
    }

    // If event2 is different, add it as a dataset as well as ration between the two
    if (doEnableLine2) {
      yAxis2 = (userOptions.doStretch || !doEnableLine1) ? 'y-axis-2' : 'y-axis-1';
      datasets = datasets.concat({
        label: this.getLabel(userOptions, '2'),
        borderColor: 'rgba(255,110,0,.5)',
        backgroundColor: 'rgba(255,110,0,0.1)',
        pointHitRadius: 10,
        data: data2 || [0],
        yAxisID: yAxis2
      });
      if (doEnableAverageLines) {
        datasets = datasets.concat({
          label: 'average: ' + toPrecision(total2 / numDays, 4).toLocaleString() + ' (' + total2.toLocaleString() + ' total)     ',
          backgroundColor: 'rgba(0,0,0,0)',
          borderColor: 'rgba(255,110,0,.4)',
          pointBorderColor: 'rgba(0,0,0,0)',
          borderDash: [10, 5],
          pointHitRadius: 0,
          data: new Array(numDays).fill(toPrecision(avg2, 4)),
          yAxisID: yAxis2
        });
      }
    }

    if (doEnableRatioLine) {
      datasets = datasets.concat({
        label: 'ratio #2/#1', //[average = ' + (total1 / total2).toFixed(4) + ']',
        data: this.getRatioDataPoints(data1, data2, userOptions),
        yAxisID: 'y-axis-ratio'
      });
      if (doEnableAverageLines) {
        datasets = datasets.concat({
          label: 'average ratio ' + avgRatio,
          backgroundColor: 'rgba(0,0,0,0)',
          pointBorderColor: 'rgba(0,0,0,0)',
          borderDash: [10, 5],
          pointHitRadius: 0,
          data: new Array(numDays).fill(avgRatio),
          yAxisID: 'y-axis-ratio'
        });
      }
    }

    var chartOptions = this.getChartOptions(userOptions, doEnableRatioLine, doEnableLine1, doEnableLine2);

    return {
      datasets,
      chartOptions,
      startDateIndex,
      endDateIndex
    };
  }
}

const view = new TimelineView();