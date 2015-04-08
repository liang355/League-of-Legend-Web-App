/** app for collecting data **/
var dbApp = angular.module("ScraperApp", []);


dbApp.controller('ScraperCtrl', ['$scope', 'RiotApi', function($scope, RiotApi){
    $scope.header = "Scraper Interface";


    $scope.requestChampions = function(){
        var champions = RiotApi.staticChampionData();
        champions.success(function(data){
            setResponse(data);
        });
    };

    //response
    $scope.response = {};
    var setResponse = function(data){
        $scope.response = JSON.stringify(data, null, "   ");
    };

}]);



dbApp.factory('RiotApi',['$http', function($http){
    var apiKey = "10ae7599-118a-41cc-a837-9e0fe2f8d737";
    var region = "na";
    var host = "https://na.api.pvp.net";

    //paths
    var championPath = "/api/lol/static-data/"+region+"/v1.2/champion?api_key=";

    var apiRequest = function(path){
        return function(){
            return $http.get(host+path+apiKey);
        };
    };

    return {
        staticChampionData:apiRequest(championPath)
    };
}]);