const mongoose = require('mongoose');
const UserSchema = require('./users.schema.js');
mongoose.Promise = global.Promise;



let userAPI = {

  checkUser: function(email) {

    return new Promise(function(resolve, reject) {

      UserSchema.findOne({email : email}).exec(function (err, currentUser) {

        if(err) {
          reject(err); }
        else {
          resolve(currentUser);
        }
      })
    });

  },

  saveNewUser: function(data) {

    return new Promise(function(resolve, reject) {

      let user = new UserSchema(data);
      user.save( (error, savedObject) => {
        if (error) {
          reject(error);
        }
        else {
          resolve(savedObject);
        }
      });
    });

  },

  checkBalance: function(currentUserId, price) {

    return new Promise(function(resolve, reject) {

      UserSchema.findById(currentUserId, function (err, user) {

          if (user.credit  >= price) {
            resolve(user.credit - price);
          }
          else reject('Недостаточно средств');
      });
    });
  },

  changeBalance: function(currentUserId, price) {

    return new Promise(function(resolve, reject) {

       UserSchema.findByIdAndUpdate(currentUserId
                                     ,{$inc : { credit : price }}
                                     ,{new: true}
        ,function(err, updatedUser) {
          if (err) {
            reject(error);
          }
          else {
            resolve(updatedUser);
          }
        });

    });
  }

};

module.exports = userAPI;