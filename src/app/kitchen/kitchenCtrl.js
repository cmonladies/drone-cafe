'use strict';

angular
    .module('restorauntOrderingSystemApp')
    .controller('kitchenCtrl', function(CookingService, $scope) {


        let vm = this;
        vm.cookingService = CookingService;


        vm.cookingService.cookInitialization();
        vm.cookingService.getOrders().then(function (result) {

            vm.ordersList = {
                ordersInProgress: result.ordersInProgress,
                awaitingOrders: result.awaitingOrders
            };

        $scope.$apply();

        });



        vm.startCooking = (order) => {

            vm.cookingService.startCooking(order._id).then(function (result) {
                if(result.status = "OK")
                {
                    vm.ordersList.ordersInProgress.push(result.order);
                    vm.ordersList.awaitingOrders.splice(vm.ordersList.awaitingOrders.indexOf(order),1);
                    $scope.$apply();
                }
            });
        };

        vm.startDelivery = (order) => {

            vm.cookingService.startDelivery(order._id).then(function (result) {
                if(result = "OK")
                {
                    vm.ordersList.ordersInProgress.splice(order,1);
                    $scope.$apply();
                }
            });
        }

        vm.getIncomingOrdes = () => {

            vm.cookingService.getIncomingOrdes().then(function (newOrder) {

                console.log(newOrder);
                vm.ordersList.awaitingOrders.push(newOrder);
                $scope.$apply();
                vm.getIncomingOrdes ();

            });
        };

        vm.getIncomingOrdes ();




//Подбор лого заказа
        vm.chooseLogo = (item) => {

            switch(item.type) {

                case 'drinks' :
                    return 'local_bar'
                    break;

                case 'mainCourse' :
                    return 'restaurant_menu'
                    break;

                case 'desert' :
                    return 'cake'
                    break;
            }

        };




});
