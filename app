#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

node --harmony $DIR/bin/app.js $1 $2 $3 $4 $5 $6 $7 $8 $9
