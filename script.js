// ==================== 全局状态 ====================
let resources = {};
let currentCategory = 'all';
let confirmJump = false;
let currentCardData = null;
const FAVORITES_KEY = 'coco_nav_favorites';
let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');

// ✅ 严格分类顺序
const CATEGORY_ORDER = [
    'editor', 'component', 'kongjianshangcheng', 'ui', 'api',
    'tutorial', 'maotool', 'tool', 'data', 'mengzhongshui', 'teshu'
];

// DOM 缓存
let contentArea, searchInput, settingsBtns, settingsModal, confirmModal;
let confirmToggle, saveSettingsBtn, logoUrlInput, loadModeRadios;
let siteLogo, themeToggle;

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async () => {
    cacheDOMElements();
    loadSettings();
    setupEventListeners();
    setActiveCategory('all');
    await loadData();
    renderContent();
    initAnnouncements();
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
    const response = await fetch(cdnUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const match = text.match(/export const resources = ({[\s\S]*?});\s*$/m);
    if (!match || !match[1]) throw new Error('无法解析资源数据');
    resources = new Function('return ' + match[1])();
}

async function loadFromLocal() {
    // 本地开发需使用 Live Server，直接双击打开可能受 CORS 限制
    const localUrl = 'https://neko-page.github.io/src/coco/main/resources.js';
    try {
        const module = await import(localUrl);
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
    // ✅ 关键修复：保存设置后立即刷新界面
    renderContent();
}

// ==================== 事件绑定 ====================
function setupEventListeners() {
    if (!contentArea) return;
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
        if (modal) modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
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
    
    if (currentCategory === 'favorites') {
        renderFavorites(searchTerm);
        return;
    }
    
    if (currentCategory === 'all') {
        // ✅ 严格按 CATEGORY_ORDER 顺序渲染
        for (const category of CATEGORY_ORDER) {
            const items = resources[category];
            if (!items) continue;
            const filtered = items.filter(item => 
                item.name.toLowerCase().includes(searchTerm) || 
                item.description.toLowerCase().includes(searchTerm)
            );
            if (filtered.length > 0) createCategorySection(category, filtered);
        }
    } else {
        const items = resources[currentCategory] || [];
        const filtered = items.filter(item => 
            item.name.toLowerCase().includes(searchTerm) || 
            item.description.toLowerCase().includes(searchTerm)
        );
        if (filtered.length > 0) createCategorySection(currentCategory, filtered);
    }
}

function renderFavorites(searchTerm) {
    const favItems = [];
    for (const [cat, items] of Object.entries(resources)) {
        items.forEach(item => {
            if (favorites.includes(item.name)) favItems.push({ ...item, originalCategory: cat });
        });
    }
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
    
    const names = {
        'editor': '编辑器', 'component': '控件库', 'kongjianshangcheng': '控件商城',
        'ui': 'UI资源', 'api': 'API接口', 'tutorial': '教程手册',
        'maotool': '猫系工具', 'tool': '通用工具', 'data': '数据',
        'mengzhongshui': '梦众/名人堂', 'teshu': '特殊'
    };
    const icons = {
        'editor': 'fa-code', 'component': 'fa-puzzle-piece', 'kongjianshangcheng': 'fa-store',
        'ui': 'fa-palette', 'api': 'fa-plug', 'tutorial': 'fa-book',
        'maotool': 'fa-wrench', 'tool': 'fa-toolbox', 'data': 'fa-database',
        'mengzhongshui': 'fa-star', 'teshu': 'fa-gem'
    };
    
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
    
    // ✅ 从外部文件读取头像配置
    const customAvatars = window.customAvatars || {};
    let avatarHtml = `<div class="card-icon">${getIconForCategory(category)}</div>`;
    if (category === 'mengzhongshui') {
        const customAvatar = customAvatars[item.name];
        if (customAvatar) {
            avatarHtml = `<img src="${customAvatar}" alt="${item.name}" class="card-icon" style="object-fit:cover">`;
        }
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
    
    card.addEventListener('click', () => handleCardClick(item));
    const favBtn = card.querySelector('.card-favorite');
    favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(item.name, favBtn, category);
    });
    
    return card;
}

function toggleFavorite(name, btnElement, category) {
    const index = favorites.indexOf(name);
    const icon = btnElement.querySelector('i');
    if (index === -1) {
        favorites.push(name);
        btnElement.classList.add('active');
        icon.classList.remove('far');
        icon.classList.add('fas');
    } else {
        favorites.splice(index, 1);
        btnElement.classList.remove('active');
        icon.classList.remove('fas');
        icon.classList.add('far');
        if (currentCategory === 'favorites') {
            renderContent();
            return;
        }
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function getIconForCategory(category) {
    const icons = {
        'editor': '</>', 'component': '🧩', 'kongjianshangcheng': '🛒',
        'ui': '🎨', 'api': '🔌', 'tutorial': '📖',
        'maotool': '🛠️', 'tool': '🔧', 'data': '💾',
        'mengzhongshui': '⭐', 'teshu': '💎'
    };
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

// ==================== 公告栏 ====================
function initAnnouncements() {
    const viewport = document.getElementById('annViewport');
    if (!viewport) return;
    
    // ✅ 安全读取外部公告文件
    const list = window.announcements || [];
    
    if (list.length === 0) {
        viewport.innerHTML = '<div class="ann-text" style="opacity:0.8">无内容</div>';
        return;
    }
    if (list.length === 1) {
        viewport.innerHTML = `<div class="ann-text">${escapeHtml(list[0])}</div>`;
        return;
    }
    
    let currentIndex = 0;
    const createItem = (text, state) => {
        const el = document.createElement('div');
        el.className = `ann-item ${state}`;
        el.textContent = text;
        viewport.appendChild(el);
        return el;
    };
    
    createItem(list[0], 'active');
    
    setInterval(() => {
        currentIndex = (currentIndex + 1) % list.length;
        const currentEl = viewport.querySelector('.ann-item.active');
        const nextEl = createItem(list[currentIndex], 'enter');
        requestAnimationFrame(() => {
            currentEl.classList.remove('active');
            currentEl.classList.add('exit');
            nextEl.classList.remove('enter');
            nextEl.classList.add('active');
        });
        setTimeout(() => currentEl.remove(), 600);
    }, 10000);
}

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

function showDataError(err) {
    const empty = document.querySelector('.empty-state');
    if (empty) {
        empty.innerHTML = `<i class="fas fa-database" style="color:var(--primary-color)"></i><h3>数据加载失败</h3><p>${escapeHtml(err?.message)}</p><div style="margin-top:20px"><button onclick="localStorage.setItem('loadMode','page');location.reload()" style="padding:10px 20px;border:none;border-radius:8px;background:var(--primary-color);color:white;cursor:pointer;margin:5px">切换到本地模式</button><button onclick="location.reload()" style="padding:10px 20px;border:none;border-radius:8px;background:var(--bg-primary);color:var(--text-primary);cursor:pointer;margin:5px;border:1px solid var(--border-color)">刷新重试</button></div>`;
    }
}