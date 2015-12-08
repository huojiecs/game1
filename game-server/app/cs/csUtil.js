/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-7-15
 * Time: 下午6:24
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var async = require('async');
var csSql = require('../tools/mysql/csSql');
var utilSql = require('../tools/mysql/utilSql');
var paymentManager = require('./qq/paymentManager');
var gameConst = require('../tools/constValue');
var utils = require('../tools/utils');
var globalFunction = require('../tools/globalFunction');
var _ = require('underscore');
var defaultValues = require('../tools/defaultValues');
var ePlayerDB = gameConst.ePlayerDB;

var Handler = module.exports;

Handler.SavePlayerInfo = function (roleID, accountID, strInfo, callFun) {
    async.series([
            function (callback) {
                if (strInfo[ePlayerDB.PLAYERDB_PLAYERINFO] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.PLAYERDB_PLAYERINFO);
                } else {
                    csSql.SavePlayerInfo(roleID, strInfo[ePlayerDB.PLAYERDB_PLAYERINFO], function (err) {
                        callback(err, ePlayerDB.PLAYERDB_PLAYERINFO);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.PLAYERDB_ITEM] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.PLAYERDB_ITEM);
                } else {
                    csSql.SaveItemInfo(roleID, strInfo[ePlayerDB.PLAYERDB_ITEM], function (err) {
                        callback(err, ePlayerDB.PLAYERDB_ITEM);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.PLAYERDB_ASSETS] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.PLAYERDB_ASSETS);
                } else {
                    csSql.SaveAssetsInfo(roleID, strInfo[ePlayerDB.PLAYERDB_ASSETS], function (err) {
                        callback(err, ePlayerDB.PLAYERDB_ASSETS);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.PLAYERDB_AREA] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.PLAYERDB_AREA);
                } else {
                    csSql.SaveAreaSco(roleID, strInfo[ePlayerDB.PLAYERDB_AREA], function (err) {
                        callback(err, ePlayerDB.PLAYERDB_AREA);
                    });
                }
            },
            /*function (callback) {   //已格式化
             if (strInfo[ePlayerDB.PLAYERDB_SKILL] == gameConst.eDirtyNoChange) {
             callback(null, ePlayerDB.PLAYERDB_SKILL);
             } else {
             csSql.SaveSkillInfo(roleID, strInfo[ePlayerDB.PLAYERDB_SKILL], function (err) {
             callback(err, ePlayerDB.PLAYERDB_SKILL);
             });
             }
             },*/
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.PLAYERDB_SOUL] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.PLAYERDB_SOUL);
                } else {
                    csSql.SaveSoulInfo(roleID, strInfo[ePlayerDB.PLAYERDB_SOUL], function (err) {
                        callback(err, ePlayerDB.PLAYERDB_SOUL);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.PLAYERDB_ACTIVITY] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.PLAYERDB_ACTIVITY);
                } else {
                    csSql.SaveActivityInfo(roleID, strInfo[ePlayerDB.PLAYERDB_ACTIVITY], function (err) {
                        callback(err, ePlayerDB.PLAYERDB_ACTIVITY);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.PLAYERDB_NIUDAN] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.PLAYERDB_NIUDAN);
                } else {
                    csSql.SaveRoleNiuDan(roleID, strInfo[ePlayerDB.PLAYERDB_NIUDAN], function (err) {
                        callback(err, ePlayerDB.PLAYERDB_NIUDAN);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.AsyncPvPRival] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.AsyncPvPRival);
                } else {
                    csSql.SaveAsyncPvPRival(roleID, strInfo[ePlayerDB.AsyncPvPRival], function (err) {
                        callback(err, ePlayerDB.AsyncPvPRival);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.PLAYERDB_SHOP] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.PLAYERDB_SHOP);
                } else {
                    csSql.SaveRoleShop(roleID, strInfo[ePlayerDB.PLAYERDB_SHOP], function (err) {
                        callback(err, ePlayerDB.PLAYERDB_SHOP);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.PLAYERDB_ATT] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.PLAYERDB_ATT);
                } else {
                    csSql.SaveRoleAttribute(roleID, strInfo[ePlayerDB.PLAYERDB_ATT], function (err) {
                        callback(err, ePlayerDB.PLAYERDB_ATT);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.Mission] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.Mission);
                } else {
                    csSql.SaveRoleMission(roleID, strInfo[ePlayerDB.Mission], function (err) {
                        callback(err, ePlayerDB.Mission);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.NewHelp] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.NewHelp);
                } else {
                    csSql.SaveRoleNewHelp(roleID, strInfo[ePlayerDB.NewHelp], function (err) {
                        callback(err, ePlayerDB.NewHelp);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.AsyncPvPInfo] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.AsyncPvPInfo);
                } else {
                    csSql.SaveAsyncPvPInfo(roleID, strInfo[ePlayerDB.AsyncPvPInfo], function (err) {
                        callback(err, ePlayerDB.AsyncPvPInfo);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.GetGift] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.GetGift);
                } else {
                    csSql.SaveRoleGift(roleID, strInfo[ePlayerDB.GetGift], function (err) {
                        callback(err, ePlayerDB.GetGift);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.Achieve] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.Achieve);
                } else {
                    csSql.SaveRoleAchieve(roleID, strInfo[ePlayerDB.Achieve], function (err) {
                        callback(err, ePlayerDB.Achieve);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.PLAYERDB_MAGICSOUL] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.PLAYERDB_MAGICSOUL);
                } else {
                    csSql.SaveMagicSoulInfo(roleID, strInfo[ePlayerDB.PLAYERDB_MAGICSOUL], function (err) {
                        callback(err, ePlayerDB.PLAYERDB_MAGICSOUL);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.Physical] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.Physical);
                } else {
                    csSql.SavePhysicalInfo(roleID, strInfo[ePlayerDB.Physical], function (err) {
                        callback(err, ePlayerDB.Physical);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.MisGroup] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.MisGroup);
                } else {
                    csSql.SaveRoleMisGroup(roleID, strInfo[ePlayerDB.MisGroup], function (err) {
                        callback(err, ePlayerDB.MisGroup);
                    });
                }
            },
            function (callback) {
                if (strInfo[ePlayerDB.ClimbData] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.ClimbData);
                } else {
                    csSql.SaveClimbInfo(roleID, strInfo[ePlayerDB.ClimbData], function (err) {
                        callback(err, ePlayerDB.ClimbData);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.PLAYERDB_ALCHEMY] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.PLAYERDB_ALCHEMY);
                } else {
                    csSql.SaveAlchemyInfo(roleID, strInfo[ePlayerDB.PLAYERDB_ALCHEMY], function (err) {
                        callback(err, ePlayerDB.PLAYERDB_ALCHEMY);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.MisFinish] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.MisFinish);
                } else {
                    csSql.SaveMisFinishData(roleID, strInfo[ePlayerDB.MisFinish], function (err) {
                        callback(err, ePlayerDB.MisFinish);
                    });
                }
            },
            function (callback) {
                if (strInfo[ePlayerDB.VipInfoManager] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.VipInfoManager);
                } else {
                    csSql.SaveVipInfo(roleID, strInfo[ePlayerDB.VipInfoManager], function (err) {
                        callback(err, ePlayerDB.VipInfoManager);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.LoginGift] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.LoginGift);
                } else {
                    csSql.SaveLoginGift(roleID, strInfo[ePlayerDB.LoginGift], function (err) {
                        callback(err, ePlayerDB.LoginGift);
                    });
                }
            },
            function (callback) {//新增加
                if (strInfo[ePlayerDB.MineManager] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.MineManager);
                } else {
                    csSql.SaveMineInfoData(roleID, strInfo[ePlayerDB.MineManager], function (err) {
                        callback(err, ePlayerDB.MineManager);
                    });
                }
            },
            function (callback) {//装备套装
                if (strInfo[ePlayerDB.SuitInfo] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.SuitInfo);
                } else {
                    csSql.SaveSuitInfo(roleID, strInfo[ePlayerDB.SuitInfo], function (err) {
                        callback(err, ePlayerDB.SuitInfo);
                    });
                }
            },
            function (callback) {//保存领奖状态
                if (strInfo[ePlayerDB.HonorRewardTop] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.HonorRewardTop);
                } else {
                    csSql.SaveHonorReward(roleID, strInfo[ePlayerDB.HonorRewardTop], function (err) {
                        callback(err, ePlayerDB.HonorRewardTop);
                    });
                }
            },
            function (callback) {
                if (strInfo[ePlayerDB.PLAYERDB_RUNE] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.PLAYERDB_RUNE);
                } else {
                    csSql.SaveRuneInfo(roleID, strInfo[ePlayerDB.PLAYERDB_RUNE], function (err) {
                        callback(err, ePlayerDB.PLAYERDB_RUNE);
                    })
                }
            },
            function (callback) {
                if (strInfo[ePlayerDB.ShopLingli] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.ShopLingli);
                } else {
                    utilSql.SaveList('shoplingli', roleID, strInfo[ePlayerDB.ShopLingli], function (err) {
                        callback(null, [err, ePlayerDB.ShopLingli]);
                    })
                }
            },
            function (callback) {
                if (strInfo[ePlayerDB.RewardMis] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.RewardMis);
                } else {
                    csSql.SaveRewardMis(roleID, strInfo[ePlayerDB.RewardMis], function (err) {
                        callback(err, ePlayerDB.RewardMis);
                    })
                }
            },
            function (callback) {
                if (strInfo[ePlayerDB.FashionSuit] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.FashionSuit);
                } else {
                    csSql.SaveInfo('fashion', roleID, strInfo[ePlayerDB.FashionSuit], function (err) {
                        callback(err, ePlayerDB.FashionSuit);
                    })
                }
            },
            function (callback) {
                if (strInfo[ePlayerDB.PLAYERDB_ACTIVITYCD] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.PLAYERDB_ACTIVITYCD)
                } else {
                    csSql.SaveActivityCdInfo(roleID, strInfo[ePlayerDB.PLAYERDB_ACTIVITYCD], function (err) {
                        callback(err, ePlayerDB.PLAYERDB_ACTIVITYCD);
                    })
                }
            },
            function (callback) {
                if (strInfo[ePlayerDB.OperateInfo] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.OperateInfo);
                } else {
                    csSql.SaveOperateInfo(roleID, strInfo[ePlayerDB.OperateInfo], function (err) {
                        callback(err, ePlayerDB.OperateInfo);
                    })
                }
            },
            function (callback) {
                if (strInfo[ePlayerDB.Title] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.Title);
                } else {
                    csSql.SaveInfo('title', roleID, strInfo[ePlayerDB.Title], function (err) {
                        callback(err, ePlayerDB.Title);
                    })
                }
            },
            /* function (callback) {
             if (strInfo[ePlayerDB.ChartReward] == gameConst.eDirtyNoChange) {
             callback(null, ePlayerDB.ChartReward);
             } else {
             csSql.SaveInfo('chartreward', roleID, strInfo[ePlayerDB.ChartReward], function (err) {
             callback(err, ePlayerDB.ChartReward);
             })
             }
             },*/
            function (callback) {
                if (strInfo[ePlayerDB.ChartAcceptReward] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.ChartAcceptReward);
                } else {
                    csSql.SaveInfo('chartrewardgettime', roleID, strInfo[ePlayerDB.ChartAcceptReward],
                                   function (err) {
                                       callback(err, ePlayerDB.ChartAcceptReward);
                                   })
                }
            },
            function (callback) {
                if (strInfo[ePlayerDB.Exchange] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.Exchange);
                } else {
                    csSql.SaveInfo('exchange', roleID, strInfo[ePlayerDB.Exchange], function (err) {
                        callback(err, ePlayerDB.Exchange);
                    })
                }
            },
            function (callback) {
                if (strInfo[ePlayerDB.MonthCard] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.MonthCard);
                } else {
                    csSql.SaveInfo('monthcardreceive', roleID, strInfo[ePlayerDB.MonthCard], function (err) {
                        callback(err, ePlayerDB.MonthCard);
                    })
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.AskMagic] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.AskMagic);
                } else {
                    csSql.SaveMagicIndex(roleID, strInfo[ePlayerDB.AskMagic], function (err) {
                        callback(err, ePlayerDB.AskMagic);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.MagicOutput] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.MagicOutput);
                } else {
                    csSql.SaveMagicOutputsInfo(roleID, strInfo[ePlayerDB.MagicOutput], function (err) {
                        callback(err, ePlayerDB.MagicOutput);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.SoulSuccinct] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.SoulSuccinct);
                } else {
                    csSql.SaveSuccinctInfo(roleID, strInfo[ePlayerDB.SoulSuccinct], function (err) {
                        callback(err, ePlayerDB.SoulSuccinct);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.SuccinctNum] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.SuccinctNum);
                } else {
                    csSql.SaveSuccinctNum(roleID, strInfo[ePlayerDB.SuccinctNum], function (err) {
                        callback(err, ePlayerDB.SuccinctNum);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.NoticeInfo] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.NoticeInfo);
                } else {
                    csSql.SaveNoticeInfo(roleID, strInfo[ePlayerDB.NoticeInfo], function (err) {
                        callback(err, ePlayerDB.NoticeInfo);
                    });
                }
            },
            /*
             function (callback) {   //已格式化
             if (strInfo[ePlayerDB.UnionMagic] == gameConst.eDirtyNoChange) {
             callback(null, ePlayerDB.UnionMagic);
             } else {
             csSql.SaveUnionPlayerMagic(roleID, strInfo[ePlayerDB.UnionMagic], function (err) {
             callback(err, ePlayerDB.UnionMagic);
             });
             }
             }
             */
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.UnionTemple] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.UnionTemple);
                } else {
                    csSql.SaveRoleTempleInfo(roleID, strInfo[ePlayerDB.UnionTemple], function (err) {
                        callback(err, ePlayerDB.UnionTemple);
                    });
                }
            },
            function (callback) {   //已格式化
                if (strInfo[ePlayerDB.QQMemberGift] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.QQMemberGift);
                } else {
                    csSql.SaveGiftInfo(accountID, strInfo[ePlayerDB.QQMemberGift], function (err) {
                        callback(err, ePlayerDB.QQMemberGift);
                    });
                }
            },
            function (callback) {
                if(defaultValues.IsPetOpening) {
                    if (strInfo[ePlayerDB.Pets] == gameConst.eDirtyNoChange) {
                        callback(null, ePlayerDB.Pets);
                    } else {
                        utilSql.SaveList('pets', roleID, strInfo[ePlayerDB.Pets], function (err) {
                            callback(null, [err, ePlayerDB.Pets]);
                        })
                    }
                } else {
                    callback(null, []);
                }
            },
            function (callback) {
                if (strInfo[ePlayerDB.Advance] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.Advance);
                } else {
                    csSql.SaveAdvanceInfo(roleID, strInfo[ePlayerDB.Advance], function (err) {
                        callback(err, ePlayerDB.Advance);
                    });
                }
            },
            function (callback) {
                if(defaultValues.IsPetOpening) {
                    if(strInfo[ePlayerDB.PetsAtt] == gameConst.eDirtyNoChange) {
                        callback(null, ePlayerDB.PetsAtt);
                    } else {
                        csSql.SavePetsAttribute(roleID, strInfo[ePlayerDB.PetsAtt], function(err) {
                            callback(err, ePlayerDB.PetsAtt);
                        });
                    }
                } else {
                    callback(null, []);
                }
            },
            function (callback) {
                if (strInfo[ePlayerDB.Coliseum] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.Coliseum);
                } else {
                    csSql.SaveColiseumInfo(roleID, strInfo[ePlayerDB.Coliseum], function (err) {
                        callback(err, ePlayerDB.Coliseum);
                    });
                }
            },
            function (callback) {
                if (strInfo[ePlayerDB.Artifact] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.Artifact);
                } else {
                    csSql.SaveInfo('artifact', roleID, strInfo[ePlayerDB.Artifact], function (err) {
                        callback(null, [err, ePlayerDB.Artifact]);
                    })
                }
            },
            function (callback) {
                if (strInfo[ePlayerDB.ToMarry] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.ToMarry);
                } else {
                    csSql.SaveToMarryInfo(roleID, strInfo[ePlayerDB.ToMarry], function (err) {
                        callback(err, ePlayerDB.ToMarry);
                    });
                }
            },
            function (callback) {
                if (strInfo[ePlayerDB.MarryInfo] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.MarryInfo);
                } else {
                    csSql.SaveMarryInfo(roleID, strInfo[ePlayerDB.MarryInfo], function (err) {
                        callback(err, ePlayerDB.MarryInfo);
                    });
                }
            },
            function (callback) {
                if (strInfo[ePlayerDB.XuanYan] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.XuanYan);
                } else {
                    csSql.SaveMarryXuanYan(roleID, strInfo[ePlayerDB.XuanYan], function (err) {
                        callback(err, ePlayerDB.XuanYan);
                    });
                }
            },
            function (callback) {
                if (strInfo[ePlayerDB.MarryMsg] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.MarryMsg);
                } else {
                    csSql.SaveMarryMsg(roleID, strInfo[ePlayerDB.MarryMsg], function (err) {
                        callback(err, ePlayerDB.MarryMsg);
                    });
                }
            },
			function (callback) {
                if (strInfo[ePlayerDB.StoryDrak] == gameConst.eDirtyNoChange) {
                    callback(null, ePlayerDB.StoryDrak);
                } else {
                    csSql.SaveStoryDrak(roleID, strInfo[ePlayerDB.StoryDrak], function (err) {
                        callback(err, ePlayerDB.StoryDrak);
                    });
                }
            }
        ],
        function (err, res) {
            callFun(err, res);
        }
    )
};

Handler.LoadPlayerInfo = function (roleID, accountID, paymentInfo, roleServerUid, callFun) {
    async.series([
            function (callback) {   //已格式化
                csSql.LoadPlayerInfo(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {   //已格式化
                csSql.LoadItemInfo(roleID, function (err, dataList, Len) {
                    callback(err, dataList, Len);
                });
            },
            function (callback) {   //已格式化
                csSql.LoadAssetsInfo(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {   //已格式化
                csSql.LoadAreaSco(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {   //已格式化
                csSql.LoadRoleSkill(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {   //已格式化
                csSql.LoadRoleSoul(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {   //已格式化
                csSql.LoadRoleActivity(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {   //已格式化
                csSql.LoadRoleNiuDan(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {   //已格式化
                csSql.LoadAsyncPvPRival(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {   //已格式化
                csSql.LoadRoleShop(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {
                callback(null, []);
            },
            function (callback) {   //已格式化
                csSql.LoadRoleMission(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {   //已格式化
                csSql.LoadRoleNewHelp(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {   //已格式化
                csSql.LoadAsyncPvPInfo(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {   //已格式化
                csSql.LoadRoleGift(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {   //已格式化
                csSql.LoadRoleAchieve(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {   //已格式化
                csSql.LoadRoleMagicSoul(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {   //已格式化
                csSql.LoadRolePhysical(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {   //已格式化
                csSql.LoadRoleMisGroup(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {   //已格式化
                csSql.LoadRoleClimbData(roleID, function (err, dataList) {
                    callback(err, dataList);
                })
            },
            function (callback) {   //已格式化
                csSql.LoadRoleAlchemyData(roleID, function (err, dataList) {
                    callback(err, dataList);
                })
            },
            function (callback) {   //已格式化
                csSql.LoadMisFinishData(roleID, function (err, dataList) {
                    callback(err, dataList);
                })
            },
            function (callback) {
                csSql.LoadVipInfoData(roleID, function (err, dataList) {
                    callback(err, dataList);
                })
            },
            function (callback) {
                csSql.LoadLoginGift(roleID, function (err, dataList) {
                    callback(err, dataList);
                })
            },
            function (callback) {
                csSql.LoadMineInfoData(roleID, function (err, dataList) {
                    callback(err, dataList);
                })
            },
            function (callback) {
                csSql.LoadSuitData(roleID, function (err, dataList) {
                    callback(err, dataList);
                })
            },
            function (callback) {
                csSql.LoadHonorRewardData(roleID, function (err, dataList) {
                    callback(err, dataList);
                })
            },
            function (callback) {
                csSql.LoadRoleRune(roleID, function (err, dataList) {
                    callback(err, dataList);
                })
            },
            function (callback) {
                utilSql.LoadList('shoplingli', roleID, function (err, dataList) {
                    callback(err, dataList);
                })
            },
            function (callback) {
                csSql.LoadRewardMis(roleID, function (err, dataList) {
                    callback(err, dataList);
                })
            },
            function (callback) {
                utilSql.LoadList('fashion', roleID, function (err, dataList) {
                    callback(err, dataList);
                })
            },
            function (callback) {
                csSql.LoadActivityCD(roleID, function (err, dataList) {
                    callback(err, dataList);
                })
            },
            function (callback) {
                csSql.LoadOperateInfo(roleID, function (err, dataList) {
                    callback(err, dataList);
                })
            },
            function (callback) {
                utilSql.LoadList('title', roleID, function (err, dataList) {
                    callback(err, dataList);
                })
            },
            function (callback) {
                utilSql.LoadList('chartreward', roleID, function (err, dataList) {
                    callback(err, dataList);
                })
            },
            function (callback) {
                utilSql.LoadList('chartrewardgettime', roleID, function (err, dataList) {
                    callback(err, dataList);
                })
            },
            function (callback) {
                utilSql.LoadList('exchange', roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {
                utilSql.LoadList('monthcardreceive', roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {
                csSql.LoadMagicIndex(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {
                csSql.LoadMagicOutputInfo(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {
                csSql.LoadSuccinctInfo(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {
                csSql.LoadSuccinctNum(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {
                csSql.LoadNoticeInfo(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {
                csSql.LoadPlayerUnionMagic(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },

            function (callback) {
                csSql.LoadRoleTempleInfo(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {
                csSql.LoadExtraVipPoint(accountID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            /** 加载qq会员礼包信息*/
                function (callback) {
                csSql.LoadGiftNewInfo(roleID, accountID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {
                if(defaultValues.IsPetOpening) {
                    utilSql.LoadList('pets', roleID, function (err, dataList) {
                        callback(err, dataList);
                    })
                } else {
                    callback();
                }
            },
            function (callback) {
                utilSql.LoadList('advance', roleID, function (err, dataList) {
                    callback(err, dataList);
                })
            },
            function (callback) {
                // PetsAtt 占位
                callback(null, []);
            },
            function (callback) {
                csSql.LoadColiseumInfo(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            function (callback) {
                // 神装
                csSql.LoadArtifactInfo(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            /** 加载求婚信息*/
            function (callback) {
                csSql.LoadToMarryInfo(roleID,function (err, dataList) {
                    callback(err, dataList);
                });
            },
             function (callback) {
                // marryInfo 占位
                callback(null, []);
            },
             function (callback) {
                // xuanyan 占位
                callback(null, []);
            },
             function (callback) {
                // marryMsg 占位
                callback(null, []);
            },
			function (callback) {
                csSql.LoadStoryDrak(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            }
            
        ],
        function (err, res) {

            // load money from tencent midasi.

            if (!!err) {
                return callFun(err, res);
            }

            if (defaultValues.paymentType == gameConst.ePaymentType.PT_TENCENT && !!paymentInfo
                && (paymentInfo.accountType == gameConst.eLoginType.LT_QQ
                    || paymentInfo.accountType == gameConst.eLoginType.LT_WX
                    || paymentInfo.accountType == gameConst.eLoginType.LT_TENCENT_GUEST)) {

                paymentManager.getBalance(paymentInfo, roleServerUid, function (error, result) {

                    if (!!error) {
                        logger.error('paymentManager.getBalance failed result: %j, error: %s', result,
                                     utils.getErrorMessage(error));
                        res[ePlayerDB.PLAYERDB_ASSETS][globalFunction.GetYuanBaoTemp()] = 0;
                    }
                    else {

                        var vipPoint = res[ePlayerDB.PLAYERDB_PLAYERINFO][gameConst.ePlayerInfo.VipPoint];
                        res[ePlayerDB.PLAYERDB_ASSETS][globalFunction.GetYuanBaoTemp()] =
                            result.balance - (result.save_amt - vipPoint);

                        logger.warn('paymentManager.getBalance: %j, %j, vipPoint: %j, save_amt: %j, balance: %j',
                                    error, result, vipPoint, result.save_amt, result.balance);
                    }

                    return callFun(err, res);
                });
            }
            else {
                return callFun(err, res);
            }
        }
    )
};

Handler.SaveOfflinePlayerInfo = function (roleID, strInfo, callFun) {
    async.series({
            PLAYERDB_PLAYERINFO: function (callback) {
                csSql.SavePlayerInfo(roleID, strInfo['PLAYERDB_PLAYERINFO'], function (err) {
                    callback(err, ePlayerDB.PLAYERDB_PLAYERINFO);
                });
            },
            PLAYERDB_ASSETS: function (callback) {
                csSql.SaveAssetsInfo(roleID, strInfo['PLAYERDB_ASSETS'], function (err) {
                    callback(err, ePlayerDB.PLAYERDB_ASSETS);
                });
            },
            AsyncPvPRival: function (callback) {
                csSql.SaveAsyncPvPRival(roleID, strInfo['AsyncPvPRival'], function (err) {
                    callback(err, ePlayerDB.AsyncPvPRival);
                });
            },
            AsyncPvPInfo: function (callback) {
                csSql.SaveAsyncPvPInfo(roleID, strInfo['AsyncPvPInfo'], function (err) {
                    callback(err, ePlayerDB.AsyncPvPInfo);
                });
            }
        },
        function (err, res) {
            callFun(err, res);
        }
    )
};

Handler.LoadOfflinePlayerInfo = function (roleID, callFun) {
    async.series({
                     PLAYERDB_PLAYERINFO: function (callback) {
                         csSql.LoadPlayerInfo(roleID, function (err, playerInfo) {
                             var key = ePlayerDB.PLAYERDB_PLAYERINFO;
                             callback(err, playerInfo);
                         });
                     },
                     PLAYERDB_ITEM: function (callback) {
                         csSql.LoadItemInfo(roleID, function (err, itemList, Len) {
                             var key = ePlayerDB.PLAYERDB_ITEM;
                             callback(err, itemList, Len);
                         });
                     },
                     PLAYERDB_ASSETS: function (callback) {
                         csSql.LoadAssetsInfo(roleID, function (err, assetsInfo) {
                             callback(err, assetsInfo);
                         });
                     },
                     PLAYERDB_SOUL: function (callback) {
                         csSql.LoadRoleSoul(roleID, function (err, soulList) {
                             callback(err, soulList);
                         });
                     },
                     AsyncPvPInfo: function (callback) {
                         csSql.LoadAsyncPvPInfo(roleID, function (err, data) {
                             callback(err, data);
                         });
                     },
                     PLAYERDB_MAGICSOUL: function (callback) {
                         csSql.LoadRoleMagicSoul(roleID, function (err, dataList) {
                             callback(err, dataList);
                         });
                     },
                     PLAYERDB_PET: function (callback) {
                         if(defaultValues.IsPetOpening) {
                             utilSql.LoadList('pets', roleID, function (err, dataList) {
                                 callback(err, dataList);
                             })
                         } else {
                             callback();
                         }

                     },
                    PLAYERDB_TOMARRY: function (callback) {
                        csSql.LoadMarryXuanYan(roleID, null, function (err, dataList) {
                            callback(err, dataList);
                        });
                    },
                    PLAYERDB_JJC: function (callback) {
                        utilSql.LoadList('rolejjc', roleID, function (err, dataList) {
                            callback(err, dataList);
                        })
                    }

                 },
                 function (err, res) {
                     callFun(err, res);
                 }
    )
};

Handler.InsertLog = function (tableName, logList, callback) {
    csSql.insertLog(tableName, logList, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadDetailToRedisPlayerInfo = function (roleID, callFun) {
    async.series({
            PLAYERDB_PLAYERINFO: function (callback) {
                csSql.LoadPlayerInfo(roleID, function (err, playerInfo) {
                    var key = ePlayerDB.PLAYERDB_PLAYERINFO;
                    callback(err, playerInfo);
                });
            },
            PLAYERDB_ITEM: function (callback) {
                csSql.LoadItemInfo(roleID, function (err, itemList, Len) {
                    var key = ePlayerDB.PLAYERDB_ITEM;
                    callback(err, itemList, Len);
                });
            },
            PLAYERDB_SOUL: function (callback) {
                csSql.LoadRoleSoul(roleID, function (err, soulList) {
                    callback(err, soulList);
                });
            },
            PLAYERDB_MAGICSOUL: function (callback) {
                csSql.LoadRoleMagicSoul(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            PLAYERDB_SKILLS: function (callback) {
                csSql.LoadRoleSkill(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            PLAYERDB_RUNE: function (callback) {
                csSql.LoadRoleRune(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            },
            PLAYERDB_PET: function (callback) {
                if(defaultValues.IsPetOpening) {
                    utilSql.LoadList('pets', roleID, function (err, dataList) {
                        callback(err, dataList);
                    })
                } else {
                    callback();
                }
            },
           PLAYERDB_JJC: function (callback) {
                utilSql.LoadList('rolejjc', roleID, function (err, dataList) {
                    callback(err, dataList);
                });
           },

            PLAYERDB_TOMARRY: function (callback) {
                csSql.LoadToMarryInfo(roleID, function (err, dataList) {
                    callback(err, dataList);
                });
            }
        },
        function (err, res) {
            callFun(err, res);
        }
    )
};

/**
 * cs 分配方法
 * 1， 添加该方法 是为了尽量将同cs的玩家分配到相同的cs上
 * 2， 当
 *
 * @param {String} frontendId 前端id
 * */
Handler.GetCsID2 = function (frontendId) {
    var self = this;
    var csSever = null;
    if (!this.csNumList) {
        this.csNumList = {};
    }

    csSever = self.GetCsIDWithConID(frontendId);
    logger.error("allocation csID frontendId: %j --> csID: %j", frontendId, csSever);
    var roleNum = Number.MAX_VALUE;
    var roleCount = 0;
    if (null == csSever) {

        var list = self.GetCsIDArray();
        if (!list || !list.length) {
            return csSever;
        }
        _.each(list, function (item) {

            var key = item.id;
            var val = self.csNumList[key] || 0;

            roleCount += val;

            /*if (val >= defaultValues.maxUserPerCs) {
             return;
             }*/

            if (roleNum >= val) {
                csSever = key;
                roleNum = val;
            }
        });
    }

    var playerCount = playerManager.GetPlayerCount();

    if (playerCount >= defaultValues.maxUserPs) {
        logger.warn('Can not find cs server 2. reach maxUserPs: %j, csSever: %j, roleCount: %j',
                    defaultValues.maxUserPs, csSever, roleCount);
        csSever = null;
    } else if (!_.isString(csSever)) {
        logger.error('can not find cs server 3. %j', csSever);
        csSever = null;
    }

    return csSever;
};

/**
 * 获取cs list [cs-server-1, cs-server-2]
 * @return {Array}
 * */
Handler.GetCsIDArray = function () {

    if (!this.csRefreshTime || new Date().getTime() - this.csRefreshTime > defaultValues.USE_SERVER_ID_REFRESH_TIME) {
        var list = pomelo.app.getServersByType('cs');
        if (!list || !list.length) {
            logger.error('can not find cs server 0.');
            return [];
        }

        list.sort(function (a, b) {
            return a.id > b.id;
        });
        this.csList = list;
        this.csRefreshTime = new Date().getTime();
    }

    return this.csList;
};

/**
 * 获取connector list [connector-server-1, connector-server-2]
 * @return {Array}
 * */
Handler.GetConnectorIDArray = function () {

    if (!this.conRefreshTime || new Date().getTime() - this.conRefreshTime > defaultValues.USE_SERVER_ID_REFRESH_TIME) {
        var conList = pomelo.app.getServersByType('connector');

        if (!conList || !conList.length) {
            logger.error('can not find connector server 1.');
            return [];
        }

        conList = _.filter(conList, function (item) {
            return item.id.indexOf('ls') === -1 && item.dedicateDispatcher == "false";
        });

        conList.sort(function (a, b) {
            return a.id > b.id;
        });
        this.conList = conList;
        this.conRefreshTime = new Date().getTime()
    }
    return this.conList;
};

/***
 * 根据 connector id 获取对应的cs id
 *
 * @param {String} frontendId 前端id
 * */
Handler.GetCsIDWithConID = function (frontendId) {
    var self = this;
    var csSever = null;

    var list = self.GetCsIDArray();
    if (!list || !list.length) {
        return csSever;
    }

    /** 重不同的服获取 该列表时顺序是否一致 ？？？*/
    var conList = self.GetConnectorIDArray();
    if (!conList || !conList.length) {
        return csSever;
    }

    var curIndex = parseInt(frontendId.split("-")[2]) - 1;
    /** 当前端服大于后端服的时候 */
    if (list.length > conList.length) {
        /** 当cs 大于 connector 长度的时候*/
        return allocationMin(curIndex, list, conList);
    } else if (list.length == conList.length) {
        /** connector length 等于 cs length*/
        csSever = list[curIndex - 1].id;
    } else {
        /** 当cs 小于 connector 时 暂时 第一版 这里需要用迭代 防止 connector 是cs 的2倍以上*/
        return allocationMax(curIndex, list);
    }

    return csSever;
};

/**
 * 当connector 大于cs 分配迭代函数
 *
 * @param {Number} curIndex 当前connector id index
 * @param {Array} list csList
 * return {String}
 * */
var allocationMax = function (curIndex, list) {
    /** 当cs 小于 connector 时 暂时 第一版 这里需要用迭代 防止 connector 是cs 的2倍以上*/
    if (curIndex > list.length) {
        var last = curIndex - list.length;
        if (last > list.length) {
            return allocationMax(last, list);
        } else {
            /** 获取随机*/
            return null; // 丢给外层随机
        }
    } else {
        return list[curIndex - 1].id;
    }
};

/**
 * 当connector 小于cs 分配迭代函数
 *
 * @param {Number} curIndex 当前connector id index
 * @param {Array} list csList
 * return {String}
 * */
var allocationMin = function (curIndex, list, conList) {
    /** 当cs 大于 connector 时 暂时 第一版 这里需要用迭代 防止 connector 是cs 的2倍以上*/
    if (curIndex <= list.length) {
        if (isHappen(conList.length / list.length)) {
            return list[curIndex - 1].id;
        }
        var add = curIndex + conList.length;
        if (add < list.length) {
            return allocationMin(add, list, conList);
        } else {
            return allocationLast(curIndex, list); // 丢给外层随机
        }
    } else {
        return allocationLast(curIndex, list); // 丢给外层随机
    }
};

/**
 * 是否 发生
 * 概率事件
 *
 * @param {Number} rate
 * */
var isHappen = function (rate) {
    return Math.random() < rate;
};

/**
 * cs 大于 connector 随机分配
 * */
var allocationLast = function (curIndex, list) {
    var csSever = null;
    var roleNum = Number.MAX_VALUE;
    for (var i = curIndex; i < list.length; i++) {
        var item = list[i];
        var key = item.id;
        var val = self.csNumList[key] || 0;
        if (roleNum >= val) {
            csSever = key;
            roleNum = val;
        }
    }
    return csSever;
};

/**
 * 是否是定向分配 cs
 *
 * @param {String} frontendId 前端服id
 * @param {String} csID csID
 * @return {Boolean}
 * **/
Handler.isOrient = function (frontendId, csID) {
    var self = this;
    var list = self.GetCsIDArray();
    if (!list || !list.length) {
        return false;
    }

    var conList = self.GetConnectorIDArray();
    if (!conList || !conList.length) {
        return false;
    }

    var frontendIdParse = frontendId.split("-");
    var curIndex = parseInt(frontendIdParse[frontendIdParse.length - 1]) - 1 || 0;
    if (list.length > conList.length) {
        /** 当cs 大于 connector 长度的时候*/
        return isAllocationMin(curIndex, list, conList, csID);
    } else if (list.length == conList.length) {
        /** connector length 等于 cs length*/
        return csID == list[curIndex - 1].id;
    } else {
        /** 当cs 小于 connector 时 暂时 第一版 这里需要用迭代 防止 connector 是cs 的2倍以上*/
        return isAllocationMax(curIndex, list, csID);
    }
};

/**
 * 是否 通过 connector 小于cs 分配 的 csID
 *
 * @param {Number} curIndex 当前connector id index
 * @param {Array} list csList
 * @param {Array} conList conList
 * @param {String} csID csID
 * return {String}
 * */
var isAllocationMin = function (curIndex, list, conList, csID) {
    /** 当cs 大于 connector 时 暂时 第一版 这里需要用迭代 防止 connector 是cs 的2倍以上*/
    if (curIndex <= list.length) {
        var add = curIndex + conList.length;
        if (add < list.length) {
            if (csID == list[curIndex - 1].id) {
                return true;
            } else {
                return isAllocationMin(add, list, conList, csID);
            }
        } else {
            return csID == list[curIndex - 1].id; // 丢给外层随机
        }
    } else {
        return csID == list[curIndex - 1].id; // 丢给外层随机
    }
};

/**
 * 是否connector 大于cs 分配的csID
 *
 * @param {Number} curIndex 当前connector id index
 * @param {Array} list csList
 * return {String}
 * */
var isAllocationMax = function (curIndex, list, csID) {
    /** 当cs 小于 connector 时 暂时 第一版 这里需要用迭代 防止 connector 是cs 的2倍以上*/
    if (curIndex > list.length) {
        var last = curIndex - list.length;
        if (last > list.length) {
            return isAllocationMax(last, list, csID);
        } else {
            /** 获取随机*/
            return false; // 丢给外层随机
        }
    } else {
        return csID == list[curIndex - 1].id;
    }
};