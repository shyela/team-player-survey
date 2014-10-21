#!/usr/bin/env bash

rsync -aP --delete --exclude=conf --exclude=.* --exclude=deploy.sh --exclude=test . $LOGNAME@expweb01.prod.vlt.smilebox.com:/var/www/vlt-team/public_html/survey/
