/**
 * View controller
 */

// TODO alarms, e.g. Fullerton hiding badge in IE

'use strict';

var SAME_OPTION_NAME = '<same>';

class TimelineController extends CommonController {
  getDefaultParameterMap() {
    var BEGINNING_OF_TIME = '01/26/2016';
    return {
      doEnableLine1: true,
      doEnableLine2: true,
      event1: 'page-visited::nonbounce',
      event2: 'badge-hovered',
      ua1: '@supported',
      ua2: SAME_OPTION_NAME,
      loc1: '@long-running-customers',
      loc2: SAME_OPTION_NAME,
      startDate: BEGINNING_OF_TIME,
      endDate: '',
      doSmooth: true,
      doUltraSmooth: false,
      doStretch: false,
    }
  }

  getParameterMap() {
    var defaultParams = this.getDefaultParameterMap(),
      params = {
        doEnableLine1: this.getBooleanParameterByName('doEnableLine1'),
        doEnableLine2: this.getBooleanParameterByName('doEnableLine2'),
        event1: this.getStringParameterByName('event1'),
        event2: this.getStringParameterByName('event2'),
        ua1: this.getStringParameterByName('ua1'),
        ua2: this.getStringParameterByName('ua2'),
        loc1: this.getStringParameterByName('loc1'),
        loc2: this.getStringParameterByName('loc2'),
        startDate: this.getStringParameterByName('startDate'),
        endDate: this.getStringParameterByName('endDate'),
        doSmooth: this.getBooleanParameterByName('doSmooth'),
        doUltraSmooth: this.getBooleanParameterByName('doUltraSmooth'),
        doStretch: this.getBooleanParameterByName('doStretch')
      };

    return $.extend({}, defaultParams, params);
  }

  getChartOptions(doConvertSame) {
    var
      event1 = this.getStringValue('event1'),
      event2 = this.getStringValue('event2'),
      ua1 = this.getStringValue('ua1'),
      ua2 = this.getStringValue('ua2'),
      loc1 = this.getStringValue('loc1'),
      loc2 = this.getStringValue('loc2');

    return {
      doEnableLine1: this.getBooleanValue('doEnableLine1'),
      doEnableLine2: this.getBooleanValue('doEnableLine2'),
      event1: event1,
      event2: doConvertSame && event2 === SAME_OPTION_NAME ? event1 : event2,
      ua1: ua1,
      ua2: doConvertSame && ua2 === SAME_OPTION_NAME ? ua1 : ua2,
      loc1: loc1,
      loc2: doConvertSame && loc2 === SAME_OPTION_NAME ? loc1 : loc2,
      startDate: this.getStringValue('startDate'),
      endDate: this.getStringValue('endDate'),
      doSmooth: this.getBooleanValue('doSmooth'),
      doUltraSmooth: this.getBooleanValue('doUltraSmooth'),
      doStretch: this.getBooleanValue('doStretch')
    };
  }

  getCleanedOptions(chartOptions) {
    var newOptions = $.extend({}, chartOptions);
    if (newOptions.event2 === SAME_OPTION_NAME) {
      newOptions.event2 = newOptions.event1;
    }
    if (newOptions.ua2 === SAME_OPTION_NAME) {
      newOptions.ua2 = newOptions.ua1;
    }
    if (newOptions.loc2 === SAME_OPTION_NAME) {
      newOptions.loc2 = newOptions.loc1;
    }
    return newOptions;
  }

  // Inits non-combo box defaults which have to be done in a different place
  setFormValues(paramMap) {
    this.changeBooleanValue('doEnableLine1', paramMap.doEnableLine1);
    this.changeBooleanValue('doEnableLine2', paramMap.doEnableLine2);
    this.changeStringValue('event1', paramMap.event1);
    this.changeStringValue('event2', paramMap.event2);
    this.changeStringValue('ua1', paramMap.ua1);
    this.changeStringValue('ua2', paramMap.ua2);
    this.changeStringValue('loc1', paramMap.loc1);
    this.changeStringValue('loc2', paramMap.loc2);
    this.changeStringValue('startDate', paramMap.startDate);
    this.changeStringValue('endDate', paramMap.endDate);
    this.changeBooleanValue('doSmooth', paramMap.doSmooth);
    this.changeBooleanValue('doUltraSmooth', paramMap.doUltraSmooth);
    this.changeBooleanValue('doStretch', paramMap.doStretch);
  }

  ensureValidCheckboxOptions() {
    if ($('#doUltraSmooth').is(':checked')) {
      $('#doSmooth').prop('checked', true);
    }
  }

  listenForUserActions() {

    super.listenForUserActions();

    // If ultra smooth is checked, smooth must be as well
    $('#doUltraSmooth').on('click', this.ensureValidCheckboxOptions);
    $('#doSmooth').on('click', function () {
      if ($('#doSmooth').is(':checked') === false) {
        $('#doUltraSmooth').prop('checked', false);
      }
    });

    $('#line2-controller').on('autocompleteselect', (event) => this.changeOtherLine2ItemsToSame(event));
  }

  // Ratios make sense when the second line only changes one variable
  changeOtherLine2ItemsToSame(event) {
    function getSelectFromTextField(textField) {
      var $select = $(textField).parent().parent().find('select');
      return $select[0];
    }

    var selectElem = getSelectFromTextField(event.target),
      selectId = selectElem.id;
    if (!selectId) {
      return;
    }

    var currVal = $('#' + selectId).val();
    if (currVal === SAME_OPTION_NAME) {
      return;
    }

    $(event.target).css('color', '');

    if (selectId === 'event2') {
      this.changeStringValue('ua2', SAME_OPTION_NAME);
      this.changeStringValue('loc2', SAME_OPTION_NAME);
    }
    else if (selectId === 'ua2') {
      this.changeStringValue('event2', SAME_OPTION_NAME);
      this.changeStringValue('loc2', SAME_OPTION_NAME);
    }
    else if (selectId === 'loc2') {
      this.changeStringValue('event2', SAME_OPTION_NAME);
      this.changeStringValue('ua2', SAME_OPTION_NAME);
    }
  }

  initUserAgentOptions(userAgentTotals) {
    // Make sure IE10 > IE9
    function alphaNumComparator(a, b) {
      var END_DIGIT_REGEX = /(\w)(\d)$/;

      function leadingZeroForEndDigit(s) {
        return s.replace(END_DIGIT_REGEX, '$10$2');
      }

      return leadingZeroForEndDigit(a) > leadingZeroForEndDigit(b) ? 1 : -1;
    }

    var userAgentNames = Object.keys(userAgentTotals).sort(alphaNumComparator),
      $uaSelects = $('.ua-chooser');

    $('#ua2').append(this.createOption(SAME_OPTION_NAME));

    userAgentNames.forEach((eventName) => {
      $uaSelects.each((index, elem) => {
        var option = this.createOption(eventName);
        $(elem).append(option);
      });
    });

    $('#ua1')
      .combobox();
    $('#ua2')
      .combobox();
  }

  getNumPageVisits(locationToSiteIdMap, locationName) {
    var siteIdToPageVisitsMap = locationToSiteIdMap[locationName];

    if (!siteIdToPageVisitsMap) {
      return;
    }

    var siteIdsForLocation = Object.keys(siteIdToPageVisitsMap),
      index = siteIdsForLocation.length,
      totalPageVisits = 0,
      currentSiteId;

    while (index--) {
      currentSiteId = siteIdsForLocation[index];
      totalPageVisits += siteIdToPageVisitsMap[currentSiteId];
    }

    return totalPageVisits;
  }

  getReadableNameForLocation(locationToPageVisitsMap, location, totalPageVisits) {
    function isTLDOrGroup(location) {
      var firstChar = location.charAt(0);
      return firstChar === '.' || firstChar === '@';
    }

    function isInterestingLocation(subLocation) {
      var PAGE_VISIT_THRESHOLD = 0;
      return subLocation !== location && !isTLDOrGroup(subLocation) &&
        locationToPageVisitsMap[subLocation] > PAGE_VISIT_THRESHOLD;
    }

    function pageVisitsComparator(a, b) {
      return locationToPageVisitsMap[b] - locationToPageVisitsMap[a];
    }

    function addPageVisits(locationName) {
      return locationName.split(' ')[0] + ':' + locationToPageVisitsMap[locationName].toLocaleString();
    }

    var locationNames = [];
    if (locationToPageVisitsMap && !isTLDOrGroup(location)) {
      locationNames = Object.keys(locationToPageVisitsMap || {})
        .filter(isInterestingLocation)
        .sort(pageVisitsComparator);
    }

    if (!locationNames.length) {
      return location + ':' + totalPageVisits.toLocaleString();
    }

    return location + ' => ' + locationNames.map(addPageVisits).join(', ');
  }

  initLocationOptions(locationToSiteIdMap, siteIdToLocationsMap) {
    function locationNameComparator(locA, locB) {
      var isAGroup = locA.charAt(0) === '@',
        isBGroup = locB.charAt(0) === '@';
      if (isAGroup !== isBGroup) {
        return (+isBGroup) - (+isAGroup);
      }
      else {
        return locB > locA ? -1 : 1;
      }
    }

    var allLocations = Object.keys(locationToSiteIdMap)
        .sort(locationNameComparator)
        .filter((locName) => {
          return locName.indexOf('#s-????????') < 0;
        }),
      $locationSelects = $('.location-chooser'),
      PAGE_VISIT_THRESHOLD = 100, // Don't list locations with fewer than this # of page visits
      SITE_ID_REGEX = /^#s-[\da-f\?]{8}$/;   // Currently no use

    $('#loc2').append(this.createOption(SAME_OPTION_NAME));

    allLocations.forEach((locationName) => {
      var readableName = locationName,
        totalPageVisits = this.getNumPageVisits(locationToSiteIdMap, locationName),
        locationToPageVisitsMap;

      if (totalPageVisits < PAGE_VISIT_THRESHOLD) {
        return;  // Otherwise we list too many
      }

      locationToPageVisitsMap = locationName.match(SITE_ID_REGEX) ? siteIdToLocationsMap : locationToSiteIdMap;
      readableName = this.getReadableNameForLocation(locationToPageVisitsMap[locationName], locationName, totalPageVisits);
      $locationSelects.each((index, elem) => {
        var option = this.createOption(locationName, readableName);
        $(elem).append(option);
      });
    });

    $('#loc1')
      .combobox();
    $('#loc2')
      .combobox();
  }

  initDatePickers() {
    $('.date')
      .datepicker({
        minDate: '01/26/2016',
        maxDate: 0
      });
  }

  initOptions() {
    this.initEventOptions(data.eventTotals.byNameOnly);
    this.initUserAgentOptions(data.eventTotals.byUserAgentOnly);
    this.initLocationOptions(data.siteInfo.locationToSiteIdMap, data.siteInfo.siteIdToLocationsMap);
    this.initDatePickers();
  }
}

var controller = new TimelineController();