/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-31
 * Time: 下午3:34
 * To change this template use File | Settings | File Templates.
 */
module.exports = {
    tItem: {  //创建角色的模板
        attID: 'attID',//                    唯一ID
        itemName: 'itemName',//                 物品名称
        itemInstructions: 'itemInstructions',//         物品说明
        model: 'model',//                    模型
        icon: 'icon',//                     图标
        itemType: 'itemType',//                 物品大类型
        subType: 'subType',//                  物品小类型
        resolveID: 'resolveID',   //分解ID，对应ItemResolveTemplate
        otherID: 'otherID',	          //包含的其他物品ID
        otherNum: 'otherNum',	           //包含其他物品的数量
        equipType: 'equipType',//                装备位置
        useLevel: 'useLevel',//                 使用等级
        bindType: 'bindType',//                 绑定方式
        color: 'color',//                    品质
        buyValue: 'buyValue',//                 物品购买价格
        sellID: 'sellID',//                   出售的财产类型模板id
        sellValue: 'sellValue',//                物品出售价格
        isOverlay: 'isOverlay',//                是否可叠加
        baseZhanli: 'baseZhanli',//               基础战力值
        starNum: 'starNum',//                  镶嵌钻石孔的数量
        maxLevel: 'maxLevel',//                 强化最大等级
        stoneID: 'stoneID',//                  需要那种强化石
        levelID: 'levelID',//                  强化属性表ID
        baseAtt_0: 'baseAtt_0',//                基础属性id
        baseValue_0: 'baseValue_0',//              最大属性
        randomValue_0: 'randomValue_0',//            最小属性
        baseAtt_1: 'baseAtt_1',//                基础属性id
        baseValue_1: 'baseValue_1',//              最大属性
        randomValue_1: 'randomValue_1',//            最小属性
        baseAtt_2: 'baseAtt_2',//                基础属性id
        baseValue_2: 'baseValue_2',//              最大属性
        randomValue_2: 'randomValue_2',//            最小属性
        baseAtt_3: 'baseAtt_3',//                基础属性id
        baseValue_3: 'baseValue_3',//              最大属性
        randomValue_3: 'randomValue_3',//            最小属性
        addAtt_0: 'addAtt_0',//                 附加属性id
        baseAdd_0: 'baseAdd_0',//                最大属性
        randomAdd_0: 'randomAdd_0',//              最小属性
        addAtt_1: 'addAtt_1',//                 附加属性id
        baseAdd_1: 'baseAdd_1',//                最大属性
        randomAdd_1: 'randomAdd_1',//              最小属性
        addAtt_2: 'addAtt_2',//                 附加属性id
        baseAdd_2: 'baseAdd_2',//                最大属性
        randomAdd_2: 'randomAdd_2',//              最小属性
        addAtt_3: 'addAtt_3',//                 附加属性id
        baseAdd_3: 'baseAdd_3',//                最大属性
        randomAdd_3: 'randomAdd_3'//              最小属性
    },
    tItemResolve: {
        attID: 'attID',   //唯一ID
        baseOutputID_0: 'baseOutputID_0',      //基础产出物品ID
        baseOutputNum_0: 'baseOutputNum_0',     //基础产出物品数量
        baseOutputID_1: 'baseOutputID_1',      //基础产出物品ID
        baseOutputNum_1: 'baseOutputNum_1',     //基础产出物品数量
        starOutputID_0: 'starOutputID_0',
        starOutputPercent_0: 'starOutputPercent_0',
        starOutputNum_0: 'starOutputNum_0',
        starOutputID_1: 'starOutputID_1',              //星级产出物品
        starOutputPercent_1: 'starOutputPercent_1',         //星级产出物品
        starOutputNum_1: 'starOutputNum_1',             //星级产出物品
        starOutputID_2: 'starOutputID_2',
        starOutputPercent_2: 'starOutputPercent_2',
        starOutputNum_2: 'starOutputNum_2',
        starOutputID_3: 'starOutputID_3',
        starOutputPercent_3: 'starOutputPercent_3',
        starOutputNum_3: 'starOutputNum_3',
        starOutputID_4: 'starOutputID_4',
        starOutputPercent_4: 'starOutputPercent_4',
        starOutputNum_4: 'starOutputNum_4',
        enhanceOutputID_0: 'enhanceOutputID_0',   //强化产出物品ID
        enhanceOutputNum_0: 'enhanceOutputNum_0',  //强化产出物品数量
        enhanceOutputID_1: 'enhanceOutputID_1',
        enhanceOutputNum_1: 'enhanceOutputNum_1',
        enhanceOutputID_2: 'enhanceOutputID_2',
        enhanceOutputNum_2: 'enhanceOutputNum_2',
        enhanceOutputID_3: 'enhanceOutputID_3',
        enhanceOutputNum_3: 'enhanceOutputNum_3',
        enhanceOutputID_4: 'enhanceOutputID_4',
        enhanceOutputNum_4: 'enhanceOutputNum_4',
        enhanceOutputID_5: 'enhanceOutputID_5',
        enhanceOutputNum_5: 'enhanceOutputNum_5',
        enhanceOutputID_6: 'enhanceOutputID_6',
        enhanceOutputNum_6: 'enhanceOutputNum_6',
        enhanceOutputID_7: 'enhanceOutputID_7',
        enhanceOutputNum_7: 'enhanceOutputNum_7',
        enhanceOutputID_8: 'enhanceOutputID_8',
        enhanceOutputNum_8: 'enhanceOutputNum_8',
        enhanceOutputID_9: 'enhanceOutputID_9',
        enhanceOutputNum_9: 'enhanceOutputNum_9'
    },
    tSkill: {
        attID: 'attID',//                   唯一ID
        skillName: 'skillName',//               技能名称
        skillInstructions: 'skillInstructions',//       技能说明
        damageInstructions: 'damageInstructions',//      伤害说明
        skilResourcePath: 'skilResourcePath',//        技能路径
        skillMaxLevel: 'skillMaxLevel',//           技能最大等级
        skillLevel: 'skillLevel',//              技能等级
        skillCD: 'skillCD',//                 技能cd
        userTime: 'userTime',//                技能可以使用的时间
        skillSeries: 'skillSeries',//             技能系列
        consumeMP: 'consumeMP',//               使用时消耗的蓝量
        learnLevel: 'learnLevel',//              学习等级
        needSeries: 'needSeries',//              需要哪些技能系列这个技能才能学习
        consumeID_0: 'consumeID_0',//             学习消耗的财产类型
        consumeNum_0: 'consumeNum_0',//            消耗的数量
        consumeID_1: 'consumeID_1',//             学习消耗的财产类型
        consumeNum_1: 'consumeNum_1',//            消耗的数量
        frontSkill: 'frontSkill',//              前置技能
        behindSkill: 'behindSkill',//             后置技能
        buffID_0: 'buffID_0',//
        buffID_1: 'buffID_1',//
        buffID_2: 'buffID_2',//
        buffID_3: 'buffID_3',//
        playerType: 'playerType',//	技能目标0群攻1自己2单一对方
        isSkill: 'isSkill'      //0技能   1普攻 2其他

    },
    tSkillLearn: {
        attID: 'attID',//            唯一ID
        button: 'button',//           绑定按键0A1 1A2 2A3 3B1 4B2 5B3 6C1 7C2 8C3 9大A1 10大A2 11大A3 12大B1 13大B2 14大B3
        skillSeries: 'skillSeries',//      技能系列
        beginSKill: 'beginSKill',//       这个按键的起始ID
        profession: 'profession'//       职业
    },
    tRune: {
        attID: 'attID',
        SkillType: 'SkillType',
        branch: 'branch',
        branchNum: 'branchNum',
        frontRune: 'frontRune',
        openLevel: 'openLevel',
        skillPoint: 'skillPoint',
        runeID: 'runeID',
        runeNum: 'runeNum',
        zhanLi: 'zhanLi'
    },
    tRoleInit: {
        attID: 'attID',                                   //	唯一ID
        sex: 'sex',                                   //	角色性别
        profession: 'profession',                                   //	职业
        equip_0: 'equip_0',                                   //	赠送的装备
        equip_1: 'equip_1',                                   //	赠送的装备
        equip_2: 'equip_2',                                   //	赠送的装备
        equip_3: 'equip_3',                                   //	赠送的装备
        equip_4: 'equip_4',                                   //	赠送的装备
        equip_5: 'equip_5',                                   //	赠送的装备
        equip_6: 'equip_6',                                   //	赠送的装备
        item_0: 'item_0',                                   //	赠送的物品
        itemNum_0: 'itemNum_0',                                   //	赠送物品的数量
        item_1: 'item_1',                                   //	赠送的物品
        itemNum_1: 'itemNum_1',                                   //	赠送物品的数量
        item_2: 'item_2',                                   //	赠送的物品
        itemNum_2: 'itemNum_2',                                   //	赠送物品的数量
        item_3: 'item_3',                                   //	赠送的物品
        itemNum_3: 'itemNum_3',                                   //	赠送物品的数量
        item_4: 'item_4',                                   //	赠送的物品
        itemNum_4: 'itemNum_4',                                   //	赠送物品的数量
        skill_0: 'skill_0',                                   //	赠送的技能
        skill_1: 'skill_1',                                   //	赠送的技能
        skill_2: 'skill_2',                                   //	赠送的技能
        skill_3: 'skill_3',                                   //	赠送的技能
        skill_4: 'skill_4',                                   //	赠送的技能
        soul_0: 'soul_0',                                    //五个斗魂id
        soul_1: 'soul_1',
        soul_2: 'soul_2',
        soul_3: 'soul_3',
        soul_4: 'soul_4',
        soul_5: 'soul_5',
        mainMission: 'mainMission',                          //主线任务起始ID
        magicSoulID: 'magicSoulID'                          //魔灵起始ID


    },
    tAssets: {
        attID: 'attID',//           唯一ID
        assetsName: 'assetsName',//       财产名称
        model: 'model',//              掉落模型
        icon: 'icon',//                  图标
        type: 'type',//                  财产类型	0金币 1元宝 2技能点 3魂 4灵石 5灵纹 6血瓶 7蓝瓶 8强化石
        expLevel: 'expLevel',//              等级
        color: 'color',//                 品质	0白色1绿色2蓝色3紫色4橙色
        starLevel: 'starLevel',//             星级
        addSkill: 'addSkill',//              触发一个技能
        percent: 'percent'//               增加的属性百分比	100%填100
    },
    tCustom: {
        attID: 'attID',//   	唯一ID
        bigCustomID: 'bigCustomID',//	所属大关卡ID
        icon: 'icon',//     	图标	1 普通关卡  2 boss关卡
        attName: 'attName',//  	名字
        type: 'type',//	关卡类型 0：普通关 1：炼狱关 2：组队关 3：活动关
        instructions: 'instructions',//	关卡说明
        clearInstruct: 'clearInstruct',//	关卡完成说明（界面显示用）
        mapPath: 'mapPath',//	关卡资源路径
        dynamicLoadPath: 'dynamicLoadPath',//	动态加载的资源路径
        openCarbon: 'openCarbon',//	通过本关后开启的副本(开启的多人副本)
        customNum: 'customNum',//	关卡可以刷的次数	-1表示无限制
        expLevel: 'expLevel',//	进入等级
        maxLevel: 'maxLevel',//	进入最高等级
        soulLevel: 'soulLevel',//	进入，法宝要求等级
        vipLevel: 'vipLevel',//	vip等级
        zhanLi: 'zhanLi',//	推荐战力（非强制）
        npcListID: 'npcListID',//	关卡npc列表ID
        winMoney: 'winMoney',//	通关奖励金钱
        winExp: 'winExp',//	通关奖励经验
        lifeNum: 'lifeNum',// 	复活次数
        param_Time: 'param_Time',//	通关时间系数
        JiangLiIcon_0: 'JiangLiIcon_0',//	关卡奖励图标	值 1001 1002 1003 1004 1005
        JiangLiIcon_1: 'JiangLiIcon_1',//	关卡奖励图标	值 1001 1002 1003 1004 1005
        JiangLiIcon_2: 'JiangLiIcon_2',//	关卡奖励图标	值 1001 1002 1003 1004 1005
        JiangLiIcon_3: 'JiangLiIcon_3',//	关卡奖励图标	值 1001 1002 1003 1004 1005
        JiangLiIcon_4: 'JiangLiIcon_4',//	关卡奖励图标	值 1001 1002 1003 1004 1005
        trigQTETime: 'trigQTETime',//	触发QTE技能的时间	整形值
        pvx: 'pvx',//	战斗模式	0：PVE  1：PVP
        passCost: 'passCost',//	扫荡需要消耗的元宝数量
        trigStoryID: 'trigStoryID',//	关卡开始时触发的剧情ID
        prizeNum: 'prizeNum',//	总共有几个奖励（积分奖励）
        prizeID_0: 'prizeID_0',//	奖励ID
        prizeNum_0: 'prizeNum_0',//	奖励数量
        prizeID_1: 'prizeID_1',//
        prizeNum_1: 'prizeNum_1',//
        prizeID_2: 'prizeID_2',//
        prizeNum_2: 'prizeNum_2',//
        prizeID_3: 'prizeID_3',//
        prizeNum_3: 'prizeNum_3',//
        prizeID_4: 'prizeID_4',//
        prizeNum_4: 'prizeNum_4',//
        prizeID_5: 'prizeID_5',//
        prizeNum_5: 'prizeNum_5',//
        prizeID_6: 'prizeID_6',//
        prizeNum_6: 'prizeNum_6',//
        prizeID_7: 'prizeID_7',//
        prizeNum_7: 'prizeNum_7',//
        prizeID_8: 'prizeID_8',//
        prizeNum_8: 'prizeNum_8',//
        prizeID_9: 'prizeID_9',//
        prizeNum_9: 'prizeNum_9',//
        zhanNum: 'zhanNum',//	占领奖励数量
        zhanID_0: 'zhanID_0',//	物品iD
        zhanNum_0: 'zhanNum_0',//	物品数量
        zhanID_1: 'zhanID_1',//
        zhanNum_1: 'zhanNum_1',//
        zhanID_2: 'zhanID_2',//
        zhanNum_2: 'zhanNum_2',//
        zhanID_3: 'zhanID_3',//
        zhanNum_3: 'zhanNum_3',//
        zhanID_4: 'zhanID_4',//
        zhanNum_4: 'zhanNum_4',//
        physical: 'physical',    //进入关卡消耗的体力
        needLevel: 'needLevel',  //关卡准入等级
        FlopID: 'FlopID',    //翻牌表id
        smallType: 'smallType',  //关卡小类型
        dropGet: 'dropGet',      //失败后是否有获得  0无 1有
        vipPassCost_15: 'vipPassCost_15', //贵族15扫荡价格
        timeCd: 'timeCd',  //有无秒cd接口 0无 1有
        customSweep: 'customSweep',  //关卡能否扫荡 0无 1有
        soulMin: 'soulMin',     //关卡准入最低邪神星级
        soulMax: 'soulMax',      //关卡准入最高邪神星级
        yinYuanNum:'yinYuanNum' //姻缘值限制开启关卡

    },
    tCustomList: {
        attID: 'attID',//             唯一ID
        icon: 'icon',//              图标
        attName: 'attName',//           名字
        instructions: 'instructions',//      关卡说明

        customNum: 'customNum',//         关卡数量
        custom_0: 'custom_0',//          关卡ID
        custom_1: 'custom_1',//          关卡ID
        custom_2: 'custom_2',//          关卡ID
        custom_3: 'custom_3',//          关卡ID
        custom_4: 'custom_4',//          关卡ID
        custom_5: 'custom_5',//          关卡ID
        custom_6: 'custom_6',//          关卡ID
        custom_7: 'custom_7',//          关卡ID
        custom_8: 'custom_8',//          关卡ID
        custom_9: 'custom_9',//          关卡ID

        hellCustom_0: 'hellCustom_0',//      炼狱关卡ID
        hellCustom_1: 'hellCustom_1',//      炼狱关卡ID
        hellCustom_2: 'hellCustom_2',//      炼狱关卡ID
        hellCustom_3: 'hellCustom_3',//      炼狱关卡ID
        hellCustom_4: 'hellCustom_4',//      炼狱关卡ID
        hellCustom_5: 'hellCustom_5',//      炼狱关卡ID
        hellCustom_6: 'hellCustom_6',//      炼狱关卡ID
        hellCustom_7: 'hellCustom_7',//      炼狱关卡ID
        hellCustom_8: 'hellCustom_8',//      炼狱关卡ID
        hellCustom_9: 'hellCustom_9',//      炼狱关卡ID

        teamCustom: 'teamCustom',//        组队关卡ID

        giftNum: 'giftNum',//           礼包数量
        giftID_0: 'giftID_0',//          礼包数量
        giftID_1: 'giftID_1',//          礼包数量
        giftID_2: 'giftID_2',//          礼包数量
        giftID_3: 'giftID_3',//          礼包数量
        giftID_4: 'giftID_4'//          礼包数量

    },
    tAtt: {
        attID: 'attID',      //           唯一ID
        exp: 'exp',      //             升级所需经验
        att_0: 'att_0',      //           攻击力
        att_1: 'att_1',      //           防御值
        att_2: 'att_2',      //           当前Hp
        att_3: 'att_3',      //           当前Mp
        att_4: 'att_4',      //           最大Hp
        att_5: 'att_5',      //           最大Mp
        att_6: 'att_6',      //           暴击率
        att_7: 'att_7',      //           暴击伤害
        att_8: 'att_8',      //           伤害提升
        att_9: 'att_9',      //           昏迷
        att_10: 'att_10',      //          后仰
        att_11: 'att_11',      //          Hp回复速率
        att_12: 'att_12',      //          Mp回复速率
        att_13: 'att_13',      //          暴击抵抗
        att_14: 'att_14',      //          暴击伤害减免
        att_15: 'att_15',      //          伤害减免
        att_16: 'att_16',      //          昏迷抵抗
        att_17: 'att_17',      //           后仰抵抗
        att_18: 'att_18',      //           浮空抵抗
        att_19: 'att_19',      //           击退抵抗
        att_20: 'att_20',      //           昏迷几率
        att_21: 'att_21',      //           后仰几率
        att_22: 'att_22',      //           浮空几率
        att_23: 'att_23',      //           击退几率
        maxAnger: 'maxAnger',  //            最大怒气值
        maxPhysical: 'maxPhysical',  //最大体力值
        addPhysical: 'addPhysical',  //升级增加的体力值
        totalExp: 'totalExp'        //总经验
    },
    tSoul: {
        attID: 'attID',//          唯一ID
        icon: 'icon',//           图标
        attName: 'attName',//        名字
        instructions: 'instructions',//   法宝说明
        changePath: 'changePath',//     变身路径
        guaDian: 'guaDian',//        挂点
        maxLevel: 'maxLevel',//       最大星级
        evolutionmaxLevel: 'evolutionmaxLevel', // 进阶后的最大星级
        openLevel: 'openLevel',//      开启下一个魂的星级
        openID: 'openID',//      开启下一个魂的ID
        openCustomID: 'openCustomID',    // 试炼关卡ID
        openCost: 'openCost',          //	元宝开启价格
        openRequireVip: 'openRequireVip',    // 元宝开启时需求的VIP等级
        soulType: 'soulType',//       魂类型
        initLevel: 'initLevel',//      初始星级
        att_0: 'att_0',//          不同星级的属性
        att_1: 'att_1',//
        att_2: 'att_2',//
        att_3: 'att_3',//
        att_4: 'att_4',//
        att_5: 'att_5',//
        att_6: 'att_6',//
        att_7: 'att_7',//
        att_8: 'att_8',//
        att_9: 'att_9',//
        att_10: 'att_10',//
        att_11: 'att_11',//
        att_12: 'att_12',//
        att_13: 'att_13',//
        att_14: 'att_14',//
        att_15: 'att_15',//
        att_16: 'att_16',//
        att_17: 'att_17',//
        att_18: 'att_18',//
        att_19: 'att_19',//
        buffID_1: 'buffID_1',
        buffID_2: 'buffID_2',
        buffID_3: 'buffID_3',
        soulSkill_1: 'soulSkill_1', //技能1
        openStar_1: 'openStar_1',   //开启星级1
        SkillCost_1: 'SkillCost_1', //类型1
        costNum_1: 'costNum_1',     //数量1
        soulSkill_2: 'soulSkill_2',
        openStar_2: 'openStar_2',
        SkillCost_2: 'SkillCost_2',
        costNum_2: 'costNum_2',
        soulSkill_3: 'soulSkill_3',
        openStar_3: 'openStar_3',
        SkillCost_3: 'SkillCost_3',
        costNum_3: 'costNum_3',
        succinctID_0: 'succinctID_0', //每个邪神对应的水晶1
        succinctID_1: 'succinctID_1', //每个邪神对应的水晶2
        succinctID_2: 'succinctID_2',
        succinctID_3: 'succinctID_3',
        succinctID_4: 'succinctID_4',
        evolutionTitle: 'evolutionTitle',        //进阶属性说明
        evolutionConsume: 'evolutionConsume',   //进阶消耗的魂数量
        evolutionID: 'evolutionID',               //进阶消耗的碎片ID
        evolutionNum: 'evolutionNum',             //进阶消耗的碎片数量
        evolutionCustomID: 'evolutionCustomID', //进阶试练关卡id
        wakeID_0: 'wakeID_0',                      //觉醒ID0-9
        wakeID_1: 'wakeID_1',
        wakeID_2: 'wakeID_2',
        wakeID_3: 'wakeID_3',
        wakeID_4: 'wakeID_4',
        wakeID_5: 'wakeID_5',
        wakeID_6: 'wakeID_6',
        wakeID_7: 'wakeID_7',
        wakeID_8: 'wakeID_8',
        wakeID_9: 'wakeID_9'
    },
    tSoulInfo: {
        attID: 'attID',//         唯一ID
        icon: 'icon',//          图标
        instructions: 'instructions',//  星级说明
        soulPath: 'soulPath',//      法宝资源路径
        skillID: 'skillID',//       该等级增加的技能
        stillTime: 'stillTime',//     持续时间
        attributeBuff: 'attributeBuff',  //变身后的属性buff
        skillBuff: 'skillBuff',          //变身后的光环buff
        upLevel_Zhan: 'upLevel_Zhan',    //升星所需战力
        upLevelMoney: 'upLevelMoney',//       升星消耗元宝
        upLevel: 'upLevel',//       升星消耗
        comSoulID: 'comSoulID',//     炼魂消耗魂ID
        comSoulNum: 'comSoulNum',//    消耗的数量
        comMoneyID: 'comMoneyID',//    消耗元宝ID
        comMoneyNum: 'comMoneyNum',//   消耗的数量
        maxSoulNum: 'maxSoulNum',//    魂的最大储量
        upAdd_Zhan: 'upAdd_Zhan',    //升星后增加的战力
        att_0: 'att_0',//           增加的属性ID
        maxAttNum_0: 'maxAttNum_0',//     最大值
        upAddNum_0: 'upAddNum_0',//      升星后增加的值
        doubleNum_0: 'doubleNum_0',//     增加多少倍
        att_1: 'att_1',//           增加的属性ID
        maxAttNum_1: 'maxAttNum_1',//     最大值
        upAddNum_1: 'upAddNum_1',//      升星后增加的值
        doubleNum_1: 'doubleNum_1',//     增加多少倍
        att_2: 'att_2',//           增加的属性ID
        maxAttNum_2: 'maxAttNum_2',//     最大值
        upAddNum_2: 'upAddNum_2',//      升星后增加的值
        doubleNum_2: 'doubleNum_2',//     增加多少倍
        minAttRandom: 'minAttRandom',//    随机增加属性的最小值
        maxAttRandom: 'maxAttRandom',//    随机增加属性的最大值
        moneyAttAdd: 'moneyAttAdd',  //     元宝增加的基础值
        probability: 'probability'  // 升星的基础几率
    },
    tSoulWake: {
        attID: "attID",				// 唯一ID
        consumeSoul: "consumeSoul",	// 消耗魂数量
        assetsID: "assetsID",       // 消耗财产ID
        assetsNum: "assetsNum",     // 消耗财产数量
        soulLevel: "soulLevel", 	    // 需求邪神星级
        attNum: "attNum",			    // 增加的属性数量
        att_0: "att_0",				// 属性ID
        attVal_0: "attVal_0",		// 增加的属性值
        attPer_0: "attPer_0",		// 增加的属性百分比
        att_1: "att_0",				// 属性ID
        attVal_1: "attVal_0",		// 增加的属性值
        attPer_1: "attPer_0",		// 增加的属性百分比
        att_2: "att_0",				// 属性ID
        attVal_2: "attVal_0",		// 增加的属性值
        attPer_2: "attPer_0",		// 增加的属性百分比
        att_3: "att_0",				// 属性ID
        attVal_3: "attVal_0",		// 增加的属性值
        attPer_3: "attPer_0",		// 增加的属性百分比
        att_4: "att_0",				// 属性ID
        attVal_4: "attVal_0",		// 增加的属性值
        attPer_4: "attPer_0",		// 增加的属性百分比
        mergeTimeAdd: "mergeTimeAdd", // 增加的变身时间
        skillID: "skillID",			// 修改哪个技能
        skillPath: "skillID",		// 修改后的技能路径
        zhanli: "zhanli",           // 增加战力
        skillCD: "skillCD"
    },
    tIntensify: {
        attID: 'attID',//     唯一ID
        addNum: 'addNum',//    总共增加多少属性
        needMoney: 'needMoney',//    需要消耗多少金币
        attID_0: 'attID_0',//   属性ID
        attNum_0: 'attNum_0',//  增加的属性值
        attID_1: 'attID_1',//   属性ID
        attNum_1: 'attNum_1',//  增加的属性值
        attID_2: 'attID_2',//   属性ID
        attNum_2: 'attNum_2',//  增加的属性值
        attID_3: 'attID_3',//   属性ID
        attNum_3: 'attNum_3',//  增加的属性值
        attID_4: 'attID_4',//   属性ID
        attNum_4: 'attNum_4', //  增加的属性值
        intrnsifyNum: 'intrnsifyNum'    //需要强化石的数量
    },
    tSynthesize: {
        attID: 'attID',//                            唯一ID，和财产ID相同
        type: 'type',//                                 生成物品种类 0资产 1装备
        tabNum: 'tabNum',//                        客户端显示页数用
        needMoney: 'needMoney',//                       需要消耗多少金币
        needNum: 'needNum',//                      需要消耗多少
        createNum: 'createNum',//                        生成几种可能的物品
        needID_0: 'needID_0',//                     需要消耗的物品ID
        needNum_0: 'needNum_0',//                        需要消耗的物品数量
        needID_1: 'needID_1',//                     需要消耗的物品ID
        needNum_1: 'needNum_1',//                        需要消耗的物品数量
        needID_2: 'needID_2',//                     需要消耗的物品ID
        needNum_2: 'needNum_2',//                        需要消耗的物品数量
        needID_3: 'needID_3',//                     需要消耗的物品ID
        needNum_3: 'needNum_3',//                        需要消耗的物品数量
        needID_4: 'needID_4',//                     需要消耗的物品ID
        needNum_4: 'needNum_4',//                        需要消耗的物品数量
        assetsID_0: 'assetsID_0',//                   生成的物品ID
        assetsNum_0: 'assetsNum_0',//                      生成的数量
        percent_0: 'percent_0',//                    生成概率
        assetsID_1: 'assetsID_1',//                       生成的物品ID
        assetsNum_1: 'assetsNum_1',//                  生成的数量
        percent_1: 'percent_1',//                        生成概率
        assetsID_2: 'assetsID_2',//                   生成的物品ID
        assetsNum_2: 'assetsNum_2',//                      生成的数量
        percent_2: 'percent_2',//                    生成概率
        assetsID_3: 'assetsID_3',//                       生成的物品ID
        assetsNum_3: 'assetsNum_3',//                  生成的数量
        percent_3: 'percent_3',//                        生成概率
        assetsID_4: 'assetsID_4',//                   生成的物品ID
        assetsNum_4: 'assetsNum_4',//                      生成的数量
        percent_4: 'percent_4'//                    生成概率
    },
    tActivity: {
        attID: 'attID',//                          活动唯一ID
        name: 'name',//                           活动名称
        miaoshu: 'miaoshu',//                        活动描述
        typeExplain: 'typeExplain',//                    类型说明
        endExplain: 'endExplain',//                     完成说明
        winExplain: 'winExplain',//                     奖励说明
        expLevel: 'expLevel',//                       需要等级
        activityType: 'activityType',//                   活动类型1副本2转蛋鸡
        isOpen: 'isOpen',//                         是否开启 0没有开启 1开启中
        numType: 'numType',//                        开启类型1一次性开启 2重复开启
        openType: 'openType',//                       1时间段开启，2一整天，3一段时间
        weektime: 'weektime',//                       0123456
        openTime: 'openTime',//                       开启时间 2013-09-13 12:00
        endTime: 'endTime',//                        结束时间 2013-09-15 12:00
        activityNum: 'activityNum',//                    活动数量
        activity_0: 'activity_0',//                     具体活动ID
        activity_1: 'activity_1',//                     具体活动ID
        activity_2: 'activity_2',//                     具体活动ID
        activity_3: 'activity_3',//                     具体活动ID
        activity_4: 'activity_4',//                     具体活动ID
        activity_5: 'activity_5',//                     具体活动ID
        activity_6: 'activity_6',//                     具体活动ID
        activity_7: 'activity_7',//                     具体活动ID
        activity_8: 'activity_8',//                     具体活动ID
        activity_9: 'activity_9',//                     具体活动ID
        activity_10: 'activity_10',//
        activity_11: 'activity_11',//
        activity_12: 'activity_12',//
        activity_13: 'activity_13',//
        activity_14: 'activity_14',//
        activity_15: 'activity_15',//
        activity_16: 'activity_16',//
        activity_17: 'activity_17',//
        activity_18: 'activity_18',//
        activity_19: 'activity_19',//
        activity_20: 'activity_20',//
        activity_21: 'activity_21',//
        activity_22: 'activity_22',//
        activity_23: 'activity_23',//
        activity_24: 'activity_24',//
        activity_25: 'activity_25',//
        activity_26: 'activity_26',//
        activity_27: 'activity_27',//
        activity_28: 'activity_28',//
        activity_29: 'activity_29',//
        activity_30: 'activity_30',//
        activity_31: 'activity_31',//
        activity_32: 'activity_32',//
        activity_33: 'activity_33',//
        activity_34: 'activity_34',//
        activity_35: 'activity_35',//
        activity_36: 'activity_36',//
        activity_37: 'activity_37',//
        activity_38: 'activity_38',//
        activity_39: 'activity_39',//
        activity_40: 'activity_40',//
        activity_41: 'activity_41',//
        activity_42: 'activity_42',//
        activity_43: 'activity_43',//
        activity_44: 'activity_44',//
        activity_45: 'activity_45',//
        activity_46: 'activity_46',//
        activity_47: 'activity_47',//
        activity_48: 'activity_48',//
        activity_49: 'activity_49',//
        activity_50: 'activity_50',//
        activity_51: 'activity_51',//
        activity_52: 'activity_52',//
        activity_53: 'activity_53',//
        activity_54: 'activity_54',//
        activity_55: 'activity_55',//
        activity_56: 'activity_56',//
        activity_57: 'activity_57',//
        activity_58: 'activity_58',//
        activity_59: 'activity_59',//
        activity_60: 'activity_60',//
        activity_61: 'activity_61',//
        activity_62: 'activity_62',//
        activity_63: 'activity_63',//
        activity_64: 'activity_64',//
        activity_65: 'activity_65',//
        activity_66: 'activity_66',//
        activity_67: 'activity_67',//
        activity_68: 'activity_68',//
        activity_69: 'activity_69',//
        activity_70: 'activity_70',//
        activity_71: 'activity_71',//
        activity_72: 'activity_72',//
        activity_73: 'activity_73',//
        activity_74: 'activity_74',//
        activity_75: 'activity_75',//
        activity_76: 'activity_76',//
        activity_77: 'activity_77',//
        activity_78: 'activity_78',//
        activity_79: 'activity_79',//
        activity_80: 'activity_80',//
        activity_81: 'activity_81',//
        activity_82: 'activity_82',//
        activity_83: 'activity_83',//
        activity_84: 'activity_84',//
        activity_85: 'activity_85',//
        activity_86: 'activity_86',//
        activity_87: 'activity_87',//
        activity_88: 'activity_88',//
        activity_89: 'activity_89',//
        activity_90: 'activity_90',//
        activity_91: 'activity_91',//
        activity_92: 'activity_92',//
        activity_93: 'activity_93',//
        activity_94: 'activity_94',//
        activity_95: 'activity_95',//
        activity_96: 'activity_96',//
        activity_97: 'activity_97',//
        activity_98: 'activity_98',//
        activity_99: 'activity_99'//
    },
    tPvPExchange: {
        exchangeID: 'exchangeID',    // 唯一ID
        lingli: 'lingli',    // 消耗的灵力数量
        itemID: 'itemID',    // 兑换的物品类型
        itemNum: 'itemNum',    // 兑换的物品数量
        honor: 'honor',    // 兑换的物品类型
        buyMax: 'buyMax'    // 兑换的物品类型
    },
    tBuff: {
        attID: 'attID',//                     唯一ID
        buffResourcePath: 'buffResourcePath',//          buff资源路径
        buffLevel: 'buffLevel',//                 buff的等级
        isLife: 'isLife',//	是否是一直存在的
        duration: 'duration',//                  持续时间
        playerType: 'playerType',// 	目标类型	0自己 1对方
        beginAction: 'beginAction',//               添加buff马上触发的行为
        stillTime: 'stillTime',//                 持续中每次触发的时间间隔
        stillAction: 'stillAction',//               持续过程中触发的行为
        endAction: 'endAction',//                 buff结束后触发的行为
        damagePercent: 'damagePercent', //伤害百分比
        damageAdd: 'damageAdd'      //伤害加成
    },
    tBuffAction: {
        attID: 'attID',//             唯一ID
        actType: 'actType',//           行为类型
        playerType: 'playerType',//        以谁的的数值计算
        attType: 'numAttType',//        属性类型
        changeNum: 'changeNum',//      改变的数值(数值)
        change: 'change'//         改变的数值（百分比）
    },
    tGoods: {
        attID: 'attID',//           唯一ID
        itemID: 'itemID',//            包含的物品
        itemNum: 'itemNum',  //
        moneyID: 'moneyID',//         货币类型
        moneyNum: 'moneyNum',//        货币数量
        oldMoneyNum: 'oldMoneyNum',//     原来货币价格
        buyNum: 'buyNum',//          可购买数量 -1为无限制
        weekTime: 'weekTime',//        周显示 格式为0123456
        beginTime: 'beginTime',//       开启购买时间 格式为0000-00-00 00:00:00
        endTime: 'endTime',//         结束购买时间 格式为0000-00-00 00:00:00
        goodSell: 'goodSell',//         出售类型
        saleWeekTime: 'saleWeekTime',//       折扣商品： 周显示 格式为0123456
        saleBeginTime: 'saleBeginTime',//     折扣商品：  开启购买时间 格式为0000-00-00 00:00:00
        saleEndTime: 'saleEndTime',//       折扣商品：  结束购买时间 格式为0000-00-00 00:00:00
        vipLevel: 'vipLevel',//        需要vip达到的等级
        addNumForVipLevel: 'addNumForVipLevel',//增加购买次数的vip等级
        serverNum: 'serverNum', //是否是全服限次商品
        giftItemNum: 'giftItemNum',  // 0 普通物品，大于0 为商城热更礼包
        giftItemID_0: ' giftItemID_0',
        giftItemNum_0: 'giftItemNum_0',
        giftItemID_1: 'giftItemID_1',
        giftItemNum_1: 'giftItemNum_1',
        giftItemID_2: 'giftItemID_2',
        giftItemNum_2: 'giftItemNum_2',
        giftItemID_3: 'giftItemID_3',
        giftItemNum_3: 'giftItemNum_3',
        giftItemID_4: 'giftItemID_4',
        giftItemNum_4: 'giftItemNum_4',
        giftItemNum: 'giftItemNum',//giftItemNum>0 客户端显示所有itemID相关信息走下边
        itemIDName: 'itemIDName',
        itemIDColor: 'itemIDColor',
        itemIDIcon: 'itemIDIcon',
        itemIDitemType: 'itemIDitemType',
        itemIDuseLevel: 'itemIDuseLevel'

    },
    tShop: {
        attID: 'attID',//          唯一ID
        goodsType: 'goodsType',//      商品种类 0热门 1装备 2友情 3杂货 4vip
        goodsNum: 'goodsNum'//      商品数量
    },
    tNotice: {
        attID: 'attID',  //唯一ID
        noticeBeginStr: 'noticeBeginStr',   //名称前字符串
        noticeEndStr: 'noticeEndStr'        //名称后字符串
    },
    tAchieve: {
        attID: 'attID',                 //唯一ID
        name: 'name',                   //成就名称
        content: 'content',             //成就内容
        prizeID_0: 'prizeID_0',        //奖励ID
        prizeNum_0: 'prizeNum_0',     //奖励数量
        prizeID_1: 'prizeID_1',
        prizeNum_1: 'prizeNum_1',
        AchieveType: 'AchieveType',  //成就类型
        overNum: 'overNum',              //数量
        nextID: 'nextID',             //下一个的模版ID
        bigID: 'bigID',              //关卡的章节ID
        customID: 'customID'        //关卡的ID
    },
    tMagicSoul: {
        attID: 'attID',//          唯一ID
        jieLevel: 'jieLevel',//
        pinLevel: 'pinLevel',//
        color: 'color',//
        guaJianPath: 'guaJianPath',// 挂件资源路径
        guaDian: 'guaDian',// 挂件挂点
        modelsPath: 'modelsPath',// 模型资源路径
        material: 'material',// 材质资源路径
        upAdd_Zhan: 'upAdd_Zhan',// 需要增加假战力数量
        attName: 'attName',// 名字
        nextOpenID: 'nextOpenID',// 下一品ID
        magicCrysta: 'magicCrysta',// 突破到下一级需要魔晶数量
        maxSkillLevel: 'maxSkillLevel',// 允许技能开启最大等级
        openSkillID: 'openSkillID',// 开启的技能id
        level: 'level',// 开启需要等级
        att_0: 'att_0',// 品下各等级表ID
        att_1: 'att_1',// 品下各等级表ID
        att_2: 'att_2',// 品下各等级表ID
        att_3: 'att_3',// 品下各等级表ID
        att_4: 'att_4',// 品下各等级表ID
        att_5: 'att_5',// 品下各等级表ID
        att_6: 'att_6',// 品下各等级表ID
        att_7: 'att_7',// 品下各等级表ID
        att_8: 'att_8',// 品下各等级表ID
        att_9: 'att_9'// 品下各等级表ID
    },
    tMagicSoulInfo: {
        attID: 'attID',//          唯一ID
        level: 'level',// 当前等级
        nextOpenID: 'nextOpenID',// 下一级
        zhanLi: 'zhanLi',// 属性附加战力
        comGoldNum: 'comGoldNum',// 祭炼消耗金币数量
        comMoneyNum: 'comMoneyNum',// 强力祭炼消耗元宝数量
        maxExperienceNum: 'maxExperienceNum',// 升级需要经验点数
        magicSoulID: 'magicSoulID',// 所属大表ID
        att_0: 'att_0',// 增加的属性ID
        AttNum_0: 'AttNum_0',// 增加到数量
        att_1: 'att_1',// 增加的属性ID
        AttNum_1: 'AttNum_1',// 增加到数量
        att_2: 'att_2',// 增加的属性ID
        AttNum_2: 'AttNum_2',// 增加到数量
        att_3: 'att_3',// 增加的属性ID
        AttNum_3: 'AttNum_3',// 增加到数量
        att_4: 'att_4',// 增加的属性ID
        AttNum_4: 'AttNum_4',// 增加到数量
        att_5: 'att_5',// 增加的属性ID
        AttNum_5: 'AttNum_5',// 增加到数量
        att_6: 'att_6',// 增加的属性ID
        AttNum_6: 'AttNum_6',// 增加到数量
        att_7: 'att_7',// 增加的属性ID
        AttNum_7: 'AttNum_7'// 增加到数量
    },
    tMagicSoulSkill: {
        attID: 'attID',//          唯一ID
        arrayID: 'arrayID',//     技能顺序
        magicFruitNum: 'magicFruitNum',// 升到下一级技能需要神果数量
        nextattID: 'nextattID',// 下一级技能ID
        icon: 'icon',//
        name: 'name',// 技能名称
        level: 'level',// 技能等级
        describe: 'describe',// 本级技能描述
        maxNum: 'maxNum',// 增加属性数量
        att_0: 'att_0',// 增加的属性ID
        AttNum_0: 'AttNum_0',// 增加到数量
        att_1: 'att_1',// 增加的属性ID
        AttNum_1: 'AttNum_1',// 增加到数量
        att_2: 'att_2',// 增加的属性ID
        AttNum_2: 'AttNum_2',// 增加到数量
        att_3: 'att_3',// 增加的属性ID
        AttNum_3: 'AttNum_3',// 增加到数量
        att_4: 'att_4',// 增加的属性ID
        AttNum_5: 'AttNum_5',// 增加到数量
        att_6: 'att_6',// 增加的属性ID
        AttNum_7: 'AttNum_7,',// 增加到数量
        att_8: 'att_8',// 增加的属性ID
        AttNum_8: 'AttNum_8',// 增加到数量
        att_9: 'att_9',// 增加的属性ID
        AttNum_9: 'AttNum_9',// 增加到数量
        att_10: 'att_0',// 增加的属性ID
        AttNum_10: 'AttNum_10',// 增加到数量
        att_11: 'att_11',// 增加的属性ID
        AttNum_11: 'AttNum_11',// 增加到数量
        att_12: 'att_12',// 增加的属性ID
        AttNum_12: 'AttNum_12'// 增加到数量
    },
    tVipTemp: {
        attID: 'attID',
        needVipPoint: 'needVipPoint',
        Gift: 'Gift',
        buyPhysicalNum: 'buyPhysicalNum',//old
        alchemyNum: 'alchemyNum',//old
        freeSweep: 'freeSweep',//new
        unlockYuanBaoSweep: 'unlockYuanBaoSweep',//new
        freeWarReliveNum: 'freeWarReliveNum',//new
        takeBlueBloodNum: 'takeBlueBloodNum',//new
        copyDiedReliveNum: 'copyDiedReliveNum',//new
        needSweep: 'needSweep', //old
        misVipNeed: 'misVipNeed',//new
        buyPVPNum: 'buyPVPNum', //old
        flopNum: 'flopNum', //new
        flopNum_1: 'flopNum_1', //new
        flopNum_2: 'flopNum_2', //new
        openBuySkillPoint: 'openBuySkillPoint',//new
        sweepGetTakeCardReward: 'sweepGetTakeCardReward',//new
        receivePhysicalNum: 'receivePhysicalNum', //old
        PVPGetLingLiAdd: 'PVPGetLingLiAdd',
        strengthenSuccessRate: 'strengthenSuccessRate',
        alchemyBaoLv: 'alchemyBaoLv',
        PVPBlessedNum: 'PVPBlessedNum',
        alchemyBaoJi: 'alchemyBaoJi',
        initDailyClimb: 'initDailyClimb',
        givePhysicalNum: 'givePhysicalNum',//?????????????
        openResolve: 'openResolve'  //扫荡自动分解

        ///////////////////////////////////////////////////////  TODO
        //Gift: 'Gift'
        // misVipNeed: 'misVipNeed',
        //  alchemyNum: 'alchemyNum',
        // alchemyBaoJi: 'alchemyBaoJi',

        // flopNum: 'flopNum',
        // needSweep: 'needSweep'
    },
    tPhysical: {
        attID: 'attID',         //与vip等级对应=101+vip
        receiveNum: 'receiveNum',   //好友赠送体力值
        friendShip: 'friendShip',   //每次赠送好友所获得的友情点
        time: 'time',                   //体力恢复时间（秒）
        num: 'num',            //一次购买所获得的体力
        buyNum_0: 'buyNum_0',   //第一次购买价格
        buyNum_1: 'buyNum_1',
        buyNum_2: 'buyNum_2',
        buyNum_3: 'buyNum_3',
        buyNum_4: 'buyNum_4',
        buyNum_5: 'buyNum_5',
        buyNum_6: 'buyNum_6',
        buyNum_7: 'buyNum_7',
        buyNum_8: 'buyNum_8',
        buyNum_9: 'buyNum_9'    //第十次购买价格，超过次数使用此价格
    },
    tPhysicalGift: {
        attID: 'attID',         // 假如跟等级关联的话，填等级, 不关联的话填1
        phy_Num: 'phy_Num',     // 一共多少个时间段赠送
        phy_StartTime_0: 'phy_StartTime_0',
        phy_EndTime_0: 'phy_EndTime_0',
        phy_Num_0: 'phy_Num_0',
        phy_StartTime_1: 'phy_StartTime_1',
        phy_EndTime_1: 'phy_EndTime_1',
        phy_Num_1: 'phy_Num_1',
        phy_StartTime_2: 'phy_StartTime_2',
        phy_EndTime_2: 'phy_EndTime_2',
        phy_Num_2: 'phy_Num_2',
        phy_StartTime_3: 'phy_StartTime_3',
        phy_EndTime_3: 'phy_EndTime_3',
        phy_Num_3: 'phy_Num_3',
        phy_StartTime_4: 'phy_StartTime_4',
        phy_EndTime_4: 'phy_EndTime_4',
        phy_Num_4: 'phy_Num_4',
        phy_StartTime_5: 'phy_StartTime_5',
        phy_EndTime_5: 'phy_EndTime_5',
        phy_Num_5: 'phy_Num_5'
    },
    tMissions: {    //最新任务模版
        attID: 'attID',                 //唯一ID
        name: 'name',                   //任务名称
        content: 'content',             //任务内容
        bigType: 'bigType',             //任务大类型  0主线任务，1日常任务，2支线任务,3 帐号任务
        isUpdate: 'isUpdate',           //是否24点刷新   0 不刷新， >0 代表刷新且各个数字为单独一组,每组任务每天只出现一个
        oneKeyCusNum: 'oneKeyCusNum',   //一键完成花费的财产数量
        oneKeyCusID: 'oneKeyCusID',     //一键完成花费的财产ID
        startCon: 'startCon',           //触发条件    0 等级触发 1任务触发 2首个由等级后任务 3等级任务双条件触发
        conNum: 'conNum',               //前置条件的数量(当startCon为1时生效)
        nextID: 'nextID',               //下一个任务ID
        lowLevel: 'lowLevel',           //触发任务的最低等级
        highLevel: 'highLevel',         //触发任务的最高等级
        bigJumpType: 'bigJumpType',
        smallJumpType: 'smallJumpType',
        misType: 'misType',             //任务具体类型
        bigID: 'bigID',
        overNum: 'overNum',             //需要完成条件的数量
        needIDNum: 'needIDNum',         //条件的总数量
        needID_0: 'needID_0',           //所需条件的ID   后续会到needID_9
        prizeNum: 'prizeNum',           //奖励物品或财产的总数
        prizeID_0: 'prizeID_0',         //奖励物品ID    后续会到prizeID_9
        prizeNum_0: 'prizeNum_0',       //对应物品的奖励数量  后续会到prizeNum_9
        nextMisNum: 'nextMisNum',       //后继任务的数量, 只有主线任务会用到
        nextMisID_0: 'nextMisID_0',     //后继任务ID， 后续会到nextMisID_9
        nextTeamIDNum: 'nextTeamIDNum', //后续任务组ID的数量
        nextTeamID_0: 'nextTeamID_0',    //后续任务组ID，后续会到nextTeamID_4
        unionLevel: 'unionLevel'
    },
    tAlchemy: {
        attID: 'attID',//               唯一ID:等级
        MaxNum_0: 'MaxNum_0', //         前多少次用以下钻石数
        goldNum_0: 'goldNum_0', //       基础获得金币数
        zuanShi_0: 'zuanShi_0', //         花费钻石
        MaxNum_1: 'MaxNum_1', //         前多少次用以下钻石数
        goldNum_1: 'goldNum_1', //       基础获得金币数
        zuanShi_1: 'zuanShi_1', //         花费钻石
        MaxNum_2: 'MaxNum_2', //         前多少次用以下钻石数
        goldNum_2: 'goldNum_2', //       基础获得金币数
        zuanShi_2: 'zuanShi_2', //         花费钻石
        MaxNum_3: 'MaxNum_3', //         前多少次用以下钻石数
        goldNum_3: 'goldNum_3', //       基础获得金币数
        zuanShi_3: 'zuanShi_3', //         花费钻石
        MaxNum_4: 'MaxNum_4', //         前多少次用以下钻石数
        goldNum_4: 'goldNum_4', //       基础获得金币数
        zuanShi_4: 'zuanShi_4', //         花费钻石
        MaxNum_5: 'MaxNum_5', //         前多少次用以下钻石数
        goldNum_5: 'goldNum_5', //       基础获得金币数
        zuanShi_5: 'zuanShi_5', //         花费钻石
        MaxNum_6: 'MaxNum_6', //         前多少次用以下钻石数
        goldNum_6: 'goldNum_6', //       基础获得金币数
        zuanShi_6: 'zuanShi_6', //         花费钻石
        MaxNum_7: 'MaxNum_7', //         前多少次用以下钻石数
        goldNum_7: 'goldNum_7', //       基础获得金币数
        zuanShi_7: 'zuanShi_7', //         花费钻石
        MaxNum_8: 'MaxNum_8', //         前多少次用以下钻石数
        goldNum_8: 'goldNum_8', //       基础获得金币数
        zuanShi_8: 'zuanShi_8', //         花费钻石
        MaxNum_9: 'MaxNum_9', //         前多少次用以下钻石数
        goldNum_9: 'goldNum_9', //       基础获得金币数
        zuanShi_9: 'zuanShi_9', //         花费钻石
        MaxNum_10: 'MaxNum_10', //         前多少次用以下钻石数
        goldNum_10: 'goldNum_10', //       基础获得金币数
        zuanShi_10: 'zuanShi_10' //         花费钻石


    },
    tMineSweep: {
        attID: 'attID',	                //唯一ID
        attName: 'attName',             //显示的名字（难度）
        icon: 'icon',	                //图标ID
        firstLevelID: 'firstLevelID',	//首关ID，对应MineSweepLevelTemplate
        limitExpLevel: 'limitExpLevel', //	最低进入等级
        levelNum: 'levelNum',           //	总的层数
        baoXiangID: 'baoXiangID',	    //通关后可开启的宝箱ID
        resetZuanShi: 'resetZuanShi',   //重置所需钻石数量
        resumeZuanShi: 'resumeZuanShi'	//恢复满HP所需钻石数量
    },
    tMineSweepLevel: {
        attID: 'attID',	                //唯一ID
        levelIndex: 'levelIndex',	    //层数（第几层），从1开始
        cdTime: 'cdTime',                //	冷却时间，时间到后可以进入下一关
        costZuanShi: 'costZuanShi',	    //清楚冷却时间所需的钻石数量
        baoXiangID: 'baoXiangID',	    //全部击杀怪物后可开启的宝箱
        nextID: 'nextID',                //下一层ID，对应 MineSweepLevelTemplate
        itemID_0: 'itemID_0', 	        //格子内物品id，对应MineSweepItemTemplate
        itemNum_0: 'itemNum_0',	        //该物品出现的数量
        itemID_1: 'itemID_1',
        itemNum_1: 'itemNum_1',
        itemID_2: 'itemID_2',
        itemNum_2: 'itemNum_2',
        itemID_3: 'itemID_3',
        itemNum_3: 'itemNum_3',
        itemID_4: 'itemID_4',
        itemNum_4: 'itemNum_4',
        itemID_5: 'itemID_5',
        itemNum_5: 'itemNum_5',
        itemID_6: 'itemID_6',
        itemNum_6: 'itemNum_6',
        itemID_7: 'itemID_7',
        itemNum_7: 'itemNum_7',
        itemID_8: 'itemID_8',
        itemNum_8: 'itemNum_8',
        itemID_9: 'itemID_9',
        itemNum_9: 'itemNum_9'
    },
    tMineSweepItem: {
        attID: 'attID',          	        //唯一ID
        type: 'type',                        //0普通（金币，装备，魂等） 1宝箱（开启宝箱可随机获得物品） 2加血npc 3扣血npc 4boss（击杀后开启下一关）
        attValue_Min: 'attValue_Min',	    //type为2 3 4 时作为加血、扣血的数值下限
        attValue_Max: 'attValue_Max',	    //type为2 3 4 时作为加血、扣血的数值上限
        dropItemID: 'dropItemID',	        //掉落的物品id
        dropItemNum_Min: 'dropItemNum_Min',	//掉落物品数量下限
        dropItemNum_Max: 'dropItemNum_Max'	//掉落物品数量上限
    },
    tOperateActivity: {
        attID: 'attID',
        activeType: 'activeType',           //活动类型
        multiple: 'multiple',               //倍数(当为金币、经验、魂魄翻倍是生效，其余情况填0),整数
        startType: 'startType',             //开始类型 0：绝对时间  1：循环时间(周几)
        aheadTime: 'aheadTime',             //预显示时间: -1 表示不预显示， >0 预显示秒数
        startDateTime: 'startDateTime',     //开始日期时间
        endDateTime: 'endDateTime',         //结束日期时间
        day: 'day',                         //周几
        startTime: 'startTime',             //开始时间
        relayTime: 'relayTime',             //持续时间
        isUpdate: 'isUpdate',               //是否热更新
        contentNum: 'contentNum',           //内容数量
        content_0: 'content_0',             //内容
        contentType_0: 'contentType_0',     //内容类型(0:文本 1:图片)
        field: 'field',                     //排行榜数据所在字段
        operateMail: 'operateMail'          //(包括邮件内容及物品奖励)
    },
    tOperateType:{
        OPERATE_TYPE_0: 0,                 //累计充值
        OPERATE_TYPE_1: 1,                 //首冲
        OPERATE_TYPE_2: 2,                 //抽奖积分
        OPERATE_TYPE_3: 3,                 //火速升级
        OPERATE_TYPE_4: 4,                 //战力飙升
        OPERATE_TYPE_5: 5,                 //充值榜送礼
        OPERATE_TYPE_6: 6,                 //金币双倍
        OPERATE_TYPE_7: 7,                 //经验双倍
        OPERATE_TYPE_8: 8,                 //魂魄双倍
        OPERATE_TYPE_9: 9,                 //累积消费钻石
        OPERATE_TYPE_10: 10,               //消耗体力
        OPERATE_TYPE_11: 11,                //宝箱排行榜
        OPERATE_TYPE_20: 20                //活动掉落

    },
    tOperateMailContent:{
        subject: 'subject',                 //运营活动邮件标题
        content: 'content',                 //运营活动邮件内容
        content1: 'content1',               //运营活动邮件内容，现在用于充值排行榜，返回钻石邮件
        rewards: 'rewards',                 //运营活动邮件奖励物品
        gt:'gt',                            //判断条件，大于等于
        lt:'lt',                            //判断条件，小于等于
        items:'items',                      //物品列表，格式：[[1004,200000],[1005,150000]]
        var0:'%var0',                       //邮件内容中需要替换的第一个字符串
        var1:'%var1',                        //邮件内容中需要替换的第二个字符串
        re:'re'                             //充值排行榜，反钻比例
    },
    tUnionLeve: {
        attID: 'attID',	                            //公会等级ID 1001对应一级 后两位对应公会等级 id写死
        level: 'level',                              //公会等级
        description: 'description',	                //公会描述字典ID
        upNeedNum: 'upNeedNum',	                    //升到该级需要公会威望数量,初始的一级用为创建公会花费钻石数量
        maxRoleNum: 'maxRoleNum',                    //人数限制
        nextID: 'nextID'	                            //下一级等级ID，最高级填0
    },
    tWxShare: {
        attID: 'attID',
        extinfo: 'extinfo',
        title: 'title',
        description: 'description',
        thumb_media_id: 'thumb_media_id'
    },

    tExchange: {
        exchangeId: 'exchangeID',    // 唯一ID
        type: 'type',    // 唯一ID
        itemId: 'itemID',    // 兑换的物品类型
        itemCount: 'itemNum',    // 兑换的物品数量
        rank: 'rank',            //排名限制
        assetsID: 'assetsID',    // 消耗财产类型
        number: 'number',    // 消耗财产数量
        buyMax: 'buyMax'    // 兑换的物品类型
    },

    tMagicOutput: {
        petIndex: 'petIndex', //宠物所在下标
        consumeID: 'consumeID', //点击求魔需消耗的物品ID
        consumeNum: 'consumeNum', //点击求魔需消耗的数量
        backPercent: 'backPercent', //后退概率
        remainPercent: 'remainPercent', //留在原处概率
        forwardPercent: 'forwardPercent', //前进概率
        stockNum: 'stockNum', //库数量
        stockID_1: 'stockID_1', //库1ID
        stockPercent_1: 'stockPercent_1', //库1概率
        stockID_2: 'stockID_2',
        stockPercent_2: 'stockPercent_2',
        stockID_3: 'stockID_3',
        stockPercent_3: 'stockPercent_3',
        stockID_4: 'stockID_4',
        stockPercent_4: 'stockPercent_4',
        stockID_5: 'stockID_5',
        stockPercent_5: 'stockPercent_5',
        stockID_6: 'stockID_6',
        stockPercent_6: 'stockPercent_6',
        stockID_7: 'stockID_7',
        stockPercent_7: 'stockPercent_7',
        stockID_8: 'stockID_8',
        stockPercent_8: 'stockPercent_8',
        stockID_9: 'stockID_9',
        stockPercent_9: 'stockPercent_9',
        stockID_10: 'stockID_10',
        stockPercent_10: 'stockPercent_10'
    },

    tStockItems: {
        stockID: 'stockID', //出库的ID
        goodTypes: 'goodTypes',//库所包含的物品种类
        itemID_1: 'itemID_1', //物品1的ID
        num_1: 'num_1', //物品1的数量
        weight_1: 'weight_1',//物品1的权重
        itemID_2: 'itemID_2',
        num_2: 'num_2',
        weight_2: 'weight_2',
        itemID_3: 'itemID_3',
        num_3: 'num_3',
        weight_3: 'weight_3',
        itemID_4: 'itemID_4',
        num_4: 'num_4',
        weight_4: 'weight_4',
        itemID_5: 'itemID_5',
        num_5: 'num_5',
        weight_5: 'weight_5',
        itemID_6: 'itemID_6',
        num_6: 'num_6',
        weight_6: 'weight_6',
        itemID_7: 'itemID_7',
        num_7: 'num_7',
        weight_7: 'weight_7',
        itemID_8: 'itemID_8',
        num_8: 'num_8',
        weight_8: 'weight_8',
        itemID_9: 'itemID_9',
        num_9: 'num_9',
        weight_9: 'weight_9',
        itemID_10: 'itemID_10',
        num_10: 'num_10',
        weight_10: 'weight_10'
    },

    tSuccinctInfo: {
        attID: 'attID', //水晶tempID
        openLevel: 'openLevel', //开启水晶所需等级
        openConsumeID_0: 'openConsumeID_0', //开启水晶所需财产1
        openConsumeNum_0: 'openConsumeNum_0', //开启水晶所需财产数量1
        openConsumeID_1: 'openConsumeID_1', //开启水晶所需财产1
        openConsumeNum_1: 'openConsumeNum_1',
        name: 'name',
        icon: 'icon',
        openAtt_ConsumeNum_0: 'openAtt_ConsumeNum_0',  //激活属性所需财产
        openAtt_ConsumeNum_1: 'openAtt_ConsumeNum_1', //激活属性所需财产数量
        upConsumeID: 'upConsumeID', //洗练属性所需财产
        upConsumeNum: 'upConsumeNum', //洗练属性所需财产数量
        lockConsumeNum_0: 'lockConsumeNum_0', //锁1个 增加的消耗
        lockConsumeNum_1: 'lockConsumeNum_1', //锁2个 增加的消耗
        attNum: 'attNum', //产生属性的种类数量
        attTempID_0: 'attTempID_0',
        attTempID_1: 'attTempID_1',
        attTempID_2: 'attTempID_2',
        attTempID_3: 'attTempID_3',
        attTempID_4: 'attTempID_4',
        attTempID_5: 'attTempID_5',
        attTempID_6: 'attTempID_6',
        attTempID_7: 'attTempID_7',
        attTempID_8: 'attTempID_8',
        attTempID_9: 'attTempID_9'
    },

    tAttTempInfo: {
        attID: 'attID', // 属性ID
        attType: 'attType', //属性类型
        attNum_0: 'attNum_0', //属性数量
        min_0: 'min_0', //最小值
        max_0: 'max_0', //最大值
        attNum_1: 'attNum_1',
        min_1: 'min_1',
        max_1: 'max_1',
        attNum_2: 'attNum_2',
        min_2: 'min_2',
        max_2: 'max_2',
        attNum_3: 'attNum_3',
        min_3: 'min_3',
        max_3: 'max_3',
        attNum_4: 'attNum_4',
        min_4: 'min_4',
        max_4: 'max_4',
        attZhanLi_0: 'attZhanLi_0',
        attZhanLi_1: 'attZhanLi_1',
        attZhanLi_2: 'attZhanLi_2',
        attZhanLi_3: 'attZhanLi_3',
        attZhanLi_4: 'attZhanLi_4'
    }
    ,
    tZhuanPan: {
        attID: 'attID',
        rate: 'rate',
        yuanBaoNum: 'yuanBaoNum',
        assetsID: 'assetsID',
        assetsNum: 'assetsNum'
    }
    ,
    tUnionShop: {
        attID: 'attID',	//唯一ID
        itemID: 'itemID',//	货物ID
        itemNum: 'itemNum', //	数量
        buyNum: 'buyNum', //	可购买次数 -1为无限制,如没有出售，请填成0
        buyUnionLevel: 'buyUnionLevel',  //	购买需要达到的工会等级
        showUnionLevel: 'showUnionLevel',//	显示需要达到的工会等级
        consumeID1: 'consumeID1',      // 购买所需财产ID1
        consumeNum1: 'consumeNum1',      // 购买所需财产数量1
        consumeID2: 'consumeID2',      // 购买所需财产ID2
        consumeNum2: 'consumeNum2'      // 购买所需财产数量2
    },
    tActivityDrop: {
        attID: "attID",
        activityID: "activityID",
        attIDNums: "attIDNums",
        isNpc: "isNpc",
        customTypes: "customTypes",
        customIDs: "customIDs",
        startDateTime: "startDateTime",
        endDateTime: "endDateTime",
        dropType: "dropType",
        dropNum: "dropNum"
    },
    tChestsActivity: {
        attID: 'attID',
        name: 'name',//名称
        instructions: 'instructions',//描述
        openID: 'openID',//开启消耗财产ID
        openNum: 'openNum',//开启一次消耗数量
        startTime: 'startTime',//活动开启时间(格式2015-05-18 18:00:00)
        endTime: 'endTime',	//活动结束时间(该值活动上线后不能变更)(格式2015-05-18 18:00:00)
        endTimeDesc:'endTimeDesc',
        modelPath:'modelPath', //未开启宝箱模型路径（各自使用自己宝箱路径）
        openModelPath: 'openModelPath',//对应的模型路径
        gainPoint:'gainPoint',//开启获得积分
        showNum: 'showNum',	//展示数量
        showID1: 'showID1',//	查看物品财产ID1
        showID2: 'showID2',
        showID3: 'showID3',
        showID4: 'showID4',
        showID5: 'showID5',
        showID6: 'showID6',
        showID7: 'showID7',
        showID8: 'showID8',
        showID9: 'showID9',
        showID10: 'showID10',

        prideNum: 'prideNum',//奖励数量
        prideID_1: 'prideID_1',//物品id
        prideNum_1: 'prideNum_1',//	物品数量
        weight_1: 'weight_1',//	权重
        sign_1: 'sign_1',//标记：0无标记，1大奖
        prideID_2: 'prideID_2',//物品id
        prideNum_2: 'prideNum_2',//	物品数量
        weight_2: 'weight_2',//	权重
        sign_2: 'sign_2',//标记：0无标记，1大奖

        prideID_3: 'prideID_3',//物品id
        prideNum_3: 'prideNum_3',//	物品数量
        weight_3: 'weight_3',//	权重
        sign_3: 'sign_3',//标记：0无标记，1大奖
        prideID_4: 'prideID_4',//物品id
        prideNum_4: 'prideNum_4',//	物品数量
        weight_4: 'weight_4',//	权重
        sign_4: 'sign_4',//标记：0无标记，1大奖

        prideID_5: 'prideID_5',//物品id
        prideNum_5: 'prideNum_5',//	物品数量
        weight_5: 'weight_5',//	权重
        sign_5: 'sign_5',//标记：0无标记，1大奖
        prideID_6: 'prideID_6',//物品id
        prideNum_6: 'prideNum_6',//	物品数量
        weight_6: 'weight_6',//	权重
        sign_6: 'sign_6',//标记：0无标记，1大奖

        prideID_7: 'prideID_7',//物品id
        prideNum_7: 'prideNum_7',//	物品数量
        weight_7: 'weight_7',//	权重
        sign_7: 'sign_7',//标记：0无标记，1大奖
        prideID_8: 'prideID_8',//物品id
        prideNum_8: 'prideNum_8',//	物品数量
        weight_8: 'weight_8',//	权重
        sign_8: 'sign_8',//标记：0无标记，1大奖

        prideID_9: 'prideID_9',//物品id
        prideNum_9: 'prideNum_9',//	物品数量
        weight_9: 'weight_9',//	权重
        sign_9: 'sign_9',//标记：0无标记，1大奖
        prideID_10: 'prideID_10',//物品id
        prideNum_10: 'prideNum_10',//	物品数量
        weight_10: 'weight_10',//	权重
        sign_10: 'sign_10',//标记：0无标记，1大奖

        prideID_11: 'prideID_11',//物品id
        prideNum_11: 'prideNum_11',//	物品数量
        weight_11: 'weight_11',//	权重
        sign_11: 'sign_11',//标记：0无标记，1大奖
        prideID_12: 'prideID_12',//物品id
        prideNum_12: 'prideNum_12',//	物品数量
        weight_12: 'weight_12',//	权重
        sign_12: 'sign_12'//标记：0无标记，1大奖
    },
    tBossOpenList: {
        attID: 'attID',
        beginTime: 'beginTime',//开启时间
        delayTime: 'delayTime',//持续时间
        description: 'description'//时间描述 //客户端显示
    },
    tBossReward: {
        attID:'attID',
        minRank:'minRank',
        maxRank:'maxRank',
        nextID:'nextID',
        
        prizeNum:'prizeNum',
        prizeID_0:'prizeID_0',
        prizeNum_0:'prizeNum_0',
        prizeID_1:'prizeID_1',
        prizeNum_1:'prizeNum_1',
        prizeID_2:'prizeID_2',
        prizeNum_2:'prizeNum_2',
        prizeID_3:'prizeID_3',
        prizeNum_3:'prizeNum_3',
        prizeID_4:'prizeID_4',
        prizeNum_4:'prizeNum_4',
        prizeID_5:'prizeID_5',
        prizeNum_5:'prizeNum_5',
        prizeID_6:'prizeID_6',
        prizeNum_6:'prizeNum_6',
        prizeID_7:'prizeID_7',
        prizeNum_7:'prizeNum_7',
        prizeID_8:'prizeID_8',
        prizeNum_8:'prizeNum_8',
        prizeID_9:'prizeID_9',
        prizeNum_9:'prizeNum_9',
        prizeID_10:'prizeID_10',
        prizeNum_10:'prizeNum_10',
        prizeID_11:'prizeID_11',
        prizeNum_11:'prizeNum_11',
        prizeID_12:'prizeID_12',
        prizeNum_12:'prizeNum_12'
    },
    tWorldBoss: {
        attID: 'attID',
        name: 'name',//boss名称
        instructions: 'instructions',	//boss描述
        iconID: 'iconID',	//贴图ID
        customID: 'customID',	//开启关卡id（除攻防血，其他都以关卡表为准）
        weight: 'weight'	//权重
    },
    tWorldBossNpc: {
        attID:'attID',
        rankLow:'rankLow',
        rankHigh:'rankHigh',
        att_0:'att_0',	//攻击力
        att_1:'att_1',	//防御值
        att_4:'att_4',	//最大Hp
        att_8:'att_8',	//伤害提升
        att_15:'att_15' 	//伤害减免

    },
    tWeddingTime:{
        weddingID:'weddingID',
        beginTime:'beginTime',
        longTime:'longTime',
        weddingNum:'weddingNum'
    },
    tWeddingLevel:{
        "marryLevel" : "marryLevel",
        "marryID" : "marryID",
        "marryDescID" : "marryDescID" ,
        "marryType" : "marryType",
        "marryLevel" : "marryLevel",
        "giftNum" : "giftNum" ,
        "assesID" : "assesID",
        "assesIcon": "assesIcon",
        "giftMin" : "giftMin",
        "giftMax" : "giftMax",
        "giftThreshold" : "giftThreshold",
        "open1Path" : "open1Path",
        "open1Price" : "open1Price",
        "open1Type" : "open1Type",
        "open2Path" : "open2Path",
        "open2Price" : "open2Price",
        "open2Type" : "open2Type",
        "open3Path" : "open3Path",
        "open3Price" : "open3Price",
        "open3Type" : "open3Type",
        "reward" : "reward",
        "marryMoneyType" : "marryMoneyType" ,
        "marryMoney" : "marryMoney"
    },
    tToken:{
        "xinWuID" : "xinWuID",
        "xinWuNameID" : "xinWuNameID",
        "xinWuDescID" : "xinWuDescID",
        "xinWuNum" : "xinWuNum",
        "xinWuColor" : "xinWuColor",
        "effectID" : "effectID",
        "path" : "path",
        "priceTypeID" : "priceTypeID",
        "xinWuPrice" : "xinWuPrice"
    },
    tLocalize:{
        "attID" : "attID",
        "description" : "description"
    },
    tMarryGift:{
        "giftID" : "giftID",
        "giftNameID" : "giftNameID" ,
        "giftDescID" : "giftDescID" ,
        "freeNum" : "freeNum",
        "giveCount" : "giveCount",
        "giveNum" : "giveNum",
        "yinYuan" : "yinYuan",
        "suiPianNum" : "suiPianNum" ,
        "assesID" : "assesID" ,
        "moneyNum" :"moneyNum"
    }

};

