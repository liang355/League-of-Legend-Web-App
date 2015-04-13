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
        var summonerID = summoners[numplayers404-1]['sID'];

        var api_key = config.api_key;
        var region = "na";
        var host = "https://na.api.pvp.net";
        var matchPath = "/api/lol/"+region+"/v2.5/league/by-summoner/"+summonerID+"?api_key=";

        //send API request
        https.get(host + matchPath + api_key, function(response){
            var output = '';
            response.on("data", function(chunk){
                output += chunk;
            });
            response.on("end", function(){
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
//    var lolkingseedInterval = setInterval(function(){
//        var summonerName = summonerData[count]['name'];
//        var summonerLookup = summonerData[count]['lookup'];
//        var summonerTier = summonerData[count]['tier'];
//        matchPath = "/api/lol/"+region+"/v1.4/summoner/by-name/"+summonerName+"?api_key=";
//
//        console.log("started request for summonerID of "+summonerName);
//
//        //send API request to retreive summonerID
//        https.get(host + matchPath + api_key, function(response){
//            console.log("received Match History response");
//            var output = '';
//            response.on("data", function(chunk){
//                output += chunk;
//            });
//            response.on("end", function(){
//                var obj = JSON.parse(output);
//                console.log("obj="+obj[summonerLookup]['id']+", name="+obj[summonerLookup]['name']);
//                addSummoner(obj[summonerLookup]['id'], summonerName, summonerTier); //DONT ADD THEM AGAIN
//            });
//        });
//        count++;
//        if(count >= max){
//            clearInterval(lolkingseedInterval);
//        }
//    },2000);
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
        console.log("received Match History response");
        var output = '';
        response.on("data", function(chunk){
            output += chunk;
        });
        response.on("end", function(){
            //console.log(output);
            var obj = JSON.parse(output);
            err = addMatchesToDB(obj, tier);
           //console.log(output);
        });

    });

    return err;
};

// (1) find next player based on currTier
var findRecentMatches = function(tier, nummatchhistorys){
    var err = false;
    var summonerID = 0;
    //look up next summoners by tier from DB
    Summoner.find({'tier':tier, 'lastQueried':null}, function(error, summonerlist) {
        //console.log(summonerlist);
        if(summonerlist == null){
            console.log("null returned for tier query");
            return;
        }
        summonerID = summonerlist[nummatchhistorys-1]['sID'];
        //console.log(summonerID);


        var d = new Date();
        var n = d.getTime();
        summonerlist[nummatchhistorys-1]['lastQueried'] = n;
        summonerlist[nummatchhistorys-1].save();

        err = queryForRecentMatches(summonerID, tier);

        if (error) {
            console.log(next(error));
            err = true;
        }
    });

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
        console.log("making request");
        var output = '';
        response.on("data", function (chunk) {
            output += chunk;
        });
        response.on('end', function () {
            var obj = JSON.parse(output);
            addChampions(obj.data);
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
            if(champStats == null) {
                console.log(printLog + "adding stats for: " + name + ", " + role);
                var champStatistics = new ChampionStatistics();


                champStatistics.id = id;
                champStatistics.name = name;
                champStatistics.role = role;
                champStatistics.tier = tier;
                champStatistics.numberOfGames = 1;

                champStatistics.rawData.push({
                    assists: assists,
                    kills: kills,
                    deaths: deaths,
                    magicDamageTotal: magicDamageTotal,
                    magicDamageChamp: magicDamageChamp,
                    magicDamageTaken: magicDamageTaken,
                    physicalDamageTotal:physicalDamageTotal,
                    physicalDamageChamp: physicalDamageChamp,
                    physicalDamageTaken: physicalDamageTaken,
                    heals: heals,
                    wardsKilled: wardsKilled,
                    wardsPlaced: wardsPlaced,
                    minionsKilled: minionsKilledTotal,
                    enemyJungleMinionsKilled: enemyJungleMinionsKilled,
                    timeline: timeline

                });

               // console.log(champStatistics);
                champStatistics.save();


            }
            /* already exsists */
            else{
                console.log(printLog + "adding more data for: " + name + ", " + role);

                champStats['rawData'].push({
                                                    assists: assists,
                                                    kills: kills,
                                                    deaths: deaths,
                                                    magicDamageTotal: magicDamageTotal,
                                                    magicDamageChamp: magicDamageChamp,
                                                    magicDamageTaken: magicDamageTaken,
                                                    physicalDamageTotal:physicalDamageTotal,
                                                    physicalDamageChamp: physicalDamageChamp,
                                                    physicalDamageTaken: physicalDamageTaken,
                                                    heals: heals,
                                                    wardsKilled: wardsKilled,
                                                    wardsPlaced: wardsPlaced,
                                                    minionsKilled: minionsKilledTotal,
                                                    enemyJungleMinionsKilled: enemyJungleMinionsKilled,

                                                    timeline: timeline
                                                });
                champStats['numberOfGames'] = champStats['numberOfGames'] + 1;
                champStats.save();
            }
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
    var championIdentification = {
        'id':0,
        'name':"",
        'role':""
    };

    var championStatistics = {
        'assists':0,
        'kills':0,
        'deaths':0,
        'magicDamageTotal':0,
        'magicDamageChamp':0,
        'magicDamageTaken':0,
        'physicalDamageTotal':0,
        'physicalDamageChamp':0,
        'physicalDamageTaken':0,
        'heals':0,
        'wardsKilled':0,
        'wardsPlaced':0,
        'minionsKilledTotal':0,
        'enemyJungleMinionsKilled':0
    };

    var timeline = [];

    var oneTimeStamp = {
        'minute':0,
        'visionWardsPlaced':0,
        'sightWardsPlaced':0,
        'yellowTrinketPlaced':0,
        'jungleMinionsKilled':0,
        'minionsKilled':0,
        'level':0,
        'totalGold':0,
        'currentGold':0
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
    for( f=1; f<frames.length; f++){
        for( i=1; i<11; i++){
            sightwards[i] = 0;
            visionwards[i] = 0;
            yellowtrinket[i] = 0;
        }
        events = frames[f]['events'];
        for( e=0; e<events.length; e++){
            event = events[e];
            if(event['eventType'] == "WARD_PLACED"){
                if(event['wardType'] == "SIGHT_WARD"){
                    sightwards[event['creatorId']] = sightwards[event['creatorId']] + 1;
                }
                if(event['wardType'] == "VISION_WARD"){
                    visionwards[event['creatorId']] = visionwards[event['creatorId']] + 1;
                }
                if((event['wardType'] == "YELLOW_TRINKET")||(event['wardType'] == "YELLOW_TRINKET_UPGRADE")){
                    yellowtrinket[event['creatorId']] = yellowtrinket[event['creatorId']] + 1;
                }
            }
        }
        sightWardsPlacedPerPlayerPerTimestamp[f] = {'sightwards':sightwards, 'visionwards':visionwards, 'yellowtrinket':yellowtrinket};
    }
    for( i=1; i<11; i++){
        sightwards[i] = 0;
        visionwards[i] = 0;
        yellowtrinket[i] = 0;
    }

    /* for each player in match (10 total) */
    for( p=1; p<11; p++){
        var participants = stats['participants'][p-1];
        /* set champion details */
        championIdentification['id'] = participants['championId'];
        championIdentification['name'] = championIdToName[championIdentification['id']];

        timelineLane = participants['timeline']['lane'];
        timelineRole = participants['timeline']['role'];
        if(timelineLane == "BOTTOM"){
            if(timelineRole == "DUO_CARRY"){
                championIdentification['role'] = "ADC";
            }
            else{
                championIdentification['role']= "SUPPORT"
            }
        }
        if(timelineLane == "MIDDLE"){
            championIdentification['role'] = "MIDDLE";
        }
        if(timelineLane == "JUNGLE"){
            championIdentification['role'] = "JUNGLE";
        }
        if(timelineLane == "TOP"){
            championIdentification['role'] = "TOP";
        }


        /* set numerical variables */
        statistics = stats['participants'][p-1]['stats'];
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
        championStatistics['minionsKilledTotal'] = statistics['neutralMinionsKilled'];
        championStatistics['enemyJungleMinionsKilled'] = statistics['neutralMinionsKilledEnemyJungle'];


        /* for each timestep */
        frames = stats['timeline']['frames'];
        for( f=0; f< frames.length; f++){
            frame = frames[f]['participantFrames'][p];
            oneTimeStamp['minute'] = f;
            oneTimeStamp['jungleMinionsKilled'] = frame['jungleMinionsKilled'];
            oneTimeStamp['minionsKilled'] = frame['minionsKilled'];
            oneTimeStamp['level'] = frame['level'];
            oneTimeStamp['totalGold'] = frame['totalGold'];
            oneTimeStamp['currentGold'] = frame['currentGold'];

            //count up wards placed for current timestamp events
            // NO EVENTs ON f=0

            if(f!=0){
                oneTimeStamp['visionWardsPlaced'] = sightWardsPlacedPerPlayerPerTimestamp[f]['visionwards'][p];
                oneTimeStamp['sightWardsPlaced'] = sightWardsPlacedPerPlayerPerTimestamp[f]['sightwards'][p];
                oneTimeStamp['yellowTrinketPlaced'] = sightWardsPlacedPerPlayerPerTimestamp[f]['yellowtrinket'][p];
            }
            else{
                oneTimeStamp['visionWardsPlaced'] = visionwards;
                oneTimeStamp['sightWardsPlaced'] = sightwards;
                oneTimeStamp['yellowTrinketPlaced'] = yellowtrinket;
            }

            timeline[f] = {};
            timeline[f]['minute'] = oneTimeStamp['minute'];
            timeline[f]['jungleMinionsKilled'] = oneTimeStamp['jungleMinionsKilled'];
            timeline[f]['minionsKilled'] = oneTimeStamp['minionsKilled'];
            timeline[f]['level'] =  oneTimeStamp['level'];
            timeline[f]['totalGold'] = oneTimeStamp['totalGold'];
            timeline[f]['currentGold'] = oneTimeStamp['currentGold'];
            timeline[f]['visionWardsPlaced']= oneTimeStamp['visionWardsPlaced'];
            timeline[f]['sightWardsPlaced'] =  oneTimeStamp['sightWardsPlaced'];
            timeline[f]['yellowTrinketPlaced'] = oneTimeStamp['yellowTrinketPlaced'];
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
            var matchID = matches[numMatches-1]['id'];

            var matchPath = "/api/lol/"+region+"/v2.2/match/"+matchID+"?includeTimeline=true&api_key=";

            //update db to show we have looked at match
            matches[numMatches-1]['hasBeenQueried'] = true;
            matches[numMatches-1].save();

            //send API request
            https.get(host + matchPath + api_key, function(response){
                //console.log("received Match History response");
                var output = '';
                response.on("data", function(chunk){
                    output += chunk;
                });
                response.on("end", function(){
                    //console.log(output);
                    var obj = JSON.parse(output);
                    err = storePlayers(obj);
                    if(err){return err;}
                    err = storeStats(obj, currTier);
                    return err;
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
    var currTier = 0;
    var err = false;
    var nummatches = 0;
    var numplayers404 = 0;
    var nummatchhistorys = 0;

    var matchesToLookAt = false;
    var players404ToLookAt = false;
    var matchHistoryToLookAt = false;

    var turn = 0;



    populateLocalChampionIdToNameVar();

    var mainLoopInterval = setInterval(function(){
        if(!matchesToLookAt && !players404ToLookAt && !matchHistoryToLookAt){
            turn = 0;
        }

        if(turn == 0){
            currTier ++;
            if(currTier > 27){
                currTier = 1;
            }
            console.log(printLog+"tier:"+currTier);

            howManyMatches(currTier, function(numMatches){
                console.log("tier "+currTier+" numMatches:"+numMatches);
                if(numMatches>0){
                    nummatches = numMatches;
                    matchesToLookAt = true;
                }
            });
            howMany404Players(function(num404){
                console.log("tier "+currTier+" num404:"+num404);
                if(num404>0){
                    numplayers404 = num404;
                    players404ToLookAt = true;
                }
            });
            howManyMatchHistorys(currTier, function(numMH){
                console.log("tier "+currTier+" numMH:"+numMH);
                if(numMH>0){
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

mainLoop();


