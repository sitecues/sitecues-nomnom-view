// TODO clean up code

'use strict';

function getChartConfig(options, doEnableRatioLine, doEnableLine1, doEnableLine2) {
  var yAxes = [],
    doUseSameScaleForAllEvents = doEnableLine1 && !options.doStretch,
    doUseSecondAxis = doEnableLine2 && !doUseSameScaleForAllEvents,
    tickConfig = {
      callback: function(value, index, values) {
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
        fontColor: doUseSameScaleForAllEvents ? 'black' : 'rgba(20,20,255,1)',
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

function getDateLabels(startDateIndex, endDateIndex) {
  var labels = [],
    index = startDateIndex;

  while (index <= endDateIndex) {
    labels.push(convertIndexToDate(index ++ ));
  }

  return labels;
}

function smoothData(origData, options) {
  var length = origData.length,
    smoothSize = options.doSmooth ? (options.doUltraSmooth ? 10 : 3) : 0, // +/- 3 days = 1 week vs +/- 10 days = 3 weeks
    movingAverage = [],
    numPointsAveragedPerPoint = 1 + smoothSize * 2; // Current point + number on each side
  for (var index = 0; index < length; index++) {
    var total = origData[index],
      smoothDistance = smoothSize,
      numPointsAveragedThisPoint = numPointsAveragedPerPoint;
    while (smoothDistance > 0) {
      if (index - smoothDistance >= 0) {
        total += origData[index - smoothDistance];
      }
      else {
        -- numPointsAveragedThisPoint;
      }
      if (index + smoothDistance < length) {
        total += origData[index + smoothDistance];
      }
      else {
        -- numPointsAveragedThisPoint;
      }
      -- smoothDistance;
    }
    movingAverage.push(toPrecision(total / numPointsAveragedThisPoint, 4));
  }

  return movingAverage;
}

// // When a data point is null, it means we are missing data
// // This function will just copy the previous value -- so it assumes that we have good data on day 1
// // TODO consider a special fix for July 3-5 that uses average of July 2 & 6
// function removeHolesFromData(dataPoints, missingDays) {
//   var copyOfDataPoints = dataPoints.slice(),
//     length = copyOfDataPoints.length,
//     prevValue = copyOfDataPoints[0];
//   for (var index = 1; index < length; index ++) {
//     if (copyOfDataPoints[index] === 0 && missingDays.indexOf(index) >= 0) {
//       copyOfDataPoints[index] = prevValue;
//     }
//     else {
//       prevValue = copyOfDataPoints[index];
//     }
//   }
//
//   return copyOfDataPoints;
// }

// which === '1'|'2' for which line in the graph
function getDataPoints(which, startDateIndex, endDateIndex, options) {
  var dataSource = getDataSource(which, options),
    smoothedData;

  if (dataSource) {
    smoothedData = smoothData(dataSource, options);
    return smoothedData.slice(startDateIndex, endDateIndex + 1);
  }
}

// which === '1'|'2' for which line in the graph
function getDataSource(which, options) {
  var eventName = options['event' + which],
    uaName = options['ua' + which],
    location = options['loc' + which],
    eventTotals = data.eventTotals,
    eventMap = eventTotals.byLocation[location],
    dataSource = eventMap && eventMap[eventName] && eventMap[eventName][uaName];

  return dataSource || [];
}

function toPrecision(val, precision) {
  return parseFloat(val.toPrecision(precision));
}

function getRatioDataPoints(data1, data2, options) {
  var dataPoints = data1.map(function(value, index) {
    return value ? toPrecision(data2[index] / value, 4) : null; // null means skip this data point -- no data
  });
  return smoothData(dataPoints, options);
}

function getTotal(dataPoints) {
  if (!dataPoints) {
    return 0;
  }

  function sum(a, b) {
    return a + b;
  }

  return dataPoints.reduce(sum, 0);
}

function getLabel(options, which) {
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

function updateSummaryBox(total1, total2, avg1, avg2, avgRatio) {
  function toStr(num) {
    return num ? Math.round(num).toLocaleString() : '';
  }
  $('#total1').text(toStr(total1));
  $('#total2').text(toStr(total2));
  $('#avg1').text(toStr(avg1));
  $('#avg2').text(toStr(avg2));
  $('#avg-ratio').text(avgRatio ? avgRatio.toPrecision(3): '');
}

function createChartView(options) {
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
    chartEl = document.getElementById('chartView');

  return new Chart(chartEl, {
    type: 'line',
    data: lineChartData,
    options: getChartConfig(options, doEnableRatioLine, doEnableLine1, doEnableLine2)
  });
}

function refresh(options) {
  if (refresh.chartView) {
    refresh.chartView.destroy();
  }

  refresh.chartView = createChartView(options);

  return refresh.view;
}

// To help with debugging
function getData() {
  return data;
}

function updateChartView(options) {

  refresh(options);

  // Snippet to update points and animate to new values
  // myLiveChart.datasets[1].points[indexToUpdate].value = Math.random() * 100;
  // myLiveChart.update();

  return false;
}