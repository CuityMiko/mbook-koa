#!/bin/bash
echo "当前目录" && pwd && ls && echo "查看当前修改历史" && git diff HEAD^ && echo "安装npm依赖" && source /home/ubuntu/nvm/nvm.sh && cnpm install && echo "重启mbook-koa" && pm2 restart mbook-koa && echo "完成部署"
