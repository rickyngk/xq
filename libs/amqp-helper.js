'use strict';
var Promise = require('bluebird');
var amqp = require('amqplib/callback_api');

let connect = (host) => new Promise((resolve, reject) => {
  amqp.connect(host, (err, conn) => {
    if (err)
      return reject(err);
    else
      return resolve(conn);
  });
})

let createChannel = (connection) => {
  return new Promise((resolve, reject) => {
    connection.createChannel((err, ch) => {
      if (err) return reject(err);
      else return resolve(ch);
    })
  })
}

module.exports = {connect, createChannel};