const { getDataConnect, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'billboard-reporting-app',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

