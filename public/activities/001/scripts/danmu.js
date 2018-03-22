(function ($) {
  "use strict";

  ['width', 'height'].forEach(function (dimension) {

    var Dimension = dimension.replace(/./, function (m) {
      return m[0].toUpperCase();
    });

    //outerWidth or outerHeight

    $.fn['outer' + Dimension] = function (margin) {
      var elem = this;

      if (elem) {
        // elem.width(); or  elem.height();
        var size = elem[dimension]();

        var sides = {
          'width': ['left', 'right'],
          'height': ['top', 'bottom']
        };

        sides[dimension].forEach(function (side) {
          if (margin) {
            size += parseInt(elem.css('margin-' + side), 10);
          }
        });

        return size;
      } else {
        return null;
      }
    }
  });
})($);
//弹幕模块
(function () {

  /*
  * @method Barrage
  * @desc 弹幕的算法模块
  * @param {Object} options传参的参数对象
  * @param {jQuery} options.wrapper , 容器
  * @param {Number} options.rank,     分弹幕的行数
  * @param {Function} options.tmp,    每条弹幕的自定义模板，tmp(data,rank)
  * @param {Number} options.speed,    弹幕的速度，默认为2，越大越快
  * @param {Boolean} options.circle,  是否轮播，默认为true，轮播会打乱顺序
  * @param {Array} options.data,      数据体
  *                {id:"1","txt":"弹幕信息"}，建议为该条，如果自定义的话，只要
  *                 只要这里的格式，与options.tmp内的处理格式相同即可。
  * @param {Number} options.distance, 两条弹幕中间的最小间距。
  */
  function Barrage(options) {
    if (!(this instanceof Barrage)) {
      return new Barrage(options);
    }

    // 初始化配置参数
    this.options = this.initOption(options);

    // 事件初始化
    this.initEvent();

  }

  // 初始化配置参数
  Barrage.prototype.initOption = function (options) {
    if (!options || typeof options != "object") {
      throw new Error("在初始化Barrage时，传入的参数需要是一个对象");
    }

    try {
      if (options.wrapper.size() != 1) {
        throw new Error();
      }
    } catch (e) {
      throw new Error("初始化Barrage时，传入的wrapper无效！");
    }

    // wrapper放到this对象上去；
    this.wrapper = options.wrapper;

    // 移动速度，默认为10px
    if (isNaN(options.speed)) {
      options.speed = 2;
    } else {
      options.speed = options.speed - 0;
    }

    // 同一水平面上的，两条弹幕的最小间距
    if (isNaN(options.distance)) {
      options.distance = 10;
    } else {
      options.distance = options.distance - 0;
    }

    // 循环的data属性
    if (!(options.data instanceof Array)) {
      options.data = [];
    }

    // 只循环一次的data
    options.onceData = [];

    // 当前正在循环到的第几条数据
    options.index = 0;

    // 是否为循环限制
    options.circle = options.circle === false ? false : true;

    // 默认的模板
    if (typeof options.tmp != "function") {
      options.tmp = function (data, rank) {
        return '<li class = "barrage-item" data-rank = "' + rank + '">' + data.txt + '</li>';
      };
    }

    // 动画引擎
    this.rAF = window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      function (callback) {
        window.setTimeout(callback, 1000 / 60);
      };

    // 状态码的枚举值
    this.statusCode = {
      unBeigin: "1",
      activity: "2"
    };

    // 当前的状态
    this.status = this.statusCode.unBeigin;

    // 当前的元素显示隐藏的状态
    this.isShow = true;

    return options;
  };

  // 初始化事件
  Barrage.prototype.initEvent = function () {
    var rAF = this.rAF,
      options = this.options,
      data = options.data,
      rankHtmlList = {},
      scrollData = {
        length: 0,
      },
      statusCode = this.statusCode,
      that = this,
      speed = options.speed,
      distance = options.distance,
      wrapper = options.wrapper,
      wrapperWidth = wrapper.width(),
      rankCount = options.rank;

    function _scroll() {
      if (that.status != statusCode.activity) {
        return "";
      }

      var i = "";

      for (i in scrollData) {
        if (i != "length") {
          _scrollEle(scrollData[i]);
        }
      }

      // 如果没有正在滚动的数据了，那么就更改状态，不在执行滚动了
      if (!scrollData.length) {
        that.status = statusCode.unBeigin;
      }

      rAF(_scroll);
    }

    function _scrollEle(data) {
      var eleWidth = data.width,
        translateX = data.translateX;


      if (translateX - 2 * eleWidth - wrapperWidth >= 0) {
        // 表示已经移动到区域之外，可以删除掉了。
        _remove(data);
      } else {
        if (data.lastItem === true && (translateX - eleWidth >= distance)) {
          // 表示该数据，是最后的一个，并且，已经全部展示出来了
          that.createEle(scrollData, data.rank);
          data.lastItem = false;
        }

        // 进行移动
        _move(data);
      }
    }

    // 移除正在滚动的一条数据
    function _remove(data) {
      data.ele.remove();
      scrollData[data.id] = null;
      delete scrollData[data.id];
      scrollData.length--;
    }
    // 执行滚动
    function _move(data) {
      var translateX = data.translateX;

      data.translateX = translateX + speed;

      data.ele.css({
        "transform": "translateX(-" + translateX + "px)"
      });

    }

    // 开始滚动
    function _begin() {
      // 更改状态
      that.status = statusCode.activity;

      // 添加至少几条数据
      var i = 0;

      // 创建最新的几条数据
      for (i; i < rankCount; i++) {
        that.createEle(scrollData, i, true);
      }

      // 开始滚动
      _scroll();
    }
    this._begin = _begin;

    // 结束时
    function _stop() {
      var i;
      for (i in scrollData) {
        if (i != "length") {
          _remove(scrollData[i]);
        }
      }
    }
    this._stop = _stop;

  };

  Barrage.prototype.createEle = function (scrollData, rank, isBegin) {
    var options = this.options,
      data = options.data,
      index = options.index,
      html = "",
      curData = null,
      id = "" + (new Date()).getTime() + rank,
      eleInstance = {
        id: id
      },
      onceData = options.onceData;

    // 如果当前的列表，已经循环完了，则根据是否轮播，来做不同的处理
    if (!onceData.length && index >= data.length) {
      if (options.circle === true) {
        data.sort(function () {
          return Math.random() - 0.5 >= 0 ? 1 : -1;
        });
        options.index = 0;
        index = options.index;
      } else {
        return "";
      }
    }

    // 表示需要轮播
    if (onceData.length) {
      curData = onceData.shift();
    } else {
      curData = data[index];
      options.index++;
    }

    html = $(options.tmp(curData, rank));

    // 把元素添加到wrapper内部
    options.wrapper.append(html);

    // 元素
    eleInstance.ele = html;

    // 元素的宽度
    eleInstance.width = html.outerWidth();

    // 设置该元素所在的行
    eleInstance.rank = rank;

    // 元素当前的移动距离
    if (isBegin !== true) {
      // 这个时候，表示最初的几个，不能同时出来，所以要有一定的差距
      eleInstance.translateX = 0;
    } else {
      eleInstance.translateX = -2 * Math.round(Math.random() * options.distance);
    }

    // 表示它是这一行中的最后一个元素
    eleInstance.lastItem = true;

    // 保存到对象上去，并且更新length属性
    scrollData[id] = eleInstance;
    scrollData.length++;

  };

  // 弹幕开始
  Barrage.prototype.begin = function () {

    if (this.isShow !== true) {
      return "";
    }

    if (this.status != this.statusCode.activity) {
      this.status = this.statusCode.activity;
      this._begin();
    }
  };

  // 弹幕停止
  Barrage.prototype.stop = function () {

    if (this.isShow !== true) {
      return "";
    }

    if (this.status != this.statusCode.unBeigin) {
      this.status = this.statusCode.unBeigin;
      this._stop();
    }
  };

  // 弹幕显示
  Barrage.prototype.show = function () {
    this.options.wrapper.show();
    this.isShow = true;
    this.begin();
  };

  // 弹幕隐藏
  Barrage.prototype.hide = function () {
    this.stop();
    this.isShow = false;
    this.options.wrapper.hide();
  };

  // 插入一条弹幕
  // data = {id : "",txt : ""};
  // once，表示是否只显示一次，默认显示一次
  Barrage.prototype.insert = function (data, once) {
    if (!data || typeof data != "object") {
      return "";
    }

    if (once === false) {
      this.options.data.push(data);
    } else {
      this.options.onceData.push(data);
    }

    // 尝试去播放，因为如果当前已经停止了，那么insert之后，要把这个滚动起来
    this.begin();
  };

  // 用于重新更新数据
  // data格式是一个数组，与实例化时的格式相同
  Barrage.prototype.reset = function (data) {
    if (!data || !(data instanceof Array)) {
      return "";
    }

    var cData = this.options.data,
      i = 0,
      len = data.length;

    cData.length = 0;
    // 清空原有的数据

    $.extend(cData, data);

    // 尝试去播放，因为如果当前已经停止了，那么insert之后，要把这个滚动起来
    this.begin();

  };

  window.Barrage = Barrage;
})();
