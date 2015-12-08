# Message Protocol

## CS Message
* [cs.pvpHandler.RequireRival](#cs.pvpHandler.RequireRival)

* cs.pvpHandler.RequireRival
* cs.pvpHandler.RequirePrice

request

<pre>
{rivals: [
    {
        "roleID": 30002212,
        "name": "呼延垣",
        "level": 30,
        "zhanli": 1330,
        "APvPAttackNum": 0,
        "APvPAttackedNum": 0,
        "resourceGet": 0,
        "resourceLoss": 0,
        "equips": [100101, 110101, 120101, 130101, 140101, 150101, 160101],
        "souls": [
            {
                "soulID": 1000,
                "soulLevel": 1
            }
        ]
    }
]}
</pre>



response
<pre><code>
        next(null, {
            'result': 0,
            'revenges': data
        });
</code></pre>