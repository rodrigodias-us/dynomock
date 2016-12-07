var fs = require('fs');
var querystring = require('querystring');
var express = require('express');
var http = require('http');
var utils = require('./utils');
var folderCache = 'mock_files';

function Server(host, port, local_port=3000){

	var app = express();
	var bodyParser = require('body-parser');
	var success_display = "none";

	var sync = require('synchronize');
	var mocks_data = [];
	var fiber = sync.fiber;
	var await = sync.await;
	var defer = sync.defer;

	//List all mocks
	var listAllMocks = function(){
		sync(fs, 'readdir', 'stat');
		sync.fiber(function(){
			mocks_data = [];
		  var i, paths, path, stat, data;
		  paths = fs.readdir(folderCache);
		  for(i = 0; i < paths.length; i++){
		    file = folderCache+"/"+paths[i];
		    stat = fs.stat(file);
				mocks_data.push({id_mock:paths[i].replace(".json",""),date:stat.mtime});
		  }
		});
	 };

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

	app.get('/mock/:mock_id/info', function(request, response){
		var mockId = request.params.mock_id;
		var mockFile = "info/inf_"+ mockId + '.json';
		fs.readFile(mockFile, 'utf8', (err, data) => {
			if (!err) {
				var mockInfo = JSON.parse(data);
			}
			response.render('mock-info', {id: mockId,mockInfo:mockInfo});
		});
	});

	app.get('/mock/:mock_id', function(request, response){
 		listAllMocks();
		var mockId = request.params.mock_id;
		var pathMock = folderCache + '/' + mockId + '.json';

		fs.readFile(pathMock, 'utf8', (err, data) => {
			if (!err) {
				var cached = JSON.parse(data);
				success_display = "none";
				if (cached){
					response.render('mock', { id: mockId, mock: cached, body: JSON.stringify(cached, null, 2), success_display: success_display, mocks_data:mocks_data});
				} else {
					response.render('mock', { id: mockId, mock: cached, success_display: success_display, mocks_data:mocks_data });
				}
			}
		});
	});

	app.post('/mock/:mock_id', function(request, response){
 		listAllMocks();
		var mockId = request.params.mock_id;
		var pathMock = folderCache + '/' + mockId + '.json';

		var cache = JSON.parse(request.body.json);

		fs.writeFile(pathMock, JSON.stringify(cache, null, 2), function(err) {
		    if(err) {
		        return console.log(err);
		    }
				success_display = "block";
			response.render('mock', { id: mockId, mock: cache, body: JSON.stringify(cache, null, 2), success_display: success_display, mocks_data:mocks_data});
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
						response.json({error: "Server not found"});
					});

					console.log("ACCESS Server!");
					dimas.write(body);
				}
			});
		});
	});

	this.start = function(){
		//create node.js http server and listen on port
		console.log("START SERVER TO "+ host+ ":" + port);
		console.log("LISTEN : "+ local_port);
		http.createServer(app).listen(local_port);
	};


};

module.exports = Server;
