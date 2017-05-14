'use strict';

angular
    .module('restorauntOrderingSystemApp')
    .factory('AccountService', function() {



        let socket = io.connect('http://localhost:3008');


        let user = {
            info: {
                name: null,
                email: null,
                credit: 100,
                _id: null
            },

            loginStatus: false
        };


        return {
            checkStatus() {
                if(user.loginStatus) {
                    return true;
                }
                else return false;
            },

            getInfo()  {
                if(user.loginStatus) {
                    return {name: user.info.name,
                            credit: user.info.credit}
                } else {
                    return false;
                }
            },
            login (newUser) {

                socket.emit('checkUser', newUser);
                socket.once('checkMailResult', (info) => {
                    user = {info};
                    user.loginStatus = true;
                });

            },

            logout() {
                user.info.name = null;
                user.info.email = null;
                user.loginStatus = false;
            },

            deposit(amount) {

                return new Promise((resolve, reject) => {

                    socket.emit('deposit', amount);
                    socket.once('depositResult', (result) => {

                        user.info.credit = result;
                        resolve (user.info.credit);

                    });
                })



            },

            getOrders() {

                return new Promise((resolve, reject) => {

                    socket.emit('getUserOrders');
                    socket.once('getUserOrdersResult', (result) => {

                        resolve (result);

                    });
                });
            },

            listenToOrderStatusChanged () {

                return new Promise((resolve, reject) => {

                    socket.once('ordersStatusChanged', (result) => {

                        resolve(result);

                    });


                });

            },

            addOrder(order) {
                return new Promise((resolve, reject) => {
                    socket.emit('addOrder', order);

                    socket.once('addOrderResult', (result) => {

                        if(result.status == 'OK') {

                            user.info.credit = result.credit;
                            resolve ({newCredit: user.info.credit, dish:result.order, status: 'OK'});

                        }
                        else {
                            resolve ({status:'Блюдо не добавлено в заказ :/' });
                        }
                    });

                });
            },


            moneyBack(order) {

                return new Promise((resolve, reject) => {

                    socket.emit('moneyBack', order);

                    socket.once('moneyBackResult', (result) => {

                        if(result.status == 'OK') {

                            user.info.credit = result.newCredit;
                            resolve (user.info.credit);

                        }
                        else {
                            reject (result.status);
                        }

                    });
                });
            },

            hideDoneOrder(order) {
                return new Promise((resolve, reject) => {

                    socket.emit('hideDoneOrder', order);
                    socket.once('hideDoneOrderResult', (result) => {

                        if(result == 'OK') {
                            resolve (result);
                        }
                        else {
                            reject (result);
                        }
                    });

                });
            }
    }
})
