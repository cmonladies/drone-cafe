const chai = require('chai');
const promised = require('chai-as-promised');
chai.use(promised);
const expect = chai.expect;


describe.only('Тестируем блок клиента', function() {

//Перед каждым тестом авторизируемся как тестовый пользователь name=test, email=test@test.test
  beforeEach((done) => {
    browser.get('http://localhost:3008/#!/');

    element(by.model('vm.user.name')).sendKeys('test');
    element(by.model('vm.user.email')).sendKeys('test@test.test');
    element(by.id('loginbtn')).click();
    done();

  });

  it('Пополняем текущий баланс на 100, должен его увеличить', function() {

    let startCredit;

    let text = element.all(by.css('a.brand-logo'));
    text.get(0).getText().then(function(msg) {
        let result = msg.match(/\d+/i);
        startCredit = result[0];

        let btns = element.all(by.css('a.btn'));
        btns.get(0).click();

        text.get(0).getText().then(function(msg) {
          result = msg.match(/\d+/i);
          expect(+result[0]).to.eql(+startCredit + 100);
        });
    });
  });

    it('Пополняем текущий баланс на 100, заказываем блюдо, баланс должен уменьшиться на стоимость блюда', function() {

        let startCredit;
        let dishPrice

        let btns = element.all(by.css('a.btn'));
        btns.get(0).click();

        let text = element.all(by.css('a.brand-logo'));
        text.get(0).getText().then(function(msg) {
            //состояние счета после депозита
            let result = msg.match(/\d+/i);
            startCredit = result[0];
            //открываем меню
            element(by.css('a.btn.center')).click();
            element(by.css("a[href='#test-swipe-1'].active")).click();
            //заказываем первое блюдо
            let cards = element.all(by.css("div.card-action"));
            cards.first().element(by.css('a')).click();
            //запоминаем его цену
            let card = cards.first().element(by.css('h5'));
            card.getText().then(function(price) {

              result = price.match(/\d+/i);
              console.log(result[0]);
              dishPrice = result[0];
            //проверяем условие теста
              text.get(0).getText().then(function(msg) {
                result = msg.match(/\d+/i);
                expect(+result[0]).to.eql(+startCredit - dishPrice);
              });

            });
        });
    });

});