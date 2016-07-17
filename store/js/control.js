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
    smoothSize: $('#doSmooth').is(':checked') ? 3 : 0
  };
}
function onDataAvailable(data) {
  initEventOptions(data.eventTotals.byNameOnly);
  initUserAgentOptions(data.eventTotals.byUserAgentOnly);
  initLocationOptions(data.eventTotals.byLocation);
  initDatePickers();

  function updateView() {
    updateChartView(data, getChartOptions());
  }

  $('#controller').on('submit change', function(submitEvent) {
    submitEvent.preventDefault();
    updateView();
    return false;
  });

  $('input').addClass("ui-widget ui-widget-content ui-corner-all");

  $('#controller').css('visibility', 'visible');
  updateView();
}

function onError($xhr, textStatus, errorThrown) {
  console.log(textStatus);
  $('#report').text('An error occured: ' + errorThrown);
}

function createOption(eventName) {
  return $('<option></option>')
    .attr('value', eventName).text(eventName);
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
    .val('@any')
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

function initLocationOptions(locationTotals) {
  var allLocations = Object.keys(locationTotals).sort(),
    $locationSelects = $('.location-chooser');

  allLocations.forEach(function(locationName) {
    $locationSelects.each(function() {
      var option = createOption(locationName);
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