const chai = require('chai');
const promised = require('chai-as-promised');
chai.use(promised);
const expect = chai.expect;


describe('Restoraunt Ordering System App', function() {

  it('должен вернуть Title', function() {

    browser.get('http://localhost:3008/#!/');
    let title = browser.getTitle();
    expect(title).to.eventually.equal('Демо-версия Restoraunt Ordering System');

  });


  it('Должен перенаправлять на /#! если хэш-часть запроса пустая', function() {
    browser.get('http://localhost:3008/');
    expect(browser.getCurrentUrl()).to.eventually.equal("http://localhost:3008/#!/");
  });

  it('Должен перенаправлять на /notFound если произвольная, но не предусмотрена', function() {
    browser.get('http://localhost:3008/#!/testresttest');
    expect(browser.getCurrentUrl()).to.eventually.equal("http://localhost:3008/#!/notFound");
  });

});


describe('Проверка авторизации', function() {

  it('Заполняем поля имя и email значениями test test@test.test, ожидаем переход на страницу клиента, о чем свидетельствует текст test, Ваш баланс 100 Галактических евро', function() {
    browser.get('http://localhost:3008/#!/');

    element(by.model('vm.user.name')).sendKeys('test');
    element(by.model('vm.user.email')).sendKeys('test@test.test');

    element(by.id('loginbtn')).click();

    let text = element.all(by.css('a.brand-logo'));

    expect(text.get(0).getText()).to.eventually.equal('test, Ваш баланс 100 Галактических евро');
  });

  it('Заполним поле email невалидным значением testtest.ru и пытаемся отправить форму, кнопка должна перейти в состояние disabled', function() {
    browser.get('http://localhost:3008/#!/');

    element(by.model('vm.user.email')).sendKeys('testtest.ru');
    element(by.model('vm.user.name')).sendKeys('test');


    element(by.id('loginbtn')).getAttribute('disabled').then(function(attr) {
      expect(attr).to.eql('true');
    });
  });

});


