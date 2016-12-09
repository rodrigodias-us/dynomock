var Server = require('./app/server');

//command args
const commandLineArgs = require('command-line-args');
const optionDefinitions = [
  { name: 'host', alias: 'h', type: String },
  { name: 'port', alias: 'p', type: Number },
  { name: 'feature', alias: 'f', type: String },
  { name: 'address', alias: 'a', type: String },
  { name: 'local_port', alias: 'l', type: Number, defaultOption: true }
];
const options = commandLineArgs(optionDefinitions);

//verify args
if(options.host==null||options.port==null||options.feature==null||options.address==null){
  console.log("Host, Port, Address and Feature args not found.\n\n"+
  "--------------------------------------------------------------------------------------\n"+
  "                                    How to use\n"+
  "--------------------------------------------------------------------------------------\n"+
  "node index.js --host {HOST} --port {PORT} --feature {FEATURE_NAME} --address {ADDRESS}\n"+
  "or\n"+
  "node index.js -h {HOST} -p {PORT} -f {FEATURE_NAME} -a {ADDRESS}\n\n"+
  "--------------------------------------------------------------------------------------\n"+
  "                                   Optional Args\n"+
  "--------------------------------------------------------------------------------------\n"+
  "--local_port {LOCAL_PORT} or -l {LOCAL_PORT}\n\n"+
  "--------------------------------------------------------------------------------------\n"+
  "                                      Args?\n"+
  "--------------------------------------------------------------------------------------\n"+
  "HOST - proxy host\n"+
  "PORT - port from the host\n"+
  "FEATURE_NAME - Name to manager the mocks\n"+
  "ADDRESS - Route address from the remote address\n"+
  "LOCAL_PORT - Local Port to listen\n\n");
}else{
  var s = new Server(options.host, options.port, options.feature, options.address, options.local_port);
  s.start();
}
