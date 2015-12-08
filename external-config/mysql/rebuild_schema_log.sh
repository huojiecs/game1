#!/bin/sh

echo '##This script will rebuild db schema.##'

dbname='database_log'
dbhost='localhost'
dbport='3306'
dbuser='root'
dbpassword='mysql6666'

mysql -h${dbhost} -P${dbport} -u${dbuser} -p${dbpassword} < ./${dbname}.sql

