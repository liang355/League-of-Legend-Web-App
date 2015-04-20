//modules
var express = require('express');
var mongoose = require('mongoose');
var https = require('https');

//config
var config = require("./config/config");

//app
var app = express();

//connect to database
mongoose.connect(config.db_uri);

/** MONGOOSE EXAMPLE **/
var Champion = require('./models/champion.js');
var Summoner = require('./models/summoner.js');
var Match = require('./models/match.js');
var ChampionStatistics = require('./models/championstatistics.js');


/* pretty print statement codes */
var printERR    = "[ERROR CODE]    :";
var printLog    = "[LOG]           :";


var championIdToName = {};


var addChampions = function(championData){
    for (var key in championData){
        var champion = championData[key];
        //console.log(champion);
        Champion.create({id:champion.id, name:champion.name});
    }
};

//make api requests, then move it to our db
var addChampionsToDatabase = function() {
    var api_key = config.api_key;
    var region = "na";
    var host = "https://na.api.pvp.net";

    //paths
    var championPath = "/api/lol/static-data/" + region + "/v1.2/champion?api_key=";


    https.get(host + championPath + api_key, function (response) {
        var statusCode = response.statusCode;
        console.log("making request");
        var output = '';
        response.on("data", function (chunk) {
            output += chunk;
        });
        response.on('end', function () {
            if(statusCode == 200){
                var obj = JSON.parse(output);
                addChampions(obj.data);
            }
            else{
                console.log(printERR+" addChampionToDatabase, statusCode = "+statusCode);
            }
        });
    });
};

//show champions
var displayChampionsFromDatabase = function(){
    Champion.find(function(err, champions){
        if (err){
            console.log(err);
        }
        console.log(champions);
    });
};

var populateLocalChampionIdToNameVar = function(){
    try {


        Champion.find(function (err, champions) {
            if (err) {
                console.log(err);
            }

            for (var i = 0; i < champions.length; i++) {
                var id = champions[i]['id'];
                var name = champions[i]['name'];
                championIdToName[id] = name;
            }
        });
    }
    catch(e){
        console.log(printERR+"populateLocalChampionIdToNameVar, "+e);
    }
};



var addChampionStatistics = function(championIdentification, championStatistics, thetimeline, summonerID, summonerName){
    var err = false;
    var id = championIdentification['id'];
    var role = championIdentification['role'];
    var name = championIdentification['name'];

    var assists = championStatistics['assists'];
    var kills = championStatistics['kills'];
    var  deaths = championStatistics['deaths'];
    var  magicDamageTotal = championStatistics['magicDamageTotal'];
    var  magicDamageChamp = championStatistics['magicDamageChamp'];
    var  magicDamageTaken = championStatistics['magicDamageTaken'];
    var  physicalDamageTotal = championStatistics['physicalDamageTotal'];
    var  physicalDamageChamp = championStatistics['physicalDamageChamp'];
    var  physicalDamageTaken = championStatistics['physicalDamageTaken'];
    var  heals = championStatistics['heals'];
    var  wardsKilled = championStatistics['wardsKilled'];
    var  wardsPlaced = championStatistics['wardsPlaced'];
    var  minionsKilledTotal = championStatistics['minionsKilledTotal'];
    var  enemyJungleMinionsKilled = championStatistics['enemyJungleMinionsKilled'];

    var  timeline =  thetimeline;



    try{
        Summoner.findOne({'sID':summonerID}, function(err, summoner){

            console.log(printLog + "adding stats for: " + name + ", " + role);
            var champStatistics = new ChampionStatistics();


            champStatistics.id = id;
            champStatistics.name = name;
            champStatistics.role = role;

            if(summoner == null){
                console.log(printLog +"---summoner:"+ summonerID+" does not exsist.");
                champStatistics.tier = summonerID;
                Summoner.create({'sID':summonerID, 'name':summonerName, 'tier':404});
            }
            else if(summoner['tier']!=404){
                console.log(printLog +"---summoner:"+ summonerID+"'s tier is "+summoner['tier']);
                champStatistics.tier = summoner['tier'];
            }
            else{
                console.log(printLog +"---summoner:"+ summonerID+"'s tier is unknown.");
                champStatistics.tier = summonerID;
            }

            champStatistics.numberOfGames = 1;

            champStatistics.assists=assists;
            champStatistics.kills=kills;
            champStatistics.deaths= deaths;
            champStatistics.magicDamageTotal=magicDamageTotal;
            champStatistics.magicDamageChamp=magicDamageChamp;
            champStatistics.magicDamageTaken=magicDamageTaken;
            champStatistics.physicalDamageTotal=physicalDamageTotal;
            champStatistics.physicalDamageChamp= physicalDamageChamp;
            champStatistics.physicalDamageTaken= physicalDamageTaken;
            champStatistics.heals= heals;
            champStatistics.wardsKilled= wardsKilled;
            champStatistics.wardsPlaced= wardsPlaced;
            champStatistics.minionsKilled= minionsKilledTotal;
            champStatistics.enemyJungleMinionsKilled= enemyJungleMinionsKilled;

            champStatistics.timeline=timeline;

            champStatistics.save();

        });
    }
    catch(e){
        console.log(printERR+" addChampionStatistics, "+e);
        err = true;
    }
    return err;

};

//(3) add stats to DB
var storeStats = function(stats) {

    try {


        var championIdentification = {
            'id': 0,
            'name': "",
            'role': ""
        };

        var championStatistics = {
            'assists': 0,
            'kills': 0,
            'deaths': 0,
            'magicDamageTotal': 0,
            'magicDamageChamp': 0,
            'magicDamageTaken': 0,
            'physicalDamageTotal': 0,
            'physicalDamageChamp': 0,
            'physicalDamageTaken': 0,
            'heals': 0,
            'wardsKilled': 0,
            'wardsPlaced': 0,
            'minionsKilledTotal': 0,
            'enemyJungleMinionsKilled': 0
        };

        var timeline = [];

        var oneTimeStamp = {
            'minute': 0,
            'visionWardsPlaced': 0,
            'sightWardsPlaced': 0,
            'yellowTrinketPlaced': 0,
            'jungleMinionsKilled': 0,
            'minionsKilled': 0,
            'level': 0,
            'totalGold': 0,
            'currentGold': 0
        };

        var timelineLane, timelineRole, frames, frame, events, event, statistics;
        var p, e, f, i;

        /*

         //stored per player
         blue:[],
         red:[],
         visionWardsPlaced:[],
         sightWardsPlaced:[],
         yellowTrinketPlaced: [],
         jungleMinionsKilled:[],
         minionsKilled:[],
         level:[],
         totalGold:[],
         currentGold:[],

         //stored per team
         turretBase:Number,
         turretInner:Number,
         turretOuter:Number,
         turretNexus:Number,
         inhibitor:Number,
         dragon:[],
         baron:[]
         */

        var sightWardsPlacedPerPlayerPerTimestamp = [];
        var sightwards = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            6: 0,
            7: 0,
            8: 0,
            9: 0,
            10: 0
        };
        var visionwards = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            6: 0,
            7: 0,
            8: 0,
            9: 0,
            10: 0
        };
        var yellowtrinket = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            6: 0,
            7: 0,
            8: 0,
            9: 0,
            10: 0
        };


        /* for each event in match count up wards placed per player
         *   NOTE: no event for first minute */
        frames = stats['timeline']['frames'];
        for (f = 1; f < frames.length; f++) {
            //for( i=1; i<11; i++){
            //    sightwards[i] = 0;
            //    visionwards[i] = 0;
            //    yellowtrinket[i] = 0;
            //}
            sightWardsPlacedPerPlayerPerTimestamp[f] = {
                sightwards: {
                    1: 0,
                    2: 0,
                    3: 0,
                    4: 0,
                    5: 0,
                    6: 0,
                    7: 0,
                    8: 0,
                    9: 0,
                    10: 0
                },
                visionwards: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0},
                yellowtrinket: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0}
            };
            events = frames[f]['events'];
            for (e = 0; e < events.length; e++) {
                event = events[e];
                if (event['eventType'] == "WARD_PLACED") {
                    if (event['wardType'] == "SIGHT_WARD") {
                        //sightwards[event['creatorId']] = sightwards[event['creatorId']] + 1;
                        sightWardsPlacedPerPlayerPerTimestamp[f]['sightwards'][event['creatorId']] = sightWardsPlacedPerPlayerPerTimestamp[f]['sightwards'][event['creatorId']] + 1;
                    }
                    if (event['wardType'] == "VISION_WARD") {
                        //visionwards[event['creatorId']] = visionwards[event['creatorId']] + 1;

                        sightWardsPlacedPerPlayerPerTimestamp[f]['visionwards'][event['creatorId']] = sightWardsPlacedPerPlayerPerTimestamp[f]['visionwards'][event['creatorId']] + 1;
                    }
                    if ((event['wardType'] == "YELLOW_TRINKET") || (event['wardType'] == "YELLOW_TRINKET_UPGRADE")) {
                        //yellowtrinket[event['creatorId']] = yellowtrinket[event['creatorId']] + 1;
                        sightWardsPlacedPerPlayerPerTimestamp[f]['yellowtrinket'][event['creatorId']] = sightWardsPlacedPerPlayerPerTimestamp[f]['yellowtrinket'][event['creatorId']] + 1;
                    }
                }
                if (event['eventType'] == "BUILDING_KILL"){
                    if(event['towerType'] == "INNER_TURRET"){}
                    if(event['towerType'] == "NEXUS_TURRET"){}
                    if(event['towerType'] == "OUTER_TURRET"){}
                    if(event['buildingType'] == "INHIBITOR_BUILDING"){}
                }
                if (event['eventType'] == "ELITE_MONSTER_KILL"){
                    if(event['monsterType'] == "BARON_NASHOR"){}
                    if(event['monsterType'] == "DRAGON"){}
                    if(event['monsterType'] == "BLUE_GOLEM"){}
                    if(event['monsterType'] == "RED_LIZARD"){}
                }
            }
            //sightWardsPlacedPerPlayerPerTimestamp[f] = {'sightwards':sightwards, 'visionwards':visionwards, 'yellowtrinket':yellowtrinket};
        }

        /* for each player in match (10 total) */
        for (p = 1; p < 11; p++) {
            var summonerID = stats['participantIdentities'][p - 1]['player']['summonerId'];
            var summonerName = stats['participantIdentities'][p - 1]['player']['summonerName'];
            var participants = stats['participants'][p - 1];
            /* set champion details */
            championIdentification['id'] = participants['championId'];
            championIdentification['name'] = championIdToName[championIdentification['id']];

            timelineLane = participants['timeline']['lane'];
            timelineRole = participants['timeline']['role'];
            if (timelineLane == "BOTTOM") {
                if (timelineRole == "DUO_CARRY") {
                    championIdentification['role'] = "ADC";
                }
                else {
                    championIdentification['role'] = "SUPPORT"
                }
            }
            if (timelineLane == "MIDDLE") {
                championIdentification['role'] = "MIDDLE";
            }
            if (timelineLane == "JUNGLE") {
                championIdentification['role'] = "JUNGLE";
            }
            if (timelineLane == "TOP") {
                championIdentification['role'] = "TOP";
            }


            /* set numerical variables */
            statistics = stats['participants'][p - 1]['stats'];
            championStatistics['assists'] = statistics['assists'];
            championStatistics['kills'] = statistics['kills'];
            championStatistics['deaths'] = statistics['deaths'];
            championStatistics['magicDamageTotal'] = statistics['magicDamageDealt'];
            championStatistics['magicDamageChamp'] = statistics['magicDamageDealtToChampions'];
            championStatistics['magicDamageTaken'] = statistics['magicDamageTaken'];
            championStatistics['physicalDamageTotal'] = statistics['physicalDamageDealt'];
            championStatistics['physicalDamageChamp'] = statistics['physicalDamageDealtToChampions'];
            championStatistics['physicalDamageTaken'] = statistics['physicalDamageTaken'];
            championStatistics['heals'] = statistics['totalHeal'];
            championStatistics['wardsKilled'] = statistics['wardsKilled'];
            championStatistics['wardsPlaced'] = statistics['wardsPlaced'];
            championStatistics['minionsKilledTotal'] = statistics['minionsKilled'];
            championStatistics['enemyJungleMinionsKilled'] = statistics['neutralMinionsKilledEnemyJungle'];


            /* for each timestep */
            frames = stats['timeline']['frames'];
            for (f = 0; f < frames.length; f++) {
                frame = frames[f]['participantFrames'][p];
                oneTimeStamp['minute'] = f;
                oneTimeStamp['jungleMinionsKilled'] = frame['jungleMinionsKilled'];
                oneTimeStamp['minionsKilled'] = frame['minionsKilled'];
                oneTimeStamp['level'] = frame['level'];
                oneTimeStamp['totalGold'] = frame['totalGold'];
                oneTimeStamp['currentGold'] = frame['currentGold'];

                //count up wards placed for current timestamp events
                // NO EVENTs ON f=0

                if (f > 0) {
                    //console.log("yellowtrinket = {")
                    //for(var k=1 ; k<11; k++){
                    //    console.log(k+":"+sightWardsPlacedPerPlayerPerTimestamp[f]['yellowtrinket'][k]);
                    //}
                    //console.log("};");
                    oneTimeStamp['visionWardsPlaced'] = sightWardsPlacedPerPlayerPerTimestamp[f]['visionwards'][p];
                    oneTimeStamp['sightWardsPlaced'] = sightWardsPlacedPerPlayerPerTimestamp[f]['sightwards'][p];
                    oneTimeStamp['yellowTrinketPlaced'] = sightWardsPlacedPerPlayerPerTimestamp[f]['yellowtrinket'][p];
                }
                else {
                    oneTimeStamp['visionWardsPlaced'] = 0;
                    oneTimeStamp['sightWardsPlaced'] = 0;
                    oneTimeStamp['yellowTrinketPlaced'] = 0;
                }

                timeline[f] = {};
                timeline[f]['minute'] = oneTimeStamp['minute'];
                timeline[f]['jungleMinionsKilled'] = oneTimeStamp['jungleMinionsKilled'];
                timeline[f]['minionsKilled'] = oneTimeStamp['minionsKilled'];
                timeline[f]['level'] = oneTimeStamp['level'];
                timeline[f]['totalGold'] = oneTimeStamp['totalGold'];
                timeline[f]['currentGold'] = oneTimeStamp['currentGold'];
                timeline[f]['visionWardsPlaced'] = oneTimeStamp['visionWardsPlaced'];
                timeline[f]['sightWardsPlaced'] = oneTimeStamp['sightWardsPlaced'];
                timeline[f]['yellowTrinketPlaced'] = oneTimeStamp['yellowTrinketPlaced'];
                //console.log(" oneTimeStamp['visionWardsPlaced']= "+ oneTimeStamp['visionWardsPlaced']);
            }


            addChampionStatistics(championIdentification, championStatistics, timeline, summonerID, summonerName);

        }

    }
    catch (e){
        console.log(printERR+"storeStats, "+e);
    }

};



//(2) add stats & players from this match
var storePlayers = function (obj){
    var err = false;
    var playerID, playerName, tier;
    //console.log(obj);

    for(var i=0; i<10; i++){
        playerID = obj['participantIdentities'][i]['player']['summonerId'];
        playerName = obj['participantIdentities'][i]['player']['summonerName'];
        tier = 404;
        err = addSummoner(playerID, playerName, tier);
    }

    return err;
};

//(1) grab match data from api
var queryMatchFromTier = function(currTier){

    try{
        var err = false;
        Match.findOne({tier:currTier, hasBeenQueried:false}, function(err, match){
            if(match == null){
                console.log(printERR+"queryMatchFromTier, match == null.");
                return;
            }

            var api_key = config.api_key;
            var region = "na";
            var host = "https://na.api.pvp.net";

            var matchID = match['id'];

            var matchPath = "/api/lol/"+region+"/v2.2/match/"+matchID+"?includeTimeline=true&api_key=";


            //send API request
            https.get(host + matchPath + api_key, function(response){
                var statusCode = response.statusCode;
                //console.log("received Match History response");
                var output = '';
                response.on("data", function(chunk){
                    output += chunk;
                });
                response.on("end", function(){


                    if(statusCode == 200){
                        //console.log(output);

                            var obj = JSON.parse(output);
                            storeStats(obj);

                            //update db to show we have looked at match
                            match['hasBeenQueried'] = true;
                            match.save();
                            console.log(match['id']+"['hasBeenQueried'] = "+match['hasBeenQueried']);

                    }
                    else if((statusCode==500)||(statusCode==503)) {
                        console.log(printERR + "err: 500, 503, internal server err, or service unavalible.");
                    }
                    else if(statusCode == 429){
                        console.log(printERR + "err: 429, rate limit exceded");
                    }
                    else{
                        console.log(printERR + "err: 400, 401, 404, bad request, setting tier to 42");
                        match['hasBeenQueried'] = true;
                        match.save();
                    }

                });

            });
        });
    }
    catch(e){
        console.log(printERR+" queryMatchFromTier, "+e);
    }
};



var mainLoop = function(){
    var currTier =1;
    populateLocalChampionIdToNameVar();
    var mainLoopInterval = setInterval(function(){
        console.log(printLog+"tier="+currTier);
        queryMatchFromTier(currTier);

        currTier ++;
        if(currTier > 27){
            currTier = 1;
        }
    },6001);

};

mainLoop();

