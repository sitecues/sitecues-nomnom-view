/**
 * View controller
 */

// TODO alarms, e.g. Fullerton hiding badge in IE

'use strict';

class CommonController {
  constructor() {
    this.OFF_OPTION_NAME = '<same>'; // Eww no class properties or consts in ES6
  }

  // Get a parameter value fro the URL query
  getStringParameterByName(name) {
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
      results = regex.exec(location.search);
    return results ? decodeURIComponent(results[1].replace(/\+/g, ' ')) : undefined;
  }

  getBooleanParameterByName(name) {
    const stringVal = this.getStringParameterByName(name);
    return stringVal && stringVal === 'true';
  }

  changeUrl(title, url) {
    if (typeof (history.pushState) != 'undefined') {
      const obj = {title: title, URL: url};
      history.pushState(obj, obj.title, obj.URL);
      document.title = title;
    }
  }

  updateUrlAndTitle(options) {
    function getCurrentLocationWithoutParams() {
      const currLoc = window.location.toString();

      return currLoc.substr(0, currLoc.length - window.location.search.length);
    }

    const params = [];
    Object.keys(options).forEach((optionName) => {
      if (options[optionName] !== null) {
        params.push(encodeURIComponent(optionName) + '=' + encodeURIComponent(options[optionName]));
      }
    });

    const href = getCurrentLocationWithoutParams() + '?' + params.join('&'),
      title = view.getChartTitle(options);

    this.changeUrl(title, href);
  }

  getTextFieldValue(id) {
    return $('#' + id).val();
  }

  getRadioValue(id) {
    return $('[name="'+ id + '"]:checked').attr('id')
  }

  getCheckboxValue(id) {
    return $('#' + id).is(':checked');
  }

  changeTextFieldValue(id, val) {
    function getTextValue(option, defaultVal) {
      return option ? option.innerText : defaultVal;
    }

    const $formControl = $('#' + id);
    $formControl.val(val);
    if ($formControl.is('select')) {
      const $possibleInput = $formControl.next().children().first();
      if ($possibleInput.is('input')) {
        const textVal = getTextValue($formControl[0].selectedOptions[0], val);
        $possibleInput.val(textVal);
        this.adjustTextfieldTextColor($possibleInput, val);
      }
    }
  }

  changeCheckableValue(id, isChecked) {
    $('#' + id).prop('checked', isChecked);
  }

  ensureValidCheckboxOptions() {
    if ($('#doUltraSmooth').is(':checked')) {
      $('#doSmooth').prop('checked', true);
    }
  }

  onDataAvailable() {
    this.initOptions();
    this.populateFormWithValues();
    this.listenForUserActions();
    this.prettify();

    // Show form
    $('body').addClass('ready');

    // Show current visualization
    view.updateChartView(this.getCleanedOptions(this.getUserOptions()));
  }

  listenForUserActions() {

    const self = this;

    function onHistoryChange() {
      self.setFormValues(self.getParameterMap());
      view.updateChartView(self.getCleanedOptions(self.getUserOptions()));
    }

    window.addEventListener('popstate', () => onHistoryChange());

    function onFormChange() {
      const options = self.getUserOptions();
      self.updateUrlAndTitle(options);
      view.updateChartView(self.getCleanedOptions(options));
    }

    $('#reset').on('click', function () {
      self.setFormValues(() => self.getDefaultParameterMap());
    });

    // Listen for changes
    $(window).on('submit change autocompleteselect', () => {
      setTimeout(() => onFormChange(), 0);  // Wait until <same> set on other line 2 items
    });
  }

  // Make the UI more attractive and visually consistent
  prettify() {
    // Use jQuery UI tooltips
    $(document).tooltip();

    // Use jQuery UI button
    $('#reset').button();

    // Make native inputs have similar size and font
    // Select text on focus
    $('input[type="text"] ')
      .addClass('ui-widget ui-widget-content ui-corner-all')
      .on('focus', function (evt) {
        console.log(evt.target);
        evt.target.select();
      });

    $('body').on('focus', function(evt) {
      console.log(evt);
    });
  }

  populateFormWithValues() {
    this.setFormValues(this.getParameterMap());
    this.ensureValidCheckboxOptions();
  }

  createOption(optionName, readableName) {
    return $('<option></option>')
      .attr('value', optionName).text(readableName || optionName);
  }

  initTypeOptions() {
    for (let id of [ '#type1', '#type2']) {
      $(id).append(this.createOption('eventCounts', 'event'));
      $(id).append(this.createOption('sessionCounts', 'session'));
      $(id).append(this.createOption('userCounts', 'user'));
    }

    $('#type2').append(this.createOption(this.OFF_OPTION_NAME));

    $('#type1')
      .combobox();
    $('#type2')
      .combobox();
  }

  initEventOptions(eventNames) {
    // Sort alphabetically except for key-command or panel-clicked (show at end)
    // We show these at the end because there are so many of them -- it makes things difficult to find if they're in the middle
    function eventNameComparator(event1, event2) {
      function getEventName(eventName) {
        return eventName
          .replace(/^key-command/, 'zzy')
          .replace(/^panel-clicked/, 'zzz');
      }

      return getEventName(event1) > getEventName(event2) ? 1 : -1;
    }

    const allEventNames = eventNames.sort(eventNameComparator),
      $eventNameSelects = $('.event-chooser');

    $('#event2').append(this.createOption(this.OFF_OPTION_NAME));

    allEventNames.forEach((eventName) => {
      $eventNameSelects.each((index, elem) => {
        const option = this.createOption(eventName);
        $(elem).append(option);
      });
    });

    $('#event1')
      .combobox();
    $('#event2')
      .combobox();
  }
}

