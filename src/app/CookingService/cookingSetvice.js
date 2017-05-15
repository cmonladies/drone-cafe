'use strict';

angular
    .module('restorauntOrderingSystemApp')
    .factory('CookingService', function() {

      let socket = io.connect('http://localhost:3008');

        return {

            cookInitialization () {
              socket.emit('cookInitialization');
            },

            getOrders () {
              return new Promise((resolve, reject) => {

                socket.emit('getOrdersKitchen');
                socket.once('getOrdersKitchenResult', (result) => {
                    if(result.status == 'OK') {
                      resolve({status: result.status
                              ,awaitingOrders: result.awaitingOrders
                              ,ordersInProgress: result.ordersInProgress});
                    }
                    else reject('Произошла ошибка');
                });
              })
            },


            startCooking (ordersId) {
              return new Promise((resolve, reject) => {

                socket.emit('startCooking', ordersId);
                socket.once('startCookingResult', (result) => {

                    if(result.status == 'OK') {

                      resolve({status: result.status,
                               order : result.order
                             });
                    }
                    else reject(result.status);
                });
              });
            },


            startDelivery(ordersId) {
              return new Promise((resolve, reject) => {
                socket.emit('startDelivery', ordersId);
                socket.once('startDeliveryResult', (status) => resolve(status));
              });
            },


            getIncomingOrdes () {
              return new Promise((resolve, reject) => {
                  socket.once('incomingOrder', (order) => {
                    resolve(order);
                  });
              });
            }


        }

});