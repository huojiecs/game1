#!/bin/sh

if [ "$1" = "--clear" ]; then

    echo Try clear node_modules.

    if [ -d "./node_modules" ]; then
	echo Remove node_modules.
        rm node_modules -rf
    fi

    if [ -d "./node_modules" ]; then
        echo please check for deleting node_modules!
        return 0
    fi
fi

npm install --registry http://188.188.0.162:8080 --proxy http://188.188.0.162:8080


