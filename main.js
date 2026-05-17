// ============================================================
//  main.js  |  العطور الذكي
// ============================================================

// ============================================================
//  ★ روابط المشاركة — غيّرها هنا عند الحاجة
// ============================================================
const SHARE_WEB_URL = 'https://perfumesm.netlify.app/';          // ← رابط الموقع
const SHARE_APK_URL = 'https://www.appcreator24.com/app4016532-odbv3t'; // ← رابط APK
// ============================================================

// ──── الحالة العامة ────
let currentUser     = null;
let purchases       = [];
let formulas        = [];
let oilCatalog      = [];
let trash           = [];
let purSortCol      = 'created_at';
let purSortAsc      = false;
let oilSortCol      = 'created_at';
let oilSortAsc      = false;
let selectedPurIds   = new Set();
let selectedFavIds   = new Set();
let selectedTrashIds = new Set();
let selectedOilIds   = new Set();
let trashOpen = localStorage.getItem('sp_trash_open') !== '0';

// ──── قاموس الأسماء ────
const nameBank = {
    male: {
        1: ["الجسور","الهيبة","العميد","الملوكي","الصقر","الأسطورة","الفارس","الأمير","الأبيّ","الشامخ",
            "الرفيع","الجليل","العظيم","الأنيق","السيد","الليث","النبيل","القائد","الأصيل","الوقور",
            "المهيب","الباسل","السلطان","الشريف","الفريد","الظافر","المنتصر","الثاقب","الضياء","الفخر"],
        2: ["فارس الليل","ذهب الصحراء","عود الملك","مسك العرب","نار الشرق","جمر العود","ظل الفارس",
            "عبق الصحراء","عطر الملوك","شموخ الأمير","بريق الصقر","غموض الليل","سر الشرق",
            "مجد السلطان","طيب الملوك","هيبة السلطان","لهيب الصحراء","سطوة الملك","نبل الأمير",
            "سحر العود","وقار السلطان","نجم الأمير","أصالة العود","تاج الشرق","ذروة الشرف"],
        3: ["سحر الليل الداكن","أسطورة فارس الشرق","روح العود الملكي","جمر العنبر الثمين",
            "عبق الصحراء الحارة","شموخ الأمير الجليل","هيبة السلطان الأصيل","غموض الليل الأزرق",
            "ذهب الصحراء النقي","سطوة الملك الجبار","نبل الأمير الصامد","رهبة الليل الأسود",
            "وقار الشيخ الجليل","هيبة الفارس المقدام","جوهر العود الأصيل","شموخ النجم الصارم",
            "أصالة العود القديم","مجد الفارس القادم","تاج الملك الجليل","قمة الهيبة الملكية"]
    },
    female: {
        1: ["رقة","أوركيد","ياسمينة","سلاف","أميرة","نسمة","لؤلؤة","فتنة","ألق","شفاء",
            "بهجة","سوسن","نرجس","بنفسج","أريج","عبير","نفحة","هيفاء","سحر","دلال",
            "حنين","وردة","زهرة","ريحانة","فيروز","ألماس","بسمة","ميسون","أسيل","نهى"],
        2: ["أنفاس الورد","أميرة الليل","بتلة الفجر","سلاف الربيع","نور القمر","عطر الأميرة",
            "سحر الياسمين","لؤلؤة الشرق","همس الزهور","نسمة الفجر","رقة الياسمين","عبق الورود",
            "نفحة الربيع","حنين الزهور","وردة النيل","نداء القمر","أحلام الأميرة","روح الزهرة",
            "شوق الربيع","سحر العيون","قمر الليل","لمس الحرير","همس الليل","صفاء الروح","بسمة الفجر"],
        3: ["أميرة الليل الناعمة","أنفاس وردة الفجر","روح الأميرة الحالمة","سحر الزهور البيضاء",
            "همس الروح اللطيفة","بتلة الورد الداكن","لمسة الحرير الناعم","ألق النجمة البيضاء",
            "نفحة الربيع العطري","بهجة الروح الجميلة","زهو الأميرة الحالمة","سر الأنوثة الخالدة",
            "روح الياسمين المنثور","وهج القمر الفضي","لمسة القمر الحنون","نداء الحبيبة العذبة",
            "شعاع القمر الفضي","صفاء الروح الطاهرة","بسمة الأميرة الحالمة","ليلة الورود الحمراء"]
    },
    neutral: {
        1: ["نقاء","توازن","أثير","بخور","صفاء","سكينة","وهج","أفق","سلام","نور",
            "روح","أمل","فجر","قمر","نجم","جوهر","خلود","ذاكرة","إلهام","وميض",
            "إشراق","تناغم","بياض","حنين","صمود","نفيس","وجدان","شوق","أمان","بريق"],
        2: ["المسك الصافي","عنبر الأرض","روح الشرق","درب النجوم","نسيم البحر","ضوء القمر",
            "سر الطبيعة","عبق الصحراء","هواء الفجر","أثير الكون","صفاء النفس","سكينة الروح",
            "نقاء الليل","وهج النهار","سلام الفجر","نور الحقيقة","سر الوجود","جوهر الحياة",
            "همس الماء","ذاكرة الزمن","سكون البحر","وميض النجوم","إشراق الفجر","نبض الكون","بوح الروح"],
        3: ["عبق المسك الأبيض","سحر عنبر الشرق","نقاء الروح الهادئة","هواء الفجر العليل",
            "سكينة الليل الهادئ","توازن الروح الهادئة","أثير الكون الواسع","سر الطبيعة الخفي",
            "درب النجوم البعيدة","ضوء القمر الساكن","وهج النهار الدافئ","همس الماء الجاري",
            "ذاكرة الزمن الجميل","سكون البحر الهادئ","إشراق الفجر الأول","تناغم الأرواح الصافية",
            "حكمة الصمت العميق","أصل الطيب القديم","جوهر الحياة الخالدة","نبض الكون الأبدي"]
    }
};

function transliterate(text) {
    const m = {'ا':'a','أ':'a','إ':'i','آ':'aa','ء':'','ئ':'i','ؤ':'u','ب':'b','ت':'t','ث':'th',
               'ج':'j','ح':'h','خ':'kh','د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh',
               'ص':'s','ض':'d','ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k',
               'ل':'l','م':'m','ن':'n','ه':'h','و':'u','ي':'i','ى':'a','ة':'a',
               'َ':'a','ُ':'u','ِ':'i','ّ':'','ْ':''};
    return text.split(' ').map(w =>
        w.startsWith('ال') && w.length > 2
            ? 'al' + w.slice(2).split('').map(c => m[c] ?? c).join('')
            : w.split('').map(c => m[c] ?? c).join('')
    ).join(' ');
}

// ============================================================
//  التهيئة عند تحميل الصفحة
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
    // استعادة الثيم المحفوظ
    const savedTheme = localStorage.getItem('sp_theme') || 'gold';
    setTheme(savedTheme, false);

    // تعبئة حقل اسم المستخدم إذا كان محفوظاً
    const savedUsername = localStorage.getItem('sp_username');
    if (savedUsername) {
        const loginUserEl = document.getElementById('login-user');
        if (loginUserEl) loginUserEl.value = savedUsername;
    }

    const saved = localStorage.getItem('sp_user') || sessionStorage.getItem('sp_user');
    if (saved) {
        currentUser = saved;
        try {
            await showApp();
        } catch(e) {
            // فشل التحميل التلقائي → العودة لشاشة الدخول
            currentUser = null;
            localStorage.removeItem('sp_user');
            sessionStorage.removeItem('sp_user');
            document.getElementById('auth-section').classList.remove('hidden');
            document.getElementById('app-section').classList.add('hidden');
        }
    }
    document.querySelectorAll('.tab-btn').forEach(btn =>
        btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
});

// ============================================================
//  المصادقة
// ============================================================
function toggleAuthMode(showRegister) {
    document.getElementById('login-box').classList.toggle('hidden', showRegister);
    document.getElementById('register-box').classList.toggle('hidden', !showRegister);
}

async function handleRegister() {
    const userId = document.getElementById('reg-user').value.trim();
    const pass   = document.getElementById('reg-pass').value;
    const pass2  = document.getElementById('reg-pass2').value;
    const hint   = document.getElementById('reg-hint')?.value?.trim() || '';
    if (pass !== pass2) return showErr('register-err', 'كلمتا المرور غير متطابقتين');
    setLoading('reg-btn', true);
    try {
        await dbRegister(userId, pass, hint);
        showErr('register-err', '');
        showToast('تم التسجيل! يمكنك الدخول الآن ✅');
        toggleAuthMode(false);
    } catch(e) { showErr('register-err', e.message); }
    finally { setLoading('reg-btn', false); }
}

async function handleLogin() {
    const userId   = document.getElementById('login-user').value.trim();
    const pass     = document.getElementById('login-pass').value;
    const remember = document.getElementById('remember-me').checked;
    setLoading('login-btn', true);
    try {
        const uid = await dbLogin(userId, pass);
        showErr('login-err', '');
        currentUser = uid;
        if (remember) {
            localStorage.setItem('sp_user', uid);
            localStorage.setItem('sp_username', uid);   // لتعبئة الحقل تلقائياً في المرة القادمة
        } else {
            sessionStorage.setItem('sp_user', uid);
            localStorage.removeItem('sp_username');      // لا تتذكر الاسم إذا لم يختر "تذكرني"
        }
        await showApp();
    } catch(e) { showErr('login-err', e.message); }
    finally { setLoading('login-btn', false); }
}

// ============================================================
//  المشاركة
// ============================================================
function showShareModal() {
    document.getElementById('share-modal').classList.remove('hidden');
}
function hideShareModal() {
    document.getElementById('share-modal').classList.add('hidden');
}

function logout() {
    currentUser = null;
    localStorage.removeItem('sp_user');
    localStorage.removeItem('sp_username');
    sessionStorage.removeItem('sp_user');
    purchases = []; formulas = []; oilCatalog = []; trash = [];
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('app-section').classList.add('hidden');
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
    // إخفاء مربع التلميح عند الخروج
    const hb = document.getElementById('hint-box');
    if (hb) hb.classList.add('hidden');
}

// ============================================================
//  الثيمات (Color Themes)
// ============================================================
function setTheme(name, save = true) {
    document.documentElement.setAttribute('data-theme', name);
    document.querySelectorAll('.theme-dot').forEach(dot =>
        dot.classList.toggle('active', dot.dataset.theme === name));
    if (save) localStorage.setItem('sp_theme', name);
}

// ============================================================
//  نسيت كلمة المرور
// ============================================================
async function showPassHint() {
    const userId = document.getElementById('login-user').value.trim();
    const hintBox  = document.getElementById('hint-box');
    const hintText = document.getElementById('hint-text');
    const errEl    = document.getElementById('login-err');
    if (!userId) {
        showErr('login-err', 'أدخل اسم المستخدم أولاً ثم اضغط "نسيت كلمة المرور"');
        return;
    }
    try {
        const hint = await dbGetPassHint(userId);
        if (!hint) {
            showErr('login-err', 'لا يوجد تلميح مسجل لهذا الحساب');
            if (hintBox) hintBox.classList.add('hidden');
        } else {
            showErr('login-err', '');
            hintText.textContent = hint;
            hintBox.classList.remove('hidden');
        }
    } catch(e) {
        showErr('login-err', 'حدث خطأ أثناء جلب التلميح');
    }
}

// ============================================================
//  تغيير كلمة المرور
// ============================================================
async function showChangePwd() {
    document.getElementById('change-pwd-modal').classList.remove('hidden');
    ['cpwd-old','cpwd-new','cpwd-new2'].forEach(id => document.getElementById(id).value = '');
    showErr('cpwd-err', '');
    showErr('cpwd-hint-err', '');
    // اعرض التلميح الحالي إن وجد
    try {
        const hint = await dbGetPassHint(currentUser);
        const hintInput = document.getElementById('cpwd-hint');
        if (hintInput) hintInput.value = hint || '';
    } catch(_) {}
    setTimeout(() => document.getElementById('cpwd-old').focus(), 80);
}
function hideChangePwd() {
    document.getElementById('change-pwd-modal').classList.add('hidden');
}

async function handleUpdateHint() {
    const hint = (document.getElementById('cpwd-hint')?.value || '').trim();
    setLoading('cpwd-hint-btn', true);
    try {
        await dbUpdatePassHint(currentUser, hint);
        showErr('cpwd-hint-err', '');
        showToast('تم حفظ التلميح 💡');
    } catch(e) {
        showErr('cpwd-hint-err', e.message);
    } finally {
        setLoading('cpwd-hint-btn', false);
    }
}
async function handleChangePassword() {
    const oldPwd  = document.getElementById('cpwd-old').value;
    const newPwd  = document.getElementById('cpwd-new').value;
    const newPwd2 = document.getElementById('cpwd-new2').value;
    if (!oldPwd || !newPwd) return showErr('cpwd-err', 'يرجى ملء جميع الحقول');
    if (newPwd !== newPwd2)  return showErr('cpwd-err', 'كلمتا المرور الجديدة غير متطابقتين');
    if (newPwd.length < 4)   return showErr('cpwd-err', 'كلمة المرور الجديدة قصيرة جداً');
    setLoading('cpwd-btn', true);
    try {
        await dbChangePassword(currentUser, oldPwd, newPwd);
        hideChangePwd();
        showToast('تم تغيير كلمة المرور بنجاح 🔐');
    } catch(e) { showErr('cpwd-err', e.message); }
    finally { setLoading('cpwd-btn', false); }
}

// ============================================================
//  عرض التطبيق بعد الدخول
// ============================================================
async function showApp() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('user-name-label').textContent = currentUser;
    document.getElementById('avatar-letter').textContent   = currentUser.charAt(0).toUpperCase();
    setLoading('app-loading', true, true);
    try {
        [purchases, formulas, oilCatalog] = await Promise.all([
            dbGetPurchases(currentUser),
            dbGetFormulas(currentUser),
            dbGetOils(currentUser)
        ]);
        switchTab('purchases');
    } catch(e) { showToast('خطأ في تحميل البيانات: ' + e.message, 'error'); }
    finally { setLoading('app-loading', false, true); }
}

// ============================================================
//  نظام التبويبات
// ============================================================
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach(p =>
        p.classList.toggle('hidden', p.dataset.panel !== tab));

    if (tab === 'purchases') renderPurchases();
    if (tab === 'names')     renderNamesTab();
    if (tab === 'formula')   initFormulaTab();
    if (tab === 'favorites') { renderFavorites(); loadTrash(); }
    if (tab === 'oils')      renderOils();
}

// ============================================================
//  تبويب: المشتريات
// ============================================================
async function addPurchase() {
    const oil_name = v('pur-name');
    const price    = parseFloat(v('pur-price')) || 0;
    const quantity = parseFloat(v('pur-qty'))   || 0;
    const location = v('pur-location');
    const note     = v('pur-note');
    if (!oil_name) return showToast('أدخل اسم الزيت ⚠️', 'warn');
    setLoading('pur-add-btn', true);
    try {
        await dbAddPurchase(currentUser, { oil_name, price, quantity, location, note });
        purchases = await dbGetPurchases(currentUser);
        renderPurchases();
        ['pur-name','pur-price','pur-qty','pur-location','pur-note']
            .forEach(id => document.getElementById(id).value = '');
        showToast('تمت الإضافة ✅');
    } catch(e) { showToast(e.message, 'error'); }
    finally { setLoading('pur-add-btn', false); }
}

function sortPurchases(col) {
    if (purSortCol === col) purSortAsc = !purSortAsc;
    else { purSortCol = col; purSortAsc = true; }
    renderPurchases();
}

function renderPurchases() {
    const q = (v('pur-search') || '').toLowerCase();
    const list = purchases.filter(p =>
        p.oil_name.toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.note || '').toLowerCase().includes(q)
    );
    list.sort((a, b) => {
        let va = a[purSortCol] ?? '', vb = b[purSortCol] ?? '';
        if (typeof va === 'string') return purSortAsc ? va.localeCompare(vb,'ar') : vb.localeCompare(va,'ar');
        return purSortAsc ? va - vb : vb - va;
    });

    const total = purchases.reduce((s, p) => s + (p.price || 0), 0);
    const totalEl = document.getElementById('pur-total');
    const countEl = document.getElementById('pur-count');
    if (totalEl) totalEl.textContent = total.toLocaleString('ar-SA',{minimumFractionDigits:2}) + ' ر.س';
    if (countEl) countEl.textContent = purchases.length;

    const tbody = document.getElementById('pur-tbody');
    if (!tbody) return;
    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--muted);">لا توجد مشتريات بعد</td></tr>`;
        updatePurBulkBar(); return;
    }
    tbody.innerHTML = list.map(p => `
        <tr data-id="${p.id}">
            <td><input type="checkbox" class="pur-check item-check" data-id="${p.id}"
                ${selectedPurIds.has(p.id) ? 'checked' : ''}
                onchange="togglePurSel('${p.id}',this.checked)"></td>
            <td>${esc(p.oil_name)}</td>
            <td>${(p.price||0).toLocaleString('ar')}</td>
            <td>${p.quantity||''}</td>
            <td>${esc(p.location||'')}</td>
            <td>${esc(p.note||'')}</td>
            <td>${fmtDate(p.created_at)}</td>
            <td><button class="icon-btn danger" onclick="deletePurchase('${p.id}')" title="حذف">🗑️</button></td>
        </tr>`).join('');
    updatePurBulkBar();
}

function togglePurSel(id, checked) {
    checked ? selectedPurIds.add(id) : selectedPurIds.delete(id);
    updatePurBulkBar();
}
function toggleAllPur(checked) {
    document.querySelectorAll('.pur-check').forEach(cb => {
        cb.checked = checked;
        checked ? selectedPurIds.add(cb.dataset.id) : selectedPurIds.delete(cb.dataset.id);
    });
    updatePurBulkBar();
}
function updatePurBulkBar() {
    const bar = document.getElementById('pur-bulk-bar');
    const cnt = document.getElementById('pur-sel-count');
    const n = selectedPurIds.size;
    if (bar) bar.style.display = n > 0 ? 'flex' : 'none';
    if (cnt) cnt.textContent = n + ' محدد';
}
async function deletePurchase(id) {
    if (!confirm('حذف هذا السجل؟')) return;
    try {
        await dbDeletePurchase(currentUser, id);
        selectedPurIds.delete(id);
        purchases = await dbGetPurchases(currentUser);
        renderPurchases();
        showToast('تم الحذف 🗑️');
    } catch(e) { showToast(e.message, 'error'); }
}
async function bulkDeletePurchases() {
    if (!selectedPurIds.size) return;
    if (!confirm(`حذف ${selectedPurIds.size} عناصر محددة نهائياً؟`)) return;
    try {
        await Promise.all([...selectedPurIds].map(id => dbDeletePurchase(currentUser, id)));
        selectedPurIds.clear();
        purchases = await dbGetPurchases(currentUser);
        renderPurchases();
        showToast('تم الحذف 🗑️');
    } catch(e) { showToast(e.message, 'error'); }
}

// ============================================================
//  تبويب: مولد الأسماء
// ============================================================
function renderNamesTab() {}

function generateName() {
    const gender = document.getElementById('name-gender').value || 'male';
    const words  = parseInt(document.getElementById('name-words').value) || 1;
    const w      = [1,2,3].includes(words) ? words : 1;
    const list   = nameBank[gender]?.[w] ?? nameBank.male[1];
    const pick   = list[Math.floor(Math.random() * list.length)];
    document.getElementById('gen-ar').value = pick;
    document.getElementById('gen-en').value = transliterate(pick);
}

function copyGenName() {
    const ar = document.getElementById('gen-ar').value;
    const en = document.getElementById('gen-en').value;
    if (!ar) return;
    navigator.clipboard?.writeText(ar + ' | ' + en);
    showToast('تم النسخ 📋');
}

function useNameInFormula() {
    const ar = document.getElementById('gen-ar').value;
    const en = document.getElementById('gen-en').value;
    if (!ar) return showToast('ولّد اسماً أولاً', 'warn');
    document.getElementById('formula-name-ar').value = ar;
    document.getElementById('formula-name-en').value = en;
    switchTab('formula');
    showToast('تم نقل الاسم إلى التركيبة ✅');
}

// ============================================================
//  تبويب: حاسبة التركيبات
// ============================================================
function initFormulaTab() {
    if (document.querySelectorAll('.f-oil-row').length === 0) {
        addOilRow(); addOilRow();
    }
    calcFormula();
}

function addOilRow() {
    const container = document.getElementById('formula-oils');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'f-oil-row';
    // data-entry يتتبع آخر حقل استخدمه المستخدم للإدخال
    div.innerHTML = `
        <input type="text"   class="f-oil-name" placeholder="مثال: عنبر" oninput="calcFormula()">
        <input type="number" class="f-oil-pct"  placeholder="%" min="0" max="100" step="0.1"
               oninput="setEntry(this,'pct'); calcFormula()">
        <input type="number" class="f-oil-ml" placeholder="مل" min="0" step="0.1"
               title="أدخل المل مباشرةً"
               oninput="setEntry(this,'ml'); calcFromMl(this)">
        <input type="number" class="f-oil-dr" placeholder="قطرة" min="0" step="1"
               title="أدخل عدد القطرات"
               oninput="setEntry(this,'drops'); calcFromDrops(this)">
        <button class="icon-btn danger" onclick="removeOilRow(this)">✕</button>`;
    container.appendChild(div);
}

/** يحفظ طريقة الإدخال في الصف */
function setEntry(input, mode) {
    input.closest('.f-oil-row').dataset.entry = mode;
}

function removeOilRow(btn) {
    const row = btn.closest('.f-oil-row');
    const hasData = row.querySelector('.f-oil-name').value.trim() !== '' ||
                    parseFloat(row.querySelector('.f-oil-pct').value) > 0;
    if (hasData && !confirm('إزالة هذا الزيت؟')) return;
    row.remove();
    calcFormula();
}

/** المستخدم كتب في حقل المل → احسب النسبة والقطرات */
function calcFromMl(input) {
    const row   = input.closest('.f-oil-row');
    const ml    = parseFloat(input.value) || 0;
    const vol   = parseFloat(document.getElementById('formula-vol').value) || 0;
    const pct   = vol > 0 ? (ml / vol) * 100 : 0;
    const drops = Math.round(ml * 20);
    const pctEl = row.querySelector('.f-oil-pct');
    const drEl  = row.querySelector('.f-oil-dr');
    if (pctEl) pctEl.value = pct > 0 ? parseFloat(pct.toFixed(2)) : '';
    if (drEl && document.activeElement !== drEl) drEl.value = drops > 0 ? drops : '';
    calcFormula(true);
}

/** المستخدم كتب في حقل القطرات → احسب المل والنسبة */
function calcFromDrops(input) {
    const row   = input.closest('.f-oil-row');
    const drops = parseFloat(input.value) || 0;
    const vol   = parseFloat(document.getElementById('formula-vol').value) || 0;
    const ml    = drops / 20;
    const pct   = vol > 0 ? (ml / vol) * 100 : 0;
    const pctEl = row.querySelector('.f-oil-pct');
    const mlEl  = row.querySelector('.f-oil-ml');
    if (pctEl) pctEl.value = pct > 0 ? parseFloat(pct.toFixed(2)) : '';
    if (mlEl && document.activeElement !== mlEl) mlEl.value = ml > 0 ? parseFloat(ml.toFixed(2)) : '';
    calcFormula(true);
}

function calcFormula(skipFieldsUpdate = false) {
    const vol    = parseFloat(document.getElementById('formula-vol').value) || 0;
    const wdrops = parseFloat(document.getElementById('formula-water').value) || 0;
    const wml    = wdrops / 20;
    const rows   = document.querySelectorAll('.f-oil-row');
    let totalOilMl = 0, totalPct = 0;
    rows.forEach(row => {
        const pct   = parseFloat(row.querySelector('.f-oil-pct').value) || 0;
        const ml    = (pct * vol) / 100;
        const drops = Math.round(ml * 20);
        const mlEl  = row.querySelector('.f-oil-ml');
        const drEl  = row.querySelector('.f-oil-dr');
        // لا تُحدّث حقل المل أو القطرات إذا كان المستخدم يكتب فيه الآن
        if (mlEl && !skipFieldsUpdate && document.activeElement !== mlEl)
            mlEl.value = ml > 0 ? parseFloat(ml.toFixed(2)) : '';
        if (drEl && !skipFieldsUpdate && document.activeElement !== drEl)
            drEl.value = drops > 0 ? drops : '';
        totalOilMl += ml; totalPct += pct;
    });
    const alcoholMl  = Math.max(0, vol - totalOilMl - wml);
    const alcoholPct = vol > 0 ? ((alcoholMl / vol) * 100).toFixed(1) : 0;
    const res = document.getElementById('formula-result');
    if (!res) return;
    res.innerHTML = vol <= 0 ? `<span class="muted">أدخل حجم العبوة لبدء الحساب</span>` : `
        <div class="result-grid">
            <div class="result-card">
                <span class="result-label">إجمالي نسب الزيوت</span>
                <span class="result-val ${totalPct > 100 ? 'danger-text' : ''}">${totalPct.toFixed(1)}%</span>
            </div>
            <div class="result-card">
                <span class="result-label">حجم الزيوت الكلي</span>
                <span class="result-val">${totalOilMl.toFixed(2)} مل</span>
            </div>
            <div class="result-card">
                <span class="result-label">💧 الماء المقطر</span>
                <span class="result-val">${wml.toFixed(2)} مل (${wdrops} قطرة)</span>
            </div>
            <div class="result-card highlight">
                <span class="result-label">🍷 الكحول النقي</span>
                <span class="result-val">${alcoholMl.toFixed(2)} مل (${alcoholPct}%)</span>
            </div>
            <div class="result-card">
                <span class="result-label">📦 الحجم الإجمالي</span>
                <span class="result-val">${vol} مل</span>
            </div>
        </div>
        ${totalPct > 100 ? '<p class="warn-msg">⚠️ إجمالي النسب تجاوز 100%</p>' : ''}`;
}

async function saveFormula() {
    const nameAr = document.getElementById('formula-name-ar').value.trim();
    const nameEn = document.getElementById('formula-name-en').value.trim();
    const vol    = parseFloat(document.getElementById('formula-vol').value) || 0;
    const wdrops = parseFloat(document.getElementById('formula-water').value) || 0;
    if (!nameAr) return showToast('أدخل اسم العطر أولاً ⚠️', 'warn');
    if (vol <= 0) return showToast('أدخل حجم العبوة أولاً ⚠️', 'warn');
    const rows = [...document.querySelectorAll('.f-oil-row')];
    const oils = rows.map(row => ({
        name:    row.querySelector('.f-oil-name').value.trim(),
        percent: parseFloat(row.querySelector('.f-oil-pct').value) || 0,
        ml:      parseFloat(row.querySelector('.f-oil-ml').value)  || 0,
        drops:   parseInt(row.querySelector('.f-oil-dr').value)    || 0,
        entry:   row.dataset.entry || 'pct'   // pct | ml | drops
    })).filter(o => o.name && o.percent > 0);
    if (oils.length === 0) return showToast('أضف زيتاً واحداً على الأقل ⚠️', 'warn');
    if (formulas.some(f => f.formula_name === nameAr))
        return showToast('هذا الاسم محفوظ مسبقاً — اختر اسماً آخر ⚠️', 'warn');
    const wml = wdrops / 20;
    const totalOilMl = oils.reduce((s, o) => s + o.ml, 0);
    const alcoholMl  = Math.max(0, vol - totalOilMl - wml);
    const details = { name_ar: nameAr, name_en: nameEn, oils, water_drops: wdrops, water_ml: wml, alcohol_ml: alcoholMl };
    setLoading('save-formula-btn', true);
    try {
        await dbAddFormula(currentUser, { formula_name: nameAr, total_volume: vol, formula_details: details });
        formulas = await dbGetFormulas(currentUser);
        showToast('تم الحفظ في المفضلة ⭐');
    } catch(e) { showToast(e.message, 'error'); }
    finally { setLoading('save-formula-btn', false); }
}

// ============================================================
//  تبويب: المفضلة
// ============================================================
function renderFavorites() {
    const q    = (v('fav-search') || '').toLowerCase();
    const list = formulas.filter(f =>
        f.formula_name.toLowerCase().includes(q) ||
        JSON.stringify(f.formula_details).toLowerCase().includes(q)
    );
    const grid = document.getElementById('fav-grid');
    if (!grid) return;
    if (list.length === 0) {
        grid.innerHTML = `<p class="empty-msg">لا توجد تركيبات محفوظة بعد</p>`;
        updateFavBulkBar(); return;
    }
    grid.innerHTML = list.map((f, idx) => {
        const d      = f.formula_details || {};
        const vol    = parseFloat(f.total_volume) || 0;
        const oils   = (d.oils || []).map(o => {
            const ml    = o.ml ?? ((o.percent * vol) / 100);
            const entry = o.entry || 'pct';
            let detail;
            if (entry === 'drops' && o.drops > 0) {
                detail = `<span class="oil-tag-drops">${o.drops} قطرة</span>`;
            } else if (entry === 'ml' && ml > 0) {
                detail = `<span class="oil-tag-ml">= ${ml.toFixed(1)} مل</span>`;
            } else {
                detail = `<span class="oil-tag-pct">${o.percent}%</span>
                          <span class="oil-tag-ml">= ${ml.toFixed(1)} مل</span>`;
            }
            return `<span class="oil-tag">
                        <span class="oil-tag-name">${esc(o.name)}</span>
                        ${detail}
                    </span>`;
        }).join('');
        const waterDrops = d.water_drops || 0;
        const waterSpan  = waterDrops > 0
            ? `<span>💧 ${waterDrops} قطرة ماء</span>`
            : '';
        return `
        <div class="fav-card" data-id="${f.id}">
            <div class="fav-card-head">
                <label class="check-wrap">
                    <input type="checkbox" class="fav-check item-check" data-id="${f.id}"
                        ${selectedFavIds.has(f.id) ? 'checked' : ''}
                        onchange="toggleFavSel('${f.id}',this.checked)">
                </label>
                <span class="fav-seq">${idx + 1}</span>
                <div class="fav-title">
                    <strong>${esc(f.formula_name)}</strong>
                    ${d.name_en ? `<span class="muted">${esc(d.name_en)}</span>` : ''}
                </div>
                <button class="icon-btn danger" onclick="moveFavToTrash('${f.id}')">🗑️</button>
            </div>
            <div class="fav-meta">
                <span>📦 ${vol} مل</span>
                <span>🍷 ${(d.alcohol_ml||0).toFixed(1)} مل كحول</span>
                ${waterSpan}
                <span class="muted">${fmtDate(f.created_at)}</span>
            </div>
            <div class="oil-tags">${oils}</div>
        </div>`;
    }).join('');
    updateFavBulkBar();
}

function toggleFavSel(id, checked) {
    checked ? selectedFavIds.add(id) : selectedFavIds.delete(id);
    updateFavBulkBar();
}
function toggleAllFav(checked) {
    document.querySelectorAll('.fav-check').forEach(cb => {
        cb.checked = checked;
        checked ? selectedFavIds.add(cb.dataset.id) : selectedFavIds.delete(cb.dataset.id);
    });
    updateFavBulkBar();
}
function updateFavBulkBar() {
    const bar = document.getElementById('fav-bulk-bar');
    const cnt = document.getElementById('fav-sel-count');
    const n = selectedFavIds.size;
    if (bar) bar.style.display = n > 0 ? 'flex' : 'none';
    if (cnt) cnt.textContent = n + ' محدد';
}

async function moveFavToTrash(id) {
    if (!confirm('نقل هذه التركيبة إلى سلة المحذوفات؟\nيمكن استعادتها خلال 30 يوماً.')) return;
    try {
        await dbDeleteFormula(currentUser, id);
        selectedFavIds.delete(id);
        formulas = await dbGetFormulas(currentUser);
        renderFavorites();
        await loadTrash();
        showToast('نُقلت إلى السلة 🗑️ — استعادة خلال 30 يوماً');
    } catch(e) { showToast(e.message, 'error'); }
}

async function bulkDeleteFavorites() {
    if (!selectedFavIds.size) return;
    if (!confirm(`نقل ${selectedFavIds.size} تركيبات إلى السلة؟`)) return;
    try {
        const ids = [...selectedFavIds];
        await Promise.all(ids.map(id => dbDeleteFormula(currentUser, id)));
        selectedFavIds.clear();
        formulas = await dbGetFormulas(currentUser);
        renderFavorites();
        await loadTrash();
        showToast(`نُقل ${ids.length} إلى السلة 🗑️`);
    } catch(e) { showToast(e.message, 'error'); }
}

// ============================================================
//  سلة المحذوفات
// ============================================================
async function loadTrash() {
    try {
        await dbPurgeOldTrash(currentUser);
        trash = await dbGetTrash(currentUser);
        renderTrash();
    } catch(e) {
        console.warn('trash load:', e.message);
    }
}

function renderTrash() {
    const badge = document.getElementById('trash-count-badge');
    if (badge) badge.textContent = trash.length > 0 ? ` (${trash.length})` : '';

    const arrow = document.getElementById('trash-arrow');
    if (arrow) arrow.style.transform = trashOpen ? 'rotate(180deg)' : 'rotate(0deg)';

    const body = document.getElementById('trash-body');
    if (body) body.style.display = trashOpen ? 'block' : 'none';

    const list = document.getElementById('trash-list');
    if (!list) return;

    if (trash.length === 0) {
        list.innerHTML = `<p style="text-align:center;color:var(--muted);padding:16px 0;font-size:13px;">السلة فارغة</p>`;
        updateTrashBulkBar(); return;
    }

    const now = Date.now();
    list.innerHTML = trash.map(f => {
        const daysLeft = Math.max(0, 30 - Math.floor((now - new Date(f.deleted_at)) / 86400000));
        const urgentColor = daysLeft <= 3 ? 'var(--danger)' : 'var(--muted)';
        return `
        <div class="trash-item">
            <input type="checkbox" class="trash-check item-check" data-id="${f.id}"
                   ${selectedTrashIds.has(f.id) ? 'checked' : ''}
                   onchange="toggleTrashSel('${f.id}',this.checked)">
            <div class="trash-info">
                <span class="trash-name">${esc(f.formula_name)}</span>
                <span style="font-size:11px;color:${urgentColor};">⏳ يتبقى ${daysLeft} يوم</span>
            </div>
            <div class="trash-actions">
                <button class="icon-btn" onclick="restoreFromTrash('${f.id}')" title="استعادة">↩️</button>
                <button class="icon-btn danger" onclick="hardDeleteFromTrash('${f.id}')" title="حذف نهائي">✕</button>
            </div>
        </div>`;
    }).join('');
    updateTrashBulkBar();
}

function toggleTrash() {
    trashOpen = !trashOpen;
    localStorage.setItem('sp_trash_open', trashOpen ? '1' : '0');
    renderTrash();
}

function toggleTrashSel(id, checked) {
    checked ? selectedTrashIds.add(id) : selectedTrashIds.delete(id);
    updateTrashBulkBar();
}
function toggleAllTrash(checked) {
    document.querySelectorAll('.trash-check').forEach(cb => {
        cb.checked = checked;
        checked ? selectedTrashIds.add(cb.dataset.id) : selectedTrashIds.delete(cb.dataset.id);
    });
    updateTrashBulkBar();
}
function updateTrashBulkBar() {
    const bar = document.getElementById('trash-bulk-bar');
    const cnt = document.getElementById('trash-sel-count');
    const n = selectedTrashIds.size;
    if (bar) bar.style.display = n > 0 ? 'flex' : 'none';
    if (cnt) cnt.textContent = n + ' محدد';
}

async function restoreFromTrash(id) {
    try {
        await dbRestoreFormula(currentUser, id);
        formulas = await dbGetFormulas(currentUser);
        trash = trash.filter(f => f.id !== id);
        selectedTrashIds.delete(id);
        renderFavorites();
        renderTrash();
        showToast('تمت الاستعادة ↩️');
    } catch(e) { showToast(e.message, 'error'); }
}

async function hardDeleteFromTrash(id) {
    if (!confirm('حذف نهائي لا يمكن التراجع عنه؟')) return;
    try {
        await dbHardDeleteFormula(currentUser, id);
        trash = trash.filter(f => f.id !== id);
        selectedTrashIds.delete(id);
        renderTrash();
        showToast('تم الحذف النهائي 🗑️');
    } catch(e) { showToast(e.message, 'error'); }
}

async function bulkHardDeleteTrash() {
    if (!selectedTrashIds.size) return;
    if (!confirm(`حذف نهائي لـ ${selectedTrashIds.size} تركيبات؟ لا يمكن التراجع.`)) return;
    try {
        const ids = [...selectedTrashIds];
        await Promise.all(ids.map(id => dbHardDeleteFormula(currentUser, id)));
        trash = trash.filter(f => !ids.includes(f.id));
        selectedTrashIds.clear();
        renderTrash();
        showToast('تم الحذف النهائي للمحدد 🗑️');
    } catch(e) { showToast(e.message, 'error'); }
}

// ============================================================
//  تبويب: مخزن الزيوت
// ============================================================
async function addOil() {
    const oil_name   = v('oil-name');
    const price_per_g = parseFloat(document.getElementById('oil-price').value) || 0;
    const note       = v('oil-note');
    if (!oil_name) return showToast('أدخل اسم الزيت ⚠️', 'warn');
    setLoading('oil-add-btn', true);
    try {
        await dbAddOil(currentUser, { oil_name, price_per_g, note });
        oilCatalog = await dbGetOils(currentUser);
        renderOils();
        ['oil-name','oil-price','oil-note'].forEach(id => document.getElementById(id).value = '');
        showToast('تمت الإضافة ✅');
    } catch(e) { showToast(e.message, 'error'); }
    finally { setLoading('oil-add-btn', false); }
}

function sortOils(col) {
    if (oilSortCol === col) oilSortAsc = !oilSortAsc;
    else { oilSortCol = col; oilSortAsc = true; }
    renderOils();
}

/** استخراج تاغ الفئة من أول كلمة في الاسم */
function getOilTag(name) {
    if (!name) return '';
    const word = name.trim().split(/\s+/)[0] || '';
    return word.length >= 2 ? word : '';
}

function toggleOilsAddForm() {
    const wrapper = document.getElementById('oil-add-wrapper');
    const btn     = document.getElementById('oils-toggle-btn');
    if (!wrapper) return;
    const isHidden = wrapper.classList.contains('hidden');
    wrapper.classList.toggle('hidden', !isHidden);
    if (btn) btn.textContent = isHidden ? '▼' : '▲';
    if (isHidden) setTimeout(() => document.getElementById('oil-name')?.focus(), 80);
}

function renderOils() {
    const q = (v('oil-search') || '').toLowerCase();
    const list = oilCatalog.filter(o =>
        o.oil_name.toLowerCase().includes(q) ||
        (o.note || '').toLowerCase().includes(q)
    );
    list.sort((a, b) => {
        let va = a[oilSortCol] ?? '', vb = b[oilSortCol] ?? '';
        if (typeof va === 'string') return oilSortAsc ? va.localeCompare(vb,'ar') : vb.localeCompare(va,'ar');
        return oilSortAsc ? va - vb : vb - va;
    });

    const totalEl   = document.getElementById('oil-total');
    const shownEl   = document.getElementById('oil-shown');
    const sortLabel = document.getElementById('oils-sort-label');
    if (totalEl) totalEl.textContent = oilCatalog.length;
    if (shownEl) shownEl.textContent = list.length;
    if (sortLabel) {
        const lbl = { oil_name:'الاسم', price_per_g:'السعر', created_at:'البداية' };
        sortLabel.textContent = (lbl[oilSortCol] || 'البداية') + (oilSortAsc ? ' ▲' : ' ▼');
    }

    const container = document.getElementById('oils-list');
    if (!container) return;

    if (list.length === 0) {
        container.innerHTML = `<p class="empty-msg" style="padding:44px 0;">لا توجد زيوت مطابقة</p>`;
        updateOilBulkBar(); return;
    }

    container.innerHTML = list.map(o => {
        const tag   = getOilTag(o.oil_name);
        const price = o.price_per_g
            ? `${Number(o.price_per_g).toLocaleString('ar')} ر.س / جم`
            : '—';
        return `
        <div class="oil-table-row" data-id="${o.id}">
            <input type="checkbox" class="oil-check item-check" data-id="${o.id}"
                   ${selectedOilIds.has(o.id) ? 'checked' : ''}
                   onchange="toggleOilSel('${o.id}',this.checked)">
            <div class="oil-name-cell">
                <span class="oil-name-text">${esc(o.oil_name)}</span>
                ${tag ? `<span class="oil-cat-tag">${esc(tag)}</span>` : ''}
            </div>
            <span class="oil-price-badge">${esc(price)}</span>
            <span class="oil-note-cell">${esc(o.note || '')}</span>
            <div class="oil-actions-cell">
                <button class="btn-add-formula" onclick="useOilInFormula('${o.id}')">+ تركيبة</button>
                <button class="btn-del-oil"  onclick="deleteOil('${o.id}')"   title="حذف">🗑️</button>
                <button class="btn-edit-oil" onclick="showEditOil('${o.id}')" title="تعديل">✏️</button>
            </div>
        </div>`;
    }).join('');

    updateOilBulkBar();
}

function toggleOilSel(id, checked) {
    checked ? selectedOilIds.add(id) : selectedOilIds.delete(id);
    updateOilBulkBar();
}
function toggleAllOils(checked) {
    document.querySelectorAll('.oil-check').forEach(cb => {
        cb.checked = checked;
        checked ? selectedOilIds.add(cb.dataset.id) : selectedOilIds.delete(cb.dataset.id);
    });
    updateOilBulkBar();
}
function updateOilBulkBar() {
    const cnt = document.getElementById('oil-sel-count');
    const btn = document.getElementById('oil-bulk-delete-btn');
    const allCb = document.getElementById('oil-check-all');
    const n = selectedOilIds.size;
    if (cnt) cnt.textContent = n + ' محدد';
    if (btn) btn.style.display = n > 0 ? 'inline-flex' : 'none';
    if (allCb) {
        allCb.checked = n > 0 && n === oilCatalog.length;
        allCb.indeterminate = n > 0 && n < oilCatalog.length;
    }
}

async function deleteOil(id) {
    if (!confirm('حذف هذا الزيت نهائياً؟')) return;
    try {
        await dbDeleteOil(currentUser, id);
        selectedOilIds.delete(id);
        oilCatalog = await dbGetOils(currentUser);
        renderOils();
        showToast('تم الحذف 🗑️');
    } catch(e) { showToast(e.message, 'error'); }
}

async function bulkDeleteOils() {
    if (!selectedOilIds.size) return;
    if (!confirm(`حذف ${selectedOilIds.size} زيوت محددة نهائياً؟`)) return;
    try {
        await Promise.all([...selectedOilIds].map(id => dbDeleteOil(currentUser, id)));
        selectedOilIds.clear();
        oilCatalog = await dbGetOils(currentUser);
        renderOils();
        showToast('تم حذف الزيوت المحددة 🗑️');
    } catch(e) { showToast(e.message, 'error'); }
}

function useOilInFormula(id) {
    const oil = oilCatalog.find(o => o.id === id);
    if (!oil) return;
    const name = oil.oil_name;
    switchTab('formula');
    const rows = document.querySelectorAll('.f-oil-row');
    let placed = false;
    for (const row of rows) {
        const nameInput = row.querySelector('.f-oil-name');
        if (!nameInput.value.trim()) {
            nameInput.value = name;
            nameInput.focus();
            placed = true;
            break;
        }
    }
    if (!placed) {
        addOilRow();
        const newRows = document.querySelectorAll('.f-oil-row');
        const lastRow = newRows[newRows.length - 1];
        const nameInput = lastRow.querySelector('.f-oil-name');
        nameInput.value = name;
        nameInput.focus();
    }
    showToast(`تم نقل "${name}" إلى التركيبة ✅`);
}

// تعديل الزيت — نجلب البيانات من المصفوفة بالـ ID فقط
function showEditOil(id) {
    const oil = oilCatalog.find(o => o.id === id);
    if (!oil) return;
    document.getElementById('edit-oil-id').value    = oil.id;
    document.getElementById('edit-oil-name').value  = oil.oil_name;
    document.getElementById('edit-oil-price').value = oil.price_per_g ?? '';
    document.getElementById('edit-oil-note').value  = oil.note ?? '';
    showErr('edit-oil-err', '');
    document.getElementById('edit-oil-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('edit-oil-name').focus(), 80);
}
function hideEditOil() {
    document.getElementById('edit-oil-modal').classList.add('hidden');
}
async function handleEditOil() {
    const id         = document.getElementById('edit-oil-id').value;
    const oil_name   = document.getElementById('edit-oil-name').value.trim();
    const price_per_g = parseFloat(document.getElementById('edit-oil-price').value) || 0;
    const note       = document.getElementById('edit-oil-note').value.trim();
    if (!oil_name) return showErr('edit-oil-err', 'يرجى إدخال اسم الزيت');
    setLoading('edit-oil-btn', true);
    try {
        await dbUpdateOil(currentUser, id, { oil_name, price_per_g, note });
        oilCatalog = await dbGetOils(currentUser);
        hideEditOil();
        renderOils();
        showToast('تم التعديل ✅');
    } catch(e) { showErr('edit-oil-err', e.message); }
    finally { setLoading('edit-oil-btn', false); }
}

// ============================================================
//  مساعدات عامة
// ============================================================
function v(id) { return document.getElementById(id)?.value?.trim() || ''; }
function esc(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function fmtDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('ar-SA', {year:'numeric',month:'short',day:'numeric'});
}
function showErr(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('hidden', !msg);
}
function setLoading(id, on, isDiv = false) {
    const el = document.getElementById(id);
    if (!el) return;
    if (isDiv) { el.style.display = on ? 'flex' : 'none'; return; }
    el.disabled = on;
    el.dataset.orig = el.dataset.orig || el.textContent;
    el.textContent = on ? '...' : el.dataset.orig;
}
let toastTimer;
function showToast(msg, type = 'ok') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className   = 'toast show ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.className = 'toast', 3500);
}
