/**
 * Created by holland on 4/9/2015.
 */
var mongoose = require('mongoose');

var Timeline = new mongoose.Schema({
    minute:Number,
    visionWardsPlaced:Number,
    sightWardsPlaced:Number,
    yellowTrinketPlaced: Number,
    jungleMinionsKilled:Number,
    minionsKilled:Number,
    level:Number,
    totalGold:Number,
    currentGold:Number
});

var RawData = new mongoose.Schema({
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
    wardsKilled:Number,
    wardsPlaced:Number,
    minionsKilled:Number,
    enemyJungleMinionsKilled:Number,
    timeline: [ Timeline ]
});


var ChampionStatisticsSchema = new mongoose.Schema({
    id:String,
    name:String,
    role:String,
    tier:Number,
    numberOfGames:Number,
    rawData: [ RawData ]

});

module.exports = mongoose.model('ChampionStatistics', ChampionStatisticsSchema);


