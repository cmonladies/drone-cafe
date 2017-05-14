'use strict';

angular
    .module('restorauntOrderingSystemApp')
    .controller('restorauntOrderingSystemCtrl', function(AccountService) {

        var vm = this;

        vm.user = {
                name: null,
                email: null
            };

        vm.accountService = AccountService;

        vm.login = () => {

            vm.accountService.login(vm.user);

        };

});
