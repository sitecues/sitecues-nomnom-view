// TODO second and third lines are near bottom, scales for them are -1 to 1
var OPTIONS = {
  title: {
    display: true,
    text: 'Chart.js Line Chart - Custom Tooltips'
  },
  stacked: true,
  scales: {
    yAxes: [
      {
        type: 'linear',
        id: 'y-axis-1'
      },
      /* {
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
      }, */ {
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

// which === '1'|'2' for which line in the graph
function getDataPoints(which, data, startDateIndex, endDateIndex, options) {
  var smoothSize = options.smoothSize,
    dataSource = getDataSource(which, data, options),
    dataToUse;

  if (dataSource) {
    dataToUse = smoothData(dataSource, smoothSize);
    return dataToUse.slice(startDateIndex, endDateIndex + 1);
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

function getRatioDataPoints(data1, data2) {
  return data1.map(function(value, index) {
    var value2 = data2[index];
    return value2 ? value / data2[index] : null; // null means skip this data point -- no data
  });
}

function createChartView(data, options) {
  var
    datesWithDataAvailable = data.summary.config.dates,
    startDateIndex = convertDateToIndex(options.startDate, datesWithDataAvailable, 0),
    endDateIndex = convertDateToIndex(options.endDate, datesWithDataAvailable, data.summary.config.dates.length - 1),
    data1 = getDataPoints('1', data, startDateIndex, endDateIndex, options),
    data2 = getDataPoints('2', data, startDateIndex, endDateIndex, options),
    datasets = [{
      label: options.event1 + '/' + options.ua1 + '/' + options.loc1 + '     ',
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
      label: options.event2 + '/' + options.ua2 + '/' + options.loc2 + '     ',
      backgroundColor: 'rgba(20,20,255,0.1)',
      borderColor: 'rgba(20,20,255,.4)',
      pointHitRadius: 10,
      data: data2 || [0],
      yAxisID: 'y-axis-1'
    });
    if (data1 && data2) {
      datasets = datasets.concat({
        label: 'ratio',
        data: getRatioDataPoints(data1, data2),
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

  var chartView = refresh(data, options);

  // Snippet to update points and animate to new values
  // myLiveChart.datasets[1].points[indexToUpdate].value = Math.random() * 100;
  // myLiveChart.update();

  return false;
}