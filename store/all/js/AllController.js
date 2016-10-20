/**
 * View controller
 */

// TODO alarms, e.g. Fullerton hiding badge in IE

'use strict';

class AllController extends CommonController {
  getDefaultParameterMap() {
    const BEGINNING_OF_TIME = '02/01/2016';
    return {
      doEnableLine1: true,
      doEnableLine2: true,
      event1: 'page-visited',
      event2: 'badge-hovered',
      type1: 'eventCounts',
      type2: this.OFF_OPTION_NAME,
      ua1: '@supported',
      ua2: this.OFF_OPTION_NAME,
      loc1: '@long-running-customers',
      loc2: this.OFF_OPTION_NAME,
      startDate: BEGINNING_OF_TIME,
      endDate: '',
      doSmooth: true,
      doUltraSmooth: false,
      doStretch: false,
    }
  }

  getParameterMap() {
    const defaultParams = this.getDefaultParameterMap(),
      params = {
        doEnableLine1: this.getBooleanParameterByName('doEnableLine1'),
        doEnableLine2: this.getBooleanParameterByName('doEnableLine2'),
        event1: this.getStringParameterByName('event1'),
        event2: this.getStringParameterByName('event2'),
        type1: this.getStringParameterByName('type1'),
        type2: this.getStringParameterByName('type2'),
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

  getUserOptions() {
    const
      event1 = this.getTextFieldValue('event1'),
      event2 = this.getTextFieldValue('event2'),
      type1 = this.getTextFieldValue('type1'),
      type2 = this.getTextFieldValue('type2'),
      ua1 = this.getTextFieldValue('ua1'),
      ua2 = this.getTextFieldValue('ua2'),
      loc1 = this.getTextFieldValue('loc1'),
      loc2 = this.getTextFieldValue('loc2');

    return {
      doEnableLine1: this.getCheckboxValue('doEnableLine1'),
      doEnableLine2: this.getCheckboxValue('doEnableLine2'),
      event1,
      event2,
      type1,
      type2,
      ua1,
      ua2,
      loc1,
      loc2,
      startDate: this.getTextFieldValue('startDate'),
      endDate: this.getTextFieldValue('endDate'),
      doSmooth: this.getCheckboxValue('doSmooth'),
      doUltraSmooth: this.getCheckboxValue('doUltraSmooth'),
      doStretch: this.getCheckboxValue('doStretch')
    };
  }

  getCleanedOptions(userOptions) {
    const newOptions = $.extend({}, userOptions);
    if (newOptions.event2 === this.OFF_OPTION_NAME) {
      newOptions.event2 = newOptions.event1;
    }
    if (newOptions.type2 === this.OFF_OPTION_NAME) {
      newOptions.type2 = newOptions.type1;
    }
    if (newOptions.ua2 === this.OFF_OPTION_NAME) {
      newOptions.ua2 = newOptions.ua1;
    }
    if (newOptions.loc2 === this.OFF_OPTION_NAME) {
      newOptions.loc2 = newOptions.loc1;
    }
    return newOptions;
  }

  // Inits non-combo box defaults which have to be done in a different place
  setFormValues(paramMap) {
    this.changeCheckableValue('doEnableLine1', paramMap.doEnableLine1);
    this.changeCheckableValue('doEnableLine2', paramMap.doEnableLine2);
    this.changeTextFieldValue('event1', paramMap.event1);
    this.changeTextFieldValue('event2', paramMap.event2);
    this.changeTextFieldValue('type1', paramMap.type1);
    this.changeTextFieldValue('type2', paramMap.type2);
    this.changeTextFieldValue('ua1', paramMap.ua1);
    this.changeTextFieldValue('ua2', paramMap.ua2);
    this.changeTextFieldValue('loc1', paramMap.loc1);
    this.changeTextFieldValue('loc2', paramMap.loc2);
    this.changeTextFieldValue('startDate', paramMap.startDate);
    this.changeTextFieldValue('endDate', paramMap.endDate);
    this.changeCheckableValue('doSmooth', paramMap.doSmooth);
    this.changeCheckableValue('doUltraSmooth', paramMap.doUltraSmooth);
    this.changeCheckableValue('doStretch', paramMap.doStretch);
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
      const $select = $(textField).parent().parent().find('select');
      return $select[0];
    }

    const selectElem = getSelectFromTextField(event.target),
      selectId = selectElem.id;
    if (!selectId) {
      return;
    }

    const currVal = $('#' + selectId).val();
    if (currVal === this.OFF_OPTION_NAME) {
      return;
    }

    $(event.target).css('color', '');

    if (selectId === 'event2') {
      this.changeTextFieldValue('type2', this.OFF_OPTION_NAME);
      this.changeTextFieldValue('ua2', this.OFF_OPTION_NAME);
      this.changeTextFieldValue('loc2', this.OFF_OPTION_NAME);
    }
    else if (selectId === 'type2') {
      this.changeTextFieldValue('event2', this.OFF_OPTION_NAME);
      this.changeTextFieldValue('ua2', this.OFF_OPTION_NAME);
      this.changeTextFieldValue('loc2', this.OFF_OPTION_NAME);
    }
    else if (selectId === 'ua2') {
      this.changeTextFieldValue('event2', this.OFF_OPTION_NAME);
      this.changeTextFieldValue('type2', this.OFF_OPTION_NAME);
      this.changeTextFieldValue('loc2', this.OFF_OPTION_NAME);
    }
    else if (selectId === 'loc2') {
      this.changeTextFieldValue('event2', this.OFF_OPTION_NAME);
      this.changeTextFieldValue('type2', this.OFF_OPTION_NAME);
      this.changeTextFieldValue('ua2', this.OFF_OPTION_NAME);
    }
  }

  initUserAgentOptions(userAgentNames) {
    // Make sure IE10 > IE9
    function alphaNumComparator(a, b) {
      const END_DIGIT_REGEX = /(\w)(\d)$/;

      function leadingZeroForEndDigit(s) {
        return s.replace(END_DIGIT_REGEX, '$10$2');
      }

      return leadingZeroForEndDigit(a) > leadingZeroForEndDigit(b) ? 1 : -1;
    }

    const sortedUserAgentNames = userAgentNames.sort(alphaNumComparator),
      $uaSelects = $('.ua-chooser');

    $('#ua2').append(this.createOption(this.OFF_OPTION_NAME));

    sortedUserAgentNames.forEach((uaName) => {
      $uaSelects.each((index, elem) => {
        const option = this.createOption(uaName);
        $(elem).append(option);
      });
    });

    $('#ua1')
      .combobox();
    $('#ua2')
      .combobox();
  }

  getNumPageVisits(locationToSiteIdMap, locationName) {
    const siteIdToPageVisitsMap = locationToSiteIdMap[locationName];

    if (!siteIdToPageVisitsMap) {
      return;
    }

    const siteIdsForLocation = Object.keys(siteIdToPageVisitsMap);
    let
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
      const firstChar = location.charAt(0);
      return firstChar === '.' || firstChar === '@';
    }

    function isInterestingLocation(subLocation) {
      const PAGE_VISIT_THRESHOLD = 0;
      return subLocation !== location && !isTLDOrGroup(subLocation) &&
        locationToPageVisitsMap[subLocation] > PAGE_VISIT_THRESHOLD;
    }

    function pageVisitsComparator(a, b) {
      return locationToPageVisitsMap[b] - locationToPageVisitsMap[a];
    }

    function addPageVisits(locationName) {
      return locationName.split(' ')[0] + ':' + locationToPageVisitsMap[locationName].toLocaleString();
    }

    let locationNames = [];
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
      const isAGroup = locA.charAt(0) === '@',
        isBGroup = locB.charAt(0) === '@';
      if (isAGroup !== isBGroup) {
        return (+isBGroup) - (+isAGroup);
      }
      else {
        return locB > locA ? -1 : 1;
      }
    }

    const allLocations = Object.keys(locationToSiteIdMap)
        .sort(locationNameComparator)
        .filter((locName) => {
          return locName.indexOf('#s-????????') < 0;
        }),
      $locationSelects = $('.location-chooser'),
      PAGE_VISIT_THRESHOLD = 100, // Don't list locations with fewer than this # of page visits
      SITE_ID_REGEX = /^#s-[\da-f\?]{8}$/;   // Currently no use

    $('#loc2').append(this.createOption(this.OFF_OPTION_NAME));

    allLocations.forEach((locationName) => {
      let readableName = locationName,
        locationToPageVisitsMap;
      const
        totalPageVisits = this.getNumPageVisits(locationToSiteIdMap, locationName);

      if (totalPageVisits < PAGE_VISIT_THRESHOLD) {
        return;  // Otherwise we list too many
      }

      locationToPageVisitsMap = locationName.match(SITE_ID_REGEX) ? siteIdToLocationsMap : locationToSiteIdMap;
      readableName = this.getReadableNameForLocation(locationToPageVisitsMap[locationName], locationName, totalPageVisits);
      $locationSelects.each((index, elem) => {
        const option = this.createOption(locationName, readableName);
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
    this.initEventOptions(globalData.eventNames);
    this.initTypeOptions();
    this.initUserAgentOptions(globalData.uaNames);
    this.initLocationOptions(globalData.siteInfo.locationToSiteIdMap, globalData.siteInfo.siteIdToLocationsMap);
    this.initDatePickers();
  }

  adjustTextfieldTextColor($possibleInput, val) {
    $possibleInput.css('color', val === this.OFF_OPTION_NAME ? 'green' : ''); // Color <same> as green
  }

  getInitialData() {
    return Promise.all([loadData('list/event'), loadData('list/ua') ])
      .then(([eventNames, uaNames]) => {
        globalData.eventNames = eventNames;
        globalData.uaNames = uaNames;
      });
  }
}

const controller = new AllController();