
'use strict';

class AbView extends CommonView {

  updateSummaryBox(valueNames, averages, colors) {
    const numItems = valueNames.length;

    let tableHeaders = '',
      tableAverages = '';


    for (let index = 0; index < numItems; index ++) {
      let colorStr = ' style="color:' + colors[index] + ';"';
      tableHeaders += '<th' + colorStr + '>' + valueNames[index] + '</th>';
      tableAverages += '<td ' + colorStr + '>' + toPrecision(averages[index], 3) + '</td>';
    }

    $('#results-labels').html(tableHeaders);
    $('#results-averages').html(tableAverages);
  }

  getColor(valueIndex, totalValues, alpha) {
    return 'hsl(' + (valueIndex / totalValues) + '.7,.7,' + alpha + ')';
  }

  getColors(numColors, alpha) {
    const colors = [];
    for (let index = 0; index < numColors; index ++) {
      colors.push(this.getColor(index, numColors, alpha));
    }
    return colors;
  }

  // TODO sort by size? (Especially nice for bar chart)
  // TODO show info for baseline (default)
  // TODO also show totals in summary results box
  getChartInfo(userOptions) {
    const testName = userOptions.testName,
      event1 = userOptions.event1,
      event2 = userOptions.event2,
      dateInfo = data.abTest.dateInfo[userOptions.testName],
      startDateIndex = dateInfo.startIndex,
      endDateIndex = dateInfo.endIndex,
      eventCounts = data.abTest.eventCount,
      abData1 = (event1 && eventCounts[event1] && eventCounts[event1][testName]) || [],
      abData2 = (event2 && eventCounts[event2] && eventCounts[event2][testName]) || [],
      testValues1 = Object.keys(abData1 || []),
      testValues2 = Object.keys(abData2 || []),
      testValues = [ ... new Set(testValues1.concat(testValues2))].sort(),
      numValues = testValues.length,
      isRatio = Boolean(userOptions.event2),
      fgColors = this.getColors(numValues, 0.4),
      bgColors = this.getColors(numValues, 0.1),
      chartType = userOptions.type,
      averages = testValues.map((testValue) => {
        const total1 = this.getTotal(abData1[testValue]);
        if (abData2) {
          return this.getTotal(abData2[testValue]) / total1;
        }
        return total1;
      }),
      chartOptions = this.getChartOptions(isRatio, chartType, testValues);

    // Summarize numbers as text
    this.updateSummaryBox(testValues, averages, fgColors);

    const dataFn = chartType === 'bar' ? this.getBarData : this.getLineData,
      datasets = dataFn(testValues, abData1, abData2, isRatio, bgColors, fgColors),
      labels = chartType === 'bar' && testValues;

    return {
      datasets,
      labels,
      chartOptions,
      startDateIndex,
      endDateIndex
    };
  }

  getLineData(testValues, abData1, abData2, isRatio, bgColors, fgColors) {
    return testValues.map((testValue, index) => {
      const data1 = abData1[testValue],
        data2 = abData2[testValue],
        smoothSize = options.type === 'line' ? 3 : 0,
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

  getBarData(testValues, abData1, abData2, isRatio, bgColors, fgColors) {
    const dataPoints = testValues.map((testValue, index) => {
      const data1 = abData1[testValue],
        data2 = abData2[testValue],
        total1 = this.getTotal(data1),
        total2 = this.getTotal(data2);
      return isRatio ? total2 / total1 : total1;
    });

    return {
      data: dataPoints,
      backgroundColor: fgColors
    };
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