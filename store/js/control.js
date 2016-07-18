function getValue(id) {
  return $('#' + id).val();
}

function getChartOptions() {
  return {
    event1: getValue('event1'),
    event2: getValue('event2'),
    ua1: getValue('ua1'),
    ua2: getValue('ua2'),
    loc1: getValue('loc1'),
    loc2: getValue('loc2'),
    startDate: getValue('startDate'),
    endDate: getValue('endDate'),
    smoothSize: $('#doSmooth').is(':checked') ? 3 : 0,
    doFixHoles: $('#doFixHoles').is(':checked')
  };
}
function onDataAvailable(data) {
  initEventOptions(data.eventTotals.byNameOnly);
  initUserAgentOptions(data.eventTotals.byUserAgentOnly);
  initLocationOptions(data.siteInfo.locationToSiteIdMap, data.siteInfo.siteIdToLocationsMap);
  initDatePickers();

  function updateView() {
    updateChartView(data, getChartOptions());
  }

  $(window).on('submit change', function(submitEvent) {
    submitEvent.preventDefault();
    updateView();
    return false;
  });

  $('.ui-menu').on('click', updateView); // Our weird unsupported autocomplete hack isn't creating change events

  $('input').addClass("ui-widget ui-widget-content ui-corner-all");

  $('#controller').css('visibility', 'visible');
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
  $uaSelects
    .val('@supported')
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
    .val('badge-hovered')
    .combobox();
  $('#event2')
    .val('page-visited')
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

function locationNameComparator(a,b) {
  var isAGroup = a.charAt(0) === '@',
    isBGroup = b.charAt(0) === '@';
  if (isAGroup !== isBGroup) {
    return (+isBGroup) - (+isAGroup);
  }
  else {
    return b > a ? -1 : 1;
  }
}

function initLocationOptions(locationToSiteIdMap, siteIdToLocationsMap) {
  var allLocations = Object.keys(locationToSiteIdMap).sort(locationNameComparator),
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
    else {
      readableName += ' [' + totalPageVisits + ']';
    }

    $locationSelects.each(function () {
      var option = createOption(locationName, readableName);
      $(this).append(option);
    });
  });

  $locationSelects
    .val('@any')
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
  var webServiceUrl = 'http://localhost:3001/all.json';
  $.ajax({
    url: webServiceUrl,
    dataType: 'json',
    error: onError,
    success: onDataAvailable
  });
}

$(document).ready(onReady);