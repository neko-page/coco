// ==================== 全局状态 ====================
let resources = {};
let currentCategory = 'all';
let confirmJump = false;
let currentCardData = null;

// 收藏夹列表 (从 localStorage 读取)
const FAVORITES_KEY = 'coco_nav_favorites';
let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');

// 默认配置（内置 fallback）
const DEFAULT_CONFIG = {
    DEFAULT_LOGO_URL: 'https://static.codemao.cn/pickduck/rk_gX8cSlx.png?hash=FledMqVJIqXs3At0Xl317dAny1jZ',
    customAvatars: {
        '垃圾桶': 'https://neko-page.github.io/src/coco/img/permission.png',
        '梦中水': 'https://shequ.codemao.cn/user/15980757',
        '小猫': 'https://static.codemao.cn/pickduck/HyIQDQmdle.png?hash=FpoaZzw8idNDN2k8koxti2PWQHl_',
        '风哲': 'https://static.codemao.cn/pickduck/Hk5dtZA2ee.png?hash=FrHNdFMuCcYJxY8ZzoHV-Csrfch8'
    }
};

// 获取配置
const DEFAULT_LOGO_URL = window.DEFAULT_LOGO_URL || DEFAULT_CONFIG.DEFAULT_LOGO_URL;
const customAvatars = window.customAvatars || DEFAULT_CONFIG.customAvatars;

function getCustomAvatar(name) {
    return customAvatars[name] || null;
}

// ==================== DOM 元素缓存 ====================
let contentArea, searchInput, settingsBtns, settingsModal, confirmModal;
let confirmToggle, saveSettingsBtn, logoUrlInput, loadModeRadios;
let siteLogo, themeToggle;

// ==================== 初始化入口 ====================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        cacheDOMElements();
        loadSettings();
        setupEventListeners();
        
        // 默认激活"全部"
        setActiveCategory('all');
        
        // 加载数据并渲染
        await loadData();
        renderContent();
        
        console.log('✅ 初始化完成');
    } catch (error) {
        console.error('❌ 初始化失败:', error);
        showFatalError('页面初始化失败，请刷新重试', error);
    }
});

function cacheDOMElements() {
    contentArea = document.getElementById('contentArea');
    searchInput = document.getElementById('searchInput');
    settingsBtns = document.querySelectorAll('.settings-btn');
    settingsModal = document.getElementById('settingsModal');
    confirmModal = document.getElementById('confirmModal');
    confirmToggle = document.getElementById('confirmToggle');
    saveSettingsBtn = document.getElementById('saveSettings');
    logoUrlInput = document.getElementById('logoUrlInput');
    loadModeRadios = document.getElementsByName('loadMode');
    siteLogo = document.getElementById('siteLogo');
    themeToggle = document.querySelector('.theme-toggle');
}

// ==================== 数据加载 ====================
async function loadData() {
    const loadMode = localStorage.getItem('loadMode') || 'cdn';
    try {
        if (loadMode === 'cdn') {
            await loadFromCDN();
        } else {
            await loadFromLocal();
        }
        console.log(`✅ 数据加载成功（${loadMode} 模式）`);
    } catch (error) {
        console.error('❌ 数据加载失败:', error);
        showDataError(error);
        resources = {};
    }
}

async function loadFromCDN() {
    // 修正后的路径：neko-page/src 仓库，coco 分支
    const cdnUrl = 'https://cdn.jsdelivr.net/gh/neko-page/src@coco/main/resources.js';
    const response = await fetch(cdnUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const text = await response.text();
    const match = text.match(/export const resources = ({[\s\S]*?});\s*$/m);
    if (!match || !match[1]) throw new Error('无法解析资源数据');
    
    resources = new Function('return ' + match[1])();
}

async function loadFromLocal() {
    try {
        const module = await import('./数据存储.js');
        resources = module.resources || {};
    } catch (error) {
        if (window.resources) {
            resources = window.resources;
        } else {
            throw error;
        }
    }
}

// ==================== 设置管理 ====================
function loadSettings() {
    const savedLogo = localStorage.getItem('siteLogo');
    if (savedLogo && siteLogo) {
        siteLogo.src = savedLogo;
        if (logoUrlInput) logoUrlInput.value = savedLogo;
    } else if (logoUrlInput) {
        logoUrlInput.value = DEFAULT_LOGO_URL;
    }
    
    const savedConfirm = localStorage.getItem('confirmJump');
    if (savedConfirm === 'true' && confirmToggle) {
        confirmJump = true;
        confirmToggle.classList.add('active');
    }
    
    const savedLoadMode = localStorage.getItem('loadMode') || 'cdn';
    if (loadModeRadios) {
        for (const radio of loadModeRadios) {
            if (radio.value === savedLoadMode) radio.checked = true;
        }
    }
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function saveSettings() {
    let logoUrl = logoUrlInput ? logoUrlInput.value.trim() : '';
    if (logoUrl) {
        if (!logoUrl.startsWith('https://')) {
            alert('⚠️ 请使用 HTTPS 开头的图片链接！');
            return;
        }
        localStorage.setItem('siteLogo', logoUrl);
        if (siteLogo) siteLogo.src = logoUrl;
    }
    
    localStorage.setItem('confirmJump', confirmJump);
    if (loadModeRadios) {
        for (const radio of loadModeRadios) {
            if (radio.checked) {
                localStorage.setItem('loadMode', radio.value);
                break;
            }
        }
    }
    
    if (settingsModal) settingsModal.classList.remove('active');
    renderContent();
}

// ==================== 事件绑定 ====================
function setupEventListeners() {
    if (!contentArea) return;
    
    // 侧边栏点击
    document.querySelectorAll('.sidebar-item[data-category]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const category = item.dataset.category;
            if (category) {
                setActiveCategory(category);
                renderContent();
            }
        });
    });
    
    // 设置按钮
    if (settingsBtns) {
        settingsBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (settingsModal) settingsModal.classList.add('active');
            });
        });
    }
    
    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveSettings);
    
    [settingsModal, confirmModal].forEach(modal => {
        if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
    });
    
    if (confirmToggle) {
        confirmToggle.addEventListener('click', () => {
            confirmJump = !confirmJump;
            confirmToggle.classList.toggle('active');
        });
    }
    
    document.getElementById('confirmCancel')?.addEventListener('click', () => confirmModal?.classList.remove('active'));
    document.getElementById('confirmProceed')?.addEventListener('click', () => {
        if (currentCardData) {
            window.open(currentCardData.link, '_blank');
            confirmModal?.classList.remove('active');
        }
    });
    
    if (searchInput) searchInput.addEventListener('input', debounce(() => renderContent(), 300));
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                localStorage.setItem('theme', 'dark');
            }
        });
    }
}

// ==================== 内容渲染 ====================
function renderContent() {
    if (!contentArea) return;
    contentArea.innerHTML = '';
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    if (!resources || Object.keys(resources).length === 0) {
        contentArea.innerHTML = `<div class="empty-state"><i class="fas fa-database"></i><h3>无法加载资源列表</h3><p>请检查网络或切换本地模式</p></div>`;
        return;
    }
    
    // 特殊处理：收藏夹
    if (currentCategory === 'favorites') {
        renderFavorites(searchTerm);
        return;
    }
    
    if (currentCategory === 'all') {
        for (const [category, items] of Object.entries(resources)) {
            const filtered = items.filter(item => item.name.toLowerCase().includes(searchTerm) || item.description.toLowerCase().includes(searchTerm));
            if (filtered.length > 0) createCategorySection(category, filtered);
        }
    } else {
        const items = resources[currentCategory] || [];
        const filtered = items.filter(item => item.name.toLowerCase().includes(searchTerm) || item.description.toLowerCase().includes(searchTerm));
        if (filtered.length > 0) createCategorySection(currentCategory, filtered);
    }
}

// 渲染收藏夹
function renderFavorites(searchTerm) {
    const favItems = [];
    for (const items of Object.values(resources)) {
        items.forEach(item => {
            if (favorites.includes(item.name)) {
                favItems.push({ ...item, originalCategory: items === resources.tool ? 'tool' : 'editor' }); // 粗略记录分类以便图标显示
            }
        });
    }
    
    // 简单过滤
    const filtered = favItems.filter(item => item.name.toLowerCase().includes(searchTerm));
    
    if (filtered.length === 0) {
        contentArea.innerHTML = `<div class="empty-state"><i class="fas fa-heart" style="color:var(--text-secondary)"></i><h3>还没有收藏任何资源</h3><p>点击卡片右上角的爱心来添加收藏</p></div>`;
    } else {
        const section = document.createElement('div');
        section.className = 'category-section';
        section.innerHTML = `<div class="category-header"><i class="fas fa-heart category-icon" style="color:var(--danger-color)"></i><h2 class="category-title">我的收藏</h2><span class="category-count">共 ${filtered.length} 个功能</span></div>`;
        const grid = document.createElement('div');
        grid.className = 'cards-grid';
        filtered.forEach(item => {
            grid.appendChild(createCard(item, item.originalCategory || 'tool', true));
        });
        section.appendChild(grid);
        contentArea.appendChild(section);
    }
}

function setActiveCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.category === category) item.classList.add('active');
    });
}

function createCategorySection(category, items) {
    const section = document.createElement('div');
    section.className = 'category-section';
    
    const names = { 'all': '全部功能', 'tool': '通用工具', 'api': 'API接口', 'component': '控件库', 'data': '数据', 'editor': '编辑器', 'kongjianshangcheng': '控件商城', 'tutorial': '教程手册', 'ui': 'UI资源', 'mengzhongshui': '梦众/名人堂', 'teshu': '特殊', 'maotool': '猫系工具' };
    const icons = { 'all': 'fa-home', 'tool': 'fa-toolbox', 'api': 'fa-plug', 'component': 'fa-puzzle-piece', 'data': 'fa-database', 'editor': 'fa-code', 'kongjianshangcheng': 'fa-store', 'tutorial': 'fa-book', 'ui': 'fa-palette', 'mengzhongshui': 'fa-star', 'teshu': 'fa-gem', 'maotool': 'fa-wrench' };
    
    section.innerHTML = `<div class="category-header"><i class="fas ${icons[category] || 'fa-folder'} category-icon"></i><h2 class="category-title">${names[category] || category}</h2><span class="category-count">共 ${items.length} 个功能</span></div>`;
    
    const grid = document.createElement('div');
    grid.className = 'cards-grid';
    items.forEach(item => grid.appendChild(createCard(item, category, false)));
    section.appendChild(grid);
    contentArea.appendChild(section);
}

function createCard(item, category, isFavOverride = false) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const isFav = isFavOverride || favorites.includes(item.name);
    const heartIcon = isFav ? 'fas fa-heart' : 'far fa-heart';
    
    let avatarHtml = `<div class="card-icon">${getIconForCategory(category)}</div>`;
    if (category === 'mengzhongshui') {
        const customAvatar = getCustomAvatar(item.name);
        if (customAvatar) avatarHtml = `<img src="${customAvatar}" alt="${item.name}" class="card-icon" style="object-fit:cover">`;
    }
    
    card.innerHTML = `
        <div class="card-favorite ${isFav ? 'active' : ''}" onclick="event.stopPropagation()">
            <i class="${heartIcon}"></i>
        </div>
        <div class="card-header">
            ${avatarHtml}
            <div class="card-title">${escapeHtml(item.name)}</div>
        </div>
        <div class="card-desc">${escapeHtml(item.description)}</div>
        <div class="card-link"><i class="fas fa-external-link-alt"></i><span>${escapeHtml(item.link)}</span></div>
    `;
    
    // 绑定卡片点击
    card.addEventListener('click', () => handleCardClick(item));
    
    // 绑定爱心点击
    const favBtn = card.querySelector('.card-favorite');
    favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(item.name, favBtn, category);
    });
    
    return card;
}

// 收藏/取消收藏逻辑
function toggleFavorite(name, btnElement, category) {
    const index = favorites.indexOf(name);
    const icon = btnElement.querySelector('i');
    
    if (index === -1) {
        // 添加收藏
        favorites.push(name);
        btnElement.classList.add('active');
        icon.classList.remove('far');
        icon.classList.add('fas');
    } else {
        // 取消收藏
        favorites.splice(index, 1);
        btnElement.classList.remove('active');
        icon.classList.remove('fas');
        icon.classList.add('far');
        
        // 如果当前在收藏页，且取消收藏了，则重新渲染以移除卡片
        if (currentCategory === 'favorites') {
            renderContent();
            return;
        }
    }
    
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function getIconForCategory(category) {
    const icons = { 'tool': '🔧', 'api': '🔌', 'component': '🧩', 'data': '💾', 'editor': '</>', 'kongjianshangcheng': '🛒', 'tutorial': '📖', 'ui': '🎨', 'mengzhongshui': '⭐', 'teshu': '💎', 'maotool': '🛠️' };
    return icons[category] || '📄';
}

function handleCardClick(item) {
    currentCardData = item;
    if (confirmJump) {
        document.getElementById('confirmTitle').textContent = item.name;
        document.getElementById('confirmDesc').textContent = item.description;
        document.getElementById('confirmLink').textContent = item.link;
        document.getElementById('confirmLink').href = item.link;
        confirmModal.classList.add('active');
    } else {
        window.open(item.link, '_blank');
    }
}

// ==================== 工具函数 ====================
function debounce(func, wait) { let timeout; return function(...args) { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); }; }
function escapeHtml(text) { if (typeof text !== 'string') return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

function showFatalError(msg, err) {
    if (contentArea) contentArea.innerHTML = `<div class="error-state"><i class="fas fa-skull-crossbones" style="color:var(--danger-color)"></i><h3>${msg}</h3><details><summary>错误详情</summary><pre>${escapeHtml(err?.message)}</pre></details><button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;border:none;border-radius:8px;background:var(--primary-color);color:white;cursor:pointer">刷新重试</button></div>`;
}
function showDataError(err) {
    const empty = document.querySelector('.empty-state');
    if (empty) {
        empty.innerHTML = `<i class="fas fa-database" style="color:var(--primary-color)"></i><h3>数据加载失败</h3><p>${escapeHtml(err?.message)}</p><div style="margin-top:20px"><button onclick="localStorage.setItem('loadMode','page');location.reload()" style="padding:10px 20px;border:none;border-radius:8px;background:var(--primary-color);color:white;cursor:pointer;margin:5px">切换到本地模式</button><button onclick="location.reload()" style="padding:10px 20px;border:none;border-radius:8px;background:var(--bg-primary);color:var(--text-primary);cursor:pointer;margin:5px;border:1px solid var(--border-color)">刷新重试</button></div>`;
    }
}