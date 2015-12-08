#!/usr/bin/env bash

# determine base directory; preserve where you're running from
realpath=$(readlink -f "$0")
export basedir=$(dirname "$realpath")   #export basedir, so that module shell can use it. log.sh. e.g.
export filename=$(basename "$realpath") #export filename, so that module shell can use it. log.sh. e.g.

#echo 'Script dirname: '$basedir
#echo 'Script basename: '$filename

echo '##This script will rebuild db schema.##'

. rebuild_schema_utils.sh
check_config || exit 1

if [ "$#" -lt 3 ]; then
    echo "The number of parameter is less than 3. Stop here."
    echo $filename prefix database_name database_file
    exit 1
fi

. rebuild_schema_config.sh
test_db_connection || exit 1

dbPrefix="$1"
dbName="$2"
dbFile="$3"


rebuild_schema ${dbPrefix} ${dbName} ${dbFile}

