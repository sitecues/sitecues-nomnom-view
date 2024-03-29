function convertIndexToDate(dateIndex) {
  const datesWithDataAvailable = globalData.summary.config.dates;
  var dateAsYYYYMMDD = datesWithDataAvailable[dateIndex].toString(),
    year = dateAsYYYYMMDD.substr(2, 2),
    month = dateAsYYYYMMDD.substr(4, 2),
    day = dateAsYYYYMMDD.substr(6, 2);

  return month + '/' + day + '/' + year;
}

function convertDateToIndex(date, defaultValueIfNotFound) {
  const datesWithDataAvailable = globalData.summary.config.dates;
  let extractParts = date.split('/'),
    month = extractParts[0],
    day = extractParts[1],
    year = extractParts[2],
    dateAsInt = parseInt(year + month + day),
    dateIndex = datesWithDataAvailable.indexOf(dateAsInt);

  return dateIndex < 0 ? defaultValueIfNotFound : dateIndex;
}

function toPrecision(val, precision) {
  return parseFloat(val.toPrecision(precision));
}

