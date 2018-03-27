
下载项目
https://github.com/fengxiaopinglab/wechaty.git

安装依赖：

```
npm install
```

访问localhost:3000/room，执行之后出现一个二维码。微信扫码登录

当前登录的微信，里面有“项目”开头的微信群名。在这个里面发送文件和聊天记录，会被记录起来。

查看群消息，在群里‘@当前登录用户’。会返回当前群消息的页面url

leancloud 信息配置文件leancloud.json 在/public文件夹下。(appid和appkey)

打开leancloud创建角色和用户，角色名是微信群名。然后创建属于该角色的用户。

打开‘@当前登录用户’返回的url，进入页面。登陆刚刚创建的用户
