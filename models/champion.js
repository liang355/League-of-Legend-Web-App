var mongoose = require('mongoose');

var ChampionSchema = new mongoose.Schema({
    id:String,
    name:String
});

module.exports = mongoose.model('Champion', ChampionSchema);