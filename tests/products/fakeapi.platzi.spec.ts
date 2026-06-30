import { test, expect, APIResponse } from "@playwright/test";

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
test.describe("Products API - GET Methods", { tag: ["@products", "@get"] }, () => {

  test("Get all products", async ({ request }) => {
    //! ARRANGE
    // no preconditions needed

    //! ACT
    let response: APIResponse;
    await test.step("Execute GET request for all products", async () => {
      response = await request.get("/api/v1/products", {
        failOnStatusCode: true,
      });
    });

    //! ASSERT
    await test.step("Verify response status", async () => {
      expect(response.status()).toBe(200);
    });
  });

  test("Check pagination 10", async ({ request }) => {
    //! ARRANGE
    // no preconditions needed

    //! ACT
    let response: APIResponse;
    let json: any;
    await test.step("Execute GET request with pagination limits", async () => {
      response = await request.get("/api/v1/products", {
        params: { offset: 0, limit: 10 },
        failOnStatusCode: true,
      });
      json = await response.json();
    });

    //! ASSERT
    await test.step("Verify pagination results", async () => {
      expect(response.status()).toBe(200);
      expect(json).toHaveLength(10);
    });
  });
});

// ==========================================================
// CREATE PRODUCT
// ==========================================================
test.describe("Products API - Create Product", { tag: ["@products", "@create"] }, () => {
  let productId: number | undefined; // ← одна на весь describe
  let uniqueTitle: string;
  let uniqueDescription: string;

  test.beforeEach(async () => {
    //! ARRANGE
    await test.step("Generate unique title and description", async () => {
      uniqueTitle = generateRandomString();
      uniqueDescription = generateRandomString();
    });
  });

  test.afterEach(async ({ request }) => {
    await test.step("Clean up created product", async () => {
      if (productId !== undefined) {
        await request.delete(`/api/v1/products/${productId}`, {
          failOnStatusCode: true,
        });
        productId = undefined; // ← скидаємо
      }
    });
  });

  test("Create product", async ({ request }) => {
    //! ARRANGE
    // uniqueTitle / uniqueDescription generated in beforeEach

    //! ACT
    let response: APIResponse;
    let json: any;
    await test.step("Execute POST request to create product", async () => {
      response = await request.post("/api/v1/products", {
        failOnStatusCode: true,
        data: {
          title: uniqueTitle,
          slug: "handmade-fresh-table",
          price: 123,
          description: uniqueDescription,
          categoryId: 1,
          images: ["https://placehold.co/600x400"],
        },
      });
      json = await response.json();
      productId = json.id; // save id for cleanup
    });

    //! ASSERT
    await test.step("Verify created product details", async () => {
      expect(response.status()).toBe(201);
      expect(response.statusText()).toMatch("Created");
      expect(response.headers()["content-type"]).toContain("application/json");
      expect(json).toHaveProperty("id");
      expect(json).toHaveProperty("price", 123);
      expect(json.title).toBe(uniqueTitle);
      expect(json.description).toEqual(uniqueDescription);
    });

    await test.step("Verify product exists via GET", async () => {
      const responseGetById = await request.get(`/api/v1/products/${productId}`, {
        failOnStatusCode: true,
      });
      const jsonGetById = await responseGetById.json();

      expect(responseGetById.status()).toBe(200);
      expect(jsonGetById).toHaveProperty("id", productId);
    });
  });
});

// ==========================================================
// UPDATE AND RETRIEVE
// ==========================================================
test.describe("Products API - Update and Retrieve", { tag: ["@products", "@single"] }, () => {
  let productData: { id: number; slug: string };
  let uniqueTitle: string;

  test.beforeEach(async ({ request }) => {
    //! ARRANGE
    let uniqueDescription: string;

    await test.step("Generate unique title and description", async () => {
      uniqueTitle = generateRandomString();
      uniqueDescription = generateRandomString();
    });

    await test.step(`Precondition: create product`, async () => {
      const response = await request.post("/api/v1/products/", {
        failOnStatusCode: true,
        data: {
          title: uniqueTitle,
          price: 10,
          description: uniqueDescription,
          categoryId: 1,
          images: ["https://placehold.co/600x400"],
        },
      });
      const json = await response.json();
      productData = { id: json.id, slug: json.slug };
    });
  });

  test.afterEach(async ({ request }) => {
    await test.step("Clean up precondition product", async () => {
      await request.delete(`/api/v1/products/${productData.id}`, {
        failOnStatusCode: true,
      });
    });
  });

  test("Update product", async ({ request }) => {
    //! ARRANGE
    const updatedTitle = generateRandomString();
    const updatedDescription = generateRandomString();

    //! ACT
    let response: APIResponse;
    let json: any;
    await test.step("Execute PUT request to update product", async () => {
      response = await request.put(`/api/v1/products/${productData.id}`, {
        failOnStatusCode: true,
        data: {
          title: updatedTitle,
          slug: "handmade-fresh-table",
          price: 123,
          description: updatedDescription,
          categoryId: 1,
          images: ["https://placehold.co/600x400"],
        },
      });
      json = await response.json();
    });

    //! ASSERT
    await test.step("Verify product is updated", async () => {
      expect(response.status()).toBe(200);
      expect(json.title).toBe(updatedTitle);
      expect(json.description).toEqual(updatedDescription);
    });
  });

  test("Get a single product by id", async ({ request }) => {
    //! ARRANGE
    // productData created in beforeEach

    //! ACT
    let response: APIResponse;
    let json: any;
    await test.step("Execute GET request for single product by id", async () => {
      response = await request.get(`/api/v1/products/${productData.id}`, {
        failOnStatusCode: true,
      });
      json = await response.json();
    });

    //! ASSERT
    await test.step("Verify fetched product data", async () => {
      expect(response.status()).toBe(200);
      expect(json).toHaveProperty("id", productData.id);
      expect(json).toHaveProperty("title", uniqueTitle);
    });
  });

  test("Get a single product by slug", async ({ request }) => {
    //! ARRANGE
    // productData created in beforeEach

    //! ACT
    let response: APIResponse;
    let json: any;
    await test.step("Execute GET request for single product by slug", async () => {
      response = await request.get(`/api/v1/products/slug/${productData.slug}`, {
        failOnStatusCode: true,
      });
      json = await response.json();
    });

    //! ASSERT
    await test.step("Verify fetched product data by slug", async () => {
      expect(response.status()).toBe(200);
      expect(json).toHaveProperty("id", productData.id);
      expect(json).toHaveProperty("title", uniqueTitle);
      expect(json).toHaveProperty("slug", productData.slug);
    });
  });
});

// ==========================================================
// DELETE OPERATION
// ==========================================================
test.describe("Products API - Delete Operation", { tag: ["@products", "@delete"] }, () => {
  let productData: { id: number; slug: string };

  test.beforeEach(async ({ request }) => {
    //! ARRANGE
    let uniqueTitle: string;
    let uniqueDescription: string;

    await test.step("Generate unique title and description", async () => {
      uniqueTitle = generateRandomString();
      uniqueDescription = generateRandomString();
    });

    await test.step("Precondition: create product for deletion", async () => {
      const response = await request.post("/api/v1/products/", {
        failOnStatusCode: true,
        data: {
          title: uniqueTitle,
          price: 10,
          description: uniqueDescription,
          categoryId: 1,
          images: ["https://placehold.co/600x400"],
        },
      });
      const json = await response.json();
      productData = { id: json.id, slug: json.slug };
    });
  });

  // No afterEach — the test itself deletes the product

  test("Delete product", async ({ request }) => {
    //! ARRANGE
    // productData created in beforeEach

    //! ACT
    let responseDel: APIResponse;
    await test.step("Execute DELETE request", async () => {
      responseDel = await request.delete(`/api/v1/products/${productData.id}`, {
        failOnStatusCode: true,
      });
    });

    //! ASSERT
    await test.step("Verify DELETE response", async () => {
      expect(responseDel.ok()).toBeTruthy();
      expect(responseDel.status()).toBe(200);
    });

    await test.step("Verify product is actually deleted via GET", async () => {
      const responseGetById = await request.get(`/api/v1/products/${productData.id}`);
      const jsonGet = await responseGetById.json();

      expect(responseGetById.status()).toBe(400); // 404
      expect(jsonGet.name).toBe("EntityNotFoundError");
    });
  });
});

// ==========================================================
// RELATED PRODUCTS
// ==========================================================
test.describe("Products API - Related Products", { tag: ["@products", "@related"] }, () => {
  let productIds: number[] = [];
  //    : number[] —> TypeScript тип: масив, який містить тільки числа (number)
  //    = [] —> початкове значення: порожній масив


  test.afterEach(async ({ request }) => {
    await test.step("Clean up created products", async () => {
      for (const id of productIds) {
        await request.delete(`/api/v1/products/${id}`, {
          failOnStatusCode: true,
        });
      }
      productIds = []; // ← скидаємо
    });
  });

  test("Get products related by id", async ({ request }) => {
    //! ARRANGE
    await test.step("Precondition: create 3 products in category #3", async () => {
      for (let i = 0; i < 3; i++) {
        const response = await request.post("/api/v1/products", {
          failOnStatusCode: true,
          data: {
            title: generateRandomString(),
            slug: "handmade-fresh-table",
            price: 123,
            description: generateRandomString(),
            categoryId: 3,
            images: ["https://placehold.co/600x400"],
          },
        });
        const json = await response.json();
        productIds.push(json.id);
      }
    });

    const productId = productIds[0];

    //! ACT
    let response: APIResponse;
    let related: any;
    await test.step("Execute GET request for related products", async () => {
      response = await request.get(`/api/v1/products/${productId}/related`, {
        failOnStatusCode: true,
      });
      related = await response.json();
    });

    //! ASSERT
    await test.step("Verify related products data", async () => {
      expect(response.status()).toBe(200);
      expect(Array.isArray(related)).toBeTruthy();

      for (const product of related) {
        expect(product.category.id).toBe(3); // check categoryId = 3
      }

      const relatedIds = related.map((p: any) => p.id);
      expect(relatedIds).not.toContain(productId); // product should not relate to itself
    });
  });
});