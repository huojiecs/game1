#!/usr/bin/env bash

check_config() {
    if [ ! -f rebuild_schema_config.sh ]; then
        echo 'You should setup rebuild_schema_config.sh config file for your database connection.'

        cat > rebuild_schema_config.sh <<EOF
#!/usr/bin/env bash
if [ "\$rebuild_schema_config" ]; then
    return
fi

export rebuild_schema_config="rebuild_schema_config.sh"

gdbHost="188.188.0.162"
gdbPort=3306
gdbUser="root"
gdbPassword="mysql6666"
EOF
        return 1
    fi

    return 0
}

test_db_connection() {
    echo "Test mysql connection to ${gdbUser}@${gdbHost}:${gdbPort} ..."
    mysql -h${gdbHost} -P${gdbPort} -u${gdbUser} -p${gdbPassword} -e "SELECT 1;" -s 2>/dev/null
    if [ "$?" = "0" ]; then
        echo "Mysql connection to ${gdbUser}@${gdbHost}:${gdbPort} Ok."
        return 0
    else
        echo "Mysql connection to ${gdbUser}@${gdbHost}:${gdbPort} failed."
        echo "Please check your database configuration in rebuild_schema_config.sh"
        return 1
    fi
}

rebuild_schema() {
    local ldbPrefix="$1"
    local ldbName="$2"
    local ldbFile="$3"

    echo "Mysql create schema ${gdbUser}@${gdbHost}:${gdbPort} ${ldbPrefix}_${ldbName} by ${ldbFile}."

    mysql -h${gdbHost} -P${gdbPort} -u${gdbUser} -p${gdbPassword} -e "DROP DATABASE IF EXISTS \`${ldbPrefix}_${ldbName}\` ;" 2>/dev/null
    mysql -h${gdbHost} -P${gdbPort} -u${gdbUser} -p${gdbPassword} -e "CREATE SCHEMA \`${ldbPrefix}_${ldbName}\` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;" 2>/dev/null
    mysql -h${gdbHost} -P${gdbPort} -u${gdbUser} -p${gdbPassword} ${ldbPrefix}_${ldbName} < ./${ldbFile} 2>/dev/null
}

