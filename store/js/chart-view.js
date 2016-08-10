// TODO clean up code

'use strict';

function getChartConfig(options, isLine2Different) {
  var yAxes = [
    {
      type: 'linear',
      id: 'y-axis-1',
      position: 'left',
      beginAtZero: !options.doStretch,
      scaleLabel: {
        display: true,
        fontColor: 'rgba(255,110,0,1)',
        fontSize: 14,
        labelString: getLabel(options, '1')
      }
    }
  ];

  if (isLine2Different) {
    if (options.doStretch) {
      yAxes = yAxes.concat({
        type: 'linear',
        position: 'right',
        scaleLabel: {
          display: true,
          fontColor: 'rgba(20,20,255,1)',
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
    yAxes = yAxes.concat({
      type: 'linear',
      position: 'right',
      // display: false,
      beginAtZero: true,
      min: 0,
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

function convertDateToIndex(date, datesWithDataAvailable, defaultValueIfNotFound) {
  var extractParts = date.split('/'),
    month = extractParts[0],
    day = extractParts[1],
    year = extractParts[2],
    dateAsInt = parseInt(year + month + day),
    dateIndex = datesWithDataAvailable.indexOf(dateAsInt);

  return dateIndex < 0 ? defaultValueIfNotFound : dateIndex;
}

function getDateLabels(startDateIndex, endDateIndex, datesWithDataAvailable) {
  var labels = [],
    index = startDateIndex;

  function convertIndexToDate(dateIndex) {
    var dateAsYYYYMMDD = datesWithDataAvailable[dateIndex].toString(),
      year = dateAsYYYYMMDD.substr(2, 2),
      month = dateAsYYYYMMDD.substr(4, 2),
      day = dateAsYYYYMMDD.substr(6, 2);

    return month + '/' + day + '/' + year;
  }

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
function getDataPoints(which, data, startDateIndex, endDateIndex, options) {
  var dataSource = getDataSource(which, data, options),
    smoothedData;

  if (dataSource) {
    smoothedData = smoothData(dataSource, options);
    return smoothedData.slice(startDateIndex, endDateIndex + 1);
  }
}

// which === '1'|'2' for which line in the graph
function getDataSource(which, data, options) {
  var eventName = options['event' + which],
    uaName = options['ua' + which],
    location = options['loc' + which],
    eventTotals = data.eventTotals,
    eventMap = eventTotals.byLocation[location];

  return eventMap && eventMap[eventName] && eventMap[eventName][uaName];
}

function toPrecision(val, precision) {
  return parseFloat(val.toPrecision(precision));
}

function getRatioDataPoints(data1, data2, options) {
  var dataPoints = data1.map(function(value, index) {
    var value2 = data2[index];
    return value2 ? toPrecision(value / data2[index], 4) : null; // null means skip this data point -- no data
  });
  return smoothData(dataPoints, options);
}

function getTotal(data) {
  if (!data) {
    return 0;
  }

  function sum(a, b) {
    return a + b;
  }

  return data.reduce(sum, 0);
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

function createChartView(data, options) {
  var
    datesWithDataAvailable = data.summary.config.dates,
    startDateIndex = convertDateToIndex(options.startDate, datesWithDataAvailable, 0),
    endDateIndex = convertDateToIndex(options.endDate, datesWithDataAvailable, data.summary.config.dates.length - 1),
    data1 = getDataPoints('1', data, startDateIndex, endDateIndex, options),
    data2 = getDataPoints('2', data, startDateIndex, endDateIndex, options),
    isLine2Different = options.event2 !== options.event1 ||
      options.ua2 !== options.ua1 ||
      options.loc2 !== options.loc1,
    numDays = data1.length,
    total1 = getTotal(data1),
    total2,
    averageRatio,
    datasets = [];

    if (options.doEnableLine1) {
      datasets = datasets.concat([{
        label: getLabel(options, '1'),
        borderColor: 'rgba(255,110,0,.5)',
        backgroundColor: 'rgba(255,110,0,0.1)',
        fill: true,
        pointHitRadius: 10,
        data: data1 || [0],
        yAxisID: 'y-axis-1'
      }, {
        label: 'total: ' + total1.toLocaleString() + ' (' + toPrecision(total1 / numDays, 4).toLocaleString() + ' per day)',
        backgroundColor: 'rgba(0,0,0,0)',
        pointBorderColor: 'rgba(0,0,0,0)',
        borderColor: 'rgba(255,110,0,.4)',
        borderDash: [10, 5],
        fill: false,
        pointHitRadius: 0,
        data: new Array(numDays).fill(toPrecision(total1 / numDays, 4)),
        yAxisID: 'y-axis-1'
      }]);
    }

  // If event2 is different, add it as a dataset as well as ration between the two
  if (isLine2Different && options.doEnableLine2) {
    total2 = getTotal(data2);
    datasets = datasets.concat([{
      label: getLabel(options, '2'),
      backgroundColor: 'rgba(20,20,255,0.1)',
      borderColor: 'rgba(20,20,255,.4)',
      pointHitRadius: 10,
      data: data2 || [0],
      yAxisID: options.doStretch ? 'y-axis-2' : 'y-axis-1'
    }, {
      label: 'total: ' + total2.toLocaleString() + ' (' + toPrecision(total2 / numDays, 4).toLocaleString() + ' per day)',
      backgroundColor: 'rgba(0,0,0,0)',
      borderColor: 'rgba(20,20,255,.4)',
      pointBorderColor: 'rgba(0,0,0,0)',
      borderDash: [10, 5],
      pointHitRadius: 0,
      data: new Array(numDays).fill(toPrecision(total2 / numDays, 4)),
      yAxisID: options.doStretch ? 'y-axis-2' : 'y-axis-1'
    }]);
    if (data1 && data2 && options.doEnableLine1) {
      averageRatio = toPrecision(total1 / total2, 4);
      datasets = datasets.concat({
        label: 'ratio #1/#2', //[average = ' + (total1 / total2).toFixed(4) + ']',
        data: getRatioDataPoints(data1, data2, options),
        yAxisID: 'y-axis-ratio'
      }, {
        label: 'average ratio ' + averageRatio,
        backgroundColor: 'rgba(0,0,0,0)',
        pointBorderColor: 'rgba(0,0,0,0)',
        borderDash: [10, 5],
        pointHitRadius: 0,
        data: new Array(numDays).fill( averageRatio ),
        yAxisID: 'y-axis-ratio'
      });
    }
  }

  var
    lineChartData = {
      labels: getDateLabels(startDateIndex, endDateIndex, datesWithDataAvailable),
      datasets: datasets
    },
    chartEl = document.getElementById('chartView');

  return new Chart(chartEl, {
    type: 'line',
    data: lineChartData,
    options: getChartConfig(options, isLine2Different)
  });
}

function refresh(data, options) {
  refresh.data = data;

  if (refresh.chartView) {
    refresh.chartView.destroy();
  }

  refresh.chartView = createChartView(data, options);

  return refresh.view;
}

// To help with debugging
function getData() {
  return refresh.data;
}

function updateChartView(data, options) {

  refresh(data, options);

  // Snippet to update points and animate to new values
  // myLiveChart.datasets[1].points[indexToUpdate].value = Math.random() * 100;
  // myLiveChart.update();

  return false;
}