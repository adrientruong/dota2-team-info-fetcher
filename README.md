dota2-team-info-fetcher
=======================

Fetch dota 2 team infos while obeying the rate limit

Usage
----------
```
node fetchTeamInfos.js --key <yourSteamWebAPIKey> --teams <pathToTeamsJSONFile>
```
Optional flags
----------------
| Flag           | What it does |
| :-----------   | :------------
| `--camelCase`  | Resulting JSON file has camelCase keys. Ex. team_id to teamID |
| `--group`      | Resulting JSON file has array instead of multiple keys. Ex: leagueID1, leagueID2 turns into leagueIds|
