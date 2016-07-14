'use strict';

const
  path = require('path'),
  hapi = require('hapi'),
  inert = require('inert'),
  server = new hapi.Server(),
  serverOptions = {
    port: parseInt(process.env.PORT, 10) || 3005,
    routes: {
      cors: true,
      files: {
        relativeTo: path.join(__dirname, '..', 'store')
      }
    }
  };

server.connection(serverOptions);
server.register(inert, (err) => {
  if (err) {
    throw err;
  }
});

server.route({
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: '.',
      redirectToSlash: true,
      index: true
    }
  }
});

server.start((err) => {
  if (err) {
    throw err;
  }
  console.log('Server running at:', server.info.uri);
});

