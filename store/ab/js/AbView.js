
'use strict';

class AbView extends CommonView {

  updateSummaryBox(valueNames, isRatio, values, colors) {
    const numValues = valueNames.length,
      ROW_LABELS = ['Event #1', 'Event #2', '#2/#1'];

    let tableHeaders = '<th></th>',
      rows = ROW_LABELS.map((label) => '<tr><th>' + label + '</th>');

    function asPrettyNumber(val) {
      return toPrecision(val, 3).toLocaleString();
    }

    for (let valueIndex = 0; valueIndex < numValues; valueIndex ++) {
      let colorStr = ' style="color:' + colors[valueIndex] + ';"';
      tableHeaders += '<th' + colorStr + '>' + valueNames[valueIndex] + '</th>';
      for (let rowIndex = 0; rowIndex < ROW_LABELS.length; rowIndex ++) {
        rows[rowIndex] += '<td ' + colorStr + '>' + asPrettyNumber(values[rowIndex][valueIndex]) + '</td>';
      }
    }
    for (let rowIndex = 0; rowIndex < ROW_LABELS.length; rowIndex ++) {
      rows[rowIndex] += '</tr>';
    }

    const allRows = rows[0] + (isRatio ? rows[1] + rows[2] : '');

    $('#results-labels').html(tableHeaders);
    $('#results-values').html(allRows);
  }

  getColor(valueIndex, totalValues, alpha) {
    return 'hsla(' + Math.round(360 * (valueIndex / totalValues)) + ',70%,40%,' + alpha + ')';
  }

  getColors(numColors, alpha) {
    const colors = [];
    for (let index = 0; index < numColors; index ++) {
      colors.push(this.getColor(index, numColors, alpha));
    }
    return colors;
  }

  getSourceDataSet(options, which) {
    // which === '1'|'2' for which line in the graph
    const eventName = options['event' + which],
      type = options['type' + which], // can be 'sessions' or 'users'
      apiPath = ['by-abtest', options.testName, eventName, type ].join('/');

    // function convertToArray(data) {
    //   const origCountsArray = data.countsArray;
    //   if (!origCountsArray) {
    //     console.log(data.err);
    //     return [];
    //   }
    //
    //   let finalCountsArray = [];
    //   // Fill from beginning of time to first date with undefined values
    //   finalCountsArray.length = data.startIndex;
    //   finalCountsArray = finalCountsArray.concat(origCountsArray);
    //   console.log(finalCountsArray);
    //   return finalCountsArray;
    // }

    return loadData(apiPath);
  }

  getChart(userOptions) {
    const testName = userOptions.testName;

    if (!testName) {
      return Promise.resolve(); // No test name
    }

    const
      dateInfo = globalData.abTestNames[userOptions.testName];

    if (!dateInfo) {
      return Promise.reject('No test data');
    }

    const
      dateLabelStartIndex = dateInfo.startIndex,
      dateLabelEndIndex = dateInfo.endIndex;

    const getChartImpl = ([abData1, abData2]) => {
      const
        numDays = dateLabelEndIndex - dateLabelStartIndex + 1,
        testValues1 = Object.keys(abData1 || []),
        testValues2 = Object.keys(abData2 || []),
        testValues = [... new Set(testValues1.concat(testValues2))].sort(),
        numValues = testValues.length,
        isRatio = Boolean(userOptions.event2) && userOptions.event2 !== userOptions.event1,
        fgColors = this.getColors(numValues, 0.8),
        bgColors = this.getColors(numValues, 0.2),
        chartType = userOptions.chartType,
        isBar = chartType === 'bar',
        totals1 = testValues.map((testValue) => this.getTotal(abData1[testValue])),
        totals2 = testValues.map((testValue) => this.getTotal(abData2[testValue])),
        averages1 = totals1.map((total) => Math.round(total / numDays)),
        averages2 = totals2.map((total) => Math.round(total / numDays)),
        ratios = testValues.map((testValue, index) =>
          isRatio ? toPrecision(totals2[index] / totals1[index], 3) : totals1[index]
        ),
        chartOptions = this.getChartOptions(isRatio, chartType, testValues),
        smoothSize = chartType === 'smooth' ? 3 : 0;

      // Summarize numbers as text
      this.updateSummaryBox(testValues, isRatio, [averages1, averages2, ratios], fgColors);

      if (isBar) {
        // Sort labels and data by data amount
        const sourceData = isRatio ? ratios : totals1,
          labels = testValues.slice(), // Make a copy
          bar = {};
        labels.forEach((label, index) => {
          bar[label] = {
            label,
            data: sourceData[index],
            backgroundColor: fgColors[index]
          };
        });
        const sortedLabels = labels.sort((a, b) => bar[a].data > bar[b].data ? 1 : -1),
          bars = sortedLabels.map((label) => bar[label]),
          datasets = [{
            backgroundColor: bars.map((bar) => bar.backgroundColor),
            data: bars.map((bar) => bar.data)
          }];

        const toPercent = (ratio) => (ratio >= 1 ? '+': '') + (Math.round((ratio -1) * 1000) / 10) + '%',
          getFriendlyLabel = (label) => label === '*base*' ? label : label + ' ' + toPercent(bar[label].data / bar['*base*'].data);

        return Promise.resolve({
          labels: sortedLabels.map(getFriendlyLabel),
          datasets,
          chartOptions
        });
      }

      // Line graph
      return Promise.resolve({
        datasets: this.getLineData(testValues, abData1, abData2, isRatio, bgColors, fgColors, smoothSize),
        chartOptions,
        dateLabelStartIndex,
        dateLabelEndIndex
      });
    };

    const sourceDataSets = [
      this.getSourceDataSet(userOptions, '1'),
      this.getSourceDataSet(userOptions, '2')
    ];

    return Promise.all(sourceDataSets)
      .then(getChartImpl);

  }

  getLineData(testValues, abData1, abData2, isRatio, bgColors, fgColors, smoothSize) {
    return testValues.map((testValue, index) => {
      const data1 = abData1[testValue],
        data2 = abData2[testValue],
        data = isRatio ? this.getRatioDataPoints(data1, data2, smoothSize) :
          this.smoothData(data1, smoothSize);
      return {
        label: testValue,
        backgroundColor: bgColors[index],
        borderColor: fgColors[index],
        fill: false,
        pointHitRadius: 10,
        data: data || [0]
      }
    });
  }

  getChartTitle(userOptions) {
    return 'Sitecues AB test viewer: ' + userOptions.testName;
  }

  getChartOptions(isRatio, type) {
    const
      isLine = type !== 'bar',
      tickConfig = {
        callback: function (value) {
          return value.toLocaleString();
        },
        beginAtZero: true
      },
      yAxes = [
        {
          type: 'linear',
          position: 'left',
          ticks: tickConfig,
          scaleLabel: {
            display: true,
            fontColor: 'black',
            fontSize: 14,
            labelString: isRatio ? 'Events' : 'Ratio event #2/#1'
          }
        }
      ];

    return {
      // title: {
      //   display: true,
      //   text: 'Sitecues Metrics Chart'
      // },
      stacked: isLine,
      scales: {
        yAxes: yAxes,
        xAxes: isLine && [{ type: 'time' }]
      },
      time: {
        parser: 'MM/DD/YYYY'
      },
      legend: {
        labels: {
          fontSize: 14
        },
        display: isLine
      }
    };
  }
}

const view = new AbView();