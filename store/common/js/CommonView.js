'use strict';

class CommonView {

  smoothData(origData, smoothSize) {
    const length = origData.length,
      movingAverage = [],
      numPointsAveragedPerPoint = 1 + smoothSize * 2; // Current point + number on each side
    for (let index = 0; index < length; index++) {
      let total = origData[index],
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
    const
      dataPoints = data1.map((value, index) =>
        typeof value === 'number' ? data2[index] / value : null // null means skip this data point -- no data
      ),
      smoothed = this.smoothData(dataPoints, smoothSize);

    return smoothed.map((value) => typeof value === 'number' ? value.toPrecision(4) : null);
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
    const labels = [];
    let index = startDateIndex;

    while (index <= endDateIndex) {
      labels.push(convertIndexToDate(index ++));
    }

    return labels;
  }

  updateChartView(userOptions) {
    if (this.chart) {
      this.chart.destroy();
    }

    const showChart = (chartInfo) => {
      if (!chartInfo) {
        return; // No chart to show
      }
      const chartEl = document.getElementById('chart');
      // Visible results panel
      $('#results').css('display', 'inline-block');

      Chart.defaults.global.defaultFontSize = 16;

      const finalChartOptions = {
        type: userOptions.chartType === 'bar' ? 'bar' : 'line', // line is the default for most graphs, and some only support line
        data: {
          labels: chartInfo.labels || this.getDateLabels(chartInfo.dateLabelStartIndex, chartInfo.dateLabelEndIndex),
          datasets: chartInfo.datasets
        },
        options: chartInfo.chartOptions
      };

      // Create the actual chart
      this.chart = new Chart(chartEl, finalChartOptions);

      return this.view;
    };

    // Get chart info
    this.getChart(userOptions)
      .then(showChart);
  }
}
