
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

  getChartInfo(userOptions) {
    const testName = userOptions.testName,
      event1 = userOptions.event1,
      event2 = userOptions.event2,
      dateInfo = data.abTest.dateInfo[userOptions.testName],
      startDateIndex = dateInfo.startIndex,
      endDateIndex = dateInfo.endIndex,
      eventCounts = data.abTest.eventCount,
      abData1 = eventCounts[event1] && eventCounts[event1][testName],
      abData2 = event2 && eventCounts[event2] && eventCounts[event2][testName],
      testValues1 = Object.keys(abData1 || []),
      testValues2 = Object.keys(abData2 || []),
      testValues = [ ... new Set(testValues1.concat(testValues2))].sort(),
      numValues = testValues.length,
      isRatio = Boolean(userOptions.event2),
      chartOptions = this.getChartOptions(isRatio),
      fgColors = this.getColors(numValues, 0.4),
      bgColors = this.getColors(numValues, 0.1),
      averages = testValues.map((testValue) => {
        const total1 = this.getTotal(abData1[testValue]);
        if (abData2) {
          return this.getTotal(abData2[testValue]) / total1;
        }
        return total1;
      });

    this.updateSummaryBox(testValues, averages, fgColors);

    const datasets =
      testValues.map((testValue, index) => {
        const data1 = abData1[testValue],
          data2 = abData2[testValue],
          data = isRatio ? this.getRatioDataPoints(data1, data2, userOptions) : data1;
        return {
          label: testValue,
          backgroundColor: bgColors[index],
          borderColor: fgColors[index],
          fill: false,
          pointHitRadius: 10,
          data: data || [0],
          yAxisID: 'y-axis'
        }
      });

    return {
      datasets,
      chartOptions,
      startDateIndex,
      endDateIndex
    };
  }

  getChartTitle(userOptions) {
    return 'Sitecues AB test viewer: ' + userOptions.testName;
  }

  getChartOptions(isRatio) {
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
          id: 'y-axis',
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
}

const view = new AbView();