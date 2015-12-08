/**
 * Created by kazi on 2014/4/1.
 */

var Handler = module.exports = {

    set: function (setting, val) {
        this[setting] = val;
    },

    get: function (setting, val) {
        return this[setting];
    },

    newRoleCustomID: 9999,   //新手关卡ID
    equipBagNum: 30,   //装备背包数量
    equipBagNumEx: 90,  //装备背包数量（新）
    updatePlayerNum: 73,   //12点更新玩家数量
    HpNum: 5,            //血瓶数量
    MpNum: 5,            //蓝瓶数量
    findPlayerNum: 6,   //查找玩家数量
    HpNeedYuanBao: 5,   //直接购买血瓶需要的元宝数  该值已被alltemplate中180替代
    inlayNum: 3,        //镶嵌的最大数量
    hechengNum: 5,        //多少低级灵石合成一个高级灵石
    friendNum: 50,      //好友最大数量
    mailNum: 50,      //邮件最大数量
    sysmailDay: 30,        //系统邮件保存天数
    physicalDay: 30,    //好友赠送体力保存时间
    usermailDay: 7,        //用户邮件保存天数
    mailItemNum: 5,      //邮件物品数量
    roleNum: 3,          //创建玩家最大数量
    itemBeginNum: 100000,//装备的数量级
    initExpLevel: 1,   // 玩家初始等级
    maxExpLevel: 110,   //最大等级
    maxVipLevel: 15,   //vip最大等级
    SweepMinVipLevel: 5,   //开启历练扫荡的最小vip等级
    maxLoginPrize: 30,   //最多能获取几天的奖励
    lifeNum: 2,           //复活次数
    isGM: 0,           //是否是GM版本
    RedisTime: 5 * 60 * 1000,      //玩家定时存档时间间隔
    DBTime: 300000,      //玩家定时存档时间间隔
    JSDBTime: 5 * 60 * 1000,      //js玩家定时存档时间间隔
    PingDelay: 600000,     //60秒心跳延迟判断
    teamNum: 30,      //返回的房间总数量
    nameNum: 10,      //玩家名称的最大值
    hallPlayerNum: 30, //主城玩家最大人数
    roomPlayerMax: 4,      //房间内玩家的最大数量
    roomLoadOver: 30000,      //房间超时时间
    roomChangeZhu: 2000,      //房间切换主机
    OccupantTime: 21600000,      //关卡占领时间
    OccupantSaveTime: 300000,      //关卡存档时间
    PendingToSaveQueueMax: 3000,       // 等待进入玩家保存队列
    PendingSavingQueueMax: 30,       // 玩家正在保存的队列
    PendingSaveQueueDelay: 2000,   // 玩家保存队列饱和后重试等待时间
    PendingToLoadQueueMax: 3000,       // 等待进入玩家读取队列
    PendingLoadingQueueMax: 30,       // 玩家正在读取队列
    PendingLoadQueueDelay: 2000,   // 玩家读取队列饱和后重试等待时间
    PrintStateInfoDelaySeconds: 600,   // 玩家读取队列饱和后重试等待时间
    PsNotifyAllUsersStatusDelaySeconds: 60,   // 玩家读取队列饱和后重试等待时间
    climbMinCustomID: 830000, //爬塔最小关卡ID
    climbMaxCustomID: 830100, //爬塔最大关卡ID
    GridNum: 30,  //魔域格子数量
    GridInfoNum: 5,//魔域字段数量
    MagicOutputGridNum: 12, //求魔产出格子数量
    SuccinctNum: 3, //邪神洗练的免费次数
    AttColor: 5, //随机产生属性的颜色
    RandomNum: 10000,
    InitMoneyNum: 10000,    //角色创建时给的金币数量
    UseSaveQueue: 0,        //启用保存队列    0:不启用 1：启用
    UseLoadQueue: 0,        //启用加载队列    0:不启用 1：启用
    UseTestEnv: 0,          //是否启用测试环境 0：不启用 1：启用
    chatCDTime: 4500,       //世界聊天CD时间
    ActivityRefreshCdCost: 10,      //vip   该值已用AllTemplate中176替代
    NobilityGiftID: 8001,   //手游贵族礼包ID
    QQMemberGiftID: 8002,   //QQ会员特权礼包ID
    QQMemberOpenGiftID: 8008, //开通续费QQ会员
    QQMemberOpenSuperGiftID: 8009, //开通续费超级会员
    NobilityGiftType: 2,    //手游贵族礼包类型
    QQMemberGiftType: 7,    //QQ会员特权礼包类型
    CanTalkLevel: 15,            //聊天等级限制
    QQMemberEnableInIOS: true,    // QQ会员特权在iOS版本中是否开放
    MissionListEnableInIOS: [22300001],     //ios版本中不显示的任务编号列表
    IsPetOpening: true,        //是否开启宠物功能

    // pvp system
    aPvPAttackNumMax: 3,      //Async PVP 每日最大攻击次数
    aPvPAttackedNumMax: 5,      //Async PVP 每日最大被攻击次数
    aPvPRivalCount: 6,      //Async PVP 斩魂列表数量
    aPvPRevengeCount: 15,      //Async PVP 复仇列表数量
    aPvPRefreshCost: 5,      //Async PVP 刷新消费  该值已被alltemplate中178替代
    aPvPAttackCost: 100,      //Async PVP 强制攻击消费  该值已被alltemplate中177替代
    aPvPRevengeCost: 100,      //Async PVP 强制复仇消费 该值已被alltemplate中179替代
    aPvPRequireLevel: 1,      //Async PVP 参与的最低等级
    aPvPBlessNumMax: 20,      //Async PVP 每日最大祝福次数
    aPvPBlessReceivedNumMax: 0,      //Async PVP 每日最大被攻击次数
    aPvPRefreshSeconds: 600,      // Async PVP 刷新列表等待时间
    aPvPRequireBlessLeftMax: 1,      //Async PVP 每日最大求祝福次数
    aPvPExpLevel: 26,               //Async PVP 开启等级
    aPvPMatchingUpperLimit: 30,         //Async PVP 对手匹配，排名相差上限
    aPvPMatchingLowerLimit: 50,         //Async PVP 对手匹配，排名相差下限
    isOpenCheatEnv: 1,              //是否开启作弊踢人环境 0：关闭  1：开启
    timeKeyDiff: 20000,              // 属性验证当时间戳不一致时容忍时间延迟(毫秒)
    playerAttTimeKeyMax: 10000000,    // 属性验证时间搓模数
    friendGetInterval: 600,         //好友列表刷新间隔(秒)
    skillBeginNum: 100000,          //技能的数量级
    OpenCheckRate: 0,             //开启战斗校验的几率[0~100]
    isCheatPlayer: 0,             //当因为时间戳不一致时是否将玩家踢出关卡  0：不踢出  1：踢出

    //operateSystem
    operateFirstNeedNum: 1280,          //首冲有奖需要钻石数量
    chartRechargeTopListCount: 100,      // 开服7天充值排行榜大榜单页容量
    chartNiuDanScoreTopListCount: 100,   // 抽奖积分排行榜大榜单页容量
    chartChestPointTopListCount: 100,   //宝箱积分排行榜大榜单页容量
    //operateZhanli_0: 150000,                //战力飙升所需战力值
    //operateZhanli_1: 0,
    //operateZhanli_2: 0,
    //operateZhanli_3: 0,
    //operateZhanli_4: 0,
    //operateZhanli_5: 0,
    //operateZhanli_6: 0,
    //operateZhanli_7: 0,
    //operateZhanli_8: 0,
    //operateZhanli_9: 0,
    //
    //operateLevel_0: 25,                    //火速升级所需等级(为适应北美版本需求，该值已不用，在脚本中配置)
    //operateLevel_1: 35,
    //operateLevel_2: 45,
    //operateLevel_3: 50,
    //operateLevel_4: 55,
    //operateLevel_5: 0,
    //operateLevel_6: 0,
    //operateLevel_7: 0,
    //operateLevel_8: 0,
    //operateLevel_9: 0,

    //operateNiuDanID: 1000003,       //积分抽奖活动ID
    //operate7RechargeID: 1000006,    //7天充值活动ID

    disconnectPostLoginSeconds: 3,       // Login 后， 主动断开客户端连接, 0 不主动断开。
    connectorDisconnectWithoutMessageSeconds: 300,     // Login 后， 主动断开客户端连接, 0 不主动断开。

    maxUserPerConnector: 400,       // GAME每个connector的最大连接数
    maxUserPerConnectorLs: 800,     // LS每个connector的最大连接数
    maxUserPerCs: 400,       //每个 cs 的最大连接数
    maxUserPs: 1500,       //每个 ps 的最大连接数

    maxTeamRoomNum: 100000,       //最大多人房间数

    NOTIFY_LOGIN_TIME: 3000,       // 服务器状态上报login时间

    USE_CONNECTOR_TO_CS: true,  // 是否使用同connector 玩家分配到相同的cs
    USE_SERVER_ID_REFRESH_TIME: 300000, // 刷新服务器id 时间 提高效率

    chartWorldBossTopListCount: 40, // worldboss排行榜大榜容量
    chartWorldBossTop: 5, // 排行榜大榜单页容量
    chartTopListCount: 50, // 排行榜大榜单页容量
    chartPetTopListCount: 50,   //宠物排行榜单页内容
    chartSoulPvpTopListCount: 50, // 邪神竞技场排行榜大榜单页容量
    chartClimbTopListCount: 10, // 爬塔排行榜大榜单页容量
    chartMyRangeListCount: 5,  // 爬塔排行榜大榜单页容量
    HonrRewardNumber: 2000,//荣耀排行榜发奖人数
    chartUnionNumber: 100,//工会排行帮前100 名
    ChartRewardNumber: 2000, // 排行榜发奖人数， 通用
    sweepGetTakeCardReward: 1,//扫荡vip领取翻盘奖励
    mysqlWorkerProfilerCheckSeconds: 0.05,   // sql 执行性能检测时间.

    /** jjc*/
    JJC_PageNum: 5,           //jjc 排行榜一页大小
    JJC_MaxPage: 10,           //jjc 最大页数
    JJC_RefreshInterval: 29 * 1000,                  //jjc 服务器匹配一次时间
    JJC_RefreshTimeOut: 60 * 1000,                  //jjc 匹配超时时间 60
    JJC_RefreshFriRankTime: 5,                  //更新好友排行时间
    JJC_RoundLifeTime: 3 * 65 * 1000,                  //jjc 回合超时时间
    JJC_RoundLifeTime_Room: 3 * 60 * 1000,                  //jjc room 回合超时时间
    JJC_RoundWaitForTime: 5 * 1000,                  //jjc 匹配成功 等待时间
    JJC_DefaultCredits: 200,                        // 玩家jjc积分默认值
    JJC_FirstSectionTime: "[*][*][1-6][*]",           //排行榜第一阶段时间
    JJC_SecondSectionTime: "[*][*][7-13][*]",         //排行榜第二阶段时间
    JJC_ThirdSectionTime: "[*][*][14-32][*]",         //排行榜第三阶段时间 加当月最后一天判断
    JJC_FourSectionTime: "[*][*][27-32][*]",          //排行榜第四阶段时间 加当月最后一天判断

    JJC_FirstDayUnTime: "[*][*][*][0:0-12:0]",          //每天第一阶段非战斗时间
    JJC_SecondDayUnTime: "[*][*][*][14:0-20:0]",          //每天第二阶段非战斗时间
    JJC_ThirdDayUnTime: "[*][*][*][22:00-24:00]",          //每天第三阶段非战斗时间

    JJC_FirstDayTime: "[*][*][*][12:0-14:0]",          //每天第一阶段战斗时间
    JJC_FirstDayTimeStr: "12:00-14:00",                // 第一阶段显示战斗时间
    JJC_SecondDayTime: "[*][*][*][20:0-22:0]",          //每天第二阶段战斗时间
    JJC_SecondDayTimeStr: "20:00-22:00",                // 第一阶段显示战斗时间

    JJC_DEFAULT_OPEN_LEVEL: 1,                            // 竞技场功能开启等级
    JJC_DAY_BATTLE_TIMES: 10,                             //每日调整次数
    JJC_GM_NOTICE_MIN_TIMES: 5,                             //发送公告最小次数

    loginTypeArr: [1, 2, 3, 4, 5, 6, 7, 10], //只允许登陆的类型,登陆类型参照constValue的eLoginType
    loginUseGameServerListRestrict: true,

    USE_REDIS_SESSION: true,

    RedisReloadAtStartup: true,
    AcrossRedisReloadAtStartup: false, // 跨服榜redis 重读， 所有区一起的

    UnionSaveDBTime: 300000,      //公会定时存档时间间隔
    Union_RiZhiType_1: 1,         //%name_1加入公会。
    Union_RiZhiType_2: 2,         // %name_1退出公会。
    Union_RiZhiType_3: 3,         //%name_1被%name_2踢出公会。
    Union_RiZhiType_4: 4,         // %name_1转让会长，%name_2被任命为会长。
    Union_RiZhiType_5: 5,         //会长%name_1由于长时间未上线，%name_2成功弹劾并成为新的会长。
    Union_RiZhiType_6: 6,         //%name_1被任命为副会长。
    Union_RiZhiType_7: 7,         // %name_1将公会等级提升至X级。
    Union_RiZhiType_8: 8,         // %name_1发了公会红包。
    UnionMaxZhanLi: 999999999,      //公会战力最大上限
    UnionApplyNumMax: 50,       //公会申请列表最大上限

    ARES_DEFAULT_BATTLE_TIMES: 5,    // 战神榜每日战斗次数
    ARES_DEFAULT_RANK_NUM: 1000,       // 战神榜初始化人数
    ARES_DEFAULT_OPEN_LEVEL: 14,       // 14级开启功能
    ARES_DEFAULT_BATTLE_TIME: 600000,       // 战神榜一回合最大战斗时间
    ARES_BASE_ROLE_INDEX: 1000000000,      //机器人玩家数据， 基本值 10 0000 0000
    ARES_REFRESH_MEDAL_TIME: 60,       // 战神榜勋章刷新时间间隔。 1小时 单位分钟
    ARES_REFRESH_RIVAL_TIME: 30,       // 内置对手列表 cd时间 30秒

    SOUL_PVP_DEFAULT_BATTLE_TIMES: 5,    // 邪神竞技场每日战斗次数
    SOUL_PVP_DEFAULT_RANK_NUM: 1000,       // 邪神竞技场初始化人数
    SOUL_PVP_DEFAULT_OPEN_LEVEL: 33,       // 33级开启功能
    SOUL_PVP_DEFAULT_BATTLE_TIME: 600000,       // 邪神竞技场一回合最大战斗时间
    SOUL_PVP_BASE_ROLE_INDEX: 1000000000,      //机器人玩家数据， 基本值 10 0000 0000
    SOUL_PVP_REFRESH_MEDAL_TIME: 60,       // 邪神竞技场勋章刷新时间间隔。 1小时 单位分钟
    SOUL_PVP_REFRESH_RIVAL_TIME: 1,       // 内置对手列表 cd时间 1秒
    SOUL_PVP_BATTLE_TIME: 10,             // 战斗 CD 时间

    ACROSS_ZHANLI_LIMIT: 100000,           //跨服战力榜， 战力限制 10 0000
    ACROSS_SERVER_MAP_TIME: 300000,           //跨服战力榜， 获取serverMap 刷新时间

    FRIEND_APPLY_SIZE_LIMIT: 50,             // 好友申请最多数量

    RECH_MONTH_CARD_OK: '1100',//月卡充值成功ID
    RECH_MONTH_CARD_MONEY: 129,//月卡花费钱数
    RECH_MONTH_CARD_ZHUANSHI: 130,//充值月卡得到钻石
    RECH_MONTH_CARD_GIVE_ZHUANSHI: 131,//购买月卡赠送钻石
    RECH_MONTH_CARD_DAY: 132,//购买月卡领取钻石天数
    MONITOR_IS_PUSH_CB: false,   // 推送消息是否需要获取cb 暂时用于主城移动

//    thumb_media_id: 'uwL7QdmBIm3nwM1wcijLXwpP-Mx8aIsaGr3tGgKm2XALBwjclTpMaMBpyO2_uIRN',     // logo
    thumb_media_id: 'LwPg7EWiti-ManpYhkimEY_Rzk3f7AqQKJT4k93o_MBH9tCtysqIVlw2auggsLiw',     // icon

    paymentType: 0,              // ePaymentType
    paymentZone: 3,              // ePaymentZoneType
    paymentModifyAssets: 0,     // ePaymentModifyAssets
    paymentInput: false,
    paymentUsePfExtend: false,
    paymentFixVipPoint: true,

    isNoLocalFriend: true, // 是否暂时屏蔽好友
    climbChartPerSend: 900, // 万魔塔发奖的间隔

    // idip switch
    idipQueryRoleListByRedis: 1,    // 单服查询角色列表方式， 1 通过redis   0 在线读内存 离线读数据库
    idipEnableProfiler: 1,          // idip 开启性能跟踪log。

    filterDisableTaskManager: true,
    filterDisableFirewallManager: false,

    ZhuanPanListLength: 13, // 客户端转盘列表长度

    //operatorType: 0,    // 运行商类型，0：腾讯；1：北美

    //按着方法需要配置不同服务商脚本  默认腾讯 （其他通过 /config/defaultValues.default配置）
    chatCheck: true,                    //腾讯版本校验聊天中空格
    maxTeamNameLength: 13,              //各个版本队伍名长度最大值
    roleNameLenMax: 10,                 //各个用户名长度最大值
    isCheckName: false,                 //北美版本名字校验
    announcement: 60,                   //各个版本公会公告最大值

    cheatMaster : false,                // 公会战是否开启更精确校验
    cheatBlack : false,                 // 是否开启公会战校验黑名单
    cheatKick : false,                   // 是否开启公会战踢人

    configFolderPath: "./template/json",    //各个版本模板文件路径
    cmgeRecharge: false,  //是否是北美充值

    careerIDs: [1, 2, 3, 10, 11],

    //数据库版本校验
    "game_versionNum": "1.0.0",
    "account_versionNum": "1.0.0",
    "account_global_versionNum": "1.0.0",
    "log_versionNum": "false",
    "tbLog_versionNum": "false",
    "cmge_payment_versionNum": "false",

    storyFixA : 3,         // 故事模式系数A
    storyBaseScore : 1500,         // 故事模式基础分
    storyMinScore : 100,         // 故事模式保底分
    
    WORLD_BOSS_COUNTDOWN: 24 * 3600 * 1000,
    WORLD_BOSS_NOTICE: 1 * 60 * 1000,//世界公告
    WORLD_BOSS_DEFAULT_BATTLE_TIME: 15 * 60 * 1000,       //worldBoss战斗时间
    WORLD_BOSS_REWARD_TIME: 5 * 60 * 1000,     //战斗结束延迟发奖时间
    end: 0,

    //结婚相关  开始   *********
    delete_marry_day: 7,         //清除 求婚信天数
    marry_count_day: 5,  //每天求婚次数限制
    marry_yinyuan: 520,     //默认姻缘值  每天减少2  可用鲜花 ， 吻， 礼物 增加
    marry_yinyuan_error: 20,     //姻缘值  预警值
    marry_yinyuan_reduce: 16,     //默认每天递减的姻缘值
    divorce_yuanbao: 1000, //强制离婚所需钻石数
    weddingSaveDBTime: 300000,     //婚礼预约列表定时存档时间间隔 300000
    SendWeddingTime: 60000,       //定时通知玩家当前举行婚礼信息
    wedding_jiyu: 30,               //新人寄语
    marry_xuanyan_length: 30,        //爱情宣言
    marry_log_length: 30,            //夫妻日志长度
    wedding_hongbao_num: 5,          //每天限制可领红包数
    chartMarryTopCount: 50,   // 婚姻姻缘排行榜大榜容量
    marryExpLevel: 34            //允许结婚的等级
    //结婚相关 结束   *********
};

