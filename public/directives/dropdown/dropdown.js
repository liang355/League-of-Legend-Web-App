

app.directive('championDropdown', ['champions','expressApi', function(champions, expressApi){
    return {
        restrict: 'E',
        scope:{
            selected: "=ngModel"
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
                console.log(champions, data);
            });
        }
    };
}]);

app.directive('tierDropdown', ['expressApi', function(expressApi){
    return {
        restrict: 'E',
        scope:{
            selected: "=ngModel"
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
            selected: "=ngModel"
        },
        templateUrl:'directives/dropdown/roles.html',
        controller:function($scope){

            expressApi.getRoles(function(roles){
                $scope.roles = roles;
            });
        }
    };
}]);