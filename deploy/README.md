# HTTPS болон нууц түлхүүрийн тохиргоо

Ubuntu 22.04 / 24.04 сервер дээр гэж үзсэн. Домэйн нь серверийн IP рүү заасан байх ёстой.

---

## 1. Түлхүүр үүсгэх

```bash
cd server
npm run gen-secret
```

Гарсан `JWT_SECRET` утгыг `.env` файлдаа хуулна. Гараар бодож олсон мөр ашиглаж болохгүй — таамаглах боломжтой.

Түлхүүр солих бүрт нэвтэрсэн бүх хэрэглэгч гарна. Энэ бол хүлээгдэж буй үр дүн.

---

## 2. MySQL хэрэглэгч солих

`db/schema.sql`-ийн хамгийн доод хэсэгт хязгаарлагдмал хэрэглэгч үүсгэх код
комментоор байна. Нууц үгийг нь солиод комментыг авч, Workbench дээр ажиллуулна.

Эрхийг шалгах:

```sql
SHOW GRANTS FOR 'internship_app'@'localhost';
```

`SELECT, INSERT, UPDATE, DELETE` л харагдах ёстой. `ALL PRIVILEGES` эсвэл `DROP` харагдвал буруу.

Дараа нь `.env` дотор:

```
DB_USER=internship_app
DB_PASSWORD="<тавьсан нууц үг>"
```

---

## 3. Гэрчилгээ авах

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
sudo mkdir -p /var/www/certbot
```

`deploy/nginx.conf`-ийг байрлуулна (доторх `dadlaga.mn`-ийг өөрийн домэйнээр солино):

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/dadlaga
sudo ln -s /etc/nginx/sites-available/dadlaga /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

Эхлээд TLS мөрүүдийг түр коммент болгож, HTTP хэсгийг л ажиллуулна. Дараа нь:

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d dadlaga.mn -d www.dadlaga.mn
```

Certbot гэрчилгээ авч, тохиргоог автоматаар бөглөнө. Сунгалт нь `systemd` таймераар өөрөө ажиллана — шалгах:

```bash
sudo certbot renew --dry-run
```

---

## 4. Бодит горим руу шилжүүлэх

`.env` файлаа:

```
NODE_ENV=production
BASE_URL=https://dadlaga.mn
TRUST_PROXY=true
FORCE_HTTPS=true
SHOW_RESET_LINK=false
```

Сервер асаах:

```bash
cd server
node server.js
```

Тохиргоо дутуу бол сервер **асахгүй**, шалтгааныг жагсаана. Энэ нь зориудаар — буруу тохиргоотой ажиллахаас зогссон нь дээр.

---

## 5. Галт хана

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Порт 3000-ыг **гаднаас нээхгүй**. Node зөвхөн `127.0.0.1:3000` дээр сонсож, Nginx л түүн рүү дамжуулна.

MySQL порт 3306 ч мөн гаднаас хаалттай байх ёстой. Шалгах:

```bash
sudo ss -tlnp | grep -E '3000|3306'
```

`127.0.0.1:3000` болон `127.0.0.1:3306` гэж харагдах ёстой. `0.0.0.0` бол задгай байна.

---

## 6. Шалгах жагсаалт

```bash
# HTTP → HTTPS шилжиж байна уу (308 буцаах ёстой)
curl -I http://dadlaga.mn

# Хамгаалалтын толгойнууд байна уу
curl -I https://dadlaga.mn | grep -Ei 'strict-transport|content-security|x-frame|x-content'

# API ажиллаж байна уу
curl https://dadlaga.mn/api/health
```

Гадаад шалгалт:

- TLS зэрэглэл — https://www.ssllabs.com/ssltest/ (A буюу түүнээс дээш байх ёстой)
- Толгойнууд — https://securityheaders.com

---

## Юу засагдсан бэ

**Анхдагч түлхүүр устсан.** Өмнө нь `process.env.JWT_SECRET || 'dev_secret_solino'` гэж бичигдсэн байсан. `.env` ачаалагдаагүй тохиолдолд систем олон нийтэд мэдэгдэх түлхүүр рүү чимээгүй шилжинэ. Одоо түлхүүр байхгүй бол сервер асахгүй.

**Хоёр дахь нуугдмал fallback.** `organizationRoutes.js` дотор ижил утга дахин бичигдсэн байсан. Одоо `optionalAuth` middleware ашиглаж байна.

**root хэрэглэгч.** SQL тарилга амжилттай болбол root эрхтэй халдагч бүх санг устгах боломжтой. Шинэ хэрэглэгч зөвхөн мөр уншиж, бичнэ.

**Ил дамжих нууц үг.** HTTP дээр нэвтрэх бүрт нууц үг задгай явна. Одоо HTTPS албадана, HSTS-тэй.

**CSP.** Скриптийг зөвхөн өөрийн домэйнээс ачаална. Ингэхийн тулд `index.html` доторх inline скриптийг `js/boot.js` рүү зөөсөн.

**Алдааны мессеж.** Бодит орчинд дотоод дэлгэрэнгүй хэрэглэгчид харагдахгүй, зөвхөн лог руу бичигдэнэ.

**Файл байршуулалт.** `/uploads/` дотроос ирсэн файлыг хөтөч гүйцэтгэхгүй.

---

## Дараагийн алхам

Энэ нь **асуудал 1**. Үлдсэн дөрөв:

2. Нэвтрэх оролдлого хязгаарлах (`express-rate-limit`)
3. И-мэйл жинхэнээсээ илгээх (`nodemailer`)
4. Өдөр бүрийн нөөцлөлт (`mysqldump` + cron)
5. Тогтвортой ажиллагаа (`pm2` + лог файл)

Эдгээр нь хараахан хийгдээгүй. Систем одоогоор локал орчинд ажиллаж байна.