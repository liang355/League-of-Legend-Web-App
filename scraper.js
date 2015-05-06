/* scraper.js */

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
var printPlayer = " player added--------";
var printMatch  = " match added---------";
var printStats  = " stats added for-----";


//harder for us to read, but easier to loop through

var tierBias = {
    1:1,
    2:1,
    3:5, 4:5, 5:5, 6:5,7:5,
    8:5, 9:5, 10:5, 11:5, 12:5,
    13:5,14:5, 15:5, 16:5, 17:5,
    18:5, 19:5, 20:5,21:5, 22:5,
    23:5, 24:5,25:5, 26:5, 27:5
};

var tiers = { 1:"CHALLENGER_I",
            2:"MASTER_I",
            3:"DIAMOND_I", 4:"DIAMOND_II", 5:"DIAMOND_III", 6:"DIAMOND_IV",7:"DIAMOND_V",
            8:"PLATINUM_I", 9:"PLATINUM_II",10:"PLATINUM_III", 11:"PLATINUM_IV", 12:"PLATINUM_V",
            13:"GOLD_I",14:"GOLD_II", 15:"GOLD_III", 16:"GOLD_IV", 17:"GOLD_V",
            18:"SILVER_I", 19:"SILVER_II", 20:"SILVER_III",21:"SILVER_IV", 22:"SILVER_V",
            23:"BRONZE_I", 24:"BRONZE_II",25:"BRONZE_III", 26:"BRONZE_IV", 27:"BRONZE_V"};



var tierN = {
                CHALLENGER:0,
                MASTER:1,
                DIAMOND:2,
                PLATINUM:7,
                GOLD:12,
                SILVER:17,
                BRONZE:22
            };
var divisionN = {
                    I:1,
                    II:2,
                    III:3,
                    IV:4,
                    V:5
                };

var championIdToName = {};


//hand grabbed these from LoLKings leaderboards
var lolKingSeeds = [{lookup:"turtlethecat", name:"Turtle the Cat", tier:1},{lookup:"westrice",name:"Westrice",tier:2},{lookup:"darkeggs",name:"Dark Eggs",tier:3},
                    {lookup:"kms",name:"KMS",tier:4},{lookup:"entp",name:"ENTP",tier:5},{lookup:"yowei",name:"YoWei",tier:6},
                    {lookup:"tera",name:"Tera",tier:7},{lookup:"wisher",name:"Wisher",tier:8},{lookup:"mrlolguy",name:"MrLoLGuy",tier:9},
                    {lookup:"pinkoreos",name:"pinkoreos",tier:10},{lookup:"lovemmm",name:"LoveMmm",tier:11},{lookup:"fellini",name:"Fellini",tier:12},
                    {lookup:"agari",name:"AGARI",tier:13},{lookup:"malagbo",name:"Malagbo",tier:14},{lookup:"chessgenius",name:"Chessgenius",tier:15},
                    {lookup:"frankenberry",name:"Frankenberry",tier:16},{lookup:"fourward",name:"Fourward",tier:17},{lookup:"tickelly",name:"Tickelly",tier:18},
                    {lookup:"blackthorn95",name:"BlackThorn95",tier:19},{lookup:"rainicorn",name:"rainicorn",tier:20},{lookup:"supergodlike",name:"superGODLIKE",tier:21},
                    {lookup:"waterbendr", name:"Waterbendr",tier:22},{lookup:"malaxeur",name:"Malaxeur",tier:23},{lookup:"lorindia",name:"Lorindia",tier:24},
                    {lookup:"paddleburger",name:"PaddleBurger",tier:25},{lookup:"kevinco",name:"kevinco",tier:26},{lookup:"minionslayer",name:"MinionSlayer",tier:27}];





/* =====================================
 * some useful db access functions
 * =====================================*/



/*=====================================
 * Utility Functions: Summoner
 *===================================== */

var displaySummonersFromDatabase = function () {
    console.log("displaying summoners from db");
    Summoner.find(function(err, summoners){
        if(err){
            console.log(err);
        }
        console.log(summoners);
    });
};

//add summoner to DB
var addSummoner = function(summonerID, summonerName, tier){
    var err = false;
    //is summoner already in DB? null is returned for summoner if not
    Summoner.findOne({'name':summonerName}, function(error, summoner) {
        //console.log(summoner);
        //we have not seen this summoner before
        if(summoner == null){
            console.log("added "+summonerName+" to db.");
            Summoner.create({name:summonerName, sID:summonerID, tier:tier, lastQueried:null});
        }
        // this should catch all duplicates
        else{
            console.log(printLog+summonerName+" was already in db.");
            /* the following should be added at some point,
             * and will catch players who switch tiers
             * Problems are with updating the item, the below
             * example does not work :c
             */
            /*if(summoner['tier'] != tier){
                console.log("they have changed tiers, updating "+summonerName+" from tier("+summoner['tier']+"): "+tiers[summoner['tier']-1]['name']+" to "+tiers[tier-1]['name']);
                var objid = summoner['_id'];
                Summoner.update(
                    { _id:objid },
                    { $set: { tier: tier } }
                );
                console.log("new tier set to: "+summoner['tier']);
            }*/
        }
        if (error) {
            console.log(next(error));
            err = true;
        }
        return err;
    });
};



var howMany404Players = function(callback){
    Summoner.find({tier:404}, function(err, summoners) {
        callback(summoners.length);
    });
};

var resolveUnknownPlayerTiers = function(numplayers404){
    var err = false;
    Summoner.find({tier:404}, function(err, summoners) {
        //console.log(summoners.length);
        if(summoners == null){
            console.log("summoners == null :c");
            return;
        }
        var summonerID;
        if(summoners.length >= numplayers404){
            summonerID = summoners[numplayers404-1]['sID'];
        }
        else{
            console.log("summoners.length"+summoners.length+" < numplayers404"+numplayers404);
            return;
        }

        var api_key = config.api_key;
        var region = "na";
        var host = "https://na.api.pvp.net";
        var matchPath = "/api/lol/"+region+"/v2.5/league/by-summoner/"+summonerID+"?api_key=";

        //send API request
        https.get(host + matchPath + api_key, function(response){
            var statusCode = response.statusCode;
            var output = '';
            response.on("data", function(chunk){
                output += chunk;

                //console.log(output);
            });
            response.on("end", function(){
                if(statusCode != 200){
                    console.log(printERR+" resolveUnknownPlayerTiers, statusCode:"+statusCode);
                    summoners[numplayers404-1]['tier'] = 42;
                    summoners[numplayers404-1].save();
                    return;
                }
                if(output == ""){
                    console.log(printERR+"output == ''");
                    summoners[numplayers404-1]['tier'] = 42;
                    summoners[numplayers404-1].save();
                    return;
                }
                var obj = JSON.parse(output);
                var tier = obj[summonerID][0]['tier'];
                var division = obj[summonerID][0]['entries'][0]['division'];
                var numeric = tierN[tier] + divisionN[division];
                console.log(printLog+summonerID+" "+tier+"_"+division);
                //update db
                summoners[numplayers404-1]['tier'] = numeric;
                summoners[numplayers404-1].save();

            });

        });
    });
};



/*==============================
 *  add summoners from lolking:
 *============================== */

/*---DO NOT RUN THIS, IT POPULATES THE SUMMONER DATABASE WITH SEEDS, I DON'T WANT DUPLICATES ---*/
//var addLoLKingSeeds = function(summonerData){
//    //construct API request
//    var api_key = config.api_key;
//    var region = "na";
//    var host = "https://na.api.pvp.net";
//    var matchPath;
//    var count = 0;
//    var max = summonerData.length;
//
//    //loop through summoners, look up ID's wait 2seconds and add to DB
//
//    var lolkingseedInterval = setInterval(function () {
//            var summonerName = summonerData[count]['name'];
//            var summonerLookup = summonerData[count]['lookup'];
//            var summonerTier = summonerData[count]['tier'];
//            matchPath = "/api/lol/" + region + "/v1.4/summoner/by-name/" + summonerName + "?api_key=";
//            console.log("started request for summonerID of " + summonerName);
//
//            //send API request to retreive summonerID
//            https.get(host + matchPath + api_key, function (response) {
//                console.log("received Match History response");
//                var status = response.statusCode;
//                var output = '';
//                response.on("data", function (chunk) {
//                    output += chunk;
//                });
//                response.on("end", function () {
//
//                    if(status == 200){
//                        var obj = JSON.parse(output);
//                        console.log("obj=" + obj[summonerLookup]['id'] + ", name=" + obj[summonerLookup]['name']);
//                        addSummoner(obj[summonerLookup]['id'], summonerName, summonerTier); //DONT ADD THEM AGAIN
//                    }
//                    else{
//                        console.log(printERR+" queryForRecentMatches, statusCode = "+statusCode);
//                    }
//                });
//            });
//            count++;
//            if (count >= max) {
//                clearInterval(lolkingseedInterval);
//            }
//    }, 2000);
//};
//
//addLoLKingSeeds(lolKingSeeds);

/*===================================
 *  find recent matches by summonerID
 *===================================*/

var currTier = 1;

var findOneAdd = function (matchID, mapID, queueType, tier){
    Match.findOne({'id':matchID}, function(err, match){
        if(match == null){
            console.log("match added, mapID:"+mapID+", queueType:",queueType);
            console.log(printLog+printMatch+matchID+", "+tier);
            Match.create({id:matchID, tier:tier, hasBeenQueried:false});
        }
        else{
            console.log("match not added, already in DB");
        }
    });
};

// (3) parse matches and store ones that are not already in DB
var addMatchesToDB = function(matches, tier){
    var err = false;
    //var matchID;

    try{

        for(var i=0; i<matches['matches'].length; i++){
           // console.log(matches['matches'].length);
            //console.log(matches['matches'][i]);


            var matchID = matches['matches'][i]['matchId'];
            var mapID = matches['matches'][i]['mapId'];
            var queueType = matches['matches'][i]['queueType'];
            if(( mapID == 11) && (queueType == "RANKED_SOLO_5x5")){
                findOneAdd(matchID, mapID, queueType, tier);
            }
            else{
                console.log("match not added, mapID:"+mapID+", queueType:",queueType);
            }
        }
    }
    catch(e){
        err = true;
        console.log(printERR+" addMatchesToDB, "+e);
    }
    return err;
};

// (2) make request to API for recent matches
var queryForRecentMatches = function(summonerID, tier){
    var err = false;
    //construct API request
    var api_key = config.api_key;
    var region = "na";
    var host = "https://na.api.pvp.net";
    console.log("summonerID = "+summonerID);

    if(summonerID == 0){
        console.log("error with nextSummoner(), returned 0");
        err = true;
        return err;
    }

    var matchPath = "/api/lol/"+region+"/v2.2/matchhistory/"+summonerID+"?api_key=";

    //send API request
    https.get(host + matchPath + api_key, function(response){
        var statusCode = response.statusCode;
        var output = '';
        response.on("data", function(chunk){
            output += chunk;
        });
        response.on("end", function(){
            if(statusCode == 200){
                var obj = JSON.parse(output);
                err = addMatchesToDB(obj, tier);
            }
            else{
                console.log(printERR+" queryForRecentMatches, statusCode = "+statusCode);
            }
        });

    });

    return err;
};

// (1) find next player based on currTier
var findRecentMatches = function(tier, nummatchhistorys){
    var err = false;
    var summonerID = 0;
    try{
        //look up next summoners by tier from DB
        Summoner.find({'tier':tier, 'lastQueried':null}, function(error, summonerlist) {
            //console.log(summonerlist);
            if(summonerlist == null){
                console.log("null returned for tier query");
                return;
            }

            if(summonerlist.length >= nummatchhistorys){
                summonerID = summonerlist[nummatchhistorys -1]['sID'];
            }
            else{
                console.log("summonerlist.length"+summonerlist.length+" < nummatchhistorys"+nummatchhistorys);
                return;
            }

            //console.log(summonerID);


            var d = new Date();
            var n = d.getTime();
            summonerlist[nummatchhistorys-1]['lastQueried'] = n;
            summonerlist[nummatchhistorys-1].save();
            var currTier = summonerlist[nummatchhistorys-1]['tier'];

            err = queryForRecentMatches(summonerID, currTier);

            if (error) {
                console.log(next(error));
                err = true;
            }
        });
    }
    catch(e){
        console.log(printERR+" find recent matches, e="+e);
    }


    return err;
};


var howManyMatchHistorys = function(tier, callback){
    Summoner.find({'tier':tier, 'lastQueried':null}, function(error, summonerlist) {
        callback(summonerlist.length);
    });
};

/*===================================
 *  add champions for refrence
 *===================================*/

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
    Champion.find(function(err, champions){
        if (err){
            console.log(err);
        }

        for(var i=0; i<champions.length; i++){
            var id = champions[i]['id'];
            var name = champions[i]['name'];
            championIdToName[id] = name;
        }
    });
};


/* ===================================
 *   Query matches from a tier
 *   add stats from these matches
 *   add players from these matches
 * =================================== */



var howManyMatches = function(currTier, callback){
    Match.find({tier:currTier, hasBeenQueried:false}, function(err, matches){
        callback(matches.length);
    });
};

var addChampionStatistics = function(championIdentification, championStatistics, thetimeline, tier){
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
        ChampionStatistics.findOne({'id':id, 'role':role, 'tier':tier}, function(err, champStats){
            /* does not exist yet */
           // if(champStats == null) {
                console.log(printLog + "adding stats for: " + name + ", " + role);
                var champStatistics = new ChampionStatistics();


                champStatistics.id = id;
                champStatistics.name = name;
                champStatistics.role = role;
                champStatistics.tier = tier;
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

                //champStatistics.rawData.push({
                //    assists: assists,
                //    kills: kills,
                //    deaths: deaths,
                //    magicDamageTotal: magicDamageTotal,
                //    magicDamageChamp: magicDamageChamp,
                //    magicDamageTaken: magicDamageTaken,
                //    physicalDamageTotal:physicalDamageTotal,
                //    physicalDamageChamp: physicalDamageChamp,
                //    physicalDamageTaken: physicalDamageTaken,
                //    heals: heals,
                //    wardsKilled: wardsKilled,
                //    wardsPlaced: wardsPlaced,
                //    minionsKilled: minionsKilledTotal,
                //    enemyJungleMinionsKilled: enemyJungleMinionsKilled,
                //    timeline: timeline
                //
                //});

               // console.log(champStatistics);
                champStatistics.save();


            //}
            ///* already exsists */
            //else{
            //    console.log(printLog + "adding more data for: " + name + ", " + role);
            //
            //    champStats['rawData'].push({
            //                                        assists: assists,
            //                                        kills: kills,
            //                                        deaths: deaths,
            //                                        magicDamageTotal: magicDamageTotal,
            //                                        magicDamageChamp: magicDamageChamp,
            //                                        magicDamageTaken: magicDamageTaken,
            //                                        physicalDamageTotal:physicalDamageTotal,
            //                                        physicalDamageChamp: physicalDamageChamp,
            //                                        physicalDamageTaken: physicalDamageTaken,
            //                                        heals: heals,
            //                                        wardsKilled: wardsKilled,
            //                                        wardsPlaced: wardsPlaced,
            //                                        minionsKilled: minionsKilledTotal,
            //                                        enemyJungleMinionsKilled: enemyJungleMinionsKilled,
            //
            //                                        timeline: timeline
            //                                    });
            //    champStats['numberOfGames'] = champStats['numberOfGames'] + 1;
            //    champStats.save();
            //}
        });
    }
    catch(e){
        console.log(printERR+" addChampionStatistics, "+e);
        err = true;
    }
    return err;

};

//(3) add stats to DB
var storeStats = function(stats, tier) {

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
            }
            //sightWardsPlacedPerPlayerPerTimestamp[f] = {'sightwards':sightwards, 'visionwards':visionwards, 'yellowtrinket':yellowtrinket};
        }
        //for( i=1; i<11; i++){
        //    sightwards[i] = 0;
        //    visionwards[i] = 0;
        //    yellowtrinket[i] = 0;
        //}

        /* for each player in match (10 total) */
        for (p = 1; p < 11; p++) {
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


            err = addChampionStatistics(championIdentification, championStatistics, timeline, tier);

        }


        // is champion/role stats already in db?
        //yes - grab that data
        //add the other data
        //increment number of games
        //no - add new entry with # of games = 1


        /* add the following to stats
         id:String,
         name:String,
         role:String,
         tier:Number,
         numberOfGames:Number,


         assists:Number,
         kills:Number,
         deaths:Number,
         magicDamageTotal:Number,
         magicDamageChamp:Number,
         magicDamageTaken:Number,
         physicalDamageTotal:Number,
         physicalDamageChamp:Number,
         physicalDamageTaken:Number,
         heals:Number,
         damageTaken:Number,
         wardsKilled:Number,
         wardsPlaced:Number,
         enemyJungleMinionsKilled:Number,

         timeline: [{
         minute:Number,
         visionWardsPlaced:Number,
         sightWardsPlaced:Number,
         jungleMinionsKilled:Number,
         minionsKilled:Number,
         level:Number,
         totalGold:Number,
         currentGold:Number
         }]
         * */
    }
    catch(e){
        console.log(printERR+"storeStats, catch(e)="+e);
        return;
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
var queryMatchFromTier = function(currTier, numMatches){
    var err = false;
    try {
        Match.find({tier:currTier, hasBeenQueried:false}, function(err, matches){
            var api_key = config.api_key;
            var region = "na";
            var host = "https://na.api.pvp.net";
            if(matches.length >= numMatches){
                var matchID = matches[numMatches-1]['id'];
            }
            else{
                console.log("matches.length"+matches.length+" < numMatches"+numMatches);
                return;
            }

            var matchPath = "/api/lol/"+region+"/v2.2/match/"+matchID+"?includeTimeline=true&api_key=";

            //update db to show we have looked at match
            matches[matches.length-1]['hasBeenQueried'] = true;
            matches[matches.length-1].save();
            console.log(matches[matches.length-1]['id']+"['hasBeenQueried'] = "+matches[matches.length-1]['hasBeenQueried']);

            //send API request
            https.get(host + matchPath + api_key, function(response){
                var statusCode = response.statusCode;
                console.log(response.statusCode == 200);
                //console.log("received Match History response");
                var output = '';
                response.on("data", function(chunk){
                    output += chunk;
                });
                response.on("end", function(){
                    if(statusCode == 200){
                        //console.log(output);
                        var obj = JSON.parse(output);
                        err = storePlayers(obj);
                        if(err){return err;}
                        err = storeStats(obj, currTier);
                        return err;
                    }
                    else{
                        console.log(printERR+" queryMatchFromTier, statusCode:"+statusCode);
                    }

                });

            });
        });
    }
    catch(e){
        console.log(printERR+"queryMatchFromTier, "+e);
        err = true;
    }
    return err;
};

/* ====================================================================
 * Main loop:
 *      currTier: loops through tiers
 *
 *      (1) grab recent matches from next player
 *              - add matches to queue
 *      (2) look all matches for that tier
 *              - add players to queue
 *              - keep track of statistics for tier/champion/lane
*       (3) when tier = 28 look up player tiers that are currently listed as 404 (unknown)
 *
 *=====================================================================*/

var mainLoop = function(){
    var currTier =11;
    var err = false;
    var nummatches = 0;
    var numplayers404 = 0;
    var nummatchhistorys = 0;

    var matchesToLookAt = false;
    var players404ToLookAt = false;
    var matchHistoryToLookAt = false;

    var turn = 0;
    var currTierBiasCount = 1;



    populateLocalChampionIdToNameVar();

    var mainLoopInterval = setInterval(function(){

        //
        if(!matchesToLookAt && !players404ToLookAt && !matchHistoryToLookAt){
            turn = 0;
        }

        if(turn == 0){
            //currTierBiasCount --;
            //if(currTierBiasCount <= 0){
                currTier ++;
                if(currTier > 27){
                    currTier = 1;
                }
            if((currTier<8)&&(currTier>2)){
                currTier = 9;
            }
                //currTierBiasCount = tierBias[currTier];
           // }

            console.log(printLog+"tier:"+currTier);

            howManyMatches(currTier, function(numMatches){
                console.log("tier "+currTier+" numMatches:"+numMatches);
                if(numMatches>0){
                    //if(numMatches>100){
                    //    numMatches = 100;
                    //}
                    nummatches = numMatches;
                    matchesToLookAt = true;
                }
            });
            howMany404Players(function(num404){
                console.log("tier "+currTier+" num404:"+num404);
                if(num404>0){
                    //if(num404>100){
                    //    num404 = 100;
                    //}
                    numplayers404 = num404;
                    players404ToLookAt = true;
                }
            });
            howManyMatchHistorys(currTier, function(numMH){
                console.log("tier "+currTier+" numMH:"+numMH);
                if(numMH>0){
                    //if(numMH>100){
                    //    numMH = 100;
                    //}
                    nummatchhistorys = numMH;
                    matchHistoryToLookAt = true;
                }
            });
            turn = 1;
        }

        if(matchesToLookAt){
            console.log("there are "+nummatches+" matches to look at");
            queryMatchFromTier(currTier,nummatches);
            nummatches = nummatches-1;
            if(nummatches<=0){
                matchesToLookAt = false;
            }
            return;
        }

        if(players404ToLookAt){
            console.log("there are "+numplayers404+" players to look at");
            resolveUnknownPlayerTiers(numplayers404);
            numplayers404 = numplayers404-1;
            if(numplayers404<=0){
                players404ToLookAt = false;
            }
            return;
        }


        if(matchHistoryToLookAt){
            console.log("there are "+nummatchhistorys+" match histories to look at");
            findRecentMatches(currTier, nummatchhistorys);
            nummatchhistorys = nummatchhistorys-1;
            if(nummatchhistorys<=0){
                matchHistoryToLookAt = false;
            }
            return;
        }


        if(err){
            clearInterval(mainLoopInterval);
            console.log("Scraper Terminated: there was an error.");
        }
    },2001);

};

//mainLoop();


//ChampionStatistics.find({ }, function(err, champStats){
//    if(err){
//        console.log(err);
//       // return;
//    }
//
//    for(var i=0; i<200; i++){
//        ChampionStatistics.remove({_id:champStats[i]["_id"]}, function(err, numbRem){
//            console.log("numbRem = "+numbRem);
//        });
//    }
//    console.log("done");
//});
/*
Summoner.find({tier:404}, function(err, summoners){
	console.log("unknown summoners "+summoners.length);
});
*/

var printSummoners = function(){

	Summoner.find({tier:1},function(err,summoners){
		console.log("1, "+summoners.length)
	});

	Summoner.find({tier:2},function(err,summoners){
		console.log("2, "+summoners.length)
	});

	Summoner.find({tier:3},function(err,summoners){
		console.log("3, "+summoners.length)
	});

	Summoner.find({tier:4},function(err,summoners){
		console.log("4, "+summoners.length)
	});

	Summoner.find({tier:5},function(err,summoners){
		console.log("5, "+summoners.length)
	});

	Summoner.find({tier:6},function(err,summoners){
		console.log("6, "+summoners.length)
	});

	Summoner.find({tier:7},function(err,summoners){
		console.log("7, "+summoners.length)
	});

	Summoner.find({tier:8},function(err,summoners){
		console.log("8, "+summoners.length)
	});

	Summoner.find({tier:9},function(err,summoners){
		console.log("9, "+summoners.length)
	});

	Summoner.find({tier:10},function(err,summoners){
		console.log("10, "+summoners.length)
	});

	Summoner.find({tier:11},function(err,summoners){
		console.log("11, "+summoners.length)
	});

	Summoner.find({tier:12},function(err,summoners){
		console.log("12, "+summoners.length)
	});
	Summoner.find({tier:13},function(err,summoners){
		console.log("13, "+summoners.length)
	});
	Summoner.find({tier:14},function(err,summoners){
		console.log("14, "+summoners.length)
	});
	Summoner.find({tier:15},function(err,summoners){
		console.log("15, "+summoners.length)
	});
	Summoner.find({tier:16},function(err,summoners){
		console.log("16, "+summoners.length)
	});
	Summoner.find({tier:17},function(err,summoners){
		console.log("17, "+summoners.length)
	});
	Summoner.find({tier:18},function(err,summoners){
		console.log("18, "+summoners.length)
	});
	Summoner.find({tier:19},function(err,summoners){
		console.log("19, "+summoners.length)
	});
	Summoner.find({tier:20},function(err,summoners){
		console.log("20, "+summoners.length)
	});
	Summoner.find({tier:21},function(err,summoners){
		console.log("21, "+summoners.length)
	});
	Summoner.find({tier:22},function(err,summoners){
		console.log("22, "+summoners.length)
	});
	Summoner.find({tier:23},function(err,summoners){
		console.log("23, "+summoners.length)
	});
	Summoner.find({tier:24},function(err,summoners){
		console.log("24, "+summoners.length)
	});
	Summoner.find({tier:25},function(err,summoners){
		console.log("25, "+summoners.length)
	});
	Summoner.find({tier:26},function(err,summoners){
		console.log("26, "+summoners.length)
	});
	Summoner.find({tier:27},function(err,summoners){
		console.log("27, "+summoners.length)
	});
}

var printMatches = function(){
	Match.find({tier:1, hasBeenQueried:false},function(err,summoners){
		console.log("match 1, "+summoners.length)
	});

	Match.find({tier:2, hasBeenQueried:false},function(err,summoners){
		console.log("match 2, "+summoners.length)
	});

	Match.find({tier:3, hasBeenQueried:false},function(err,summoners){
		console.log("match 3, "+summoners.length)
	});

	Match.find({tier:4, hasBeenQueried:false},function(err,summoners){
		console.log("match 4, "+summoners.length)
	});

	Match.find({tier:5, hasBeenQueried:false},function(err,summoners){
		console.log("match 5, "+summoners.length)
	});

	Match.find({tier:6, hasBeenQueried:false},function(err,summoners){
		console.log("match 6, "+summoners.length)
	});

	Match.find({tier:7, hasBeenQueried:false},function(err,summoners){
		console.log("match 7, "+summoners.length)
	});

	Match.find({tier:8, hasBeenQueried:false},function(err,summoners){
		console.log("match 8, "+summoners.length)
	});

	Match.find({tier:9, hasBeenQueried:false},function(err,summoners){
		console.log("match 9, "+summoners.length)
	});

	Match.find({tier:10, hasBeenQueried:false},function(err,summoners){
		console.log("match 10, "+summoners.length)
	});

	Match.find({tier:11, hasBeenQueried:false},function(err,summoners){
		console.log("match 11, "+summoners.length)
	});

	Match.find({tier:12, hasBeenQueried:false},function(err,summoners){
		console.log("match 12, "+summoners.length)
	});
	Match.find({tier:13, hasBeenQueried:false},function(err,summoners){
		console.log("match 13, "+summoners.length)
	});
	Match.find({tier:14, hasBeenQueried:false},function(err,summoners){
		console.log("match 14, "+summoners.length)
	});
	Match.find({tier:15, hasBeenQueried:false},function(err,summoners){
		console.log("match 15, "+summoners.length)
	});
	Match.find({tier:16, hasBeenQueried:false},function(err,summoners){
		console.log("match 16, "+summoners.length)
	});
	Match.find({tier:17, hasBeenQueried:false},function(err,summoners){
		console.log("match 17, "+summoners.length)
	});
	Match.find({tier:18, hasBeenQueried:false},function(err,summoners){
		console.log("match 18, "+summoners.length)
	});
	Match.find({tier:19, hasBeenQueried:false},function(err,summoners){
		console.log("match 19, "+summoners.length)
	});
	Match.find({tier:20, hasBeenQueried:false},function(err,summoners){
		console.log("match 20, "+summoners.length)
	});
	Match.find({tier:21, hasBeenQueried:false},function(err,summoners){
		console.log("match 21, "+summoners.length)
	});
	Match.find({tier:22, hasBeenQueried:false},function(err,summoners){
		console.log("match 22, "+summoners.length)
	});
	Match.find({tier:23, hasBeenQueried:false},function(err,summoners){
		console.log("match 23, "+summoners.length)
	});
	Match.find({tier:24, hasBeenQueried:false},function(err,summoners){
		console.log("match 24, "+summoners.length)
	});
	Match.find({tier:25, hasBeenQueried:false},function(err,summoners){
		console.log("match 25, "+summoners.length)
	});
	Match.find({tier:26, hasBeenQueried:false},function(err,summoners){
		console.log("match 26, "+summoners.length)
	});
	Match.find({tier:27, hasBeenQueried:false},function(err,summoners){
		console.log("match 27, "+summoners.length)
	});
}

var printChampionStatistics = function(){
	ChampionStatistics.find({tier:1},function(err,summoners){
		console.log("championstatistics 1, "+summoners.length)
	});

	ChampionStatistics.find({tier:2},function(err,summoners){
		console.log("championstatistics 2, "+summoners.length)
	});

	ChampionStatistics.find({tier:3},function(err,summoners){
		console.log("championstatistics 3, "+summoners.length)
	});

	ChampionStatistics.find({tier:4},function(err,summoners){
		console.log("championstatistics 4, "+summoners.length)
	});

	ChampionStatistics.find({tier:5},function(err,summoners){
		console.log("championstatistics 5, "+summoners.length)
	});

	ChampionStatistics.find({tier:6},function(err,summoners){
		console.log("championstatistics 6, "+summoners.length)
	});

	ChampionStatistics.find({tier:7},function(err,summoners){
		console.log("championstatistics 7, "+summoners.length)
	});

	ChampionStatistics.find({tier:8},function(err,summoners){
		console.log("championstatistics 8, "+summoners.length)
	});

	ChampionStatistics.find({tier:9},function(err,summoners){
		console.log("championstatistics 9, "+summoners.length)
	});

	ChampionStatistics.find({tier:10},function(err,summoners){
		console.log("championstatistics 10, "+summoners.length)
	});

	ChampionStatistics.find({tier:11},function(err,summoners){
		console.log("championstatistics 11, "+summoners.length)
	});

	ChampionStatistics.find({tier:12},function(err,summoners){
		console.log("championstatistics 12, "+summoners.length)
	});
	ChampionStatistics.find({tier:13},function(err,summoners){
		console.log("championstatistics 13, "+summoners.length)
	});
	ChampionStatistics.find({tier:14},function(err,summoners){
		console.log("championstatistics 14, "+summoners.length)
	});
	ChampionStatistics.find({tier:15},function(err,summoners){
		console.log("championstatistics 15, "+summoners.length)
	});
	ChampionStatistics.find({tier:16},function(err,summoners){
		console.log("championstatistics 16, "+summoners.length)
	});
	ChampionStatistics.find({tier:17},function(err,summoners){
		console.log("championstatistics 17, "+summoners.length)
	});
	ChampionStatistics.find({tier:18},function(err,summoners){
		console.log("championstatistics 18, "+summoners.length)
	});
	ChampionStatistics.find({tier:19},function(err,summoners){
		console.log("championstatistics 19, "+summoners.length)
	});
	ChampionStatistics.find({tier:20},function(err,summoners){
		console.log("championstatistics 20, "+summoners.length)
	});
	ChampionStatistics.find({tier:21},function(err,summoners){
		console.log("championstatistics 21, "+summoners.length)
	});
	ChampionStatistics.find({tier:22},function(err,summoners){
		console.log("championstatistics 22, "+summoners.length)
	});
	ChampionStatistics.find({tier:23},function(err,summoners){
		console.log("championstatistics 23, "+summoners.length)
	});
	ChampionStatistics.find({tier:24},function(err,summoners){
		console.log("championstatistics 24, "+summoners.length)
	});
	ChampionStatistics.find({tier:25},function(err,summoners){
		console.log("championstatistics 25, "+summoners.length)
	});
	ChampionStatistics.find({tier:26},function(err,summoners){
		console.log("championstatistics 26, "+summoners.length)
	});
	ChampionStatistics.find({tier:27},function(err,summoners){
		console.log("championstatistics 27, "+summoners.length)
	});
}

/*
var tryToAddSummoner = function(name, id){
	Summoner.findOne({sID:id}, function(err, summoner){
		if(summoner == null){
			Summoner.create({'sID':id, 'name':name,  'tier':2}, function (err){
				if(err){
					console.log(err);
				}
			});
			console.log('added '+name+', '+id);
		}
			//console.log('did not add '+name+', '+id);
	});
};


Summoner.find({tier:2}, function(err, summoner){
	var s=0;
	
	var mainLoopInterval = setInterval(function(){
	
		var summonerID = summoner[s]['sID'];
		var api_key = config.api_key;
		var region = "na";
		var host = "https://na.api.pvp.net";
		var matchPath = "/api/lol/" + region + "/v2.5/league/by-summoner/" + summonerID + "?api_key=";
		//send API request
		https.get(host + matchPath + api_key, function (response) {
			
			var statusCode = response.statusCode;
			var output = '';
			response.on("data", function (chunk) {
				output += chunk;

				//console.log(output);
			});
			response.on("end", function () {
				if (statusCode == 200) {
					var obj = JSON.parse(output);
					var n = 0;
					
					for(n=0; n<obj[summonerID].length; n++){
						if(obj[summonerID][n]['queue'] == "RANKED_SOLO_5x5"){
							for(var p=0; p<obj[summonerID][n]['entries'].length; p++){
								var toAdd = obj[summonerID][n]['entries'][p];
								tryToAddSummoner(toAdd['playerOrTeamName'],toAdd['playerOrTeamId']);
							}
						}
					}
					
				}
				else if ((statusCode == 500) || (statusCode == 503)) {
					console.log(printERR + "err: 500, 503, internal server err, or service unavalible.");
				}
				else if (statusCode == 429) {
					console.log(printERR + "err: 429, rate limit exceded");
				}
				else {
					console.log(printERR + "err: 400, 401, 404, bad request, setting tier to 42");
				}

			});
		

		});
	
		s ++;
		if(s > summoner.length){
			console.log("break this");
		}
	},2001);
});
*/

/*
Summoner.find({tier:5}, function(err, summoners){
	for(var s=0; s<summoners.length; s++){
		summoners[s]['lastQueried'] = null;
		summoners[s].save();
	}
	console.log("done");
});
*/

Summoner.find({tier:404}, function(err, summoners){
	console.log("unknown summoners: "+summoners.length);
});


