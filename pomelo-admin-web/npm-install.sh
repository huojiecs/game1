#!/bin/sh

if [ "$1" = "--clear" ]; then

    echo Try clear node_modules.

    if [ -f "node_modules" ]; then
        rm node_modules -rf
    fi

    if [ -f "node_modules" ]; then
        echo please check for deleting node_modules!
        return 0
    fi
fi

npm install --registry http://188.188.0.162:8080


