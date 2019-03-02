"use strict";
var crypto = require("crypto");

let _encryptData = (txt) => {
  let initK = crypto.randomBytes(Math.ceil(16)).toString('hex').slice(0,32);
  var desKey = Buffer.from(initK, 'hex');
  const iv  = Buffer.from('26ae5cc854e36b6bdfca366848dea6bb', 'hex');
  var cipher = crypto.createCipheriv("aes-128-cbc", desKey, iv);
  var ciph = cipher.update(txt, "utf8", "base64");
  ciph += cipher.final("base64");
  var transcodeCiph = ciph.replace(/[+]/g, "-").replace(/[/]/g, "_");
  return initK + "~" + transcodeCiph;
}

let _decryptData = (cipher) => {
  try {
    var split = cipher.indexOf("~");
    var _desKey = cipher.substr(0, split);
    var desKey = Buffer.from(_desKey, 'hex');
    var value = cipher.substr(split + 1, cipher.length - split)
      .replace(/[-]/g, "+")
      .replace(/[_]/g, "/");

    const iv  = Buffer.from('26ae5cc854e36b6bdfca366848dea6bb', 'hex');
    var decipher = crypto.createDecipheriv("aes-128-cbc", desKey, iv);
    var txt = decipher.update(value, "base64", "utf8");
    txt += decipher.final("utf8");
    return txt;
  } catch (e) {
    return "";
  }
}

module.exports = {
  sign: "xq  ",
  encode: function(action, paramaters) {
    return this._encode(1, action, paramaters);
  },
  encodev2: function(action, paramaters) {
    return this._encode(2, action, paramaters);
  },
  _encode: function(version, action, paramaters) {
    action = action.toLowerCase();
    paramaters = paramaters || [];
    paramaters.unshift(action || "");
    version = ((version || "1") + "    ").substring(0, 4);

    var message = "";
    if (version == 2) {
      message = paramaters.map(_encryptData).join("&!&");
    } else {
      message = paramaters.join("~");
    }

    var salt = Math.random()
      .toString(36)
      .substring(0, 4);
    var checksum = crypto
      .createHash("md5")
      .update(message + salt)
      .digest("hex");
    var shortCS =
      checksum.substring(0, 4) +
      checksum.substring(checksum.length - 4, checksum.length);

    return this.sign + version + shortCS + salt + message;
  },
  decode: function(message) {
    message = message || "";
    // var sign = message.substring(0, this.sign.length).trim();
    var version = message
      .substring(this.sign.length, this.sign.length + 4)
      .trim();

    var action = "";
    var paramaters = [];
    var checksum, payload, shortCS;

    switch (version) {
      case "1":
        checksum = message
          .substring(this.sign.length + 4, this.sign.length + 12)
          .trim();
        // salt = message
        //   .substring(this.sign.length + 12, this.sign.length + 16)
        //   .trim();
        payload = message.substring(this.sign.length + 16, message.length);
        // var cs = crypto
        //   .createHash("md5")
        //   .update(payload + salt)
        //   .digest("hex");
        shortCS =
          checksum.substring(0, 4) +
          checksum.substring(checksum.length - 4, checksum.length);

        if (checksum === shortCS) {
          paramaters = payload.split("~");
          action = paramaters[0];
          paramaters.shift();
        }
        break;
      case "2":
        checksum = message
          .substring(this.sign.length + 4, this.sign.length + 12)
          .trim();
        // salt = message
        //   .substring(this.sign.length + 12, this.sign.length + 16)
        //   .trim();
        payload = message.substring(this.sign.length + 16, message.length);
        // var cs = crypto
        //   .createHash("md5")
        //   .update(payload + salt)
        //   .digest("hex");
        shortCS =
          checksum.substring(0, 4) +
          checksum.substring(checksum.length - 4, checksum.length);

        if (checksum === shortCS) {
          paramaters = payload.split("&!&").map(_decryptData);
          action = paramaters[0];
          paramaters.shift();
        }
        break;
    }

    return {
      action: action,
      paramaters: paramaters
    };
  }
};
