
'use strict';

class AbView extends CommonView {

  getChartConfig(options, doEnableRatioLine, doEnableLine1, doEnableLine2) {
    var yAxes = [],
      doUseSameScaleForAllEvents = doEnableLine1 && !options.doStretch,
      doUseSecondAxis = doEnableLine2 && !doUseSameScaleForAllEvents,
      tickConfig = {
        callback: function (value, index, values) {
          return value.toLocaleString();
        },
        beginAtZero: true
      };

    if (doEnableLine1) {
      yAxes = yAxes.concat([{
        type: 'linear',
        id: 'y-axis-1',
        position: 'left',
        ticks: tickConfig,
        scaleLabel: {
          display: true,
          fontColor: doUseaSameScaleForAllEvents ? 'black' : 'rgba(20,20,255,1)',
          fontSize: 14,
          labelString: doUseSameScaleForAllEvents ? 'Events' : getLabel(options, '1')
        }
      }]);
    }

    if (doUseSecondAxis) {
      yAxes = yAxes.concat({
        type: 'linear',
        position: 'left',
        ticks: tickConfig,
        scaleLabel: {
          display: true,
          fontColor: 'rgba(255,110,0,1)',
          fontSize: 14,
          labelString: getLabel(options, '2')
        },
        // grid line settings
        gridLines: {
          drawOnChartArea: false // only want the grid lines for one axis to show up
        },
        id: 'y-axis-2'
      });
    }

    if (doEnableRatioLine) {
      yAxes = yAxes.concat({
        type: 'linear',
        position: 'right',
        // display: false,
        scaleLabel: {
          display: true,
          labelString: 'ratio',
          fontSize: 14
        },
        // grid line settings
        gridLines: {
          drawOnChartArea: false // only want the grid lines for one axis to show up
        },
        id: 'y-axis-ratio'
      });
    }

    return {
      // title: {
      //   display: true,
      //   text: 'Sitecues Metrics Chart'
      // },
      stacked: true,
      scales: {
        yAxes: yAxes,
        xAxes: [{
          type: 'time'
        }],
      },
      time: {
        parser: 'MM/DD/YYYY'
      },
      legend: {
        labels: {
          fontSize: 14
        }
      }
    };
  }

  createChart(options) {
    var
      startDateIndex = convertDateToIndex(options.startDate, 0),
      endDateIndex = convertDateToIndex(options.endDate, data.summary.config.dates.length - 1),
      data1 = getDataPoints('1', startDateIndex, endDateIndex, options),
      data2 = getDataPoints('2', startDateIndex, endDateIndex, options),
      numDays = data1.length || data2.length,
      total1 = getTotal(data1),
      total2 = getTotal(data2),
      avg1 = total1 / numDays,
      avg2 = total2 / numDays,
      avgRatio = total1 ? total2 / total1 : 0,
      datasets = [],
      doEnableLine1 = options.doEnableLine1 && data1.length,
      doEnableLine2 = options.doEnableLine2 && data2.length,
      doEnableRatioLine = doEnableLine1 && doEnableLine2 &&
        (options.event2 !== options.event1 ||
        options.ua2 !== options.ua1 ||
        options.loc2 !== options.loc1),
      doEnableAverageLines = false,
      yAxis2;

    updateSummaryBox(total1, total2, avg1, avg2, avgRatio);

    if (doEnableLine1) {
      datasets = datasets.concat({
        label: getLabel(options, '1'),
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
      yAxis2 = (options.doStretch || !doEnableLine1) ? 'y-axis-2' : 'y-axis-1';
      datasets = datasets.concat({
        label: getLabel(options, '2'),
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
        data: getRatioDataPoints(data1, data2, options),
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

    var
      lineChartData = {
        labels: getDateLabels(startDateIndex, endDateIndex),
        datasets: datasets
      },
      chartEl = document.getElementById('chart');

    return new Chart(chartEl, {
      type: 'line',
      data: lineChartData,
      options: getChartConfig(options, doEnableRatioLine, doEnableLine1, doEnableLine2)
    });
  }
}

var view = new AbView();