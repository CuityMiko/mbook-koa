### **微书--后端项目**
新版微书,继续完成吧~

### **mongo的备份和恢复**
由于开发都是连接的本地mongodb,所以在公司和家里的数据时常有些不同步,需要使用mongo的命令做同步.
1. **windows备份**
  ```
  cd D:/mongo/bin
  D:
  mongodump --host localhost --port 27017 --db mbook --out D:\PROJECT\work01_book_read_app\dump  (ths)
  ./mongodump.exe --host localhost --port 27017 --db mbook E:/work01_book_read_app/dump  (home)
  ```
2. **windows恢复**
  ```
  cd D:/mongo/bin
  D:
  mongorestore --host localhost --port 27017 --db mbook D:\PROJECT\work01_book_read_app\dump\mbook  (ths)
  ./mongorestore.exe --host localhost --port 27017 --db mbook E:/work01_book_read_app/dump/mbook  (home)
  ``` 
3. **linux备份**
```
sudo mongodump --host localhost --port 27017 --db mbook --out /home/andyliwr/Documents/work01_book_read_app/dump/mbook
```
4. **linux恢复**
```
sudo mongorestore --host localhost --port 27017 --db mbook /home/andyliwr/Documents/work01_book_read_app/dump/mbook
```

### **ngrok代理本地500端口调试微信**
+ 隧道id: `2be12d1c071de987`
+ 访问地址: `http://ldk.free.ngrok.cc`
+ linux启动方式: `./sunny clientid 2be12d1c071de987`
+ windows启动方式: 双击`ngrok.bat`

