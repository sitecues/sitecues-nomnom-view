'use strict';

var globalData; // Store as global

function onReady() {
  $('#security').one('submit', function() {
    loadData('all.json')
      .then(function(data) {
        globalData = data;
        controller.onDataAvailable();
      })
      .catch(onError);
  });
}

function onError(err) {
  console.log(err);
  $('body').addClass('error');
  $('#error').text('An error occurred: ' + err);
}

function loadData(apiPath) {
  return new Promise(function(resolve, reject) {
    $('body').addClass('password-entered');

    var username = 'sitecues',
      password = $('#password').val(),
      // webServiceUrl = 'http://localhost:3001/all.json';
      // webServiceUrl = 'http://ec2-54-221-79-114.compute-1.amazonaws.com:3001/all.json';
      webServiceUrl = window.location.protocol + '//' + window.location.hostname + ':3001/' + apiPath;

    var xhr = new XMLHttpRequest();
    xhr.open("GET", webServiceUrl, true);
    xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ':' + password));
    xhr.onload = function () {
      if (xhr.status < 400) {
        resolve(JSON.parse(xhr.responseText));
      }
      else {
        reject(xhr.statusText);
      }
    };
    xhr.send();
  });
}

$(document).ready(onReady);