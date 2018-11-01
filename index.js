// i.e
// csv2jsonDirectoryConverter({
// 	input: "config/i18next/csv",
// 	output: "config/i18next/locales"
// }).start()

const path = require('path');
const fs = require('fs');
const csvParse = require('csv-parse');

function csv2jsonDirectoryConverter(cfg) {

	const csvDir = cfg.input || 'input_csv';
	const jsonDir = cfg.output || 'output_json';

	let inputFiles = [];
	let resource = {};
	let languages = [];
	
	function processCsvRecord(recordArr, index) {
		// ignor empty
		if (!recordArr[0]) {
			return;
		}
		
		if (!languages.length) {
			languages = recordArr.slice(1);
			for(var i=0; i<languages.length; i++) {
				if (!resource[languages[i]] || !resource[languages[i]]['translation']){
					resource[languages[i]] = {
						translation : {}
					};
				}
			}
			return;
		}
		
		var keysArr = recordArr[0].split('.');
		var currentValue;
		var prevValue;
		var lastKey;
		for(var i=0; i<languages.length; i++) {
			if (!recordArr[i+1]) {
				continue;
			}
			
			currentValue = resource[languages[i]]['translation'];
			for(var j=0; j<keysArr.length; j++) {
				prevValue = currentValue;
				lastKey = keysArr[j];
				if (! prevValue[lastKey] ) {
					prevValue[lastKey] = {};
				}
				currentValue = prevValue[lastKey];
			}
			
			prevValue[lastKey] = recordArr[i+1];
		}
	}

	function saveFile(dir, fileName, data) {
		fs.writeFile(path.join(dir, fileName), data, function(err) {
			if(err) {
				console.log(err);
			} else {
				console.log(fileName+" file was saved!");
			}
		});		
	}

	function saveLanguage(langName, langObj) {
		saveFile(jsonDir, langName+'.json', JSON.stringify(langObj['translation'], null, " "));

		// var tmpObj = {};
		// tmpObj[langName] = langObj['translation'];
		// saveFile(ymlDir, langName+'.yml', '---\n'+yamljs.stringify(tmpObj, 4));
	}
	
	function saveResults() {
		var lang = {};
		for(lang in resource) {
			saveLanguage(lang, resource[lang]);
		}
	}
	
	function processNextFile() {
		var fileName = "";
		if (!inputFiles.length) {
			//console.log(JSON.stringify(resource, null, " "));
			console.log("all converted");
			saveResults();
			return;
		}
		fileName = inputFiles.pop();
		loadFile(path.join(csvDir, fileName));
	}
	
	function loadFile(fileName) {
		// reset languages for each file
		languages = [];
		fs.createReadStream(fileName)
			.pipe(csvParse())
			.on('data', processCsvRecord)
			.on('end', function(count){
				processNextFile();
			})
			.on('error', function(error){
				console.log(error.message);
			});	
	}	
	
	function processFiles(err, files) {
		if (err) {
			throw err;
		}
		inputFiles = files;
		processNextFile();
	}

	function readDir() {
		fs.readdir(csvDir, processFiles);
	}

	return {
		start: function() {
			if (!csvDir || !jsonDir) {
				console.log("Error: directories not specified");
				return;
			}
			readDir();
		}
	};
}

module.exports = csv2jsonDirectoryConverter;