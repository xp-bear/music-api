const mongoose = require("mongoose");
// 连接数据库
mongoose.connect("mongodb://localhost:27017/WeChat");
// 判断连接是否成功
const db = mongoose.connection;

db.once("open", function () {
  console.log("数据库链接成功");
});

module.exports = db;
