'use strict';
var Promise = require('bluebird');
var packageParser = require('../libs/package-parser');
var sleep = require('../libs/sleep');
var amqpHelper = require('../libs/amqp-helper');

let connect = amqpHelper.connect;
let createChannel = amqpHelper.createChannel;

let cachedConnection = {}

let build = async (host, queue) => {
  let key = `${host}-${queue}`;
  let con = cachedConnection[key];
  if (!con) {
    con = await connect(host);
    cachedConnection[key] = con;
  }
  let ch = await createChannel(con);
  return {con, ch};
}

let closeChannel = async (host, queue) => {
  let key = `${host}-${queue}`;
  let con = cachedConnection[key];
  if (con) {
    await con.close();
    delete cachedConnection[key];
  }
}


let send = async (host, queue, msg, opts) => {
  if (!host) throw new Error('No host found');
  if (!queue) throw new Error('No queue found');
  msg = msg || '';
  opts = opts || {
    keep: false,
    silent: true
  }
  
  if (Array.isArray(msg)) {
    msg = msg.map(v => {
      if (v.indexOf(packageParser.sign) != 0) {
        v = packageParser.encodev2(v);
      }
      return v;
    });
  } else if (msg.indexOf(packageParser.sign) != 0) {
    msg = packageParser.encodev2(msg);
  }

  let c = await build(host, queue);
  let ch = c.ch;
  
  var allP = [ch.assertQueue(queue, {durable: true})];
  if (Array.isArray(msg)) {
    msg.forEach(v => {
      allP.push(ch.sendToQueue(queue, Buffer.from(v), {persistent: true}));
    });
  } else {
    allP.push(ch.sendToQueue(queue, Buffer.from(msg), {persistent: true}));
  }
  await Promise.all(allP);

  if (!opts.silent) {
    if (Array.isArray(msg)) {
      console.log(`[x] [${new Date().toLocaleString()}] Sent a batch ${msg[0]} ${msg.length} items`);
    } else {
      console.log(`[x] [${new Date().toLocaleString()}] Sent ${msg}`);
    }
  }
  await sleep(500);

  if (!opts.keep) {
    await closeChannel(host, queue);
  }
}

let action = (cmd, paramArr) => {
  paramArr = paramArr || [];
  return packageParser.encodev2(cmd, paramArr);
}

module.exports = {send, action}