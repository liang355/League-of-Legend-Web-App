/** app for collecting data **/
var dbApp = angular.module("ScraperApp", []);


dbApp.controller('DBInterface', ['$scope', 'RiotApi', function($scope, RiotApi){
    $scope.header = "Scraper Interface";

}]);



