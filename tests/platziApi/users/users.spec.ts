/*

GET	/api/v1/users	список користувачів
GET	/api/v1/users/{id}	один користувач
POST	/api/v1/users/	створити користувача
PUT	/api/v1/users/{id}	оновити користувача
POST	/api/v1/users/is-available	перевірка доступності email

Об'єкт користувача: id, email, password, name, role (customer/admin), avatar (URL).

Як оформлюємо тести (чекліст практик)
 Патерн AAA (Arrange / Act / Assert)
 Теги у сигнатурі: { tag: ['@users', '@smoke'/'@regression'] }
 Кожен крок — у test.step з людською назвою
 Параметри/тіло — через params / data, не конкатенацією в URL
 У запиті лише шлях /api/v1/... — хост дає baseURL
 failOnStatusCode під сценарій (true для позитивних)
 Схему Users тримаємо в app/json-schemas/users.ts і перевикористовуємо
Що перевіряємо (для кожного ендпоінта)
 Статус-код (200 для GET/PUT, 201 для POST-create)
 JSON-схема через Zod safeParse ({ message: result.error?.message } для деталей)
 Хедери через expect.soft (content-type тощо)
 Тіло: ключові поля через expect.soft (для масивів — for...of по кожному елементу)
 У позитивному тесті зі списком: expect(json.length).toBeGreaterThan(0) перед циклом
Що покрити по кожному ендпоінту
GET список — масив відповідає схемі, не порожній, кожен role ∈ {customer,admin}.
GET /{id} — повертає саме того користувача (id збігається); неіснуючий id → 404.
POST create — 201, у відповіді є створений id, поля збігаються з відправленими; невалідний email / без обов'язкових полів → помилка (поведінку дослідити).
PUT /{id} — оновлюються лише передані поля, решта без змін.
POST is-available — для зайнятого email { isAvailable: false }, для вільного { isAvailable: true }.
*/



import { test, expect, APIResponse } from "@playwright/test";
import { TAG } from "../../tags";
import { UserSchema } from "./users-schema";

function generateRandomString(): string {
  const minLength = 3;
  const maxLength = 20;
  const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// ==========================================================
// GET METHODS
// ==========================================================
test.describe("Users API - GET Methods", { tag: [TAG.users, TAG.get] }, () => {

  test("Get all users", async ({ request }) => {
    //! ARRANGE
    // no preconditions needed

    //! ACT
    let response: APIResponse;
    await test.step("Execute GET request for all users", async () => {
      response = await request.get("/api/v1/users", {
        failOnStatusCode: true,
      });
    });

    const json = await response.json();
    
    //! ASSERT
    await test.step("Verify schema response", async () => {
      const data = UserSchema.safeParse(json);
      expect(data.success, {message: data.error?.message}).toBeTruthy();
    });

    await test.step("Verify response status", async () => {
      expect(response.status()).toBe(200);
    });
  });
});
