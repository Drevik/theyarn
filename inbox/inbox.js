/* inbox.js — Command Center Inbox client logic */

const PW = 'Inboxreviews';

function login() {
    const v = document.getElementById('pw').value;
    if (v === PW) { sessionStorage.setItem('inbox', '1'); show(); }
    else { document.getElementById('err').style.display = 'block'; document.getElementById('pw').value = ''; }
}
document.getElementById('pw').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
if (sessionStorage.getItem('inbox') === '1') show();

const ITEMS = PLACEHOLDER_ITEMS;

function show() {
    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('app').classList.add('visible');
    render();
}

function age(iso) {
    if (!iso) return '';
    const h = (Date.now() - new Date(iso)) / 3600000;
    if (h < 1) return Math.round(h * 60) + 'm ago';
    if (h < 24) return Math.round(h) + 'h ago';
    return Math.round(h / 24) + 'd ago';
}

function esc(s) {
    return s ? s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : '';
}

const ICONS = { article: '📄', image: '🖼️', writing: '✍️', research: '🔬', dnd: '🎲', novel: '📖', etsy: '🎨' };
const ICON_CLS = { article: 'icon-article', image: 'icon-image', writing: 'icon-writing', research: 'icon-research', dnd: 'icon-dnd', novel: 'icon-novel', etsy: 'icon-etsy' };

function priority(item) {
    const q = (item.meta || {}).quality || '';
    const ql = q.toLowerCase();
    if (ql.includes('rewrite') || ql.includes('keyword-stuffed')) return 0;
    const m = ql.match(/(\d+)%\s*ai/);
    if (m) { const p = parseInt(m[1]); return p >= 30 ? 0 : p >= 10 ? 1 : 2; }
    if (ql.includes('0%') || ql.includes('best candidate')) return 2;
    return 1;
}

function priorityTag(item) {
    const p = priority(item);
    if (p === 0) return '<span class="priority-tag priority-high">high</span>';
    if (p === 1) return '<span class="priority-tag priority-medium">med</span>';
    return '<span class="priority-tag priority-low">low</span>';
}

function render() {
    const pending = ITEMS.filter(i => i.status === 'pending').sort((a, b) => priority(a) - priority(b));
    const approved = ITEMS.filter(i => i.status === 'approved');
    const rejected = ITEMS.filter(i => i.status === 'rejected');

    document.getElementById('stats').innerHTML =
        '<span class="topbar-stat"><span class="num hot">' + pending.length + '</span> pending</span>' +
        '<span class="topbar-stat"><span class="num good">' + approved.length + '</span> approved</span>' +
        '<span class="topbar-stat"><span class="num done">' + rejected.length + '</span> rejected</span>';

    let html = '';
    if (ITEMS.length === 0) {
        html = '<div class="empty"><div class="empty-icon">✅</div><h2>All clear</h2><p>Nothing to review.</p></div>';
    } else {
        if (pending.length > 0) {
            html += '<div class="section-header">📋 Pending Review <span class="badge badge-review">' + pending.length + '</span></div>';
            pending.forEach(item => { html += card(item); });
        }
        if (approved.length > 0) {
            html += '<div class="section-header">✅ Approved <span class="badge badge-approved">' + approved.length + '</span></div>';
            approved.forEach(item => { html += card(item); });
        }
        if (rejected.length > 0) {
            html += '<div class="section-header">🗑️ Rejected <span class="badge badge-rejected">' + rejected.length + '</span></div>';
            rejected.forEach(item => { html += card(item); });
        }
    }
    html += '<div class="hint">Changes here are for reference. To route files, tell Morwenna <code>review approve ID</code> or <code>review reject ID</code>.</div>';
    document.getElementById('main').innerHTML = html;
}

function card(item) {
    const icon = ICONS[item.type] || '📋';
    const iconCls = ICON_CLS[item.type] || 'icon-default';
    const hasHtml = item.html_content && item.html_content.length > 100;
    const isPending = item.status === 'pending';
    const isApproved = item.status === 'approved';

    let actionBtns = '';
    if (isPending) {
        actionBtns = '<button class="btn btn-reject" onclick="setStatus(\'' + item.id + '\',\'rejected\')">✕ Reject</button>' +
                     '<button class="btn btn-approve" onclick="setStatus(\'' + item.id + '\',\'approved\')">✓ Approve</button>';
    } else if (isApproved) {
        actionBtns = '<button class="btn btn-done" disabled>✓ Approved</button>';
    } else {
        actionBtns = '<button class="btn btn-rejected" disabled>✕ Rejected</button>';
    }

    const meta = item.meta || {};
    let metaBits = [];
    if (meta.quality) metaBits.push('<span>⚡ ' + esc(meta.quality) + '</span>');
    if (meta.words) metaBits.push('<span>📝 ' + meta.words.toLocaleString() + ' words</span>');
    metaBits.push('<span>📁 ' + esc(item.project || 'Unassigned') + '</span>');
    metaBits.push('<span>🕐 ' + age(item.added) + '</span>');

    const preview = hasHtml
        ? '<iframe srcdoc="' + esc(item.html_content) + '" sandbox="allow-same-origin"></iframe>'
        : '<div class="no-preview">No preview. File: <code>' + esc(item.file || 'N/A') + '</code></div>';

    return '<div class="card" id="card-' + item.id + '">' +
        '<div class="card-main" onclick="toggle(\'' + item.id + '\')">' +
            '<div class="card-icon ' + iconCls + '">' + icon + '</div>' +
            '<div class="card-body">' +
                '<div class="card-title">' + priorityTag(item) + ' ' + esc(item.title) + '</div>' +
                '<div class="card-meta">' + metaBits.join('') + '</div>' +
            '</div>' +
            '<div class="card-arrow">›</div>' +
        '</div>' +
        '<div class="card-expand" id="expand-' + item.id + '">' +
            '<div class="card-expand-inner">' +
                '<div class="card-preview">' + preview + '</div>' +
                '<div class="card-actions">' + actionBtns + '</div>' +
            '</div>' +
        '</div>' +
    '</div>';
}

function toggle(id) {
    document.getElementById('card-' + id).classList.toggle('open');
}

function setStatus(id, status) {
    const item = ITEMS.find(i => i.id === id);
    if (item) { item.status = status; render(); }
}