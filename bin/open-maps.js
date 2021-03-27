const open = require('open');
const config = { ...require('../resources/info.json'), ...require('../config/config.json') };
const LovedWeb = require('../src/LovedWeb');

(async () => {
  const roundInfo = await new LovedWeb(config.lovedApiKey).getRoundInfo(config.lovedRoundId);
  const beatmapsetIds = roundInfo.nominations.map((n) => n.beatmapset_id);
  const beatmapsetIdSet = new Set(beatmapsetIds);

  for (const beatmapsetId of beatmapsetIdSet)
    await open(`https://osu.ppy.sh/beatmapsets/${beatmapsetId}`);
})();
