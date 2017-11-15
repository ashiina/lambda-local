module.exports = {
  'directive': {
    'header': {
      'namespace': 'Alexa',
      'name': 'ReportState',
      'payloadVersion': '3',
      'messageId': '1bd5d003-31b9-476f-ad03-71d471922820'
    },
    'endpoint': {
      'endpointId': `${process.env.TEST_HUBID}-device-97`,
      'scope': {
        'type': 'BearerToken',
        'token': 'access-token-from-skill'
      }
    },
    'payload': {}
  }
};
