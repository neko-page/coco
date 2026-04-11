// 名人堂自定义头像配置
// 格式：{"名称":"头像URL"}
// 开发者可在此文件中修改配置
const customAvatars = {
    "垃圾桶": "https://q1.qlogo.cn/g?b=qq&nk=575244421&s=640",
    "梦中水大嘿客": "https://static.codemao.cn/pickduck/HkM3AfCr11.jpg?hash=FIpf_3gPYeybDTRe5AD5zZDl5FmY",
    "风哲": "https://static.codemao.cn/pickduck/Hyw0KWRhlx.jpg?hash=FiUjyERA6aApTCDEb6TYzCvOL4wR",
    "小猫": "https://static.codemao.cn/pickduck/SJ3pQMXueg.jpg?hash=FoVrX6JKsBAGl1TFVemZ7IBujIAL"
};

// 默认 Logo URL
const DEFAULT_LOGO_URL = "https://static.codemao.cn/pickduck/rk_gX8cS1x.png?hash=FledMqVJIqXs3At0Xl3I7dAnyIJZ";

// ✅ 关键修复：挂载到 window 对象，确保 script.js 可以访问
window.customAvatars = customAvatars;
window.DEFAULT_LOGO_URL = DEFAULT_LOGO_URL;

// 获取自定义头像
function getCustomAvatar(name) {
    return customAvatars[name] || null;
}

// ✅ 也挂载函数到 window
window.getCustomAvatar = getCustomAvatar;
