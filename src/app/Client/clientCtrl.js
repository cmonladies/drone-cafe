'use strict';

angular
    .module('restorauntOrderingSystemApp')
    .controller('clientCtrl', function(AccountService, MenuService, $scope) {


        let vm = this;

        vm.menuService = MenuService;
        vm.accountService = AccountService;

        vm.menuFilter = "mainCourse";
        vm.menuShowFlag = false;

        vm.currentOrder = [];

        vm.user = {};




//Загрузка меню
        vm.menuService.getMenu().then(function(menuData) {

            vm.menu = menuData.data;

        });


//Получение информации о подключенном пользователе
        vm.getInfo = () => {

            vm.user = vm.accountService.getInfo();

        };
        vm.getInfo();


//Пополнение баланса
        vm.deposit = (amount) => {

            vm.accountService.deposit(amount)
            .then((result) => {
                vm.user.credit = result;
                $scope.$apply();
            });

        };
//Возврат денег за загубленную доставку
        vm.moneyBack = (order) => {

            vm.accountService.moneyBack(order)
            .then((result) => {
                vm.user.credit = result;
                vm.currentOrder.splice(vm.currentOrder.indexOf(order),1);
                $scope.$apply();
            });

        };

//Получение текущих заказов

        vm.getOrders = () => {

            vm.accountService.getOrders()
            .then((result) => {

                vm.currentOrder = result;
                $scope.$apply();

            });

        };
        vm.getOrders();

//Добавление заказа
        vm.addOrder = (item) => {

            vm.accountService.addOrder(item)
            .then((result) => {

             if ( result.status == 'OK')
                {

                    vm.currentOrder.push(result.dish);

                    //решает проблему с $$hashKey
                    vm.currentOrder = angular.toJson(vm.currentOrder);
                    vm.currentOrder = angular.fromJson(vm.currentOrder);

                    vm.user.credit = result.newCredit;
                    //Принудительно обновляет модель
                    $scope.$apply();
                }
            else alert(result.status);
            });
        };

//Ожидаем смену статуса заказа

        vm.listenToOrderStatusChanged = () => {
            vm.accountService.listenToOrderStatusChanged().then(function(order) {

                vm.currentOrder.forEach(function(item, i, arr) {
                    if (item._id == order._id) {
                        arr[i] = order;
                    }
                });

                $scope.$apply();

                if (order.status == "Подано")
                {
                    setTimeout(function() {

                        vm.accountService.hideDoneOrder(order).then(function() {

                            vm.currentOrder.splice(vm.currentOrder.indexOf(order),1);
                            console.log(order);
                            $scope.$apply();

                        });

                    }, 120 * 1000)
                }

                vm.listenToOrderStatusChanged();

            });
        };
        vm.listenToOrderStatusChanged();

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
