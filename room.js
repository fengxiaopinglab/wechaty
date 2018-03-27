
const {createWriteStream, statSync, readFileSync} = require('fs')
const {Wechaty, Room, MediaMessage, MsgType} = require('wechaty')
const bot = Wechaty.instance()

// const config = JSON.parse(readFileSync("./public/leancloud.json").toString());
// const appId = config.appId;
// const appKey = config.appKey;
const AV = require('leancloud-storage')
// AV.init({appId, appKey})
'use strict';
var router = require('express').Router();

const Attachment = AV.Object.extend('Attachment');
const Group = AV.Object.extend('Group');
const Chat = AV.Object.extend('Chat');

let currentUser;

async function getAllRoom() {
  const keyroom = Room.findAll()

  keyroom.then(function (result) {
    for (let i = 0; i < result.length; i++) {
      if (result[i].rawObj.NickName.substr(0, 2) === "项目") {
        saveGroupName(result[i].rawObj.NickName)
      }
    }
  })
}

function getRoleACL(room) {
  const roleQuery = new AV.Query(AV.Role);
  // const roleName = room == '项目1' ? 'admin1' : 'admin2';

  roleQuery.equalTo('name', room);
  return roleQuery.first().then(function (adminRole) {

    const acl = new AV.ACL();

    acl.setRoleWriteAccess(adminRole, true);
    acl.setRoleReadAccess(adminRole, true);

    return acl
  })
}

async function saveChatText(room, user, content) {
  const chat = new Chat();

  getRoleACL(room).then(function (acl) {
    chat.set('group', room);
    chat.set('user', user.rawObj.NickName);
    chat.set('content', content);
    chat.setACL(acl);
    chat.save()
  })
}

async function saveGroupName(name) {
  const query = new AV.Query('Group');

  query.find().then(function (rooms) {
    rooms.forEach(function (room, index) {
      if (name != room.attributes.name && index > rooms.length - 1) {
        const groupFolder = new Group();

        groupFolder.set('name', name);
        groupFolder.save()
      }
    });
  }).then(function (todos) {
  }, function (error) {
    console.log('------------------group --err')
    console.log(error)
    // 异常处理
  });
}

async function saveMediaFile(message) {
  const filename = message.filename()
  console.log('local filename: ' + filename)

  const fileStream = createWriteStream('./file/' + filename)

  console.log('start to readyStream()')
  try {
    const netStream = await message.readyStream()
    netStream
      .pipe(fileStream)
      .on('close', _ => {
        var type = '';

        for (let i in MsgType) {
          if (MsgType[i] === message.type()) {
            type = i
          }
        }
        saveCloudFile(message, filename, type)
        console.log('finish readyStream() for ', filename, ' size: ', statSync('./file/' + filename).size)
      })
  } catch (e) {
    console.error('stream error:', e)
  }
}

async function saveCloudFile(message, filename, type) {
  const attachment = new Attachment();
  const base64Img = readFileSync('./file/' + filename).toString('base64');  // base64图片编码字符串
  const data = {base64: base64Img};
  const file = new AV.File(filename, data);

  getRoleACL(message.room().rawObj.NickName).then(function (acl) {
    file.setACL(acl)
    file.save().then(function (todo) {
      const targetTodoFolder = AV.Object.createWithoutData('_File', todo.id);
      attachment.set('file', targetTodoFolder);
      attachment.set('type', type);
      attachment.setACL(acl)
      attachment.set('group', message.room().rawObj.NickName);
      attachment.save()

    }, function (error) {
      console.log(error)
    });

  })

  console.log(type)
}
// 查询 Todo 列表
router.get('/', function(req, res, next) {
    bot
        .on('scan', (url, code) => {
        if (!/201|200/.test(String(code))) {
        const loginUrl = url.replace('qrcode', 'l')
        require('qrcode-terminal').generate(loginUrl)
        }
        res.send('<img src='+ url +' \>');
    })

    .on('login', user => {
            currentUser = user;
        console.log(`${user} login`)
    })

    .on('message', async function (m) {
        const room = m.room()
        const sender = m.from()
        const content = m.content()

        if (room && room.rawObj.NickName.substr(0, 2) === "项目") {
            const user =  new RegExp('@' + currentUser.rawObj.NickName);
            if (user.test(content)) {
                m.say("http://wechatyroom.leanapp.cn/file-list.html?name=" + encodeURI(room.rawObj.NickName))
                console.log("http://wechatyroom.leanapp.cn/file-list.html?name=" + encodeURI(room.rawObj.NickName))
            }

            if (/test/.test(content)) {
                m.say("hello~")
            }
            // http://wechatyroom.leanapp.cn/file

            if (m.type() === MsgType.TEXT) {
                saveChatText(room.rawObj.NickName, sender, content)
            }

            if (m.type() === MsgType.IMAGE
                || m.type() === MsgType.EMOTICON
                || m.type() === MsgType.VIDEO
                // || m.type() === MsgType.VOICE
                || m.type() === MsgType.MICROVIDEO
                || m.type() === MsgType.APP
            ) {

                if (m instanceof MediaMessage) {
                    saveMediaFile(m)
                }
            }

            getAllRoom()
        }

        if (m.self()) {
            return
        }

    })

    .init()
});

module.exports = router;