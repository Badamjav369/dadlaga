-- =====================================================
--  internship_system — ТУРШИЛТЫН ӨГӨГДӨЛ
--
--  schema.sql ажилласны ДАРАА ажиллуулна.
--
--  Бүх бүртгэлийн нууц үг: 123456
--  (өгөгдлийн санд bcrypt hash-аар хадгалагдана)
--
--  Салбар, байршлыг нэрээр нь хайж id-г олно. Ингэснээр
--  id гараар бичих шаардлагагүй — schema.sql-д дугаар
--  өөрчлөгдсөн ч энэ файл ажиллана.
--
--  Дахин ажиллуулах бол эхлээд цэвэрлэнэ:
--    SET FOREIGN_KEY_CHECKS = 0;
--    TRUNCATE internship_requests;
--    TRUNCATE internship_positions;
--    TRUNCATE organizations;
--    TRUNCATE students;
--    SET FOREIGN_KEY_CHECKS = 1;
-- =====================================================

USE internship_system;

SET @pw = '$2b$10$.vyREofqHwgT1lmwDKQ8CeHqbgiEcrkaNk8rwL2F//awV/zvrnzDO';  -- 123456


-- =====================================================
--  1. БАЙГУУЛЛАГА (8)
-- =====================================================
INSERT INTO organizations
  (name, username, password, email, phone, industry_id, location_id, website)
VALUES
('Ай Ти Зон ХХК', 'itzone', @pw, 'hr@itzone.mn', '77001100',
 (SELECT industry_id FROM industries WHERE name = 'Мэдээллийн технологи'),
 (SELECT location_id FROM locations  WHERE name = 'Улаанбаатар — Сүхбаатар'),
 'https://itzone.mn'),

('Дижитал Концепт ХХК', 'digital', @pw, 'career@digital.mn', '99887766',
 (SELECT industry_id FROM industries WHERE name = 'Мэдээллийн технологи'),
 (SELECT location_id FROM locations  WHERE name = 'Улаанбаатар — Хан-Уул'),
 'https://digitalconcept.mn'),

('Голомт Банк', 'golomt', @pw, 'hr@golomt.mn', '77111199',
 (SELECT industry_id FROM industries WHERE name = 'Банк, санхүү'),
 (SELECT location_id FROM locations  WHERE name = 'Улаанбаатар — Чингэлтэй'),
 'https://golomtbank.com'),

('Хаан Банк', 'khanbank', @pw, 'hr@khanbank.com', '70551111',
 (SELECT industry_id FROM industries WHERE name = 'Банк, санхүү'),
 (SELECT location_id FROM locations  WHERE name = 'Улаанбаатар — Сүхбаатар'),
 'https://khanbank.com'),

('Юнител Групп', 'unitel', @pw, 'career@unitel.mn', '75551111',
 (SELECT industry_id FROM industries WHERE name = 'Харилцаа холбоо'),
 (SELECT location_id FROM locations  WHERE name = 'Улаанбаатар — Хан-Уул'),
 'https://unitel.mn'),

('Эрдэнэт Үйлдвэр', 'erdenet', @pw, 'hr@erdenetmc.mn', '70353535',
 (SELECT industry_id FROM industries WHERE name = 'Уул уурхай'),
 (SELECT location_id FROM locations  WHERE name = 'Орон нутаг — Орхон'),
 NULL),

('МСМ Групп', 'msm', @pw, 'hr@msm.mn', '88112244',
 (SELECT industry_id FROM industries WHERE name = 'Тээвэр, логистик'),
 (SELECT location_id FROM locations  WHERE name = 'Улаанбаатар — Баянзүрх'),
 NULL),

('Ирээдүй Цогцолбор Сургууль', 'ireedui', @pw, 'info@ireedui.edu.mn', '70123456',
 (SELECT industry_id FROM industries WHERE name = 'Боловсрол'),
 (SELECT location_id FROM locations  WHERE name = 'Улаанбаатар — Баянгол'),
 NULL);


-- =====================================================
--  2. ДАДЛАГЫН ЧИГЛЭЛ (14)
-- =====================================================
INSERT INTO internship_positions (organization_id, title, capacity, is_open)
SELECT o.organization_id, t.title, t.capacity, t.is_open
FROM (
  SELECT 'itzone'   AS u, 'Веб хөгжүүлэгч (Frontend)'      AS title, 4 AS capacity, TRUE AS is_open
  UNION ALL SELECT 'itzone',   'Backend хөгжүүлэгч',           3, TRUE
  UNION ALL SELECT 'itzone',   'QA тестер',                    2, TRUE
  UNION ALL SELECT 'digital',  'UI/UX дизайнер',               2, TRUE
  UNION ALL SELECT 'digital',  'Мобайл хөгжүүлэгч',            3, TRUE
  UNION ALL SELECT 'golomt',   'Мэдээллийн системийн дадлага', 5, TRUE
  UNION ALL SELECT 'golomt',   'Санхүүгийн шинжээч',           3, TRUE
  UNION ALL SELECT 'khanbank', 'Эрсдэлийн удирдлага',          2, TRUE
  UNION ALL SELECT 'khanbank', 'Кибер аюулгүй байдал',         2, FALSE
  UNION ALL SELECT 'unitel',   'Сүлжээний инженер',            4, TRUE
  UNION ALL SELECT 'unitel',   'Дата аналист',                 2, TRUE
  UNION ALL SELECT 'erdenet',  'Автоматжуулалтын инженер',     6, TRUE
  UNION ALL SELECT 'msm',      'Логистикийн зохицуулагч',      3, TRUE
  UNION ALL SELECT 'ireedui',  'Багшийн дадлага',              8, TRUE
) t
JOIN organizations o ON o.username = t.u;


-- =====================================================
--  3. ОЮУТАН (10)
-- =====================================================
INSERT INTO students
  (last_name, first_name, username, password, email, phone, school, major, course)
VALUES
('Батбаяр', 'Тэмүүлэн', 'temuulen', @pw, 'temuulen@example.com', '99112233', 'МУИС',  'Програм хангамж',       4),
('Ганбат',  'Сараа',    'saraa',    @pw, 'saraa@example.com',    '88445566', 'ШУТИС', 'Мэдээллийн технологи',  3),
('Дорж',    'Билгүүн',  'bilguun',  @pw, 'bilguun@example.com',  '95001122', 'ШУТИС', 'Компьютерын ухаан',     4),
('Энхбат',  'Ануужин',  'anuujin',  @pw, 'anuujin@example.com',  '80667788', 'СЭЗИС', 'Санхүү, нягтлан бодох', 3),
('Мөнхбат', 'Золбоо',   'zolboo',   @pw, 'zolboo@example.com',   '94332211', 'МУИС',  'Дата шинжлэх ухаан',    4),
('Ганболд', 'Оюунаа',   'oyunaa',   @pw, 'oyunaa@example.com',   '99553311', 'МУИС',  'График дизайн',         2),
('Сүхбат',  'Тэмүүжин', 'temuujin', @pw, 'temuujin@example.com', '85224466', 'ШУТИС', 'Цахилгаан инженер',     4),
('Наранбат','Хулан',    'khulan',   @pw, 'khulan@example.com',   '96778899', 'МУБИС', 'Багш, математик',       3),
('Батсайхан','Одбаяр',  'odbayar',  @pw, 'odbayar@example.com',  '88990011', 'СЭЗИС', 'Логистик, тээвэр',      4),
('Цэрэнбат','Мишээл',   'misheel',  @pw, 'misheel@example.com',  '94667788', 'ШУТИС', 'Кибер аюулгүй байдал',  4);


-- =====================================================
--  4. ХҮСЭЛТ (22)
--  Дөрвөн төлөв бүгд төлөөлөлтэй.
--  Оюутны нэр болон чиглэлийн нэрээр холбоно.
-- =====================================================
INSERT INTO internship_requests (student_id, position_id, status)
SELECT s.student_id, p.position_id, t.status
FROM (
  -- оюутан            байгууллага  чиглэл                          төлөв
  SELECT 'temuulen' AS u, 'itzone'   AS org, 'Веб хөгжүүлэгч (Frontend)'      AS pos, 'Тэнцсэн'      AS status
  UNION ALL SELECT 'temuulen', 'golomt',   'Мэдээллийн системийн дадлага', 'Тэнцээгүй'
  UNION ALL SELECT 'temuulen', 'digital',  'Мобайл хөгжүүлэгч',            'Илгээсэн'

  UNION ALL SELECT 'saraa',    'itzone',   'Веб хөгжүүлэгч (Frontend)',    'Хүлээн авсан'
  UNION ALL SELECT 'saraa',    'unitel',   'Сүлжээний инженер',            'Илгээсэн'

  UNION ALL SELECT 'bilguun',  'itzone',   'Backend хөгжүүлэгч',           'Илгээсэн'
  UNION ALL SELECT 'bilguun',  'itzone',   'QA тестер',                    'Хүлээн авсан'
  UNION ALL SELECT 'bilguun',  'digital',  'Мобайл хөгжүүлэгч',            'Тэнцсэн'

  UNION ALL SELECT 'anuujin',  'golomt',   'Санхүүгийн шинжээч',           'Тэнцсэн'
  UNION ALL SELECT 'anuujin',  'khanbank', 'Эрсдэлийн удирдлага',          'Тэнцээгүй'

  UNION ALL SELECT 'zolboo',   'unitel',   'Дата аналист',                 'Илгээсэн'
  UNION ALL SELECT 'zolboo',   'golomt',   'Мэдээллийн системийн дадлага', 'Хүлээн авсан'

  UNION ALL SELECT 'oyunaa',   'digital',  'UI/UX дизайнер',               'Тэнцсэн'
  UNION ALL SELECT 'oyunaa',   'itzone',   'QA тестер',                    'Илгээсэн'

  UNION ALL SELECT 'temuujin', 'erdenet',  'Автоматжуулалтын инженер',     'Тэнцсэн'
  UNION ALL SELECT 'temuujin', 'unitel',   'Сүлжээний инженер',            'Хүлээн авсан'

  UNION ALL SELECT 'khulan',   'ireedui',  'Багшийн дадлага',              'Тэнцсэн'

  UNION ALL SELECT 'odbayar',  'msm',      'Логистикийн зохицуулагч',      'Хүлээн авсан'
  UNION ALL SELECT 'odbayar',  'golomt',   'Санхүүгийн шинжээч',           'Илгээсэн'

  UNION ALL SELECT 'misheel',  'khanbank', 'Эрсдэлийн удирдлага',          'Илгээсэн'
  UNION ALL SELECT 'misheel',  'unitel',   'Дата аналист',                 'Тэнцээгүй'
  UNION ALL SELECT 'misheel',  'itzone',   'Backend хөгжүүлэгч',           'Хүлээн авсан'
) t
JOIN students s      ON s.username = t.u
JOIN organizations o ON o.username = t.org
JOIN internship_positions p
     ON p.organization_id = o.organization_id AND p.title = t.pos;


-- =====================================================
--  5. ОГНООГ БОДИТ БОЛГОХ
--  Бүгд ижил секундэд үүсвэл эрэмбэлэлт утгагүй болно.
--  Сүүлийн 40 хоногт тархаана.
-- =====================================================
SET SQL_SAFE_UPDATES = 0;

UPDATE internship_requests
SET submitted_at = DATE_SUB(NOW(), INTERVAL (request_id * 37 % 40) DAY),
    updated_at   = DATE_SUB(NOW(), INTERVAL (request_id * 13 % 15) DAY);

-- Шинэчилсэн огноо илгээсэн огнооноос өмнө байж болохгүй
UPDATE internship_requests
SET updated_at = submitted_at
WHERE updated_at < submitted_at;

SET SQL_SAFE_UPDATES = 1;


-- =====================================================
--  6. ШАЛГАЛТ
-- =====================================================

SELECT 'Мөрийн тоо' AS шалгалт;
SELECT 'organizations'        AS хүснэгт, COUNT(*) AS мөр FROM organizations
UNION ALL SELECT 'internship_positions', COUNT(*) FROM internship_positions
UNION ALL SELECT 'students',             COUNT(*) FROM students
UNION ALL SELECT 'internship_requests',  COUNT(*) FROM internship_requests;
-- Хүлээгдэж буй: 8 / 14 / 10 / 22


SELECT 'Төлөв бүрийн тоо' AS шалгалт;
SELECT status AS төлөв, COUNT(*) AS тоо
FROM internship_requests
GROUP BY status
ORDER BY FIELD(status, 'Илгээсэн', 'Хүлээн авсан', 'Тэнцсэн', 'Тэнцээгүй');


SELECT 'Чиглэлийн байдал' AS шалгалт;
SELECT o.name AS байгууллага, v.title AS чиглэл,
       v.capacity AS багтаамж, v.accepted_count AS тэнцсэн,
       v.remaining_slots AS сул_орон, v.pending_count AS шинэ_хүсэлт
FROM v_position_stats v
JOIN organizations o ON o.organization_id = v.organization_id
ORDER BY o.name, v.title;


-- =====================================================
--  ТУРШИЛТЫН БҮРТГЭЛ
--  Бүх нууц үг: 123456
--
--  ОЮУТАН
--    temuulen  — МУИС, Програм хангамж, 4-р курс (тэнцсэн бүртгэлтэй)
--    saraa     — ШУТИС, Мэдээллийн технологи, 3-р курс
--    bilguun   — ШУТИС, Компьютерын ухаан, 4-р курс (3 хүсэлттэй)
--    anuujin   — СЭЗИС, Санхүү, 3-р курс
--    zolboo    — МУИС, Дата шинжлэх ухаан, 4-р курс
--    oyunaa    — МУИС, График дизайн, 2-р курс
--    temuujin  — ШУТИС, Цахилгаан инженер, 4-р курс
--    khulan    — МУБИС, Багш математик, 3-р курс
--    odbayar   — СЭЗИС, Логистик, 4-р курс
--    misheel   — ШУТИС, Кибер аюулгүй байдал, 4-р курс (4 хүсэлттэй)
--
--  БАЙГУУЛЛАГА
--    itzone    — Ай Ти Зон, 3 чиглэл, олон хүсэлттэй
--    digital   — Дижитал Концепт, 2 чиглэл
--    golomt    — Голомт Банк, 2 чиглэл
--    khanbank  — Хаан Банк, 2 чиглэл (нэг нь хаагдсан)
--    unitel    — Юнител, 2 чиглэл
--    erdenet   — Эрдэнэт Үйлдвэр, орон нутаг
--    msm       — МСМ Групп, тээвэр логистик
--    ireedui   — Ирээдүй Сургууль, боловсрол
-- =====================================================