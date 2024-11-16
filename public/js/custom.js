// 自定义页面标题变化脚本
var originalTitle = document.title;
var timeout;
document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
        document.title = '欢迎回来!💝' + originalTitle;
        timeout = setTimeout(function () {
            document.title = originalTitle;
        }, 3000);
    } else {
        document.title = '你不要我了么w(ﾟДﾟ)w';
        clearTimeout(timeout);
    }
});