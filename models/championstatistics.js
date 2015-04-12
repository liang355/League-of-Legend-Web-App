/**
 * Created by holland on 4/9/2015.
 */
var mongoose = require('mongoose');

var ChampionStatisticsSchema = new mongoose.Schema({
    id:String,
    name:String,

    role:String,
    tier:Number,

    numberOfGames:Number,

    assists:Number,
    kills:Number,
    deaths:Number,
    damage:Number,
    heals:Number,
    damageTaken:Number,
    wardsKilled:Number,
    pinkWardsPlaced:Number,

    wardsPlacedByM:JSON,
    csByM:JSON,
    baronByM:JSON,
    dragonByM:JSON,
    elderLizardByM:JSON,
    ancientGolemByM:JSON
});
module.exports = mongoose.model('ChampionStatistics', ChampionStatisticsSchema);