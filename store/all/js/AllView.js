'use strict';

class AllView extends CommonView {

  getSmoothSize(userOptions) {
    return userOptions.doSmooth ? (userOptions.doUltraSmooth ? 10 : 3) : 0;
  }

  // which === '1'|'2' for which line in the graph
  // smoothSize === +/- 3 days = 1 week vs +/- 10 days = 3 weeks
  getDataPoints(dataSource, startDateIndex, endDateIndex, smoothSize) {
    if (dataSource) {
      const smoothedData = smoothSize ? this.smoothData(dataSource, smoothSize) : dataSource;
      return smoothedData.slice(startDateIndex, endDateIndex + 1);
    }
  }

  getLabel(options, which) {
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

  getChartTitle(userOptions) {
    return 'Sitecues ' + this.getLabel(userOptions, '1') + ' vs ' + this.getLabel(userOptions, '2');
  }

  updateSummaryBox(total1, total2, avg1, avg2, avgRatio) {
    function toStr(num) {
      return num ? Math.round(num).toLocaleString() : '';
    }

    $('#total1').text(toStr(total1));
    $('#total2').text(toStr(total2));
    $('#avg1').text(toStr(avg1));
    $('#avg2').text(toStr(avg2));
    $('#avg-ratio').text(avgRatio ? avgRatio.toPrecision(3) : '');
  }

  getSourceDataSet(options, which) {
    // which === '1'|'2' for which line in the graph
    const eventName = options['event' + which],
      ua = options['ua' + which],
      loc = options['loc' + which],
      type = options['type' + which], // can be 'sessions' or 'users'
      apiPath = ['by-location-and-ua', loc, ua, eventName, type ].join('/');

    function convertToArray(data) {
      const origCountsArray = data.countsArray;
      if (!origCountsArray) {
        console.log(data.err);
        return [];
      }

      let finalCountsArray = [];
      // Fill from beginning of time to first date with undefined values
      finalCountsArray.length = data.startIndex;
      finalCountsArray = finalCountsArray.concat(origCountsArray);
      console.log(finalCountsArray);
      return finalCountsArray;
    }

    return loadData(apiPath)
      .then(convertToArray);
  }

  getChart(userOptions) {

    const getChartImpl = (sourceDataSets) => {
      const
        startDateIndex = convertDateToIndex(userOptions.startDate, 0),
        endDateIndex = convertDateToIndex(userOptions.endDate, globalData.summary.config.dates.length - 1),
        smoothSize = this.getSmoothSize(userOptions),
        data1 = this.getDataPoints(sourceDataSets[0], startDateIndex, endDateIndex, smoothSize),
        data2 = this.getDataPoints(sourceDataSets[1], startDateIndex, endDateIndex, smoothSize),
        numDays = data1.length || data2.length,
        total1 = this.getTotal(data1),
        total2 = this.getTotal(data2),
        avg1 = total1 / numDays,
        avg2 = total2 / numDays,
        avgRatio = total1 ? total2 / total1 : 0,
        doEnableLine1 = userOptions.doEnableLine1 && data1.length,
        doEnableLine2 = userOptions.doEnableLine2 && data2.length,
        doEnableRatioLine = doEnableLine1 && doEnableLine2 &&
          (userOptions.event2 !== userOptions.event1 ||
          userOptions.ua2 !== userOptions.ua1 ||
          userOptions.loc2 !== userOptions.loc1),
        doEnableAverageLines = false;

      let
        datasets = [],
        yAxis2;

      console.log(data1);

      this.updateSummaryBox(total1, total2, avg1, avg2, avgRatio);

      if (doEnableLine1) {
        datasets = datasets.concat({
          label: this.getLabel(userOptions, '1'),
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
        yAxis2 = (userOptions.doStretch || !doEnableLine1) ? 'y-axis-2' : 'y-axis-1';
        datasets = datasets.concat({
          label: this.getLabel(userOptions, '2'),
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
          data: this.getRatioDataPoints(data1, data2, smoothSize),
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

      const chartOptions = this.getChartOptions(userOptions, doEnableRatioLine, doEnableLine1, doEnableLine2);

      return Promise.resolve({
        datasets,
        chartOptions,
        dateLabelStartIndex: startDateIndex,
        dateLabelEndIndex: endDateIndex
      });
    };

    return Promise.all([ this.getSourceDataSet(userOptions, '1'), this.getSourceDataSet(userOptions, '2') ])
      .then(getChartImpl);
  }

  getChartOptions(userOptions, doEnableRatioLine, doEnableLine1, doEnableLine2) {

    let yAxes = [];
    const
      doUseSameScaleForAllEvents = doEnableLine1 && !userOptions.doStretch,
      doUseSecondAxis = doEnableLine2 && !doUseSameScaleForAllEvents,
      tickConfig = {
        callback: function (value, index, values) {
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
          labelString: doUseSameScaleForAllEvents ? 'Events' : this.getLabel(userOptions, '1')
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
          labelString: this.getLabel(userOptions, '2')
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
    }
  }
}

const view = new AllView();