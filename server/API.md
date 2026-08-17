# API маршрутууд

Сервер: `http://localhost:3000`

Токен шаардлагатай хаягт header нэмнэ:
`Authorization: Bearer <token>`

---

## Нэвтрэх, бүртгүүлэх

| Метод | Хаяг | Токен | Тайлбар |
|---|---|---|---|
| POST | `/api/auth/register/student` | ✕ | Оюутан бүртгүүлэх |
| POST | `/api/auth/register/org` | ✕ | Байгууллага бүртгүүлэх |
| POST | `/api/auth/login` | ✕ | Нэвтрэх (`username`, `password`, `role`) |
| GET | `/api/auth/me` | ✓ | Одоогийн хэрэглэгч |
| POST | `/api/auth/change-password` | ✓ | Нууц үг солих |
| POST | `/api/auth/forgot` | ✕ | Сэргээх холбоос үүсгэх |
| GET | `/api/auth/reset/:token` | ✕ | Токен хүчинтэй эсэхийг шалгах |
| POST | `/api/auth/reset` | ✕ | Шинэ нууц үг тавих |

## Лавлах

| Метод | Хаяг | Токен | Тайлбар |
|---|---|---|---|
| GET | `/api/lookups` | ✕ | Салбар, байршлын бүтэн жагсаалт |

## Оюутан

| Метод | Хаяг | Токен | Тайлбар |
|---|---|---|---|
| GET | `/api/students/me` | ✓ оюутан | Профайл |
| PUT | `/api/students/me` | ✓ оюутан | Профайл засах |

## Байгууллага

| Метод | Хаяг | Токен | Тайлбар |
|---|---|---|---|
| GET | `/api/organizations` | ✕ | Жагсаалт (`?q= &industry= &location=`) |
| GET | `/api/organizations/filters` | ✕ | Ашиглагдаж буй шүүлтүүрүүд |
| GET | `/api/organizations/:id` | нэмэлт | Дэлгэрэнгүй + чиглэлүүд |
| GET | `/api/organizations/me` | ✓ байгууллага | Өөрийн профайл |
| PUT | `/api/organizations/me` | ✓ байгууллага | Профайл засах |
| POST | `/api/organizations/me/logo` | ✓ байгууллага | Лого байршуулах |
| DELETE | `/api/organizations/me/logo` | ✓ байгууллага | Лого устгах |

`industry`, `location` нь **id** утга. `/api/organizations/filters`-ээс авна.

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
| DELETE | `/api/requests/:id` | ✓ оюутан | Буцаах (зөвхөн `Илгээсэн` төлөвт) |
| GET | `/api/requests/incoming` | ✓ байгууллага | Ирсэн хүсэлт (`?status=`) |
| PATCH | `/api/requests/:id/status` | ✓ байгууллага | Төлөв өөрчлөх |

---

## Алдааны хариу

```json
{
  "message": "Талбаруудыг засна уу.",
  "errors": { "email": "И-мэйл хаяг буруу байна." }
}
```

`errors` нь талбарын id-тай тохирно — frontend шууд тухайн талбар дээр харуулна.

| Код | Утга |
|---|---|
| 400 | Талбар буруу |
| 401 | Нэвтрээгүй, токен хүчингүй |
| 403 | Эрх хүрэхгүй |
| 404 | Олдсонгүй |
| 409 | Давхардал, орон тоо дүүрсэн |