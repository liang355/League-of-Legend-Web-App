

var app = angular.module("LolApp", ['ngSanitize','ui.select']);


app.controller('MainCtrl', ['$scope', 'championStatistics', function($scope, championStatistics){
    $scope.header = "Lol App";

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
    };

    //TODO:rewrite callback to display data however you please
    var doStuffWithData = function(data){
        $scope.data = JSON.stringify(data, null, 4);

        //call function from lindGraph.js
        makeLineGraph(data["timeline"]);
        $scope.showStart = true;
    };

    $scope.getData = function(dropdown){
        championStatistics.getStatistics(dropdown.champion, dropdown.tier, dropdown.role, doStuffWithData);
    };

    init();
}]);

