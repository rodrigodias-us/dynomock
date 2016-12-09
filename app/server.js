var fs = require('fs');
var querystring = require('querystring');
var express = require('express');
var http = require('http');
var folderMockFiles = 'mock_files';
var folderCache = '';
var folderInfo = '';
var utils = require('./utils');
var app = express();
var bodyParser = require('body-parser');
var success_display = "none";

function Server(host, port, feature, address, local_port=3000){

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
		setFolderMock();
		var mockId = request.params.mock_id;
		var pathMock = folderCache + '/' + mockId + '.json';
		var mocksData = utils.listAllMocks(folderCache);

		success_display = "none";
		if(mocksData.length<1){
			response.render('mock', { id: mockId, success_display: success_display,feature:getFeature() });
		}else{
			fs.readFile(pathMock, 'utf8', (err, data) => {
				if (!err) {
					var cached = JSON.parse(data);
					if (cached){
						response.render('mock', { id: mockId, mock: cached, body: JSON.stringify(cached, null, 2), success_display: success_display, mocks_data: mocksData,feature:getFeature()});
					} else {
						response.render('mock', { id: mockId, mock: cached, success_display: success_display, mocks_data: mocksData,feature:getFeature() });
					}
				}else{
					pathMock = folderCache + '/' + mocksData[0].id_mock + '.json';
					fs.readFile(pathMock, 'utf8', (err, data) => {
						if (!err) {
							var cached = JSON.parse(data);
							response.render('mock', { id: mocksData[0].id_mock, mock: cached, body: JSON.stringify(cached, null, 2), success_display: success_display, mocks_data: mocksData,feature:getFeature()});
						}
					});
				}
			});
		}
	});

	app.post('/mock/:mock_id', function(request, response){
		setFolderMock();
		var mockId = request.params.mock_id;
		var pathMock = folderCache + '/' + mockId + '.json';
		var mocksData = utils.listAllMocks(folderCache);

		var cache = JSON.parse(request.body.json);

		fs.writeFile(pathMock, JSON.stringify(cache, null, 2), function(err) {
			if(err) {
				return console.log(err);
			}
			success_display = "block";
			response.render('mock', { id: mockId, mock: cache, body: JSON.stringify(cache, null, 2), success_display: success_display, mocks_data: mocksData,feature:getFeature()});
			console.log( "SAVE CACHE FILE -> " + mockId );
		});
	});

	app.use('/static', express.static('public'));
	app.use('/static/lib', express.static('bower_components'));

	app.use(address, function(request, response) {
		setFolderMock();
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
					var json = JSON.stringify(Object.assign(options, {body:JSON.parse(body)}));
					fs.writeFile(pathMock.replace(".json","_request.json"), json, function(err) {});

					var server = http.request(options, (res) => {
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
					server.write(body);
				}
			});
		});
	});

	//Mock Information
	app.get('/mock/:mock_id/info', function(request, response){
		setFolderMock();
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
		setFolderMock();
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
		success_display = "none";
		deleted_display = "none";
		response.render('feature', { feature:getFeature(),features:features,success_display:success_display,deleted_display:deleted_display});
	});

	//Change Feature
	app.get('/feature/:feature_name', function(request, response){
		feature = request.params.feature_name;
		var features = utils.listAllFeatures(folderMockFiles);

		//set the folder mock
		setFolderMock();
		success_display = "none";
		deleted_display = "none";
		response.render('feature', { feature:getFeature(),features:features,success_display:success_display,deleted_display:deleted_display});
	});

	//Save new Feature
	app.post('/feature', function(request, response){
		feature = request.body.feature_name;

		//set the folder mock
		setFolderMock();
		var featureFile = folderInfo+"/inf_"+ request.body.feature_name + '.json';
		var json = JSON.stringify(request.body);
		fs.writeFile(featureFile, json, function(err) {
			if(err) {
				return console.log(err);
			}
			feature = request.body.feature_name;
			var features = utils.listAllFeatures(folderMockFiles);

			success_display = "block";
			deleted_display = "none";
			response.render('feature', { feature:getFeature(),features:features,success_display:success_display,deleted_display:deleted_display});
		});
	});

	//Delete Feature
	app.get('/feature-delete/:feature_name', function(request, response){

		utils.deleteFolderRecursive(folderMockFiles+"/"+request.params.feature_name);
		var features = utils.listAllFeatures(folderMockFiles);
		success_display = "none";
		deleted_display = "block";
		response.render('feature', { feature:getFeature(),features:features,success_display:success_display,deleted_display:deleted_display});
	});

	//Zip Feature
	app.get('/feature-zip/:feature_name', function(request, response){
		var export_feature = request.params.feature_name;

		//zip files
		var zip = new require('node-zip')();
		export_feature = export_feature.replace(/ /g,"_").replace(/%20/g,"_");

		//added folders in zip
		var folder_info = export_feature+"/info";
		var folder_mock = export_feature+"/mock";
		zip.folder(folder_info);
		zip.folder(folder_mock);

		//added files in folder info
		zip = zipFilesFromFeature(zip,folderMockFiles,folder_info);
		//added files in folder mock
		zip = zipFilesFromFeature(zip,folderMockFiles,folder_mock);

		//generate zip from feature
		var data = zip.generate({base64:false,compression:'DEFLATE'});

		//open content-type zip
		response.set('Content-Type', 'application/zip')
		response.set('Content-Disposition', 'attachment; filename='+export_feature+'.zip');
		response.set('Content-Length', data.length);
		response.end(data, 'binary');
	});

	//zip feature files
	var zipFilesFromFeature = function(zip,folderMockFiles,folder){
		var files = fs.readdirSync(folderMockFiles+"/"+folder);
		for(i in files){
			var file = folder+"/"+files[i];
			zip.file(file,fs.readFileSync(folderMockFiles+"/"+file));
		}
		return zip;
	};

	this.start = function(){
		//create node.js http server and listen on port
		var dynomock = fs.readFileSync('dynomock.txt', 'utf8');
		console.log(dynomock);
		console.log("START SERVER TO "+ host+ ":" + port + " - - - - - - LISTEN : "+ local_port + "\n");
		http.createServer(app).listen(local_port);
	};

	//set the folder mock
	var getFeature = function(){
		if(feature==null)return "";
		return feature.replace(/_/g," ");
	};
	//set the folder mock
	var setFolderMock = function(){
		var folder = utils.updateFolderMock(folderMockFiles,feature);
		folderInfo = folder.folderInfo;
		folderCache = folder.folderCache;
	};
	setFolderMock();
};

module.exports = Server;
