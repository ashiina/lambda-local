'use strict';

/*
 * Simplified mute module.
 * https://github.com/shannonmoeller/mute
 */

var concat = Array.prototype.concat;

function mute(stream) {
    var write = stream && stream.write;
    var originalWrite = write && write.originalWrite;

    // We only need to mute unmuted streams
    if (!write || originalWrite) {
        return;
    }

    function noop() {}
    noop.originalWrite = write;
    stream.write = noop;
}

function unmute(stream) {
    var write = stream && stream.write;
    var originalWrite = write && write.originalWrite;

    // We only need to unmute muted streams
    if (!write || !originalWrite) {
        return;
    }

    stream.write = originalWrite;
}

export = function() {
    var streams = [process.stdout, process.stderr];
    streams.forEach(mute);
    return function unmuteStreams() {
        streams.forEach(unmute);
    };
};
