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
      type: 'line'
    }
  }

  getParameterMap() {
    var defaultParams = this.getDefaultParameterMap(),
      params = {
        testName: this.getStringParameterByName('testName'),
        event1: this.getStringParameterByName('event1'),
        event2: this.getStringParameterByName('event2'),
        type: this.getStringParameterByName('type')
      };

    return $.extend({}, defaultParams, params);
  }

  getUserOptions() {
    return {
      testName: this.getTextFieldValue('testName'),
      event1: this.getTextFieldValue('event1'),
      event2: this.getTextFieldValue('event2'),
      type: this.getRadioValue('type')
    };
  }

  getCleanedOptions(chartOptions) {
    return chartOptions;
  }

  // Inits non-combo box defaults which have to be done in a different place
  setFormValues(paramMap) {
    this.changeTextFieldValue('testName', paramMap.testName);
    this.changeTextFieldValue('event1', paramMap.event1);
    this.changeTextFieldValue('event2', paramMap.event2);
    this.changeCheckableValue(paramMap.type, true);
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
        var option = this.createOption(testName, getTestNameText(testName));
        $(elem).append(option);
      });
    });

    $testNameSelect.combobox();
  }

  adjustTextfieldTextColor() { // noop in this class
  }
}

var controller = new AbController();



