// 自动同步两个书城的书籍数据
var shell = require('shelljs');
function mongosync () {
  if (!shell.which('mongorestore') || !shell.which('mongodump')) {
    shell.echo('你本地没有安装mongodb');
    shell.exit(1);
  }
  shell.echo('开始导出书籍数据...');
  if (shell.exec('mongodump -h localhost:27017 -d mbook -c books -o /tmp/mongodb').code !== 0) {
    shell.echo('导出书籍数据失败');
    shell.exit(1);
    return false;
  }
  shell.echo('开始导出章节数据...');
  if (shell.exec('mongodump -h localhost:27017 -d mbook -c chapters -o /tmp/mongodb').code !== 0) {
    shell.echo('导出章节数据失败');
    shell.exit(1);
    return false;
  }
  shell.echo('开始同步数据...');
  if (shell.exec('mongorestore -h localhost:27017 -d mbook-dev --drop /tmp/mongodb/mbook/').code !== 0) {
    shell.echo('同步数据失败');
    shell.exit(1);
    return false;
  }
  return true;
}

module.exports = {
  mongosync: mongosync
}
