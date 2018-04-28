#!/bin/bash
cd /home/ubuntu/mbook-koa
echo "从远程拉取代码"
git pull
echo "最新改动如下"
git diff HEAD^
echo "PM2 进程"
source /home/ubuntu/.nvm/nvm.sh
pm2 list
echo "重启mbook-koa"
pm2 restart mbook-koa
