// 名人堂自定义头像配置
// 格式：{ "名称": "头像URL" }
// 开发者可在此文件中修改配置
const customAvatars = {
    "垃圾桶": "https://q1.qlogo.cn/g?b=qq&nk=575244421&s=640",
    "梦中水": "https://static.codemao.cn/pickduck/HkM3AfCrll.jpg?hash=Flpf_3gPYeybDTRe5AD5zZDl5FmY",
    "风哲": "https://static.codemao.cn/pickduck/Hyw0KWRhlx.jpg?hash=FiUjyERA6aApTCDEb6TYzCvOL4wR",
    "小猫": "https://static.codemao.cn/pickduck/SJ3pQMXueg.jpg?hash=FoVrX6JKsBAGl1TFVemZ7IBujIAL"
};

// 默认 Logo URL
const DEFAULT_LOGO_URL = "https://static.codemao.cn/pickduck/rk_gX8cSlx.png?hash=FledMqVJIqXs3At0Xl317dAny1jZ";

// 获取自定义头像
function getCustomAvatar(name) {
    return customAvatars[name] || null;
}
