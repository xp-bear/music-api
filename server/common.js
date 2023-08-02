const dbserver = require("../dao/dbserver");

// 1.查询用户信息数据
exports.searchInfo = function (req, res) {
  let name = req.query.name;
  dbserver.searchInfo(name, res);
};

// 1.查询用户信息数据
exports.updateUser = function (req, res) {
  let data = req.body;
  dbserver.updateUser(data, res);
};
