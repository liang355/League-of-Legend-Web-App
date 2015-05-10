

app.directive('championDropdown', ['expressApi', function(expressApi){
    return {
        restrict: 'E',
        scope:{
            selected: "=ngModel",
        },
        templateUrl:'directives/dropdown/champions.html',
        controller:function($scope){
            expressApi.getChampions(function(data){
                //convert object to list
                var champions = [];
                for (var key in data){
                    champions.push(data[key]);
                }
                $scope.champions = champions;
            });

            var setChampion = function(name){
                for (var i = 0; i < $scope.champions.length; i++){
                    if ($scope.champions[i].name === name){
                        $scope.selected = $scope.champions[i];
                    }
                }
            };

            $scope.$on("setChampionDropdown", function(event, arg){
                console.log("here2");
                setChampion(arg.name);
            });
        }
    };
}]);

app.directive('tierDropdown', ['expressApi', function(expressApi){
    return {
        restrict: 'E',
        scope:{
            selected: "=ngModel",
            change: "=change"
        },
        templateUrl:'directives/dropdown/tiers.html',
        controller:function($scope){
            expressApi.getTiers(function(tiers){
                $scope.tiers = tiers;
            });
        }
    };
}]);


app.directive('roleDropdown', ['expressApi', function(expressApi){
    return {
        restrict: 'E',
        scope:{
            selected: "=ngModel",
            change: "=change"
        },
        templateUrl:'directives/dropdown/roles.html',
        controller:function($scope){
            expressApi.getRoles(function(roles){
                $scope.roles = roles;
            });
        }
    };
}]);