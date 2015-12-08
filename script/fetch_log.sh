#!/bin/sh
#author xy.kong@gmail.com

echo ""
echo ""
echo "The script name is ==> $0"
echo "Total parameter number is ==> $#"
[ "$#" -lt 3 ] && echo "The number of parameter is less than 3. Stop here." && exit 0

echo "Your whole parameter is ==> '$@'"

worldid=$1
module=games
names=$2
window=$3

if [ "$((worldid % 100))" -eq 0 ]; then
        module=logins
fi

#echo $worldid
#echo $module
#echo $names
#exit 0


url_text="http://yw.qmphs.qq.com/logqmphs.php?worldid="$worldid"&module="$module"&name="$names

echo $url_text

#exit

url_text=$(curl "http://yw.qmphs.qq.com/logqmphs.php?worldid="$worldid"&module="$module"&name="$names 2>/dev/null) 


echo $url_text

#exit

url_down=$(node -e "var a = "$url_text"; a.length ? console.log(a[0]) : ''; ")

[ $url_down -z ] && echo "No download url for the logs. Stop here." && exit 0

log_name=$(node -e "var a = "$url_text"; var b = a[0].split('/'); console.log(b[b.length-1]);")
dir_name=$(node -e "var a = "$url_text"; console.log(a[0].match('[a-z]+_[0-9]+')[0]);")

echo $url_down
echo $log_name
echo $dir_name


wget $url_down > /dev/null

tar xvf $log_name > /dev/null

cd $dir_name

sub_name=$(ls)

cd ..

echo "cd ./"$dir_name"/"$sub_name

cd "./"$dir_name"/"$sub_name

gzip -d *.gz

if [ "$window" == "base" ] ; then
	bash
fi

if [ "$window" == "screen" ] ; then
	screen -US $dir_name
fi

if [ "$window" == "tmux" ] ; then
	tmux -u new -s $dir_name
fi

if [ "$window" == "exec" ] ; then
       eval $4
fi



