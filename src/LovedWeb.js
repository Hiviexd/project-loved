const { dim, green, red, yellow } = require('chalk');
const superagent = require('superagent');
const config = require('./config');
const GameMode = require('./gamemode');

const baseUrl = config.lovedBaseUrl + '/api/local-interop';
const interopVersion = '7';

function handleLovedWebError(error) {
    if (typeof error === 'object' && error.response != null && error.response.body != null && error.response.body.error != null) {
        console.error(red(`[loved.sh] ${error.response.body.error}`));

        if (error.response.body.error === 'Unsupported program version') {
            process.exit(1);
        }
    }

    throw error;
}

module.exports = class LovedWeb {
    #request;

    constructor(key) {
        this.#request = superagent
            .agent()
            .set('X-Loved-InteropKey', key)
            .set('X-Loved-InteropVersion', interopVersion);
    }

    async getRoundInfo(roundId) {
        const response = await this.#request
            .get(`${baseUrl}/data`)
            .query({ roundId })
            .catch(handleLovedWebError);
        const {
            discord_webhooks: discordWebhooks,
            nominations,
            results_post_ids: resultsPostIds,
            round,
        } = response.body;
        const extraGameModeInfo = {};

        for (const gameMode of GameMode.modes()) {
            const gameModeInfo = round.game_modes[gameMode.integer];

            if (!gameModeInfo.nominations_locked)
                console.error(yellow(`${gameMode.longName} nominations are not locked on loved.sh`));

            extraGameModeInfo[gameMode.integer] = {
                descriptionAuthors: [],
                nominators: [],
                threshold: gameModeInfo.voting_threshold,
                thresholdFormatted: (gameModeInfo.voting_threshold * 100).toFixed() + '%',
                video: gameModeInfo.video,
            };

            if (resultsPostIds[gameMode.integer] == null)
                console.error(yellow(`${gameMode.longName} last round results post is not set`));
        }

        for (const nomination of nominations) {
            for (const creator of nomination.beatmapset_creators) {
                if (creator.id >= 4294000000) {
                    console.error(yellow(`Creator ${creator.name} on nomination #${nomination.id} has placeholder ID (#${creator.id})`));
                }
            }

            nomination.game_mode = new GameMode(nomination.game_mode);

            const extras = extraGameModeInfo[nomination.game_mode.integer];

            if (nomination.description_author != null && extras.descriptionAuthors.find((a) => a.id === nomination.description_author.id) == null)
                extras.descriptionAuthors.push(nomination.description_author);

            for (const nominator of nomination.nominators) {
                if (extras.nominators.find((n) => n.id === nominator.id) == null)
                    extras.nominators.push(nominator);
            }

            nomination.beatmapset.original_artist = nomination.beatmapset.artist;
            nomination.beatmapset.original_title = nomination.beatmapset.title;
            nomination.beatmapset.artist = nomination.overwrite_artist || nomination.beatmapset.artist;
            nomination.beatmapset.title = nomination.overwrite_title || nomination.beatmapset.title;
        }

        for (const gameMode of GameMode.modes()) {
            extraGameModeInfo[gameMode.integer].nominators.sort((a, b) => a.name.localeCompare(b.name));
        }

        return {
            allNominations: nominations,
            discordWebhooks,
            extraGameModeInfo,
            intro: round.news_intro == null ? '' : round.news_intro,
            introPreview: round.news_intro_preview == null ? '' : round.news_intro_preview,
            name: round.name,
            newsAuthorName: round.news_author.name,
            nominations: nominations.filter((n) => n.parent_id == null),
            outro: round.news_outro == null ? '' : round.news_outro,
            postTime: new Date(round.news_posted_at),
            resultsPostIds,
            title: `Project Loved: ${round.name}`,
            video: round.video,
        };
    }

    getRoundTopicIds(roundId) {
        return this.#request
            .get(`${baseUrl}/topic-ids`)
            .query({ roundId })
            .then((response) => response.body)
            .catch(handleLovedWebError);
    }

    async getRoundsAvailable() {
        const response = await this.#request
            .get(`${baseUrl}/rounds-available`)
            .catch(handleLovedWebError);

        return response.body;
    }

    createPolls(roundId, mainTopicBodies, nominationTopicBodies) {
        console.log(dim('[loved.sh] Creating forum polls\n[loved.sh] This may take a few minutes...'));

        return this.#request
            .post(`${baseUrl}/news`)
            .send({ mainTopicBodies, nominationTopicBodies, roundId })
            .then((response) => response.body)
            .catch(handleLovedWebError);
    }

    postResults(roundId, mainTopicIds) {
        console.log(dim('[loved.sh] Posting replies to forum\n[loved.sh] This may take a few minutes...'));

        return this.#request
            .post(`${baseUrl}/results`)
            .send({ mainTopicIds, roundId })
            .then()
            .catch(handleLovedWebError);
    }
};
