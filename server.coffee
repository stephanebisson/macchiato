http = require 'http'
fs = require 'fs'
url = require 'url'

sendError = (request, response, error) -> 
	response.writeHead 500, {'Content-Type': 'text/plain'}
	response.end error.message

sendFile = (request, response, content, type) ->
	response.writeHead 200, {'Content-Type': type}
	response.end content, 'utf-8' 

guessType = (filename) ->
	ext = (filename.split '.')[1]
	type = 'text/plain'
	type = 'text/html' if ext is 'html'
	type = 'text/css' if ext is 'css'
	type = 'text/javascript' if ext is 'js'
	type = 'image/gif' if ext is 'gif'
	type

couch_proxy = (request, response) ->
	options = {
		host: '127.0.0.1', 
		port: 5984, 
		method: request.method, 
		path: (request.url.replace '/couch/', '/')
	}
	proxy_request = http.request options, (proxy_response) -> 
		proxy_response.addListener 'data', (chuck) ->
			response.write chuck, 'binary'
		proxy_response.addListener 'end', () ->
			response.end()
		response.writeHead proxy_response.statusCode, proxy_response.headers
	request.addListener 'data', (chuck) ->
		proxy_request.write chuck, 'binary'
	request.addListener 'end', () ->
		proxy_request.end()
	

server = http.createServer (request, response) -> 
	try
		path = url.parse(request.url).pathname
		if path.substring(0, 7) == '/couch/'
			console.log 'couch: ', path
			couch_proxy request, response
		else
			console.log 'file: ', path
			base = '/Users/ThoughtWorks/Sites' 
			fullpath = base + path 
			content = fs.readFile fullpath, (error, content) ->
				if error
					sendError request, response, error
				else
					type = guessType path
					sendFile request, response, content, type
		
	catch error 
		console.log 'ERROR'
		console.log error
		sendError request, response, error

server.listen 8080


