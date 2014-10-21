#!/usr/bin/env bash

rsync -avP --delete --exclude=conf --exclude=.* --exclude=deploy.sh --exclude=test . $LOGNAME@expweb01.staging.vlt.smilebox.com:/var/www/vlt-team/public_html/
