var fs = require('fs');
var querystring = require('querystring');
var express = require('express');
var http = require('http');
var utils = require('./utils');

var folderCache = 'mock_files';

function Server(host, port){
	var app = express();
	var bodyParser = require('body-parser');
	
	app.use(bodyParser.urlencoded({extended: false}));
	
	app.set('views', './views');
	app.set('view engine', 'hbs');

	app.get('/mock/:mock_id/delete', function(request, response){
		var mockId = request.params.mock_id;
		var pathMock = folderCache + '/' + mockId + '.json';
		
		fs.unlink(pathMock, function(err){
			if(err) return console.log(err);
			console.log('Mock: ' + mockId + ' deleted successfully');
			response.render('mock-deleted', {id: mockId});
		});
	});
	
	app.get('/mock/:mock_id', function(request, response){
		var mockId = request.params.mock_id;
		var pathMock = folderCache + '/' + mockId + '.json';
		
		fs.readFile(pathMock, 'utf8', (err, data) => {
			if (!err) {
				var cached = JSON.parse(data);
			
				if (cached){
					response.render('mock', { id: mockId, mock: cached, body: JSON.stringify(cached, null, 2)});
				} else {
					response.render('mock', { id: mockId, mock: cached });
				}
			}
		});
	});
	
	app.post('/mock/:mock_id', function(request, response){
		var mockId = request.params.mock_id;
		var pathMock = folderCache + '/' + mockId + '.json';
		
		var cache = JSON.parse(request.body.json);
		
		fs.writeFile(pathMock, JSON.stringify(cache, null, 2), function(err) {
		    if(err) {
		        return console.log(err);
		    }
			response.render('mock', { id: mockId, mock: cache, body: JSON.stringify(cache, null, 2)});
			console.log( "SAVE CACHE FILE -> " + mockId );
		});
	});
	
	app.use('/static', express.static('public'));
	app.use('/static/lib', express.static('bower_components'));
	
	app.use('/router-app/router/mobile', function(request, response) {
		var headers = request.headers;
		var method = request.method;
		var path = request.originalUrl;
		var body = '';
  
		request.on('error', function(err) {
			console.error(err);
		}).on('data', function(chunk) {
			body += chunk;
		}).on('end', function() {
			var mockId = utils.makeMd5(body);
			var pathMock = folderCache + '/' + mockId + '.json';
			
			if (!fs.existsSync(folderCache)){
			    fs.mkdirSync(folderCache);
			}
			
			fs.readFile(pathMock, 'utf8', (err, data) => {
				if (!err) {
					console.log( "SEND CACHE FILE -> " + mockId );
					var cached = JSON.parse(data);
					cached.body.mockID = mockId;

					response
					.set(cached.headers)
					.status(200)
					.json(cached.body);
				} else {
					var options = {
						hostname: host,
						path: path,
						port: port,
						method: method,
						headers: headers
					}
				
					var dimas = http.request(options, (res) => {
						var body = '';
					
						res.on('data', (chunk) => {
							body += chunk;
						}).on('end', () => {
							body = JSON.parse(body);

							cache = {body: body, headers: res.headers};
							
							fs.writeFile(pathMock, JSON.stringify(cache, null, 2), function(err) {
							    if(err) {
							        return console.log(err);
							    }

								console.log( "SAVE CACHE FILE -> " + mockId );
							}); 

							body.mockID = mockId;
							response.set(res.headers)
							.status(200)
							.json(body);
						});
					}).on('error', (e) => {
						response.json({error: "Não foi encontrato o Dimas"});
					});
				
					console.log("ACCESS DIMAS!");
					dimas.write(body);
				}
			});
		});
	});
	
	this.start = function(){
		//create node.js http server and listen on port
		console.log("START SERVER TO "+ host+ ":" + port);
		console.log("LISTEN : 3000");
		http.createServer(app).listen(3000);
	};
	
};

module.exports = Server;