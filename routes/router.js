var express = require('express');
var router = express.Router();

var Champion = require('../models/champion.js');
var Summoner = require('../models/summoner.js');
var Match = require('../models/match.js');
var ChampionStatistics = require('../models/championstatistics.js');

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
        console.log("dragon, average: "+average+" instances:"+instances);
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

        avgbaseTurrets_T += stats[i]['baseTurrets'][0]['TOP_LANE'];
        if(stats[i]['baseTurrets'][0]['TOP_LANE']!= 0){ baseTurrets_T ++; }
        avgbaseTurrets_B += stats[i]['baseTurrets'][0]['BOT_LANE'];
        if(stats[i]['baseTurrets'][0]['BOT_LANE']!= 0){ baseTurrets_B ++; }
        avgbaseTurrets_M += stats[i]['baseTurrets'][0]['MID_LANE'];
        if(stats[i]['baseTurrets'][0]['MID_LANE']!= 0){ baseTurrets_M ++; }

        avginnerTurrets_T += stats[i]['innerTurrets'][0]['TOP_LANE'];
        if(stats[i]['innerTurrets'][0]['TOP_LANE']!= 0){ innerTurrets_T ++; }
        avginnerTurrets_B += stats[i]['innerTurrets'][0]['BOT_LANE'];
        if(stats[i]['innerTurrets'][0]['BOT_LANE']!= 0){ innerTurrets_B ++; }
        avginnerTurrets_M += stats[i]['innerTurrets'][0]['MID_LANE'];
        if(stats[i]['innerTurrets'][0]['MIN_LANE']!= 0){ innerTurrets_M ++; }

        avgouterTurrets_T +=stats[i]['outerTurrets'][0]['TOP_LANE'];
        if(stats[i]['outerTurrets'][0]['TOP_LANE']!= 0){ outerTurrets_T ++; }
        avgouterTurrets_B +=stats[i]['outerTurrets'][0]['BOT_LANE'];
        if(stats[i]['outerTurrets'][0]['BOT_LANE']!= 0){ outerTurrets_B ++; }
        avgouterTurrets_M +=stats[i]['outerTurrets'][0]['MID_LANE'];
        if(stats[i]['outerTurrets'][0]['MID_LANE']!= 0){ outerTurrets_M ++; }

        avgnexusTurrets_T +=stats[i]['nexusTurrets'][0]['TOP_LANE'];
        if(stats[i]['nexusTurrets'][0]['TOP_LANE']!= 0){ nexusTurrets_T ++; }
        avgnexusTurrets_B +=stats[i]['nexusTurrets'][0]['BOT_LANE'];
        if(stats[i]['nexusTurrets'][0]['BOT_LANE']!= 0){ nexusTurrets_B ++; }
        avgnexusTurrets_M +=stats[i]['nexusTurrets'][0]['MID_LANE'];
        if(stats[i]['nexusTurrets'][0]['MID_LANE']!= 0){ nexusTurrets_M ++; }

        avginhibitors_T += stats[i]['inhibitors'][0]['TOP_LANE'];
        if(stats[i]['inhibitors'][0]['TOP_LANE']!= 0){ inhibitors_T ++; }
        avginhibitors_B += stats[i]['inhibitors'][0]['BOT_LANE'];
        if(stats[i]['inhibitors'][0]['BOT_LANE']!= 0){ inhibitors_B ++; }
        avginhibitors_M += stats[i]['inhibitors'][0]['MID_LANE'];
        if(stats[i]['inhibitors'][0]['MID_LANE']!= 0){ inhibitors_M ++; }

    }
    instancesPerMinute_baseTurrets['TOP_LANE'].push(avgbaseTurrets_T / baseTurrets_T);
    instancesPerMinute_baseTurrets['BOT_LANE'].push(avgbaseTurrets_B / baseTurrets_B);
    instancesPerMinute_baseTurrets['MID_LANE'].push(avgbaseTurrets_M / baseTurrets_M);

    instancesPerMinute_innerTurrets['TOP_LANE'].push(avginnerTurrets_T / innerTurrets_T);
    instancesPerMinute_innerTurrets['BOT_LANE'].push(avginnerTurrets_B / innerTurrets_B);
    instancesPerMinute_innerTurrets['MID_LANE'].push(avginnerTurrets_M / innerTurrets_M);

    instancesPerMinute_outerTurrets['TOP_LANE'].push(avgouterTurrets_T / outerTurrets_T);
    instancesPerMinute_outerTurrets['BOT_LANE'].push(avgouterTurrets_B / outerTurrets_B);
    instancesPerMinute_outerTurrets['MID_LANE'].push(avgouterTurrets_M / outerTurrets_M);

    instancesPerMinute_nexusTurrets ['TOP_LANE'].push(avgnexusTurrets_T / nexusTurrets_T);
    instancesPerMinute_nexusTurrets['BOT_LANE'].push(avgnexusTurrets_B / nexusTurrets_B);
    instancesPerMinute_nexusTurrets['MID_LANE'].push(avgnexusTurrets_M / nexusTurrets_M);

    instancesPerMinute_inhibitors['TOP_LANE'].push(avginhibitors_T / inhibitors_T);
    instancesPerMinute_inhibitors['BOT_LANE'].push(avginhibitors_B / inhibitors_B);
    instancesPerMinute_inhibitors['MID_LANE'].push(avginhibitors_M / inhibitors_M);


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
        averagedStats['currentGold'][m+1] = whatIsTheHighestNumber(oneTimeStamp['currentGold'],averagedStats['currentGold'][m]);


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

        var averagedStats = calculateAverages(stats);
       //console.log(averagedStats);

        res.json(averagedStats);
    });
});



module.exports = router;