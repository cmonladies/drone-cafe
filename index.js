'use strict'


const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/dron-cafe');

const userAPI = require("./db/client/clientDB.js");
const ordersAPI = require("./db/orders/ordersDB.js");


const express = require("express");
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

const deliveryService = require('netology-fake-drone-api').deliver;

const bodyParser = require("body-parser");


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/src'));
app.use(function(err, req, res, next) {
  let errorCode = err.message ? err.message : 500;
  console.log(errorCode);
  res.status(errorCode).send();
});





//Используется для сохранения сокетов активных клиентов
let connectedUsers = {};


io.sockets.on('connection', function (socket) {
  console.log('user connected');


//Цепочка событий для пользователя

//Заход пользователя инициализируется событием checkUser
  socket.once('checkUser', function (user) {
    let currentUserId;

    userAPI.checkUser(user.email).then(
      result => {
        if (!result) {
            user.credit = 100;
            return userAPI.saveNewUser(user);
        }
        else
            return new Promise(function(resolve, reject) {
            return resolve(result)});
      }).then(
      currentUser => {
            currentUserId = currentUser._id;
            connectedUsers[currentUserId] = socket;
            socket.emit('checkMailResult', currentUser);
      }).catch(
      err => socket.emit('checkMailResult', err));



//Получаем список ранее сделанных заказов
    socket.on('getUserOrders', () => {
      ordersAPI.findClientsOrders(currentUserId).then(
        ordersList => socket.emit('getUserOrdersResult',ordersList),
        error      => socket.emit('getUserOrdersResult',error));
    });


//Добавление нового заказа
    socket.on('addOrder', function (order) {

        userAPI.checkBalance(currentUserId, order.price)
        .then(() => userAPI.changeBalance(currentUserId, -order.price))
        .then((updatedUser) => ordersAPI.addNewOrder(currentUserId, order)
          .then((order) => {
              io.sockets.in('cookRoom').emit('incomingOrder', order);
              socket.emit('addOrderResult', {credit:updatedUser.credit
                                                    ,status:"OK"
                                                    ,order: order});
          }))
        .catch((error) => socket.emit('addOrderResult', error));
    });


//Возврат средств за блюдо
    socket.on('moneyBack', (order) => {
        Promise.all([ordersAPI.hideOrder(order._id),
                    userAPI.changeBalance(currentUserId, order.menuInfo.price)]).then(
          result => socket.emit('moneyBackResult', {status: "OK", newCredit: result[1].credit}),
          error  => socket.emit('moneyBackResult', error));
    });


//Скрываем блюдо из меню списка пользователя
    socket.on('hideDoneOrder', (order) => {
      ordersAPI.hideOrder(order._id)
      .then(
      result => socket.emit('hideDoneOrderResult', 'OK'),
      error  => socket.emit('hideDoneOrderResult', error));
    });


//Депозит
    socket.on('deposit', function (amount) {
      userAPI.changeBalance(currentUserId, amount).then(
        updatedUser => socket.emit('depositResult', updatedUser.credit),
        err => socket.emit('depositResult', err));
      });

    socket.on('disconnect', function () {
      delete connectedUsers[currentUserId];
      console.log('user disconnected');
    });

  });

//Цепочка событий для повара
  socket.once('cookInitialization', function () {
    socket.join('cookRoom');


//Получаем на список для повара, разбиавем его на два списка на сервере
    socket.on('getOrdersKitchen', function () {
      ordersAPI.getOrdersKitchen().then(
        result => socket.emit('getOrdersKitchenResult', result),
        error  => socket.emit('getOrdersKitchenResult', error));
    });


//Переводим блюдо в состояние готовится
    socket.on('startCooking', (ordersId) => {

      ordersAPI.changeOrderStatus(ordersId, 'Готовится').then(
        updatedOrder => {
          if (connectedUsers[updatedOrder.userID]) {
            connectedUsers[updatedOrder.userID].emit('ordersStatusChanged', updatedOrder);
          };
          socket.emit('startCookingResult', {status: "OK" ,order : updatedOrder});
        },
        err => socket.emit('startCookingResult', {status: err}));
    });


//Переводим блюдо в состояние доставляется, взаимодействуем с модулем доставки
    socket.on('startDelivery', (ordersId) => {

      ordersAPI.changeOrderStatus(ordersId, 'Доставляется').then(
          updatedOrder => {
            if (connectedUsers[updatedOrder.userID]) {
              connectedUsers[updatedOrder.userID].emit('ordersStatusChanged', updatedOrder);
            };
            socket.emit('startDeliveryResult', "OK");
          })
      .then(updatedOrder => deliveryService(updatedOrder)
        .then(() => {return new Promise(function(resolve, reject) {resolve("Подано")})})
        .catch(() => {return new Promise(function(resolve, reject) {resolve("Возникли сложности")})})
        .then((newStatus) => ordersAPI.changeOrderStatus(ordersId, newStatus)))
      .then((updatedOrder) => {
        if (connectedUsers[updatedOrder.userID]) {
          connectedUsers[updatedOrder.userID].emit('ordersStatusChanged', updatedOrder);
        };
      })
      .catch(err => console.log(err));

    });


    socket.on('disconnect', function () {
      console.log('Cook disconnected');
    });
  });
});


//app.listen  - не работают сокеты
server.listen(3008, () => {
  console.log("App run!");
});

