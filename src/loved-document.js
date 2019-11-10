const path = require('path');
const {appendFileSync, readFileSync} = require('fs');
const Gamemode = require('./gamemode');
const Nomination = require('./nomination');

const beatmaps = {};

String.prototype.splitWithLeftOver = function (separator, limit) {
    if (limit <= 1)
        return [this];

    const split = this.split(separator, limit);

    if (split.length === limit) {
        let index = 0;
        let n = limit;

        while (--n) {
            index = this.indexOf(separator, index);
        }

        split[limit - 1] = this.substring(index + separator.length);
    }

    return split;
};

String.prototype.indexOfFirst = function (searches) {
    let index;

    for (let search of searches)
        if ((index = this.indexOf(search[0])) !== -1)
            return index + search[1];

    return -1;
}

module.exports.readDocument = function () {
    const logError = (shortMessage, longMessage) => {
        console.error(shortMessage + '\nSee error.log for more details.');

        const error = `> ${new Date()}\n> ${shortMessage}\n\n${longMessage}\n\n------------------------\n\n`;
        appendFileSync(path.join(__dirname, '../error.log'), error);

        process.exit();
    };

    let file = readFileSync(path.join(__dirname, '../config/document'), 'utf8');
    let noteMatch;

    file = file.replace(/\r\n/g, '\n');
    file = file.substring(file.match(/^News post$/m).index);

    const header = file.match(/^Header$(.+?)^Intro$/ms)[1].trim();
    const intro = file.match(/^Intro$(.+?)^Outro$/ms)[1].trim();
    const outro = file.match(/^Outro$(.+?)^osu!standard$/ms)[1].trim();

    file = file.substring(
        file.match(/^osu!standard$/m).index,
        file.match(/^Graveyard$/m).index
    ).trim();

    for (let mode of Gamemode.modes()) {
        file = file.substring(file.indexOf(`${mode.longName}\n`) + mode.longName.length);
        let data = (mode.integer === 3 ? file : file.substring(0, file.indexOf(`\n${new Gamemode(mode.integer + 1).longName}`))).trim();

        for (let position = 1; data.length > 0; position++) {
            const split = data.splitWithLeftOver('\n\n', 2);
            data = split.length === 2 ? split[1].trim() : '';

            const description = split[0];
            const descriptionSplit = description.splitWithLeftOver('\n', 2);

            let metadataSender;
            let metadataMessage;

            while ((noteMatch = descriptionSplit[1].match(/^(Noffy|Video): /)) !== null) {
                let substringIndex;

                if (noteMatch[1] === 'Video')
                    substringIndex = descriptionSplit[1].indexOf('\n\\\n') + 3;
                else {
                    metadataSender = noteMatch[1];
                    metadataMessage = descriptionSplit[1].substring(
                        noteMatch[0].length,
                        substringIndex = descriptionSplit[1].indexOfFirst([
                            ['\nVideo: ', 1],
                            ['\n\\\n', 3]
                        ])
                    ).replace(/^[\n\\ ]+|[\n\\ ]+$/g, '');
                }

                descriptionSplit[1] = descriptionSplit[1].substring(substringIndex);
            }

            const infoSplit = descriptionSplit[0].split('\t');

            if (infoSplit[1] === undefined)
                logError(
                    'Description did not match the expected format (info line contains no tabs)',
                    `Contents of descriptionSplit[0]:\n${descriptionSplit[0]}\n\nContents of description:\n${description}`
                );

            const titleSplit = infoSplit[1].splitWithLeftOver(' - ', 2);
            const nomination = new Nomination({
                mode: mode,
                position: position,
                id: infoSplit[0],
                artist: titleSplit[0],
                title: titleSplit[1],
                creators: infoSplit[2],
                captain: infoSplit[3],
                description: descriptionSplit[1]
            });

            if (infoSplit.length > 4)
                nomination.excludedBeatmaps = infoSplit[4];

            if (metadataSender !== undefined && metadataMessage !== undefined) {
                nomination.metadataMessageAuthor = metadataSender;
                nomination.metadataEdits = metadataMessage;
            }

            beatmaps[nomination.id] = nomination;
        }
    }

    return {
        header: header,
        intro: intro,
        outro: outro,
        nominations: beatmaps
    };
}

module.exports.singleCaptain = function (mode) {
    let captain;

    for (let beatmap of Object.values(beatmaps)) {
        if (beatmap.mode.integer !== mode.integer)
            continue;

        if (captain === undefined) {
            captain = beatmap.captain;
            continue;
        }

        if (beatmap.captain !== captain)
            return null;
    }

    return captain === undefined ? null : captain;
}
