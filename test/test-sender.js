const sender = require('../sender/');

// sender.send('amqp://rabbitmq:9K739SQFCPBEL9DLBGNX@localhost', 'test', `single-message-${new Date()}`);
sender.send('amqp://rabbitmq:9K739SQFCPBEL9DLBGNX@localhost', 'test', sender.action('test-action', ['123']));