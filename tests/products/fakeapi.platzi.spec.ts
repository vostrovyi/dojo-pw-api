import { test, expect } from "@playwright/test";

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

test.describe("Products API - GET Methods", { tag: ["@products", "@get"] }, () => {
  
  test("Get all products", async ({ request }) => {
    //! ACT
    await test.step("Execute GET request for all products", async () => {
      const response = await request.get("/api/v1/products", {
        failOnStatusCode: true,
      });
      //! ASSERT
      expect(response.status()).toBe(200);
    });
  });

  test("Check pagination 10", async ({ request }) => {
    //! ACT
    await test.step("Check pagination contains 10 products", async () => {
      const response = await request.get(`/api/v1/products`, {
        params: { offset: 0, limit: 10 },
      });

      const json = await response.json();

      //! ASSERT
      expect(response.status()).toBe(200);
      expect(json).toHaveLength(10);
    });
  });
});

test.describe("Products API - POST Methods", { tag: ["@products", "@create"] }, () => {
  let productId: number;
  let uniqueTitle: string;
  let uniqueDescription: string;

  test.beforeEach(async () => {
    //! ARRANGE
    uniqueTitle = await test.step("Generate unique title", async () => generateRandomString());
    uniqueDescription = await test.step("Generate unique description", async () => generateRandomString());
  });

  test.afterEach(async ({ request }) => {
    await test.step("Clean Up created product", async () => {
      if (productId) {
        await request.delete(`/api/v1/products/${productId}`, {
          failOnStatusCode: false, // To NOT fail ==>> if the product has already been deleted
        });
      }
    });
  });

  test("Create product", async ({ request }) => {
    //! ACT
    await test.step("Execute POST request to create product", async () => {
      const response = await request.post("/api/v1/products", {
        data: {
          title: uniqueTitle,
          slug: "handmade-fresh-table",
          price: 123,
          description: uniqueDescription,
          categoryId: 1,
          images: ["https://placehold.co/600x400"],
        },
      });
      const json = await response.json();
      productId = json.id; // Save Id for CleanUp

      //! ASSERT
      expect(response.status()).toBe(201);
      expect(response.statusText()).toMatch("Created");
      expect(response.headers()["content-type"]).toContain("application/json");
      expect(json).toHaveProperty("id");
      expect(json).toHaveProperty("price", 123);
      expect(json.title).toBe(uniqueTitle);
      expect(json.description).toEqual(uniqueDescription);
    });

    await test.step("Check product exists via GET", async () => {
      const responseGetById = await request.get(`/api/v1/products/${productId}`, {
        failOnStatusCode: true,
      });
      const jsonGetById = await responseGetById.json();
      
      expect(responseGetById.status()).toBe(200);
      expect(jsonGetById).toHaveProperty("id", productId);
    });
  });
});

test.describe("Products API - Single Product Operations", { tag: ["@products", "@single"] }, () => {
  let productData: { id: number; slug: string };
  let uniqueTitle: string;

  test.beforeEach(async ({ request }) => {
    //! ARRANGE
    uniqueTitle = await test.step("Generate unique title", async () => generateRandomString());
    const uniqueDescription = await test.step("Generate unique description", async () => generateRandomString());

    const responseCreate = await test.step(`Precondition: Create product with title ${uniqueTitle}`, async () => {
      const response = await request.post("/api/v1/products/", {
        data: {
          title: uniqueTitle,
          price: 10,
          description: uniqueDescription,
          categoryId: 1,
          images: ["https://placehold.co/600x400"],
        },
        failOnStatusCode: true,
      });
      return response;
    });

    const jsonCreate = await responseCreate.json();
    productData = { id: jsonCreate.id, slug: jsonCreate.slug };
  });

  test.afterEach(async ({ request }) => {
    await test.step("Clean Up precondition product", async () => {
      await request.delete(`/api/v1/products/${productData.id}`, {
        failOnStatusCode: false,
      });
    });
  });

  test("Update product", async ({ request }) => {
    let updatedTitle = generateRandomString();
    let updatedDescription = generateRandomString();

    await test.step("Execute PUT request to update product", async () => {
      //! ACT
      const responsePut = await request.put(`/api/v1/products/${productData.id}`, {
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
      const jsonPut = await responsePut.json();

      //! ASSERT
      expect(responsePut.status()).toBe(200);
      expect(jsonPut.title).toBe(updatedTitle);
      expect(jsonPut.description).toEqual(updatedDescription);
    });
  });

  test("Get a single product by id", async ({ request }) => {
    await test.step("Execute GET request for single product by id", async () => {
      //! ACT
      const responseGetById = await request.get(`/api/v1/products/${productData.id}`, {
        failOnStatusCode: true,
      });
      const jsonGetById = await responseGetById.json();

      //! ASSERT
      expect(responseGetById.status()).toBe(200);
      expect(jsonGetById).toHaveProperty("id", productData.id);
      expect(jsonGetById).toHaveProperty("title", uniqueTitle);
    });
  });

  test("Get a single product by slug", async ({ request }) => {
    await test.step("Execute GET request for single product by slug", async () => {
      //! ACT
      const responseGetBySlug = await request.get(`/api/v1/products/slug/${productData.slug}`);
      const jsonGetBySlug = await responseGetBySlug.json();

      //! ASSERT
      expect(responseGetBySlug.status()).toBe(200);
      expect(jsonGetBySlug).toHaveProperty("id", productData.id);
      expect(jsonGetBySlug).toHaveProperty("title", uniqueTitle);
      expect(jsonGetBySlug).toHaveProperty("slug", productData.slug);
    });
  });

  test("Delete product", async ({ request }) => {
    await test.step("Execute DELETE request", async () => {
      //! ACT
      const responseDel = await request.delete(`/api/v1/products/${productData.id}`, {
        failOnStatusCode: true,
      });
      //! ASSERT
      expect(responseDel.ok()).toBeTruthy();
      expect(responseDel.status()).toBe(200);
    });

    await test.step("Verify product is deleted", async () => {
      const responseGetById = await request.get(`/api/v1/products/${productData.id}`);
      const jsonGet = await responseGetById.json();
      
      expect(responseGetById.status()).toBe(400); // Correct 404
      expect(jsonGet.name).toBe("EntityNotFoundError");
    });
  });
});

test.describe("Products API - Related Products", { tag: ["@products", "@related"] }, () => {
  
  test("Get products related by id", async ({ request }) => {
    //! ARRANGE
    const productIds: number[] = []

    await test.step("Precondition: Create 3 products in category #3", async () => {
      for (let i = 0; i < 3; i++) {
        const responsePost = await request.post("/api/v1/products", {
          data: {
            title: generateRandomString(),
            slug: "handmade-fresh-table",
            price: 123,
            description: generateRandomString(),
            categoryId: 3,
            images: ["https://placehold.co/600x400"],
          },
        });
        const jsonPost = await responsePost.json();
        productIds.push(jsonPost.id);
      }
    });

    await test.step("Execute GET request for related products", async () => {
      //! ACT
      const productId = productIds[0];
      const responseGet = await request.get(`/api/v1/products/${productId}/related`);
      
      //! ASSERT
      expect(responseGet.status()).toBe(200);
      
      const related = await responseGet.json();
      expect(Array.isArray(related)).toBeTruthy();
      
      for (const product of related) {
        expect(product.category.id).toBe(3); // Check categoryId = 3
      }
      
      // Check productId NOT exists in []
      const relatedIds = related.map((p: any) => p.id);
      expect(relatedIds).not.toContain(productId);
    });

    await test.step("Clean Up created products", async () => {
      for (const id of productIds) {
        await request.delete(`/api/v1/products/${id}`, {
          failOnStatusCode: false,
        });
      }
    });
  });
});