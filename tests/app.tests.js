const should = require('chai').should();
const io = require('socket.io-client');

const url = 'http://localhost:3008/#!/';
const options = {
    transports: ['websocket'],
    'force new connection': true
};

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/dron-cafe');
const UserSchema = require('../db/client/users.schema.js');
const OrderSchema = require('../db/orders/orders.schema.js');






describe('Сервер', function () {

//Удаляем базу, чтобы исключить случайные совпадения. Лучше использовать тестовую базу?
  beforeEach((done) => {
      UserSchema.remove({}, (err) => OrderSchema.remove({}, (err) => done()));

  });

    it('Должен вернуть значение 100 в поле кредиты у нового пользователя', function (done) {
        let client = io.connect(url, options);
        client.on('connect', function () {
            let user = {name: "testing", email: "testing@testing"};
            done();
            client.emit('checkUser', user, function (err) {
                client.once('checkMailResult', function (user) {
                    user.credit.should.equal('100');
                });
            });
        });
        client.on('connect_error', function (e) {
            should.not.exist(e);
        });
    });

      it('При передаче блюда ценой 120 (при балансе новго пользователя 100) должен вернуть ошибку "Недостаточно средств"', function (done) {
        let client = io.connect(url, options);
        let order = {
                  "title": "Cheese Popovers",
                  "image": "https://spoonacular.com/recipeImages/Cheese-Popovers-517616.jpg",
                  "id": 517616,
                  "rating": 188,
                  "type" : "drinks",
                  "ingredients": [
                    "eggs",
                    "flour",
                    "milk",
                    "paprika",
                    "parmesan cheese",
                    "salt",
                    "salted butter"
                  ],
                  "price": 120
        };

        client.on('connect', function () {
            let user = {name: "testing", email: "testing@testing"};
            client.emit('checkUser', user);
            client.once('checkMailResult', function (user) {
                client.emit('addOrder', (order));
                client.once('addOrderResult', function (answer) {
                  answer.should.equal('Недостаточно средств');
                  done();
                });
            });
        });
        client.on('connect_error', function (e) {
            should.not.exist(e);
        });
    });

    it('При передаче блюда ценой 20 (при балансе новго пользователя 100) должен вернуть пользователя с измененным балансом на стоимость блюда', function (done) {
        let client = io.connect(url, options);
        let order = {
                  "title": "Cheese Popovers",
                  "image": "https://spoonacular.com/recipeImages/Cheese-Popovers-517616.jpg",
                  "id": 517616,
                  "rating": 188,
                  "type" : "drinks",
                  "ingredients": [
                    "eggs",
                    "flour",
                    "milk",
                    "paprika",
                    "parmesan cheese",
                    "salt",
                    "salted butter"
                  ],
                  "price": 20
        };

        client.on('connect', function () {
            let user = {name: "testing", email: "testing@testing"};
            client.emit('checkUser', user);
            client.once('checkMailResult', function (user) {
                client.emit('addOrder', (order));
                client.once('addOrderResult', function (answer) {
                  answer.credit.should.equal(100-order.price);
                  done();
                });
            });
        });
        client.on('connect_error', function (e) {
            should.not.exist(e);
        });
    });
});