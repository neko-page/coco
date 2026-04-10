// 名人堂自定义头像配置
// 格式：{ "名称": "头像URL" }
// 开发者可在此文件中修改配置
const customAvatars = {
    "垃圾桶": "https://static.codemao.cn/pickduck/HyIQDQmdle.png?hash=FpoaZzw8idNDN2k8koxti2PWQHl_",
    "梦中水": "https://shequ.codemao.cn/user/15980757",
    "风哲": "https://static.codemao.cn/pickduck/Hk5dtZA2ee.png?hash=FrHNdFMuCcYJxY8ZzoHV-Csrfch8",
    "小猫": "https://static.codemao.cn/pickduck/HyIQDQmdle.png?hash=FpoaZzw8idNDN2k8koxti2PWQHl_"
};

// 默认 Logo URL
const DEFAULT_LOGO_URL = "https://static.codemao.cn/pickduck/rk_gX8cSlx.png?hash=FledMqVJIqXs3At0Xl317dAny1jZ";

// 获取自定义头像
function getCustomAvatar(name) {
    return customAvatars[name] || null;
}