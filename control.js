function getValue(id) {
  return $('#' + id).val();
}

function getChartOptions() {
  return {
    event1: getValue('event1'),
    event2: getValue('event2'),
    ua1: getValue('ua1'),
    ua2: getValue('ua2'),
    domain: getValue('domain'),
    siteId: getValue('siteId'),
    startDate: getValue('startDate'),
    endDate: getValue('endDate'),
    smoothSize: $('#doSmooth').is(':checked') ? 3 : 0
  };
}
function onDataAvailable(data) {
  initEventOptions(data.eventTotals.byNameOnly);
  initUserAgentOptions(data.eventTotals.byUserAgentOnly);
  initSiteOptions(data.siteInfo);
  initDatePickers();

  function updateView() {
    updateChartView(data, getChartOptions());
  }

  $('#controller').on('submit change', function(submitEvent) {
    submitEvent.preventDefault();
    updateView();
    return false;
  });

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
  var userAgentNames = ['any'].concat(Object.keys(userAgentTotals).sort()),
    $uaSelects = $('.ua-chooser');

  userAgentNames.forEach(function(eventName) {
    $uaSelects.each(function() {
      var option = createOption(eventName);
      $(this).append(option);
    });
  });

  // Set defaults
  $('#ua1').val('any');
  $('#ua2').val('any');
}

// TODO get dynamically via Object.keys(data.views[0].report.totals)
function initEventOptions(allEventTotals) {
  var allEventNames = Object.keys(allEventTotals),
    $eventNameSelects = $('.event-chooser');

  // $eventNameSelects.autocomplete({
  //   source: allEventNames,
  //   autoFocus: true,
  //   matchContains: false
  // }).click(function() {
  //   $(this).autocomplete('search', '');
  // });

  allEventNames.sort().forEach(function(eventName) {
    $eventNameSelects.each(function() {
      var option = createOption(eventName);
      $(this).append(option);
    });
  });

  // Set defaults
  $('#event1').val('page-visited');
  $('#event2').val('badge-hovered');
}

function initSiteOptions(siteInfo) {
  var domains = Object.keys(siteInfo.domainToSiteIdMap).map(function(domain) { return domain+ ' (' + siteInfo.domainToSiteIdMap[domain] + ')'; }),
    siteIdList = siteInfo.allSiteIds.map(function(siteId) { return siteId + ' ' + Object.keys(siteInfo.siteIdToDomainsMap[siteId]).join(',')});

  $('#domain')
    .autocomplete({
      source: ['any'].concat(domains.sort()),
      autoFocus: true,
      matchContains: true
    })
    .val('any');

  $('#siteId')
    .autocomplete({
      source: ['any'].concat(siteIdList.sort()),
      autoFocus: true,
      matchContains: true
    })
    .val('any');
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