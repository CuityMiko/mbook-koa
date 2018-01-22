//login.js
const config = require('../../config')

var currentGesture = 0; //控制当一个手势进行的时候屏蔽其他的手势
var moveTime = null; //控制左滑右滑的动画
var isMoving = 0;
var leftTimmerCount = 0;
var rightTimmerCount = 0;
var hasRunTouchMove = false;

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    bookid: '',
    factionName: '',
    author: '',
    headImg: '', // 小说图像
    factionTitle: '',
    content: '第一千四百一十二章\n\n\n当牧尘的身影落在了黑光长老所在的那座白玉石台时，整个天地间，依旧还处于先前的震撼之中，所有人都是一片沉默。\n\n这种沉默持续了许久，终于是有着人有些艰难的开口喃喃道：“那是...传闻中大千世界三十六道绝世神通之一的八部浮屠吧？”\n\n在场的这些各方超级势力，自然也是阅历非凡，所以很快的，也是渐渐的认出了先前牧尘所施展出来的那惊天动地的神通。\n\n那道幽黑光束所具备的毁灭力，看得众多天至尊都是头皮发麻，而如此威能的神通之术，除了那名震大千世界的三十六道绝世神通外，还能是什么？\n\n“没想到，他竟然真的将八部浮屠修炼成功了。”那些浮屠古族的长老，特别是玄脉与墨脉的，更是眼睛通红，无比嫉妒的望着牧尘，那模样，仿佛是恨不得将这般神通抢夺过来一般。\n\n因为身为天至尊，他们非常清楚那三十六道绝世神通对于他们而言究竟代表着什么，若是拥有，他们同样是能够无敌于同级之中。\n\n想想看，大千世界究竟有多少天至尊，然而那最顶尖的神通，却唯有这三十六道，由此可见其价值。\n\n就算是他们浮屠古族这深不可测的底蕴，能够媲美这三十六道绝世神通的神通之术，都是屈指可数。\n\n在那先前牧尘所在的山峰，清霜玉手紧紧的捂住嘴巴，此时的激动，连她素来的冰冷都是再维持不住，娇躯颤抖。\n\n原本以为他们清脉此次将会是毁灭般的打击，但谁料到竟会峰回路转，牧尘的横空出世，居然有着要将这般大势扭转过来的迹象。\n\n“牧尘，加油啊！”清霜喃喃道。\n\n在她身旁，灵溪倒是微笑着拍了拍她的香肩，让得后者有些不好意思的一笑，渐渐的冷静下来。\n\n“灵溪姐，牧尘能赢吗？”清霜带着一丝期盼的问道，虽然她知道，即便赢了两场，但牧尘接下来要面对的对手，却会更强。\n\n灵溪清浅一笑，温婉优雅，道：“放心吧，牧尘既然会出手，那自然有着他的把握，我们只需要等着便行了。”\n\n清霜用力的点了点头，美目凝视着远处那道身影，眸子中异彩流溢。\n\n而在另外一座山峰上，林静拍着玉手用力的鼓掌，笑盈盈的道：“牧尘赢得太漂亮了。”\n\n这两场战斗，牧尘完全没有丝毫试探的意思，一出手便是倾尽全力，甚至不惜暴露底牌，而如此一来，那战绩也是辉煌震撼得很，两招下来，赢得干脆利落，让人看得也是有些热血沸腾。\n\n一旁的萧潇也是螓首轻点，眸子中满是欣赏之色。\n\n“看来牧尘对这浮屠古族怨气很大啊。”倒是一旁的药尘呵呵一笑，他的眼力何等的老辣，一眼就看了出来，这是牧尘故意为之，因为他今日而来，本就是为了心中那口隐忍二十多年的一口气，这口气，为了他，为了他那夫妻分离，孤寂多年的爹，也为了他那被囚禁多年，不见天日的母亲，所以他要的胜利，不是那种势均力敌的激战，而是干脆利落，雷霆万钧。\n\n这样一来，那玄脉的脸面，可就丢得有点大了。\n\n“不过这种战斗方式，只能在有着绝对把握的情况下，若是两者战斗相仿，谁先暴露底牌，怕就得失去一些先机了。”林貂也是点评道，不过虽然这样说着，他的脸庞上，同样是有着欣赏之色，因为牧尘会选择这种战斗方式，那也就说明了他对自身的一种自信。\n\n这种自信，他也曾经在林动的身上见到过。\n\n...\n\n在那沉默的天地间，白玉石台上的黑光长老，也是面色有些阴沉的望着眼前信步而来的青年，望着后者，他眼神深处，也是掠过浓浓的忌惮之色。\n\n先前牧尘展现出来的手段，不管是那诡异的紫色火炎，还是那霸道无比的八部浮屠，都让得黑光长老心中泛着一丝惧意。\n\n他的实力，比玄海，玄风都要强，乃是灵品后期，但在面对着此时锐气逼人的牧尘时，他依旧是没有多少的底气。\n\n“该死，这个家伙怎么现在变得如此之强！”\n\n黑光心中怒骂，旋即生出一些后悔之意，他后悔的并不是为什么要招惹牧尘，而是后悔当初牧尘只是大圆满时，他为何不果决一些，直接出杀手。\n\n即便不必真的将其斩杀，但起码也要将其一身修为给废了，让得他从此变成一个废物，如此的话，也就没了今日的灾劫。\n\n“你是在想为什么当初没杀了我吗？”而在黑光目光闪烁的时候，牧尘盯着他，却是一笑，说道。\n\n黑光闻言，顿时哆嗦了一下，他能够感觉到，牧尘虽然在笑，在那言语间，却是弥漫着无尽的寒气甚至杀意。\n\n不过他毕竟也是浮屠古族的长老，地位显赫，很快渐渐的平复了心情，阴沉的盯着牧尘，道：“牧尘，你做事可不要太过分了，年轻人有锐气是好事，但若是太过，恐怕就得过刚易折了。”\n\n“你玄脉若是有本事，那就折给我看看吧。”牧尘漫不经心的道。\n\n“你！”\n\n黑光一怒，但瞧得牧尘那冰冷目光时，心头又是一悸，不由得羞恼至极。\n\n“还不出手吗？”牧尘盯着他，语气淡漠，然后他伸出手掌，修长如白玉，其上灵光跳跃：“若是不出手的话，那我就要动手了。”\n\n黑光闻言，恼怒得咬牙切齿，而就当他准备运转灵力时，忽有一道传音，落入耳中：“黑光，催动秘法，全力出手，即便不胜，也要将其锐气尽挫，接下来，自会有人收拾他。”\n\n听到这道传音，黑光目光顿时一闪，眼睛不着痕迹的扫了玄脉脉首玄光一眼，这道传音，显然就是来自于后者。\n\n“要催动秘法吗？”黑光踌躇了一下，一旦如此做的话，就算是以他天至尊的恢复力，也起码得虚弱大半年的时间。\n\n不过他也明白玄光的意图，现在的牧尘锐气太甚了，他一场场的打下来，就算到时候无法取胜四场，但也足以让他们玄脉搞得灰头土脸。\n\n眼下众多超级势力在观礼，若是传出去的话，说他们玄脉，被一个罪子横扫，这无疑会将他们玄脉的颜面丢光。\n\n所以，不管如何，黑光都不能再让牧尘如先前那般取得势如破竹般的战绩。\n\n必须将其阻拦下来，破其锐气，而接下来的第四场，他们玄脉，就能够派出仙品天至尊，到时候，要收拾这牧尘，自然是易如反掌。\n\n“好！”\n\n心中踌躇了一下，黑光终于是狠狠一咬牙，在见识了先前牧尘的手段后，即便是他，也是没把握能够接下牧尘的攻势，既然如此，还不如拼命一搏。\n\n“小辈，今日就让你知晓，什么叫做过刚易折！”\n\n黑光心中冷声说道，旋即他身形陡然暴射而退，同时讥讽冷笑道：“牧尘，休要得意，今日你也接我一招试试！”\n\n轰！\n\n随着其音落，只见得黑光身后，亿万道灵光交织，一座巨大的至尊法相现出身来，浩瀚的灵力风暴，肆虐在天地间。\n\n这至尊法相一出现，黑光也是深深的吸了一口气，双手陡然结出一道古怪印法。\n\n同时，其身后的至尊法相，也是双手结印。\n\n在那远处，清天，清萱等长老见到这一幕，瞳孔顿时一缩，骇然道：“无耻！竟然是化灵秘法！”\n\n在他们骇然失声时，那黑光则是对着牧尘露出狠辣笑容，森然道：“既然你咄咄逼人，那也怪不得老夫心狠手辣了。”\n\n话音落下，他的肚子陡然鼓胀起来，同时他身后的至尊法相，也是鼓起巨大的肚子，下一刻，他张开嘴巴，猛然一吐。\n\n黑光与身后的至尊法相嘴中，竟是有着星辰般的洪流远远不断的奔腾而出，那等声势，犹如是能够磨灭万古。\n\n而随着那星河般的洪流不断的呼啸而出，只见得黑光的身躯迅速的干枯，而那至尊法相，也是开始黯淡无光，仿佛两者之中的所有力量，都是化为了那无尽星辰洪流。\n\n天地间，众多天至尊见到这一幕，都是忍不住的面色一变，失声道：“这黑光疯了，竟然将至尊法相都是分解了？！”\n\n至尊法相乃是天至尊最强的战力之一，若是自我分解，那就得再度重新凝炼，那所需要消耗的时间与精力可是不少，而且说不定还会有着损伤。\n\n所以一般这种手段，极少人会动用，那是真正的损人不利己，杀敌一千，自损一千的同归于尽之法。\n\n呼呼！\n\n天地间，星辰洪流呼啸而过，对着牧尘笼罩而去，那等威势，仿佛就算是日月，都将会被消磨而灭。\n\n众多强者神色凝重，先前牧尘的锐气太甚，所以这黑光才会以这种极端的方式，试图将其阻扰，坏其锐气，保住玄脉的颜面。\n\n“黑光可真是狠辣，这下子，那牧尘可是遇见麻烦了。”\n\n...\n\n...',
    currentSectionNum: 1,
    scrollTop: 0,
    scrollTopBackUp: 0,
    newestSectionNum: 1,
    allSliderValue: {
      section: 1,
      bright: 1,
      font: 14 //单位px
    },
    isShowFontSelector: 0, //是否显示选择字体详情板块
    allFontFamily: ['使用系统字体', '微软雅黑', '黑体', 'Arial', '楷体', '等线'],
    currentFontFamily: '使用系统字体',
    lineHeight: 14, //单位px
    control: {
      all: 0,
      control_tab: 0,
      control_detail: 0,
      target: ''
    }, //all表示整个控制是否显示，第一点击显示，再一次点击不显示;target表示显示哪一个detail
    colorStyle: {
      content_bg: '#f8f7fc',
      styleNum: 1,
      slider_active_bg: '#757e87',
      slider_noactive_bg: '#dfdfdf',
      control_bg: '#ffffff',
      control_fontColor: '#616469'
    }, //1、2、3、4分别对应四种颜色模式
    isShowMulu: 0, // 是否显示左侧栏
    allSectionData: [], // 所有章节数据
    showReaderTips: true, // 是否展示阅读提示
    windows: {
      windows_height: 0,
      windows_width: 0
    }
  },
  onReady: function () {
    var self = this;
    // 判断是否需要显示提示
    var showReaderTips = wx.getStorageSync('show_reader_tips')
    if(showReaderTips || showReaderTips === ''){
      self.setData({ showReaderTips: true })
    }else{
      self.setData({ showReaderTips: false })
    }
    // 获取系统亮度，将亮度值默认设置为系统亮度
    wx.getScreenBrightness({
      success: res => {
        self.setData({
          'allSliderValue.bright': res.value
        })
      }
    })
    //读取用户设置
    var userSetting = wx.getStorageSync( 'reader_setting');
    if(userSetting){
      self.setData({
        'allSliderValue.bright': userSetting.allSliderValue.bright || self.data.allSliderValue.bright,
        'allSliderValue.font': userSetting.allSliderValue.font || self.data.allSliderValue.font,
        'colorStyle': userSetting.colorStyle || self.data.colorStyle
      })
    }
    // 设置背景色
    wx.setNavigationBarColor({
      frontColor: self.data.colorStyle.styleNum == 4 ? '#ffffff' : '#000000',
      backgroundColor: self.data.colorStyle.control_bg,
      animation: {
          duration: 0,
          timingFunc: 'easeIn'
      }
    })
    wx.getSystemInfo({
      success: function (res) {
        self.setData({
          'windows':{
            windows_height: res.windowHeight,
            windows_width: res.windowWidth
          }
        })
      }
    })
  },
  onLoad: function (options) {
    var self = this;
    //动态设置标题
    var bookid = options.bookid || '5a0d7a6ec38abf73e8e65cb3';
    self.setData({ bookid: bookid })
    // 初始化页面
    self.initPage()
  },
  //跳出页面执行函数
  onUnload: function () {
    //onUnload方法在页面被关闭时触发，我们需要将用户的当前设置存下来
    wx.setStorageSync('reader_setting', {
      allSliderValue: { bright: this.data.allSliderValue.bright, font: this.data.allSliderValue.font }, // 控制当前章节，亮度，字体大小
      colorStyle: this.data.colorStyle //当前的主题
    });
    this.updateRead();
  },
  //跳出页面执行函数
  onHide: function () {
    //onUnload方法在页面被关闭时触发，我们需要将用户的当前设置存下来
    wx.setStorageSync('reader_setting', {
      allSliderValue: { bright: this.data.allSliderValue.bright, font: this.data.allSliderValue.font }, // 控制当前章节，亮度，字体大小
      colorStyle: this.data.colorStyle //当前的主题
    });
    this.updateRead();
  },
  clickPage: function(event){
    var self = this;
    var y = event.detail.y;
    var h = self.data.windows.windows_height / 2;
    if (y && y >= (h - 75) && y <= (h + 75)) {
      // 显示控制栏
      self.setData({
        control: {
          all: self.data.control.all === 0 ? 1 : 0,
          control_tab: 1,
          control_detail: 1,
          target: self.data.control.target || 'jingdu'
        },
        isShowFontSelector: 0
      });
      return;
    }else if(y && y < (h - 75)){
      // 向上翻页
      let top = self.data.scrollTop - (self.data.windows.windows_height - 50)
      self.setData({ 'scrollTop': top >= 0 ? top : 0 })
    }else if(y && y > (h + 75)){
      // 向下翻页
      let top = self.data.scrollTop + (self.data.windows.windows_height - 50)
      self.setData({ 'scrollTop': top })
    }
  },
  sectionSliderChange: function (event) {
    var self = this;
    self.setData({
      'allSliderValue.section': event.detail.value
    });
    //根据章节id去得到章节内容
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/chapter/detail?bookid=' + self.data.bookid + '&chapter_num=' + event.detail.value,
      header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
      success(res) {
        if(res.data.ok){
          self.setData({ 
            'scrollTop': res.data.top,
            'currentSectionNum': res.data.data.num,
            'content': res.data.data.content,
            'factionTitle': res.data.data.name,
            'allSliderValue.section': res.data.data.num
          });
          wx.setNavigationBarTitle({
            title: res.data.bookname + ' • ' + res.data.data.name
          });
        }else{
          self.showToast('获取章节内容失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail(e) {
        self.showToast('获取章节内容失败', 'bottom')
      }
    })
  },
  brightSliderChange: function (event) {
    var self = this;
    var bright = event.detail.value / 100;
    wx.setScreenBrightness({
      value: bright
    });
    self.setData({
      'allSliderValue.bright': bright
    });
  },
  fontSliderChange: function (event) {
    var self = this;
    //重新计算分页
    self.setData({
      'allSliderValue.font': event.detail.value
    });
  },
  gotoControlDetail: function (event) {
    var self = this;
    var target = event.currentTarget.dataset.control;
    // 这里control_detail需要做两层判断，首先是control_detail之前是0还是1，0变成1,1变成0，其次是target在两次点击中是否相同，相同则继续上面的判断，否则取反
    var control_detail = null;
    if (self.data.control.control_detail == '0') {
      // 当control_detail不显示的时候不再判断两次点击的目标是否相同，直接统一显示
      control_detail = 1;
    } else {
      if (target && self.data.control.target == target) {
        control_detail = 0;
      } else {
        control_detail = 1;
      }
    }
    self.setData({
      control: {
        all: self.data.control.all,
        control_tab: 1,
        control_detail: control_detail,
        target: target
      }
    });
  },
  //点击切换颜色
  switchColorStyle: function (event) {
    var self = this;
    var styleNum = event.currentTarget.dataset.stylenum;
    switch (styleNum) {
      case '1':
        self.setData({
          colorStyle: {
            content_bg: '#f8f7fc',
            styleNum: 1,
            slider_active_bg: '#757e87',
            slider_noactive_bg: '#dfdfdf',
            control_bg: '#ffffff',
            control_fontColor: '#616469'
          }
        });
        break;
      case '2':
        self.setData({
          colorStyle: {
            content_bg: '#f6f0da',
            styleNum: 2,
            slider_active_bg: '#766f69',
            slider_noactive_bg: '#dad4c4',
            control_bg: '#faf4e4',
            control_fontColor: '#60594f'
          }
        });
        break;
      case '3':
        self.setData({
          colorStyle: {
            content_bg: '#c0edc6',
            styleNum: 3,
            slider_active_bg: '#657568',
            slider_noactive_bg: '#aeccd6',
            control_bg: '#ccf1d0',
            control_fontColor: '#44644c'
          }
        });
        break;
      case '4':
        self.setData({
          colorStyle: {
            content_bg: '#1d1c21',
            styleNum: 4,
            slider_active_bg: '#53565d',
            slider_noactive_bg: '#1a1e21',
            control_bg: '#10131a',
            control_fontColor: '#5b5e65'
          }
        });
        break;
    }
    // 设置背景色
    wx.setNavigationBarColor({
      frontColor: self.data.colorStyle.styleNum == 4 ? '#ffffff' : '#000000',
      backgroundColor: self.data.colorStyle.control_bg,
      animation: {
          duration: 0,
          timingFunc: 'easeIn'
      }
    })
  },
  selectFontFamily: function () {
    this.setData({
      isShowFontSelector: 1
    });
  },
  closeFontSelector: function () {
    this.setData({
      isShowFontSelector: 0
    });
  },
  changeFontFamily: function (event) {
    this.setData({
      currentFontFamily: event.currentTarget.dataset.fontname
    });
    //todo 执行改变字体后的重新排版
  },
  //打开目录侧边栏
  openMulu: function () {
    var self = this;
    var bookid = self.data.bookid;
    var sectionNum = self.data.allSliderValue.section;
    wx.request({
      url: config.base_url + '/api/chapter/list?bookid=' + self.data.bookid,
      success: res => {
        if(res.data.ok){
          self.setData({ 'allSectionData': res.data.data.chapters, 'isShowMulu': 1 })
        }else{
          self.showToast('获取目录失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail: err => {
        self.showToast('获取目录失败', 'bottom')
      }
    })
  },
  //点击目录某一章
  showThisSection: function (event) {
    var self = this;
    var chapterid = event.currentTarget.dataset.chapterid;
    //根据章节id去得到章节内容
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/chapter/detail?bookid=' + self.data.bookid + '&chapter_id=' + chapterid,
      header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
      success(res) {
        if(res.data.ok){
          self.setData({ 
            'scrollTop': res.data.top,
            'currentSectionNum': res.data.data.num,
            'content': res.data.data.content,
            'factionTitle': res.data.data.name,
            'allSliderValue.section': res.data.data.num
          });
          wx.setNavigationBarTitle({
            title: res.data.bookname + ' • ' + res.data.data.name
          });
        }else{
          self.showToast('获取章节内容失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail(e) {
        self.showToast('获取章节内容失败', 'bottom')
      }
    })
  },
  initPage: function(){
    var self = this;
    wx.request({
      'url': config.base_url + '/api/chapter/detail?bookid=' + self.data.bookid,
      header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
      success: res => {
        if(res.data.ok){
          self.setData({ 
            'newestSectionNum': res.data.newest,
            'scrollTop': res.data.top,
            'currentSectionNum': res.data.data.num,
            'allSliderValue.section': res.data.data.num,
            'factionName': res.data.bookname,
            'factionTitle': res.data.data.name,
            'content': res.data.data.content,
            'author': res.data.author,
            'headImg': res.data.headimg
          });
          wx.setNavigationBarTitle({
            title: res.data.bookname + ' • ' + res.data.data.name
          });
        }else{
          self.showToast('获取章节内容失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
          // 展示无数据按钮
        }
      },
      fail: err => {
        self.showToast('获取章节内容失败', 'bottom')
      }
    })
  },
  updateRead: function(){
    var self = this;
    wx.request({
      method: 'POST',
      url: config.base_url + '/api/booklist/update_read',
      header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
      data: {
        bookid: self.data.bookid,
        chapter_num: self.data.currentSectionNum,
        chapter_page_top: self.data.scrollTopBackUp
      }
    })
  },
  closeReaderTips: function(){
    var self = this;
    self.setData({ showReaderTips: false })
    wx.setStorageSync('show_reader_tips', false)
  },
  searchChapter: function(event){
    var self = this;
    wx.request({
      url: config.base_url + '/api/chapter/search?bookid=' + self.data.bookid + '&str=' + event.detail.value,
      success:res => {
        if(res.data.ok){
          self.setData({ 'allSectionData': res.data.data.chapters })
        }else{
          self.showToast('未找到相应章节' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail: err => {
        self.showToast('未找到相应章节', 'bottom')
      }
    })
  },
  closeMulu: function(event){
    var self = this;
    var x = event.detail.x;
    var w = self.data.windows.windows_width * 0.92;
    if (x > w) {
      // 显示控制栏
      self.setData({
        'control': {
          all: 0,
          control_tab: 0,
          control_detail: 0,
          target: self.data.control.target || 'jingdu'
        },
        'isShowMulu': 0
      });
    }
  },
  readerScrollTop: function(event){
    this.setData({ 'scrollTopBackUp': event.detail.scrollTop })
  },
  showToast: function (content, position) {
    let self = this
    self.setData({
      'toast': {
        show: true,
        content: content,
        position: position
      }
    })
    setTimeout(function () {
      self.setData({
        'toast': {
          show: false,
          content: '',
          position: 'bottom'
        }
      })
    }, 3000)
  },
});
