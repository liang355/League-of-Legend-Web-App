

app.directive('championDropdown', function(){
    return {
        restrict: 'E',
        scope:{
            selected: "=ngModel"
        },
        templateUrl:'directives/dropdown/champions.html',
        controller:function($scope){
            $scope.champions = [{name: "Aatrox"}, {name:"Akali"}];
        }
    };
});

app.directive('tierDropdown', function(){
    return {
        restrict: 'E',
        scope:{
            selected: "=ngModel"
        },
        templateUrl:'directives/dropdown/tiers.html',
        controller:function($scope){

            //TODO: populate
            $scope.tiers = [{name: "Bronze I"}, {name:"Gold I"}];
        }
    };
});


app.directive('roleDropdown', function(){
    return {
        restrict: 'E',
        scope:{
            selected: "=ngModel"
        },
        templateUrl:'directives/dropdown/roles.html',
        controller:function($scope){

            //TODO: populate
            $scope.roles = [{name: "Support"}, {name:"Jungle"}];
        }
    };
});