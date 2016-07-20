// TODO clean up code

var OPTIONS = {
  // title: {
  //   display: true,
  //   text: 'Sitecues Metrics Chart'
  // },
  stacked: true,
  scales: {
    yAxes: [
      {
        type: 'linear',
        id: 'y-axis-1'
      },
      {
        type: 'linear',
        position: 'right',
        // display: false,
        min: 0,
        max: 7000,
        // grid line settings
        gridLines: {
          drawOnChartArea: false // only want the grid lines for one axis to show up
        },
        id: 'y-axis-2'
      }, {
        type: 'linear',
        position: 'right',
        // display: false,
        min: 0,
        max: 7000,
        // grid line settings
        gridLines: {
          drawOnChartArea: false // only want the grid lines for one axis to show up
        },
        id: 'y-axis-ratio'
      }
    ]
    ,
    xAxes: [{
      type: 'time'
    }]
  },
  time: {
    parser: 'MM/DD/YY'
  }
};

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

function smoothData(origData, smoothSize) {
  var length = origData.length,
    movingAverage = [],
    numPointsAveragedPerPoint = 1 + smoothSize * 2; // Current point + number on each side
  for (var index = 0; index < length; index++)
  {
    var total = origData[index],
      smoothDistance = smoothSize;
    while (smoothDistance > 0) {
      total += origData[Math.max(0, index - smoothDistance)] +
        origData[Math.min(length - 1, index + smoothDistance)];
      -- smoothDistance;
    }
    movingAverage.push(Math.round(total / numPointsAveragedPerPoint));
  }

  return movingAverage;
}

// When a data point is null, it means we are missing data
// This function will just copy the previous value -- so it assumes that we have good data on day 1
// TODO consider a special fix for July 3-5 that uses average of July 2 & 6
function removeHolesFromData(dataPoints, missingDays) {
  var copyOfDataPoints = dataPoints.slice(),
    length = copyOfDataPoints.length,
    prevValue = copyOfDataPoints[0];
  for (var index = 1; index < length; index ++) {
    if (copyOfDataPoints[index] === 0 && missingDays.indexOf(index) >= 0) {
      copyOfDataPoints[index] = prevValue;
    }
    else {
      prevValue = copyOfDataPoints[index];
    }
  }

  return copyOfDataPoints;
}

// which === '1'|'2' for which line in the graph
function getDataPoints(which, data, startDateIndex, endDateIndex, options) {
  var smoothSize = options.doSmooth ? 3 : 0, // +/- 3 days = 1 week
    dataSource = getDataSource(which, data, options),
    correctedData,
    smoothedData,
    doFixHoles;

  if (dataSource) {
    doFixHoles = options.doFixHoles && data.missingDays && data.missingDays.length;
    correctedData = doFixHoles ? removeHolesFromData(dataSource, data.missingDays) : dataSource;
    smoothedData = smoothData(correctedData, smoothSize);
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
  var precisionHelper = Math.pow(10, precision);
  return Math.floor(val * precisionHelper) / precisionHelper;
}

function getRatioDataPoints(data1, data2) {
  return data1.map(function(value, index) {
    var value2 = data2[index];
    return value2 ? toPrecision(value / data2[index], 4) : null; // null means skip this data point -- no data
  });
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
    total1,
    total2,
    averageRatio,
    datasets = [{
      label: getLabel(options, '1') + '     ',
      borderColor: 'rgba(255,110,0,.4)',
      backgroundColor: 'rgba(255,110,0,0.1)',
      fill: true,
      pointHitRadius: 10,
      data: data1 || [0],
      yAxisID: 'y-axis-1'
    }];

  // If event2 is different, add it as a dataset as well as ration between the two
  if (options.event2 !== options.event1 ||
      options.ua2 !== options.ua1 ||
      options.loc2 !== options.loc1) {
    datasets = datasets.concat({
      label: getLabel(options, '2') + '     ',
      backgroundColor: 'rgba(20,20,255,0.1)',
      borderColor: 'rgba(20,20,255,.4)',
      pointHitRadius: 10,
      data: data2 || [0],
      yAxisID: options.doStretch ? 'y-axis-2' : 'y-axis-1'
    });
    if (data1 && data2) {
      total1 = getTotal(data1);
      total2 = getTotal(data2);
      averageRatio = toPrecision(total1 / total2, 4);
      datasets = datasets.concat({
        label: 'ratio #1/#2', //[average = ' + (total1 / total2).toFixed(4) + ']',
        data: getRatioDataPoints(data1, data2),
        yAxisID: 'y-axis-ratio'
      }, {
        label: 'average ratio',
        backgroundColor: 'rgba(0,0,0,0)',
        pointBorderColor: 'rgba(0,0,0,0)',
        data: new Array(data1.length).fill( averageRatio ),
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
    options: OPTIONS
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