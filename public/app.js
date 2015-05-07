

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
        championStatistics.getStatistics(dropdown.champion, dropdown.tier, dropdown.role, doStuffWithData);
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

    $scope.searchMade = false;

    var interval;
    var gameStartTime;
    var searchText;
    var user;
    var updateGameTime = function() {
        var date = new Date();
        var gameTime = date.getTime() - gameStartTime;
        $scope.gameTime = new Date(gameTime);
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

    var setUpUIForUser = function(data){
        searchText = $scope.summonerSearchText;
        user = getParticipant(data);

        $scope.summonerName = user.summonerName;
        waitForGameToStart(data);
    };

    //callback for current game
    var setupCurrentGameUI = function(data){
        if (data.error){
            if (data.error === status.NO_SUMMONER){
                $scope.status = status.NO_SUMMONER;
            }
            if (data.error === status.NO_GAME){
                $scope.status = status.NO_GAME;
            }
        }
        else {
            $scope.searchStatus = "";
            $scope.searchMade = true;
            setUpUIForUser(data);
        }
    };

    $scope.getCurrentGameForSummoner = function(){
        $scope.searchStatus = true;
        $scope.status = status.SEARCHING;
        expressApi.getCurrentGame($scope.summonerSearchText,setupCurrentGameUI);
    };



    $scope.$on('$destroy', function() {
        interval.cancel(stopTime);
    });

}]);