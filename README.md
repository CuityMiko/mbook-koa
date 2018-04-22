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

### 常见问题
#### 接口报错：`errmsg: 'E11000 duplicate key error collection: mbook.chapters index: num_1 dup key: { : 130 }'`

  打开robomongo删除chapters表下的num_1的index，它的属性是unique，所以新增相同num的chapter的时候会出现这种错误，后来我删除了chapter表，并不在会出现chapter的num_1的索引，所以推断应该是数据恢复的时候带过来的
  
#### 安装`node-canvas`
```
# ubuntu下运行
sudo apt-get install libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev build-essential g++
# mac OS下运行
brew install pkg-config cairo pango libpng jpeg giflib
cnpm install canvas --save
```
