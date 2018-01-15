//進入全屏
function launchFullscreen(element) {
    //此方法不可以在異步任務中執行，否則火狐無法全屏
    var videoElement = element.parents('.jmb-video').children('video')
    if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen()
    } else if (videoElement.mozRequestFullScreen) {
        videoElement.mozRequestFullScreen()
    } else if (videoElement.msRequestFullscreen) {
        videoElement.msRequestFullscreen()
    } else if (videoElement.oRequestFullscreen) {
        videoElement.oRequestFullscreen()
    }
    else if (0 && videoElement.webkitRequestFullScreen) {
        videoElement.webkitRequestFullScreen()
    } else {
        callNativeHandler(
            'startPlugin',
            {
                'params': { 'url': videoElement.attr('src'), 'title': videoElement.data('title') },
                'cname': 'com.hexin.videoplayplugin.VideoPlayerActivityWithNoSD',
                'pname': 'com.hexin.videoplayplugin',
                'scheme': 'thsvideo'
            },
            function (data) { }
        )
        // moni fullscreen
        // var docHtml = document.documentElement
        // var docBody = document.body
        // var videobox = document.querySelector('.jmb-video')
        // var width = $('body').width()
        // var height = $('body').height()
        // // videobox.style.cssText = "display: none;"
        // docBody.appendChild(videobox)
        // videobox = document.querySelector('.jmb-video')
        // videobox.style.cssText = 'transform: rotate(90deg);position: absolute;top: 0px;left: 0px;height: ' + width + 'px;width: ' + height + 'px; background: #000'
        // videobox.style.cssText = 'transform: rotate(90deg);position: absolute;top: ' + $('.jmb-video').offset().left + 'px;left: ' + $('.jmb-video').offset().top + 'px;height: ' + width + 'px;width: ' + height + 'px; background: #000'
        // var videoEle = document.querySelector('.jmb-video video')
        // videoEle.style.cssText = 'height: ' + width + 'px; width: ' + height + 'px'
        // videoEle.play()
        // document.IsFullScreen = true
    }
}

$.fn.mediaBox = function (option) {
    var defOpt = {
        media: null,
        onStalled: null,
        onError: null,
        onPlay: null,
        onPause: null,
        onTimeupdate: null,
        onBtnEvent: null
    };
    option = $.extend(defOpt, option);
    var sec2time = function (time, format) {
        format = format || 'hh:mm:ss';
        var o;
        if (/(h+)/.test(format)) {
            var ht = Math.floor(time % 3600);
            o = {
                "h+": Math.floor(time / 3600), //hour
                "m+": Math.floor(ht / 60), //minute
                "s+": Math.floor(ht % 60) //second
            };
        } else {
            o = {
                "m+": Math.floor(time / 60), //minute
                "s+": Math.floor(time % 60) //second
            };
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
            }
        }
        return format;
    };
    //进度条拖拽控制
    var sliderBarCtrl = function (media, $progressBar, $slider, $progressVal, $curTime) {
        var lastX, draging, progressWidth = $progressBar.width();
        $slider.on('touchstart', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var et = e.changedTouches[0];
            draging = true;
            lastX = et.clientX;
        });
        $(document).on('touchmove', function (e) {
            var et = e.changedTouches[0];
            if (draging) {
                e.preventDefault();
                e.stopPropagation();
                media.pause();//拖拽时暂停视频播放，否则滑块继续走动会阻碍拖拽事件
                var diffX = et.clientX - lastX;
                var width = parseFloat($progressVal.width());//已播放进度条宽度px值
                width += diffX;
                width = width / progressWidth * 100;//已播放进度条宽度转为百分比宽度
                if (width <= 0) {
                    width = 0
                } else if (width >= 100) {
                    width = 100
                }
                $progressVal.width(width + '%');
                var curTime = $curTime.html();
                curTime = curTime.replace(/[\d-]/g, '-');
                var i = curTime.match(/(--)/g).length;
                var format = curTime.replace(/[\d-]{2}/g, function () {
                    switch (i--) {
                        case 3:
                            return 'hh';
                        case 2:
                            return 'mm';
                        case 1:
                            return 'ss';

                    }
                });
                $curTime.html(sec2time(media.duration * width / 100, format));
                lastX = et.clientX;
            }
        });
        $(document).on('touchend', function (e) {
            if (draging) {
                draging = false;
                var progressVal = parseFloat($progressVal.css('width'));
                var currentTime = parseInt(progressVal / 100 * media.duration);
                var bufferedTime = media.buffered.end(0);
                if (bufferedTime > currentTime) {//如果缓冲最大时间超过预设时间
                    media.currentTime = currentTime;
                } else {//如果预设时间超过缓冲最大时间，即还未缓冲加载到指定时间，就将指定时间改回缓冲最大时间，否则画面会静止不动直到缓冲时间走到指定时间
                    $progressVal.width(bufferedTime / media.duration * 100 + '%');
                    media.currentTime = bufferedTime - 5;
                }
                media.play();
            }
        });
    };
    if (option.media == 'video') {//视频
        this.each(function () {
            var $this = $(this);
            var videoUrl = '', posterUrl = '';
            if ($this.is('video')) {
                videoUrl = $this.attr('src');
                posterUrl = $this.attr('poster');
                posterUrl = posterUrl ? 'url(' + posterUrl + ')' : $this.css('backgroundImage');
            } else {
                var _video = $this.find('video');
                posterUrl = _video.attr('poster');
                if ($this.css('backgroundImage')) {
                    posterUrl = $this.css('backgroundImage');
                } else if (_video.css('backgroundImage')) {
                    posterUrl = _video.css('backgroundImage');
                } else {
                    posterUrl = 'url(' + posterUrl + ')';
                }
                videoUrl = _video.attr('src');
            }
            var $video = $('<video src="' + videoUrl + '" webkit-playsinline="true" preload="metadata"></video>');
            var video = $video[0];
            var $videoBox = $('<div class="jmb-video"></div>');
            var $loading = $('<div class="jmb-loading" style="display: none;"><div class="jmb-loader"></div></div>');
            var $toast = $('<div class="jmb-toast" style="display: none;" ></div>');
            var $toastTxt = $('<span class="jmb-toast-text"></span>');
            var $poster = $('<div class="jmb-poster"></div>');
            var $ctrl = $('<div class="jmb-ctrl-bar"></div>');
            var $play = $('<div class="jmb-play"></div>');
            var $btn = $('<div class="jmb-btn"></div>');
            var $progress = $('<div class="jmb-progress"></div>');
            var $curTime = $('<div class="jmb-cur-time">--:--:--</div>');
            var $totalTime = $('<div class="jmb-total-time">--:--:--</div>');
            var $fullscreen = $('<div class="jmb-fullscreen"></div>');
            var $progressBar = $('<div class="jmb-progress-bar"></div>');
            var $progressVal = $('<div class="jmb-progress-val"></div>');
            var $progressBuffer = $('<div class="jmb-progress-buffer"></div>');
            var $slider = $('<i class="jmb-progress-slider"></i>');
            $progressVal.append($slider);
            $progressBar.append($progressBuffer).append($progressVal);
            $progress.append($curTime).append($progressBar).append($totalTime).append($fullscreen);
            $toast.append($toastTxt);
            $ctrl.append($play).append($progress);
            $videoBox.append($video);
            $video.after($toast).after($poster).after($ctrl).after($loading);
            $this.replaceWith($videoBox);

            var playImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAMAAAAPdrEwAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5LjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjQ4RkZGNkE0QTRGNTExRTc5MDI0RjIxM0RFMzM0RTA4IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjQ4RkZGNkE1QTRGNTExRTc5MDI0RjIxM0RFMzM0RTA4Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NDhGOTY1QzNBNEY1MTFFNzkwMjRGMjEzREUzMzRFMDgiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NDhGOTY1QzRBNEY1MTFFNzkwMjRGMjEzREUzMzRFMDgiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7O2GX9AAAABlBMVEX///8AAABVwtN+AAAAAnRSTlP/AOW3MEoAAAGQSURBVHja7NnLFsIwCATQ4f9/2p1am5AZGDwu7NbkGmseQBDUg8tD9hFVgUfJpXRU3bOODpzj6MEZji68x0HJpwYszf3ecyvkffiZSdDSskgbY99Y3gFyWt0nssGgK+9tLBuF9qxtGORNTzjkdV9Y5GVveORV/xsd4bLhku8EPK9jZcM26A1tkT+ZCx3hsd9omGnc6AjrsOEc9NUGMWjlazVaiyFfrcHK4okm0hikKfzZEtSfWAggCvQ5rG7QGKSpeO1Fq7kBMWwiuJezgS59Xr0NepsNOGhgkE7sQRp/2vuu52bI2LweW43nPWRw5yvR1FlQOgpCOgp+4WxUTnQpDmFqcDV6LHrSYz5rpFqhW/F1NkmqWYE/l4E/A7ulSfa8Ed/Jdk32HL2uLAzWQyarOJO1p66dVMwm63yW6uSR9tdU5eJ1PiRE1ybr1+pBmI4GvRpFesPSKVKINxx04FG4l6FCMSo74APfwyckrV2whUbz+B4gJ0DhmlS4QJNDeGVRiIG2upqFmFXb4ZQN8SHAADl2Flabp2m3AAAAAElFTkSuQmCC';
            $poster.css({
                'background-image': 'url("' + playImage + '"),' + posterUrl,
                'background-repeat': 'no-repeat,no-repeat',
                'background-position': 'center center,center center',
                'background-size': '45px,cover',
                'border-radius': '0.08rem'
            });
            $ctrl.css({
                'border-radius': '.08rem'
            })
            var toastCloseTimer;
            var toast = function (text) {
                var methods = {
                    open: function () {
                        $toast.show();
                        $toastTxt.html(text);
                        clearTimeout(toastCloseTimer);
                        toastCloseTimer = setTimeout(function () {
                            methods.close();
                        }, 1888);
                    },
                    close: function () {
                        $toast.hide();
                        $toastTxt.text('');
                    }
                };
                if (text) {
                    methods.open();
                } else {
                    methods.close();
                }
            };
            $poster.on('click', function () {
                // play id stat
                $poster.hide();
                $ctrl.css({
                    'border-radius': '0'
                })
                video.play();
                $play.on('click', function (e) {
                    if (video.paused) {
                        video.play();
                    } else {
                        video.pause();
                    }
                });
                $fullscreen.on('click', function (e) {
                    if (getPlatform() !== 'iphone') {
                        var $this = $(this)
                        launchFullscreen($this)
                    } else {
                        video.webkitEnterFullScreen();
                    }
                });
            });
            $videoBox.on('click', function () {
                if ($ctrl.css("display") == "block") {
                    $ctrl.fadeOut();
                } else if ($ctrl.css("display") == "none") {
                    $ctrl.fadeIn();
                }
            });
            $ctrl.on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
            });
            $video.on('loadedmetadata', function () {
                $curTime.html(sec2time(video.currentTime));
                if(isFinite(video.duration)){
                    $totalTime.html(sec2time(video.duration));
                }else{
                    $totalTime.html('--:--:--');
                    (function(){
                        var timmer = setInterval(function(){
                            $('.shipin .title').html(video.duration)
                            if(isFinite(video.duration)){
                                $totalTime.html(sec2time(video.duration));
                                clearInterval(timmer)
                            }
                        }, 300)
                    })()
                }
                $video.addClass('played');
                sliderBarCtrl(video, $progressBar, $slider, $progressVal, $curTime);
            });
            $video.on('error', function (e) {//视频加载失败
                if (typeof option.onError == 'function') {
                    option.onError();
                } else {
                    toast('视频加载失败');
                }
                $loading.hide();
            });
            $video.on('stalled', function (e) {//网络状况不佳
                if (typeof option.onStalled == 'function') {
                    option.onStalled();
                } else {
                    toast('网络状况不佳');
                }
            });
            $video.on('waiting', function () {
                $loading.show();
            });
            $video.on('playing', function () {
                $loading.hide();
            });
            var progressTimer = setInterval(function () {//缓冲进度条监听事件，progress不靠谱
                if (video.buffered.length) {
                    if (video.currentTime + 1 >= video.buffered.end(0)) {//播放进度濒临缓冲进度
                        $loading.show();
                    } else {
                        $loading.hide();
                    }
                    $progressBuffer.width((video.buffered.end(0) / video.duration * 100) + '%');
                    if (video.buffered.end(0) == video.duration) {
                        clearInterval(progressTimer);
                    }
                }
            }, 1000);
            $video.on('timeupdate', function (e) {//播放进度条监听事件
                $curTime.html(sec2time(video.currentTime));
                $progressVal.width((video.currentTime / video.duration * 100) + '%');
                typeof option.onTimeupdate == 'function' && option.onTimeupdate();

            });
            $video.on('play', function () {
                $videoBox.addClass('playing');
                typeof option.onPlay == 'function' && option.onPlay();
            });
            $video.on('pause', function () {
                $videoBox.removeClass('playing');
                typeof option.onPause == 'function' && option.onPause();
            });
            if (option.onBtnEvent) {
                $ctrl.append($btn);
                $btn.on('click', function (e) {
                    typeof option.onBtnEvent == 'function' && option.onBtnEvent();
                });
            }
        });
    } else if (option.media == 'audio') {//音频
        this.each(function () {
            var $this = $(this);
            var audioUrl = '';
            if ($this.is('audio')) {
                audioUrl = $this.attr('src');
            } else {
                var _video = $this.find('audio');
                audioUrl = _video.attr('src');
            }
            var $audio = $('<audio src="' + audioUrl + '" preload="metadata"></audio>');
            var audio = $audio[0];
            var $audioBox = $('<div class="jmb-audio"></div>');
            var $ctrl = $('<div class="jmb-ctrl-bar"></div>');
            var $play = $('<div class="jmb-play"></div>');
            var $btn = $('<div class="jmb-btn"></div>');
            var $progress = $('<div class="jmb-progress"></div>');
            var $curTime = $('<div class="jmb-cur-time">--:--</div>');
            var $totalTime = $('<div class="jmb-total-time">--:--</div>');
            var $fullscreen = $('<div class="jmb-fullscreen"></div>');
            var $progressBar = $('<div class="jmb-progress-bar"></div>');
            var $progressVal = $('<div class="jmb-progress-val"></div>');
            var $progressBuffer = $('<div class="jmb-progress-buffer"></div>');
            var $slider = $('<i class="jmb-progress-slider"></i>');
            $progressVal.append($slider);
            $progressBar.append($progressBuffer).append($progressVal);
            $progress.append($progressBar).append($curTime).append('<span class="jmb-separator">/</span>').append($totalTime).append($fullscreen);
            $ctrl.append($play).append($progress);
            $audioBox.append($audio).append($ctrl);
            $this.replaceWith($audioBox);

            $play.on('click', function (e) {
                if (audio.paused) {
                    audio.play();
                } else {
                    audio.pause();
                }
            });

            $fullscreen.on('click', function (e) {
                $audio.webkitEnterFullScreen();
            });

            $audio.on('loadedmetadata', function () {
                $curTime.html(sec2time(audio.currentTime, 'mm:ss'));
                $totalTime.html(sec2time(audio.duration, 'mm:ss'));
                $audio.addClass('played');
                sliderBarCtrl(audio, $progressBar, $slider, $progressVal, $curTime);
            });
            $audio.on('error', function (e) {//视频加载失败
                if (typeof option.onError == 'function') {
                    option.onError();
                } else {
                    alert('视频加载失败');
                }
            });
            $audio.on('stalled', function (e) {//网络状况不佳
                if (typeof option.onStalled == 'function') {
                    option.onStalled();
                } else {
                    alert('网络状况不佳');
                }
            });
            $audio.on('waiting', function () {
                //                    console.log('waiting');
                //                    $loading.show();
            });
            $audio.on('playing', function () {
                //                    console.log('playing');
                //                    $loading.hide();
            });
            var progressTimer = setInterval(function () {//缓冲进度条监听事件，progress不靠谱
                if (audio.buffered.length) {
                    //                        if (audio.currentTime + 1 >= audio.buffered.end(0)) {//播放进度濒临缓冲进度
                    //                            $loading.show();
                    //                        } else {
                    //                            $loading.hide();
                    //                        }
                    $progressBuffer.width((audio.buffered.end(0) / audio.duration * 100) + '%');
                    if (audio.buffered.end(0) == audio.duration) {
                        clearInterval(progressTimer);
                    }
                }
            }, 1000);
            $audio.on('timeupdate', function (e) {//播放进度条监听事件
                $curTime.html(sec2time(audio.currentTime, 'mm:ss'));
                $progressVal.width((audio.currentTime / audio.duration * 100) + '%');
                typeof option.onTimeupdate == 'function' && option.onTimeupdate();

            });
            $audio.on('play', function () {
                $audioBox.addClass('playing');
                typeof option.onPlay == 'function' && option.onPlay();
            });
            $audio.on('pause', function () {
                $audioBox.removeClass('playing');
                typeof option.onPause == 'function' && option.onPause();
            });
            if (option.onBtnEvent) {
                $ctrl.append($btn);
                $btn.on('click', function (e) {
                    typeof option.onBtnEvent == 'function' && option.onBtnEvent();
                });
            }
        });
    }
};
