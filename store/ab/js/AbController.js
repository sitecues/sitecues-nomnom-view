/**
 * View controller for AB test graphs
 */

'use strict';

class AbController extends CommonController {
  getDefaultParameterMap() {
    return {
      testName: 'Test name',
      event1: 'page-visited::nonbounce',
      event2: 'badge-hovered',
      doSmooth: true
    }
  }

  getParameterMap() {
    var defaultParams = this.getDefaultParameterMap(),
      params = {
        testName: this.getStringParameterByName('testName'),
        event1: this.getStringParameterByName('event1'),
        event2: this.getStringParameterByName('event2'),
        doSmooth: this.getBooleanParameterByName('doSmooth')
      };

    return $.extend({}, defaultParams, params);
  }

  getChartOptions() {
    return {
      testName: this.getStringValue('testName'),
      event1: this.getStringValue('event1'),
      event2: this.getStringValue('event2'),
      doSmooth: this.getBooleanValue('doSmooth')
    };
  }

  getCleanedOptions(chartOptions) {
    return chartOptions;
  }

  // Inits non-combo box defaults which have to be done in a different place
  setFormValues(paramMap) {
    this.changeBooleanValue('testName', paramMap.testName);
    this.changeStringValue('event1', paramMap.event1);
    this.changeStringValue('event2', paramMap.event2);
    this.changeBooleanValue('doSmooth', paramMap.doSmooth);
  }

  initOptions() {
    this.initEventOptions(data.eventTotals.byNameOnly);
    this.initAbTestNames((data.abTest && data.abTest.dateInfo) || {});
  }

  initAbTestNames(dateInfo) {
    function getTestNameText(testName) {
      const ourTest = dateInfo[testName];
      return testName + ' (' + convertIndexToDate(ourTest.startIndex) + ' - ' + convertIndexToDate(ourTest.endIndex) + ')';
    }

    // TODO should we provide option to sort by most recent? That would mean simply not sorting
    var allTestNames = Object.keys(dateInfo).sort(),
      $testNameSelect = $('#testName');

    allTestNames.forEach((testName) => {
      $testNameSelect.each((index, elem) => {
        var option = this.createOption(getTestNameText(testName));
        $(elem).append(option);
      });
    });

    $testNameSelect.combobox();
  }
}

var controller = new AbController();



