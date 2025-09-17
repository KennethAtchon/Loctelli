Redesign GHL integration from using the plan requests to its module:

const { HighLevel } = require('@gohighlevel/api-client');

const highLevel = new HighLevel({
  clientId: 'your_client_id_here',
  clientSecret: 'your_client_secret_here',
});

try {
  const response = await highLevel.opportunities.getOpportunity({
    'id': 'yWQobCRIhRguQtD2llvk'
  });
  console.log(response);
} catch (error) {
  console.error('Error:', error);
}


https://marketplace.gohighlevel.com/docs/oauth/GettingStarted