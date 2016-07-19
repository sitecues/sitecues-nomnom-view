/**
 * View controller
 */

// TODO allow user to copy link to different defaults
// TODO param for which lines to show
// TODO fix bug where it no longer redraws on change
// TODO show all urls for each site id
// TODO why is there a location called simply '.' ?
// TODO alarms, e.g. Fullerton hiding badge in IE
// TODO older versions of browsers should be isSupported for older Sitecues

// Get a parameter value fro the URL query
function getStringParameterByName(name, defaultVal) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
  return results === null ? (defaultVal || ''): decodeURIComponent(results[1].replace(/\+/g, " "));
}

function getBooleanParameterByName(name, defaultVal) {
  return Boolean(getStringParameterByName(name, defaultVal));
}

function getToday() {
  var today = new Date(),
    month = today.getMonth() + 1,
    monthStr = month > 9 ? '' + month : '0' + month,
    day = today.getDate(),
    dayStr = day > 9 ? '' + day : '0' + day,
    year = today.getFullYear();
  return monthStr + '/' + dayStr + '/' + year;
}

function getParameterMap() {
  var BEGINNING_OF_TIME = '01/26/2016';
  return {
    event1: getStringParameterByName('event1', 'badge-hovered'),
    event2: getStringParameterByName('event2', 'page-visited'),
    ua1: getStringParameterByName('ua1', '@supported'),
    ua2: getStringParameterByName('ua2', '@supported'),
    loc1: getStringParameterByName('loc1', '@any'),
    loc2: getStringParameterByName('loc2', '@any'),
    startDate: getStringParameterByName('startDate', BEGINNING_OF_TIME),
    endDate: getStringParameterByName('endDate', getToday()),
    doSmooth: getBooleanParameterByName('doSmooth', true),
    doFixHoles: getBooleanParameterByName('doFixHoles', true),
    doStretch: getBooleanParameterByName('doStretch', false)
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

function initStringDefaultValue(id, val) {
  $('#' + id).val(val);
}

function initBooleanDefaultValue(id, isChecked) {
  $('#' + id).prop('checked', isChecked);
}

// Inits non-combo box defaults which have to be done in a different place
function initDefaultValues() {
  var paramMap = getParameterMap();
  initStringDefaultValue('startDate', paramMap.startDate);
  initStringDefaultValue('endDate', paramMap.endDate);
  initBooleanDefaultValue('doSmooth', paramMap.doSmooth);
  initBooleanDefaultValue('doFixHoles', paramMap.doFixHoles);
  initBooleanDefaultValue('doStretch', paramMap.doStretch);
}

function onDataAvailable(data) {
  initEventOptions(data.eventTotals.byNameOnly);
  initUserAgentOptions(data.eventTotals.byUserAgentOnly);
  initLocationOptions(data.siteInfo.locationToSiteIdMap, data.siteInfo.siteIdToLocationsMap);
  initDatePickers();
  initDefaultValues();

  function updateView() {
    updateChartView(data, getChartOptions());
  }

  // Listen for changes
  $(window).on('submit change', function(submitEvent) {
    submitEvent.preventDefault();
    updateView();
    return false;
  });
  $('.ui-menu').on('click', updateView); // Our weird unsupported autocomplete hack isn't creating change events

  // Make native inputs have similar size and font
  $('input').addClass("ui-widget ui-widget-content ui-corner-all");

  // Show form
  $('body').addClass('ready');

  // Use jQuery UI tooltips
  $(document).tooltip();

  // Show current visualization
  updateView();
}

function onError($xhr, textStatus, errorThrown) {
  console.log(textStatus);
  $('#report').text('An error occured: ' + errorThrown);
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
    .val(getStringParameterByName('ua1', '@any'))
    .combobox();
  $('#ua2')
    .val(getStringParameterByName('ua2', '@any'))
    .combobox();
}

// TODO get dynamically via Object.keys(data.views[0].report.totals)
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
    .val(getStringParameterByName('event1', 'badge-hovered'))
    .combobox();
  $('#event2')
    .val(getStringParameterByName('event2', 'page-visited'))
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
    .val(getStringParameterByName('loc1', '@any'))
    .combobox();
  $('#loc2')
    .val(getStringParameterByName('loc2', '@any'))
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
  var webServiceUrl = 'http://ec2-54-221-79-114.compute-1.amazonaws.com:3001/all.json';
  $.ajax({
    url: webServiceUrl,
    dataType: 'json',
    error: onError,
    success: onDataAvailable
  });
}

$(document).ready(onReady);