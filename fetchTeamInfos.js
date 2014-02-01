#! /usr/local/bin/node

var RateLimiter = require('limiter').RateLimiter;
var request = require('request');
var fs = require('fs');
var path = require('path');
var JSONBig = require('json-bigint');

var argv = require('optimist').argv;
var key = argv.key;
var teamsJSONFilePath = argv.teams;
var useCamelCase = argv.camelcase;

var limiter = new RateLimiter(1, 1000);
var getTeamInfo = function(teamID, callback) {
	limiter.removeTokens(1, function(error, remainingRequests) {
		var url = 'http://api.steampowered.com/IDOTA2Match_570/GetTeamInfoByTeamID/v1/?teams_requested=1&key=' + key + '&start_at_team_id=' + teamID;
		var options = { url: url };
		request(options, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				var parsedBody = JSONBig.parse(body);
				var teams = parsedBody.result.teams;

				if (teams.length != 0 && teams[0].team_id == teamID) {
					var teamInfo = teams[0];
					convertIDsToStrings(teamInfo);
					if (useCamelCase) {
						convertSnakeCaseKeysToCamelCase(teamInfo);
					}
					
					callback(null, teamInfo);
				}
				else {
					callback(new Error("API did not return team info for id: " + teamID));
				}
			}
			else {
				console.error(error);
				callback(error);
			}
		});
	});
}

var convertIDsToStrings = function(object) {
	var explicitKeys = ['logo', 'logo_sponsor'];
	for (var key in object) {
		if (object.hasOwnProperty(key)) {
			if (explicitKeys.indexOf(key) != -1 || key.indexOf('_id') != -1) {
				var stringValue = object[key].toString();
				object[key] = stringValue;
			}
		}
	}
}

String.prototype.capitalize = function()
{
  return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.hasSuffix = function(suffix)
{
  var suffixLength = suffix.length;
  var end = this.substr(this.length - suffixLength);

  return (end == suffix);
}

String.prototype.hasUpperCase = function() {
	return (this.toLowerCase() != this);
}

var convertSnakeCaseKeysToCamelCase = function(object) {
	for (var key in object) {
		if (object.hasOwnProperty(key)) {
			var camelCaseKey = toCamelCaseFromSnakeCase(key);
			console.log(camelCaseKey);
			var value = object[key];
			delete object[key];
			object[camelCaseKey] = value;
		}
	}
}

var toCamelCaseFromSnakeCase = function(input) {
  if (input.hasUpperCase()) return input;

  var allCapitalExceptions = ["id", "url"];
  for (var i = 0; i < allCapitalExceptions.length; i++) {
      var exception = allCapitalExceptions[i];
      if (input.hasSuffix(exception)) {
        var untilSuffix = input.substring(0, input.length - exception.length);
        input = untilSuffix + "_" + exception;
        break;
      }
  }

  var components = input.split("_");
  var camelCase = "";

  for (var i = 0; i < components.length; i++) {
    var component = components[i];
    component = component.toLowerCase();

    if (allCapitalExceptions.indexOf(component) > -1) {
      component = component.toUpperCase();
    }
    else if (i > 0) {
      component = component.capitalize();
    }

    camelCase = camelCase + component;
  }

  return camelCase;
}

var pathArgument = process.argv[2];
if (!pathArgument) {
	console.log("A path for teams must be specified. ex: --teams teams.json");
	return;
}
var absolutePath = path.resolve(path.dirname(process.argv[1]), teamsJSONFilePath);
var teamsJSON = fs.readFileSync(absolutePath);
var teams = JSON.parse(teamsJSON).teams;
var teamInfos = [];
var finishCount = 0;

console.log("Estimated time needed: ~" + teams.length + " secs");

for (var i = 0; i < teams.length; i++) {
	var team = teams[i];
	getTeamInfo(team.id, function(error, teamInfo) {
		teamInfos.push(teamInfo);

		finishCount++;
		if (finishCount == teams.length) {
			var finalJSON = { results: teamInfos };
			var teamInfosJSON = JSON.stringify(finalJSON, null, 4);
			fs.writeFile('./teaminfos.json', teamInfosJSON, function(error) {
				if (error) {
					console.log(error);
				}
			});
		}
	});
}