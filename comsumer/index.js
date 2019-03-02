"use strict";
let packageParser = require("../libs/package-parser");
let amqpHelper = require("../libs/amqp-helper");
let chalk = require('chalk');

let connect = amqpHelper.connect;
let createChannel = amqpHelper.createChannel;

let consumeMessage = (ch, msg, cb) => {
  if (!msg) {
    console.log(
      " [x] [%s] Something wrong, no msg here",
      new Date().toLocaleString()
    );
    ch.reject("Something wrong, no msg");
  }
  var message = msg.content.toString();
  console.log(
    " [x] [%s] Received '%s'",
    new Date().toLocaleString(),
    message
  );
  var p = null;
  try {
    p = cb(packageParser.decode(message));
    if (typeof p == "object" && p.then) {
      p.then(re => {
        if (re && re.__errorCode) {
          console.log(typeof re.__errorStack);
          console.log(
            chalk.red(" [x] Error"),
            re.__errorCode,
            re.__errorMessage,
            re.__errorStack
          );
        } else {
          console.log(chalk.green(" [x] Done"));
        }
        ch.ack(msg);
      }).catch(e => {
        console.log(chalk.yellow(" [x] Reject"));
        console.log(e);
        ch.reject(msg);
      });
    } else {
      if (p === false) {
        console.log(chalk.yellow(" [x] Reject"));
        ch.reject(msg);
      } else {
        if (typeof p === "number" && p !== 0) {
          console.log(chalk.red(" [x] Error"), p);
        } else {
          console.log(chalk.green(" [x] Done"));
        }
        ch.ack(msg);
      }
    }
  } catch (e) {
    console.log(" [E] error");
    console.log(e);
    ch.reject(e);
  }
}

let register = async (host, queue, cb) => {
  if (!host) throw new Error("No host found");
  if (!queue) throw new Error("No queue found");

  let con = await connect(host);
  let ch = await createChannel(con);

  ch.assertQueue(queue, { durable: true });
  ch.prefetch(1);
  console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

  // const msg = await promiseChannelConsume(ch, queue);
  ch.consume(queue, (msg) => consumeMessage(ch, msg, cb));
  return con;
};

module.exports = { register };
