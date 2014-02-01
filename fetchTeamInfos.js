#! /usr/local/bin/node

var RateLimiter = require('limiter').RateLimiter;
var request = require('request');
var fs = require('fs');
var path = require('path');

var argv = require('optimist').argv;
var key = argv.key;
var teamsJSONFilePath = argv.teams;

var limiter = new RateLimiter(1, 1000);
var getTeamInfo = function(teamID, callback) {
	limiter.removeTokens(1, function(error, remainingRequests) {
		var url = 'http://api.steampowered.com/IDOTA2Match_570/GetTeamInfoByTeamID/v1/?key=' + key + '&start_at_team_id=' + teamID;
		var options = { url: url, json: true };
		request(options, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				var teams = body.result.teams;

				if (teams.length != 0 && teams[0].team_id == teamID) {
					var teamInfo = teams[0];
					callback(null, teamInfo);
				}
				else {
					callback(new Error('API did not return team info for id: ' + teamID));
				}
			}
			else {
				callback(error);
			}
		});
	});
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

for (var i = 0; i < teams.length; i++) {
	var team = teams[i];
	getTeamInfo(team.id, function(teamInfo) {
		teamInfos.push(teamInfo);

		finishCount++;
		if (finishCount == teams.length) {
			var teamInfosJSON = JSON.stringify(teamInfos);
			fs.writeFile('./teaminfos.json', teamInfosJSON, function(error) {
				if (error) {
					console.log(error);
				}
			});
		}
	});
}