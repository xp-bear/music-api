let BASEURL = ""; //图片链接地址
if (process.env.NODE_ENV === "production") {
  BASEURL = "http://150.158.21.251:5000/";
} else {
  BASEURL = "http://127.0.0.1:5000/";
}

module.exports = { BASEURL };
