const { red, yellow } = require('chalk');
const config = require('../config/config.json');

let errors = '';
const expected = [
  'apiClient',
  'cloudflare',
  'csrf',
  'lovedApiKey',
  'lovedBaseUrl',
  'lovedRoundId',
  'osuBaseUrl',
  'pollStartGuess',
  'session',
  'userAgent',
];
const moved = { lovedShInterOpKey: 'lovedApiKey' };
const unused = [
  'captains',
  'csrfOld',
  'date',
  'discord',
  'month',
  'osuApiKey',
  'resultsPost',
  'sessionOld',
  'time',
  'title',
  'username',
  'videos',
];

function addError(message) {
  errors += `  ${message}\n`;
}

for (const configKey of Object.keys(config)) {
  if (unused.includes(configKey)) {
    addError(yellow(`"${configKey}" is no longer used`));
  } else if (moved[configKey] != null) {
    addError(yellow(`"${configKey}" has been renamed to "${moved[configKey]}"`));
  } else if (!expected.includes(configKey)) {
    addError(red(`Unrecognized option "${configKey}"`));
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

config.lovedBaseUrl = config.lovedBaseUrl.replace(/\/+$/, '');
config.osuBaseUrl = config.osuBaseUrl.replace(/\/+$/, '');

module.exports = {
  ...require('../resources/info.json'),
  ...config,
};
