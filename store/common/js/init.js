'use strict';

let globalData = {}; // Store as global

function onReady() {
  $('#security').one('submit', function() {
    Promise.all([loadData('summary.json'), loadData('siteInfo.json') ])
      .then(([summary, siteInfo]) => {
        globalData.summary = summary;
        globalData.siteInfo = siteInfo;
      })
      .then(controller.getInitialData)
      .then(() => {
        controller.onDataAvailable();
      })
      .catch(onError);
  });
}

function onError(err) {
  // TODO For some reason, please wait icon still visible
  // This rule should be working in controller.css: body.error #wait { display: none; }
  console.log(err);
  $('body').addClass('error');
  $('#error').text('An error occurred: ' + err);
}

function loadData(apiPath) {
  return new Promise(function(resolve, reject) {
    $('body').addClass('password-entered');

    console.log('Fetching ' + apiPath);

    const username = 'sitecues',
      password = $('#password').val(),
      // webServiceUrl = 'http://localhost:3001/all.json';
      // webServiceUrl = 'http://ec2-54-221-79-114.compute-1.amazonaws.com:3001/all.json';
      webServiceUrl = window.location.protocol + '//' + window.location.hostname + ':3001/' + apiPath;

    const xhr = new XMLHttpRequest();
    xhr.open("GET", webServiceUrl, true);
    xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ':' + password));
    xhr.onload = function () {
      if (xhr.status < 400) {
        console.log('Retrieved ' + apiPath);
        resolve(JSON.parse(xhr.responseText));
      }
      else {
        console.log('Error: ' + xhr.statusText);
        reject(xhr.statusText);
      }
    };
    xhr.onerror = (err) => {
      console.log(err);
      reject(err);
    };
    xhr.send();
  });
}

$(document).ready(onReady);