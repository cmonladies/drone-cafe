'use strict'

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/dron-cafe');
const Schema = mongoose.Schema;

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





let UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, index: { unique: true } },
  credit: {type: Number, required: true}
});

let Users = mongoose.model('users', UserSchema);

let OrderaSchema = new Schema({
  userID: {type: Schema.ObjectId, required: true, trim: true},
  status: {type: String, required: true, trim: true},
  ordersTime: {type: Date, required: true, default: Date.now},
  startCookingTime: {type: Date},
  showToClient: {type: Boolean, default: true},
  menuInfo: { title: String,
              image: {type: String, trim: true},
              id: Number,
              rating: Number,
              type: {type: String, trim: true},
              price: Number,
              ingredients: [] }
});


let Order = mongoose.model('orders', OrderaSchema);


//Используется для сохранения сокетов активных клиентов
let connectedUsers = {};


io.sockets.on('connection', function (socket) {
  console.log('user connected');


//Цепочка событий для пользователя

//Заход пользователя инициализируется событием checkUser
  socket.once('checkUser', function (user) {
    let currentUserId;

    Users.findOne({email: user.email}).exec(function (err, currentUser) {

        if (currentUser) {
            currentUserId = currentUser._id;
            connectedUsers[currentUserId] = socket;
            socket.emit('checkMailResult', currentUser);
        }

        else {

            user.credit = 100;
            let newUser = new Users (user);
            newUser.save((err, result) => {
                currentUserId = result._id;
                connectedUsers[currentUserId] = socket;
                socket.emit('checkMailResult', result);
            });
        }

    });


//Получаем список ранее сделанных заказов
    socket.on('getUserOrders', () => {

      Order.find({"userID": currentUserId, "showToClient": true}).exec(function (err, ordersList) {

          socket.emit('getUserOrdersResult',ordersList);

      });


    });


//Добавление нового заказа
    socket.on('addOrder', function (order) {

        Users.findById(currentUserId, function (err, user) {

          let newCredit = user.credit - order.price;
          if (newCredit >= 0) {

              Users.findByIdAndUpdate(currentUserId
                                     ,{$set: {"credit": newCredit}}
                                     ,{new: true}
              ,function(err, updatedUser) {

                  let newOrder = new Order ({
                    userID: currentUserId,
                    status: 'Заказано',
                    ordersTime: new Date(),
                    menuInfo: order
                  });

                  newOrder.save((err, order) => {

                    io.sockets.in('cookRoom').emit('incomingOrder', order);

                    socket.emit('addOrderResult', {credit:updatedUser.credit
                                                  ,status:"OK"
                                                  ,order: order});


                  });
              });
          }

          else socket.emit('addOrder', {status: 'Недостаточно средств'});

        });
      });


//Возврат средств за блюдо
    socket.on('moneyBack', (order) => {

      Promise.all([Order.findByIdAndUpdate(order._id, {$set: {"showToClient": false}} ,{new: true}),
                  Users.findByIdAndUpdate(currentUserId ,{ $inc : { credit : order.menuInfo.price } },{new: true})
                  ]).then(
                  result => socket.emit('moneyBackResult', {status: "OK", newCredit: result[1].credit}),
                  error  => socket.emit('moneyBackResult', error));
    });


//Скрываем блюдо из меню списка пользователя
    socket.on('hideDoneOrder', (order) => {

      Order.findByIdAndUpdate(order._id, {$set: {"showToClient": false}} ,{new: true})
      .then(
      result => socket.emit('hideDoneOrderResult', 'OK'),
      error  => socket.emit('hideDoneOrderResult', error));

    });


//Депозит
    socket.on('deposit', function (amount) {

      Users.findByIdAndUpdate(currentUserId
                                   ,{ $inc : { credit : amount } }
                                   ,{new: true}
            ,function(err, updatedUser) {

                socket.emit('depositResult', updatedUser.credit);

      });
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
      let result = {
        status: "OK",
        awaitingOrders: [],
        ordersInProgress: []
      };

      Order.find({status: {$in: ['Заказано','Готовится']}}).exec(function (err, orders) {

          result.awaitingOrders = orders.filter(function(order) {
            return order.status == "Заказано";
          });
          result.ordersInProgress = orders.filter(function(order) {
            return order.status == "Готовится";
          });

          socket.emit('getOrdersKitchenResult', result);

      });

    });


//Переводим блюдо в состояние готовится
    socket.on('startCooking', (ordersId) => {

        Order.findByIdAndUpdate(ordersId
                                ,{$set: {"status": 'Готовится', "startCookingTime": new Date()}}
                                ,{new: true}
              ,function(err, updatedOrder) {


                  if (connectedUsers[updatedOrder.userID]) {
                    connectedUsers[updatedOrder.userID].emit('ordersStatusChanged', updatedOrder);
                  };

                  socket.emit('startCookingResult', {status: "OK"
                                                    ,order : updatedOrder});

        });
    });


//Переводим блюдо в состояние доставляется, взаимодействуем с модулем доставки
    socket.on('startDelivery', (ordersId) => {

        Order.findByIdAndUpdate(ordersId
                                ,{$set: {"status": 'Доставляется'}}
                                ,{new: true}
          ,function(err, updatedOrder) {

            if (connectedUsers[updatedOrder.userID]) {
              connectedUsers[updatedOrder.userID].emit('ordersStatusChanged', updatedOrder);
            };

            socket.emit('startDeliveryResult', "OK");

            deliveryService(updatedOrder)
              .then(() => {

                updatedOrder.status = "Подано";

              })
              .catch(() => {

                updatedOrder.status = "Возникли сложности";

              })
              .then(() => {

                    Order.findByIdAndUpdate(ordersId
                                ,{$set: {"status": updatedOrder.status}}
                                ,{new: true}
                      ,function(err, updatedOrder) {

                          if (connectedUsers[updatedOrder.userID]) {
                            connectedUsers[updatedOrder.userID].emit('ordersStatusChanged', updatedOrder);
                          };
                    });


              });
          });
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

