#! /bin/bash

# Make sure only root can run our script
if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

function error_exit
{
	if [ "$?" != "0" ]; then
		echo "$1" 1>&2
		exit 1
	fi
}

function logger
{
    local datetime=`date +"%y-%m-%d %H:%M:%S"`
    local message=$1
    echo "$datetime [$0] :: $message"
}


# install wget, sysstat, lrzsz
echo >&2 "Install wget sysstat lrzsz vim"

yum clean all
yum -y install wget sysstat lrzsz vim

error_exit "Yum got something error, Cannot install!  Aborting."


# install subversion client.
command -v svn >/dev/null 2>&1 || {
    echo >&2 "Install subversion"

    cat > /etc/yum.repos.d/wandisco-svn.repo <<EOF
[WandiscoSVN]
name=Wandisco SVN Repo
baseurl=http://opensource.wandisco.com/centos/6/svn-1.8/RPMS/\$basearch/
enabled=1
gpgcheck=0
EOF

    yum clean all
    yum -y install subversion

    command -v svn >/dev/null 2>&1 || {
        logger "Install subversion failed." &&  exit 1
    }

    sed -i 's/.*store-passwords\b*=.*/store-passwords = no/g' ~/.subversion/servers
}


# install Python 2.7 and Python 3.3 on CentOS 6
command -v python >/dev/null 2>&1 || {

    yum -y groupinstall "Development tools"
    yum -y install zlib-devel bzip2-devel openssl-devel ncurses-devel sqlite-devel readline-devel tk-devel gdbm-devel db4-devel libpcap-devel xz-devel

    wget -c http://python.org/ftp/python/2.7.6/Python-2.7.6.tar.xz
    tar xf Python-2.7.6.tar.xz
    cd Python-2.7.6
    ./configure --prefix=/usr/local --enable-unicode=ucs4 --enable-shared LDFLAGS="-Wl,-rpath /usr/local/lib"
    make && make altinstall

    mv /usr/bin/python /usr/bin/python2.6.6
    ln -s /usr/local/bin/python2.7 /usr/bin/python

    sed -i "s/python/python2.6.6/g" /usr/bin/yum

    command -v python >/dev/null 2>&1 || {
        logger "Install python failed." &&  exit 1
    }
}


# install Python 2.7 and Python 3.3 on CentOS 6
if [ "$(python -V 2>&1)" == "Python 2.6.6" ]; then

    yum -y groupinstall "Development tools"
    yum -y install zlib-devel bzip2-devel openssl-devel ncurses-devel sqlite-devel readline-devel tk-devel gdbm-devel db4-devel libpcap-devel xz-devel

    wget -c http://python.org/ftp/python/2.7.6/Python-2.7.6.tar.xz
    tar xf Python-2.7.6.tar.xz
    cd Python-2.7.6
    ./configure --prefix=/usr/local --enable-unicode=ucs4 --enable-shared LDFLAGS="-Wl,-rpath /usr/local/lib"
    make && make altinstall

    mv /usr/bin/python /usr/bin/python2.6.6
    ln -s /usr/local/bin/python2.7 /usr/bin/python

    sed -i "s/python/python2.6.6/g" /usr/bin/yum
fi


# install tmux
command -v tmux >/dev/null 2>&1 || { 
	echo >&2 "Install tmux"

    wget -c --no-check-certificate https://sourceforge.net/projects/levent/files/libevent/libevent-2.0/libevent-2.0.22-stable.tar.gz
    tar xzvf libevent-2.0.22-stable.tar.gz
    cd libevent-2.0.22-stable
    ./configure && make
    make install
    cd ..
    ln -s /usr/local/lib/libevent-2.0.so.5 /lib64/libevent-2.0.so.5

    wget -c http://downloads.sourceforge.net/tmux/tmux-1.9a.tar.gz
    tar -xvf tmux-1.9a.tar.gz
    cd tmux-1.9a
    ./configure && make
    make install
    cd ..
    rm -f /usr/bin/tmux
    ln -s /usr/local/bin/tmux /usr/bin/tmux

	error_exit "Cannot install tmux!  Aborting."
}


# install node
command -v node >/dev/null 2>&1 || {
    echo >&2 "Install node.js"
    wget -c http://nodejs.org/dist/v0.10.36/node-v0.10.36.tar.gz
    tar xzvf node-v0.10.36.tar.gz
    cd node-v0.10.36
    ./configure && make && sudo make install
    cd ..
    ln -s /usr/local/bin/node /usr/bin/node
}


# install mysql server
command -v mysql >/dev/null 2>&1 || {
    echo >&2 "Install mysql"
    wget -c http://repo.mysql.com/mysql-community-release-el6-5.noarch.rpm
    sudo yum -y localinstall mysql-community-release-el6-5.noarch.rpm
    sudo yum -y install mysql-community-server
}


# install redis
command -v redis >/dev/null 2>&1 || { 
    echo >&2 "Install redis"
    wget -c http://download.redis.io/releases/redis-2.8.19.tar.gz
    tar xzf redis-2.8.19.tar.gz
    cd redis-2.8.19
    make
    sudo make PREFIX=/usr/local install
    cd ..
}







