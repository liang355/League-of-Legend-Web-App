

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
        $scope.showCounter = false;
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
        if(data['error']){
            print(data['error']);
        }
        //call function from lindGraph.js
        //"data" is the returned object championStatistics
        makeLineGraph(data);

        $scope.showStart = true;
        $scope.showCounter = true;
        document.getElementById("cs").innerHTML = "0";
        console.log(data);
    };

    var doStuffWithMatch = function(data){
        championStatistics.getStatistics(data[], data[], data["role"], doStuffWithData);
    };

    $scope.getLastMatch = function(){
        expressApi.getMatchStatistics($scope.summonerNameSearch, doStuffWithMatch);
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
        var tier, division, numeric, image, name;
        for(var q=0; q<data.length; q++){
            if(data[q]['queue']=="RANKED_SOLO_5x5"){
                tier = data[q]['tier'];
                for (var i = 0; i < data[q]['entries'].length; i++){
                    var id = data[q]['entries'][i].playerOrTeamId;
                    if (id == summonerId){
                        division = data[q]['entries'][i]['division'];
                        break;
                    }
                }
                numeric = tierN[tier] + divisionN[division];
                break;
            }
        }
        for (var i = 0; i < $scope.tiers.length; i++){
            if ($scope.tiers[i]["id"] == numeric){
                $scope.benchmarkLeague = $scope.tiers[i];
            }
        }
    };

    var setStats = function(data){
        $scope.championStatModel = data;
        $scope.animateStatClass = "slide-up";
        $scope.showStats = true;
        $scope.status = "";
    };

    var statsOut = function(){
        $scope.animateStatClass = "slide-down";
        $timeout(function(){
            $scope.showStats = false;
        }, 500);
        $scope.status = "Getting Benchmarks";
    }

    $scope.setTier = function(tier){
        if ($scope.champion && $scope.benchmarkLeague && $scope.benchmarkRole) {
            championStatistics.getStatistics($scope.champion.name, tier.id, $scope.benchmarkRole.id, setStats);
        }
        statsOut();
    };

    $scope.setRole= function(role){
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

    var updateWardCount = function(time){
        $scope.yellowTrinketPlaced = $scope.championStatModel.yellowTrinketPlaced[time.getMinutes()+1];
        $scope.sightWardsPlaced = $scope.championStatModel.sightWardsPlaced[time.getMinutes()+1];
        $scope.visionWardsPlaced = $scope.championStatModel.visionWardsPlaced[time.getMinutes()+1];
    };

    var updateCSCount = function(time){
        var getUpperBound = $scope.championStatModel.minionsKilled[time.getMinutes()+2];
        var getLowerBound = $scope.championStatModel.minionsKilled[time.getMinutes()+1];
        var getPercentage = time.getSeconds() / 60;
        $scope.csCount = Math.round(getLowerBound + (getPercentage * (getUpperBound - getLowerBound)));
    };

    var updateGameTime = function() {
        var date = new Date();
        var gameTime = date.getTime() - gameStartTime;
        $scope.gameTime = new Date(gameTime);
        if ($scope.championStatModel) {
            updateCSCount($scope.gameTime);
            updateWardCount($scope.gameTime);
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