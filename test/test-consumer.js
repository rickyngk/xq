require('../comsumer').register('amqp://rabbitmq:9K739SQFCPBEL9DLBGNX@localhost', 'test', (msg) => {
  console.log(msg);
  return 0;
});