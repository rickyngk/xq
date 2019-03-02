'use strict';
const Promise = require('bluebird');

let timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let sleep = async (ms, fn, ...args) => {
  await timeout(ms);
  if (typeof(fn) === 'function') {
    return fn(...args);
  } else {
    return null;
  }
}

module.exports = sleep;