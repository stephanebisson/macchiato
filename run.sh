#!/bin/bash

coffee -c server.coffee
node server.js `cd $1; pwd`
