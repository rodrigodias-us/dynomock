var fs = require('fs');
var querystring = require('querystring');
var express = require('express');
var http = require('http');
var utils = require('./utils');
var folderMockFiles = 'mock_files';
var folderCache = '';
var folderInfo = '';

function Server(host, port, feature, local_port=3000){

	var app = express();
	var bodyParser = require('body-parser');
	var success_display = "none";

	app.use(bodyParser.urlencoded({extended: false}));

	app.set('views', './views');
	app.set('view engine', 'hbs');

	folderInfo = folderMockFiles+"/"+feature+"/info";
	folderCache = folderMockFiles+"/"+feature+"/mock";
	utils.createFolder(folderInfo);
	utils.createFolder(folderCache);

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
		var mocksData = utils.listAllMocks(folderCache);

		success_display = "none";
		if(mocksData.length<1){
			response.render('mock', { id: mockId, success_display: success_display,feature:feature });
		}else{
			fs.readFile(pathMock, 'utf8', (err, data) => {
				if (!err) {
					var cached = JSON.parse(data);
					if (cached){
						response.render('mock', { id: mockId, mock: cached, body: JSON.stringify(cached, null, 2), success_display: success_display, mocks_data: mocksData,feature:feature});
					} else {
						response.render('mock', { id: mockId, mock: cached, success_display: success_display, mocks_data: mocksData,feature:feature });
					}
				}else{
					pathMock = folderCache + '/' + mocksData[0].id_mock + '.json';
					fs.readFile(pathMock, 'utf8', (err, data) => {
						if (!err) {
							var cached = JSON.parse(data);
							response.render('mock', { id: mocksData[0].id_mock, mock: cached, body: JSON.stringify(cached, null, 2), success_display: success_display, mocks_data: mocksData,feature:feature});
						}
					});
				}
			});
		}
	});

	app.post('/mock/:mock_id', function(request, response){
		var mockId = request.params.mock_id;
		var pathMock = folderCache + '/' + mockId + '.json';
		var mocksData = utils.listAllMocks(folderCache);

		var cache = JSON.parse(request.body.json);

		fs.writeFile(pathMock, JSON.stringify(cache, null, 2), function(err) {
			if(err) {
				return console.log(err);
			}
			success_display = "block";
			response.render('mock', { id: mockId, mock: cache, body: JSON.stringify(cache, null, 2), success_display: success_display, mocks_data: mocksData,feature:feature});
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

	//Mock Information
	app.get('/mock/:mock_id/info', function(request, response){
		var mockId = request.params.mock_id;
		var mockFile = folderInfo+"/inf_"+ mockId + '.json';
		fs.readFile(mockFile, 'utf8', (err, data) => {
			if (!err) {
				var mockInfo = JSON.parse(data);
			}
			response.render('mock-info', {id: mockId,mockInfo:mockInfo});
		});
	});

	//Save Mock Information
	app.post('/mock/:mock_id/info-save', function(request, response){
		var mockId = request.params.mock_id;
		var mockFile = folderInfo+"/inf_"+ mockId + '.json';
		var json = JSON.stringify(request.body);
		fs.writeFile(mockFile, json, function(err) {
			if(err) {
				return console.log(err);
			}
			response.render('mock-info-save',{});
			console.log( "SAVE INFO FILE -> " + mockId );
		});
	});

	//Feature
	app.get('/feature', function(request, response){
			var features = utils.listAllFeatures(folderMockFiles);
			response.render('feature', { feature:feature,features:features});
		});

	//Change Feature
	app.get('/feature/:feature_name', function(request, response){
			feature = request.params.feature_name.replace("@"," ");
			var features = utils.listAllFeatures(folderMockFiles);
			folderInfo = folderMockFiles+"/"+feature+"/info";
			folderCache = folderMockFiles+"/"+feature+"/mock";
			response.render('feature', { feature:feature,features:features});
		});

	this.start = function(){
		//create node.js http server and listen on port
		console.log("START SERVER TO "+ host+ ":" + port);
		console.log("LISTEN : "+ local_port);
		http.createServer(app).listen(local_port);
	};

};

module.exports = Server;
