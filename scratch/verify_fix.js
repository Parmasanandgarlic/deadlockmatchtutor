const { normalizeSteamInput, steam64ToSteam32 } = require('../server/utils/helpers');

const tests = [
  'https://steamcommunity.com/profiles/76561198131104774/',
  'https://steamcommunity.com/id/vanityname',
  '76561198131104774',
  '170839046'
];

console.log('--- Helper Normalization Test ---');
tests.forEach(input => {
  const result = normalizeSteamInput(input);
  console.log(`Input: ${input}`);
  console.log(`Type: ${result.type}, Value: ${result.value}`);
  if (result.type === 'steam64') {
    console.log(`Steam32: ${steam64ToSteam32(result.value)}`);
  }
  console.log('---');
});
