/**
 * View controller for AB test graphs
 */

'use strict';

class AbController extends CommonController {
  getDefaultParameterMap() {
    return {
      testName: 'Test name',
      event1: 'page-visited::operational',
      event2: 'badge-hovered',
      type1: 'eventCounts',
      type2: this.OFF_OPTION_NAME,
      chartType: 'line'
    }
  }

  getParameterMap() {
    const defaultParams = this.getDefaultParameterMap(),
      params = {
        testName: this.getStringParameterByName('testName'),
        event1: this.getStringParameterByName('event1'),
        event2: this.getStringParameterByName('event2'),
        type1: this.getStringParameterByName('type1'),
        type2: this.getStringParameterByName('type2'),
        chartType: this.getStringParameterByName('chartType')
      };

    return $.extend({}, defaultParams, params);
  }

  getUserOptions() {
    return {
      testName: this.getTextFieldValue('testName'),
      event1: this.getTextFieldValue('event1'),
      event2: this.getTextFieldValue('event2'),
      type1: this.getTextFieldValue('type1'),
      type2: this.getTextFieldValue('type2'),
      chartType: this.getRadioValue('chartType')
    };
  }

  getCleanedOptions(userOptions) {
    const newOptions = $.extend({}, userOptions);
    if (newOptions.event2 === this.OFF_OPTION_NAME) {
      newOptions.event2 = '';
    }
    if (newOptions.type2 === this.OFF_OPTION_NAME) {
      newOptions.type2 = newOptions.type1;
    }
    return newOptions;
  }

  // Inits non-combo box defaults which have to be done in a different place
  setFormValues(paramMap) {
    this.changeTextFieldValue('testName', paramMap.testName);
    this.changeTextFieldValue('event1', paramMap.event1);
    this.changeTextFieldValue('event2', paramMap.event2);
    this.changeTextFieldValue('type1', paramMap.type1);
    this.changeTextFieldValue('type2', paramMap.type2);
    this.changeCheckableValue(paramMap.chartType, true);
  }

  initOptions() {
    this.initEventOptions(globalData.eventNames);
    this.initTypeOptions();
    this.initAbTestNames(globalData.abTestNames);
  }

  initAbTestNames(dateInfo) {
    function getTestNameText(testName) {
      const ourTest = dateInfo[testName];
      return testName + ' (' + convertIndexToDate(ourTest.startIndex) + ' - ' + convertIndexToDate(ourTest.endIndex) + ')';
    }

    // TODO should we provide option to sort by most recent? That would mean simply not sorting
    const allTestNames = Object.keys(dateInfo).sort(),
      $testNameSelect = $('#testName');

    allTestNames.forEach((testName) => {
      $testNameSelect.each((index, elem) => {
        const option = this.createOption(testName, getTestNameText(testName));
        $(elem).append(option);
      });
    });

    $testNameSelect.combobox();
  }

  adjustTextfieldTextColor() { // noop in this class
  }

  getInitialData() {
    return Promise.all([loadData('list/event'), loadData('list/abtest') ])
      .then(([eventNames, abTestNames]) => {
        globalData.eventNames = eventNames;
        globalData.abTestNames = abTestNames;
      });
  }
}

const controller = new AbController();



