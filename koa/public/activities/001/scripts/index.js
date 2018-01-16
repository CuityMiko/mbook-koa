var endTime = "January 27,2018 00:00:00"
var imgYzmUrl = '//khtest.10jqka.com.cn/kh/apiprize/index.php?action=imgcode'
var khHost = '//khtest.10jqka.com.cn/kh/apiprize/index.php'
var platform = getPlatform()
var allQs = ["财富证券", "财通证券", "长城国瑞证券", "长城证券", "长江证券", "大同证券",
  "东北证券", "东方证券", "东莞证券", "东海证券", "东吴证券", "东兴证券", "光大证券",
  "广州证券", "国金证券", "国联证券", "国融证券", "恒泰证券", "华福证券", "华金证券",
  "华林证券", "华融证券", "华西证券", "江海证券", "金元证券", "开源证券", "联讯证券",
  "平安证券", "山西证券", "申港证券", "首创证券", "太平洋证券", "天风证券", "天风证券",
  "万和证券", "万联证券", "西南证券", "新时代证券", "信达证券", "兴业证券", "银河证券",
  "银泰证券", "浙商证券", "中金证券", "中山证券", "中泰证券", "中信证券", "中原证券"
]

function getPlatform() {
  var browser = {
    versions: function () {
      var u = navigator.userAgent, app = navigator.appVersion;
      return {
        iPhone: u.indexOf('iPhone') > -1 || u.indexOf('Mac') > -1,
        iPad: u.indexOf('iPad') > -1
      };
    }(),
    language: (navigator.browserLanguage || navigator.language).toLowerCase()
  };
  if (browser.versions.iPhone || browser.versions.iPad) {
    var platform = "iphone";
  } else {
    var platform = "gphone";
  }
  return platform;
}

// 倒计时
function startClock() {
  function transNum(num) {
    var tmp = num > 9 ? ('' + num) : ('0' + num)
    var tmpArr = tmp.split('')
    var result = ''
    tmpArr.forEach(function (item) {
      result += '<span class="num">' + item + '</span>'
    })
    return result
  }

  function formatTime(timeset) {
    var oldtimeset = timeset / 1000
    timeset = parseInt(timeset / 1000)
    var obj = {
      hour: '<span class="num">0</span><span class="num">0</span>',
      minute: '<span class="num">0</span><span class="num">0</span>',
      second: '<span class="num">0</span><span class="num">0</span>',
      msecond: '<span class="num orange">0</span>'
    }
    if (oldtimeset > 0) {
      obj.msecond = '<span class="num orange">' + oldtimeset.toFixed(1).toString().replace(/\d+./, '') + '</span>'
    } else {
      obj.msecond = '<span class="num orange">0</span>'
    }
    if (timeset >= 0) {
      obj.second = transNum(timeset % 60)
    }
    if (timeset > 60) {
      obj.minute = transNum(parseInt(timeset / 60) % 60)
    }
    if (timeset > 3600) {
      obj.hour = transNum(parseInt(timeset / 3600) % 24 + parseInt(timeset / 86400) * 24)
    }
    return obj.hour + '<span class="zh">时</span>' + obj.minute + '<span class="zh">分</span>' + obj.second + '<span class="zh">秒</span>' + obj.msecond
  }

  setInterval(function () {
    var now = new Date()
    var end = new Date(endTime)
    var timeset = end.getTime() - now.getTime()
    $('.leave-time').html(formatTime(timeset))
  }, 100)
}

/**
 * 创建弹窗
 * @param title 弹窗标题
 * @param content 弹窗内容
 * @param closeStat 关闭弹窗的统计
 */
function createAlertDiv(title, content, closeStat) {
  //对于已经存在的alert先去掉
  $('.alert-container').remove();
  $('.modal-bg').remove();
  //动态生成dom
  try {
    var alertHtml = '<div class="alert-container"><div class="content"><div class="border"><div class="title">' + title + '</div>' + content + '</div><i class="icon-lingxing1"></i><i class="icon-lingxing2"></i><i class="icon-lingxing3"></i><i class="icon-lingxing4"></i><i class="icon-close"></i></div><div class="modal-bg"></div></div>'
    $('body').append(alertHtml)
    // $('.alert-container').css('height', $('body').height() + 'px')
    $('.alert-container .content').css('margin-top', -($('.alert-container .content').height() / 2) + 'px')
    $('.modal-bg, .icon-close').click(function () {
      closeAlert(closeStat)
    })
    //阻止屏幕滑动
    $('.alert-container').bind('touchmove', function (e) {
      e.preventDefault();
    })
  } catch (err) {
    console.log(err)
  }
}

/**
 * 关闭弹窗函数
 */
function closeAlert(closeStat) {
  $('.alert-container').remove();
  $('.modal-bg').remove();
}

/**
 * 创建加载动画
 * @param 显示的提示文字
 */
function createLoading(text, type) {
  $('.loading').remove()
  var src = '/activities/001/images/loading.gif'
  if (type === 'success') {
    src = '/activities/001/images/check.png'
  } else if (type === 'error') {
    src = '/activities/001/images/error.png'
  } else if (type === 'loading') {
    src = '/activities/001/images/loading.gif'
  }
  var loadingHtml = '<div class="loading"><div class="load-div"><img src="' + src + '" alt="加载中..."><p>' + text + '</p></div></div>'
  $('body').append(loadingHtml)
  //阻止屏幕滑动
  $('.loading').bind('touchmove', function (e) {
    e.preventDefault()
  });
  setTimeout(function () {
    closeLoading()
  }, 3000)
}

// 关闭loading
function closeLoading() {
  $('.loading').remove()
}

// get some item form array randomly
function formatQs(arr, count) {
  arr = arr.map(function (item, index) {
    var ele = {}
    ele.id = index + 1
    ele.txt = item
    ele.yellow = false
    return ele
  })
  var shuffled = arr.slice(0)
  var i = arr.length
  var min = i - count
  var temp, index
  while (i-- > min) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  var yellowArr = shuffled.slice(min)
  yellowArr.forEach(function (item) {
    arr[item.id - 1].yellow = true
  })
  return arr
}

// word overflow
function overflowHidden(id, rows, str) {
  var text = document.getElementById(id);
  var style = getCSS(text);
  var lineHeight = style["line-height"]; //获取到line-height样式设置的值 必须要有
  var at = rows * parseInt(lineHeight); //计算包含文本的div应该有的高度
  var tempstr = str; //获取到所有文本
  text.innerHTML = tempstr; //将所有文本写入html中
  var len = tempstr.length;
  var i = 0;
  if (text.offsetHeight <= at) { //如果所有文本在写入html后文本没有溢出，那不需要做溢出处理
    /*text.innerHTML = tempstr;*/
  } else { //否则 一个一个字符添加写入 不断判断写入后是否溢出
    var temp = "";
    text.innerHTML = temp;
    while (text.offsetHeight <= at) {
      temp = tempstr.substring(0, i + 1);
      i++;
      text.innerHTML = temp;
    }
    var slen = temp.length;
    tempstr = temp.substring(0, slen - 1);
    len = tempstr.length
    text.innerHTML = tempstr.substring(0, len - 3) + "..."; //替换string后面三个字符 
    text.height = at + "px"; //修改文本高度 为了让CSS样式overflow：hidden生效
  }
}

// 将月份数字转化成英文名
function formatMonth(number) {
  var month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  if (number >= 1 && number <= 12) {
    return month[number - 1]
  }
}

function initPage(){
  // 开始倒计时
  startClock()

  // banner
  window.mySwipe = new Swipe(document.getElementById('pd-slider'), {
    startSlide: 2,
    speed: 400,
    auto: 4000,
    continuous: true,
    disableScroll: false,
    stopPropagation: false,
    callback: function (index, elem) { },
    transitionEnd: function (index, elem) {
      $('#pd-slider .dots .dot').removeClass('active')
      $('#pd-slider .dots .dot').eq(index % 2).addClass('active')
    }
  });

  // 感言轮播
  window.myVideoSwipe = new Swipe(document.getElementById('ganyan-slider'), {
    startSlide: 0,
    speed: 400,
    auto: 4000,
    continuous: true,
    disableScroll: false,
    stopPropagation: false,
    callback: function(index, elem) {},
    transitionEnd: function(index, elem) {
      $('#ganyan-slider .dots .dot').removeClass('active')
      $('#ganyan-slider .dots .dot').eq(index % 4).addClass('active')
    }
  });

  // init progress
  var now = new Date()
  var nowYearNum = now.getFullYear()
  var nowDayNum = now.getDate()
  nowDayNum = nowDayNum > 9 ? ('' + nowDayNum) : ('0' + nowDayNum)
  var nowMonthNum = now.getMonth()
  nowMonthNum = nowMonthNum > 9 ? ('' + nowMonthNum) : ('0' + nowMonthNum)
  var startDayTime = new Date(formatMonth(nowMonthNum) + ' ' + nowDayNum + ',' + nowYearNum + ' 00:00:00')
  var hours = 85 + parseInt((parseInt((now.getTime() - startDayTime.getTime()) / 3600000) % 24) / 2)
  var font_size = document.documentElement.clientWidth / 640.0 * 100
  font_size = font_size >= 50 ? font_size : 50
  $('.op1 .progress .text').html('已领取' + hours + '%')
  $('.op1 .progress .progress-line-wc').css('width', 1.6 * font_size * (hours / 100) + 'px')
  $('.op2 .progress .text').html('已领取' + ((hours + 2) > 100 ? 100 : (hours + 2) + '%'))
  $('.op2 .progress .progress-line-wc').css('width', 1.6 * font_size * (((hours + 2 > 100 ? 100 : (hours + 2))) / 100) + 'px')


  // 点击“抢”的图片
  $('#pd-slider .op1').click(function () {
    createAlertDiv('恭喜您', '<div class="text">您已成功免费领取<s>原价103元/年</s>的奖品。请选择券商开户激活。不知道哪家券商适合自己？<a class="text-underline">点这里查询>></a></div><div class="prize"><div class="prize-item"><img src="/activities/001/images/level2.png" /><p>Level-2</p></div><i class="icon-add"></i><div class="prize-item"><img src="/activities/001/images/sqdb.png" /><p>神奇电波</p></div></div><button id="doActive">立即激活</button>')
  })
  $('#pd-slider .op2').click(function () {
    createAlertDiv('恭喜您', '<div class="text">您已成功免费领取<s>原价238元/年</s>的奖品，请选择<span class="text-b">财富证券</span>开户激活。</div><div class="prize"><div class="prize-item"><img src="/activities/001/images/level2.png" /><p>Level-2</p></div><i class="icon-add"></i><div class="prize-item"><img src="/activities/001/images/vip.png" /><p>同花顺VIP</p></div></div><button id="doActive">立即激活</button><p class="des">温馨提示：新开账户三十日内入金1万元及以上即可激活以上奖品。</p>')
  })

  $('.video').mediaBox({ media: 'video' });

  // video slide
  if ($('#video-slider .swipe-wrap>div').length > 1) {
    window.myVideoSwipe = new Swipe(document.getElementById('video-slider'), {
      startSlide: 2,
      speed: 400,
      auto: 0,
      continuous: true,
      disableScroll: false,
      stopPropagation: false,
      callback: function (index, elem) { },
      transitionEnd: function (index, elem) {
        $('#video-slider .dots .dot').removeClass('active')
        $('#video-slider .dots .dot').eq(index % 2).addClass('active')
      }
    });
  } else {
    $('#video-slider .dots').hide()
  }

  // init dangmu
  // set qs bigger text randomly
  var barrage = new Barrage({
    wrapper: $(".barrage-area").eq(0),
    rank: 2,
    tmp: function (data, rank) {
      return '<li class = "barrage-item ' + (data.yellow ? 'yellow' : '') + '" data-rank = "' + rank + '" style="margin-left: ' + (Math.random() / 2).toFixed(2) + 'em; top: ' + (rank === 1 ? ((12 + ((Math.random().toFixed(2) - 0.5) * 2) * 5 + '%')) : ((56 + ((Math.random().toFixed(2) - 0.5) * 2) * 5 + '%'))) + '">' + data.txt + '</li>';
    },
    data: formatQs(allQs, 20),
    speed: platform === 'iphone' ? 1.6 : 2.2,
    circle: true
  });

  barrage.begin();
}
