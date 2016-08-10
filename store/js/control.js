/**
 * View controller
 */

// TODO alarms, e.g. Fullerton hiding badge in IE

'use strict';

// Get a parameter value fro the URL query
function getStringParameterByName(name) {
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
    results = regex.exec(location.search);
  return results ? decodeURIComponent(results[1].replace(/\+/g, ' ')) : undefined;
}

function getBooleanParameterByName(name) {
  var stringVal = getStringParameterByName(name);
  return stringVal && stringVal === 'true';
}

function changeUrl(title, url) {
  if (typeof (history.pushState) != "undefined") {
    var obj = {title: title, URL: url};
    history.pushState(obj, obj.title, obj.URL);
    document.title = title;
  }
}

function updateUrlAndTitle(options) {
  function getCurrentLocationWithoutParams() {
    var currLoc = window.location.toString();

    return currLoc.substr(0, currLoc.length - window.location.search.length);
  }

  var params = [];
  Object.keys(options).forEach(function(optionName) {
    params.push(encodeURIComponent(optionName) + '=' + encodeURIComponent(options[optionName]));
  });

  var href = getCurrentLocationWithoutParams() + '?' + params.join('&'),
    title = 'Sitecues ' + getLabel(options, '1') + ' vs ' + getLabel(options, '2');

  changeUrl(title, href);
}

function getDefaultParameterMap() {
  var BEGINNING_OF_TIME = '01/26/2016';
  return {
    doEnableLine1: true,
    doEnableLine2: true,
    event1: 'page-visited::operational',
    event2: 'badge-hovered',
    ua1: '@supported',
    ua2: '<same>',
    loc1: '@long-running-customers',
    loc2: '<same>',
    startDate: BEGINNING_OF_TIME,
    endDate: '',
    doSmooth: true,
    doUltraSmooth: false,
    doStretch: false,
  }
}

function getParameterMap() {
  var defaultParams = getDefaultParameterMap(),
    params = {
      doEnableLine1: getBooleanParameterByName('doEnableLine1'),
      doEnableLine2: getBooleanParameterByName('doEnableLine2'),
      event1: getStringParameterByName('event1'),
      event2: getStringParameterByName('event2'),
      ua1: getStringParameterByName('ua1'),
      ua2: getStringParameterByName('ua2'),
      loc1: getStringParameterByName('loc1'),
      loc2: getStringParameterByName('loc2'),
      startDate: getStringParameterByName('startDate'),
      endDate: getStringParameterByName('endDate'),
      doSmooth: getBooleanParameterByName('doSmooth'),
      doUltraSmooth: getBooleanParameterByName('doUltraSmooth'),
      doStretch: getBooleanParameterByName('doStretch')
    };

  return $.extend({}, defaultParams, params);
}

function getStringValue(id) {
  return $('#' + id).val();
}

function getBooleanValue(id) {
  return $('#' + id).is(':checked');
}

function getChartOptions() {
  var
    event1 = getStringValue('event1'),
    event2 = getStringValue('event2'),
    ua1 = getStringValue('ua1'),
    ua2 = getStringValue('ua2'),
    loc1 = getStringValue('loc1'),
    loc2 = getStringValue('loc2');

  return {
    doEnableLine1: getBooleanValue('doEnableLine1'),
    doEnableLine2: getBooleanValue('doEnableLine2'),
    event1: event1,
    event2: event2 === '<same>' ? event1 : event2,
    ua1: ua1,
    ua2: ua2 === '<same>' ? ua1 : ua2,
    loc1: loc1,
    loc2: loc2 === '<same>' ? loc1 : loc2,
    startDate: getStringValue('startDate'),
    endDate: getStringValue('endDate'),
    doSmooth: getBooleanValue('doSmooth'),
    doUltraSmooth: getBooleanValue('doUltraSmooth'),
    doStretch: getBooleanValue('doStretch')
  };
}

function changeStringValue(id, val) {
  var $formControl = $('#' + id);
  $formControl.val(val);
  if ($formControl.is('select')) {
    var $possibleInput = $formControl.next().children().first();
    if ($possibleInput.is('input')) {
      $possibleInput.val(val);
    }
  }
}

function changeBooleanValue(id, isChecked) {
  $('#' + id).prop('checked', isChecked);
}

// Inits non-combo box defaults which have to be done in a different place
function setFormValues(paramMap) {
  changeBooleanValue('doEnableLine1', paramMap.doEnableLine1);
  changeBooleanValue('doEnableLine2', paramMap.doEnableLine2);
  changeStringValue('event1', paramMap.event1);
  changeStringValue('event2', paramMap.event2);
  changeStringValue('ua1', paramMap.ua1);
  changeStringValue('ua2', paramMap.ua2);
  changeStringValue('loc1', paramMap.loc1);
  changeStringValue('loc2', paramMap.loc2);
  changeStringValue('startDate', paramMap.startDate);
  changeStringValue('endDate', paramMap.endDate);
  changeBooleanValue('doSmooth', paramMap.doSmooth);
  changeBooleanValue('doUltraSmooth', paramMap.doUltraSmooth);
  changeBooleanValue('doStretch', paramMap.doStretch);
}

function ensureValidCheckboxOptions() {
  if ($('#doUltraSmooth').is(':checked')) {
    $('#doSmooth').prop('checked', true);
  }
}

function onDataAvailable(data) {
  initOptions(data);
  populateFormWithValues();
  listenForUserActions(data);
  prettify();

  // Show form
  $('body').addClass('ready');

  // Show current visualization
  updateChartView(data, getChartOptions());
}

function listenForUserActions(data) {

  function onHistoryChange() {
    setFormValues(getParameterMap());
    updateChartView(data, getChartOptions());
  }

  window.addEventListener('popstate', onHistoryChange);

  function onFormChange() {
    var options = getChartOptions();
    updateUrlAndTitle(options);
    updateChartView(data, options);
  }

  // Listen for changes
  $(window).on('submit change', onFormChange);
  $('.ui-menu').on('click', onFormChange); // Our weird unsupported autocomplete hack isn't creating change events

  // If ultra smooth is checked, smooth must be as well
  $('#doUltraSmooth').on('click', ensureValidCheckboxOptions);
  $('#doSmooth').on('click', function() {
    if ($('#doSmooth').is(':checked') === false) {
      $('#doUltraSmooth').prop('checked', false);
    }
  });

  $('#reset').on('click', function() {
    setFormValues(getDefaultParameterMap());
  });
}

function prettify() {
  // Use jQuery UI tooltips
  $(document).tooltip();

  // Use jQuery UI button
  $('#reset').button();

  // Make native inputs have similar size and font
  // Select text on focus
  $('input')
    .addClass('ui-widget ui-widget-content ui-corner-all')
    .on('focus', function(evt) {
      evt.target.select();
    });
}

function populateFormWithValues() {
  setFormValues(getParameterMap());
  ensureValidCheckboxOptions();
}

function initOptions(data) {
  initEventOptions(data.eventTotals.byNameOnly);
  initUserAgentOptions(data.eventTotals.byUserAgentOnly);
  initLocationOptions(data.siteInfo.locationToSiteIdMap, data.siteInfo.siteIdToLocationsMap);
  initDatePickers();
}

function createOption(optionName, readableName) {
  return $('<option></option>')
    .attr('value', optionName).text(readableName || optionName);
}

function initUserAgentOptions(userAgentTotals) {
  var userAgentNames = Object.keys(userAgentTotals).sort(),
    $uaSelects = $('.ua-chooser');

  $('#ua2').append(createOption('<same>'));

  userAgentNames.forEach(function(eventName) {
    $uaSelects.each(function() {
      var option = createOption(eventName);
      $(this).append(option);
    });
  });

  $('#ua1')
    .combobox();
  $('#ua2')
    .combobox();
}

// Sort alphabetically except for panel-clicked (show at end)
function eventNameComparator(event1, event2) {
  return event1.replace(/^panel-clicked::/, 'zzz::') > event2.replace(/^panel-clicked::/, 'zzz::') ? 1 : -1;
}

function initEventOptions(allEventTotals) {
  var allEventNames = Object.keys(allEventTotals).sort(eventNameComparator),
    $eventNameSelects = $('.event-chooser');

  $('#event2').append(createOption('<same>'));

  allEventNames.forEach(function(eventName) {
    $eventNameSelects.each(function() {
      var option = createOption(eventName);
      $(this).append(option);
    });
  });

  $('#event1')
    .combobox();
  $('#event2')
    .combobox();
}

function getNumPageVisits(locationToSiteIdMap, locationName) {
  var siteIdToPageVisitsMap = locationToSiteIdMap[locationName];

  if (!siteIdToPageVisitsMap) {
    return;
  }

  var siteIdsForLocation = Object.keys(siteIdToPageVisitsMap),
    index = siteIdsForLocation.length,
    totalPageVisits = 0,
    currentSiteId;

  while (index --) {
    currentSiteId = siteIdsForLocation[index];
    totalPageVisits += siteIdToPageVisitsMap[currentSiteId];
  }

  return totalPageVisits;
}

function getReadableNameForLocation(locationToPageVisitsMap, location, totalPageVisits) {
  function isTLDOrGroup(location) {
    var firstChar = location.charAt(0);
    return firstChar === '.' || firstChar === '@';
  }

  function isInterestingLocation(subLocation) {
    var PAGE_VISIT_THRESHOLD = 0;
    return subLocation !== location &&
      !isTLDOrGroup(subLocation) &&
      locationToPageVisitsMap[subLocation] > PAGE_VISIT_THRESHOLD ;
  }

  function pageVisitsComparator(a, b) {
    return locationToPageVisitsMap[b] - locationToPageVisitsMap[a];
  }

  function addPageVisits(locationName) {
    return locationName.split(' ')[0] + ':' + locationToPageVisitsMap[locationName];
  }



  var locationNames = [];
  if (locationToPageVisitsMap && !isTLDOrGroup(location)) {
    locationNames = Object.keys(locationToPageVisitsMap || {})
      .filter(isInterestingLocation)
      .sort(pageVisitsComparator);
  }

  if (!locationNames.length) {
    return location + ':' + totalPageVisits;
  }

  return location + ' => ' + locationNames.map(addPageVisits).join(', ');
}

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

function initLocationOptions(locationToSiteIdMap, siteIdToLocationsMap) {
  var allLocations = Object.keys(locationToSiteIdMap)
      .sort(locationNameComparator)
      .filter(function(locName) { return locName.indexOf('#s-????????') < 0; }),
    $locationSelects = $('.location-chooser'),
    PAGE_VISIT_THRESHOLD = 100, // Don't list locations with fewer than this # of page visits
    SITE_ID_REGEX = /^#s-[\da-f\?]{8}$/;   // Currently no use

  $('#loc2').append(createOption('<same>'));

  allLocations.forEach(function(locationName) {
    var readableName = locationName,
      totalPageVisits = getNumPageVisits(locationToSiteIdMap, locationName),
      locationToPageVisitsMap;

    if (totalPageVisits < PAGE_VISIT_THRESHOLD) {
      return;  // Otherwise we list too many
    }

    locationToPageVisitsMap = locationName.match(SITE_ID_REGEX) ? siteIdToLocationsMap : locationToSiteIdMap;
    readableName = getReadableNameForLocation(locationToPageVisitsMap[locationName], locationName, totalPageVisits);
    $locationSelects.each(function () {
      var option = createOption(locationName, readableName);
      $(this).append(option);
    });
  });

  $('#loc1')
    .combobox();
  $('#loc2')
    .combobox();
}

function initDatePickers() {
  $('.date')
    .datepicker({
      minDate: '01/26/2016',
      maxDate: 0
    });
}

function onReady() {
  $('#security').one('submit', loadData);
}

function onError(statusCode, textStatus) {
  console.log(statusCode);
  console.log(textStatus);
  $('body').addClass('error');
  $('#error').text('An error occurred: ' + statusCode + ' ' + textStatus);
}

function loadData(submitEvent) {
  $('body').addClass('password-entered');

  var username = 'sitecues',
    password = $('#password').val(),
    // webServiceUrl = 'http://localhost:3001/all.json';
    webServiceUrl = 'http://ec2-54-221-79-114.compute-1.amazonaws.com:3001/all.json';

  var xhr = new XMLHttpRequest();
  xhr.open("GET", webServiceUrl, true);
  xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ':' + password));
  xhr.onload = function() {
    if (xhr.status < 400) {
      onDataAvailable(JSON.parse(xhr.responseText));
    }
    else {
      onError(xhr.status, xhr.statusText);
    }
  };
  xhr.send();
}

$(document).ready(onReady);