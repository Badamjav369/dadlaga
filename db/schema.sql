DROP DATABASE IF EXISTS internship_system;

CREATE DATABASE internship_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE internship_system;

--  1. ЛАВЛАХ ХҮСНЭГТ
CREATE TABLE industries (
    industry_id INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    sort_order  INT          NOT NULL DEFAULT 100
) ENGINE=InnoDB;

CREATE TABLE locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    sort_order  INT          NOT NULL DEFAULT 100
) ENGINE=InnoDB;

--  2. ХЭРЭГЛЭГЧ
CREATE TABLE students (
    student_id  INT AUTO_INCREMENT PRIMARY KEY,
    last_name   VARCHAR(50)  NOT NULL,
    first_name  VARCHAR(50)  NOT NULL,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    phone       VARCHAR(20)  NOT NULL,
    school      VARCHAR(100) NOT NULL,
    major       VARCHAR(100) NOT NULL,
    course      TINYINT      NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_students_course CHECK (course BETWEEN 1 AND 6),
    INDEX idx_students_major  (major),
    INDEX idx_students_school (school)
) ENGINE=InnoDB;

CREATE TABLE organizations (
    organization_id INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    email           VARCHAR(100) NOT NULL UNIQUE,
    phone           VARCHAR(20)  NOT NULL,
    industry_id     INT          NOT NULL,
    location_id     INT          NOT NULL,
    website         VARCHAR(255) NULL,
    logo            VARCHAR(255) NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_org_industry
        FOREIGN KEY (industry_id) REFERENCES industries(industry_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_org_location
        FOREIGN KEY (location_id) REFERENCES locations(location_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

--  3. ДАДЛАГА
CREATE TABLE internship_positions (
    position_id     INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT          NOT NULL,
    title           VARCHAR(150) NOT NULL,
    capacity        INT          NOT NULL,
    is_open         BOOLEAN      NOT NULL DEFAULT TRUE,   -- түр хаах боломж
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_positions_capacity CHECK (capacity >= 1),
    CONSTRAINT fk_positions_org
        FOREIGN KEY (organization_id) REFERENCES organizations(organization_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;


CREATE TABLE internship_requests (
    request_id   INT AUTO_INCREMENT PRIMARY KEY,
    student_id   INT NOT NULL,
    position_id  INT NOT NULL,

    status ENUM('Илгээсэн','Хүлээн авсан','Тэнцсэн','Тэнцээгүй')
                 NOT NULL DEFAULT 'Илгээсэн',
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                 ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_request_student_position UNIQUE (student_id, position_id),
    CONSTRAINT fk_requests_student
        FOREIGN KEY (student_id) REFERENCES students(student_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_requests_position
        FOREIGN KEY (position_id) REFERENCES internship_positions(position_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_requests_status (status)
) ENGINE=InnoDB;

--  4. НУУЦ ҮГ СЭРГЭЭХ ТОКЕН
CREATE TABLE password_resets (
    reset_id   INT AUTO_INCREMENT PRIMARY KEY,
    role       ENUM('student','org') NOT NULL,
    user_id    INT          NOT NULL,
    token_hash CHAR(64)     NOT NULL,
    expires_at DATETIME     NOT NULL,
    used_at    DATETIME     NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reset_token (token_hash),
    INDEX idx_reset_user  (role, user_id)
) ENGINE=InnoDB;

--  5. VIEW — чиглэл бүрийн одоогийн байдал
CREATE OR REPLACE VIEW v_position_stats AS
SELECT
    p.position_id,
    p.organization_id,
    p.title,
    p.capacity,
    p.is_open,
    CAST(COUNT(r.request_id) AS SIGNED)                       AS total_requests,
    CAST(IFNULL(SUM(r.status = 'Илгээсэн'), 0) AS SIGNED)     AS pending_count,
    CAST(IFNULL(SUM(r.status = 'Хүлээн авсан'), 0) AS SIGNED) AS reviewing_count,
    CAST(IFNULL(SUM(r.status = 'Тэнцсэн'), 0) AS SIGNED)      AS accepted_count,
    CAST(GREATEST(p.capacity - IFNULL(SUM(r.status = 'Тэнцсэн'), 0), 0) AS SIGNED)
                                                              AS remaining_slots
FROM internship_positions p
LEFT JOIN internship_requests r ON r.position_id = p.position_id
GROUP BY p.position_id;

--  6. ЛАВЛАХ ӨГӨГДӨЛ
INSERT INTO industries (name, sort_order) VALUES
('Мэдээллийн технологи',         10),
('Харилцаа холбоо',              20),
('Банк, санхүү',                 30),
('Даатгал',                      40),
('Уул уурхай',                   50),
('Барилга, үл хөдлөх',           60),
('Эрчим хүч',                    70),
('Тээвэр, логистик',             80),
('Худалдаа, үйлчилгээ',          90),
('Үйлдвэрлэл',                  100),
('Хөдөө аж ахуй',               110),
('Боловсрол',                   120),
('Эрүүл мэнд',                  130),
('Хууль, эрх зүй',              140),
('Хэвлэл мэдээлэл',             150),
('Маркетинг, зар сурталчилгаа', 160),
('Аялал жуулчлал',              170),
('Төрийн байгууллага',          180),
('Төрийн бус байгууллага',      190),
('Бусад',                       900);

INSERT INTO locations (name, sort_order) VALUES
('Улаанбаатар — Багануур',        10),
('Улаанбаатар — Багахангай',      20),
('Улаанбаатар — Баянгол',         30),
('Улаанбаатар — Баянзүрх',        40),
('Улаанбаатар — Налайх',          50),
('Улаанбаатар — Сонгинохайрхан',  60),
('Улаанбаатар — Сүхбаатар',       70),
('Улаанбаатар — Хан-Уул',         80),
('Улаанбаатар — Чингэлтэй',       90),
('Орон нутаг — Архангай',        200),
('Орон нутаг — Баян-Өлгий',      210),
('Орон нутаг — Баянхонгор',      220),
('Орон нутаг — Булган',          230),
('Орон нутаг — Говь-Алтай',      240),
('Орон нутаг — Говьсүмбэр',      250),
('Орон нутаг — Дархан-Уул',      260),
('Орон нутаг — Дорноговь',       270),
('Орон нутаг — Дорнод',          280),
('Орон нутаг — Дундговь',        290),
('Орон нутаг — Завхан',          300),
('Орон нутаг — Орхон',           310),
('Орон нутаг — Өвөрхангай',      320),
('Орон нутаг — Өмнөговь',        330),
('Орон нутаг — Сүхбаатар',       340),
('Орон нутаг — Сэлэнгэ',         350),
('Орон нутаг — Төв',             360),
('Орон нутаг — Увс',             370),
('Орон нутаг — Ховд',            380),
('Орон нутаг — Хөвсгөл',         390),
('Орон нутаг — Хэнтий',          400);

--  7. ШАЛГАЛТ
SELECT 'Хүснэгтүүд' AS шалгалт;
SHOW TABLES;

SELECT 'Мөрийн тоо' AS шалгалт;
SELECT 'industries'           AS хүснэгт, COUNT(*) AS мөр FROM industries
UNION ALL SELECT 'locations',            COUNT(*) FROM locations
UNION ALL SELECT 'students',             COUNT(*) FROM students
UNION ALL SELECT 'organizations',        COUNT(*) FROM organizations
UNION ALL SELECT 'internship_positions', COUNT(*) FROM internship_positions
UNION ALL SELECT 'internship_requests',  COUNT(*) FROM internship_requests
UNION ALL SELECT 'password_resets',      COUNT(*) FROM password_resets;