var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var EntityType = gameConst.eEntityType;
var playerManager = require('../player/playerManager');
var messageService = require('../../tools/messageService');

var exp = module.exports;

//Add event for aoi
exp.addEvent = function (area, aoi) {
    aoi.on('add', function (params) {
        params.area = area;
        switch (params.type) {
            case EntityType.PLAYER:
                onPlayerAdd(params);
                break;
        }
    });

    aoi.on('remove', function (params) {
        params.area = area;
        switch (params.type) {
            case EntityType.PLAYER:
                onPlayerRemove(params);
                break;
        }
    });

    aoi.on('update', function (params) {
        params.area = area;
        switch (params.type) {
            case EntityType.PLAYER:
                onObjectUpdate(params);
                break;
        }
    });

    aoi.on('updateWatcher', function (params) {
        params.area = area;
        switch (params.type) {
            case EntityType.PLAYER:
                onPlayerUpdate(params);
                break;
        }
    });
};

/**
 * Handle player add event
 * @param {Object} params Params for add player, the content is : {watchers, id}
 * @return void
 * @api private
 */
function onPlayerAdd(params) {
    var area = params.area;
    var watchers = params.watchers;
    var entityId = params.id;
    var player = playerManager.GetPlayer(entityId);

    if (!player) {
        return;
    }

    var uids = [], id;
    for (var type in watchers) {
        switch (type) {
            case EntityType.PLAYER:
                for (id in watchers[type]) {
                    var watcher = playerManager.GetPlayer(watchers[type][id]);
                    if (watcher && watcher.id !== entityId) {
                        var pos = watcher.GetPosition();
                        var msg = {
                            playerInfo: watcher.GetAoiInfo(),
                            itemInfo: watcher.GetAoiEquip(),
                            magicSoulInfo: watcher.GetAoiMagicSoul(),
                            fightPet: watcher.GetAoiPet(),
                            marryInfo: watcher.GetAoiMarry(),
                            posX: pos.x,
                            posY: pos.z,
                            posZ: pos.y
                        };
                        messageService.pushMessageToPlayer({sid: player.serverId, uid: player.userId}, 'ServerInitAoi',
                                                           msg);
                        uids.push({sid: watcher.serverId, uid: watcher.userId});
                    }
                }

                if (uids.length > 0) {
                    onAddEntity(uids, player);
                }
                break;
        }
    }
};

/**
 * Handle player remove event
 * @param {Object} params Params for remove player, the content is : {watchers, id}
 * @return void
 * @api private
 */
function onPlayerRemove(params) {
    var area = params.area;
    var watchers = params.watchers;
    var entityId = params.id;

    var uids = [];

    for (var type in watchers) {
        switch (type) {
            case EntityType.PLAYER:
                var watcher;
                for (var id in watchers[type]) {
                    watcher = playerManager.GetPlayer(watchers[type][id]);
                    if (watcher && entityId !== watcher.entityId) {
                        uids.push({sid: watcher.serverId, uid: watcher.userId});
                    }
                }

                onRemoveEntity(uids, entityId);
                break;
        }
    }
};

/**
 * Handle object update event
 * @param {Object} params Params for add object, the content is : {oldWatchers, newWatchers, id}
 * @return void
 * @api private
 */
function onObjectUpdate(params) {
    var area = params.area;
    var entityId = params.id;
    var entity = playerManager.GetPlayer(entityId);

    if (!entity) {
        return;
    }

    var oldWatchers = params.oldWatchers;
    var newWatchers = params.newWatchers;
    var removeWatchers = {}, addWatchers = {}, type, w1, w2, id;
    for (type in oldWatchers) {
        if (!newWatchers[type]) {
            removeWatchers[type] = oldWatchers[type];
            continue;
        }
        w1 = oldWatchers[type];
        w2 = newWatchers[type];
        removeWatchers[type] = {};
        for (id in w1) {
            if (!w2[id]) {
                removeWatchers[type][id] = w1[id];
            }
        }
    }

    for (type in newWatchers) {
        if (!oldWatchers[type]) {
            addWatchers[type] = newWatchers[type];
            continue;
        }

        w1 = oldWatchers[type];
        w2 = newWatchers[type];
        addWatchers[type] = {};
        for (id in w2) {
            if (!w1[id]) {
                addWatchers[type][id] = w2[id];
            }
        }
    }


    switch (params.type) {
        case EntityType.PLAYER:
            onPlayerAdd({area: area, id: params.id, watchers: addWatchers});
            onPlayerRemove({area: area, id: params.id, watchers: removeWatchers});
            break;
    }
};

/**
 * Handle player update event
 * @param {Object} params Params for player update, the content is : {watchers, id}
 * @return void
 * @api private
 */
function onPlayerUpdate(params) {
    var area = params.area;
    var player = playerManager.GetPlayer(params.id);
    if (player.type !== EntityType.PLAYER) {
        return;
    }
    var uid = {sid: player.serverId, uid: player.userId};

    if (params.removeObjs.length > 0) {
        messageService.pushMessageToPlayer(uid, 'ServerLeaveAoi', {'roleList': params.removeObjs});
    }

    if (params.addObjs.length > 0) {
        for (var index in params.addObjs) {
            var other = playerManager.GetPlayer(index);
            if (other) {
                var pos = other.GetPosition();
                var msg = {
                    playerInfo: other.GetAoiInfo(),
                    itemInfo: other.GetAoiEquip(),
                    magicSoulInfo: other.GetAoiMagicSoul(),
                    fightPet: other.GetAoiPet(),
                    marryInfo: other.GetAoiMarry(),
                    posX: pos.x,
                    posY: pos.z,
                    posZ: pos.y
                };
                messageService.pushMessageToPlayer(uid, 'ServerInitAoi', msg);
            }
        }
    }
};

/**
 * Push message for add entities
 * @param {Array} uids The users to notify
 * @param {Number} entityId The entityId to add
 * @api private
 */
function onAddEntity(uids, entity) {
    var pos = entity.GetPosition();
    var msg = {
        playerInfo: entity.GetAoiInfo(),
        itemInfo: entity.GetAoiEquip(),
        magicSoulInfo: entity.GetAoiMagicSoul(),
        fightPet: entity.GetAoiPet(),
        marryInfo: entity.GetAoiMarry(),
        posX: pos.x,
        posY: pos.z,
        posZ: pos.y
    };
    messageService.pushMessageByUids(uids, 'ServerInitAoi', msg);
};

/**
 * Push message for remove entities
 * @param {Array} uids The users to notify
 * @param {Number} entityId The entityId to remove
 * @api private
 */
function onRemoveEntity(uids, entityId) {
    if (uids.length <= 0) {
        return;
    }
    messageService.pushMessageByUids(uids, 'ServerLeaveAoi', {roleList: [entityId]});
};