var crypto = require('crypto');
var fs = require('fs');

module.exports = {
	makeMd5: function(string){
		return crypto.createHash('md5').update(string).digest("hex");
	},
	createFolder: function(folder){
		folder = folder.replace(/ /g,"_").replace(/%20/g,"_");
		var arrayFolder = folder.split('/');
		var dirs = "";
		for(dir in arrayFolder){
			dirs+=arrayFolder[dir]+"/";
			if (!fs.existsSync(dirs)){
				fs.mkdirSync(dirs);
			}
		}
	},
	deleteFolderRecursive: function(path) {
		var files = [];
		path = path.replace(/ /g,"_").replace(/%20/g,"_");
		if( fs.existsSync(path) ) {
			files = fs.readdirSync(path);
			for(index in files){
				var curPath = path + "/" + files[index];
				if(fs.lstatSync(curPath).isDirectory()) {
					this.deleteFolderRecursive(curPath);
				} else {
					fs.unlinkSync(curPath);
				}
			}
			fs.rmdirSync(path);
		}
	},
	loadRule: function(mockFile,mockId,response) {
		var hashMd5OrMockName = [];
		hashMd5OrMockName.push(mockId);
		//verify info file and put mock name
		if( fs.existsSync(mockFile) ) {
			var mockInfo = fs.readFileSync(mockFile);
			var data = JSON.parse(mockInfo);
			hashMd5OrMockName.push(data.mock_name);
		}
		for(name in hashMd5OrMockName){
			var key = hashMd5OrMockName[name];
			var file = 'rules/'+key+'.js';
			if( fs.existsSync('app/'+file) ) {
				var rule = require('./'+file.replace('.js',''));
				rule.init(response);
			}
		}
	},
	updateFolderMock: function(folderMockFiles,feature){
		if(feature===null)return {};
		feature = feature.replace(/ /g,"_").replace(/%20/g,"_");
		folderInfo = folderMockFiles+"/"+feature+"/info",
		folderCache = folderMockFiles+"/"+feature+"/mock"
		this.createFolder(folderInfo);
		this.createFolder(folderCache);
		return {folderInfo:folderInfo,folderCache:folderCache};
	},
	listAllMocks: function(folderCache){
		var mocks_data = [];
		if(folderCache===null)return [];
		var files = fs.readdirSync(folderCache);

		for(i in files){
			var file = folderCache+"/"+files[i];
			if(files[i].charAt(0)!=="."){
				var stat = fs.statSync(file);
				mocks_data.push({id_mock:files[i].replace(/.json/g,""),date:stat.mtime});
			}
		}
		return mocks_data;
	},
	listAllFeatures: function(folder){
		return fs.readdirSync(folder).filter(function(text){
			return (text.charAt(0)!==".");
		}).map(function(path) {
			return path.replace(/_/g," ");
		});
	}
}
