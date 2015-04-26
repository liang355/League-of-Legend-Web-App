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

var doesContainMinute = function(m, anArray){
    for(var a=0; a<anArray.length; a++){
        if(m == anArray[a]){
            return 1;
        }
    }
    return 0;
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
        averagedStats['enemyJungleMinionsKilled'] += stats[i]['enemyJungleMinionsKilled'];
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
    averagedStats['enemyJungleMinionsKilled'] = averagedStats["enemyJungleMinionsKilled"] / stats.length;
    averagedStats['neutralMinionsKilledEnemyJungle'] = averagedStats["neutralMinionsKilledEnemyJungle"] / stats.length;
    averagedStats['neutralMinionsKilledTeamJungle'] = averagedStats["neutralMinionsKilledTeamJungle"] / stats.length;




    //find timeline averages.


    for(var m=0; m<longestGame; m++) {
        var instancesPerMinute_eliteMonsters = {
            redLizard:0,
            blueGolem:0,
            dragon:0,
            baronNashor:0
        };
        var instancesPerMinute_baseTurrets = {
            TOP_LANE:0,
            BOT_LANE:0,
            MID_LANE:0
        };
        var instancesPerMinute_innerTurrets = {
            TOP_LANE:0,
            BOT_LANE:0,
            MID_LANE:0
        };
        var instancesPerMinute_outerTurrets = {
            TOP_LANE:0,
            BOT_LANE:0,
            MID_LANE:0
        };
        var instancesPerMinute_nexusTurrets = {
            TOP_LANE:0,
            BOT_LANE:0,
            MID_LANE:0
        };
        var instancesPerMinute_inhibitors = {
            TOP_LANE:0,
            BOT_LANE:0,
            MID_LANE:0
        };
        for(var i=0; i<stats.length; i++){
            instancesPerMinute_eliteMonsters['redLizard'] += doesContainMinute(m, stats[i]['redLizard']);
            instancesPerMinute_eliteMonsters['blueGolem'] += doesContainMinute(m, stats[i]['blueGolem']);
            instancesPerMinute_eliteMonsters['dragon'] += doesContainMinute(m, stats[i]['dragon']);
            instancesPerMinute_eliteMonsters['baronNashor'] += doesContainMinute(m, stats[i]['baronNashor']);

            instancesPerMinute_baseTurrets['TOP_LANE'] += isThisEqual(m, stats[i]['baseTurrets'][0]['TOP_LANE']);
            instancesPerMinute_baseTurrets['BOT_LANE'] += isThisEqual(m, stats[i]['baseTurrets'][0]['BOT_LANE']);
            instancesPerMinute_baseTurrets['MID_LANE'] += isThisEqual(m, stats[i]['baseTurrets'][0]['MID_LANE']);

            instancesPerMinute_innerTurrets['TOP_LANE'] += isThisEqual(m, stats[i]['innerTurrets'][0]['TOP_LANE']);
            instancesPerMinute_innerTurrets['BOT_LANE'] += isThisEqual(m, stats[i]['innerTurrets'][0]['BOT_LANE']);
            instancesPerMinute_innerTurrets['MID_LANE'] += isThisEqual(m, stats[i]['innerTurrets'][0]['MID_LANE']);

            instancesPerMinute_outerTurrets['TOP_LANE'] += isThisEqual(m, stats[i]['outerTurrets'][0]['TOP_LANE']);
            instancesPerMinute_outerTurrets['BOT_LANE'] += isThisEqual(m, stats[i]['outerTurrets'][0]['BOT_LANE']);
            instancesPerMinute_outerTurrets['MID_LANE'] += isThisEqual(m, stats[i]['outerTurrets'][0]['MID_LANE']);

            instancesPerMinute_nexusTurrets['TOP_LANE'] += isThisEqual(m, stats[i]['nexusTurrets'][0]['TOP_LANE']);
            instancesPerMinute_nexusTurrets['BOT_LANE'] += isThisEqual(m, stats[i]['nexusTurrets'][0]['BOT_LANE']);
            instancesPerMinute_nexusTurrets['MID_LANE'] += isThisEqual(m, stats[i]['nexusTurrets'][0]['MID_LANE']);

            instancesPerMinute_inhibitors['TOP_LANE'] += isThisEqual(m, stats[i]['inhibitors'][0]['TOP_LANE']);
            instancesPerMinute_inhibitors['BOT_LANE'] += isThisEqual(m, stats[i]['inhibitors'][0]['BOT_LANE']);
            instancesPerMinute_inhibitors['MID_LANE'] += isThisEqual(m, stats[i]['inhibitors'][0]['MID_LANE']);

        }


        averagedStats['blueGolem'][m+1] =  instancesPerMinute_eliteMonsters['blueGolem'] / stats.length;
        averagedStats['redLizard'][m+1] = instancesPerMinute_eliteMonsters['redLizard'] / stats.length;
        averagedStats['dragon'][m+1] = instancesPerMinute_eliteMonsters['dragon'] / stats.length;
        averagedStats['baronNashor'][m+1] = instancesPerMinute_eliteMonsters['baronNashor'] / stats.length;

        averagedStats['baseTurrets']['TOP_LANE'][m+1] = instancesPerMinute_baseTurrets['TOP_LANE'] / stats.length;
        averagedStats['baseTurrets']['BOT_LANE'][m+1] = instancesPerMinute_baseTurrets['BOT_LANE'] / stats.length;
        averagedStats['baseTurrets']['MID_LANE'][m+1] = instancesPerMinute_baseTurrets['MID_LANE'] / stats.length;

        averagedStats['innerTurrets']['TOP_LANE'][m+1] = instancesPerMinute_innerTurrets['TOP_LANE'] / stats.length;
        averagedStats['innerTurrets']['BOT_LANE'][m+1] = instancesPerMinute_innerTurrets['BOT_LANE'] / stats.length;
        averagedStats['innerTurrets']['MID_LANE'][m+1] = instancesPerMinute_innerTurrets['MID_LANE'] / stats.length;

        averagedStats['outerTurrets']['TOP_LANE'][m+1] = instancesPerMinute_outerTurrets['TOP_LANE'] / stats.length;
        averagedStats['outerTurrets']['BOT_LANE'][m+1] = instancesPerMinute_outerTurrets['BOT_LANE'] / stats.length;
        averagedStats['outerTurrets']['MID_LANE'][m+1] = instancesPerMinute_outerTurrets['MID_LANE'] / stats.length;

        averagedStats['nexusTurrets']['TOP_LANE'][m+1] = instancesPerMinute_nexusTurrets['TOP_LANE'] / stats.length;
        averagedStats['nexusTurrets']['BOT_LANE'][m+1] = instancesPerMinute_nexusTurrets['BOT_LANE'] / stats.length;
        averagedStats['nexusTurrets']['MID_LANE'][m+1] = instancesPerMinute_nexusTurrets['MID_LANE'] / stats.length;

        averagedStats['inhibitors']['TOP_LANE'][m+1] = instancesPerMinute_inhibitors['TOP_LANE'] / stats.length;
        averagedStats['inhibitors']['BOT_LANE'][m+1] = instancesPerMinute_inhibitors['BOT_LANE'] / stats.length;
        averagedStats['inhibitors']['MID_LANE'][m+1] = instancesPerMinute_inhibitors['MID_LANE'] / stats.length;

    }



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
                oneTimeStamp['visionWardsPlaced'] += stats[i]['visionWardsPlaced'][m];
                oneTimeStamp['sightWardsPlaced'] += stats[i]['sightWardsPlaced'][m];
                oneTimeStamp['yellowTrinketPlaced'] += stats[i]['yellowTrinketPlaced'][m];
                oneTimeStamp['jungleMinionsKilled'] += stats[i]['jungleMinionsKilled'][m];
                oneTimeStamp['minionsKilled'] += stats[i]['minionsKilled'][m];
                oneTimeStamp['level'] += stats[i]['level'][m];
                oneTimeStamp['totalGold'] += stats[i]['totalGold'][m];
                oneTimeStamp['currentGold'] += stats[i]['currentGold'][m];

            }
        }

        oneTimeStamp['visionWardsPlaced'] = oneTimeStamp['visionWardsPlaced'] / instancesPerMinute;
        if((oneTimeStamp['visionWardsPlaced'] == null) || (oneTimeStamp['visionWardsPlaced'] == NaN)){
            oneTimeStamp['visionWardsPlaced'] = 0;
        }
        oneTimeStamp['sightWardsPlaced'] = oneTimeStamp['sightWardsPlaced'] / instancesPerMinute;
        if((oneTimeStamp['sightWardsPlaced'] == null) || (oneTimeStamp['sightWardsPlaced'] == NaN)){
            oneTimeStamp['sightWardsPlaced'] = 0;
        }
        oneTimeStamp['yellowTrinketPlaced'] = oneTimeStamp['yellowTrinketPlaced'] / instancesPerMinute;
        if((oneTimeStamp['yellowTrinketPlaced'] == null) || (oneTimeStamp['yellowTrinketPlaced'] == NaN)){
            oneTimeStamp['yellowTrinketPlaced'] = 0;
        }
        oneTimeStamp['jungleMinionsKilled'] = oneTimeStamp['jungleMinionsKilled'] / instancesPerMinute;
        oneTimeStamp['minionsKilled'] = oneTimeStamp['minionsKilled'] / instancesPerMinute;

        oneTimeStamp['level'] = oneTimeStamp['level'] / instancesPerMinute;
        oneTimeStamp['totalGold'] = oneTimeStamp['totalGold'] / instancesPerMinute;
        oneTimeStamp['currentGold'] = oneTimeStamp['currentGold'] / instancesPerMinute;


        averagedStats['instancesPerMinute'][m+1] = instancesPerMinute;
        averagedStats['visionWardsPlaced'][m+1] = oneTimeStamp['visionWardsPlaced'];
        averagedStats['sightWardsPlaced'][m+1] = oneTimeStamp['sightWardsPlaced'];
        averagedStats['yellowTrinketPlaced'][m+1] = oneTimeStamp['yellowTrinketPlaced'];
        averagedStats['jungleMinionsKilled'][m+1] = oneTimeStamp['jungleMinionsKilled'];
        averagedStats['minionsKilled'][m+1] = oneTimeStamp['minionsKilled'];
        averagedStats['level'][m+1] = oneTimeStamp['level'];
        averagedStats['totalGold'][m+1] = oneTimeStamp['totalGold'];
        averagedStats['currentGold'][m+1] = oneTimeStamp['currentGold'];
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
       // console.log(averagedStats);

        res.json(averagedStats);
    });
});



module.exports = router;