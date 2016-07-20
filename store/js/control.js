/**
 * View controller
 */

// TODO param for which lines to show
// TODO fix bug where it no longer redraws on change
// TODO alarms, e.g. Fullerton hiding badge in IE

// Get a parameter value fro the URL query
function getStringParameterByName(name, defaultVal) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
  return results === null ? (defaultVal || ''): decodeURIComponent(results[1].replace(/\+/g, " "));
}

function getBooleanParameterByName(name, defaultVal) {
  return getStringParameterByName(name, defaultVal) === 'true';
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

function getParameterMap() {
  var BEGINNING_OF_TIME = '01/26/2016';
  return {
    event1: getStringParameterByName('event1', 'badge-hovered'),
    event2: getStringParameterByName('event2', 'page-visited::badge-visible'),
    ua1: getStringParameterByName('ua1', '@supported'),
    ua2: getStringParameterByName('ua2', '@supported'),
    loc1: getStringParameterByName('loc1', '@long-running-customers'),
    loc2: getStringParameterByName('loc2', '@long-running-customers'),
    startDate: getStringParameterByName('startDate', BEGINNING_OF_TIME),
    endDate: getStringParameterByName('endDate', ''),
    doSmooth: getBooleanParameterByName('doSmooth', 'true'),
    doFixHoles: getBooleanParameterByName('doFixHoles', 'true'),
    doStretch: getBooleanParameterByName('doStretch', 'false')
  }
}

function getStringValue(id) {
  return $('#' + id).val();
}

function getBooleanValue(id) {
  return $('#' + id).is(':checked');
}

function getChartOptions() {
  return {
    event1: getStringValue('event1'),
    event2: getStringValue('event2'),
    ua1: getStringValue('ua1'),
    ua2: getStringValue('ua2'),
    loc1: getStringValue('loc1'),
    loc2: getStringValue('loc2'),
    startDate: getStringValue('startDate'),
    endDate: getStringValue('endDate'),
    doSmooth: getBooleanValue('doSmooth'),
    doFixHoles: getBooleanValue('doFixHoles'),
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
function setFormValues() {
  var paramMap = getParameterMap();
  changeStringValue('event1', paramMap.event1);
  changeStringValue('event2', paramMap.event2);
  changeStringValue('ua1', paramMap.ua1);
  changeStringValue('ua2', paramMap.ua2);
  changeStringValue('loc1', paramMap.loc1);
  changeStringValue('loc2', paramMap.loc2);
  changeStringValue('startDate', paramMap.startDate);
  changeStringValue('endDate', paramMap.endDate);
  changeBooleanValue('doSmooth', paramMap.doSmooth);
  changeBooleanValue('doFixHoles', paramMap.doFixHoles);
  changeBooleanValue('doStretch', paramMap.doStretch);
}

function onDataAvailable(data) {
  initEventOptions(data.eventTotals.byNameOnly);
  initUserAgentOptions(data.eventTotals.byUserAgentOnly);
  initLocationOptions(data.siteInfo.locationToSiteIdMap, data.siteInfo.siteIdToLocationsMap);
  initDatePickers();
  setFormValues();

  function onFormChange() {
    console.log('form change');
    var options = getChartOptions();
    updateUrlAndTitle(options);
    updateChartView(data, options);
  }

  function onHistoryChange() {
    console.log('history change');
    setFormValues();
    updateChartView(data, getChartOptions());
  }

  window.addEventListener('popstate', onHistoryChange);

  // Listen for changes
  $(window).on('submit change', function(submitEvent) {
    submitEvent.preventDefault();
    onFormChange();
    return false;
  });
  $('.ui-menu').on('click', onFormChange); // Our weird unsupported autocomplete hack isn't creating change events

  // Make native inputs have similar size and font
  $('input').addClass("ui-widget ui-widget-content ui-corner-all");

  // Show form
  $('body').addClass('ready');

  // Use jQuery UI tooltips
  $(document).tooltip();

  // Show current visualization
  updateChartView(data, getChartOptions());
}

function createOption(optionName, readableName) {
  return $('<option></option>')
    .attr('value', optionName).text(readableName || optionName);
}

function initUserAgentOptions(userAgentTotals) {
  var userAgentNames = Object.keys(userAgentTotals).sort(),
    $uaSelects = $('.ua-chooser');

  userAgentNames.forEach(function(eventName) {
    $uaSelects.each(function() {
      var option = createOption(eventName);
      $(this).append(option);
    });
  });

  // Set defaults
  $('#ua1')
    .combobox();
  $('#ua2')
    .combobox();
}

function initEventOptions(allEventTotals) {
  var allEventNames = Object.keys(allEventTotals).sort(),
    $eventNameSelects = $('.event-chooser');

  allEventNames.forEach(function(eventName) {
    $eventNameSelects.each(function() {
      var option = createOption(eventName);
      $(this).append(option);
    });
  });

  // Set defaults
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

function getReadableNameForLocation(siteIdMap, location, totalPageVisits) {
  var siteId = siteIdMap[location],
    readableName = location;
  if (siteId) {
    readableName += ' (' + siteId + ')';
  }
  readableName += ' [' + totalPageVisits.toLocaleString() + ']';
  return readableName;
}

function getReadableNameForSiteId(locationMap, siteId) {
  function isInterestingLocation(locationName) {
    var PAGE_VISIT_THRESHOLD = 0;
    return locationName !== siteId && locationName.charAt(0) !== '@' &&
      locationName.charAt(0) !== '.' &&
      locationMap[locationName] > PAGE_VISIT_THRESHOLD ;
  }

  function pageVisitsComparator(a, b) {
    return locationMap[b] - locationMap[a];
  }

  function addPageVisits(locationName) {
    return locationName.split(' ')[0] + '[' + locationMap[locationName] + ']';
  }

  var locationNames =
    Object.keys(locationMap)
      .filter(isInterestingLocation)
      .sort(pageVisitsComparator);

  return siteId + ' (' + locationNames.map(addPageVisits).join(', ') +')';
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
    SITE_ID_REGEX = /^#s-[\da-f\?]{8}$/;

  allLocations.forEach(function(locationName) {
    var readableName = locationName,
      totalPageVisits = getNumPageVisits(locationToSiteIdMap, locationName);

    if (totalPageVisits < PAGE_VISIT_THRESHOLD) {
      return;  // Otherwise we list too many
    }

    if (locationName.match(SITE_ID_REGEX)) {
      readableName = getReadableNameForSiteId(siteIdToLocationsMap[locationName], locationName);
    }
    else { // Not a group or TLD
      readableName = getReadableNameForLocation(locationToSiteIdMap[locationName], locationName, totalPageVisits);
    }

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

  submitEvent.preventDefault();
  return false;
}

$(document).ready(onReady);