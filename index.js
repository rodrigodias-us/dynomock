var Server = require('./app/server');

//command args
const commandLineArgs = require('command-line-args');
const optionDefinitions = [
  { name: 'host', alias: 'h', type: String },
  { name: 'port', alias: 'p', type: Number }
];
const options = commandLineArgs(optionDefinitions);

//verify args
if(options.host==null||options.port==null){
  console.log("Host or Port args not found.\n"+
  "How to use\n"+
  "node index.js --host {HOST} --port {PORT}\n"+
  "or"+
  "node index.js --h {HOST} --p {PORT}");
}else{
  var s = new Server(options.host, options.port);
  s.start();
}
