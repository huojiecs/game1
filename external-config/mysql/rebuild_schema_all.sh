#!/usr/bin/env bash

# determine base directory; preserve where you're running from
realpath=$(readlink -f "$0")
export basedir=$(dirname "$realpath")   #export basedir, so that module shell can use it. log.sh. e.g.
export filename=$(basename "$realpath") #export filename, so that module shell can use it. log.sh. e.g.

#echo 'Script dirname: '$basedir
#echo 'Script basename: '$filename


echo '##This script will rebuild db game schema.##'

. rebuild_schema_utils.sh
check_config || exit 1

if [ "$#" -lt 1 ]; then
    echo "The number of parameter is less than 1. Stop here."
    echo $filename prefix
    exit 1
fi

. rebuild_schema_config.sh
test_db_connection || exit 1

dbPrefix="$1"

rebuild_schema $dbPrefix game ./database_game.sql
rebuild_schema $dbPrefix account ./database_account.sql
rebuild_schema $dbPrefix gaccount ./database_account_global.sql
rebuild_schema $dbPrefix log ./database_log.sql
rebuild_schema $dbPrefix tblog ./database_tbLog.sql
