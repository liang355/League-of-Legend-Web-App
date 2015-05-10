var express = require('express');
var router = express.Router();
var https = require('https');
var config = require("../config/config");

var Champion = require('../models/champion.js');
var Summoner = require('../models/summoner.js');
var Match = require('../models/match.js');
var ChampionStatistics = require('../models/championstatistics.js');

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


router.get('/champion/:name', function(req, res, next){
    console.log("routing");
    Champion.findOne({'name':req.params.name}, function(err, champion){
        if (err){
            return next(err);
        }
        res.json(champion);
    });
});

router.get('/champion', function(req, res, next){
    console.log("routing");
    Champion.find(function(err, champions){
        if (err){
            return next(err);
        }
        res.json(champions);
    }).sort({name: 1});
});

router.get('/championList', function(req, res, next){

});

router.get('/summoner', function(req, res, next){
    console.log("routing");
    Summoner.find(function(err, summoners){
        if(err){
            return next(err);
        }
        res.json(summoners);
    })
});

router.get('/summoner/:tier', function(req, res, next){
    console.log("routing");
    Summoner.find({'tier':req.params.tier}, function(err, summoners){
        if(err){
            return next(err);
        }
        res.json(summoners);
    })
});

var isThisEqual = function (m, aVar){
    if(m==aVar){
        return 1;
    }
    return 0;
};

var whatIsTheHighestNumber = function (a, b){
    var whatis = typeof b;
    if(whatis == 'string'){
        return a;
    }
    if( b > a ){
        return b;
    }
    else{
        return a;
    }
};

var doesContainMinute = function(m, anArray){
    for(var a=0; a<anArray.length; a++){
        if(m == anArray[a]){
            return 1;
        }
    }
    return 0;
};

var doesMinuteFallsWithinWard = function(level, minute, wardMinute, type){
    var timer = 0;
    if(type == 'vision'){
        timer = 5; //TODO: need to figure out how long we want to say this is up, cannot tell when it is killed
    }else if(type == 'sight'){
        timer = 3;
    }else if(type == 'yellow'){ //length changes based on level 1 pre 9, 2 post 9
        if(level < 9){
            timer = 1;
        }
        if(level >=9){
            timer = 2;
        }
    }

    var experation = wardMinute + timer;
    if((minute >= wardMinute)&&(minute <=experation)){
        return true;
    }
    return false;
};

var calculateAverages = function(stats){

    var averagedStats = {
        id:stats[0]['id'],
        name:stats[0]['name'],
        role:stats[0]['role'],
        tier:stats[0]['tier'],
        numberOfGames:stats.length,
        gameLength:0,
        assists:0,
        kills:0,
        deaths:0,
        magicDamageTotal:0,
        magicDamageChamp:0,
        magicDamageTaken:0,
        physicalDamageTotal:0,
        physicalDamageChamp:0,
        physicalDamageTaken:0,
        heals:0,
        wardsKilled:0,
        wardsPlaced:0,
        totalMinionsKilled:0,
        neutralMinionsKilledEnemyJungle:0,
        neutralMinionsKilledTeamJungle:0,

        blueGolem:['Blue Golem'],
        redLizard:['Red Lizard'],

        baseTurrets:{ TOP_LANE:['Top Base Turret'], MID_LANE:['Middle Base Turret'], BOT_LANE:['Bottom Base Turret']},
        innerTurrets:{ TOP_LANE:['Top Inner Turret'], MID_LANE:['Middle Inner Turret'], BOT_LANE:['Bottom Inner Turret']},
        outerTurrets:{ TOP_LANE:['Top Outer Turret'], MID_LANE:['Middle Outer Turret'], BOT_LANE:['Bottom Outer Turret']},
        nexusTurrets:{ TOP_LANE:['Top Nexus Turret'], MID_LANE:['Middle Nexus Turret'], BOT_LANE:['Bottom Nexus Turret']},
        inhibitors:{ TOP_LANE:['Top Inhibitor'], MID_LANE:['Middle Inhibitor'], BOT_LANE:['Bottom Inhibitor']},
        dragon:['Dragon'],
        baronNashor:['Baron Nashor'],

        instancesPerMinute: ['instancesPerMinute'],
        visionWardsPlaced : ['visionWardsPlaced'],
        sightWardsPlaced : ['sightWardsPlaced'],
        yellowTrinketPlaced : ['yellowTrinketPlaced'],
        jungleMinionsKilled : ['jungleMinionsKilled'],
        minionsKilled : ['minionsKilled'],
        level : ['level'],
        totalGold : ['totalGold'],
        currentGold : ['currentGold']
    };

    var longestGame = 0;

    //find static averages.
    for(var i=0; i<stats.length; i++){
        averagedStats["assists"] += stats[i]['assists'];
        averagedStats['kills'] += stats[i]['kills'];
        averagedStats['deaths'] += stats[i]['deaths'];
        averagedStats['magicDamageTotal'] += stats[i]['magicDamageTotal'];
        averagedStats['magicDamageChamp'] += stats[i]['magicDamageChamp'];
        averagedStats['magicDamageTaken'] += stats[i]['magicDamageTaken'];
        averagedStats['physicalDamageTotal'] += stats[i]['physicalDamageTotal'];
        averagedStats['physicalDamageChamp'] += stats[i]['physicalDamageChamp'];
        averagedStats['physicalDamageTaken'] += stats[i]['physicalDamageTaken'];
        averagedStats['heals'] += stats[i]['heals'];
        averagedStats['wardsKilled'] += stats[i]['wardsKilled'];
        averagedStats['wardsPlaced'] += stats[i]['wardsPlaced'];
        averagedStats['totalMinionsKilled'] += stats[i]['totalMinionsKilled'];
        averagedStats['neutralMinionsKilledEnemyJungle'] += stats[i]['neutralMinionsKilledEnemyJungle'];
        averagedStats['neutralMinionsKilledTeamJungle'] += stats[i]['neutralMinionsKilledTeamJungle'];
        if(longestGame < stats[i]['minionsKilled'].length){
            longestGame = stats[i]['minionsKilled'].length;
        }
    }


    averagedStats["assists"] = averagedStats["assists"] / stats.length;
    averagedStats['kills'] = averagedStats["kills"] / stats.length;
    averagedStats['deaths'] = averagedStats["deaths"] / stats.length;
    averagedStats['magicDamageTotal'] = averagedStats["magicDamageTotal"] / stats.length;
    averagedStats['magicDamageChamp'] = averagedStats["magicDamageChamp"] / stats.length;
    averagedStats['magicDamageTaken'] = averagedStats["magicDamageTaken"] / stats.length;
    averagedStats['physicalDamageTotal'] = averagedStats["physicalDamageTotal"] / stats.length;
    averagedStats['physicalDamageChamp'] = averagedStats["physicalDamageChamp"] / stats.length;
    averagedStats['physicalDamageTaken'] = averagedStats["physicalDamageTaken"] / stats.length;
    averagedStats['heals'] = averagedStats["heals"] / stats.length;
    averagedStats['wardsKilled'] = averagedStats["wardsKilled"] / stats.length;
    averagedStats['wardsPlaced'] = averagedStats["wardsPlaced"] / stats.length;
    averagedStats['totalMinionsKilled'] = averagedStats["totalMinionsKilled"] / stats.length;
    averagedStats['neutralMinionsKilledEnemyJungle'] = averagedStats["neutralMinionsKilledEnemyJungle"] / stats.length;
    averagedStats['neutralMinionsKilledTeamJungle'] = averagedStats["neutralMinionsKilledTeamJungle"] / stats.length;




    //find timeline averages.
    //
    //redLizard:0,
    //    blueGolem:0,



    //calculate averages of each dragon kill
    var mostDragonKills = 0;
    for(var i=0; i<stats.length; i++){
        if(stats[i]['dragon'].length > mostDragonKills){
            mostDragonKills = stats[i]['dragon'].length;
        }
    }
    for(var d=0; d<mostDragonKills; d++){
        var average = 0;
        var instances = 0;
        //calc average
        for(var i=0; i<stats.length; i++){
            if(stats[i]['dragon'].length > d){
                average += stats[i]['dragon'][d];
                instances++;
            }
        }
        if(instances != 0){ average = average/instances; }

        var variance = 0;
        //calc variance then sd
        for(var i=0; i<stats.length; i++){
            if(stats[i]['dragon'].length > d){
                variance += Math.pow((stats[i]['dragon'][d] - average), 2);
            }
        }
        if(instances != 0) {  variance = variance / instances; }
        var standardDiviation = Math.sqrt(variance);

        averagedStats['dragon'].push(average);
        averagedStats['dragon'].push(standardDiviation);
    }


    //calculate averages of each baron kill
    var mostBaronKills = 0;
    for(var i=0; i<stats.length; i++){
        if(stats[i]['baronNashor'].length > mostBaronKills){
            mostBaronKills = stats[i]['baronNashor'].length;
        }
    }
    for(var d=0; d<mostBaronKills; d++){
        var average = 0;
        var instances = 0;
        //calc average
        for(var i=0; i<stats.length; i++){
            if(stats[i]['baronNashor'].length > d){
                average += stats[i]['baronNashor'][d];
                instances++;
            }
        }
        if(instances != 0) { average = average / instances; }

        var variance = 0;
        //calc variance then sd
        for(var i=0; i<stats.length; i++){
            if(stats[i]['baronNashor'].length > d){
                variance += Math.pow((stats[i]['baronNashor'][d] - average), 2);
            }
        }
        if(instances != 0) { variance = variance / instances;}

        var standardDiviation = Math.sqrt(variance);
        averagedStats['baronNashor'].push(average);
        averagedStats['baronNashor'].push(standardDiviation);
    }


    var instancesPerMinute_baseTurrets = {
        TOP_LANE:[],
        BOT_LANE:[],
        MID_LANE:[]
    };
    var instancesPerMinute_innerTurrets = {
        TOP_LANE:[],
        BOT_LANE:[],
        MID_LANE:[]
    };
    var instancesPerMinute_outerTurrets = {
        TOP_LANE:[],
        BOT_LANE:[],
        MID_LANE:[]
    };
    var instancesPerMinute_nexusTurrets = {
        TOP_LANE:[],
        BOT_LANE:[],
        MID_LANE:[]
    };
    var instancesPerMinute_inhibitors = {
        TOP_LANE:[],
        BOT_LANE:[],
        MID_LANE:[]
    };
    var avgbaseTurrets_T = 0, sdbaseTurrets_T = 0, baseTurrets_T = 0;
    var avgbaseTurrets_M = 0, sdbaseTurrets_M = 0, baseTurrets_M = 0;
    var avgbaseTurrets_B = 0, sdbaseTurrets_B = 0, baseTurrets_B = 0;

    var avginnerTurrets_T = 0, sdinnerTurrets_T = 0, innerTurrets_T = 0;
    var avginnerTurrets_M = 0, sdinnerTurrets_M = 0, innerTurrets_M = 0;
    var avginnerTurrets_B = 0, sdinnerTurrets_B = 0, innerTurrets_B = 0;

    var avgouterTurrets_T = 0, sdouterTurrets_T = 0, outerTurrets_T = 0;
    var avgouterTurrets_M = 0, sdouterTurrets_M = 0, outerTurrets_M = 0;
    var avgouterTurrets_B = 0, sdouterTurrets_B = 0, outerTurrets_B = 0;

    var avgnexusTurrets_T = 0, sdnexusTurrets_T = 0, nexusTurrets_T = 0;
    var avgnexusTurrets_M = 0, sdnexusTurrets_M = 0, nexusTurrets_M = 0;
    var avgnexusTurrets_B = 0, sdnexusTurrets_B = 0, nexusTurrets_B = 0;

    var avginhibitors_T = 0, sdinhibitors_T = 0, inhibitors_T = 0;
    var avginhibitors_M = 0, sdinhibitors_M = 0, inhibitors_M = 0;
    var avginhibitors_B = 0, sdinhibitors_B = 0, inhibitors_B = 0;

    //Calculate inhibitor averages
    for(var i=0; i<stats.length; i++) {
        if(stats[i]['baseTurrets'][0]['TOP_LANE']>0){ avgbaseTurrets_T += stats[i]['baseTurrets'][0]['TOP_LANE']; baseTurrets_T ++; }
        if(stats[i]['baseTurrets'][0]['BOT_LANE']> 0){ avgbaseTurrets_B += stats[i]['baseTurrets'][0]['BOT_LANE']; baseTurrets_B ++; }
        if(stats[i]['baseTurrets'][0]['MID_LANE']> 0){ avgbaseTurrets_M += stats[i]['baseTurrets'][0]['MID_LANE']; baseTurrets_M ++; }

        if(stats[i]['innerTurrets'][0]['TOP_LANE']> 0){ avginnerTurrets_T += stats[i]['innerTurrets'][0]['TOP_LANE']; innerTurrets_T ++; }
        if(stats[i]['innerTurrets'][0]['BOT_LANE']> 0){ avginnerTurrets_B += stats[i]['innerTurrets'][0]['BOT_LANE']; innerTurrets_B ++; }
        if(stats[i]['innerTurrets'][0]['MIN_LANE']> 0){ avginnerTurrets_M += stats[i]['innerTurrets'][0]['MID_LANE']; innerTurrets_M ++; }

        if(stats[i]['outerTurrets'][0]['TOP_LANE']> 0){ avgouterTurrets_T +=stats[i]['outerTurrets'][0]['TOP_LANE']; outerTurrets_T ++; }
        if(stats[i]['outerTurrets'][0]['BOT_LANE']> 0){ avgouterTurrets_B +=stats[i]['outerTurrets'][0]['BOT_LANE']; outerTurrets_B ++; }
        if(stats[i]['outerTurrets'][0]['MID_LANE']> 0){ avgouterTurrets_M +=stats[i]['outerTurrets'][0]['MID_LANE']; outerTurrets_M ++; }

        if(stats[i]['nexusTurrets'][0]['TOP_LANE']> 0){ avgnexusTurrets_T +=stats[i]['nexusTurrets'][0]['TOP_LANE']; nexusTurrets_T ++; console.log("ham")};
        //console.log("avgnexusTurrets_T, "+avgnexusTurrets_T);
        //console.log("nexusTurrets_T, "+ nexusTurrets_T);
        if(stats[i]['nexusTurrets'][0]['BOT_LANE']> 0){ avgnexusTurrets_B +=stats[i]['nexusTurrets'][0]['BOT_LANE']; nexusTurrets_B ++; }
        if(stats[i]['nexusTurrets'][0]['MID_LANE']> 0){ avgnexusTurrets_M +=stats[i]['nexusTurrets'][0]['MID_LANE']; nexusTurrets_M ++; }

        if(stats[i]['inhibitors'][0]['TOP_LANE']> 0){ avginhibitors_T += stats[i]['inhibitors'][0]['TOP_LANE']; inhibitors_T ++; }
        if(stats[i]['inhibitors'][0]['BOT_LANE']> 0){ avginhibitors_B += stats[i]['inhibitors'][0]['BOT_LANE']; inhibitors_B ++; }
        if(stats[i]['inhibitors'][0]['MID_LANE']> 0){ avginhibitors_M += stats[i]['inhibitors'][0]['MID_LANE']; inhibitors_M ++; }

    }
    //var averageBT = avgbaseTurrets_T / baseTurrets_T;
    //console.log(averageBT);
    //instancesPerMinute_baseTurrets['TOP_LANE'].push(averageBT);
    //var averageBB =avgbaseTurrets_B / baseTurrets_B;
    //instancesPerMinute_baseTurrets['BOT_LANE'].push(averageBB);
    //var averageBM = avgbaseTurrets_M / baseTurrets_M;
    //instancesPerMinute_baseTurrets['MID_LANE'].push(averageBM);
    //
    //var averageIT = avginnerTurrets_T / innerTurrets_T;
    //instancesPerMinute_innerTurrets['TOP_LANE'].push(averageIT);
    //var averageIB = avginnerTurrets_B / innerTurrets_B;
    //instancesPerMinute_innerTurrets['BOT_LANE'].push(averageIB);
    //var averageIM = avginnerTurrets_M / innerTurrets_M;
    //instancesPerMinute_innerTurrets['MID_LANE'].push(averageIM);
    //
    //var averageOT = avgouterTurrets_T / outerTurrets_T;
    //instancesPerMinute_outerTurrets['TOP_LANE'].push(averageOT);
    //var averageOB = avgouterTurrets_B / outerTurrets_B;
    //instancesPerMinute_outerTurrets['BOT_LANE'].push(averageOB);
    //var averageOM = avgouterTurrets_M / outerTurrets_M;
    //instancesPerMinute_outerTurrets['MID_LANE'].push(averageOM);
    //
    //var averageNT =  avgnexusTurrets_T / nexusTurrets_T;
    //instancesPerMinute_nexusTurrets ['TOP_LANE'].push(averageNT);
    //var averageNB = avgnexusTurrets_B / nexusTurrets_B;
    //instancesPerMinute_nexusTurrets['BOT_LANE'].push(averageNB);
    //var averageNM = avgnexusTurrets_M / nexusTurrets_M;
    //instancesPerMinute_nexusTurrets['MID_LANE'].push(averageNM);
    //
    //var averageINT = avginhibitors_T / inhibitors_T;
    //instancesPerMinute_inhibitors['TOP_LANE'].push(averageINT);
    //var averageINB = avginhibitors_B / inhibitors_B;
    //instancesPerMinute_inhibitors['BOT_LANE'].push(averageINB);
    //var averageINM = avginhibitors_M / inhibitors_M;
    //instancesPerMinute_inhibitors['MID_LANE'].push(averageINM);
    avgbaseTurrets_T = ( baseTurrets_T == 0 ? 0 : avgbaseTurrets_T / baseTurrets_T);
    avgbaseTurrets_B =( baseTurrets_B == 0 ? 0 :avgbaseTurrets_B / baseTurrets_B);
    avgbaseTurrets_M = ( baseTurrets_M == 0 ? 0 :avgbaseTurrets_M / baseTurrets_M);

    avginnerTurrets_T = ( innerTurrets_T == 0 ? 0 :avginnerTurrets_T / innerTurrets_T);
    avginnerTurrets_B = ( innerTurrets_B == 0 ? 0 :avginnerTurrets_B / innerTurrets_B);
    avginnerTurrets_M = ( innerTurrets_M == 0 ? 0 :avginnerTurrets_M / innerTurrets_M);

    avgouterTurrets_T = ( outerTurrets_T == 0 ? 0 :avgouterTurrets_T / outerTurrets_T);
    avgouterTurrets_B = ( outerTurrets_B == 0 ? 0 :avgouterTurrets_B / outerTurrets_B);
    avgouterTurrets_M = ( outerTurrets_M == 0 ? 0 :avgouterTurrets_M / outerTurrets_M);

    avgnexusTurrets_T = ( nexusTurrets_T == 0 ? 0 :avgnexusTurrets_T / nexusTurrets_T);
    avgnexusTurrets_B = ( nexusTurrets_B == 0 ? 0 :avgnexusTurrets_B / nexusTurrets_B);
    avgnexusTurrets_M = ( nexusTurrets_M == 0 ? 0 :avgnexusTurrets_M / nexusTurrets_M);

    avginhibitors_T = ( inhibitors_T == 0 ? 0 :avginhibitors_T / inhibitors_T);
    avginhibitors_B = ( inhibitors_B == 0 ? 0 :avginhibitors_B / inhibitors_B);
    avginhibitors_M = ( inhibitors_M == 0 ? 0 :avginhibitors_M / inhibitors_M);


    //calculate sd and variance

    for(var i=0; i<stats.length; i++){

        sdbaseTurrets_T += Math.pow(avgbaseTurrets_T - stats[i]['baseTurrets'][0]['TOP_LANE'], 2);
        sdbaseTurrets_B += Math.pow(avgbaseTurrets_B - stats[i]['baseTurrets'][0]['BOT_LANE'], 2);
        sdbaseTurrets_M += Math.pow(avgbaseTurrets_M -stats[i]['baseTurrets'][0]['MID_LANE'], 2);

        sdinnerTurrets_T += Math.pow(avginnerTurrets_T - stats[i]['innerTurrets'][0]['TOP_LANE'], 2);
        sdinnerTurrets_B +=  Math.pow(avginnerTurrets_B - stats[i]['innerTurrets'][0]['BOT_LANE'], 2);
        sdinnerTurrets_M +=  Math.pow(avginnerTurrets_M - stats[i]['innerTurrets'][0]['MID_LANE'], 2);

        sdouterTurrets_T +=  Math.pow(avgouterTurrets_T -stats[i]['outerTurrets'][0]['TOP_LANE'], 2);
        sdouterTurrets_B += Math.pow(avgouterTurrets_B -stats[i]['outerTurrets'][0]['BOT_LANE'], 2);
        sdouterTurrets_M += Math.pow(avgouterTurrets_M -stats[i]['outerTurrets'][0]['MID_LANE'], 2);

        sdnexusTurrets_T += Math.pow(avgnexusTurrets_T -stats[i]['nexusTurrets'][0]['TOP_LANE'], 2);
        sdnexusTurrets_B += Math.pow(avgnexusTurrets_B -stats[i]['nexusTurrets'][0]['BOT_LANE'], 2);
        sdnexusTurrets_M += Math.pow(avgnexusTurrets_M -stats[i]['nexusTurrets'][0]['MID_LANE'], 2);

        sdinhibitors_T += Math.pow(avginhibitors_T - stats[i]['inhibitors'][0]['TOP_LANE'], 2);
        sdinhibitors_B += Math.pow(avginhibitors_B - stats[i]['inhibitors'][0]['BOT_LANE'], 2);
        sdinhibitors_M += Math.pow(avginhibitors_M - stats[i]['inhibitors'][0]['MID_LANE'], 2);
    }

    sdbaseTurrets_T = ( baseTurrets_T == 0 ? 0 : Math.sqrt(sdbaseTurrets_T / baseTurrets_T));
    sdbaseTurrets_B = ( baseTurrets_B == 0 ? 0 : Math.sqrt(sdbaseTurrets_B / baseTurrets_B));
    sdbaseTurrets_M = ( baseTurrets_M == 0 ? 0 : Math.sqrt(sdbaseTurrets_M / baseTurrets_M));

    sdinnerTurrets_T = ( innerTurrets_T == 0 ? 0 :  Math.sqrt(sdinnerTurrets_T / innerTurrets_T));
    sdinnerTurrets_B = ( innerTurrets_B == 0 ? 0 :   Math.sqrt(sdinnerTurrets_B / innerTurrets_B));
    sdinnerTurrets_M = ( innerTurrets_M == 0 ? 0 :   Math.sqrt(sdinnerTurrets_M / innerTurrets_M));

    sdouterTurrets_T = ( outerTurrets_T == 0 ? 0 :   Math.sqrt(sdouterTurrets_T / outerTurrets_T));
    sdouterTurrets_B = ( outerTurrets_B == 0 ? 0 :  Math.sqrt(sdouterTurrets_B / outerTurrets_B));
    sdouterTurrets_M = ( outerTurrets_M == 0 ? 0 :  Math.sqrt(sdouterTurrets_M / outerTurrets_M));

    sdnexusTurrets_T = ( nexusTurrets_T == 0 ? 0 :  Math.sqrt(sdnexusTurrets_T / nexusTurrets_T));
    sdnexusTurrets_B = ( nexusTurrets_B == 0 ? 0 :  Math.sqrt(sdnexusTurrets_B / nexusTurrets_B));
    sdnexusTurrets_M = ( nexusTurrets_M == 0 ? 0 :  Math.sqrt(sdnexusTurrets_M / nexusTurrets_M));

    sdinhibitors_T = ( inhibitors_T == 0 ? 0 :  Math.sqrt(sdinhibitors_T / inhibitors_T));
    sdinhibitors_B = ( inhibitors_B == 0 ? 0 :  Math.sqrt(sdinhibitors_B / inhibitors_B));
    sdinhibitors_M = ( inhibitors_M == 0 ? 0 :  Math.sqrt(sdinhibitors_M / inhibitors_M));


    //store the average first, sd second
    averagedStats['baseTurrets']['TOP_LANE'].push(avgbaseTurrets_T);
    averagedStats['baseTurrets']['TOP_LANE'].push(sdbaseTurrets_T);
    averagedStats['baseTurrets']['MID_LANE'].push(avgbaseTurrets_B);
    averagedStats['baseTurrets']['MID_LANE'].push(sdbaseTurrets_B);
    averagedStats['baseTurrets']['BOT_LANE'].push(avgbaseTurrets_M);
    averagedStats['baseTurrets']['BOT_LANE'].push(sdbaseTurrets_M);

    averagedStats['innerTurrets']['TOP_LANE'].push(avginnerTurrets_T);
    averagedStats['innerTurrets']['TOP_LANE'].push(sdinnerTurrets_T);
    averagedStats['innerTurrets']['MID_LANE'].push(avginnerTurrets_B);
    averagedStats['innerTurrets']['MID_LANE'].push(sdinnerTurrets_B);
    averagedStats['innerTurrets']['BOT_LANE'].push(avginnerTurrets_M);
    averagedStats['innerTurrets']['BOT_LANE'].push(sdinnerTurrets_M);

    averagedStats['outerTurrets']['TOP_LANE'].push(avgouterTurrets_T);
    averagedStats['outerTurrets']['TOP_LANE'].push(sdouterTurrets_T);
    averagedStats['outerTurrets']['MID_LANE'].push(avgouterTurrets_B);
    averagedStats['outerTurrets']['MID_LANE'].push(sdouterTurrets_B);
    averagedStats['outerTurrets']['BOT_LANE'].push(avgouterTurrets_M);
    averagedStats['outerTurrets']['BOT_LANE'].push(sdouterTurrets_M);

    averagedStats['nexusTurrets']['TOP_LANE'].push(avgnexusTurrets_T);
    averagedStats['nexusTurrets']['TOP_LANE'].push(sdnexusTurrets_T);
    averagedStats['nexusTurrets']['MID_LANE'].push(avgnexusTurrets_B);
    averagedStats['nexusTurrets']['MID_LANE'].push(sdnexusTurrets_B);
    averagedStats['nexusTurrets']['BOT_LANE'].push(avgnexusTurrets_M);
    averagedStats['nexusTurrets']['BOT_LANE'].push(sdnexusTurrets_M);

    averagedStats['inhibitors']['TOP_LANE'].push(avginhibitors_T);
    averagedStats['inhibitors']['TOP_LANE'].push(sdinhibitors_T);
    averagedStats['inhibitors']['MID_LANE'].push(avginhibitors_B);
    averagedStats['inhibitors']['MID_LANE'].push(sdinhibitors_B);
    averagedStats['inhibitors']['BOT_LANE'].push(avginhibitors_M);
    averagedStats['inhibitors']['BOT_LANE'].push(sdinhibitors_M);



    //for each minute
    for(var m=0; m<longestGame; m++){
        var instancesPerMinute = 0;
        var oneTimeStamp = {
            'visionWardsPlaced': 0,
            'sightWardsPlaced': 0,
            'yellowTrinketPlaced': 0,
            'jungleMinionsKilled': 0,
            'minionsKilled': 0,
            'level': 0,
            'totalGold': 0,
            'currentGold': 0
        };

        //add the statistics to the list
        for(i=0; i<stats.length; i++){
            if(m<stats[i]['minionsKilled'].length){
                instancesPerMinute ++;
                oneTimeStamp['jungleMinionsKilled'] += stats[i]['jungleMinionsKilled'][m];
                oneTimeStamp['minionsKilled'] += stats[i]['minionsKilled'][m];
                oneTimeStamp['level'] += stats[i]['level'][m];
                oneTimeStamp['totalGold'] += stats[i]['totalGold'][m];
                oneTimeStamp['currentGold'] += stats[i]['currentGold'][m];

                // for each ward type see if it is active at this minute
                for(var w=0; w<stats[i]['visionWardsPlaced'].length; w++){
                    if(stats[i]['visionWardsPlaced'][w]>m){
                        break;
                    }
                    if(doesMinuteFallsWithinWard(stats[i]['level'][m], m, stats[i]['visionWardsPlaced'][w], 'vision')){
                            oneTimeStamp['visionWardsPlaced'] += 1;
                    }
                }

                for(var w=0; w<stats[i]['sightWardsPlaced'].length; w++){
                    if(stats[i]['sightWardsPlaced'][w]>m){
                        break;
                    }
                    if(doesMinuteFallsWithinWard(stats[i]['level'][m], m, stats[i]['sightWardsPlaced'][w], 'sight')){
                            oneTimeStamp['sightWardsPlaced'] += 1;
                    }
                }
                for(var w=0; w<stats[i]['yellowTrinketPlaced'].length; w++){
                    if(stats[i]['yellowTrinketPlaced'][w]>m){
                        break;
                    }
                    if(doesMinuteFallsWithinWard(stats[i]['level'][m], m, stats[i]['yellowTrinketPlaced'][w], 'yellow')){
                        oneTimeStamp['yellowTrinketPlaced'] += 1;
                    }
                }
            }

        }

        //average out stats that need averaging
        oneTimeStamp['jungleMinionsKilled'] = oneTimeStamp['jungleMinionsKilled'] / instancesPerMinute;
        oneTimeStamp['minionsKilled'] = oneTimeStamp['minionsKilled'] / instancesPerMinute;

        oneTimeStamp['level'] = oneTimeStamp['level'] / instancesPerMinute;
        oneTimeStamp['totalGold'] = oneTimeStamp['totalGold'] / instancesPerMinute;
        oneTimeStamp['currentGold'] = oneTimeStamp['currentGold'] / instancesPerMinute;

        oneTimeStamp['sightWardsPlaced'] = Math.round(oneTimeStamp['sightWardsPlaced'] / instancesPerMinute);
        oneTimeStamp['visionWardsPlaced'] = Math.round(oneTimeStamp['visionWardsPlaced'] / instancesPerMinute);
        oneTimeStamp['yellowTrinketPlaced'] = Math.round(oneTimeStamp['yellowTrinketPlaced'] / instancesPerMinute);


        averagedStats['instancesPerMinute'][m+1] = instancesPerMinute;

        averagedStats['jungleMinionsKilled'][m+1] = whatIsTheHighestNumber(oneTimeStamp['jungleMinionsKilled'],averagedStats['jungleMinionsKilled'][m]);
        averagedStats['minionsKilled'][m+1] = whatIsTheHighestNumber(oneTimeStamp['minionsKilled'], averagedStats['minionsKilled'][m]);
        averagedStats['level'][m+1] = whatIsTheHighestNumber(oneTimeStamp['level'],averagedStats['level'][m]);
        averagedStats['totalGold'][m+1] = whatIsTheHighestNumber(oneTimeStamp['totalGold'], averagedStats['totalGold'][m]);
        averagedStats['currentGold'][m+1] = oneTimeStamp['currentGold'];


        if(oneTimeStamp['visionWardsPlaced'] > 1){
            averagedStats['visionWardsPlaced'][m+1] = 1;
        }
        else{
            averagedStats['visionWardsPlaced'][m+1] = oneTimeStamp['visionWardsPlaced'];
        }


        if(oneTimeStamp['sightWardsPlaced'] > 3){
            averagedStats['sightWardsPlaced'][m+1] = 3;
        }
        else{
            averagedStats['sightWardsPlaced'][m+1] = oneTimeStamp['sightWardsPlaced'];
        }


        if(oneTimeStamp['yellowTrinketPlaced'] > 1){
            averagedStats['yellowTrinketPlaced'][m+1] = 1;
        }
        else{
            averagedStats['yellowTrinketPlaced'][m+1] = oneTimeStamp['yellowTrinketPlaced'];
        }
    }


    for(var i=0; i<stats.length; i++){
        averagedStats['gameLength'] += stats[i]['minionsKilled'].length;
    }
    averagedStats['gameLength'] = averagedStats['gameLength'] / stats.length;

    return averagedStats;

};

router.get('/championstatistics/:tierw/:name/:rolew', function(req, res, next){
    console.log("routing");
    ChampionStatistics.find({'tier':req.params.tierw, 'name':req.params.name, 'role':req.params.rolew}, function(err, stats){
        if(err){
            return next(err);
        }
        if (stats.length > 1){
            var averagedStats = calculateAverages(stats);
            res.json(averagedStats);
        }
        else {
            res.json({});
        }
    });
});

router.get('/championstatistics2/:tierw/:id/:rolew', function(req, res, next){
    console.log("routing");
    ChampionStatistics.find({'tier':req.params.tierw, 'id':req.params.id, 'role':req.params.rolew}, function(err, stats){
        if(err){
            return next(err);
        }
        if (stats.length > 1){
            var averagedStats = calculateAverages(stats);
            res.json(averagedStats);
        }
        else {
            res.json({});
        }
    });
});

router.get('/static/champion/:id', function(req, res, next) {
    var api_key = config.api_key;
    var region = "na";
    var host = "https://na.api.pvp.net";

    //paths
    var championPath = "/api/lol/static-data/" + region + "/v1.2/champion/" + req.params.id + "?api_key=";

    https.get(host + championPath + api_key, function (response) {
        var statusCode = response.statusCode;
        console.log("making request");
        var output = '';
        response.on("data", function (chunk) {
            output += chunk;
        });
        response.on('end', function () {
            if (statusCode == 200) {
                var obj = JSON.parse(output);
                res.json(obj);
            }
        });
    });
});

router.get('/static/champions/list', function(req, res, next){
    var api_key = config.api_key;
    var region = "na";
    var host = "https://na.api.pvp.net";

    var championPath = "/api/lol/static-data/" + region + "/v1.2/champion?api_key=";

    https.get(host + championPath + api_key, function (response) {
        var statusCode = response.statusCode;
        console.log("making request");
        var output = '';
        response.on("data", function (chunk) {
            output += chunk;
        });
        response.on('end', function () {
            if (statusCode == 200) {
                var obj = JSON.parse(output);
                res.json(obj.data);
            }
            else {
                res.json({error:'something went wrong'});
            }
        });
    });
});

router.get('/static/role/list', function(req, res, next){
    var roles = module.require('../static/role.js');
    res.json(roles)
});

router.get('/static/tier/list', function(req, res, next){
    var tiers = module.require('../static/tier.js');
    res.json(tiers)
});

router.get('/currentGame/:summoner', function(req, res, next){
    var api_key = config.api_key;
    var region ="na";
    var platformID = "NA1";
    var host = "https://na.api.pvp.net";

    var summonerPath = "/api/lol/"+region+"/v1.4/summoner/by-name/"+req.params.summoner+"?api_key=";

    var getRanks = function(currentGame){
        var players = "";
        for (var i = 0; i < currentGame.participants.length; i++){
            players = players + currentGame.participants[i].summonerId;
            if (i+1 < currentGame.participants.length){
                players = players + ",";
            }
        }
        console.log(players);

        var leaguePath = "/api/lol/"+region+"/v2.5/league/by-summoner/"+players+"?api_key=";
        https.get(host + leaguePath + api_key, function (response) {
            var statusCode = response.statusCode;
            console.log("making request");
            var output = '';
            response.on("data", function (chunk) {
                output += chunk;
            });
            response.on('end', function () {
                if (statusCode == 200) {
                    var league = JSON.parse(output);
                    console.log(league);
                    for (var i = 0; i < currentGame.participants.length; i++){
                        var summonerId = currentGame.participants[i].summonerId;
                        currentGame.participants[i].league = league[summonerId];
                    }
                    res.json(currentGame);
                }
                else {
                    res.json(output);
                }
            });
        });
    };

    var getChampions = function(currentGame){
        var championPath = "/api/lol/static-data/" + region + "/v1.2/champion/?api_key=";

        https.get(host + championPath + api_key, function (response) {
            var statusCode = response.statusCode;
            console.log("making request");
            var output = '';
            response.on("data", function (chunk) {
                output += chunk;
            });
            response.on('end', function () {
                if (statusCode == 200) {
                    var champions = JSON.parse(output).data;
                    for (var i = 0; i < currentGame.participants.length; i++){
                        var championId = currentGame.participants[i].championId;
                        for (var champ in champions){
                            if (champions[champ].id == championId){
                                currentGame.participants[i].champion = champions[champ];
                            }
                        }
                    }
                    getRanks(currentGame);
                }
                else {
                    res.json(output);
                }
            });
        });
    };

    var getCurrentGame = function(summonerID){
        console.log("go", summonerID);
        //then get current game
        var currentGamePath = "/observer-mode/rest/consumer/getSpectatorGameInfo/" + platformID + "/" + summonerID + "?api_key=";

        https.get(host + currentGamePath + api_key, function (response) {
            var statusCode = response.statusCode;
            console.log("making request for game");
            var output = '';
            response.on("data", function (chunk) {
                output += chunk;
            });
            response.on('end', function () {
                if (statusCode == 200) {
                    var obj = JSON.parse(output);
                    obj.requestedID = summonerID;
                    currentGame = obj;
                    getChampions(currentGame);

                }
                else {
                    res.json({"error": "nogame"});
                }
            });
        });
    };

    var gatherData = function() {
        //get summonerID
        https.get(host + summonerPath + api_key, function (response) {
            var statusCode = response.statusCode;
            console.log("making request for name");
            var output = '';
            response.on("data", function (chunk) {
                output += chunk;
            });
            response.on('end', function () {
                if (statusCode == 200) {
                    var obj = JSON.parse(output);
                    console.log(obj);

                    for (var summoner in obj) {
                        break;
                    }
                    var summonerID = obj[summoner].id;
                    getCurrentGame(summonerID);
                }
                else {
                    res.json({"error": "noplayer"});
                }
            });
        });
    };

    gatherData();
});


router.get('/mostRecordedRole/:name', function(req, res, next){
    console.log("routing");
    ChampionStatistics.aggregate()
        .match({name:req.params.name})
        .group({_id:'$role', count:{$sum: 1}})
        .sort({count: -1})
        .limit(1)
        .exec(
        function(err, roles) {
            if (err) {
                return next(err);
            }
            if (roles.length > 0) {
                res.json(roles);
            }
            else {
                res.json({});
            }
        }
    );
});

var grabSummonerID = function (summonerName, callback){

    var api_key = config.api_key;
    var region ="na";
    var platformID = "NA1";
    var host = "https://na.api.pvp.net";
    var matchPath = "/api/lol/"+region+"/v1.4/summoner/by-name/"+summonerName+"?api_key=";


    https.get(host + matchPath + api_key, function (response) {
        var statusCode = response.statusCode;
        console.log("making request for name");
        var output = '';
        response.on("data", function (chunk) {
            output += chunk;
        });
        response.on('end', function () {
            if (statusCode == 200) {
                var obj = JSON.parse(output);
                lookUpSummonerTier(obj[summonerName.toLowerCase()]['id'], summonerName, callback);
            }
            else {
                callback({error:'summoner '+summonerName+' was not found.'});
            }
        });
    });
};

var lookUpSummonerTier = function(summonerId, summonerName, callback){
    var api_key = config.api_key;
    var region ="na";
    var platformID = "NA1";
    var host = "https://na.api.pvp.net";
    var matchPath = "/api/lol/"+region+"/v2.5/league/by-summoner/"+summonerId+"?api_key=";


    https.get(host + matchPath + api_key, function (response) {
        var statusCode = response.statusCode;
        console.log("making request for name");
        var output = '';
        response.on("data", function (chunk) {
            output += chunk;
        });
        response.on('end', function () {
            if (statusCode == 200) {
                var obj = JSON.parse(output);


                var tier;
                var division;
                var numeric;
                for(var q=0; q<obj[summonerId].length; q++){
                    if(obj[summonerId][q]['queue']=="RANKED_SOLO_5x5"){
                        var p=0;
                        for(p=0; p<obj[summonerId][q]['entries'].length; p++){
                            if(obj[summonerId][q]['entries'][p]['playerOrTeamId'] == summonerId){
                                console.log("summoner found");
                                break;
                            }
                        }
                        tier = obj[summonerId][q]['tier'];
                        division = obj[summonerId][q]['entries'][p]['division'];
                        numeric = tierN[tier] + divisionN[division];
                    }
                }

                lookUpMatchHistory(summonerId, summonerName, numeric, callback);
            }
            else {
                callback({error:'summoner '+summonerName+' was not found.'});
            }
        });
    });
};


var lookUpMatchHistory = function(summonerID, summonerName, summonerTier, callback){
    var api_key = config.api_key;
    var region ="na";
    var platformID = "NA1";
    var host = "https://na.api.pvp.net";
    var matchPath = "/api/lol/"+region+"/v2.2/matchhistory/"+summonerID+"?api_key=";


    https.get(host + matchPath + api_key, function (response) {
        var statusCode = response.statusCode;
        console.log("making request for name");
        var output = '';
        response.on("data", function (chunk) {
            output += chunk;
        });
        response.on('end', function () {
            if (statusCode == 200) {
                var obj = JSON.parse(output);
                var foundGame = false;
                for(var m=0; m<obj['matches'].length; m++){
                    if(obj['matches'][m]['queueType'] == "RANKED_SOLO_5x5"){
                        findMatch(obj['matches'][m]['matchId'], summonerName, summonerID, summonerTier, callback);
                        foundGame = true;
                        break;
                    }
                }
                if(!foundGame){ callback({error:"no ranked games in match history."});}
            }
            else {
                console.log("err no game");
            }
        });
    });
};

var findMatch = function(matchId, summonerName, summonerId, summonerTier,  callback){
    var api_key = config.api_key;
    var region ="na";
    var platformID = "NA1";
    var host = "https://na.api.pvp.net";
    var matchPath = "/api/lol/"+region+"/v2.2/match/"+matchId+"?includeTimeline=true&api_key=";

    //get summonerID
    https.get(host + matchPath + api_key, function (response) {
        var statusCode = response.statusCode;
        console.log("making request for name");
        var output = '';
        response.on("data", function (chunk) {
            output += chunk;
        });
        response.on('end', function () {
            if (statusCode == 200) {
                var obj = JSON.parse(output);
                //console.log(obj);
                calcMatchStatistics(obj,summonerName, summonerId, summonerTier, callback);
            }
            else {
            }
        });
    });
};

var calcMatchStatistics = function(match, summonerName, summonerId, summonerTier, callback){
    var playerID = 0;
    var teamID = 0;
    var participantId = 0;
    var gameLength =  match['timeline']['frames'].length;
    for(var m = 0; m<match['participantIdentities'].length; m++){
        if(match['participantIdentities'][m]['player']['summonerId'] == summonerId){
            participantId = m+1;
            break;
        }
    }
    if(participantId<6){
        teamID = 100;
    }
    else{
        teamID = 200;
    }

   // console.log(participantId);
   // console.log(JSON.stringify(match['participants'][0]));
    //name:match['participants'][participantId-1],

    /**
     * store static stats
     *
     */

    var matchStats = {
        id:match['participants'][participantId-1]['championId'],
        role:"",
        tier: summonerTier,
        gameLength:gameLength,
        assists:match['participants'][participantId-1]['stats']['assists'],
        kills:match['participants'][participantId-1]['stats']['kills'],
        deaths:match['participants'][participantId-1]['stats']['deaths'],
        magicDamageTotal:match['participants'][participantId-1]['stats']['magicDamageDealt'],
        magicDamageChamp:match['participants'][participantId-1]['stats']['magicDamageDealtToChampions'],
        magicDamageTaken:match['participants'][participantId-1]['stats']['magicDamageTaken'],
        physicalDamageTotal:match['participants'][participantId-1]['stats']['physicalDamageDealt'],
        physicalDamageChamp:match['participants'][participantId-1]['stats']['physicalDamageDealtToChampions'],
        physicalDamageTaken:match['participants'][participantId-1]['stats']['physicalDamageTaken'],
        heals:match['participants'][participantId-1]['stats']['totalHeal'],
        wardsKilled:match['participants'][participantId-1]['stats']['wardsKilled'],
        wardsPlaced:match['participants'][participantId-1]['stats']['wardsPlaced'],
        totalMinionsKilled:match['participants'][participantId-1]['stats']['minionsKilled'],
        neutralMinionsKilledEnemyJungle:match['participants'][participantId-1]['stats']['neutralMinionsKilledEnemyJungle'],
        neutralMinionsKilledTeamJungle:match['participants'][participantId-1]['stats']['neutralMinionsKilledTeamJungle'],

        blueGolem:['Blue Golem'],
        redLizard:['Red Lizard'],

        baseTurrets:{ TOP_LANE:['Top Base Turret'], MID_LANE:['Middle Base Turret'], BOT_LANE:['Bottom Base Turret']},
        innerTurrets:{ TOP_LANE:['Top Inner Turret'], MID_LANE:['Middle Inner Turret'], BOT_LANE:['Bottom Inner Turret']},
        outerTurrets:{ TOP_LANE:['Top Outer Turret'], MID_LANE:['Middle Outer Turret'], BOT_LANE:['Bottom Outer Turret']},
        nexusTurrets:{ TOP_LANE:['Top Nexus Turret'], MID_LANE:['Middle Nexus Turret'], BOT_LANE:['Bottom Nexus Turret']},
        inhibitors:{ TOP_LANE:['Top Inhibitor'], MID_LANE:['Middle Inhibitor'], BOT_LANE:['Bottom Inhibitor']},
        dragon:['Dragon Last'],
        baronNashor:['Baron Nashor Last'],

        visionWardsPlaced : ['visionWardsPlaced Last'],
        sightWardsPlaced : ['sightWardsPlaced Last'],
        yellowTrinketPlaced : ['yellowTrinketPlaced Last'],
        jungleMinionsKilled : ['jungleMinionsKilled Last'],
        minionsKilled : ['minionsKilled Last'],
        level : ['level Last'],
        totalGold : ['totalGold Last'],
        currentGold : ['currentGold Last']
    };

    /**
     * lane & role
     */
    timelineLane = match['participants'][participantId-1]['timeline']['lane'];
    timelineRole = match['participants'][participantId-1]['timeline']['role'];
    if (timelineLane == "BOTTOM") {
        if (timelineRole == "DUO_CARRY") {
            matchStats['role'] = "ADC";
        }
        else {
            matchStats['role'] = "SUPPORT"
        }
    }
    if (timelineLane == "MIDDLE") {
        matchStats['role'] = "MIDDLE";
    }
    if (timelineLane == "JUNGLE") {
        matchStats['role'] = "JUNGLE";
    }
    if (timelineLane == "TOP") {
        matchStats['role'] = "TOP";
    }

    /**
     * Store player Event Stats
     */

    var event, events, participantFrame, frames = match['timeline']['frames'];
    for (f = 1; f < frames.length; f++) {

        /* player data */
        participantFrame = frames[f]['participantFrames'][participantId];
        matchStats['level'].push(participantFrame['level']);
        matchStats['minionsKilled'].push(participantFrame['minionsKilled']);
        matchStats['totalGold'].push(participantFrame['totalGold']);
        matchStats['currentGold'].push(participantFrame['currentGold']);
        matchStats['jungleMinionsKilled'].push(participantFrame['jungleMinionsKilled']);

        /* event data */
        events = frames[f]['events'];
        for (e = 0; e < events.length; e++) {
            event = events[e];

            /* wards */
            if(event['creatorId'] == participantId) {
                if (event['eventType'] == "WARD_PLACED") {
                    if (event['wardType'] == "SIGHT_WARD") {
                        matchStats['sightWardsPlaced'].push(f);
                    }
                    if (event['wardType'] == "VISION_WARD") {
                        matchStats['visionWardsPlaced'].push(f);
                    }
                    if ((event['wardType'] == "YELLOW_TRINKET") || (event['wardType'] == "YELLOW_TRINKET_UPGRADE")) {
                        matchStats['yellowTrinketPlaced'].push(f);
                    }
                }
            }
            /* buildings */
            if(event['teamId'] == teamID) {
                if (event['eventType'] == "BUILDING_KILL") {
                    if (event['towerType'] == "BASE_TURRET") {
                        matchStats['baseTurrets'][event['laneType']] = f;
                    }
                    if (event['towerType'] == "INNER_TURRET") {
                        matchStats['innerTurrets'][event['laneType']] = f;
                    }
                    if (event['towerType'] == "NEXUS_TURRET") {
                        matchStats['nexusTurrets'][event['laneType']] = f;
                    }
                    if (event['towerType'] == "OUTER_TURRET") {
                        matchStats['outerTurrets'][event['laneType']] = f;
                    }
                    if (event['buildingType'] == "INHIBITOR_BUILDING") {
                        matchStats['inhibitors'][event['laneType']] = f;
                    }
                }

            }
            if (event['eventType'] == "ELITE_MONSTER_KILL"){
                if(((event['killerId'] < 6) && (teamID == 100)) || ((event['killerId'] > 5) && (teamID == 200))){
                    if(event['monsterType'] == "BARON_NASHOR"){
                        matchStats['baronNashor'].push(f);
                    }
                    if(event['monsterType'] == "DRAGON"){
                        matchStats['dragon'].push(f);
                    }
                    if(event['killerId'] == playerID){
                        if(event['monsterType'] == "BLUE_GOLEM"){
                            matchStats['blueGolem'].push(f);
                        }
                        if(event['monsterType'] == "RED_LIZARD"){
                            matchStats['redLizard'].push(f);
                        }
                    }
                }
            }
            /* monsters */

        }
    }

    var whenVWActive = [], whenSWActive = [], whenYTActive = [];
    for(var m=0; m<gameLength; m++){
        whenVWActive[m] = 0;
        whenSWActive[m] = 0;
        whenYTActive[m] = 0;

        // for each ward type see if it is active at this minute
        for(var w=0; w<matchStats['visionWardsPlaced'].length; w++){
            if(matchStats['visionWardsPlaced'][w]>m){
                break;
            }
            if(doesMinuteFallsWithinWard(matchStats['level'][m], m, matchStats['visionWardsPlaced'][w], 'vision')){
                whenVWActive[m] += 1;
            }
        }
        if(whenVWActive[m]>3){ whenVWActive[m] = 3; }

        for(var w=0; w<matchStats['sightWardsPlaced'].length; w++){
            if(matchStats['sightWardsPlaced'][w]>m){
                break;
            }
            if(doesMinuteFallsWithinWard(matchStats['level'][m], m, matchStats['sightWardsPlaced'][w], 'sight')){
                whenSWActive[m] += 1;
            }
        }
        if(whenSWActive[m]>3){ whenSWActive[m] = 3; }

        for(var w=0; w<matchStats['yellowTrinketPlaced'].length; w++){
            if(matchStats['yellowTrinketPlaced'][w]>m){
                break;
            }
            if(doesMinuteFallsWithinWard(matchStats['level'][m], m, matchStats['yellowTrinketPlaced'][w], 'yellow')){
                whenYTActive[m] += 1;
            }
        }
        if(whenYTActive[m]>3){ whenYTActive[m] = 3; }
    }
    matchStats['visionWardsPlaced'] = whenVWActive;
    matchStats['sightWardsPlaced'] = whenSWActive;
    matchStats['yellowTrinketPlaced'] = whenYTActive;

    callback( matchStats);
};

router.get('/matchStatistics/:summonerName', function(req,res,next){

    grabSummonerID(req.params.summonerName, function(matchStats){
        res.json({matchStatistics:matchStats});
    });

});



module.exports = router;