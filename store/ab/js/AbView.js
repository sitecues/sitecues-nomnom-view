
'use strict';

class AbView extends CommonView {

  updateSummaryBox(valueNames, isRatio, values, colors) {
    const numValues = valueNames.length,
      ROW_LABELS = ['Total #1', 'Total #2', 'Average'];

    let tableHeaders = '<th></th>',
      rows = ROW_LABELS.map((label) => '<tr><th>' + label + '</th>');

    for (let valueIndex = 0; valueIndex < numValues; valueIndex ++) {
      let colorStr = ' style="color:' + colors[valueIndex] + ';"';
      tableHeaders += '<th' + colorStr + '>' + valueNames[valueIndex] + '</th>';
      for (let rowIndex = 0; rowIndex < ROW_LABELS.length; rowIndex ++) {
        rows[rowIndex] += '<td ' + colorStr + '>' + toPrecision(values[rowIndex][valueIndex], 3) + '</td>';
      }
    }
    for (let rowIndex = 0; rowIndex < ROW_LABELS.length; rowIndex ++) {
      rows[rowIndex] += '</tr>';
    }

    const allRows = rows[0] + (isRatio ? rows[1] : '') + rows[2];

    $('#results-labels').html(tableHeaders);
    $('#results-values').html(allRows);
  }

  getColor(valueIndex, totalValues, alpha) {
    return 'hsla(' + 360 * (valueIndex / totalValues) + ',70%,40%,' + alpha + ')';
  }

  getColors(numColors, alpha) {
    const colors = [];
    for (let index = 0; index < numColors; index ++) {
      colors.push(this.getColor(index, numColors, alpha));
    }
    return colors;
  }

  getChart(userOptions) {
    const testName = userOptions.testName,
      event1 = userOptions.event1,
      event2 = userOptions.event2,
      eventCounts = data.abTest.eventCount,
      abData1 = (event1 && eventCounts[event1] && eventCounts[event1][testName]) || [],
      abData2 = (event2 && eventCounts[event2] && eventCounts[event2][testName]) || [],
      testValues1 = Object.keys(abData1 || []),
      testValues2 = Object.keys(abData2 || []),
      testValues = [ ... new Set(testValues1.concat(testValues2))].sort(),
      numValues = testValues.length,
      isRatio = Boolean(userOptions.event2),
      fgColors = this.getColors(numValues, 0.8),
      bgColors = this.getColors(numValues, 0.2),
      chartType = userOptions.type,
      isBar = chartType === 'bar',
      totals1 = testValues.map((testValue) => this.getTotal(abData1[testValue])),
      totals2 = testValues.map((testValue) => this.getTotal(abData2[testValue])),
      averages = testValues.map((testValue, index) =>
        isRatio ? totals2[index] / totals1[index] : totals1[index]
      ),
      chartOptions = this.getChartOptions(isRatio, chartType, testValues),
      smoothSize = userOptions.type === 'line' ? 3 : 0;

      // Summarize numbers as text
    this.updateSummaryBox(testValues, isRatio, [totals1, totals2, averages], fgColors);

    if (isBar) {
      // Sort labels and data by data amount
      const sourceData = isRatio ? averages : totals1,
        labels = testValues.slice(), // Make a copy
        labelToData = {};
      labels.forEach((label, index) => {
        labelToData[label] = sourceData[index];
      });
      const sortedLabels = labels.sort((a,b) => labelToData[a] > labelToData[b] ? 1 : -1),
        sortedData = labels.map((label) => labelToData[label]);

      return {
        datasets: sortedData,
        textLabels: sortedLabels,
        backgroundColor: fgColors,
        chartOptions
      }
    }

    const
      dateInfo = data.abTest.dateInfo[userOptions.testName],
      dateLabelStartIndex = dateInfo.startIndex,
      dateLabelEndIndex = dateInfo.endIndex;

      // Line graph
    return {
      datasets: this.getLineData(testValues, abData1, abData2, isRatio, bgColors, fgColors, smoothSize),
      chartOptions,
      dateLabelStartIndex,
      dateLabelEndIndex
    };
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

  getXAxes(type, values) {
    if (type === 'bar') {
      return; // No need to define?
      // return values.map((values) => {
      // });
    }

    // Line chart (time series)
    return [{
      type: 'time'
    }];
  }

  getChartOptions(isRatio, type, values) {
    const
      tickConfig = {
        callback: function (value) {
          return value.toLocaleString();
        },
        beginAtZero: !isRatio
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
      stacked: true,
      scales: {
        yAxes: yAxes,
        xAxes: this.getXAxes(type, values)
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
}

const view = new AbView();