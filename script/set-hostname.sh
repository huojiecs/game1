#!/bin/sh

hostname $1.qmphs.com

sed -i "s/localhost.localdomain/$1.qmphs.com/g" /etc/hosts
sed -i "s/localhost6.localdomain6/$1.qmphs.com/g" /etc/hosts

sed -i "s/localhost.localdomain/$1.qmphs.com/g" /etc/sysconfig/network

