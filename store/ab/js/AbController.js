/**
 * View controller for AB test graphs
 */

'use strict';

class AbController extends CommonController {
  getDefaultParameterMap() {
    var BEGINNING_OF_TIME = '01/26/2016';
    return {
      test: '',
      event1: 'page-visited::nonbounce',
      event2: 'badge-hovered',
      doSmooth: true,
    }
  }

  getParameterMap() {
    var defaultParams = getDefaultParameterMap(),
      params = {
        test:  getStringParameterByName('test'),
        event1: getStringParameterByName('event1'),
        event2: getStringParameterByName('event2'),
        doSmooth: getBooleanParameterByName('doSmooth')
      };

    return $.extend({}, defaultParams, params);
  }

  getChartOptions(doConvertSame) {
    var
      test = getStringValue('test'),
      event1 = getStringValue('event1'),
      event2 = getStringValue('event2');

    return {
      test: getStringValue('test'),
      event1: getStringValue('event1'),
      event2: getStringValue('event2'),
      doSmooth: getBooleanValue('doSmooth')
    };
  }

  // Inits non-combo box defaults which have to be done in a different place
  setFormValues(paramMap) {
    changeBooleanValue('test', paramMap.test);
    changeStringValue('event1', paramMap.event1);
    changeStringValue('event2', paramMap.event2);
    changeBooleanValue('doSmooth', paramMap.doSmooth);
  }

  initOptions(data) {
    super.initOptions(data);
    initAbTestNames(data);
  }

  initAbTestNames(data) {

  }
}

var controller = new AbController();



