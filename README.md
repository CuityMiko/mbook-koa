http://m.xgstars.com/
主编推荐
每日必读

mongo 备份 window命令
cd D:/mongo/bin
D:
mongodump --host localhost --port 27017 --db mbook --out D:\PROJECT\work01_book_read_app\dump

mongo 恢复 window命令
先删除mbook数据库
cd D:/mongo/bin
D:
mongorestore --host localhost --port 27017 --db mbook D:\PROJECT\work01_book_read_app\dump\mbook

mongo 备份 linux命令

mongo 恢复 window命令
sudo mongorestore --host localhost --port 27017 --db mbook /home/andyliwr/文档/work/dump/mbook