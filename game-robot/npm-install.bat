@echo off

if /i %1. equ --clear. (
    echo Try clear node_modules.

    if exist node_modules rd node_modules /s/q
    if exist node_modules rd node_modules /s/q
    if exist node_modules rd node_modules /s/q

    if exist node_modules (
        @echo please check for deleting node_modules!
        goto :EOF
    )
)

npm install --registry http://188.188.0.162:8080 --proxy http://188.188.0.162:8080

