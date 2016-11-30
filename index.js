var Server = require('./app/server');

var host = process.argv[2];
var port = process.argv[3];

var s = new Server(host, port);
s.start();