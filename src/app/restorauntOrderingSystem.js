var restorauntOrderingSystemApp = angular.module("restorauntOrderingSystemApp", ['ngRoute', 'ngResource'])
          .config( ['$routeProvider', function($routeProvider) {
              $routeProvider
                .when('/', {
                  templateUrl: 'app/welcomeScreen/welcome.html',
                  controller: 'restorauntOrderingSystemCtrl as vm'
                })
                .when('/client', {
                  templateUrl: 'app/Client/client.html',
                  controller: 'clientCtrl as vm'
                })
                .when('/kitchen', {
                  templateUrl: 'app/Kitchen/kitchen.html',
                  controller: 'kitchenCtrl as vm'
                })
                .otherwise({
                  redirectTo: '/notFound',
                  templateUrl: 'app/404/404.html',
                });
              }]);
