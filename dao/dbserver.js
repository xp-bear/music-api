const { User, Friend, Group, GroupUser, Message } = require("../model/dbmodel");
const bcrypt = require("./bcryptjs");
let token = require("../dao/jwt");

// 新建用户
exports.buildUser = function (name, email, pwd, res) {
  // 检测邮箱不可以重复注册
  User.find({ email: email }, (err, result) => {
    if (err) {
      res.send({ msg: "服务器出大问题", code: 500, err: err });
    } else {
      if (Object.keys(result).length == 0) {
        //可以注册
        let password = bcrypt.encryption(pwd); // 密码加密
        let data = { name: name, email: email, psw: password, time: new Date() };
        let user = new User(data);
        user.save(function (err, data) {
          if (err) {
            res.send({ msg: "添加失败", code: 500 });
          } else {
            res.send({ msg: "用户添加成功", code: 200 });
          }
        });
      } else {
        //由此邮箱
        res.send({ msg: "有此邮箱,注册失败", code: 404 });
        return;
      }
    }
  });
};

//匹配用户名(邮箱)是否已经被占用
exports.countUserValue = function (data, type, res) {
  let wherestr = {};
  // //wherestr ={' type' : data }
  wherestr[type] = data;
  // console.log(wherestr);
  User.countDocuments(wherestr, function (err, result) {
    if (err) {
      res.send({ msg: "查询出问题", code: 500 });
    } else {
      res.send({ msg: "查询结果", code: 200, result: result });
    }
  });
};

//用户验证token
exports.userMatch = function (data, pwd, res) {
  let wherestr = { $or: [{ name: data }, { email: data }] };
  User.find(wherestr, (err, data) => {
    //data查询到的是一个数组
    if (err) {
      res.send({ msg: "用户验证token出问题", code: 500 });
    } else {
      if (data == "") {
        res.send({ msg: "没有找到该用户", code: 400 });
      }
      // console.log(data);
      data.map((v) => {
        const pwdMatch = bcrypt.verification(pwd, v.psw);
        if (pwdMatch) {
          let tokens = token.generateToken(v._id);
          let back = {
            tokens,
            id: v._id,
            name: v.name,
            imgUrl: v.imgUrl,
          };
          res.send({ msg: "登录成功", back, code: 200 });
        } else {
          res.send({ msg: "密码不正确", code: 400 });
        }
      });
    }
  });
};

//搜索用户
exports.searchUser = function (data, res) {
  let wherestr;
  // 搜索出所有的用户
  if (data == "all") {
    wherestr = {};
  } else if (data == "") {
    res.send({ msg: "搜索关键字为空", code: 404 });
    return;
  } else {
    wherestr = { $or: [{ email: { $regex: data } }, { name: { $regex: data } }] };
  }
  let out = {
    name: 1,
    email: 1,
    imgUrl: 1,
  };
  User.find(wherestr, out, (err, result) => {
    if (err) {
      res.send({ msg: "搜索用户出问题", code: 500 });
    } else {
      res.send({ msg: "搜索成功", code: 200, result });
    }
  });
};

//判断是否为好友
exports.isFriend = function (uid, fid, res) {
  let wherestr = { userID: uid, friendID: fid, state: 0 };
  Friend.findOne(wherestr, (err, result) => {
    if (err) {
      res.send({ msg: "判断是否为好友-服务器出大问题", code: 500 });
    } else {
      if (result) {
        res.send({ msg: "是好友", code: 200, tips: 1 });
      } else {
        res.send({ msg: "不是好友", code: 400 });
      }
    }
  });
};

//搜索群
exports.searchGroup = function (data, res) {
  // 搜索出所有的群
  if (data == "group") {
    let wherestr = {};
  } else if (data == "") {
    res.send({ msg: "搜索关键字为空", code: 404 });
    return;
  } else {
    wherestr = { $or: [{ name: { $regex: data } }] };
  }
  let out = {
    name: 1, //群名
    imgUrl: 1, //群头像
  };
  Group.find(wherestr, out, (err, result) => {
    if (err) {
      res.send({ msg: "搜索群-服务器出大问题", code: 500 });
    } else {
      res.send({ msg: "搜索成功", code: 200, result });
    }
  });
};

//判断是否在群内
exports.isInGroup = function (uid, gid, res) {
  let wherestr = { userID: uid, groupID: gid };
  GroupUser.findOne(wherestr, (err, result) => {
    if (err) {
      res.send({ msg: "判断是否是否在群内-服务器出大问题", code: 500 });
    } else {
      if (result) {
        res.send({ msg: "是在群内", code: 200 });
      } else {
        res.send({ msg: "不是在群内", code: 400 });
      }
    }
  });
};

//根据id查询用户详情
exports.userDetial = function (id, res) {
  let wherestr = { _id: id };
  let out = { psw: 0 };
  User.findOne(wherestr, out, (err, result) => {
    if (err) {
      res.send({ msg: "用户详情-服务器出大问题", code: 500 });
    } else {
      if (result) {
        res.send({ msg: "找到用户详情", result, code: 200 });
      } else {
        res.send({ msg: "没有找到用户详情", code: 400 });
      }
    }
  });
};

// 用户修改(修改密码 , 修改邮箱)
exports.userUpdate = function (data, res) {
  let updatestr = {};
  // 判断是否有密码
  if (typeof data.pwd != "undefined") {
    // 有密码的情况,需要修改的
    User.find({ _id: data.id }, { psw: data.pwd }, (err, result) => {
      if (err) {
        res.send({ msg: "用户修改出大问题", code: 500 });
      } else {
        if (result == "") {
          res.send({ msg: "没有找到该用户", code: 400 });
        }
        // console.log(result);
        result.map((v) => {
          //数组的遍历
          const pwdMatch = bcrypt.verification(data.pwd, v.psw);
          if (pwdMatch) {
            // 如果为修改密码,则需要一个加密
            // console.log("data.type", data.type);
            if (data.type == "psw") {
              // 有密码,先加密
              let password = bcrypt.encryption(data.data);
              updatestr[data.type] = password;
              User.findByIdAndUpdate(data.id, updatestr, (err, ret) => {
                if (err) {
                  res.send({ msg: "修改出错", code: 500 });
                } else {
                  res.send({ msg: "修改成功", ret, code: 200 });
                }
              });
            } else if (data.type == "email") {
              // 如果type= email 修改邮箱
              updatestr[data.type] = data.data;
              // 判断邮箱是否被占用
              User.countDocuments(updatestr, (err, result) => {
                if (err) {
                  res.send({ msg: "修改邮箱服务器出大问题", code: 500 });
                } else {
                  if (result == 0) {
                    // 该邮箱没有被注册
                    User.findByIdAndUpdate(data.id, updatestr, (err, ret) => {
                      if (err) {
                        res.send({ msg: "修改出错", code: 500 });
                      } else {
                        res.send({ msg: "修改成功", ret, code: 200 });
                      }
                    });
                  } else {
                    // 该邮箱已经被注册
                    res.send({ msg: "修改失败,该邮箱已经被注册", code: 400 });
                  }
                }
              });
            } else if (data.type == "name") {
              // 如果type= name 修改用户名
              updatestr[data.type] = data.data;
              // 判断名称是否被占用
              User.countDocuments(updatestr, (err, result) => {
                if (err) {
                  res.send({ msg: "修改名称服务器出大问题", code: 500 });
                } else {
                  if (result == 0) {
                    // 该名字没有被使用
                    User.findByIdAndUpdate(data.id, updatestr, (err, ret) => {
                      if (err) {
                        res.send({ msg: "修改出错", code: 500 });
                      } else {
                        res.send({ msg: "修改成功", ret, code: 200 });
                      }
                    });
                  } else {
                    // 该名字已经被使用
                    res.send({ msg: "修改失败,该名字已经被占用", code: 400 });
                  }
                }
              });
            }
          } else {
            res.send({ msg: "密码不正确", code: 400 });
          }
        });
      }
    });
  } else {
    // 没有密码,需要修改的
    updatestr[data.type] = data.data;
    User.findByIdAndUpdate(data.id, updatestr, (err, ret) => {
      if (err) {
        res.send({ msg: "修改出错", code: 500 });
      } else {
        res.send({ msg: "修改成功", ret, code: 200 });
      }
    });
  }
};

// 忘记密码,根据邮箱查询出用户id值,进行密码修改
exports.userPasswordUpdate = function (data, res) {
  User.find({ email: data.email }, (err, result) => {
    if (err) {
      res.send({ msg: "用户修改出大问题", code: 500 });
    } else {
      // 做密码信息修改
      let password = bcrypt.encryption(data.data); // 密码加密
      User.findByIdAndUpdate(result[0]._id, { psw: password }, (err, ret) => {
        if (err) {
          res.send({ msg: "修改出错", code: 500 });
        } else {
          res.send({ msg: "修改成功", ret, code: 200 });
        }
      });
    }
  });
};

//获取好友昵称
exports.getMarkName = function (data, res) {
  let wherestr = { userId: data.uid, friendId: data.fid };
  let out = { markname: 1 };
  Friend.findOne(wherestr, out, (err, result) => {
    if (err) {
      res.send({ msg: "获取好友昵称失败", code: 500 });
    } else {
      res.send({ msg: "获取好友昵称成功", code: 200, result });
    }
  });
};

//修改好友昵称
exports.friendMarkName = function (data, res) {
  let wherestr = { userId: data.uid, friendId: data.fid };
  let updatestr = { markname: data.name };
  Friend.updateOne(wherestr, updatestr, (err, result) => {
    if (err) {
      res.send({ msg: "修改出错", code: 500 });
    } else {
      res.send({ msg: "修改成功", code: 200 });
    }
  });
};

// 好友操作
// 添加好友表
exports.bulidFriend = function (uid, fid, state, res) {
  let data = { userID: uid, friendID: fid, state: state, time: new Date(), lastTime: new Date() };
  let friend = new Friend(data);
  friend.save(function (err, result) {
    if (err) {
      res.send({ msg: "添加失败,出大问题", code: 500 });
    } else {
      // res.send({ msg: "用户添加成功", code: 200 });
    }
  });
};

//更新好友最后通讯时间
exports.upFriendLastTime = function (uid, fid) {
  let wherestr = {
    $or: [
      { userId: uid, friendID: fid },
      { userId: fid, friendID: uid },
    ],
  };
  let updatestr = { lastTime: new Date() };
  Friend.updateMany(wherestr, updatestr, (err, result) => {
    if (err) {
      res.send({ msg: "更新时间失败", code: 500 });
    } else {
      // res.send({ msg: "更新时间成功", code: 200 });
    }
  });
};

// 添加一对一消息表
exports.insertMsg = function (uid, fid, msg, types, res) {
  let data = {
    userID: uid, //用户ID
    friendID: fid, //好友ID
    message: msg, //内容
    types: types, //内容类型（0文字，1图片链接，2音频链接..）
    state: 1, //消息状态（0已读，1未读）
    time: new Date(), //发送时间，
  };
  let message = new Message(data);
  message.save(function (err, data) {
    if (err) {
      res.send({ msg: "添加失败,服务器出大问题", code: 500 });
    } else {
      res.send({ msg: "一对一消息表添加成功", code: 200 });
    }
  });
};

// 好友申请
exports.applyFriend = function (data, res) {
  // 判断是否已经申请过
  let wherestr = { userID: data.uid, friendID: data.fid };
  Friend.countDocuments(wherestr, (err, result) => {
    if (err) {
      res.send({ msg: "申请好友出大问题", code: 500 });
    } else {
      if (result == 0) {
        //初次申请
        this.bulidFriend(data.uid, data.fid, 2);
        this.bulidFriend(data.fid, data.uid, 1);
      } else {
        // 已经申请过好友
        this.upFriendLastTime(data.uid, data.fid); //更新最后的时间
      }
      //添加消息 一对一消息表
      this.insertMsg(data.uid, data.fid, data.msg, 0, res);
    }
  });
};

// 拓展功能
//--------------------------------------
// 1.查询用户信息数据
exports.searchInfo = function (name, res) {
  wherestr = { name: name };
  let out = {
    psw: 0,
  };
  User.find(wherestr, out, (err, result) => {
    if (err) {
      res.send({ msg: "搜索用户出问题", code: 500 });
    } else {
      // 返回的数据删除密码这个字段
      res.send({ msg: "搜索成功", code: 200, result });
    }
  });
};

// 修改用户信息
exports.updateUser = function (data, res) {
  wherestr = { name: data.name }; //查询条件
  console.log(data.sign);
  // 设置要更新的字段和新值
  const update = { $set: { name: data.newName, signature: data.sign, sex: data.sex, imgUrl: data.imgUrl } };

  // 执行更新操作
  User.updateOne(wherestr, update, (err, result) => {
    if (err) {
      res.send({ msg: "修改用户出问题", code: 500 });
    }
    res.send({
      code: 200,
      msg: "修改成功!",
      result: result,
    });
  });
};
