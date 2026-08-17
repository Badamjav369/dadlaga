# API маршрутын жагсаалт

Сервер: `http://localhost:3000`
Токен шаардлагатай хаягт header нэмнэ: `Authorization: Bearer <token>`

---

## Нэвтрэх / Бүртгүүлэх

| Метод | Хаяг | Токен | Тайлбар |
|---|---|---|---|
| POST | `/api/auth/register/student` | ✕ | Оюутан бүртгүүлэх |
| POST | `/api/auth/register/org` | ✕ | Байгууллага бүртгүүлэх |
| POST | `/api/auth/login` | ✕ | Нэвтрэх (`role`: student / org) |
| GET | `/api/auth/me` | ✓ | Одоогийн хэрэглэгч |

## Оюутан

| Метод | Хаяг | Токен | Тайлбар |
|---|---|---|---|
| GET | `/api/students/me` | ✓ оюутан | Профайл + дадлагын төлөв |
| PUT | `/api/students/me` | ✓ оюутан | Профайл засах |

## Байгууллага

| Метод | Хаяг | Токен | Тайлбар |
|---|---|---|---|
| GET | `/api/organizations` | ✕ | Жагсаалт (`?q= &industry= &location=`) |
| GET | `/api/organizations/filters` | ✕ | Шүүлтүүрийн сонголтууд |
| GET | `/api/organizations/:id` | нэмэлт | Дэлгэрэнгүй + чиглэлүүд |
| GET | `/api/organizations/me` | ✓ байгууллага | Өөрийн профайл |
| PUT | `/api/organizations/me` | ✓ байгууллага | Профайл засах |

## Дадлагын чиглэл

| Метод | Хаяг | Токен | Тайлбар |
|---|---|---|---|
| POST | `/api/positions` | ✓ байгууллага | Нэмэх |
| PUT | `/api/positions/:id` | ✓ байгууллага | Засах |
| DELETE | `/api/positions/:id` | ✓ байгууллага | Устгах |

## Хүсэлт

| Метод | Хаяг | Токен | Тайлбар |
|---|---|---|---|
| POST | `/api/requests` | ✓ оюутан | Хүсэлт илгээх |
| GET | `/api/requests/my` | ✓ оюутан | Илгээсэн хүсэлтүүд |
| DELETE | `/api/requests/:id` | ✓ оюутан | Хүсэлт буцаах |
| GET | `/api/requests/incoming` | ✓ байгууллага | Ирсэн хүсэлтүүд (`?status=`) |
| PATCH | `/api/requests/:id/status` | ✓ байгууллага | Төлөв өөрчлөх |

---

## PowerShell дээр шалгах

```powershell
# 1. Сервер асаалттай эсэх
curl http://localhost:3000/api/health

# 2. Нэвтрэх — токен авах
$r = Invoke-RestMethod -Uri http://localhost:3000/api/auth/login `
     -Method Post -ContentType "application/json" `
     -Body '{"username":"temuulen","password":"123456","role":"student"}'
$token = $r.token
$r.user

# 3. Байгууллагуудын жагсаалт
Invoke-RestMethod http://localhost:3000/api/organizations | Format-Table

# 4. Өөрийн хүсэлтүүд
Invoke-RestMethod http://localhost:3000/api/requests/my `
  -Headers @{ Authorization = "Bearer $token" } | Format-Table

# 5. Шинэ хүсэлт илгээх (position_id = 2)
Invoke-RestMethod -Uri http://localhost:3000/api/requests -Method Post `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{"position_id":2}'
```

Байгууллагын талыг шалгах:

```powershell
$o = Invoke-RestMethod -Uri http://localhost:3000/api/auth/login `
     -Method Post -ContentType "application/json" `
     -Body '{"username":"itzone","password":"123456","role":"org"}'

Invoke-RestMethod http://localhost:3000/api/requests/incoming `
  -Headers @{ Authorization = "Bearer $($o.token)" } | Format-Table

# Төлөв өөрчлөх (request_id = 3)
Invoke-RestMethod -Uri http://localhost:3000/api/requests/3/status -Method Patch `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $($o.token)" } `
  -Body '{"status":"Хүлээн авсан"}'
```

---

## Нууц үг

| Метод | Хаяг | Токен | Тайлбар |
|---|---|---|---|
| POST | `/api/auth/forgot` | ✕ | Сэргээх холбоос үүсгэх (`username`, `role`) |
| GET | `/api/auth/reset/:token` | ✕ | Токен хүчинтэй эсэхийг шалгах |
| POST | `/api/auth/reset` | ✕ | Шинэ нууц үг тавих (`token`, `password`) |
| POST | `/api/auth/change-password` | ✓ | Нэвтэрсэн үедээ солих |

## Лого

| Метод | Хаяг | Токен | Тайлбар |
|---|---|---|---|
| POST | `/api/organizations/me/logo` | ✓ байгууллага | Байршуулах (multipart, талбар: `logo`) |
| DELETE | `/api/organizations/me/logo` | ✓ байгууллага | Устгах |

Зөвшөөрөгдөх төрөл: PNG, JPG, WEBP. Дээд хэмжээ 2 МБ.
Файл `public/uploads/logos/` дотор хадгалагдаж, `/uploads/logos/...` хаягаар үйлчилнэ.