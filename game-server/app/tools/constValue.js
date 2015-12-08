/**
 * CREATED wITh JETBRAINs WEbSTORM.
 * UsER: EDER
 * DATE: 13-5-24
 * TIME: 下午5:51
 * TO ChANGE ThIs TEMPlATE UsE FIlE | SETTINGs | FIlE TEMPlATEs.
 */
module.exports = {
    ePlatform: {
        IOS: 0,
        ANDROID: 1
    },
    eRivalState: {
        ZhanHun0: 0,         //可斩�?
        ZhanHun1: 1,         //可斩�?
        ZhanHun2: 2,         //可斩�?
        FuChou: 3,           //可复�?
        FuChouSuccess: 4,   //复仇成功
        FuChouFailed: 5,    //复仇失败
        BeiFuChou: 6        //被复�?
    },
    ePlayerDB: {
        PLAYERDB_PLAYERINFO: 0,            //玩家数据
        PLAYERDB_ITEM: 1,                   //物品
        PLAYERDB_ASSETS: 2,                 //财产
        PLAYERDB_AREA: 3,                    //关卡
        PLAYERDB_SKILL: 4,                   //技�?
        PLAYERDB_SOUL: 5,                   //斗魂
        PLAYERDB_ACTIVITY: 6,                 // 活动
        PLAYERDB_NIUDAN: 7,                 // 扭蛋
        AsyncPvPRival: 8,                 // 异步PVP对手信息
        PLAYERDB_SHOP: 9,                   // 商城
        PLAYERDB_ATT: 10,                   // 属�?
        Mission: 11,                        //任务
        NewHelp: 12,                        //新手指引
        AsyncPvPInfo: 13,                  // 异步PVP信息
        GetGift: 14,                     // 礼包
        Achieve: 15,                     //成就
        PLAYERDB_MAGICSOUL: 16,          //魔晶
        Physical: 17,            //体力
        MisGroup: 18,           //任务组ID
        ClimbData: 19,            //爬塔数据
        PLAYERDB_ALCHEMY: 20,            //炼金
        MisFinish: 21,              //已完成的任务(特定类型)
        VipInfoManager: 22,         // vip特权信息
        LoginGift: 23,            //登录礼包
        MineManager: 24,  				//魔域数据
        SuitInfo: 25,                    //装备套装数据
        HonorRewardTop: 26,              //荣耀排行榜领奖状�?
        PLAYERDB_RUNE: 27,              //技能符�?
        ShopLingli: 28,                 //灵力
        RewardMis: 29,              //悬赏任务
        FashionSuit: 30,              //时装
        PLAYERDB_ACTIVITYCD: 31,    // 活动CD
        OperateInfo: 32,              //运营数据
        Title: 33,              //号称
        ChartReward: 34,          // 排行榜奖�?
        ChartAcceptReward: 35,       // 排行榜领奖记�?
        Exchange: 36,              //兑换
        MonthCard: 37,              //月卡领取时间
        AskMagic: 38,               //求魔
        MagicOutput: 39,             //求魔产出
        SoulSuccinct: 40,            //洗练
        SuccinctNum: 41,            //洗练次数
        NoticeInfo: 42,             //公告
        UnionMagic: 43,              //公会技�?
        UnionTemple: 44,              //公会神殿
        ExtraVipPoint: 45,           //额外贵族点数（idip调整）
        QQMemberGift: 46,            //QQ会员礼包
        Pets: 47,                   //宠物
        Advance: 48,                   //新版活动
        PetsAtt: 49,                   //宠物属性
        Coliseum: 50,                  //斗兽场
        Artifact: 51,                  //神装
        ToMarry: 52,                   //求婚信息
        MarryInfo: 53,                  //结婚信息
        XuanYan:54,                     //宣言
        MarryMsg:55,                    //结婚消息数
		StoryDrak: 56,                  //剧情炼狱
        END: 1000
    },
    eDirtyNoChange: 'noChange', //玩家脏数据对比，没有改变返回状�?
    eSaveType: {
        LeaveGame: 0,  //离开游戏
        Time: 1         //定时存档
    },
    eChatType: {
        WORLD: 0,      //世界
        ONE: 1,        //私聊
        GROUP: 2,     //公会
        ROOM: 3,      //房间
        GM: 10        //公告
    },
    eSex: {
        Male: 0,                 //男，
        Female: 1              //�?
    },
    eJob: {
        JOB_0: 0,              //剑客
        JOB_1: 1              //刺客
    },
    eLoginState: {
        CHECK: 1,      //验证通过�?
        LOGIN: 2,      //登陆中，未选择角色，可能是刚进入，也可能是更换角色
        INCS: 3,       //选择了某个角色进入cs�?
        LEAVE: 4,       //玩家已经离开了，缓存这个玩家的数据，等待下次登陆�?
        UnUsual: 10      //特别处理的状�?
    },
    ePlayerState: {
        NONE: 0,             //无状�?
        HALL: 1,             //大厅
        TRANSFER: 2,        //传�?
        ROOM: 3,              //在房间里�?
        LOAD: 4,                 //进入房间加载
        GAME: 5               //进入副本游戏状�?
    },
    eLoadState: {
        None: 0,             //未加载状�?
        OK: 1                //加载完毕
    },
    eLifeState: {
        NullTransition: 0,
        Timeout: 1,
        Activate: 2,
        SawPlayer: 3,
        Attack: 4,
        Provoke: 5,
        RandomMove: 6,
        Idle: 7,
        Injured: 8,
        InjuredBack: 9,
        InjuredFloat: 10,
        InjuredVertigo: 11,
        Death: 12,              //死亡
        LostPlayer: 13,
        Revive: 14               //复活
    },
    eEntityType: {
        PLAYER: 'PLAYER',         //人物
        NPC: 'NPC',             //NPC
        MOB: 'MOB',
        EQUIPMENT: 'EQUIPMENT',     //装备
        ITEM: 'ITEM',            //物品
        OFFLINEPLAYER: 'OFFLINEPLAYER' // 离线角色.
    },
    eCreateType: {
        Old: 0,
        New: 1
    },
    eItemInfo: {     //物品信息
        GUID: 0,                   //唯一ID
        ROLEID: 1,                 //拥有者ID
        TEMPID: 2,                  //模板ID
        BAGTYPE: 3,                  //背包类型
        Intensify: 4,              //强化次数
        STAR0: 5,                    //镶嵌的钻石ID
        STAR1: 6,                    //镶嵌的钻石ID
        STAR2: 7,                    //镶嵌的钻石ID
        NUM: 8,                    //物品数量
        ZHANLI: 9,                   //战力
        BaseZhanli: 10,                   //基础战力

        ItemStar: 11,                           //物品星级（根据属性值计算得到）

        ATTACK: 12,                         //攻击
        DEFENCE: 13,                        //防御
        ITEMINFO_HP: 14,                    //血�?
        ITEMINFO_MP: 15,                    //魔法�?
        ITEMINFO_MAXHP: 16,                 //最大血�?
        ITEMINFO_MAXMP: 17,                 //最大魔法量

        ITEMINFO_CRIT: 18,                  //暴击�?
        ITEMINFO_CRITDAMAGE: 19,           //暴击伤害
        ITEMINFO_DAMAGEUP: 20,             //伤害提升
        ITEMINFO_HUNMIREDUCE: 21,          //昏迷
        ITEMINFO_HOUYANGREDUCE: 22,        //后仰
        ITEMINFO_HPRATE: 23,               //Hp回复速率
        ITEMINFO_MPRATE: 24,                //Mp回复速率

        ITEMINFO_ANTICRIT: 25,                  //暴击抵抗
        ITEMINFO_CRITDAMAGEREDUCE: 26,         //暴击伤害减免
        ITEMINFO_DAMAGEREDUCE: 27,             //伤害减免
        ITEMINFO_ANTIHUNMI: 28,                //昏迷抵抗
        ITEMINFO_ANTIHOUYANG: 29,             //后仰抵抗

        ANTIFUKONG: 30,                          //浮空抵抗
        ANTIJITUI: 31,                          //击退抵抗


        HUNMIRATE: 32,                          //昏迷几率
        HOUYANGRATE: 33,                        //后仰几率
        FUKONGRATE: 34,                         //浮空几率
        JITUIRATE: 35,                          //击退几率

        FREEZERATE: 36,                 //冰冻几率
        STONERATE: 37,                 //石化几率
        ANTIFREEZE: 38,                 //冰冻抵抗
        ANTISTONE: 39,                   //石化抵抗
        Max: 40
    },
    eAttInfo: {           //玩家的属�?
        ATTACK: 0,               //攻击
        DEFENCE: 1,              //防御
        HP: 2,                    //血�?
        MP: 3,                    //魔法�?
        MAXHP: 4,                //最大血�?
        MAXMP: 5,                //最大魔法量

        CRIT: 6,                 //暴击�?
        CRITDAMAGE: 7,          //暴击伤害
        DAMAGEUP: 8,            //伤害提升
        HUNMIREDUCE: 9,         //昏迷
        HOUYANGREDUCE: 10,     //后仰
        HPRATE: 11,             //Hp回复速率
        MPRATE: 12,                      //Mp回复速率

        ANTICRIT: 13,                    //暴击抵抗
        CRITDAMAGEREDUCE: 14,           //暴击伤害减免
        DAMAGEREDUCE: 15,               //伤害减免
        ANTIHUNMI: 16,                  //昏迷抵抗
        ANTIHOUYANG: 17,               //后仰抵抗

        ANTIFUKONG: 18,                 //浮空抵抗
        ANTIJITUI: 19,                  //击退抵抗
        HUNMIRATE: 20,                  //昏迷几率
        HOUYANGRATE: 21,                //后仰几率
        FUKONGRATE: 22,                 //浮空几率
        JITUIRATE: 23,                  //击退几率

        FREEZERATE: 24,                 //冰冻几率
        STONERATE: 25,                 //石化几率
        ANTIFREEZE: 26,                 //冰冻抵抗
        ANTISTONE: 27,                   //石化抵抗
        MAX: 28
    },
    eAttDBStr: {
        0: 'attack',
        1: 'defence',
        2: 'hp',
        3: 'mp',
        4: 'maxhp',
        5: 'maxmp',
        6: 'crit',
        7: 'critdamage',
        8: 'damageup',
        9: 'hunmireduce',
        10: 'houyangreduce',
        11: 'hprate',
        12: 'mprate',
        13: 'anticrit',
        14: 'critdamageduce',
        15: 'damagereduce',
        16: 'antihunmi',
        17: 'antihouyang',
        18: 'antifukong',
        19: 'antijitui',
        20: 'hunmirate',
        21: 'houyangrate',
        22: 'fukongrate',
        23: 'jituirate',
        24: 'freezeRate',
        25: 'stoneRate',
        26: 'antiFreeze',
        27: 'antiStone'
    },
    ePlayerInfo: {               // 玩家的信�?
        ROLEID: 0,                // 玩家ID
        ACCOUNTID: 1,            //账户ID
        NAME: 2,                  //玩家昵称
        TEMPID: 3,                //模板ID
        ExpLevel: 4,              //等级
        EXP: 5,                    //经验
        ZHANLI: 6,                 //战力
        LifeNum: 7,                //复活次数
        LoginTime: 8,               //登陆时间
        VipPoint: 9,               //vip点数
        LoginPrize: 10,             //登陆领奖位置
        VipLevel: 11,               //vip等级
        UnionID: 12,                //公会ID
        UnionName: 13,              //公会名称
        Story: 14,                   //剧情进展
        AccountType: 15,             //账户类型
        IsBind: 16,                  //是否绑定了邮�?
        CreateTime: 17,             //角色创建时间
        ActiveEnhanceSuitID: 18,      //激活的强化套装ID
        ActiveInsetSuitID: 19,      //激活的镶嵌套装ID
        RefreshTime: 20,            //每日刷新时间
        ActiveFashionWeaponID: 21,      //激活的时装武器ID
        ActiveFashionEquipID: 22,      //激活的时装防具ID
        IsNobility: 23,                 //手游贵族  1 �? 0 不是
        IsQQMember: 24,                 //QQ会员特权  0 不是  1 普通QQ会员  2 超级QQ会员
        titleID: 25,                   //号称id
        Picture: 26,                   //玩家头像 微信�?
        NickName: 27,                  //qq �?微信名称
        openID: 28,                    // 玩家openID
        serverUid: 29,                 //玩家所在服serverUid
        artifactSkill: 30,                 //神器技能ID
        MAX: 31
    },
    eLoginType: {       //登陆的类�?
        LT_CheckID: 1,  //游客登陆
        LT_Account: 2,  //自己库里的账�?
        LT_QQ: 3,        //qq号登�?
        LT_iTools: 4,   // iTools 登陆
        LT_WX: 5,       // 微信 登陆
        LT_TENCENT_GUEST: 6,       // TENCENT GUEST 登陆
        LT_CMGE_NATIVE: 10,        // CMGE NATIVE 登陆
        LT_Max: 12       // MAX
    },
    eAssetsInfo: {       //玩家财产信息
        Money: 0,                  //金币
        YuanBao: 1,                  //元宝
        SkillPoint: 2,              //技能点�?
        Hun: 3,                       //�?
        ASSETS_LINGSHI: 4,                   //灵石
        ASSETS_LINGWEN: 5,                  //灵纹
        ASSETS_HP: 6,                       //血�?
        ASSETS_MP: 7,                       //蓝瓶
        ASSETS_QIANG: 8,                    //强化�?
        Lingli: 9,                    // 灵力
        Devote: 10,
        Animate: 11,
        ASSETS_MAX: 12,
        ASSETS_MAXVALUE: 2100000000,        //最大�?
        maxPhysical: 999        //体力值的上限
    },
    eAssetsType: {
        Money: 0,               //金币
        YuanBao: 1,              // 1元宝
        SkillPoint: 2,           // 2技能点
        Hun: 3,                  // 3�?
        LingShi: 4,              // 4灵石
        LingWen: 5,              // 5灵纹
        XuePing: 6,              // 6血�?
        LanPing: 7,              // 7蓝瓶
        Qiang: 8,                // 8强化�?
        FriendPoint: 9,         // 9友情�?
        Physical: 15,             //体力�?
        Fashion: 19,             //时装碎片
        Title: 20,              //号称碎片
        Devote: 23,              //公会贡献�?
        Animate: 24                // 公会活跃�?
    },
    eSpecial: {
        Assets: 0,                 //财产
        Item: 1,                   //物品
        Exp: 2,                    //经验�?
        Gift: 3,                     //礼包
        TreasureBox: 4,            //宝箱
        Honor: 5,                    //荣誉(已脱离财产表)
        Lingli: 6                    //灵力(已脱离财产表)
    },
    eAttLevel: {         //属性等�?
        ATTLEVEL_JICHU: 0,                       //基础属�?
        ATTLEVEL_EQUIP: 1,                      //装备
        ATTLEVEL_BUFF1: 2,                        //bUFF�?
        ATTLEVEL_BUFF2: 3,                        //bUFF�?
        ATTLEVEL_BUFF3: 4,                        //bUFF�?
        ATTLEVEL_FASHION: 5,                           //时装
        ATTLEVEL_TITLE: 6,                           //号称
        ATTLEVEL_MAGIC: 7,                          //公会技�?
        ATTLEVEL_UNION_FIGHT: 8,                    //夺城战临时增加
        ATTLEVEL_PET: 9,                            //宠物
        ATTLEVEL_ARES: 10,                          // 竞技场根据战力增加
        ATTLEVEL_PET_POINT: 11,                        //  宠物积分所加战力
        ATTLEVEL_ARTIFACT_TYPE_0: 12,                        //神装类型0
        ATTLEVEL_ARTIFACT_TYPE_1: 13,                        //神装类型1
        ATTLEVEL_ARTIFACT_TYPE_2: 14,                        //神装类型2
        ATTLEVEL_ARTIFACT_TYPE_3: 15,                        //神装类型3
        ATTLEVEL_ARTIFACT_TYPE_4: 16,                        //神装类型4
        ATTLEVEL_ARTIFACT_TYPE_5: 17,                        //神装类型5
        ATTLEVEL_ARTIFACT_TYPE_6: 18,                        //神装类型6
        ATTLEVEL_END: 19,                             //最终�?
        ATTLEVEL_MAX: 20
    },
    ePetAttLevel: {
        ATTLEVEL_JICHU: 0,                       //基础数值
        ATTLEVEL_SKILL: 1,                       //被动技能
        ATTLEVEL_END: 2,                         //最终值
        ATTLEVEL_MAX: 3
    },
    ePetZhanliLevel: {
        ZHANLILEVEL_JICHU: 0,                   //基础数值
        ZHANLILEVEL_GRADE: 1,                   //宠物品级
        ZHANLILEVEL_SKILL: 2,                   //被动技能
        ZHANLILEVEL_END: 3,                     //最终值
        ZHANLILEVEL_MAX: 4
    },
    eEquipBag: {  //装备位置
        WEAPON: 0,                        //武器
        HEAD: 1,                           //�?
        HAND: 2,                            //�?
        CUIRASS: 3,                        //胸甲
        FOOT: 4,                            //�?
        RING: 5,                             //戒指
        TORQUE: 6,                           //项链
        MAX: 7
    },
    eItemType: {   //物品大类�?
        Weapon: 0,                     //武器 EQUIPSUBTYPE
        Armor: 1,                      //防具
        Jewelry: 2,                   //首饰
        Special: 3                 //特殊物品
    },
    eWeaponType: { //武器类型
        WEAPONTYPE_0: 0,                     //单手
        WEAPONTYPE_1: 1                     //双手
    },
    eArmorType: {//护甲类型
        ARMORTYPE_HEAD: 0,                //�?
        ARMORTYPE_HAND: 1,                //�?
        ARMORTYPE_CUIRASS: 2,                //胸甲
        ARMORTYPE_FOOT: 3                //�?
    },
    eJewelryType: { //首饰类型
        Ring: 0,               //戒指
        Torque: 1               //项链
    },
    eBagPos: {    //背包类型
        EquipOff: 0,        //装备背包�?
        EquipOn: 1       //装备在身�?
    },
    eFashionSuitInfo: {
        ROLEID: 0,     //玩家ID
        SUITID: 1,     // 时装ID
        STATS: 2,     //时装状�?
        OPENTIME: 3,     //时装激活时间
        MAX: 4
    },
    eFashionStats: {
        NO: 0,     //未开�?
        OPEN: 1,     // 未激�?
        ACTIVATE: 2     //已激�?
    },
    eCustomInfo: {
        ROLEID: 0,     //玩家ID
        AREAID: 1,     //关卡ID
        SCO: 2,     //关卡分数
        NUM: 3,     //关卡次数
        WIN: 4,        //是否完成0未完成，1完成
        Prize: 5,   //是否领取了奖�?
        LevelTarget: 6,   //是否领取了奖�?
        StarNum: 7,     //星星数量
        Achieve : 8,     // 成就状态
        MAX: 9
    },
    //炼狱最高积分
    customScoreMax: 4000,
    eSkillInfo: {
        RoleID: 0,   // 玩家ID
        TempID: 1,   // 模板ID
        CdTime: 2,   // cd时间
        RuneBranch: 3, //技能符文选择分支
        Max: 4
    },
    ePlayerMagicInfo: {
        RoleID: 0,   // 玩家ID
        TempID: 1,   // 模板ID
        MagicLevel: 2,   //  等级
        Max: 3
    },
    eRuneInfo: {
        roleID: 0,  // 玩家ID
        tempID: 1,  // 模板ID
        skillType: 2,    // 技能类�?
        Max: 3
    },
    eSoulType: {
        SOULTYPE_0: 0,        //嗜血
        SOULTYPE_1: 1,        //黑暗
        SOULTYPE_2: 2,        //狡诈
        SOULTYPE_3: 3,        //毁灭
        SOULTYPE_4: 4,        //灵魂
        SOULTYPE_MAX: 5
    },
    eSoulInfo: {
        TEMPID: 0,   //模板ID
        RoleID: 1,   //玩家ID
        LEVEL: 2,   //等级
        ATTID_0: 3,   //属性id
        ATTNUM_0: 4,   //属性数�?
        ATTID_1: 5,   //属性id
        ATTNUM_1: 6,   //属性数�?
        ATTID_2: 7,   //属性id
        ATTNUM_2: 8,   //属性数�?
        PROBABILITY: 9,    // 升级的几�?
        Zhanli: 10,     //斗魂的战�?
        SkillNum: 11,   //已经学习的技能数�?
        Accomplish: 12, //是否完成进阶试炼�?�?�?
        EvolveNum: 13,  //进阶次数�?�?�?
        WakeLevel: 14,   //觉醒等级
        Max: 15
    },
    eTeamInfo: {
        TeamID: 0, // 队伍ID
        TeamName: 1,//队伍名称
        VipLevel: 2, //vip等级
        IsPSW: 3,    //是否有密
        OwnerID: 4, //拥有者ID
        CustomID: 5,    //小关卡ID
        LevelTarget: 6,    //副本类型
        LevelParam: 7,    //副本ID
        UnionID: 8,    // 公会ID
        animalOrder: 9,   // 打的第几个神兽
        Max: 10
    },
    eLevelTarget: {
        NewPlayer: 0,   //新手关卡
        Normal: 1,      //正常关卡
        Activity: 2,    //活动关卡
        ZhanHun: 3,     //异步PVP（斩魂关卡）
        FaBao: 4,        //法宝试炼
        PaiHang: 5,      //排行
        Hell: 6,         //炼狱关卡
        Team: 7,        //组队关卡
        WorldBoss: 8,
        Climb: 9,
        Ares: 10,       // 战神
        SoulPVP: 11,      // 邪神竞技
        Train: 12,      // 练功关卡
        SoulEvolve: 13,// 邪神进阶
        unionFight: 14,// 公会夺城战
        JJC: 15,      // 竞技场	
        worldBoss:16, //世界boss
        TeamDrak : 17, // 组队噩梦
        Coliseum : 18, // 斗兽场
        marry: 19,    //婚姻关卡 甜蜜之旅
		StoryDrak : 20, // 剧情噩梦
        Max: 21

    },
    eLeaveTeam: {
        SELF: 0,  //自己主动离开
        KICK: 1, //房主踢出
        ITEM: 2  //物品满了，被迫离开
    },
    eTeamState: {
        Room: 0,       //房间�?
        Custom: 1       //关卡
    },
    ePlayerTeamInfo: {
        TeamID: 0,     //队伍ID
        CustomID: 1,   //关卡ID
        TeamState: 2,  //队伍状态
        AtkValue: 3,   //角色的攻击力
        fightDamage: 4,//夺城战造成的伤害
        Max: 5
    },
    ePlayerTeamState: {
        TeamNull: 0,   //无状�?
        TeamIn: 1,   //进入队伍�?
        TeamReady: 2,   //准备状�?
        TeamYan: 3     //去验证了
    },
    eWorldState: {
        PosState: 0,         //玩家的位置状�?主城�?野外�?关卡�?传�?
        TeamID: 1,           //玩家的队伍ID
        CustomID: 2,        //关卡ID
        LifeState: 3,        //状�?
        Max: 4
    },
    ePosState: {
        Hull: 0, //主城
        Field: 1,//野外
        Custom: 2,//关卡
        Transfer: 3//传送中
    },
    eCustomType: {
        Single: 0,//单人�?
        Hell: 1, //地狱模式
        Team: 2 //组队�?
    },
    eCustomSmallType: {
        Single: 1,      //剧情
        Hell: 2,        //炼狱
        Team: 3,        //多人
        Activity: 4,     //活动
        Climb: 5,       //爬塔
        Mine: 6,        //魔域(注：此枚举值只做魔域完整性使用，该值并不存在于关卡配置表的关卡小类型字段smallType)
        ZhanHun: 7,     //战魂
        NewCus: 8,       //新手�?
        SoulCus: 9,      //变身试练�?
        PvP: 10,         //PVP
        Arena: 11,        //竞技�?
        SoulPVP: 12,      //邪神竞技�?
        Train: 13,        //公会练功�?
        SoulEvolve :14,   // 邪神进阶
        unionFight : 15,   // 公会夺城战
        JJC : 16,   // 竞技场
        WorldBoss:17,     //世界boss
        TeamDrak:18,     // 多人噩梦
        Coliseum:19,     // 斗兽场
        Marry:20,           //结婚关卡 甜蜜之旅
		StoryDrak : 21 // 剧情噩梦

    },
    eCampType: {    // 玩家和NPC势力
        eCT_SideA: 0,
        eCT_SideB: 1,
        eCT_AllPeace: 2,
        eCT_FightingAB: 3
    },
    eOccupantInfo: {
        CustomID: 0,
        RoleID: 1,
        RoleName: 2,
        RoleSco: 3,
        LeaveTime: 4,
        UnionID: 5,
        UnionName: 6,
        RoleLevel: 7,
        Max: 8
    },
    eNiuDanInfo: {
        NiuDanID: 0,
        RoleID: 1,
        StarNum: 2,
        FreeNum: 3,
        CountTime: 4,
        Max: 5
    },
    eAsyncPvPInfo: {
        RoleID: 0,
        BlessLeft: 1,
        BlessReceived: 2,
        AttackNumAddByBless: 3,
        RefreshLastTime: 4,
        AttackCost: 5,
        RequireBlessLeft: 6,
        Max: 7
    },
    eAsyncPvPInfo_EX: {
        roleID: 'roleID',
        attackNum: 'attackNum',
        attackedNum: 'attackedNum',
        lostTimes: 'lostTimes',
        loseLingli: 'loseLingli',
        lingli: 'lingli',
        honor: 'honor',
        isOnline: 'isOnline'
    },
    eGoodsInfo: {
        GoodsID: 0,
        RoleID: 1,
        BuyNum: 2,
        VipBuyTop: 3,
        Max: 4
    },
    eFriendInfo: {
        RoleID: 0,
        FriendID: 1,
        FriendType: 2,
        BlessCount: 3,
        BlessLastDay: 4,
        BlessReceivedLastDay: 5,
        ClimbCustomNum: 6,
        ClimbWeekScore: 7,
        ClimbScoreTime: 8,
        Max: 9
    },
    eFriendApplyInfo: {
        RoleID: 0,
        ApplyFriendID: 1,
        ApplyTime: 2,
        Max: 3
    },
    eFriendType: {
        All: 0,     // 所有好�?
        Normal: 1,  // 正常的好�?
        QQ: 2        // QQ的好�?
    },
    eFriPhyInfo: {
        roleID: 0,
        friendID: 1,    //好友ID
        recvPhy: 2,     //领取体力标识
        sendPhy: 3,     //赠送体力标�?
        recvTime: 4,    //好友赠送的时间
        Max: 5
    },

    eMailInfo: {
        MailID: 0,      //邮件ID
        RoleID: 1,      //拥有者ID
        SendID: 2,      //发送者ID
        SendName: 3,    //发送者名�?
        Subject: 4,        //主题
        Content: 5,      //内容
        MailState: 6,     //邮件状�?0未查�?1已经查看
        MailType: 7,     //发送者类�?0 系统 1 玩家
        SendTime: 8,      //发送时�?
        ItemID_0: 9,      //物品ID
        ItemNum_0: 10,     //物品数量
        ItemID_1: 11,
        ItemNum_1: 12,
        ItemID_2: 13,
        ItemNum_2: 14,
        ItemID_3: 15,
        ItemNum_3: 16,
        ItemID_4: 17,
        ItemNum_4: 18,
        SendUid: 19,       //发送者服务器id uid
        Max: 20
    },
    eMailState: {
        UnRead: 0,    //未查�?
        Read: 1,      //查看
        GetItem: 2   //在获取物�?
    },
    eMailType: {
        System: 0,   //系统
        User: 1      //用户
    },
    eChartType: {
        Zhanli: 0, //战力排行�?
        Honor: 2, //荣誉排行
        Climb: 3, //爬塔单区�?
        FriendClimb: 4, //爬塔好友�?
        AwardScore: 5,  //扭蛋积分
        Recharge: 6,    //充�?
        Soul: 7,  //邪神排行�?
        SoulPvp: 8, //邪神竞技场排行榜
        UnionScore: 9, //公会积分排行
        UnionAnimal: 10, //公会间神兽排行
        UnionDamage: 11, //公会内神兽排行
        Pet: 12,    //宠物排行
		ChestPoint:13, //宝箱抽奖积分排行榜
		JJC: 14,           //jjc 积分排行榜
        FriendJJC: 15,     //jjc 好友积分榜
		WorldBoss:16,   //世界boss排行榜
		StoryScore:17,   // 剧情炼狱积分
        Marry: 20,      //婚姻 姻缘值排行榜
        Max: 21
    },
    eAcrossChartType: {
        Zhanli: 0, //战力排行�?
        Max: 1
    },
    eChartZhanliInfo: {
        Chart: 0,  //排名
        RoleID: 1,
        RoleName: 2,
        Zhanli: 3,
        ExpLevel: 4,
        UnionID: 5,
        UnionName: 6,
        OldChart: 7,
        Max: 8
    },
    eTableTypeInfo: { //数据表名信息
        Chat: 0,         //聊天
        Friend: 1,      //好友
        Mail: 2,         //邮件
        ItemChange: 3,  //物品变化
        MoneyChange: 4, //金钱变化
        BuyEvent: 5,     //购买事件
        GameOver: 6,     //结算
        Relive: 7,       //复活
        Skill: 8,        //技�?
        Exp: 9,          //经验
        SmeltSoul: 10,    //炼魂
        UpSoulLevel: 11,  //提升魂魄等级
        Mission: 12,      //任务
        NiuDan: 13,         //角色
        UnionMagic: 14,     //公会技�?
        Max: 15
    },
    eMailOperateType: {  //对邮件的操作类型
        SendMail: 0,         //发送邮�?
        DelMail: 1,          //删除邮件
        GetMailItem: 2,     //获取物品
        Max: 3
    },
    eItemChangeType: {   //物品的变化原�?
        BUY: 0,              //购买
        MAIL: 1,             //邮件
        GETCUSTOMPRIZE: 2,   //获取关卡奖励
        LOGINPRIZE: 3,       //登陆奖励
        MissionPrize: 4,    //任务奖励
        GETEXP: 5,       //获取经验
        GAMEOVER: 6,     //游戏结算
        Sell: 7,          //出售物品
        InlayStar: 8,    //镶嵌钻石
        RemoveStar: 9,   //移除钻石
        Intensify: 10,   //强化
        Create: 11,      //创建
        FastFinish: 11,      //快速结�?
        GiftGet: 12,   //礼包获取
        ItemResolve: 13,   //物品分解
        PaTa: 14,   //爬塔
        FastCarOfPaTa: 15,   //爬塔之直通车奖励
        ZhuanPanOfPaTa: 16,   //爬塔之转盘奖�?
        MAX: 17
    },
    eMoneyChangeType: {      //金钱变化的原�?
        BUYITEM: 0,       //购买物品
        GAMEOVER: 1,     //通关结算
        GETCUSTOMPRIZE: 2,   //获取关卡奖励
        LOGINPRIZE: 3,       //登陆奖励
        MissionPrize: 4,    //任务奖励
        HPANDMP: 5,     //吃蓝屏和血�?
        RELIVE: 6,       //复活
        LearnSkill: 7, //学习技�?
        SmeltSoul: 8,    //炼魂
        UpSoulLevel: 9,  //提升魂魄等级
        SoulOpen: 10,    //魂魄打开
        GETEXP: 11,      //获取经验
        SellItem: 12,    //出售物品
        InlayStar: 13,   //镶嵌钻石
        RemoveStar: 14,  //移除钻石
        SynthesizeStar: 15, //合成灵石
        Intensify: 16,       //强化
        Update: 17,
        UseNiuDan: 18,   //使用扭蛋
        AchievePrize: 19, //成就奖励
        ItemResolve: 20,   //物品分解
        MAX: 21
    },
    eEmandationType: {   //物品的增删类�?
        ADD: 0, //增加
        DEL: 1, //删除
        Other: 2,   //其它，如镶嵌�?
        MAX: 3
    },
    eExpGetType: {
        BUY: 0,              //购买
        NPC: 1,              //打�?
        GETCUSTOMPRIZE: 2,   //获取关卡奖励
        LOGINPRIZE: 3,       //登陆奖励
        MissionPrize: 4,    //任务奖励
        MAX: 5
    },
    eSmeltSoulType: {
        Normal: 0,       //普通炼�?
        Strong: 1,       //强力炼魂
        OpenNew: 2,      //魂魄打开
        AKeySoul: 3,     //一键炼�?
        Max: 4
    },
    eAddSkillType: {
        New: 0,              //新建
        UpSoulLevel: 1,    //提升魂魄等级
        Load: 2,            //加载
        OpenNew: 3,
        Update: 4,
        Max: 5
    },
    eSoulOperType: {
        SmeltSoul: 0,     //炼魂
        SoulOpen: 1,      //打卡魂魄
        Max: 2
    },
    eMisOperType: {      //对任务的操作类型
        Add: 0,
        Max: 1
    },
    eRechargeInfo: {
        RechargeID: 0,   //注册顺序ID
        RoleID: 1,        //玩家ID
        RechargeType: 2,   //充值状�?
        Validate: 3,      //验证结果
        AppCode: 4,       //苹果返回编码
        BuyID: 5,            //充值ID
        Max: 6
    },
    eRechargeType: {
        ClientGet: 0,     //客户端刚申请
        ClientIap: 1,     //客户端充值成功了，服务器去苹果服务器验证
        IapIsTrue: 2      //验证完毕
    },
    eGiftInfo: {
        GiftID: 0,         //礼品ID
        RoleID: 1,         //玩家ID
        GiftType: 2,      //礼品状�?
        Max: 3
    },
    eGiftState: {
        NoOver: 0,    //没有完成
        GetGift: 1,    //获取物品�?
        IsEnd: 2       //获取完毕�?
    },
    eGiftType: {
        FirstMoney: 0,     //首次充�?
        ExpLevel: 1,       //等级礼包
        VipLevel: 2,        //vip等级礼包
        CustomLevel: 3,     //关卡奖励�?
        DailyReward: 4,     //每日登陆礼包

        Animate: 8,          //公会活跃度礼�?
        NpcCollect: 9,      //斗兽场NPC收集礼包
        StoryDrak : 12      // 噩梦
    },
    eGmType: {   //公告的类�?
        ZhanLi: 0,       //战力
        FirstKill: 1,   //首杀
        KillBoss: 2,    //击杀
        GetItem: 3,     //获取物品
        NiuDan: 4,      //扭蛋相关
        FaBao: 5,      //法宝相关
        GetAsset: 6,   //财产
        PaTa: 7,      //爬塔相关
        ZhuanPan: 8,  //幸运转盘
        KillNPC: 9,  //击杀怪物（可重复�?
        ZhanliValue: 10, //战力达到指定值（可重复）
        Title: 11,   //获得指定称号(可重复）
        Fashion: 12, //获得时装(可重�?
        UnionLevel: 13, //公会等级（可重复)
        MagicSoul: 14,  //魔翼阶级(可重复）
        VipLevel: 15,  //玩家vip等级(可重�?
        VipLogin: 16,   //vip用户登录(可重�?
        PvpRank: 17,    //竞技场排�?
        ChestsActivity: 18,   //开宝箱活动
        WorldBoss:19,  //世界公告
        JJC:20,  //竞技场
        Wedding:21,     //结婚领红包
        Max: 22
    },
    eFirstKillInfo: {  //首杀数据表的字段
        typeID: 0,   //类型ID
        NpcID: 1,    //npc的ID
        Flag: 2,     //标识�?
        Max: 3
    },
    eFirstNoticeType: {  //首次公告的类�?
        FirstKill: 0,    //首杀
        ZhanLi: 1,        //战力
        Max: 2
    },
    eZhanLiStart: {      //战力公告计算初始�?间隔
        Interval: 10000,       //间隔
        StartValue: 10000    //起始�?
    },
    eItemOperType: {      //物品的操作类�?
        GetItem: 0,       //获取物品
        OtherType: 1,     //对物品的非获取操�?如，强化 镶嵌�?
        Max: 2
    },

    eAchiType: {
        Custom: 1,       //通关
        KillNpc: 2,      //刷�?
        Max: 3
    },
    eAchiState: {       //成就的当前状�?
        Unfinish: 0,     //未完�?
        Finish: 1,         //完成
        Prize: 2        //获得物品�?
    },
    eAchiInfo: {  //成就属�?
        AchiID: 0,       //成就ID
        RoleID: 1,       //玩家ID
        AchiState: 2,   //完成状�?
        FinishNum: 3,    //完成的数�?
        Max: 4
    },
    eBuffOpetype: { //buff的操作类�?
        Add: 0,     //添加
        Del: 1,     //删除
        Max: 2
    },
    ePaymentType: {     // 支付类型
        PT_LOCAL: 0,    // 本地记录货币
        PT_TENCENT: 1,  // 腾讯货币体系
        PT_Max: 2
    },
    ePaymentZoneType: {        // ZoneId 类型
        PZ_GLOBAL_SHARE: 0,    // 全区账号共享方式 zoneId = 1
        PZ_SHARE: 1,            // 单区共享方式 zoneId = accountType
        PZ_PLAYER: 2,           // 区分角色方式 zoneId = accountType_roleId
        PZ_SERVER_UID: 3,      // 分服�?不区分角色方�?zoneId = list.default @serverUid
        PZ_Max: 4
    },
    ePaymentModifyAssets: {             // 货币添加方式
        PMA_ADD_PAY_VALUE: 0,            // 直接添加 result.save_amt - vipPoint
        PMA_MODIFY_OFFSET_VALUE: 1,     // 修改余额 totalBalance - oldValue
        PMA_Max: 2
    },
    eMagicSoulInfo: {
        TEMPID: 0,   //大表ID
        RoleID: 1,   //玩家ID
        Zhanli: 2,   //魔灵增加总战�?
        InfoID: 3,   //小表id
        ExNum: 4,   //经验点数
        SkillID_0: 5,   //技能表ID
        SkillID_1: 6,   //技能表ID
        SkillID_2: 7,   //技能表ID
        SkillID_3: 8,   //技能表ID
        SkillID_4: 9,   //技能表ID
        SkillID_5: 10,   //技能表ID
        SkillID_6: 11,   //技能表ID
        SkillID_7: 12,   //技能表ID
        Max: 13
    },
    eMagicOutputInfo: {
        RoleID: 0, // 玩家ID
        ItemID: 1, //产出物品的ID
        Num: 2,//产出物品的数�?
        Max: 3

    },
    eAttFactor: {   //战力计算因数
        GONGJI: 4,         //攻击�?
        FANGYU: 2,         //防御�?
        HP: 0,              //当前Hp
        MP: 0,              //当前Mp
        MAXHP: 1,           //最大Hp
        MAXMP: 0.01,        //最大Mp
        BAOJILV: 1,         //暴击�?
        BAOJISHANGHAI: 1.43,    //暴击伤害
        SHANGHAITISHENG: 4.4,   //伤害提升
        HUNMI: 0,           //昏迷
        HOUYANG: 0,         //后仰
        HPHUIFU: 0,         //Hp回复速率
        MPHUIFU: 0,          //Mp回复速率
        BAOJIDIKANG: 1.1,   //暴击抵抗
        BJSHHJM: 1.4,     //暴击伤害减免
        SHANGHAIJIANMIAN: 4.4,      //伤害减免
        HUNMIDIKANG: 1.5,           //昏迷抵抗
        HOUYANGDIKANG: 1.5,         //后仰抵抗
        FUKONGDIKANG: 1.5,          //浮空抵抗
        JITUIDIKANG: 1.5,           //击退抵抗
        HUNMIJILV: 1.5,           //昏迷几率
        HOUYANGJILV: 1.5,           //后仰几率
        FUKONGJILV: 1.5,           //浮空几率
        JITUIJILV: 1.5,              //击退几率

        FREEZERATE: 1.5,                 //冰冻几率
        STONERATE: 1.5,                 //石化几率
        ANTIFREEZE: 1.5,                 //冰冻抵抗
        ANTISTONE: 1.5                   //石化抵抗
    },
    eWorldBossInfo: {
        BossID:0,
        NpcID:1,               
        Hp:2,
        LastRoleID:3,
        Max:4
    },
    eClimbInfo: {
        RoleID: 0,
        ClimbData: 1,
        TodayData: 2,
        CengNum: 3,
        WeekScore: 4,
        Time: 5,
        FastCarNum: 6,
        Max: 7
    },
    eChartClimbInfo: {
        Id: 0,
        RoleID: 1,
        RoleName: 2,
        Score: 3,
        CengNum: 4,
        Max: 5
    },
    eMisStartCon: { //任务的触发条�?
        Level: 0,       //等级触发
        Task: 1,        //任务触发
        LevFir: 2,      //先等级后任务
        LevAndTask: 3,   //等级任务双条件触�?
        LevAndUnion: 4  //等级公会双条件触�?
    },
    eMisInfo: {  //任务属�?
        MisID: 0,   //任务ID
        RoleID: 1,   //玩家ID\帐号ID
        MisState: 2,   //任务状�?
        MisNum_0: 3,  //任务完成程度
        MisNum_1: 4,  //任务完成程度
        MisNum_2: 5,  //任务完成程度
        MisNum_3: 6,  //任务完成程度
        MisNum_4: 7,  //任务完成程度
        MisNum_5: 8,  //任务完成程度
        MisNum_6: 9,  //任务完成程度
        MisNum_7: 10,  //任务完成程度
        MisNum_8: 11,  //任务完成程度
        MisNum_9: 12,  //任务完成程度
        PreOverNum: 13,  //前置条件完成数量
        Max: 14
    },
    eMisBigType: {
        MainLine: 0,    //主线任务
        EveryDay: 1,    //日常任务
        branchLine: 2,  //支线任务
        Max: 3
    },
    eMisState: {
        Get: 0,           //获得任务
        Over: 1,          //完成任务
        NoActivate: 2     //未激活状�?
    },
    eMisType: {
        SpecifyCus: 1,      //通关指定副本XX�?
        AnyCustom: 2,       //通关多个副本中任意副本XX�?
        AnyBoss: 3,         //参与多个BOSS活动中任意活动XX�?
        OverCus: 4,         //闯关达到XX�?
        SemlSoul: 5,        //任意邪神祭炼XX�?
        TakePvp: 6,         //参与任意副本战斗XX�?
        WinPvp: 7,          //PVP战斗胜利XX�?
        Lottery: 8,         //进行抽奖XX�?
        GiveFri: 9,         //赠送友情点XXX�?
        BlessFri: 10,       //祝福好友XX�?
        OccupyCus: 11,      //占领任意关卡XX�?
        Intensify: 12,      //任意装备强化成功XX�?
        SoulUpLev: 13,      //xx邪神达到XX�?
        MagicSoul: 14,      //魔灵品阶达到对应ID
        OpenSoul: 15,       //开启第XX个邪�?
        RecvGift: 16,       //领取XX礼包ID
        LearnSkill: 17,     //学习任意技能XX�?
        InlayStar: 18,      //对任意装备镶嵌X个任意灵�?
        UpLevel: 19,        //等级达到XX�?
        YuLiu: 20,          //预留字段
        QQFriend: 21,       //拥有XX名QQ好友
        VipLevel: 22,       //达到或超过VIPXX�?
        ZhanLi: 23,         //战力达到XXXXX
        MagicSoulJi: 24,    //魔灵祭炼XXX�?
        StarNum: 25,        //XX章节达到XX�?
        SignNum: 26,         //累计签到XXX�?
        SynthesisEquip: 27,  //合成多个装备中的任意装备XXX�?注意区分不同职业的装�?
        MineSweep: 28,       //完成多个魔域关卡中的任意关卡XXX�?
        Recharge: 29,    //充值任意金额人民币
        ShareSuccess: 30 //成功分享

    },
    eAlchemyInfo: {
        RoleID: 0,   //玩家ID
        time: 1,    //炼金次数
        isBaoJi: 2,    //是否出暴�?
        Max: 3
    },
    ePhysicalInfo: {
        roleID: 'roleID',                  //玩家ID
        buyPhysicalNum: 'buyPhysicalNum',          //购买体力数量
        receivePhysicalNum: 'receivePhysicalNum',      //接收体力次数
        givePhysicalNum: 'givePhysicalNum',         //赠送体力次�?
        sendPhyTime: 'sendPhyTime',              //上次发送体力倒计时的时间
        phyGiftRecord: 'phyGiftRecord'          //每日体力发放领取记录
    },
    eVipInfo: {       //VIP特权次数
        RoleID: 0,
        BuyPVPNum: 1,    //额外购买斩魂次数
        FreeSweepNum: 2,  //免费扫荡次数
        PhysicalNum: 3,
        FreeReliveNum: 4,
        MineSweepNum: 5,
        Max: 6
    },
    eLoginGiftInfo: {  //每日登陆礼包
        roleID: 0,   //账号ID
        One: 1,     //礼包状�?
        Two: 2,     //礼包状�?
        Three: 3,  //礼包状�?
        Four: 4,   //礼包状�?
        Five: 5,   //礼包状�?
        Six: 6,    //礼包状�?
        Seven: 7,  //礼包状�?
        Max: 8
    },
    eMineSweepInfo: {
        roleID: 0,              //角色ID
        mineSweepID: 1,         //总关ID，对应MineSweepItemTemplate
        mineSweepLevelID: 2,    //当前关ID，对应MineSweepLevelTemplate
        maxHp: 3,               //最大血�?
        currentHp: 4,           //当前血�?
        leftTimes: 5,           //剩余次数
        leftReviveTimes: 6,     //剩余复活次数
        cdTime: 7,              //冷却时间（秒�?
        passCdTime: 8,//保存角色下线 进入关卡时间
        baoXiang_ClearLevel: 9, //大关宝箱是否领取 0：未领取  1：已领取
        baoXiang_KillAll: 10,    //小关宝箱是否领取 0：未领取  1：已领取
        items: 11,    //30个格子的数据
        times: 12,  //一键完成的次数
        MAX: 13
    },
    eMineSweepField: {
        roleID: 'roleID',              //角色ID
        mineSweepID: 'mineSweepID',         //总关ID，对应MineSweepItemTemplate
        mineSweepLevelID: 'mineSweepLevelID',    //当前关ID，对应MineSweepLevelTemplate
        maxHp: 'maxHp',               //最大血�?
        currentHp: 'currentHp',           //当前血�?
        leftTimes: 'leftTimes',           //剩余次数
        leftReviveTimes: 'leftReviveTimes',//剩余复活次数
        cdTime: 'cdTime',              //冷却时间（秒�?
        baoXiang_ClearLevel: 'baoXiang_ClearLevel', //大关宝箱是否领取 0：未领取  1：已领取 （触发条件：通关�?
        baoXiang_KillAll: 'baoXiang_KillAll',    //小关宝箱是否领取 0：未领取  1：已领取 （触发条件：击杀本层所有怪物�?
        items: 'items',   //30个格子的数据
        times: 'times',
        id: 'id',             //扫雷物品ID，对应MineSweepItemTemplate
        state: 'state',          //当前状�?0:等待翻牌  1:等待击杀 2:等待开启（宝箱�?3:等待收取 4:已死�?
        attValue: 'attValue',       // +/- hp的数�?随机�?
        dropItemNum: 'dropItemNum',   // 掉落物品的数�?随机�?
        baoXiangItemID: 'baoXiangItemID',
        passCdTime: 'passCdTime',
        leftTimesNum: 1,
        state_0: 0,
        state_1: 1,
        state_2: 2,
        state_3: 3,
        state_4: 4
    },
    eClimbChartType: {
        friendChart: 1,     //好友排行�?
        singleZone: 2,     //单区排行�?
        MAX: 3
    },
    //环境变量
    eEnvName: 'env',
    eEnv: {
        LOGIN: 'logins',
        GAME: 'games',
        GLOBAL: 'global'
    },
    eRewardMisState: {  //悬赏任务状�?
        close: 0,     //未开�?
        open: 1,     //已开�?
        finish: 2,     //已完�?
        receive: 3      //已领�?
    },
    eRewardMisType: {   //悬赏任务小类�?
        SpecifyCus: 1,      //通关指定副本1�?
        Intensify: 2,      //任意装备强化1�?成功失败均计�?
        ZhanLi: 3,      //战力达到XXXXX
        OverCus: 4,      //闯关达到XX�?
        TakePvp: 5,      //参与对应副本战斗1次。（目前用斩魂副本）
        SemlSoul: 6       //任意邪神祭炼1�?
    },

    ePlayerEventType: {
        CollectFashionSuit: "collectFashionSuit",      // 收集时装碎片
        CollectTitle: "collectTitle",     // 收集号称碎片
        UP_LEVEL: 'up_level'    // 玩家登陆
    },
    eUnionInfo: {
        unionID: 0,         //公会ID
        unionName: 1,       //公会�?
        unionLevel: 2,      //公会等级
        unionZhanLi: 3,     //公会战力
        unionWeiWang: 4,    //公会威望
        memberNum: 5,       //公会成员数量
        announcement: 6,    //公会公告
        unionRanking: 7,    //公会排名
        bossID: 8,          //公会会长ID
        unionScore: 9,      //公会积分
        scoreRank: 10,      //积分排名
        ouccHel: 11,        //占领的炼狱关卡数
        isRegister: 12,    //是否报名夺城战
        isDuke: 13,        //是否是城主
        fightDamage: 14,   //夺城战造成的总伤害
        animalPowerful: 15,   //上周神兽的总战力
        MAX: 16
    },
    eUnionMemberInfo: {
        roleID: 0,         //角色ID
        unionID: 1,       //公会ID
        unionRole: 2,      //公会角色
        playerWeiWang: 3,     //玩家威望
        playerDevote: 4, //玩家贡献
        applyNum: 5,    //申请公会数量
        devoteInit: 6,    //贡献初始化状�?
        createTime: 7,    //加入公会时间
        logTime: 8,      // 看公会日志的时间
        MAX: 9
    },
    eOperateType: {     //运营活动类型
        AllRecharge: 0,         //累计充�?
        FirstRecharge: 1,       //首冲
        RewardScore: 2,         //抽奖积分
        UpLevel: 3,             //火速升�?
        UpZhanli: 4,            //战力飙升
        OpenSeven: 5,           //开�?�?
        MoneyDouble: 6,         //金币翻�?
        ExpDouble: 7,           //经验翻�?
        SoulDouble: 8           //魂魄翻�?
    },
    eOperateInfo: {     //玩家的运营数据信�?
        roleID: 0,          //角色ID
        tempID: 1,          //活动ID
        dataInfo: 2,        //详细信息
        Max: 3
    },
    eRoomMemberTlogInfo: {
        cheating: 'cheating',
        customID: 'customID',
        moneyGet: 'moneyGet',
        zuanshiGet: 'zuanshiGet',
        expGet: 'expGet',
        zuanshiCost: 'zuanshiCost',
        reliveNum: 'reliveNum',
        reliveCost: 'reliveCost',
        buyHpCount: 'buyHpCount',
        buyMpCount: 'buyMpCount'
    },

    eRedisClientType: {
        Chart: 0,       // 排行�?
        Max: 1       //
    },

    eAcrossApi: {
        REQUIRE_BLESSING: 'RequireBlessing',       // 跨服-请求祝福
        SEND_ACROSS_MAIL: 'sendAcrossMail',       // 跨服-发送邮�?
        FRIEND_PHYSICAL: 'FriendPhysical',         // 跨服-赠送友情点
        BLESSING: 'Blessing',                      // 跨服-好友祝福
        REBUILD_ROLE_DETAIL: 'rebuildRoleDetail'   // 跨服-回复好友数据
    },
    eUnionLogInfo: {
        unionID: 0,         //公会ID
        type: 1,            //日志类型
        roleID1: 2,         //角色ID1
        roleID2: 3,         //角色ID2
        roleName1: 4,       //角色name1
        roleName2: 5,       //角色name2
        createTime: 6,      //创建时间
        MAX: 7
    },


    eTitleInfo: {
        ROLEID: 0,     //玩家ID
        TITLEID: 1,     // 号称ID
        STATS: 2,     //时装状�?
        MAX: 3
    },
    eTitleStats: {
        NO: 0,     //未开�?
        OPEN: 1,     // 未激�?
        ACTIVATE: 2     //已激�?
    },

    // 下面为财产发生变化时的变化因�?
    // 如果有新的变化因素就在Add或Reduce里面新增�?
    // 如果是已有的就对号入座，注释括号里的是适用类别，现在分�?金币，钻石，其他资产 三类
    // 如果括号里没有当前类别的资产，就给加�?
    eAssetsChangeReason: {
        Add: {
            DefaultAdd: 0,                               //无产�?或缺省产�?(金币/钻石/资产)
            CreateRole: 1,                          //创号 (金币/钻石/资产)
            Alchemy: 2,                             //炼金 (金币)
            NormalCustom: 3,                        //普通副本产�?(金币/资产)
            ActivityCustom: 4,                      //活动副本产出 (金币/资产)
            ClimbCustom: 5,                         //万魔塔副本产�?(金币)
            Mine: 6,                                //魔域产出 (金币/钻石)
            RewardGift: 7,                          //悬赏礼包获得 (金币/钻石/资产)
            LoginGift: 8,                           //登陆礼包获得 (金币/钻石/资产)
            DailyGift: 9,                           //每日领取获得 (金币/钻石/资产)
            FirstRecharge: 10,                      //首充礼包获得 (金币/钻石/资产)
            ExpLvGift: 11,                          //等级礼包获得 (金币/钻石/资产)
            VipGift: 12,                            //vip礼包获得 (金币/钻石/资产)
            OtherGift: 13,                          //其他礼包获得 (金币/钻石/资产)
            NiuDan: 14,                             //抽奖获得 (金币/钻石)
            StarBox: 15,                            //星级宝箱获得 (金币/钻石/资产)
            OccupantReward: 16,                     //炼狱占领奖励获得 (金币/资产)
            Misson: 17,                             //任务产出 (钻石/资产)
            Recharge: 18,                           //充�?(钻石)
            ZuanshiShop: 19,                        //钻石商店 (资产)
            GoldShop: 20,                           //金币商店 (资产)
            FdPointShop: 21,                        //友情商店 (资产)
            VipShop: 22,                            //贵族商店 (资产)
            LingliShop: 23,                         //灵力商店 (资产)
            Synthesis: 24,                          //合成 (资产)
            HellCustom: 25,                         //炼狱副本产出 (资产)
            MultiCustom: 26,                        //多人副本产出 (资产)
            Decompose: 27,                          //分解 (资产)
            OtherCustom: 28,                        //其他副本产出(资产)
            CustomTurnOver: 29,                     //副本翻牌
            ActivityCustomTurnOver: 30,             //活动本翻�?
            HellCustomTurnOver: 31,                 //炼狱本翻�?
            HonorReward: 32,                        //荣誉排行榜发�?
            SweepCustom: 33,                        //剧情关扫�?
            Mail: 34,                               //邮件产出
            ZhanHunReward: 35,                      //斩魂奖励
            HellScoreBox: 36,                       //炼狱积分宝箱
            GiftCode: 37,                           //兑换码礼�?
            ZhanliChartReward: 38,                  //战力排行榜发�?
            AresMaxRank: 39,                        // 战神�?- 历史最高纪�?
            AresMedalExchange: 40,                  // 战神�?- 勋章兑换
            MagicOutput: 41,                        //求魔产出
            MonthCard: 42,                          //月卡领取产出
            SoulPvp: 43,                            //邪神竞技�?
            ActivityCustomSweep: 44,                 //活动关卡扫荡
            UnionTrain: 45,                          // 公会练功
            UnionHel: 46,                          // 公会炼狱
            AnimateGift: 47,                        // 活跃度礼�?
            ActivityExchange: 48,                     //活动兑换所�?
            LingshiUnload: 49,                        // 灵石摘除
            ExtraVipPoint: 50,                       //idip调整vip点数，仅限ios
            ActivityDrop: 51,                        //活动掉落
            UnionGift: 52,                            //公会其他玩家发的红包
            UnionDailyAward: 53,                        // 公会战每日收益
            ResetRune:54,                             //重置符文
            Advance:55,                              //新版活动
            JjcRankingReward: 56,                          //竞技场单区榜奖励

            JjcDayReward: 57,                              //竞技场每日奖励
            WeddingHongBaoReward: 58,                //领取结婚红包
            NpcCollectReward: 59,                    //斗兽场怪物图鉴解锁奖励
            ColiseumReward: 60,                    //斗兽场奖励
            SweetTrip: 61,                            //結婚关卡 甜蜜之旅奖励
            MarryChartReward: 62,                        //婚姻 姻緣值排行榜发奖
			PetResolve: 63                              //宠物分解
        },
        Reduce: {
            DefaultReduce: 10000,                        //无消�?或缺省消�?(金币/钻石/资产)
            BuySupplies: 10001,                     //药品购买 (金币)
            BuyLingshi: 10002,                      //灵石购买 (金币/钻石)
            BuyIntensifyStone: 10003,               //强化石购�?(金币/钻石)
            BuyPurpleStone: 10004,                  //紫色熔炼石购�?(金币/钻石)
            SkillLevelUp: 10005,                    //技能升�?(金币)
            SacrificeMagicSoul: 10006,              //魔灵祭练 (金币)
            ClimbFastCar: 10007,                    //爬塔快速闯�?(金币/钻石)
            CustomTurnOver: 10008,                  //副本翻牌 (金币/钻石)
            BuyHpInShop: 10009,                     //商店生命水购�?(钻石)
            BuyMpInShop: 10010,                     //商店魔法水购�?(钻石)
            BuySuperFruit: 10011,                   //购买神果 (钻石)
            BuySoul: 10012,                         //缺省魂购�?(钻石)
            BuyCrystal: 10013,                      //魔晶购买 (钻石)
            BuyOrangeStone: 10014,                  //橙色熔炼石购�?(钻石)
            NiuDanCost: 10015,                      //抽奖消�?(钻石/资产)
            Alchemy: 10016,                         //炼金 (钻石)
            BuyPhysical: 10017,                     //体力购买 (钻石)
            AllDailyMissonOver: 10018,              //一键完成日常任�?(钻石)
            CustomRelive: 10019,                    //副本复活 (钻石)
            BuyHpInCustom: 10020,                   //副本生命水购�?(钻石)
            BuyMpInCustom: 10021,                   //副本魔法水购�?(钻石)
            UnlockSoul2: 10022,                     //开启邪�? (钻石)
            UnlockSoul3: 10023,                     //开启邪�? (钻石)
            UnlockSoul4: 10024,                     //开启邪�? (钻石)
            UnlockSoul5: 10025,                     //开启邪�? (钻石)
            RefreshMine: 10026,                     //清魔域CD (钻石)
            BuyZhanHunAttackNum: 10027,             //购买斩魂次数 (钻石)
            ActivityCustomTurnOver: 10028,          //活动本翻�?(钻石)
            HellCustomTurnOver: 10029,              //炼狱本翻�?(钻石)
            ShopPurchase: 10030,                    //商店消费 (金币/钻石)
            SweepCustom: 10031,                     //剧情关扫�?
            Intensify: 10032,                       //装备强化
            MineReFullHp: 10033,                    //魔域补满HP
            AresVipShop: 10034,                     //战神�?vip 购买战斗次数
            BuyRune: 10035,                         //符文购买
            BuyFashionChip: 10036,                  //时装碎片购买
            BuyRunePoint: 10037,                    //符文技能点购买
            BuySoul1: 10038,                        // �?
            BuySoul2: 10039,                        // 1
            BuySoul3: 10040,                        // |
            BuySoul4: 10041,                        // 5
            BuySoul5: 10042,                        // 购买
            UseSoulNiudan: 10043,                   //抽取魂石
            UseEquipNiudan: 10044,                  //抽取橙装之石
            ShopTreasure: 10045,                    //商店宝箱购买
            AskMagic: 10046,                        //求魔消�?
            MagicOutput: 10047,                       //求魔产出(填错,无用)
            LuckSign: 10048,                           //转盘消耗幸运符
            SoulSuccinct: 10049,                       //血�?激活水�?(钻石)
            ActivateAtt: 10050,                         //血�?激活属�?(钻石)
            SuccinctAtt: 10051,                          //血�?洗练属�?(钻石/血�?
            SoulPvpVipShop: 10052,                     //邪神竞技�?vip 购买战斗次数 (钻石)
            SoulPvpClearCDTime: 10053,                     //邪神竞技�?清除战斗cd时间 (钻石)
            UnionGoods: 10054,                       //公会商城购买
            UnionMagicLearn: 10055,                       //公会技能学�?
            ActivitySweep: 10056,                        //历练扫荡
            TransferCareer: 10057,                       //转职
            ActivityExchange: 10058,                     // 活动兑换，原料消�?
            SysUnusual: 10059,                        //系统扣除玩家非法获得财产
            SendUnionGift: 10060,                       //发放公会红包
            LearnRune: 10061,                            //学习符文
            PetGradeUp: 10062,                      //宠物升品
            PetUnlockSkill: 10063,                  //宠物开启技能
            PetLevelUpSkill: 10064,                 //宠物升级技能
            FeedPet: 10065,                          //宠物喂食
            CreatePet: 10066,                       //宠物召唤
            Advance: 10067,                              //新版活动
            fashion: 10068,                   //限時時裝銷毀
			JjcShopTimes:10069,                              //竞技场战斗次数购买
            NpcCollectLevelUp:10070,                 // npc收集升级消耗
            RefreshNpc:10071,                 // 刷新NPC队列
            Divorce: 100072,                     //强制离婚
            ToMarry: 100073,                     //发起求婚时送的信物
            LoveGift:100074,                         //发送爱的礼物
            BuyEffectWedding:100075,                         //购买婚礼上的特效 （花瓣 烟花 桃心）
			Activation:10076,                 // 神装激活
            ArtifactLevelUp:10077,                 // 神装升级
            ArtifactRaiseStar:10078,                 // 神装升星
			FragExchange: 10079,                       //宠物万能碎片兑换
            AllKeyComplete: 10080                   //魔域 一键通关
        }
    },

    eExpChangeReason: {
        Default: 0,
        NormalCustom: 1,
        ActivityCustom: 2,
        HellCustom: 3,
        CustomSweep: 4,
        MissionComplete: 5,
        Flop: 6,
        ActivityCustomSweep: 7
    },

    eChartRewardInfo: {
        ROLE_ID: 0,     // 玩家id
        CHART_TYPE: 1,     // 排行榜类�?
        RANKING: 2,     // 排名
        REFRESH_TIME: 3, // 刷新时间
        ISBOSS: 4, // 是否是公会会�?
        MAX: 5      // 最大�?
    },
    eAcceptRewardInfo: {
        ROLE_ID: 0,     // 玩家id
        CHART_TYPE: 1,     // 排行榜类�?
        ACCEPT_TIME: 2,      // 领奖时间
        MAX: 3
    },
    eButtleType: {
        eDefense: 1,               //防御
        eCrit: 2,                  //暴击�?
        eCrit_Resistance: 3,       //暴击抵抗
        eCrit_Damage: 4,           //暴击伤害
        eDamageUpgrade: 5,         //总体伤害提升
        eDamageReduction: 6,       //总体伤害减免
        eAbnormalState: 7,         //异常状�?
        eCrit_Chance: 8            //暴击几率
    },
    eForbidChartType: { // 禁止排行榜类�?
        HELL: 1,        // 炼狱排行 (暂时不在这个机制中禁止，先占着一个枚举位)
        HONOR: 2,       // 荣誉�?
        ZHANLI: 3,      // 战力�?
        CLIMB: 4,       // 爬塔�?
        SOUL: 5,        // 邪神�?
        OP_ACT: 6,      // 运营活动�?多个)
        PET: 7,         // 宠物榜
        WORLDBOSS:8,    //世界boss
        MARRY:9,        //婚姻排行榜
		StoryScore : 10,  // 剧情炼狱
        ALL: 99          // 全部
    },

    /** 英雄�?*/
    eAresInfo: {
        ROLE_ID: 0,                //玩家ID
        RANK_KEY: 1,              // 玩家排名key (用做排名)
        MAX_RANK: 2,              // 历史最大排�?
        TYPE: 3,                     // 类型�?玩家�?机器人（假人�?
        BATTLE_TIMES: 4,      // 当日战斗次数
        LAST_BATTLE_TIME: 5,              //最后战斗时�?
        MEDAL: 6,                         //勋章
        TOTAL_MEDAL: 7,                     // 总共获得勋章�?
        SHOP_TIMES: 8,                    // vip购买次数
        LAST_SHOP_TIME: 9,                // 最后购买时�?
        OCCUPY_TIME: 10,               // 占领时间
        ROLE_NAME: 11,               // 角色名称
        MAX: 12
    },

    /**战神�?战斗日志*/
    eAresLogInfo: {
        ROLE_ID: 0,  // 玩家id
        TYPE: 1,     // 日志类型
        RIVAL_ID: 2,    //对手id
        RIVAL_NAME: 3,   //对手名字
        CONTEXT: 4,      //内容
        CREATE_TIME: 5,  // 日志创建时间
        CHANGE_RANK: 6,  // 玩家名次变化
        ZHANLI: 7,       // 战力
        MAX: 8
    },
    /** 玩家兑换*/
    eExchangeInfo: {
        ROLE_ID: 0,         // 玩家id
        EXCHANGE_ID: 1,     // 兑换ID
        TYPE: 2,            // 类型
        EXCHANGE_TIMES: 3,   //兑换次数
        LAST_EXCHANGE_TIME: 4,      //最后兑换时�?
        MAX: 5
    },

    ePetInfo: {
        roleID: 0,
        petID: 1,
        zhanli: 2,
        level: 3,
        exp: 4,
        grade: 5,
        skillList: 6,
        status: 7
    },

    ePetStatus: {
        rest: 0,        // 休息
        spirit_1: 1,    // 附身栏1
        spirit_2: 2,    // 附身栏2
        spirit_3: 3,    // 附身栏3
        spirit_4: 4,    // 附身栏4
        fight: 5        // 出战
    },

    /** 邪神竞技�?*/
    eSoulPvpInfo: {
        ROLE_ID: 0,                //玩家ID
        RANK_KEY: 1,              // 玩家排名key (用做排名)
        MAX_RANK: 2,              // 历史最大排�?
        TYPE: 3,                     // 类型�?玩家�?机器人（假人 暂未用）
        BATTLE_TIMES: 4,      // 当日战斗次数
        LAST_BATTLE_TIME: 5,              //最后战斗时�?
        MEDAL: 6,                         //勋章
        TOTAL_MEDAL: 7,                     // 总共获得勋章�?
        SHOP_TIMES: 8,                    // vip购买次数
        LAST_SHOP_TIME: 9,                // 最后购买时�?
        OCCUPY_TIME: 10,               // 占领时间
        ROLE_NAME: 11,               // 角色名称
        DEFENSE_1: 12,              //防御1号位
        DEFENSE_2: 13,              //防御2号位
        DEFENSE_3: 14,              //防御3号位
        ATTACK_1: 15,               //进攻1号位
        ATTACK_2: 16,               //进攻2号位
        ATTACK_3: 17,               //进攻3号位
        CD_TIME: 18,               //战斗cd 时间
        MAX: 19
    },

    /**邪神竞技�?战斗日志*/
    eSoulPvpLogInfo: {
        LOG_ID: 0,  // 日志id
        ROLE_ID: 1,  // 玩家id
        TYPE: 2,     // 日志类型
        RIVAL_ID: 3,    //对手id
        RIVAL_NAME: 4,   //对手名字
        CONTEXT: 5,      //内容
        CREATE_TIME: 6,  // 日志创建时间
        CHANGE_RANK: 7,  // 玩家名次变化
        ZHANLI: 8,       // 战力
        MAX: 9
    },
    /**邪神洗练*/
    eSuccinctInfo: {
        SOULID: 0,   //邪神ID
        SUCCINCTID: 1,   //水晶ID
        RoleID: 2,   // 角色ID
        STATE: 3,   //水晶状�? (1:开启，0:关闭)
        LEFT_ATTID_0: 4,   //属性模板id
        LEFT_ATTNUM_0: 5,   //属性数�?
        LEFT_ATTSTATE_0: 6,   //属性状�?
        LEFT_ATTID_1: 7,
        LEFT_ATTNUM_1: 8,
        LEFT_ATTSTATE_1: 9,
        LEFT_ATTID_2: 10,
        LEFT_ATTNUM_2: 11,
        LEFT_ATTSTATE_2: 12,
        RIGHT_ATTID_0: 13,   //属性id
        RIGHT_ATTNUM_0: 14,   //属性数�?
        RIGHT_ATTID_1: 15,
        RIGHT_ATTNUM_1: 16,
        RIGHT_ATTID_2: 17,
        RIGHT_ATTNUM_2: 18,
        Max: 19
    },
    eAttState: {
        NoActivate: 0,     //未激活状�?
        Lock: 1,     //加锁
        Open: 2         //开�?

    },
    eZhuanPanStatus: {
        zhuanPanStatusOpen: 0, //转盘开�?
        zhuanPanStatusClose: 1 //转盘未开�?
    },
    /**工会商城*/
    eUnionRoleShopInfo: {
        roleID: 0,         //角色ID
        unionGoodsID: 1,   //商店货物ID
        buyNum: 2,         //货物购买次数
        MAX: 3
    },
    eShareStatus: {
        noShare: 0, //未分享
        shareSuccess: 1  //成功分享
    },

    /**公会技�?*/
    eUnionMagicInfo: {
        unionID: 0,         //公会ID
        magicID: 1,         //技能ID
        magicLevel: 2,      //技能等�?
        MAX: 3
    },

    /**兑换活动*/
    eActivityExchangeConst: {
        unlimitType: 0,         //不限兑换次数
        dailyClearType: 1,      //每日重置兑换次数
        endClearType: 2         //活动结束清空兑换次数
    },

    /**公会神殿*/
    eUnionTempleInfo: {
        unionID: 0,                //公会ID
        templeLevel: 1,            //神殿等级
        templeExp: 2,              //神殿经验
        lady1ItemID: 3,
        lady1ItemNum: 4,
        lady1PopNum: 5,
        lady1PopDouble: 6,
        lady1Offers: 7,
        lady2ItemID: 8,
        lady2ItemNum: 9,
        lady2PopNum: 10,
        lady2PopDouble: 11,
        lady2Offers: 12,
        lady3ItemID: 13,
        lady3ItemNum: 14,
        lady3PopNum: 15,
        lady3PopDouble: 16,
        lady3Offers: 17,

        MAX: 18
    },
    /**角色敬供信息*/
    ePlayerOfferInfo: {
        roleID: 0,         //角色ID
        lady1Num: 1,       //女神1敬供次数
        lady2Num: 2,       //女神2敬供次数
        lady3Num: 3,       //女神3敬供次数
        MAX: 4
    },

    // 角色免费付费祭拜
    eRoleTempleInfo: {
        RoleID: 0,
        freeTimes: 1,       // 剩余次数
        buyTimes: 2,        // 购买次数
        cultureTimes: 3,    // 培养次数
        animalPrize: 4,     // 领取奖励
        Max: 5
    },

    // 角色免费付费祭拜
    eRoleStoryDrak: {
        RoleID: 0,
        atkTimes : 1,       // 攻击次数
        storyScore : 2,     // 历史最高分
        teamTimes : 3,      // 组队噩梦次数
        Max: 4
    },

    //新版活动数据
    eAdvanceInfo: {
        RoleID: 0,          // 玩家ID
        TempID: 1,          // 模板ID
        ReachStep: 2,       // 已达到的奖励阶段(该字段已作废)
        RewardStep: 3,      // 已领取的奖励阶段
        AdvancePoint: 4,   // 活动点数
        ConditionPoint: 5, // 条件点数点数
        EndTime: 6,        // 活动结束时间
        Max: 7
    },

    //新版活动类型
    eAdvanceType: {
        Advance_PlayerLevel: 1,    // 玩家等级
        Advance_AllLogin: 2,        // 累积登录
        Advance_RunningLogin: 3,   // 连续登录
        Advance_SigPower: 4,       // 单区战力榜排名
        Advance_VIPLevel: 5,        // vip等级
        Advance_PayDay: 6,          //每日充值数量 累计天数领取奖励
        Advance_PayOneMoney: 7,       //单日充值达到钻石数,每日清空钻石数从新计算
        Advance_PayMoreMoney: 8      //累计充值达到钻石数，不清空钻石数 累计计算
    },

    //新版活动类型
    eAdvanceCondition: {
        Condition_OncePay: 1,    // 一次性充值达到XXX钻石
        Condition_AllPay: 2         // 累计充值达到XXX钻石
    },

    // 公会神兽
    eUnionAnimal: {
        unionID: 0,        // 公会ID
        unionName: 1,      // 公会名称
        fixTempID: 2,      // 修正表ID
        currHPValue: 3,
        attkTimes: 4,
        defTimes: 5,
        hpTimes: 6,
        yuanbaoTimes: 7,
        skillNum: 8,
        isDefender: 9,     // 是否是防守神兽
        powerful: 10,      // 神兽战力
        MAX: 11
    },

    // 公会奖励类型
    eUnionAwardType: {
        afterOcc: 1,       // 占领后的奖励
        dailyAward: 2,     // 占领每日收益
        finalKilled: 3     // 击杀奖励
    },

    // 公会区间修正类型
    eUnionFixType: {
        fightTimes: 1,       // 每个人的战斗次数，区间为排名
        teamAdd: 2,          // 组队打神兽的伤害加成，区间为组队人数
        animalPower: 3       // 公会神兽强度，区间为服务器前100名玩家的平均战力
    },

    // 公会战成员伤害表
    eUnionMemFightDamage: {
        roleID: 0,         // 角色ID
        unionID: 1,        // 公会ID
        roleName: 2,      // 角色名称
        roleLevel: 3,     // 角色等级
        roleZhanli: 4,    // 角色战力
        fightDamage: 5,   // 夺城战造成的伤害
        attackTimes: 6,   // 攻击BOSS的次数
        MAX: 7
    },
    // 公会战公会伤害表
    eUnionDamageInfo: {
        unionID: 0,         // 公会ID
        unionName: 1,       // 公会名称
        unionLevel: 2,      // 公会等级
        fightDamage: 3,     // 夺城战总伤害
        animalPowerful: 4,  // 神兽战力
        MAX: 5
    },
    // QQ特权礼包
    eQQMemberGift: {
        accountID: 0,
        giftID: 1,
        serverUid: 2,
        status: 3,
        Max: 4
    },
    // 公会红包
    eUnionGift: {
        unionID: 0,         //公会ID
        roleID: 1,          //角色ID
        giftID: 2,          //礼包ID
        createTime: 3,      //操作时间
        openID: 4,
        picture: 5,         //微信头像
        name: 6,            //角色名称
        viplevel: 7,        //vip等级
        Max: 8
    },
    // 公会已领取红包
    eUnionReceiveGift: {
        roleID: 0,          //角色ID
        fromID: 1,          //发放者ID
        createTime: 2,      //操作时间
        Max: 3
    },
    //求婚信息
    eToMarryInfo: {
        roleID: 0,          //角色ID
        toMarryID: 1,          //求婚对象ID
        toMarryTime: 2,      //求婚时间
        state: 3,            //求婚状态   0未处理  1 同意  2 拒绝求婚  3 离婚信 4 同意离婚 5 拒绝离婚 6 亲密互动信
        xinWuID: 4,          //信物id
        readState: 5,        //读取状态
        marryID: 6,          //求婚信ID 每人独立自增
        Max: 7
    },
    //结婚信息
    eMarryInfo: {
        roleID: 0,          //角色ID
        toMarryID: 1,          //结婚对象ID
        marryTime: 2,      //结婚时间
        state: 3,            //结婚状态   1 结婚  2 离婚
        marryLevel: 4,          //婚礼等级id
        xinWuID:5,              //信物ID
        Max: 6
	},
    //爱的礼物
    eMarryGift: {
        roleID: 0,          //角色ID
        spouseID: 1,          //配偶ID
        flowers: 2,         //花束
        kiss: 3,            //吻
        gifts: 4,           //礼物
        giveKissNum: 5,     //当天已送出香吻次数  每天免费一次
        giveFlowerNum: 6,   //当天已送出花束次数  每天免费一次  付费3次
        giveGiftNum: 7,     //当天已送出礼物次数  每天限制总共购买次数6次
        yinYuanCount: 8,     //个人姻缘总值
        Max: 9
    },
    //宣言
    eXuanYan:{
        roleID: 0,          //角色ID
        xuanYan: 1,          //宣言
        Max:2
    },
    //结婚消息数量
    eMarryMsg:{
        roleID: 0,          //角色ID
        marryMsgNum: 1,          //消息数
        Max:2
    },
    //婚礼
    eWedding:{
        roleID: 0,          //角色ID
        toMarryID: 1,
        wedID: 2,           //婚礼ID 关联 weddingTime
        marryLevel: 3,      //婚礼等级
        bless: 4,            //寄语
        Max: 5
    },
    //婚姻日志
    eMarryLog:{
        roleID: 0,       //角色ID
        toMarryID: 1,       //对象ID
        logType: 2,         //log类型
        giftID: 3,          //爱的礼物id
        giveTime: 4,        //送出时间
        state: 5,           //已读状态 0 未读  1已读
        logID: 6,           //logID
        Max:7
    },
    eJJCInfo: {               // 玩家jjc 同步pvp信息
        ROLEID: 0,                // 玩家ID
        WINNUM: 1,            //连胜场次
        TOTALNUM: 2,                  //总战斗场次
        CREDIS: 3,                //积分
        MaxStreaking: 4,              //历史最高连胜
        Streaking: 5,                    //当前连胜
        JjcCoin: 6,                 //竞技币数量
        Ranking: 7,                   // 当前排名
        LastRanking: 8,               //单服榜排名_上届
        FriendRanking: 9,               //好友榜排名
        AcrossRanking: 10,               // 跨排行
        LastAccrossRanking: 11,               //跨服榜排名_上届
        DayChallengeTimes: 12,                //每日挑战次数
        RefreshChallengeTime: 13,              //刷新挑战时间
        LastRewardTime: 14,                   //最后单服奖励时间
        LastAcrossRewardTime: 15,             //最后跨服奖励时间
        LastDayRewardTime: 16,                  //每日奖励时间
        VipBugTimes: 17,             //vip购买次数
        LastvipBugTime: 18,      //上次vip购买时间
        Phase: 19,               //竞技场期数， 以月为单位
        MAX: 20


    },

    eRoundState: {
        Round: 0,       // 回合内
        Battle: 1       //战斗 pvp
    },

    eRoundType: {
        Practice: 0,       // 练习
        Battle: 1,       //战斗
        Across: 2,          //战斗
        Max: 3
    },

    eSideType: {
        Red: 0,       // 红
        Blue: 1       // 蓝
    },

    eRankingRewardType: {
        LOCAL: 0,       // 本服
        ACROSS: 1,       // 垮服
        DAY: 2           // 每日
    },

    eRedisClientType: {
        Chart: 0,       // 排行榜
        Max: 1       //
    },

    // 角色离开公会的时间
    eLeaveUnionCD: {
        roleID: 0,       // 角色ID
        leaveTime : 1,   // 离开时间
        MAX: 2
    },

    // 公会神兽培养日志表
    eCulture: {
        unionID: 0,         // 公会ID
        roleName: 1,        // 角色名称
        opType: 2,          // 操作类型
        opPara1: 3,         // 参数1
        opPara2: 4,         // 参数2
        createTime : 5,     // 操作时间

        MAX: 6
    },

	eColiseumInfo: {
        RoleID: 0,          // 玩家id
        Collect : 1        // 收集NPC列表
    }
   
};
