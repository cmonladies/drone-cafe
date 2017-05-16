exports.config = {

  baseUrl: 'http://localhost:4444/wd/hub',

  specs: ['*.spec.js'],

  capabilities: {
    'browserName': 'chrome'
  },

  framework: 'mocha',

  mochaOpts: {
    reporter: "spec",
    timeout: 40000
  }
};