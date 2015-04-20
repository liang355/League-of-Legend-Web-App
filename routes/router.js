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

var calculateAverages = function(stats){

    var averagedStats = {
        id:stats[0]['id'],
        name:stats[0]['name'],
        role:stats[0]['role'],
        tier:stats[0]['tier'],
        numberOfGames:stats.length,
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
        minionsKilled:0,
        enemyJungleMinionsKilled:0,
        timeline : {
            visionWardsPlaced : ['visionWardsPlaced'],
            sightWardsPlaced : ['sightWardsPlaced'],
            yellowTrinketPlaced : ['yellowTrinketPlaced'],
            jungleMinionsKilled : ['jungleMinionsKilled'],
            minionsKilled : ['minionsKilled'],
            level : ['level'],
            totalGold : ['totalGold'],
            currentGold : ['currentGold']
        }
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
        averagedStats['minionsKilled'] += stats[i]['minionsKilled'];
        averagedStats['enemyJungleMinionsKilled'] += stats[i]['enemyJungleMinionsKilled'];
        if(longestGame < stats[i]['timeline'].length){
            longestGame = stats[i]['timeline'].length;
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
    averagedStats['minionsKilled'] = averagedStats["minionsKilled"] / stats.length;
    averagedStats['enemyJungleMinionsKilled'] = averagedStats["enemyJungleMinionsKilled"] / stats.length;




    //find timeline averages.


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
            if(m<stats[i]['timeline'].length){
                instancesPerMinute ++;
                oneTimeStamp['visionWardsPlaced'] += stats[i]['timeline'][m]['visionWardsPlaced'];
                oneTimeStamp['sightWardsPlaced'] += stats[i]['timeline'][m]['sightWardsPlaced'];
                oneTimeStamp['yellowTrinketPlaced'] += stats[i]['timeline'][m]['yellowTrinketPlaced'];
                oneTimeStamp['jungleMinionsKilled'] += stats[i]['timeline'][m]['jungleMinionsKilled'];
                oneTimeStamp['minionsKilled'] += stats[i]['timeline'][m]['minionsKilled'];
                oneTimeStamp['level'] += stats[i]['timeline'][m]['level'];
                oneTimeStamp['totalGold'] += stats[i]['timeline'][m]['totalGold'];
                oneTimeStamp['currentGold'] += stats[i]['timeline'][m]['currentGold'];

            }
        }

        oneTimeStamp['visionWardsPlaced'] = oneTimeStamp['visionWardsPlaced'] / instancesPerMinute;
        oneTimeStamp['sightWardsPlaced'] = oneTimeStamp['sightWardsPlaced'] / instancesPerMinute;
        oneTimeStamp['yellowTrinketPlaced'] = oneTimeStamp['yellowTrinketPlaced'] / instancesPerMinute;
        oneTimeStamp['jungleMinionsKilled'] = oneTimeStamp['jungleMinionsKilled'] / instancesPerMinute;
        oneTimeStamp['minionsKilled'] = oneTimeStamp['minionsKilled'] / instancesPerMinute;
        oneTimeStamp['level'] = oneTimeStamp['level'] / instancesPerMinute;
        oneTimeStamp['totalGold'] = oneTimeStamp['totalGold'] / instancesPerMinute;
        oneTimeStamp['currentGold'] = oneTimeStamp['currentGold'] / instancesPerMinute;

        averagedStats['timeline']['visionWardsPlaced'][m+1] = oneTimeStamp['visionWardsPlaced'];
        averagedStats['timeline']['sightWardsPlaced'][m+1] = oneTimeStamp['sightWardsPlaced'];
        averagedStats['timeline']['yellowTrinketPlaced'][m+1] = oneTimeStamp['yellowTrinketPlaced'];
        averagedStats['timeline']['jungleMinionsKilled'][m+1] = oneTimeStamp['jungleMinionsKilled'];
        averagedStats['timeline']['minionsKilled'][m+1] = oneTimeStamp['minionsKilled'];
        averagedStats['timeline']['level'][m+1] = oneTimeStamp['level'];
        averagedStats['timeline']['totalGold'][m+1] = oneTimeStamp['totalGold'];
        averagedStats['timeline']['currentGold'][m+1] = oneTimeStamp['currentGold'];
    }

    return averagedStats;

};

router.get('/championstatistics/:tierw/:name/:rolew', function(req, res, next){
    console.log("routing");
    ChampionStatistics.find({'tier':req.params.tierw, 'name':req.params.name, 'role':req.params.rolew}, function(err, stats){
        if(err){
            return next(err);
        }

        var averagedStats = calculateAverages(stats);
        console.log(averagedStats);

        res.json(averagedStats);
    });
});



module.exports = router;