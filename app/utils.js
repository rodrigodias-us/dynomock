var crypto = require('crypto');
var fs = require('fs');

module.exports = {
	makeMd5: function(string){
		return crypto.createHash('md5').update(string).digest("hex");
	},
	listAllMocks: function(folderCache){
		var mocks_data = [];
		var files = fs.readdirSync(folderCache);
		
		for(i = 0; i < files.length; i++){
			var file = folderCache+"/"+files[i];
			var stat = fs.statSync(file);
			mocks_data.push({id_mock:files[i].replace(".json",""),date:stat.mtime});
		}
		return mocks_data;
	}
}
