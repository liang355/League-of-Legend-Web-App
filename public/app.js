

var app = angular.module("LolApp", ['ngSanitize','ui.select']);


app.controller('MainCtrl', ['$scope', 'championStatistics', 'expressApi', function($scope, championStatistics, expressApi){
    $scope.header = "LoLlipop";

    //required values
    $scope.dropdown = {};

    var initFormFields = function() {
        $scope.dropdown.champion = "";
        $scope.dropdown.tier = "";
        $scope.dropdown.role = "";
    };

    var init = function(){
        initFormFields();
        $scope.showStart = false;

        $scope.showCurrentGame = true;
        $scope.showStatic = false;
    };


    $scope.staticSite = function(){
        $scope.showCurrentGame = false;
        $scope.showStatic = true;
    };

    $scope.currentGameSite = function(){
        $scope.showCurrentGame = true;
        $scope.showStatic = false;
    };

    $scope.setChampion = function(){
        $scope.$broadcast("setChampionDropdown", {name: "Katarina"});
    };


    init();
}]);


app.controller('StaticCtrl', ['$scope', 'championStatistics', 'expressApi', function($scope, championStatistics, expressApi) {
    //TODO:rewrite callback to display data however you please
    var doStuffWithData = function(data){
        $scope.data = JSON.stringify(data, null, 4);

        if(!data){ //WHY NO U WARK????? RAWR!!!!! ANGURY!!!!
            print("NO STATS FUR DAT!");
            return;
        }
        //call function from lindGraph.js
        //"data" is the returned object championStatistics
        makeLineGraph(data);
        $scope.showStart = true;
    };

    $scope.getData = function(dropdown){
        championStatistics.getStatistics(dropdown.champion.name, dropdown.tier.id, dropdown.role.id, doStuffWithData);
    };

}]);

app.controller('CurrentCtrl', ['$scope', '$interval', '$timeout', 'championStatistics', 'expressApi', function($scope, $interval, $timeout, championStatistics, expressApi) {
    var status = {
        SEARCHING:'wait',
        NO_SUMMONER:'noplayer',
        NO_GAME:'nogame',
        LOADING_GAME:'gameloading'
    };

    var getParticipant = function(data){
        var id = data.requestedID;
        for (var i = 0; i < data.participants.length; i++){
            var participant = data.participants[i];
            if (participant.summonerId === id){
                return participant;
            }
        }
    };

    expressApi.getTiers(function(tiers){
        $scope.tiers = tiers;
    });

    $scope.searchMade = false;

    var interval;
    var gameStartTime;
    var searchText;
    var user;
    $scope.animateClass = [];

    var setChampionStatisticModel = function(data){
        $scope.championStatModel = data;
    };

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

    var roles = [
        {id:"SUPPORT", name:"Support"},
        {id:"JUNGLE", name:"Jungle"},
        {id:"ADC", name:"ADC"},
        {id:"MIDDLE", name:"Middle"},
        {id:"TOP", name:"Top"}
    ];

    $scope.benchmarkLeague = {};
    $scope.benchmarkRole = {};
    var setSummonerInfo = function(data, summonerId){
        var numeric;
        if (!data){
            numeric = 1;
        }
        else {
            var tier, division, image, name;
            for (var q = 0; q < data.length; q++) {
                if (data[q]['queue'] == "RANKED_SOLO_5x5") {
                    tier = data[q]['tier'];
                    for (var i = 0; i < data[q]['entries'].length; i++) {
                        var id = data[q]['entries'][i].playerOrTeamId;
                        if (id == summonerId) {
                            division = data[q]['entries'][i]['division'];
                            break;
                        }
                    }
                    numeric = tierN[tier] + divisionN[division];
                    break;
                }
            }
        }
        for (var i = 0; i < $scope.tiers.length; i++){
            if ($scope.tiers[i]["id"] == numeric){
                $scope.benchmarkLeague = $scope.tiers[i];
            }
        }
    };

    var setStats = function(data){
        $timeout(function(){
            console.log("here", data);
            if (data.id) {
                $scope.championStatModel = data;
                $scope.animateStatClass = "slide-up";
                $scope.showStats = true;
                $scope.status = "";
            }
            else {
                $scope.status = "No benchmarks for this role";
            }
        }, 1000);
    };

    var statsOut = function(){
        $scope.animateStatClass = "slide-down";
        $timeout(function(){
            $scope.showStats = false;
        }, 500);
        $scope.status = "Getting Benchmarks";
    }

    $scope.setTier = function(tier){
        $scope.benchmarkLeague = tier;
        if ($scope.champion && $scope.benchmarkLeague && $scope.benchmarkRole) {
            championStatistics.getStatistics($scope.champion.name, tier.id, $scope.benchmarkRole.id, setStats);
        }
        statsOut();
    };

    $scope.setRole= function(role){
        $scope.benchmarkRole = role;
        if ($scope.champion && $scope.benchmarkLeague && $scope.benchmarkRole) {
            championStatistics.getStatistics($scope.champion.name, $scope.benchmarkLeague.id, role.id, setStats);
        }
        statsOut();
    };

    var setRole = function(data){
        for (var i = 0; i < roles.length; i++){
            if (roles[i].id === data[0]._id){
                $scope.benchmarkRole = roles[i];
            }
        }
        championStatistics.getStatistics($scope.champion.name, $scope.benchmarkLeague.id, $scope.benchmarkRole.id, setStats);
    };

    var setCurrentChampion = function(data){
        $scope.champion = data;
        expressApi.getRoleCount($scope.champion.name, setRole)
    };

    var formatMinutes = function(minutes){
        var actualMinute = Math.floor(minutes);
        var percentOfAMinute = minutes - actualMinute;
        var seconds = Math.round(percentOfAMinute * 60);
        if (seconds < 10){
            seconds = "0"+seconds;
        }
        return actualMinute + ":" + seconds;
    };

    var updateDragonAndBaron = function(time){
        var percentageOfAMinute = time.getSeconds() / 60;
        //dragon
        var count = 0;
        for (var i = 1; i < $scope.championStatModel.dragon.length; i++){
            if ((i % 2) !== 0){
                var dragonTime = $scope.championStatModel.dragon[i];
                var actualTime = time.getMinutes() + percentageOfAMinute;
                count++;
                if (actualTime < dragonTime){
                    $scope.dragonTime = formatMinutes(dragonTime - actualTime);
                    break;
                }
            }
        }
        $scope.dragonCount = count;


        //baron
        var count = 0;
        for (var i = 1; i < $scope.championStatModel.baronNashor.length; i++){
            if ((i % 2) !== 0){
                var baronTime = $scope.championStatModel.baronNashor[i];
                count++;
                if (actualTime < baronTime){
                    $scope.baronTime = formatMinutes(baronTime - actualTime);
                    break;
                }
            }
        }
        $scope.baronCount = count;
    };

    var updateLevel = function(time){
        var getUpperBound = $scope.championStatModel.level[time.getMinutes()+2];
        var getLowerBound = $scope.championStatModel.level[time.getMinutes()+1];
        var getPercentage = time.getSeconds() / 60;
        $scope.level = Math.round(getLowerBound + (getPercentage * (getUpperBound - getLowerBound)));
    }

    var updateWardCount = function(time){
        $scope.yellowTrinketPlaced = $scope.championStatModel.yellowTrinketPlaced[time.getMinutes()+1];
        $scope.sightWardsPlaced = $scope.championStatModel.sightWardsPlaced[time.getMinutes()+1];
        $scope.visionWardsPlaced = $scope.championStatModel.visionWardsPlaced[time.getMinutes()+1];
    };

    var updateCSCount = function(time){
        //lane
        var getUpperBound = $scope.championStatModel.minionsKilled[time.getMinutes()+2];
        var getLowerBound = $scope.championStatModel.minionsKilled[time.getMinutes()+1];
        var getPercentage = time.getSeconds() / 60;
        $scope.laneCount = Math.round(getLowerBound + (getPercentage * (getUpperBound - getLowerBound)));

        //jg
        getUpperBound = $scope.championStatModel.jungleMinionsKilled[time.getMinutes()+2];
        getLowerBound = $scope.championStatModel.jungleMinionsKilled[time.getMinutes()+1];
        $scope.jgCount = Math.round(getLowerBound + (getPercentage * (getUpperBound - getLowerBound)));
    };

    var updateGameTime = function() {
        var date = new Date();
        var gameTime = date.getTime() - gameStartTime;
        $scope.gameTime = new Date(gameTime);
        if ($scope.championStatModel) {
            updateCSCount($scope.gameTime);
            updateWardCount($scope.gameTime);
            updateDragonAndBaron($scope.gameTime);
            updateLevel($scope.gameTime);
        }
    };

    var waitForGameToStart = function(data) {
        if (data.gameStartTime) {
            gameStartTime = data.gameStartTime;
            interval = $interval(updateGameTime, 1000);
        }
        else {
            $timeout(function(){expressApi.getCurrentGame(searchText, waitForGameToStart)}, 10000);
        }
    };

    var count = 0;
    var showWhenReady = function(){
        $timeout(function(){
            if ($scope.championStatModel) {
                $scope.searchMade = true;
                $scope.animateClass = ["slide-up"];
                $scope.status = "";
            }
            else {
                if (count < 3){
                    $scope.status = $scope.status + ".";
                    count++;
                }
                else {
                    count = 0;
                    $scope.status = "Getting Benchmark";
                }
                showWhenReady();
            }
        }, 500);
    };

    var setUpUIForUser = function(data){
        searchText = $scope.summonerSearchText;
        user = getParticipant(data);
        setSummonerInfo(user.league, user.summonerId);
        setCurrentChampion(user.champion);
        $scope.summonerName = user.summonerName;
        waitForGameToStart(data);
        showWhenReady();
    };

    //callback for current game
    var setupCurrentGameUI = function(data){
        if (data.error){
            if (data.error === status.NO_SUMMONER){
                $scope.status = "No summoner by that name was found";
            }
            if (data.error === status.NO_GAME){
                $scope.status = "Summoner is not in a game";
            }
        }
        else {
            $scope.status = "Loading Game";
            setUpUIForUser(data);
        }
    };

    var resetBenchMark = function(){
        $scope.benchmarkLeague = {};
        $scope.benchmarkRole = {};
        $scope.championStatModel = false;
    };
    $scope.getCurrentGameForSummoner = function(){
        if (interval){
            $interval.cancel(interval)
        }
        $scope.animateClass=["slide-down"];
        $timeout(function(){
            $scope.searchMade = false;
            resetBenchMark();
        }, 1000);
        $scope.status = "Searching...";
        expressApi.getCurrentGame($scope.summonerSearchText,setupCurrentGameUI);
    };



    $scope.$on('$destroy', function() {
        $interval.cancel(interval);
    });

}]);