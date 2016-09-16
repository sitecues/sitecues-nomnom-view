var data; // Store as global

function onReady() {
  $('#security').one('submit', loadData);
}

function onError(statusCode, textStatus) {
  console.log(statusCode);
  console.log(textStatus);
  $('body').addClass('error');
  $('#error').text('An error occurred: ' + statusCode + ' ' + textStatus);
}

function loadData() {
  $('body').addClass('password-entered');

  var username = 'sitecues',
    password = $('#password').val(),
    // webServiceUrl = 'http://localhost:3001/all.json';
    // webServiceUrl = 'http://ec2-54-221-79-114.compute-1.amazonaws.com:3001/all.json';
    webServiceUrl = window.location.protocol + '//' + window.location.hostname + ':3001/all.json';

  var xhr = new XMLHttpRequest();
  xhr.open("GET", webServiceUrl, true);
  xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ':' + password));
  xhr.onload = function() {
    if (xhr.status < 400) {
      data = JSON.parse(xhr.responseText);
      controller.onDataAvailable();
    }
    else {
      onError(xhr.status, xhr.statusText);
    }
  };
  xhr.send();
}

$(document).ready(onReady);