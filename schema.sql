-- ============================================================
--  العطور الذكي  |  Schema كامل
--  شغّله في Supabase → SQL Editor (يعمل على قاعدة جديدة أو موجودة)
-- ============================================================

-- ============================================================
--  ① جدول المستخدمين  users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    user_id      TEXT        PRIMARY KEY,
    pass_hash    TEXT        NOT NULL,
    created_from TEXT        NOT NULL DEFAULT 'perfumes',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;


-- ============================================================
--  ② جدول المشتريات  perfume_purchases
-- ============================================================
CREATE TABLE IF NOT EXISTS perfume_purchases (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    oil_name    TEXT          NOT NULL DEFAULT '',
    price       NUMERIC(12,2) NOT NULL DEFAULT 0,
    quantity    NUMERIC(12,2) NOT NULL DEFAULT 0,
    location    TEXT          NOT NULL DEFAULT '',
    note        TEXT          NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
ALTER TABLE perfume_purchases ENABLE ROW LEVEL SECURITY;


-- ============================================================
--  ③ جدول التركيبات  perfume_formulas
--     deleted_at = NULL  ← نشط
--     deleted_at = تاريخ ← في السلة (يُحذف نهائياً بعد 30 يوماً)
-- ============================================================
CREATE TABLE IF NOT EXISTS perfume_formulas (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    formula_name    TEXT          NOT NULL DEFAULT '',
    total_volume    NUMERIC(10,2) NOT NULL DEFAULT 0,
    formula_details JSONB         NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ   DEFAULT NULL   -- سلة المحذوفات
);
ALTER TABLE perfume_formulas ENABLE ROW LEVEL SECURITY;

-- إضافة العمود للجداول الموجودة (يتجاهل إذا كان موجوداً)
DO $$ BEGIN
    ALTER TABLE perfume_formulas ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;


-- ============================================================
--  ④ جدول مخزن الزيوت  perfume_oils
-- ============================================================
CREATE TABLE IF NOT EXISTS perfume_oils (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      TEXT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    oil_name     TEXT          NOT NULL DEFAULT '',
    price_per_g  NUMERIC(10,2) NOT NULL DEFAULT 0,
    note         TEXT          NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
ALTER TABLE perfume_oils ENABLE ROW LEVEL SECURITY;


-- ============================================================
--  ⑤ فهارس
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_pp_user ON perfume_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_pf_user ON perfume_formulas(user_id);
CREATE INDEX IF NOT EXISTS idx_po_user ON perfume_oils(user_id);


-- ============================================================
--  ⑥ دوال المصادقة
-- ============================================================

-- تسجيل مستخدم جديد
CREATE OR REPLACE FUNCTION auth_register(p_user_id TEXT, p_pass_hash TEXT, p_origin TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE user_id = p_user_id AND created_from = p_origin) THEN
        RAISE EXCEPTION 'هذا الاسم مسجل مسبقاً — جرب اسماً آخر';
    END IF;
    INSERT INTO users (user_id, pass_hash, created_from) VALUES (p_user_id, p_pass_hash, p_origin);
    RETURN p_user_id;
END;
$$;

-- تسجيل الدخول
CREATE OR REPLACE FUNCTION auth_login(p_user_id TEXT, p_pass_hash TEXT, p_origin TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_uid TEXT;
BEGIN
    SELECT user_id INTO v_uid FROM users
    WHERE user_id = p_user_id AND pass_hash = p_pass_hash AND created_from = p_origin;
    IF v_uid IS NULL THEN RAISE EXCEPTION 'الاسم أو كلمة المرور غير صحيحة'; END IF;
    RETURN v_uid;
END;
$$;

-- تغيير كلمة المرور
CREATE OR REPLACE FUNCTION auth_change_password(
    p_user_id TEXT, p_old_hash TEXT, p_new_hash TEXT, p_origin TEXT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE user_id = p_user_id AND pass_hash = p_old_hash AND created_from = p_origin
    ) THEN
        RAISE EXCEPTION 'كلمة المرور الحالية غير صحيحة';
    END IF;
    UPDATE users SET pass_hash = p_new_hash
    WHERE user_id = p_user_id AND created_from = p_origin;
END;
$$;

GRANT EXECUTE ON FUNCTION auth_register         TO anon;
GRANT EXECUTE ON FUNCTION auth_login            TO anon;
GRANT EXECUTE ON FUNCTION auth_change_password  TO anon;


-- ============================================================
--  ⑦ دوال المشتريات
-- ============================================================

CREATE OR REPLACE FUNCTION get_purchases_for_user(p_user_id TEXT)
RETURNS SETOF perfume_purchases LANGUAGE sql SECURITY DEFINER AS $$
    SELECT * FROM perfume_purchases WHERE user_id = p_user_id ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION add_purchase_for_user(
    p_user_id TEXT, p_oil_name TEXT, p_price NUMERIC,
    p_quantity NUMERIC, p_location TEXT, p_note TEXT
)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
    INSERT INTO perfume_purchases (user_id, oil_name, price, quantity, location, note)
    VALUES (p_user_id, p_oil_name, p_price, p_quantity, p_location, p_note);
$$;

CREATE OR REPLACE FUNCTION del_purchase_for_user(p_user_id TEXT, p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
    DELETE FROM perfume_purchases WHERE id = p_id AND user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION get_purchases_for_user TO anon;
GRANT EXECUTE ON FUNCTION add_purchase_for_user  TO anon;
GRANT EXECUTE ON FUNCTION del_purchase_for_user  TO anon;


-- ============================================================
--  ⑧ دوال التركيبات  (مع نظام سلة المحذوفات)
-- ============================================================

-- جلب التركيبات النشطة فقط (deleted_at IS NULL)
CREATE OR REPLACE FUNCTION get_formulas_for_user(p_user_id TEXT)
RETURNS SETOF perfume_formulas LANGUAGE sql SECURITY DEFINER AS $$
    SELECT * FROM perfume_formulas
    WHERE user_id = p_user_id AND deleted_at IS NULL
    ORDER BY created_at DESC;
$$;

-- إضافة تركيبة جديدة
CREATE OR REPLACE FUNCTION add_formula_for_user(
    p_user_id TEXT, p_formula_name TEXT,
    p_total_volume NUMERIC, p_formula_details JSONB
)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
    INSERT INTO perfume_formulas (user_id, formula_name, total_volume, formula_details)
    VALUES (p_user_id, p_formula_name, p_total_volume, p_formula_details);
$$;

-- حذف ناعم → ينقل إلى السلة (deleted_at = NOW())
CREATE OR REPLACE FUNCTION del_formula_for_user(p_user_id TEXT, p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
    UPDATE perfume_formulas
    SET deleted_at = NOW()
    WHERE id = p_id AND user_id = p_user_id AND deleted_at IS NULL;
$$;

-- جلب السلة (deleted_at IS NOT NULL)
CREATE OR REPLACE FUNCTION get_trash_formulas(p_user_id TEXT)
RETURNS SETOF perfume_formulas LANGUAGE sql SECURITY DEFINER AS $$
    SELECT * FROM perfume_formulas
    WHERE user_id = p_user_id AND deleted_at IS NOT NULL
    ORDER BY deleted_at DESC;
$$;

-- استعادة تركيبة من السلة
CREATE OR REPLACE FUNCTION restore_formula(p_user_id TEXT, p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
    UPDATE perfume_formulas
    SET deleted_at = NULL
    WHERE id = p_id AND user_id = p_user_id AND deleted_at IS NOT NULL;
$$;

-- حذف نهائي من السلة (يرفض التركيبات النشطة)
CREATE OR REPLACE FUNCTION hard_del_formula(p_user_id TEXT, p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
    DELETE FROM perfume_formulas
    WHERE id = p_id AND user_id = p_user_id AND deleted_at IS NOT NULL;
$$;

-- تنظيف تلقائي: حذف نهائي لكل ما مضى عليه أكثر من 30 يوماً في السلة
CREATE OR REPLACE FUNCTION purge_old_trash(p_user_id TEXT)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
    DELETE FROM perfume_formulas
    WHERE user_id = p_user_id
      AND deleted_at IS NOT NULL
      AND deleted_at < NOW() - INTERVAL '30 days';
$$;

GRANT EXECUTE ON FUNCTION get_formulas_for_user TO anon;
GRANT EXECUTE ON FUNCTION add_formula_for_user  TO anon;
GRANT EXECUTE ON FUNCTION del_formula_for_user  TO anon;
GRANT EXECUTE ON FUNCTION get_trash_formulas    TO anon;
GRANT EXECUTE ON FUNCTION restore_formula       TO anon;
GRANT EXECUTE ON FUNCTION hard_del_formula      TO anon;
GRANT EXECUTE ON FUNCTION purge_old_trash       TO anon;


-- ============================================================
--  ⑨ دوال مخزن الزيوت
-- ============================================================

CREATE OR REPLACE FUNCTION get_oils_for_user(p_user_id TEXT)
RETURNS SETOF perfume_oils LANGUAGE sql SECURITY DEFINER AS $$
    SELECT * FROM perfume_oils WHERE user_id = p_user_id ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION add_oil_for_user(
    p_user_id TEXT, p_oil_name TEXT, p_price_per_g NUMERIC, p_note TEXT
)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
    INSERT INTO perfume_oils (user_id, oil_name, price_per_g, note)
    VALUES (p_user_id, p_oil_name, p_price_per_g, p_note);
$$;

CREATE OR REPLACE FUNCTION del_oil_for_user(p_user_id TEXT, p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
    DELETE FROM perfume_oils WHERE id = p_id AND user_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION update_oil_for_user(
    p_user_id TEXT, p_id UUID, p_oil_name TEXT, p_price_per_g NUMERIC, p_note TEXT
)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
    UPDATE perfume_oils
    SET oil_name = p_oil_name, price_per_g = p_price_per_g, note = p_note
    WHERE id = p_id AND user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION get_oils_for_user    TO anon;
GRANT EXECUTE ON FUNCTION add_oil_for_user     TO anon;
GRANT EXECUTE ON FUNCTION del_oil_for_user     TO anon;
GRANT EXECUTE ON FUNCTION update_oil_for_user  TO anon;


-- ============================================================
--  ⑩ تلميح كلمة المرور  (pass_hint)
-- ============================================================

-- إضافة عمود التلميح للمستخدمين (يتجاهل إذا كان موجوداً)
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN pass_hint TEXT NOT NULL DEFAULT '';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- تحديث دالة التسجيل لتقبل التلميح
CREATE OR REPLACE FUNCTION auth_register(p_user_id TEXT, p_pass_hash TEXT, p_origin TEXT, p_hint TEXT DEFAULT '')
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE user_id = p_user_id AND created_from = p_origin) THEN
        RAISE EXCEPTION 'هذا الاسم مسجل مسبقاً — جرب اسماً آخر';
    END IF;
    INSERT INTO users (user_id, pass_hash, created_from, pass_hint)
    VALUES (p_user_id, p_pass_hash, p_origin, p_hint);
    RETURN p_user_id;
END;
$$;

-- جلب التلميح (يُعيد '' إذا لم يوجد المستخدم)
CREATE OR REPLACE FUNCTION get_pass_hint(p_user_id TEXT, p_origin TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_hint TEXT;
BEGIN
    SELECT pass_hint INTO v_hint FROM users
    WHERE user_id = p_user_id AND created_from = p_origin;
    RETURN COALESCE(v_hint, '');
END;
$$;

GRANT EXECUTE ON FUNCTION auth_register(TEXT,TEXT,TEXT,TEXT)  TO anon;
GRANT EXECUTE ON FUNCTION get_pass_hint(TEXT,TEXT)            TO anon;

-- تحديث التلميح للمستخدم المسجّل دخوله
CREATE OR REPLACE FUNCTION update_pass_hint(p_user_id TEXT, p_origin TEXT, p_hint TEXT)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
    UPDATE users SET pass_hint = p_hint
    WHERE user_id = p_user_id AND created_from = p_origin;
$$;
GRANT EXECUTE ON FUNCTION update_pass_hint(TEXT,TEXT,TEXT) TO anon;
