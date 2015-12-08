/**
 * Created by kazi on 2014/4/3.
 */

module.exports = {

    toClientCode: function (err) {
        if (!err) {
            return this.OK; // OK
        }
        if (typeof err === 'number') {
            return err;
        }
        return this.SystemWrong; // SystemWrong
    },

    OK: 0,    // 成功无错误
    ParameterNull: 1,       //参数为空
    ParameterWrong: 2,    //参数不符合规则
    SystemWrong: 3,        //系统出现错误
    DoubleLogin: 4,        //重复登陆
    NoRole: 5,        //玩家不存在
    NoMoney: 6,        //金币不足
    NoYuanBao: 7,        //元宝不足
    NoItem: 8,        //物品不足
    NoStar: 9,        //灵石不足
    NoAssets: 10,        //财产不足
    NoStone: 11,        //强化石不足
    NoPower: 12,        //没有权限
    PlayerDeath: 13,        //玩家未死亡了
    NoSoul: 14,        // 无法宝
    NoTemplate: 15,    // 无模板
    VipLevel: 16,      //vip等级不足
    IsRec: 17,      //已经操作过了
    NoLingli: 18,  // 无灵力
    ExpLevel: 19,  // 经验等级不足
    NoMagicSoul: 20,        // 无魔晶
    NoHonor: 21,  // 无荣誉值
    NoTimes: 22,  // 无次数已满
    InMatch: 23,        // 战斗中
    Physical: 24,   //体力不足
    RepeadGive: 25, //已经赠送过友情点
    RecvNumZero: 26, //友情点领取次数为0
    NoPhyRecv: 27, //无友情点可以领取
    GiveNumZero: 28, //友情点赠送次数为0
    BuyNumZero: 29, //购买体力次数为0
    LessZhanli: 30,  //进入剧情关卡战力不足
    SoulSkillLevelErr: 31, //变身技能学习等级错误
    LessSoulLevel: 32,  //邪神等级不足
    MaxLevel: 33,  // 经验等级超过上限
    SystemBusy: 34,        // 系统繁忙
    NoAlchemyNum: 35,    //炼金次数不足
    SkillFull: 36,      //技能学习已满
    NoNeedSkill: 37,    //前置技能不满足
    SystemDrop: 38,        //系统内部丢弃当前操作.
    SystemNoServer: 39,        // 无可用服务器.
    VersionWrong: 40,       // 客户端版本错误， 需要强制更新。
    VersionWarn: 41,        // 客户端版本不符合， 建议更新。
    SeverMaintain: 42,       //服务器维护中
    BlackUser: 43,          //黑名单用户
    RedisWrong: 44,             // 系统出现错误
    SystemInitializing: 45,    // 系统初始化中
    UseYuanBaoSweep: 46,      //VIP免费扫荡次数用完，可以消费钻石扫荡
    SystemCanNotConnect: 49,    // 系统无法连接
    NotImplement: 50,    // 功能未实现
    DelOneRolePerDay: 51,   //每天只能删除一个角色
    OpenApiWrong: 52,    // 外部接口调用错误
    MineSweep: 53, //魔域VIP次数不够
    WhiteUser: 54,      //白名单用户
    CanNotLogin: 55,    //帐号未解封
    PhyGiftHasGet: 56,  //已领取体力发放
    PhyGiftNotTime: 57, //不是体力发放时间
    ShopNotYouQingDian: 58, //友情点不足
    ActivityOnCD: 59,         //活动CD中
    ActivityReady: 60,        //活动CD已结束
    NoActivity: 61,           //无此活动
    IsNotNobility: 62,          //不是手游贵族
    WxShareField: 63,           //微信分享失败
    ForbidCreateRole: 64,        //禁止创建角色
    LoginTypeWrong: 65,        //登陆类型不匹配
    NoChartReward: 66,            //当天无法领取排行榜奖励
    CheatHp: 67,            //血量计算异常
    ServerFull: 68,         //服务器爆满，请稍后尝试登录。
    ChartClearing: 69,      //当前排行榜正在结算
    NotActive: 70,           //活动或者兑换未处于激活状态

    Ls_AccountLen: 1000,     //账户长度不对
    Ls_AccountHave: 1001,    //账户已存在
    Ls_BindNoID: 1002,       //绑定时，不存在这个ID
    Ls_AccOrPws: 1003,       //账户密码错误
    Ls_KeyWrong: 1004,       //登陆验证的key值错误
    Ls_State: 1005,          //登陆状态不对
    Ls_Name: 1006,           //名称冲突
    Ls_NameNum: 1007,        //名称长度错误
    Ls_PlayerNum: 1008,      //玩家数量不对
    Ls_PlayerLogin: 1009,        // 玩家已经登陆
    Ls_BindAlready: 1010,        // 玩家已经绑定了
    Ls_NoMail: 1011,             // 没有绑定邮箱
    Ls_WrongPsw: 1012,           // 密码错误
    Ls_NoAccount: 1013,          // 账号不存在
    Ls_Dispatch: 1014,           // 重新分配connector
    Ls_InvalidEmail: 1015,      // email 地址格式不正确.
    Ls_InvalidPassword: 1016,   // 密码不符合规则
    Ls_InvalidLoginType: 1017,  // 账号注册类型不正确
    Ls_InvalidAccount: 1018,    // 账号不符合规则
    Ls_1020: 1020, // 密码已经发送至您的绑定邮箱，请及时查收
    Ls_1021: 1021, // 密码寻回邮件的发送间隔为5分钟
    Ls_1022: 1022, // 账号不能为空
    Ls_1023: 1023, // 密码不能为空
    Ls_1024: 1024, // 确认密码需要与密码一致
    Ls_1025: 1025, // 邮箱不能为空
    Ls_1026: 1026, // 您的账号已经绑定到邮箱: \n\n%mail
    Ls_loginFailedQQ: 1027,       // 账号从QQ登陆失败
    Ls_loginFailediTools: 1028,  // 账号从iTools登陆失败
    Ls_loginFailedWX: 1029,       // 账号从微信登录失败
    Ls_loginFailedTencentGuest: 1030,    // 账号从TencentGuest登陆失败
    Ls_loginFailedCmgeNativeInvalidSign: 1031,    // 账号从TencentGuest登陆失败
    Ls_loginFailedCmgeNativeTimeout: 1032,    // 账号从TencentGuest登陆失败

    Cs_NoFindItem: 2000,       //未找到这个物品
    Cs_BagPos: 2001,       //物品位置错误
    Cs_EquipType: 2003,       //装备类型错误
    Cs_EquipUse: 2004,       //装备已经使用了
    Cs_Hole: 2005,       //孔位置错误
    Cs_MaxIntensify: 2006,       //达到最大强化等级
    Cs_ItemWrongJob: 2007,       //错误的职业
    Cs_NoSellOrResolveEquipOn: 2008,       //已装备的物品不可出售或分解
    Cs_IntensifyFailed: 2009,       //强化失败

    Cs_PlayerState: 2100,        //玩家状态不对
    Cs_ItemFull: 2101,        //背包满了
    Cs_CustomNum: 2102,        //关卡数量满了
    Cs_NoBigID: 2103,        //大关卡找不到
    Cs_NoRoom: 2104,        //没有房间
    Cs_password: 2105,        //密码错误
    Cs_CustomLevel: 2106,        //关卡等级错误
    Cs_RoomState: 2107,        //房间状态不对
    Cs_RoomLifeNum: 2108,        //关卡复活次数已满
    Cs_RoomNoPlayer: 2109,        //房间没有这个人
    Cs_RoomNoWin: 2110,        //没有成功通过关卡，无法扫荡

    Cs_RoomNoWinFlop: 2111,        //没有成功通过关卡，无法翻牌
    Cs_RoomNotFlop: 2112,        //该关卡无法翻牌
    Cs_RoomNotFlopNum: 2113,        //无翻牌次数

    Cs_ActivityCustomNoSweep: 2114, //此活动关卡不能扫荡
    Cs_NoCustomNum: 2115,  //关卡次数已用完
    Cs_NoReachFreeUse: 2116, //显示时间错误，无法免费开启
    Cs_NoCustomNpcTpl: 2117,              //没有关卡相关的npc模板数据
    Cs_NoCustomTpl: 2118,                 //没有该关卡模板数据
    Cs_NoCustomNpcData: 2119,             //该关卡没有玩家杀怪记录
    Cs_KilledMonsterNumNotEnough: 2120,   //未达到该击杀的怪物数量
    Cs_NoKilledCustomBoss: 2121,          //关卡Boss没有被击杀
    Cs_CheckCustomScoreFailed: 2122,      //积分校验失败
    Cs_RoomStarNotEnough: 2123,         //关卡3星通关后开启此功能


    Cs_ShopWeek: 2200, //周不满足
    Cs_ShopDate: 2201, //时间不满足
    Cs_ShopNoBuy: 2202, //不能购买
    Cs_ShopHpFull: 2203, //血瓶满了，不能购买
    Cs_ShopMpFull: 2204, //魔瓶满了，不能购买
    Cs_ShopVipNoBuy: 2205, //vip次数用完，无法购买
    Cs_ShopSeverUpdate: 2206, //购买全服限量物品
    Cs_ShopGetLimitNum: 2207, //购买达到最大上限

    Cs_NoCustom: 2300,//关卡未开启
    Cs_GetCustom: 2301,//奖品已经获取

    Cs_NoMission: 2400,//没有这个任务
    Cs_MissionLost: 2401,//任务没有完成

    Cs_NoGift: 2500,//没有这个礼包
    Cs_GiftOver: 2501,//礼包未获得或者已领取

    Cs_NoAchieve: 2600,//没有这个成就
    Cs_AchiUnfinish: 2601,//成就没有完成
    Cs_AchiPrized: 2602,      //该成就的奖励已经领取

    Mine_NoFinishCD: 2700,  //当前关卡冷却时间未到，请稍候...
    Mine_NoVipLevel: 27001, //此功能需要您达到贵族XX,请提升您的贵族等级
    Mine_NoHp: 27002, //您的剩余血量不足，不能使用此功能

    Cs_NoMagicOutput: 2800,  //栏位无物品
    Cs_NoMagicOutputGrid: 2801, //栏位已满，请点击“一键拾取”按钮

    chest_NoChestKey: 29001, //宝箱钥匙不足

    Fs_Self: 3000,               //操作自己了
    Fs_FriendNum: 3001,          //好友已经满了
    Fs_FriendHave: 3002,         //好友已经存在了
    Fs_BlessedToday: 3003,         // 好友今天已经祝福过
    Fs_BlessNoTimes: 3004,         // 好友今天不能祝福别人了
    Fs_BlessedNoTimes: 3005,         // 好友今天不能接受祝福了
    Fs_FriendNumFull: 3006,         // 自己好友已经满了
    Fs_RequireBlessingNoTimes: 3007,         // 好友今天不能发起求祝福了
    Fs_NoFriend: 3008,              // 去加个好友
    Fs_InProcessing: 3009,         // 好友列表获取中...

    Fs_AppCode: 3100,            //苹果码已经使用过了
    Fs_NoRechargeID: 3101,      //没有这个交易号
    Fs_RechargeIDUse: 3102,     //这个交易号已经使用了

    Ms_NoFriend: 4000, //不是好友关系
    Ms_NoMail: 4001, //没有这封邮件
    Ms_MailHaveItem: 4002, //邮件有物品不能删除
    Ms_MailState: 4003, //邮件状态不对

    Soul_Failed: 5000,  // 升星几率失败.
    Soul_MaxLevel: 5001,    // 法宝等级没有达到最大值
    Soul_AlreadyMax: 5002,    // 法宝等级已经最大值
    Soul_Level: 5003,    // 法宝等级不足
    Soul_LessZhan: 5004,    //战力不足

    PvP_InvalidRival: 6000,    // 对手不可用
    PvP_RivalState: 6001,      // 对手状态不正确
    PvP_InMatch: 6002,         // 当前有未完成战斗
    PvP_aPvVPAttackNum: 6003,   // 当日战斗次数已满
    PvP_aPvPAttackedNum: 6004,    // 对手被攻击次数已满
    PvP_MatchInvalidState: 6005,    // 战斗状态不正确
    PvP_NotEnoughRivals: 6006,     // 对手数量不足.


    Rs_HaveTeam: 7001,//已经有队伍了
    Rs_NoTeam: 7002,//没有这个队伍
    Rs_TeamState: 7003,//队伍状态不对
    Rs_Password: 7004,//密码错误
    Rs_TeamFull: 7005,//队伍满了
    Rs_TeamNoRole: 7006,//队伍里没有这个人
    Rs_TeamNoReady: 7007,//队伍里有人没有准备好

    MagicSoul_MaxLevel: 8001,    // 魔灵需要突破到下一品
    MagicSoul_IsMaxLevel: 8002,    // 已达到魔灵最高等级
    MagicSoul_NotMaxLevel: 8003,    // 没有达到突破等级
    MagicSoul_MoJingIsAchieve: 8004,    // 魔晶数量已达到
    MagicSoul_SkillIsMaxLevel: 8005,    // 技能以达到最大等级
    MagicSoul_NotMoLingLevel: 8006,    // 魔灵阶级不足
    MagicSoul_ShenGuoIsAchieve: 8007,    // 魔晶数量已达到
    MagicSoul_IsOpen: 8008,    // 已经开启

    Chat_ReceiverOffline: 9001,   // 玩家不在线
    Chat_Self: 9002,               // 玩家不能和自己聊天

    Suit_NoUnlock: 10001,   //套装还未解锁
    Suit_NoLevel: 10002,  //套装激活等级不够
    Suit_NoActivate: 10003, //套装还未激活

    Rune_NoSkill: 11001,        //没有学习技能
    Rune_RuneBranch: 11002,     //技能符文分支错误
    Rune_NoNeedRune: 11003,     //前置符文不满足
    Rune_RuneHasLearn: 11004,   //技能符文已学习
    Rune_NoRune: 11005,         //没有学习此技能的任何符文
    Rune_MatchingError: 11006,  //技能与符文不符
    Rune_NoEnoughRuneAssets: 11007, //没有足够的符文财产
    Rune_NoEnoughSkillPoint: 11008, //没有足够的技能点


    GiftCodeInvalid: 12000,//兑换码无效
    GiftCodeOverLength: 12001,//超过长度时，键盘输入无效
    GiftCodeUse: 12002,//兑换码曾使用过
    GiftCodeExpired: 12003,//兑换码已过期


    NoUnion: 12004,//未找到合适的公会
    UnionNoExist: 12005,//公会不存在
    UnionNameExist: 12006,//已有此公会名称，请更新其他名称
    CreateUnionDefeated: 12007,//公会创建失败
    UpdateAnnouncementDefeated: 12008,//修改公告失败
    AlreadyApplyUnion: 12009,//公会已经申请
    UnionNumFull: 12010,//公会已满
    UnionApplyNumNo: 12011,//公会申请列表没有成员
    UnionLevelFull: 12012,//公会等级最高
    UnionWeiWangLack: 12013,//公会威望不足
    UnionNameNumLong: 12014,//公会名称长度必须在4-14个字符之间，且不能有敏感字符
    RoleNoUnion: 12015,//角色没有加入公会
    NoUnionLog: 12016,//没有日志信息
    NoUnionAuthority: 12017,//没有权限
    PlayerExistUnion: 12018,//玩家已有公会
    PlayerUnoinBoss: 12019,//请转让会长后退出公会
    PlayerAppalyNumFull: 12020,//您今日申请次数已满
    UnionAppalyNumFull: 12021,//公会申请列表已满
    OfficeNumFull: 12022,//副会长人数已满
    UnionAnnouncementNumLong: 12023,//公会公告长度必须在1-60个字符之间，且不能有敏感字符
    UnionSignOutTime: 12024,//您当前处于加入公会的冷却时间内，请稍后再试。剩余冷却时间：XX小时XX分。
    UnionNoRole: 12025,//该玩家不存在
    UnionPlayerSignOutTime: 12026,//该玩家当前处于加入公会的冷却时间内，请稍后再试。剩余冷却时间：XX小时XX分。
    /** 工会商店错误码 **/
    UnionNoBuyNum: 12027,   //若已无次数，提示：“今日购买次数已达上限，请明日再来”
    UnionLevelMeet: 12028,   //若公会等级不足，提示：“公会等级未满足条件，请先提升公会等级。”
    UnionDevoteNumMeet: 12029,//若个人公会贡献不满足，提示：”您的公会贡献不足，请先提高公会贡献。”
    UnionAssetsPer: 12030,  // 没有足够的财产，无法购买商品
    UnionLevelPer: 12031,  // 公会等级不足
    UnionMemberNotFix: 12032,  // 必须是相同公会的成员才可以参加
    UnionMagicLevelMax: 12033,  // 公会技能等级已经达到最高
    UnionMagicLevelOver: 12034, // 个人公会技能等级不能超过公会技能等级

    UnionAnimateAward: 12035,  // 公会活跃度奖励已经领取
    UnionAnimateNotEn: 12036,  // 活跃度不足无法领取奖励
    UnionPlayerMagicLevel: 12037,  // 个人公会技能已经达到最高


    UnionTempleLevel: 12038,  // 公会神殿等级已经达到最高
    UnionTempleExpPer: 12039,  // 公会神殿经验不足
    UnionLadyTimes: 12040,  // 女神祭拜的次数已经用尽
    UnionLadyDay: 12041,  // 该女神今天不开放
    UnionLadyConsumeTimes: 12042,  // 可购买的祭拜次数已到上限

    // 公会神兽
    UnionAnimalNotReg : 12043,  // 公会夺城没有报名
    UnionAnimalCultureNotOpen: 12044,  // 今天不开放神兽培养
    UnionAnimalCantReg: 12045,  // 公会夺城报名时间已过
    UnionAnimalHasReg: 12046,  // 公会夺城已经报名
    UnionAnimalSkillMax: 12047,  // 公会神兽的技能已经学满
    UnionAnimalCultureMAX: 12048,  // 您今日公会神兽的钻石培养次数已到上限
    UnionAnimalDuke: 12049,  // 您的公会现在是城主，无需报名
    UnionAnimalNotFight: 12050,  // 您的公会没有报名，不能参加夺城战
    UnionFightIsEnd: 12051,  // 公会夺城战已经结束，无法参加
    UnionFightTimes: 12052,  // 公会夺城次数已经用完
    UnionMemRankNull: 12053,  // 暂无夺城战伤害记录
    UnionAwardNotDuke: 12054,  // 您所在的公会不是城主，无法领取占领收益
    UnionAwardCalling: 12055,  // 周日无法领取收益奖励
    UnionAwardLater: 12056,  // 您是本周后才进入公会的，无法领取每日收益
    UnionFightNotAllow: 12058,  // 夺城战期间不可进行此操作
    UnionDukeNotDis: 12059,  // 城主公会无法解散
    UnionAnimalAttMax: 12060,  // 神兽该项属性已到最大值
    UnionAwardGained : 12061,  // 夺城战每日奖励已经领取
    UnionCultureWeiwang : 12062,  // 您需要达到一定的个人威望才可以培养神兽
    
    FreeSweepNumOver: 13002,    //免费扫荡次数用完
    PVPNoTimes: 13003,           //PVP战斗中VIP次数限制
    TodayNoTimes: 13004,         //今日购买次数已满

    PAY_INVALID: 14001,     // 玩家登录类型不可支付.
    PAY_NO_BALANCE: 14002,     // 玩家登录类型不可支付.

    IDIP_FORBID_CHAT: 15000,    //禁止聊天
    IDIP_FORBID_PROFIT: 15001,  //禁止收益
    IDIP_FORBID_PLAY: 15002,    //禁止玩法

    ZHUANPAN_NO_OPEN: 16000,   //转盘未开启

    Pet_No_Assets: 17001,       // 宠物碎片不足
    Pet_Repeat: 17002,          // 宠物召唤重复
    No_Pet: 17003,              // 没有此宠物
    Pet_Level_Limit: 17004,     // 宠物等级不能超过玩家等级
    Pet_Max_Grade: 17005,       // 宠物达到最高品级
    Pet_Wrong_Grade: 17006,     // 错误的品级提升
    Pet_Skill_Repeat: 17007,    // 技能重复解锁
    Pet_Prior_Skill: 17008,     // 前置技能没有学习
    Pet_No_Skill_Assets: 17009, // 宠物技能开启材料不足
    Pet_Wrong_Skill: 17010,     // 错误的宠物技能开启
    Pet_No_Food: 17011,         // 宠物喂食材料不足
    Pet_Level_Max: 17012,       // 宠物达到最高等级
    Pet_Skill_Locked: 17013,    // 宠物技能没有开启
    Pet_Skill_Wrong: 17014,     // 宠物技能升级错误
    Pet_Skill_Max: 17015,       // 宠物技能达到最高等级
    Pet_Low_Level: 17016,       // 宠物等级不足
    Pet_Spirit_Level: 17017,    // 玩家附身等级不足
    Pet_Spirit_Wrong_Field: 17018, // 请求的附身栏错误
    Pet_No_Fight: 17019,        // 没有出战宠物
    Pet_No_Spirit: 17020,       // 没有附身宠物
    Pet_Incorrect_SkillGrade: 17021,    //错误的技能学习
    Pet_Chart_No_Value: 17022,  // 排行榜正在读取中。。。
    Pet_Resolve_Grade : 17023,  // 宠物达到紫色品质才能进行分解
    Pet_Resolve_Fight : 17024,  // 出战的宠物，无法分解
    Pet_Exchange_Grade : 17025,  // 宠物到最高品质才能兑换万能碎片

    Advance_no_open : 18001,    // 活动未开启
    Advance_no_reach : 18002,    // 还没有达到该奖励的条件
    Advance_has_got : 18003,    // 已经领取了该奖励

    /** 战神榜系统 错误码 30000 ~ 30020*/
    ARES_LEVEL_LACK: 30001,            // 开启战神榜等级不足
    ARES_MY_LEVEL_CHANGE: 30002,       //您的排名发生变化，无法进行战斗
    ARES_TYPE_BATTLING: 30003,       //您正在进行战斗, 不能重复战斗
    ARES_TYPE_BATTLED: 30004,       //您正在被人挑战, 无法进行战斗
    ARES_RIVAL_TYPE_BATTLING: 30005,       //目标正在挑战中，无法进行战斗
    ARES_RIVAL_TYPE_BATTLED: 30006,       //目标正在被人挑战，无法进行战斗
    ARES_RIVAL_LEVEL_CHANGE: 30007,       //目标排名发生变化，无法进行战斗。
    ARES_USER_UP_TIMES: 30008,       //您的战斗次数已经用完。。
    ARES_EXCHANGE_USE_UP: 30009,       //您的兑换次数已用完。
    ARES_EXCHANGE_RANK_LIMIT: 30010,       //兑换需要的战神榜排名不足。
    ARES_EXCHANGE_MADEL_LIMIT: 30011,       //兑换需要的勋章不足
    ARES_DELETE_ROLE: 30012,       //该角色已删除
    ARES_ZHANLI_DIFF: 30013,       //您与挑战对手的战力差距过大，无法挑战对方

    /** 邪神竞技场 错误码 30020 ~ 30050*/
    SOUL_PVP_LEVEL_LACK: 30021,            // 开启邪神竞技场等级不足
    SOUL_PVP_MY_LEVEL_CHANGE: 30022,       //您的排名发生变化，无法进行战斗
    SOUL_PVP_TYPE_BATTLING: 30023,       //您正在进行战斗, 不能重复战斗
    SOUL_PVP_TYPE_BATTLED: 30024,       //您正在被人挑战, 无法进行战斗
    SOUL_PVP_RIVAL_TYPE_BATTLING: 30025,       //目标正在挑战中，无法进行战斗
    SOUL_PVP_RIVAL_TYPE_BATTLED: 30026,       //目标正在被人挑战，无法进行战斗
    SOUL_PVP_RIVAL_LEVEL_CHANGE: 30027,       //目标排名发生变化，无法进行战斗。
    SOUL_PVP_USER_UP_TIMES: 30028,       //您的战斗次数已经用完。。
    SOUL_PVP_EXCHANGE_USE_UP: 30029,       //您的兑换次数已用完。
    SOUL_PVP_EXCHANGE_RANK_LIMIT: 30030,       //兑换需要的战神榜排名不足。
    SOUL_PVP_EXCHANGE_MADEL_LIMIT: 30031,       //兑换需要的勋章不足
    SOUL_PVP_DELETE_ROLE: 30032,              //该角色已删除
    SOUL_PVP_NO_SOUL_DETAIL: 30033,        //玩家 邪神详细信息错误
    SOUL_PVP_IN_CD_TIME: 30034,        //玩家 邪神战斗cd中
    SOUL_PVP_RIVAL_RANK_OVER: 30035,        //不能挑战比自己等级低的玩家
    SOUL_PVP_VIP_SHOP_TIMES: 30036,        //竞技场战斗vip购买次数已用完
    SOUL_PVP_NO_CLEAR_BATTLE_TIME: 30037,        //你的战斗cd时间已结束,无需清除
    SOUL_PVP_NO_BATTLE_CAST: 30038,        //请选择出战阵容
    SOUL_PVP_NO_DEFENCE_CAST: 30039,        //请选择防守阵容

    /** 好友系统--欧美好友兼容 错误码 30050 ~ 30070*/
    FRIEND_ROLE_OFFLINE: 30051,                 //改玩家不在线
    FRIEND_IS_ALREADY: 30052,                   // 已经是好友了
    FRIEND_APPLY_IS_ALREADY: 30053,             // 已经申请过该好友了
    FRIEND_APPLY_SIZE_LIMIT: 30054,             // 已经到达好友申请上线了
    FRIEND_APPLY_NO_ALREADY: 30055,             // 没有该好友申请
    FRIEND_NO_ALREADY_TO_DEL: 30056,             // 你们不是好友， 不能进行删除
    FRIEND_TYPE_CANNOT_TO_DEL: 30057,             // 不能删除该类型的好友
    FRIEND_SEARCH_NO_ROLE: 30058,             // 没有查到这个角色，
    FRIEND_ZHANSHI_PINGBI: 30058,             // 暂时屏蔽该功能

    /** jjc  从30071 开始30100 每个功能加 30 ~ 100*/
    JJC_UN_START: 30101,                          //竞技场未开始
    JJC_REDIS_NO_DATA: 30102,                     //角色竞技场数据有误
    JJC_NO_OPEN: 30103,                           //玩家未开启该功能
    JJC_RANK_CAN_NOT_GET_REWARD: 30104,           //排名不满足奖励领取条件
    JJC_BATTLE_MATCHING: 30105,                   //匹配中，不需要重复请求
    JJC_BATTLE_BATTLING: 30106,                   // 战斗中，不能进行匹配
    JJC_HAS_GET_REWARD: 30107,                    // 你已经领取过该奖励了
    JJC_NOT_FINISH_DAY_BATTLE: 30108,             // 没有完成今天挑战次数，不能领取奖励
    JJC_USED_UP_VIP_SHOP_TIMES: 30109,             // 你的vip购买次数已用完
    JJC_NOT_IN_MATCHING: 30110,                    // 玩家不在匹配状态，不能取消匹配
    JJC_USER_UP_BATTLE_TIMES: 20111,               // 挑战次数已用完

    /** 月卡充值商店错误码  40000 ~ 40020*/
    RECH_SERVER_TYPE_NOT_MATCH: 40001, //服务器类型不匹配
    RECH_NOT_MONTH_CARD: 40002, //没有月卡
    RECH_RECEIVE_MONTH_CARD: 40003,//月卡已经领取
    RECH_OVERDUE_MONTH_CARD: 40004,//月卡已过期
    RECH_CHECK_FAILED_MONTH_CARD: 40005,//校验失败

    /**邪神血炼*/
    Succinct_NoStartLevel: 50001,       //洗练的级别不足
    Succinct_NoBloodBead: 50002,    //血珠不足
    Succinct_Activate: 50003, //水晶已激活
    Succinct_LowerLevelNo: 50004, //未激活低等级属性

    /**邪神进阶* 60001 ~ 60020*/
    SOUL_EVOLVE_ALREADY: 60001,    // 邪神进阶-已经进阶过了
    SOUL_EVOLVE_NO_CUSTOM: 60002,  // 邪神进阶-未完成试炼

    /**邪神进阶* 60021 ~ 60040*/
    SOUL_WAKE_NOT_EVOLVE: 60021,    // 邪神觉醒-没有进阶
    SOUL_WAKE_MAX_LEVEL: 60022,     // 邪神觉醒-已到最大等级
    SOUL_WAKE_LESS_LEVEL: 60023,    // 邪神觉醒-邪神星级不足

    API_CMGE_INVALID_PARAMS: 70001,
    API_CMGE_INVALID_SIGN: 70002,
    API_CMGE_DUPLICATE_ORDER: 70003,

    /** 公会红包  80000 ~ 80010*/
    RECH_RECEIVE_UNION_GIFT: 80000,     //已经领取过这个红包
    RECH_NULL_UNION_GIFT: 80001,    //没有这个红包
    SEDN_VIP_LEVEL_UNION_GIFT: 80002,      //VIP等级不够
    SEDN_ALREADY_UNION_GIFT: 80003,     //今天已经发送过红包
    RECH_BEFORE_UNION_GIFT: 80004,     //无法领取入会之前发放的红包
    RECH_SELF_UNION_GIFT: 80005,     //不能领取自己发放的红包


    /** 求婚信息  80010 ~ 80050*/
    MARRY_COUNT_OUT: 80010,     //超过每天求婚次数
    MARRY_ITEMWRONGJOB:80011,   //求婚职业不符合要求
    MARRY_ALREADY:80012,   //对方已经结婚
    MARRY_LEVEL:80013,   //结婚等级不够
    MARRY_LEVEL_TO:80014,   //被求婚对象等级不够
    MARRY_OFFLINE:80015,  //求婚对象不在线
    MARRY_COUNT_OUT_ONE: 80016,     //每天只能向一位玩家求婚一次
    MARRY_ALREADY_SELF: 80017,     //您已经结婚了
    MARRY_NOT_FIND_TOMARRY: 80018,     //没有找到求婚记录
    MARRY_NOT_MORE: 80019,     //被求婚对象 太受欢迎 已经达到求婚上线30人
    MARRY_NOT_FIND_PLAYER: 80020,     //没有找到此玩家 或 玩家不在线
    NOT_MARRY: 80021,     //玩家没有结婚
    MARRY_NOT_FIND_DIVORCE: 80022,     //没有找到离婚协议
    WEDDING_NOT_MORE: 80023,     //婚礼场次已满
    WEDDING_ALREADY_YUYUE: 80024, //已经预约过婚礼了
    WEDDING_BEYOND_TIME: 80025, //超出婚礼结束时间
    MARRY_TOKEN_NOT_FIND: 80026, //信物没有找到
    MARRY_DIVORCE_NOT_24: 80027, //离婚未超过24小时 不能结婚
    WEDDING_WID_NOT: 80028, //婚礼ID没有找到
    WEDDING_BLESS_BEYOND_LENGTH: 80029, //新人寄语超出长度
    MARRY_XUANYAN_BEYOND_LENGTH: 80030, //爱情宣言超出长度
    WEDDING_GIFT_NOT: 80031, //爱的礼物没有找到
    WEDDING_GIFT_NOT_GIVE: 80032, //爱的礼物没有赠送次数了
    WEDDING_GIFT_NOASSETS:80033, //爱的礼物碎片数不足
    WEDDING_NOT_LEVEL: 80034,     //婚礼场次已满
    WEDDING_NOT_MORE_HONGBAO: 80035,     //红包已经被领完了
    WEDDING_NOT_GET_HONGBAO: 80036,     //红包领取达到上限
    WEDDING_ALREADY_GET_HONGBAO: 80037,     //已经领取过该红包
    WEDDING_NOT_BLESS: 80038,     //还没有祝福过新人 不能领取红包
    WEDDING_PARAMETER_NULL:80039,   //预约婚礼时 条件不足
    MARRY_DIVORCEXIEYI_NOT_24: 80040, //离婚协议发送未超过24小时
    MARRY_TEAM_NOT:80041,       //婚姻关卡 只能自己 或者和配偶完成
    WEDDING_ALREADY_BLESS: 80042,     //已经祝福过新人
    MARRY_CAREER_ITEM: 80043,         //已经结婚 转职职业不符合要求
    MARRY_NOT_FIND: 80044,     //没有找到婚姻记录
    MARRY_BLESS_DONTUSE: 80045,  //新婚寄语不合法
    MARRY_CUSTOM_YINYUAN: 80046,  //姻缘值不足无法进入副本
    WEDDING_KISS_NOT_GIVE: 80047, //接吻没有次数了
    WEDDING_FLOWER_NOT_GIVE: 80048, //鲜花没有赠送次数了


    APIGW_RTCODE_APPREQ_INVALID: 10000001, //client的请求参数无效
    APIGW_RTCODE_APP_NOTEXIST: 10000002, //请求中的appid不存在
    APIGW_RTCODE_APPAPI_NOPRIVI: 10000003, //client请求中app到api访问无权限
    APIGW_RTCODE_IP_INVALID: 10000004, //请求中的app ip不允许
    APIGW_RTCODE_SIG: 10000005, //签名验证失败
    APIGW_RTCODE_APPAPI_ISLIMITED: 10000006, //client请求中app到api访问超限
    APIGW_RTCODE_PROTOCAL_INVALID: 10000007, //请求协议非法 eg https 搞成了http
    APIGW_RTCODE_REQ_BLOCK: 10000008, //请求受限,通常是安全审计没通过
    APIGW_RTCODE_API_NOTEXIST: 10000009, //api不存在
    APIGW_RTCODE_SENSI_INNER_IP_INVALID: 10000010, //请求中的app 内网ip不允许
    APIGW_RTCODE_SENSI_OUTER_IP_INVALID: 10000011, //请求中的app 外网ip不允许
    APIGW_RTCODE_CHECK_DEV_USER: 10000012, //测试环境调试号码受限
    APIGW_RTCODE_USERAPI_NOPRIVI: 10000020, //client请求中api未经用户授权
    APIGW_RTCODE_ACCESS_TOKEN_DISCARD: 10000021, //access_token已废除
    APIGW_RTCODE_INVALID_OPENID: 10000022, //openid非法
    APIGW_RTCODE_INVALID_OPENKEY: 10000023, //openkey非法
    APIGW_RTCODE_INVALID_OPENID_OPENKEY: 10000024,//openid openkey验证失败
    APIGW_RTCODE_OAUTH_TIMESTAMP: 10000025,//0x71f 0x5b: timestamp与系统当前时间相差超过10分钟
    APIGW_RTCODE_OAUTH_NONCE: 10000026,//0x71f 0x5a: 重复的nonce
    APIGW_RTCODE_LOGIN_INVALID_APPID: 10000070, //登录验证返回，验证openkey时appid非法
    APIGW_RTCODE_OPENID_OPENKEY_NOTMATCH: 10000071, //openid和openkey不匹配
    APIGW_RTCODE_INVALID_APPKEY: 10000072, //appkey和权限tmem中的appkey不一致
    APIGW_RTCODE_INVALID_ACCESSTOKEN_MODIFY_SIG: 10000073, //0x47 access token改密失效
    
    
    WORLD_BOSS_IS_END:11001, //boss战已结束
    WORLD_BOSS_DEAD:11002,//boss被打死
    WORLD_BOSS_TIMEOUT:11003,//时间到

    /** 斗兽场*/
    FREE_NPC_LIST_IS_NULL: 90001, //没有获取NPC列表
    NO_ENOUGH_STAR: 90002, //领奖星级不够
    NO_ENOUGH_LEVEL: 90003, //领奖等级不够
    REWARD_ALREADY_TAKEN: 90004, //已经领取过该礼包
    LEVEL_NOT_EXIST: 90005, //等级达到上限
    NPC_NOT_EXIST: 90006, //NPC不存在
    NPC_WAVE_COUNT_ERROR: 90008, //怪物波次刷新错误
    NPC_WAVE_TEMP_ERROR: 90009, //怪物波次模板错误
    NPC_REFRESH_CD_TIME_ERROR: 90012, //NPC刷新冷却时间错误
    NPC_TEAM_CONF_ERROR: 90013, //NPC队列配置错误
    NPC_NO_TEAM: 90014, //队伍中的NPC没有全部解锁
    NUM_IS_UP: 90015, //每日次数已经用完
    /** 神装 */
    ALL_READY_ACTIVATION: 91000, //已经解锁
    TYPE_ERROR: 91001, //类型错误
    NOT_ACTIVATION: 91002, //尚未解锁
    ACTIVATION_LEVEL_NOT_ENOUGH: 91003, //等级尚未达到突破等级
    MORE_THAN_EXP_LEVEL: 91004, //超过玩家等级
    ALREADY_MAX_STAR: 91005, //已达到最大星级
    ALREADY_MAX_STAR_LEVEL: 91006, //已达到当前星级最大等级
    ALREADY_MAX_ACTIVATION_LEVEL: 91007, //已达到最大突破等级
    SKILL_NOT_ACTIVATION: 91008, //技能没有激活
    SKILL_TYPE_NOT_FOUND: 91009, //没有找到技能类型
    Max: 1000000
};