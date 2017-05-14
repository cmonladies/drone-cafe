'use strict';

angular
    .module('restorauntOrderingSystemApp')
    .factory('MenuService', function($http) {

        return {

            getMenu: function() {
                return $http.get('menu.json');
            }

        }

    });