// ============================================================
//  supabase.js  |  العطور الذكي
//  التهيئة + المصادقة بالتوكن + عمليات CRUD عبر دوال SECURITY DEFINER
//
//  ملاحظة أمنية (تأمين 2026-10 — ملف 14_perfumes_rpc.sql):
//  ── لا يلمس المتصفح أي جدول مباشرة. كل شيء عبر دوال في القاعدة.
//  ── الهوية تُستخرج في القاعدة من توكن الجلسة (app_sessions)، ولم
//     تعد تُؤخذ من أي user_id يرسله المتصفح. كانت الدوال القديمة
//     تصدّق p_user_id، فكان يكفي تغييره لقراءة بيانات أي مستخدم.
//  ── كلمة المرور تُرسل خاماً فوق TLS والقاعدة وحدها تهشّرها bcrypt.
//     لم تعد تُهشَّر في المتصفح (hashPassword أُزيلت).
//  ── المفتاح العام أدناه لا يمنح وحده أي وصول بعد ملف الإقفال 15.
// ============================================================

const APP_ORIGIN = 'perfumes';

const SUPABASE_URL      = 'https://tvbuvwjkojhqcxhyehfs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YnV2d2prb2pocWN4aHllaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDE4MTUsImV4cCI6MjA5MjI3NzgxNX0.egwryYwKu_Bicl_koaYXaKGBoxz42c6k4VkMD9aZSWQ';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
//  توكن الجلسة — هو وحده ما يثبت الهوية للقاعدة
// ============================================================

const TOKEN_KEY = 'sp_session_token';
let SB_TOKEN = null;

/** «تذكرني» ⇒ تخزين دائم. غير ذلك ⇒ تخزين الجلسة فقط. */
function setSessionToken(token, remember = true) {
    SB_TOKEN = token || null;
    try { localStorage.removeItem(TOKEN_KEY);   } catch(_) {}
    try { sessionStorage.removeItem(TOKEN_KEY); } catch(_) {}
    if (!token) return;
    try {
        if (remember) localStorage.setItem(TOKEN_KEY, token);
        else          sessionStorage.setItem(TOKEN_KEY, token);
    } catch(_) {}
}

function getSessionToken() {
    if (!SB_TOKEN) {
        try { SB_TOKEN = sessionStorage.getItem(TOKEN_KEY); } catch(_) {}
        if (!SB_TOKEN) { try { SB_TOKEN = localStorage.getItem(TOKEN_KEY); } catch(_) {} }
    }
    return SB_TOKEN || '';
}

// ============================================================
//  مساعد الاستدعاء
// ============================================================

function pgMsg(error) {
    return error?.message || error?.hint || 'حدث خطأ غير متوقع';
}

/** استدعاء دالة في القاعدة. يرفع Error برسالة القاعدة نفسها. */
async function rpc(fn, args = {}) {
    const { data, error } = await sb.rpc(fn, args);
    if (error) {
        const msg = pgMsg(error);
        if (/unauthorized|28000|permission denied|JWT/i.test(msg)) {
            setSessionToken(null);
        }
        throw new Error(msg);
    }
    return data;
}

/** استدعاء يتطلب جلسة — يمرّر التوكن ولا يرسل أي اسم مستخدم.
 *  (وجودها في الـ console دليل أن النسخة الجديدة منشورة:
 *   typeof rpcAuth  ⟵  'function') */
function rpcAuth(fn, args = {}) {
    const token = getSessionToken();
    if (!token) return Promise.reject(new Error('انتهت الجلسة — سجّل الدخول من جديد'));
    return rpc(fn, Object.assign({ p_token: token }, args));
}

/** المعرّفات تُمرَّر دائماً كمصفوفة نصية، فدالة واحدة تكفي للحذف المتعدد. */
function idList(id) {
    return (Array.isArray(id) ? id : [id]).filter(Boolean).map(String);
}

// ============================================================
//  المصادقة  (Auth)
// ============================================================

async function dbRegister(userId, password, hint = '') {
    const u = (userId || '').trim();
    if (!u || !password) throw new Error('يرجى إدخال الاسم وكلمة المرور');
    if (u.length < 2)    throw new Error('اسم المستخدم قصير جداً');
    if (password.length < 4) throw new Error('كلمة المرور يجب أن تكون 4 أحرف على الأقل');

    const res = await rpc('app_signup', {
        p_user: u, p_pass: password, p_hint: hint || '', p_origin: APP_ORIGIN
    });
    if (res?.taken) throw new Error('هذا الاسم مسجل مسبقاً — جرب اسماً آخر');
    if (!res?.ok)   throw new Error('تعذّر إنشاء الحساب (' + (res?.error || 'غير معروف') + ')');
    // التوكن العائد من التسجيل لا يُستعمل: الواجهة تعيد المستخدم لشاشة الدخول
    if (res.token) rpc('app_logout', { p_token: res.token }).catch(() => {});
    return u;
}

async function dbLogin(userId, password, remember = true) {
    const u = (userId || '').trim();
    if (!u || !password) throw new Error('يرجى إدخال الاسم وكلمة المرور');

    // كلمة المرور خاماً — القاعدة تهشّرها وتتحقق منها
    const res = await rpc('app_login', { p_user: u, p_pass: password, p_origin: APP_ORIGIN });
    if (res?.ok) {
        setSessionToken(res.token, remember);
        return u;
    }
    if (res?.locked)        throw new Error('أُقفل الحساب مؤقتاً بعد محاولات كثيرة — انتظر ١٥ دقيقة');
    if (res?.exists === false) throw new Error('اسم المستخدم غير مسجّل');
    throw new Error('الاسم أو كلمة المرور غير صحيحة');
}

/** القاعدة وحدها تقرّر صلاحية الجلسة — لا يُقرأ ذلك من تخزين المتصفح. */
async function dbSessionUser() {
    const token = getSessionToken();
    if (!token) return null;
    try {
        const u = await rpc('app_session_user', { p_token: token });
        if (u) return u;
    } catch(_) {}
    setSessionToken(null);
    return null;
}

/** إبطال التوكن في القاعدة، لا في المتصفح وحده. */
async function dbLogout() {
    const token = getSessionToken();
    setSessionToken(null);
    if (token) { try { await rpc('app_logout', { p_token: token }); } catch(_) {} }
}

async function dbGetPassHint(userId) {
    const u = (userId || '').trim();
    if (!u) return '';
    const res = await rpc('app_get_hint', { p_user: u });
    if (!res?.exists) throw new Error('اسم المستخدم غير مسجّل');
    return res.hint || '';
}

/** إعادة التعيين بالتلميح — المنفذ الوحيد لاستعادة حساب نُسيت كلمته.
 *  القاعدة تطابق التلميح وتبطل كل جلسات الحساب القديمة.
 *  ملاحظة مقصودة: التلميح مكشوف في الخطوة السابقة، فالمطابقة شكلية —
 *  وهو نفس سلوك بقية التطبيقات. */
async function dbResetWithHint(userId, hint, newPassword) {
    const u = (userId || '').trim();
    if (!u) throw new Error('اكتب اسم المستخدم أولاً');
    if (!newPassword || newPassword.length < 4)
        throw new Error('كلمة المرور يجب أن تكون 4 أحرف على الأقل');

    const res = await rpc('app_reset_with_hint', {
        p_user: u, p_hint: hint || '', p_newpass: newPassword
    });
    if (!res?.ok) {
        const err = res?.error || '';
        if (err === 'hint_mismatch')  throw new Error('لا يوجد تلميح محفوظ لهذا الحساب — تعذّرت إعادة التعيين');
        if (err === 'locked')         throw new Error('أُقفل الحساب مؤقتاً بعد محاولات كثيرة — انتظر ١٥ دقيقة');
        if (err === 'user_not_found') throw new Error('اسم المستخدم غير مسجّل');
        throw new Error('تعذّر التغيير (' + (err || 'غير معروف') + ')');
    }
    setSessionToken(null);
}

async function dbUpdatePassHint(_userId, hint) {
    await rpcAuth('perf_set_hint', { p_hint: hint || '' });
}

async function dbChangePassword(_userId, oldPassword, newPassword) {
    const res = await rpcAuth('app_change_password', { p_old: oldPassword, p_new: newPassword });
    if (!res?.ok) {
        const err = res?.error || '';
        if (err === 'wrong_old_password') throw new Error('كلمة المرور الحالية غير صحيحة');
        if (err === 'unauthorized')       throw new Error('انتهت الجلسة — سجّل الدخول من جديد');
        if (err === 'invalid_input')      throw new Error('كلمة المرور الجديدة قصيرة جداً');
        throw new Error('تعذّر التغيير (' + (err || 'غير معروف') + ')');
    }
}

// ============================================================
//  المشتريات  (perfume_purchases)
// ============================================================

async function dbGetPurchases(_userId) {
    return await rpcAuth('perf_purchases_fetch') ?? [];
}

async function dbAddPurchase(_userId, { oil_name, price, quantity, location, note }) {
    await rpcAuth('perf_purchase_add', {
        p_item: { oil_name, price, quantity, location, note }
    });
}

async function dbDeletePurchase(_userId, id) {
    await rpcAuth('perf_purchase_delete', { p_ids: idList(id) });
}

// ============================================================
//  التركيبات / المفضلة  (perfume_formulas)
//  الحذف هنا ناعم → ينقل إلى السلة
// ============================================================

async function dbGetFormulas(_userId) {
    return await rpcAuth('perf_formulas_fetch', { p_trash: false }) ?? [];
}

/** القاعدة تعيد حساب المل والقطرات والماء والكحول من المُدخَل،
 *  وترفض الاسم المكرر. فلا يُعتمد على أي رقم محسوب في المتصفح. */
async function dbAddFormula(_userId, { formula_name, total_volume, formula_details }) {
    await rpcAuth('perf_formula_add', {
        p_item: { formula_name, total_volume, formula_details }
    });
}

/** حذف ناعم → ينقل التركيبة إلى السلة */
async function dbDeleteFormula(_userId, id) {
    await rpcAuth('perf_formula_soft_delete', { p_ids: idList(id) });
}

// ============================================================
//  سلة المحذوفات  (trash)
// ============================================================

async function dbGetTrash(_userId) {
    return await rpcAuth('perf_formulas_fetch', { p_trash: true }) ?? [];
}

/** استعادة تركيبة من السلة إلى المفضلة */
async function dbRestoreFormula(_userId, id) {
    const res = await rpcAuth('perf_formula_restore', { p_ids: idList(id) });
    if (!res?.count) throw new Error('تعذّرت الاستعادة — قد توجد تركيبة نشطة بنفس الاسم');
}

/** حذف نهائي من السلة */
async function dbHardDeleteFormula(_userId, id) {
    await rpcAuth('perf_formula_hard_delete', { p_ids: idList(id) });
}

/** تنظيف تلقائي: الحذف النهائي لما مضى عليه أكثر من 30 يوماً.
 *  المدة تُحسب في القاعدة ولم تعد تأتي من المتصفح. */
async function dbPurgeOldTrash(_userId) {
    try { await rpcAuth('perf_formula_purge_old'); }
    catch (e) { console.warn('purge error:', e.message); }
}

// ============================================================
//  مخزن الزيوت  (perfume_oils)
// ============================================================

async function dbGetOils(_userId) {
    return await rpcAuth('perf_oils_fetch') ?? [];
}

async function dbAddOil(_userId, { oil_name, price_per_g, note }) {
    await rpcAuth('perf_oil_add', { p_item: { oil_name, price_per_g, note } });
}

async function dbDeleteOil(_userId, id) {
    await rpcAuth('perf_oil_delete', { p_ids: idList(id) });
}

async function dbUpdateOil(_userId, id, { oil_name, price_per_g, note }) {
    await rpcAuth('perf_oil_update', {
        p_id: String(id), p_item: { oil_name, price_per_g, note }
    });
}
