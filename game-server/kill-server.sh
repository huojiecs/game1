#!/bin/bash

[ "$#" -lt 1 ] && echo "Require env parameter for killing. Stop here." && exit 0

ps aux | grep node | grep -v tail | grep -v scp | grep $1 | awk '{print \$2}' | xargs kill

