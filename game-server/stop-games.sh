#!/bin/bash

./pomelo stop -P 26090

echo "node count: `ps aux | grep node | grep -v grep | wc -l`"
