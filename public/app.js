

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


    $scope.staticSite = function(){
        $scope.showCurrentGame = false;
        $scope.showStatic = true;
    };

    $scope.currentGameSite = function(){
        $scope.showCurrentGame = true;
        $scope.showStatic = false;
    };

    var status = {
        SEARCHING:'wait',
        NO_SUMMONER:'nosummoner',
        NO_GAME:'nogame',
        LOADING_GAME:'gameloading'
    };

    var getParticipant = function(data){
        var id = data.requestedID;
        for (var i = 0; i < data.participants.length; i++){
            var participant = data.participants[i];
            console.log(participant);
            if (participant.summonerId === id){
                return participant;
            }
        }
    };

    var setUpUIForUser = function(data){
        console.log(data);
        $scope.user = getParticipant(data);
        $scope.gameStartTime = data.gameStartTime;
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
            setUpUIForUser(data);
        }
    };

    $scope.getCurrentGameForSummoner = function(){
        $scope.searchStatus = true;
        $scope.status = status.SEARCHING;
        expressApi.getCurrentGame($scope.summonerSearchText,setupCurrentGameUI);
    };


    init();
}]);

