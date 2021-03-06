// Copyright 2014 Joyent, Inc.  All rights reserved.
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

var fs = require('fs');

var assert = require('assert-plus');
var bunyan = require('bunyan');
var manta = require('manta');

var Cache = require('./cache');
var MantaFs = require('./fs');
var MantaClient = require('./manta');



///--- Helpers

function bytes(mb) {
    return (Math.floor(mb * 1024 * 1024));
}


function _export(obj) {
    Object.keys(obj).forEach(function (k) {
        module.exports[k] = obj[k];
    });
}



///--- API

function createClient(opts) {
    assert.optionalObject(opts, 'options');

    opts = opts || {};

    var cache;
    var log = opts.log || bunyan.createLogger({
        stream: process.stderr,
        level: process.env.LOG_LEVEL || 'warn',
        name: 'MantaFs',
        serializers: bunyan.stdSerializers
    });

    var mc = new MantaClient({
        log: log,
        manta: opts.manta
    });

    var size;
    if (opts.sizeMB) {
        size = bytes(opts.sizeMB);
    } else {
        size = opts.size || 2147483648; // 2GB
    }

    var wbtime;
    if (opts.wbtime) {
        wbtime = opts.wbtime * 1000;
    } else {
        wbtime = 60 * 1000;    // 1 minute
    }

    // - location<String>: file system root to cache in
    // - sizeMB<Number>: Maximum number of megabytes to have resident on disk
    // - ttl<Number>: Number of seconds in cache before being considered stale
    // - wbtime<Number>: Number of seconds a dirty file is in the cache before
    //                   being written back
    // - num_par<Number>: Number of parallel writebacks
    cache = new Cache({
        manta: mc,
        location: opts.path || '/var/tmp/mantafs',
        log: log,
        size: size,
        ttl: opts.ttl || 3600,
        wbtime: wbtime,
        num_par: opts.num_par || 5
    });

    return (new MantaFs({
        cache: cache,
        log: log,
        manta: mc,
        uid: opts.uid,
        gid: opts.gid
    }));
}



///--- Exports

module.exports = {
    createClient: createClient
};
