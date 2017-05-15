const mongoose = require('mongoose');
const Order = require('./orders.schema.js');
mongoose.Promise = global.Promise;


let ordersAPI = {

  findClientsOrders: function(currentUserId) {
    return new Promise(function(resolve, reject) {

      Order.find({"userID": currentUserId, "showToClient": true}).exec(function (err, orderList) {

        if(err) {
          reject(err); }
        else {
          resolve(orderList);
        }
      })
    });

  },


  addNewOrder: function(currentUserId, order) {
     return new Promise(function(resolve, reject) {

        let newOrder = new Order ({
                userID: currentUserId,
                status: 'Заказано',
                ordersTime: new Date(),
                menuInfo: order
              });

        newOrder.save((err, order) => {
          if(err) {
            reject(err); }
          else {
            resolve(order);
          }
        });
      });
  },


  hideOrder: function(orderId) {
    return new Promise((resolve, reject) => {

      Order.findByIdAndUpdate(orderId, {$set: {"showToClient": false}} ,{new: true})
      .exec(function (err, order) {
          if(err) {
            reject(err); }
          else {
            resolve(order);
          }
        });

    });

  },


  getOrdersKitchen: function() {
    return new Promise((resolve, reject) => {

          Order.find({status: {$in: ['Заказано','Готовится']}}).exec(function (err, orders) {

            if(err) {
              reject(err); }
            else {

                let result = {
                  status: "OK",
                  awaitingOrders: [],
                  ordersInProgress: []
                };

                result.awaitingOrders = orders.filter(function(order) {
                  return order.status == "Заказано";
                });
                result.ordersInProgress = orders.filter(function(order) {
                  return order.status == "Готовится";
                });

                resolve(result);
            }
          });
    });
  },


  changeOrderStatus: function(ordersId, newStatus) {
    return new Promise((resolve, reject) => {

        Order.findByIdAndUpdate(ordersId
                                    ,{$set: {"status": newStatus, "startCookingTime": new Date()}}
                                    ,{new: true}).exec(function (err, order) {
          if(err) {
              reject(err);}
          else {
            resolve(order)
          };
        });
    });
  }

};

module.exports = ordersAPI;