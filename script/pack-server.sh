#!/bin/sh

ftp_server=111.161.51.191:9050
ftp_user=QMPHS_ftp
ftp_pass=QMPHS@2014
ftp_path=/server

svn up game-server
svn up external-config

version=`svn info game-server | grep 'Rev:' | awk '{print $4}'`

filename="qmphs."$version

des_folder="./publish"

echo Creating $filename ...

if [ ! -d $des_folder ]; then
    mkdir $des_folder
fi

if [ -f $des_folder/$filename ]; then
    rm -f $des_folder/$filename
fi

if [ -d qmphs ]; then
    rm -f qmphs
fi

ln -s game-server qmphs

#7za a $des_folder/$filename".7z" game-server/* mysql/*.sql > /dev/null

tar czhf $des_folder/$filename".tgz"  qmphs external-config/tlog external-config/idip external-config/mysql/*.sql

rm -f qmphs

md5=`md5sum $des_folder/$filename".tgz"  | awk '{print $1}'`

final_file=$filename"."$md5".tgz"

echo "moving $des_folder/$filename"."$md5".tgz""
mv $des_folder/$filename".tgz" $des_folder/$final_file


echo "Attempting to upload '$final_file' to $ftp_path.."

# execute lftp with the appropriate options
lftp <<EOF
    open $ftp_server
    user $ftp_user $ftp_pass
    cd $ftp_path
    put "$des_folder/$final_file"
    bye
EOF

echo Done!
