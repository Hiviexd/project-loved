const { red, yellow } = require('chalk');
const config = {
  ...require('../resources/info.json'),
  ...require('../config/config.json'),
};

let errors = '';
const expected = [
  'captains',
  'cloudflare',
  'csrf',
  'csrfOld',
  'discord',
  'lovedApiKey',
  'lovedRoundId',
  'month',
  'osuApiKey',
  'pollStartGuess',
  'resultsPost',
  'session',
  'sessionOld',
  'userAgent',
  'username',
  'videos',
];
const moved = { lovedShInterOpKey: 'lovedApiKey' };
const unused = ['date', 'time', 'title'];

function addError(message) {
  errors += `  ${message}\n`;
}

for (const configKey of Object.keys(config)) {
  if (unused.includes(configKey)) {
    addError(yellow(`"${configKey}" is no longer used`));
  } else if (moved[configKey] != null) {
    addError(yellow(`"${configKey}" has been renamed to "${moved[configKey]}"`));
  } else if (!expected.includes(configKey)) {
    addError(yellow(`Unrecognized option "${configKey}"`));
  }
}

for (const expectedKey of expected) {
  if (config[expectedKey] == null) {
    addError(red(`"${expectedKey}" is missing`));
  }
}

if (errors.length > 0) {
  process.stderr.write('Errors in config:\n' + errors);
  process.exit(1);
}

module.exports = config;
