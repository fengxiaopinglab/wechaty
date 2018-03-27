var AV = require('leanengine');

module.exports = {
    login: function (req, res) {
        console.log(AV.User)
        AV.User.logIn({"username":"1","password":"1"}).then(function (loginedUser) {
            res.send(loginedUser)
        }, function (error) {
        });
    },
    logout: function () {
        AV.User.logOut()
    },
    isLogin: function (req, res) {
        res.send(AV.User.current())
    }
}