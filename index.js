var Server = require('./app/server');

//command args
const commandLineArgs = require('command-line-args');
const optionDefinitions = [
  { name: 'host', alias: 'h', type: String },
  { name: 'port', alias: 'p', type: Number },
  { name: 'feature', alias: 'f', type: String },
  { name: 'local_port', alias: 'l', type: Number, defaultOption: true }
];
const options = commandLineArgs(optionDefinitions);

//verify args
if(options.host==null||options.port==null||options.feature==null){
  console.log("Host, Port or Feature args not found.\n"+
  "How to use\n"+
  "node index.js --host {HOST} --port {PORT} --feature {FEATURE_NAME}\n"+
  "or\n"+
  "node index.js -h {HOST} -p {PORT} -f {FEATURE_NAME}");
}else{
  var s = new Server(options.host, options.port, options.feature, options.local_port);
  s.start();
}
