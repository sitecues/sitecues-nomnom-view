// TODO clean up code

'use strict';

class CommonView {

  smoothData(origData, smoothSize) {
    var length = origData.length,
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
          --numPointsAveragedThisPoint;
        }
        if (index + smoothDistance < length) {
          total += origData[index + smoothDistance];
        }
        else {
          --numPointsAveragedThisPoint;
        }
        --smoothDistance;
      }
      movingAverage.push(toPrecision(total / numPointsAveragedThisPoint, 4));
    }

    return movingAverage;
  }

  getRatioDataPoints(data1, data2, smoothSize) {
    var dataPoints = data1.map(function (value, index) {
      return value ? toPrecision(data2[index] / value, 4) : null; // null means skip this data point -- no data
    });

    return this.smoothData(dataPoints, smoothSize);
  }

  getTotal(dataPoints) {
    if (!dataPoints) {
      return 0;
    }

    function sum(a, b) {
      return a + b;
    }

    return dataPoints.reduce(sum, 0);
  }

  getDateLabels(startDateIndex, endDateIndex) {
    var labels = [],
      index = startDateIndex;

    while (index <= endDateIndex) {
      labels.push(convertIndexToDate(index ++));
    }

    return labels;
  }

  updateChartView(userOptions) {
    if (this.chart) {
      this.chart.destroy();
    }

    // Get chart info
    var chartInfo = this.getChart(userOptions),
      chartEl = document.getElementById('chart');

    // Create the actual chart
    this.chart = new Chart(chartEl, {
      type: userOptions.type === 'bar' ? 'bar' : 'line', // line is the default for most graphs, and some only support line
      data: {
        labels: chartInfo.textLabels || this.getDateLabels(chartInfo.dateLabelStartIndex, chartInfo.dateLabelEndIndex),
        datasets: chartInfo.datasets
      },
      options: chartInfo.chartOptions
    });

    return this.view;
  }
}
