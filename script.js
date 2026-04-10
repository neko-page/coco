// ==================== 全局状态 ====================
let resources = {};
let currentCategory = 'all';
let confirmJump = false;
let currentCardData = null;

// 默认配置（避免 config.js 加载失败导致崩溃）
const DEFAULT_CONFIG = {
    DEFAULT_LOGO_URL: 'https://static.codemao.cn/pickduck/rk_gX8cSlx.png?hash=FledMqVJIqXs3At0Xl317dAny1jZ',
    customAvatars: {
        '垃圾桶': 'https://neko-page.github.io/src/coco/img/permission.png',
        '梦中水': 'https://shequ.codemao.cn/user/15980757',
        '小猫': 'https://static.codemao.cn/pickduck/HyIQDQmdle.png?hash=FpoaZzw8idNDN2k8koxti2PWQHl_',
        '风哲': 'https://static.codemao.cn/pickduck/Hk5dtZA2ee.png?hash=FrHNdFMuCcYJxY8ZzoHV-Csrfch8'
    }
};

// 获取配置（优先使用外部，失败则使用默认）
const DEFAULT_LOGO_URL = (typeof window !== 'undefined' && window.DEFAULT_LOGO_URL) || DEFAULT_CONFIG.DEFAULT_LOGO_URL;
const customAvatars = (typeof window !== 'undefined' && window.customAvatars) || DEFAULT_CONFIG.customAvatars;

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
        // 1. 缓存 DOM 元素
        cacheDOMElements();
        
        // 2. 加载设置
        loadSettings();
        
        // 3. 绑定事件
        setupEventListeners();
        
        // 4. 默认选中"全部"
        setActiveCategory('all');
        
        // 5. 加载数据并渲染
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
    const cdnUrl = 'https://cdn.jsdelivr.net/gh/neko-page/src@main/coco/main/resources.js';
    console.log('📡 尝试从 CDN 加载:', cdnUrl);
    
    const response = await fetch(cdnUrl);
    if (!response.ok) {
        throw new Error(`CDN 请求失败: HTTP ${response.status}`);
    }
    
    const text = await response.text();
    
    // 解析 export const resources = {...}
    const match = text.match(/export const resources = ({[\s\S]*?});\s*$/m);
    if (!match || !match[1]) {
        throw new Error('无法解析资源数据格式');
    }
    
    // 安全解析对象
    resources = new Function('return ' + match[1])();
    
    if (!resources || typeof resources !== 'object') {
        throw new Error('解析后的数据不是有效对象');
    }
}

async function loadFromLocal() {
    console.log('📁 尝试从本地加载');
    
    try {
        const module = await import('https://neko-page.github.io/src/coco/main/resources.js');
        resources = module.resources || {};
    } catch (error) {
        console.warn('⚠️ 本地导入失败，尝试备用方案');
        // 如果 import 失败（如 CORS 问题），尝试通过全局变量获取
        if (window.resources) {
            resources = window.resources;
        } else {
            throw error;
        }
    }
}

// ==================== 设置管理 ====================
function loadSettings() {
    // Logo
    const savedLogo = localStorage.getItem('siteLogo');
    if (savedLogo && siteLogo) {
        siteLogo.src = savedLogo;
        if (logoUrlInput) logoUrlInput.value = savedLogo;
    } else if (logoUrlInput) {
        logoUrlInput.value = DEFAULT_LOGO_URL;
    }
    
    // 二次确认
    const savedConfirm = localStorage.getItem('confirmJump');
    if (savedConfirm === 'true' && confirmToggle) {
        confirmJump = true;
        confirmToggle.classList.add('active');
    }
    
    // 加载方式
    const savedLoadMode = localStorage.getItem('loadMode') || 'cdn';
    if (loadModeRadios) {
        for (const radio of loadModeRadios) {
            if (radio.value === savedLoadMode) radio.checked = true;
        }
    }
    
    // 主题
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function saveSettings() {
    // Logo URL 校验
    let logoUrl = logoUrlInput ? logoUrlInput.value.trim() : '';
    if (logoUrl) {
        if (!logoUrl.startsWith('https://')) {
            alert('⚠️ 请使用 HTTPS 开头的图片链接以确保安全性！');
            return;
        }
        localStorage.setItem('siteLogo', logoUrl);
        if (siteLogo) siteLogo.src = logoUrl;
    } else {
        localStorage.setItem('siteLogo', DEFAULT_LOGO_URL);
        if (siteLogo) siteLogo.src = DEFAULT_LOGO_URL;
    }
    
    // 二次确认
    localStorage.setItem('confirmJump', confirmJump);
    
    // 加载方式
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
    
    // 侧边栏分类切换
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
    
    // 保存设置
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    // 点击遮罩关闭弹窗
    [settingsModal, confirmModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('active');
            });
        }
    });
    
    // 二次确认开关
    if (confirmToggle) {
        confirmToggle.addEventListener('click', () => {
            confirmJump = !confirmJump;
            confirmToggle.classList.toggle('active');
        });
    }
    
    // 确认弹窗按钮
    const cancelBtn = document.getElementById('confirmCancel');
    const proceedBtn = document.getElementById('confirmProceed');
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirmModal) confirmModal.classList.remove('active');
        });
    }
    
    if (proceedBtn) {
        proceedBtn.addEventListener('click', () => {
            if (currentCardData) {
                window.open(currentCardData.link, '_blank');
                if (confirmModal) confirmModal.classList.remove('active');
            }
        });
    }
    
    // 搜索（防抖）
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            renderContent();
        }, 300));
    }
    
    // 主题切换
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
    
    // 空数据提示
    if (!resources || Object.keys(resources).length === 0) {
        contentArea.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle" style="font-size:48px;margin-bottom:20px"></i>
                <h3>无法加载资源列表</h3>
                <p>请检查网络连接，或在设置中切换为"本地模式"</p>
                <button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;border:none;border-radius:8px;background:var(--primary-color);color:white;cursor:pointer">
                    刷新重试
                </button>
            </div>
        `;
        return;
    }
    
    if (currentCategory === 'all') {
        for (const [category, items] of Object.entries(resources)) {
            const filtered = items.filter(item => 
                item.name.toLowerCase().includes(searchTerm) ||
                item.description.toLowerCase().includes(searchTerm)
            );
            if (filtered.length > 0) {
                createCategorySection(category, filtered);
            }
        }
    } else {
        const items = resources[currentCategory] || [];
        const filtered = items.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm)
        );
        if (filtered.length > 0) {
            createCategorySection(currentCategory, filtered);
        }
    }
}

function setActiveCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.category === category) {
            item.classList.add('active');
        }
    });
}

function createCategorySection(category, items) {
    const section = document.createElement('div');
    section.className = 'category-section';
    
    const names = {
        'all': '全部功能', 'tool': '通用工具', 'api': 'API接口',
        'component': '控件库', 'data': '数据', 'editor': '编辑器',
        'kongjianshangcheng': '控件商城', 'tutorial': '教程手册',
        'ui': 'UI资源', 'mengzhongshui': '梦众/名人堂',
        'teshu': '特殊', 'maotool': '猫系工具'
    };
    
    const icons = {
        'all': 'fa-home', 'tool': 'fa-toolbox', 'api': 'fa-plug',
        'component': 'fa-puzzle-piece', 'data': 'fa-database', 'editor': 'fa-code',
        'kongjianshangcheng': 'fa-store', 'tutorial': 'fa-book',
        'ui': 'fa-palette', 'mengzhongshui': 'fa-star',
        'teshu': 'fa-gem', 'maotool': 'fa-wrench'
    };
    
    section.innerHTML = `
        <div class="category-header">
            <i class="fas ${icons[category] || 'fa-folder'} category-icon"></i>
            <h2 class="category-title">${names[category] || category}</h2>
            <span class="category-count">共 ${items.length} 个功能</span>
        </div>
        <div class="cards-grid"></div>
    `;
    
    const grid = section.querySelector('.cards-grid');
    items.forEach(item => {
        grid.appendChild(createCard(item, category));
    });
    
    contentArea.appendChild(section);
}

function createCard(item, category) {
    const card = document.createElement('div');
    card.className = 'card';
    
    // 名人堂自定义头像
    let avatarHtml = `<div class="card-icon">${getIconForCategory(category)}</div>`;
    if (category === 'mengzhongshui') {
        const customAvatar = getCustomAvatar(item.name);
        if (customAvatar) {
            avatarHtml = `<img src="${customAvatar}" alt="${item.name}" class="card-icon avatar" style="object-fit:cover">`;
        }
    }
    
    card.innerHTML = `
        <div class="card-header">
            ${avatarHtml}
            <div class="card-title">${escapeHtml(item.name)}</div>
        </div>
        <div class="card-desc">${escapeHtml(item.description)}</div>
        <div class="card-link">
            <i class="fas fa-external-link-alt"></i>
            <span>${escapeHtml(item.link)}</span>
        </div>
    `;
    
    card.addEventListener('click', () => handleCardClick(item));
    return card;
}

function getIconForCategory(category) {
    const icons = {
        'tool': '🔧', 'api': '🔌', 'component': '🧩',
        'data': '💾', 'editor': '</>', 'kongjianshangcheng': '🛒',
        'tutorial': '📖', 'ui': '🎨', 'mengzhongshui': '⭐',
        'teshu': '💎', 'maotool': '🛠️'
    };
    return icons[category] || '📄';
}

function handleCardClick(item) {
    currentCardData = item;
    if (confirmJump) {
        const titleEl = document.getElementById('confirmTitle');
        const descEl = document.getElementById('confirmDesc');
        const linkEl = document.getElementById('confirmLink');
        
        if (titleEl) titleEl.textContent = item.name;
        if (descEl) descEl.textContent = item.description;
        if (linkEl) {
            linkEl.textContent = item.link;
            linkEl.href = item.link;
        }
        if (confirmModal) confirmModal.classList.add('active');
    } else {
        window.open(item.link, '_blank');
    }
}

// ==================== 错误处理 ====================
function showFatalError(message, error) {
    if (contentArea) {
        contentArea.innerHTML = `
            <div class="error-state">
                <i class="fas fa-skull-crossbones" style="font-size:48px;margin-bottom:20px;color:var(--danger-color)"></i>
                <h3>${escapeHtml(message)}</h3>
                <details style="margin-top:20px;text-align:left;max-width:600px;margin-left:auto;margin-right:auto">
                    <summary style="cursor:pointer;color:var(--text-secondary)">查看错误详情</summary>
                    <pre style="background:var(--bg-primary);padding:15px;border-radius:8px;margin-top:10px;overflow-x:auto;font-size:12px">${escapeHtml(error?.message || '未知错误')}</pre>
                </details>
                <button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;border:none;border-radius:8px;background:var(--primary-color);color:white;cursor:pointer">
                    刷新重试
                </button>
            </div>
        `;
    }
}

function showDataError(error) {
    const emptyState = document.querySelector('.empty-state');
    if (emptyState) {
        emptyState.innerHTML = `
            <i class="fas fa-database" style="font-size:48px;margin-bottom:20px;color:var(--primary-color)"></i>
            <h3>数据加载失败</h3>
            <p>${escapeHtml(error?.message || '未知错误')}</p>
            <div style="margin-top:20px">
                <button onclick="switchToLocalMode()" style="padding:10px 20px;border:none;border-radius:8px;background:var(--primary-color);color:white;cursor:pointer;margin:5px">
                    切换到本地模式
                </button>
                <button onclick="location.reload()" style="padding:10px 20px;border:none;border-radius:8px;background:var(--bg-primary);color:var(--text-primary);cursor:pointer;margin:5px;border:1px solid var(--border-color)">
                    刷新重试
                </button>
            </div>
        `;
    }
}

window.switchToLocalMode = function() {
    localStorage.setItem('loadMode', 'page');
    location.reload();
};

// ==================== 工具函数 ====================
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
