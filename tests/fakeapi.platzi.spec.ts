import { test, expect } from "@playwright/test";

test("get products", async ({ request }) => {
  const response = await request.get('https://api.escuelajs.co/api/v1/products', { failOnStatusCode: true });
  expect(response.status()).toBe(200);
});
