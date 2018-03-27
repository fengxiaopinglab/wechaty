var auth = require('./auth');
var roomInfo = require('./roomInfo')

module.exports = function (app) {
    app.post('/login', auth.login);
    app.get('/logout', auth.logout);
    app.get('/checkLogin', auth.isLogin);

    app.post('/attachment', roomInfo.attachment)
    app.post('/chat', roomInfo.chat)
    app.post('/findChat', roomInfo.findChat)

};