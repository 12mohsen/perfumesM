// ============================================================
//  supabase.js  |  العطور الذكي
//  التهيئة + المصادقة + عمليات CRUD عبر RPC (SECURITY DEFINER)
// ============================================================

const APP_ORIGIN = 'perfumes';

const SUPABASE_URL      = 'https://tvbuvwjkojhqcxhyehfs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YnV2d2prb2pocWN4aHllaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDE4MTUsImV4cCI6MjA5MjI3NzgxNX0.egwryYwKu_Bicl_koaYXaKGBoxz42c6k4VkMD9aZSWQ';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
//  مساعد
// ============================================================

async function hashPassword(password) {
    const raw     = APP_ORIGIN + ':' + password;
    const encoded = new TextEncoder().encode(raw);
    const buffer  = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(buffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
}

function pgMsg(error) {
    return error?.message || 'حدث خطأ غير متوقع';
}

// ============================================================
//  المصادقة  (Auth)
// ============================================================

async function dbRegister(userId, password, hint = '') {
    if (!userId?.trim() || !password)
        throw new Error('يرجى إدخال الاسم وكلمة المرور');
    const passHash = await hashPassword(password);
    const { error } = await sb.rpc('auth_register', {
        p_user_id: userId.trim(), p_pass_hash: passHash, p_origin: APP_ORIGIN, p_hint: hint
    });
    if (error) throw new Error(pgMsg(error));
    return userId.trim();
}

async function dbGetPassHint(userId) {
    const { data, error } = await sb.rpc('get_pass_hint', {
        p_user_id: userId.trim(), p_origin: APP_ORIGIN
    });
    if (error) throw new Error(pgMsg(error));
    return data ?? '';
}

async function dbUpdatePassHint(userId, hint) {
    const { error } = await sb.rpc('update_pass_hint', {
        p_user_id: userId, p_origin: APP_ORIGIN, p_hint: hint
    });
    if (error) throw new Error(pgMsg(error));
}

async function dbLogin(userId, password) {
    if (!userId?.trim() || !password)
        throw new Error('يرجى إدخال الاسم وكلمة المرور');
    const passHash = await hashPassword(password);
    const { data, error } = await sb.rpc('auth_login', {
        p_user_id: userId.trim(), p_pass_hash: passHash, p_origin: APP_ORIGIN
    });
    if (error || !data) throw new Error('الاسم أو كلمة المرور غير صحيحة');
    return data;
}

async function dbChangePassword(userId, oldPassword, newPassword) {
    const oldHash = await hashPassword(oldPassword);
    const newHash = await hashPassword(newPassword);
    const { error } = await sb.rpc('auth_change_password', {
        p_user_id:  userId,
        p_old_hash: oldHash,
        p_new_hash: newHash,
        p_origin:   APP_ORIGIN
    });
    if (error) throw new Error(pgMsg(error));
}

// ============================================================
//  المشتريات  (perfume_purchases)
// ============================================================

async function dbGetPurchases(userId) {
    const { data, error } = await sb.rpc('get_purchases_for_user', { p_user_id: userId });
    if (error) throw error;
    return data ?? [];
}

async function dbAddPurchase(userId, { oil_name, price, quantity, location, note }) {
    const { error } = await sb.rpc('add_purchase_for_user', {
        p_user_id: userId, p_oil_name: oil_name,
        p_price: price, p_quantity: quantity, p_location: location, p_note: note
    });
    if (error) throw error;
}

async function dbDeletePurchase(userId, id) {
    const { error } = await sb.rpc('del_purchase_for_user', { p_user_id: userId, p_id: id });
    if (error) throw error;
}

// ============================================================
//  التركيبات / المفضلة  (perfume_formulas)
//  الحذف هنا ناعم → ينقل إلى السلة
// ============================================================

async function dbGetFormulas(userId) {
    const { data, error } = await sb.rpc('get_formulas_for_user', { p_user_id: userId });
    if (error) throw error;
    return data ?? [];
}

async function dbAddFormula(userId, { formula_name, total_volume, formula_details }) {
    const { error } = await sb.rpc('add_formula_for_user', {
        p_user_id: userId, p_formula_name: formula_name,
        p_total_volume: total_volume, p_formula_details: formula_details
    });
    if (error) throw error;
}

/** حذف ناعم → ينقل التركيبة إلى السلة */
async function dbDeleteFormula(userId, id) {
    const { error } = await sb.rpc('del_formula_for_user', { p_user_id: userId, p_id: id });
    if (error) throw error;
}

// ============================================================
//  سلة المحذوفات  (trash)
// ============================================================

/** جلب التركيبات الموجودة في السلة */
async function dbGetTrash(userId) {
    const { data, error } = await sb.rpc('get_trash_formulas', { p_user_id: userId });
    if (error) throw error;
    return data ?? [];
}

/** استعادة تركيبة من السلة إلى المفضلة */
async function dbRestoreFormula(userId, id) {
    const { error } = await sb.rpc('restore_formula', { p_user_id: userId, p_id: id });
    if (error) throw error;
}

/** حذف نهائي من السلة */
async function dbHardDeleteFormula(userId, id) {
    const { error } = await sb.rpc('hard_del_formula', { p_user_id: userId, p_id: id });
    if (error) throw error;
}

/** تنظيف تلقائي: حذف نهائي لكل ما مضى عليه أكثر من 30 يوماً */
async function dbPurgeOldTrash(userId) {
    const { error } = await sb.rpc('purge_old_trash', { p_user_id: userId });
    if (error) console.warn('purge error:', error.message);
}

// ============================================================
//  مخزن الزيوت  (perfume_oils)
// ============================================================

async function dbGetOils(userId) {
    const { data, error } = await sb.rpc('get_oils_for_user', { p_user_id: userId });
    if (error) throw error;
    return data ?? [];
}

async function dbAddOil(userId, { oil_name, price_per_g, note }) {
    const { error } = await sb.rpc('add_oil_for_user', {
        p_user_id: userId, p_oil_name: oil_name,
        p_price_per_g: price_per_g, p_note: note
    });
    if (error) throw error;
}

async function dbDeleteOil(userId, id) {
    const { error } = await sb.rpc('del_oil_for_user', { p_user_id: userId, p_id: id });
    if (error) throw error;
}

async function dbUpdateOil(userId, id, { oil_name, price_per_g, note }) {
    const { error } = await sb.rpc('update_oil_for_user', {
        p_user_id: userId, p_id: id,
        p_oil_name: oil_name, p_price_per_g: price_per_g, p_note: note
    });
    if (error) throw error;
}
