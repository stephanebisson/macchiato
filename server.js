(function() {
  var couch_proxy, fs, guessType, http, sendError, sendFile, server, url;
  http = require('http');
  fs = require('fs');
  url = require('url');
  sendError = function(request, response, error) {
    response.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    return response.end(error.message);
  };
  sendFile = function(request, response, content, type) {
    response.writeHead(200, {
      'Content-Type': type
    });
    return response.end(content, 'utf-8');
  };
  guessType = function(filename) {
    var ext, type;
    ext = (filename.split('.'))[1];
    type = 'text/plain';
    if (ext === 'html') {
      type = 'text/html';
    }
    if (ext === 'css') {
      type = 'text/css';
    }
    if (ext === 'js') {
      type = 'text/javascript';
    }
    if (ext === 'gif') {
      type = 'image/gif';
    }
    return type;
  };
  couch_proxy = function(request, response) {
    var options, proxy_request;
    options = {
      host: '127.0.0.1',
      port: 5984,
      method: request.method,
      path: request.url.replace('/couch/', '/')
    };
    proxy_request = http.request(options, function(proxy_response) {
      proxy_response.addListener('data', function(chuck) {
        return response.write(chuck, 'binary');
      });
      proxy_response.addListener('end', function() {
        return response.end();
      });
      return response.writeHead(proxy_response.statusCode, proxy_response.headers);
    });
    request.addListener('data', function(chuck) {
      return proxy_request.write(chuck, 'binary');
    });
    return request.addListener('end', function() {
      return proxy_request.end();
    });
  };
  server = http.createServer(function(request, response) {
    var base, content, fullpath, path;
    try {
      path = url.parse(request.url).pathname;
      if (path.substring(0, 7) === '/couch/') {
        console.log('couch: ', path);
        return couch_proxy(request, response);
      } else {
        console.log('file: ', path);
        base = process.argv[2];
        fullpath = base + path;
        return content = fs.readFile(fullpath, function(error, content) {
          var type;
          if (error) {
            return sendError(request, response, error);
          } else {
            type = guessType(path);
            return sendFile(request, response, content, type);
          }
        });
      }
    } catch (error) {
      console.log('ERROR');
      console.log(error);
      return sendError(request, response, error);
    }
  });
  server.listen(8080);
}).call(this);
