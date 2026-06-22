import { test, expect } from "@playwright/test";

function generateRandomProductTitle(): string {
  const minLength = 3;
  const maxLength = 20;
  const length =
    Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;

  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ";
  let title = "";

  for (let i = 0; i < length; i++) {
    title += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return title.trim();
}

test("Get products", async ({ request }) => {
  const response = await request.get("/api/v1/products", {
    failOnStatusCode: true,
  });
  expect(response.status()).toBe(200);
});

test("Create product", async ({ request }) => {
  let title = generateRandomProductTitle();
  let description = generateRandomProductTitle();

  const response = await request.post("/api/v1/products", {
    data: {
      title: title,
      slug: "handmade-fresh-table",
      price: 123,
      description: description,
      categoryId: 1,
      images: ["https://placehold.co/600x400"],
    },
  });
  const json = await response.json();

  const productId = json.id;
  expect(response.status()).toBe(201);
  expect(response.statusText()).toMatch("Created");
  expect(response.headers()["content-type"]).toContain("application/json");
  expect(json).toHaveProperty("id");
  expect(json).toHaveProperty("price", 123);
  expect(json.title).toBe(title);
  expect(json.description).toEqual(description);

  // Check product exists
  const responseGetById = await request.get(`/api/v1/products/${productId}`, {
    failOnStatusCode: true,
  });
  const jsonGetById = await responseGetById.json();

  expect(responseGetById.status()).toBe(200);
  expect(jsonGetById).toHaveProperty("id", productId);

  // Clean Up
  const responseDel = await request.delete(`/api/v1/products/${productId}`, {
    failOnStatusCode: true,
  });
  expect(responseDel).toBeOK(); // only for 2xx;
  expect(responseDel.status()).toBe(200);
});

test("Update product", async ({ request }) => {
  // Create product
  let title = generateRandomProductTitle();
  let description = generateRandomProductTitle();

  const responsePost = await request.post("/api/v1/products", {
    failOnStatusCode: true,
    data: {
      title: title,
      slug: "handmade-fresh-table",
      price: 123,
      description: description,
      categoryId: 1,
      images: ["https://placehold.co/600x400"],
    },
  });
  const jsonPost = await responsePost.json();

  const productId = jsonPost.id;
  expect(responsePost.status()).toBe(201);
  expect(responsePost.statusText()).toMatch("Created");

  // Update product
  let updatedTitle = generateRandomProductTitle();
  let updatedDescription = generateRandomProductTitle();

  const responsePut = await request.put(`/api/v1/products/${productId}`, {
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
  let jsonPut = await responsePut.json();

  expect(responsePut.status()).toBe(200);
  expect(jsonPut.title).toBe(updatedTitle);
  expect(jsonPut.description).toEqual(updatedDescription);

  // Clean Up
  const responseDel = await request.delete(`/api/v1/products/${productId}`, {
    failOnStatusCode: true,
  });
  expect(responseDel).toBeOK(); // only for 2xx;
  expect(responseDel.status()).toBe(200);
});

test("Delete product", async ({ request }) => {
  // Create product
  let title = generateRandomProductTitle();

  const responsePost = await request.post("/api/v1/products", {
    failOnStatusCode: true,
    data: {
      title: title,
      slug: "handmade-fresh-table",
      price: 123,
      description: generateRandomProductTitle(),
      categoryId: 1,
      images: ["https://placehold.co/600x400"],
    },
  });
  const jsonPost = await responsePost.json();
  const productId = jsonPost.id;
  expect(responsePost.status()).toBe(201);
  expect(responsePost.statusText()).toMatch("Created");

  // Delete product
  const responseDel = await request.delete(`/api/v1/products/${productId}`, {
    failOnStatusCode: true,
  });
  expect(responseDel).toBeOK(); // only for 2xx;
  expect(responseDel.status()).toBe(200);

  // Check product NOT exists
  const responseGetById = await request.get(`/api/v1/products/${productId}`);
  const jsonGet = await responseGetById.json();
  // expect(responseGetById.status()).toBe(404);
  expect(jsonGet.name).toBe("EntityNotFoundError");
});

test("Get a single product by id", async ({ request }) => {
  // Create product
  let title = generateRandomProductTitle();

  const responsePost = await request.post("/api/v1/products", {
    failOnStatusCode: true,
    data: {
      title: title,
      slug: "handmade-fresh-table",
      price: 123,
      description: generateRandomProductTitle(),
      categoryId: 1,
      images: ["https://placehold.co/600x400"],
    },
  });
  const jsonPost = await responsePost.json();
  const productId = jsonPost.id;
  expect(responsePost.status()).toBe(201);
  expect(responsePost.statusText()).toMatch("Created");

  // Get a single product by id
  const responseGetById = await request.get(`/api/v1/products/${productId}`, {
    failOnStatusCode: true,
  });
  const jsonGetById = await responseGetById.json();

  expect(responseGetById.status()).toBe(200);
  expect(jsonGetById).toHaveProperty("id", productId);
  expect(jsonGetById).toHaveProperty("title", title);

  // Clean Up
  const responseDel = await request.delete(`/api/v1/products/${productId}`, {
    failOnStatusCode: true,
  });
  expect(responseDel).toBeOK(); // only for 2xx;
  expect(responseDel.status()).toBe(200);
});

test("Get a single product by slug", async ({ request }) => {
  // Create product
  let title = generateRandomProductTitle();
  let slug = title.toLocaleLowerCase();

  const responsePost = await request.post("/api/v1/products", {
    failOnStatusCode: true,
    data: {
      title: title,
      slug: title,
      price: 123,
      description: generateRandomProductTitle(),
      categoryId: 1,
      images: ["https://placehold.co/600x400"],
    },
  });
  const jsonPost = await responsePost.json();
  const productId = jsonPost.id;
  expect(responsePost.status()).toBe(201);
  expect(responsePost.statusText()).toMatch("Created");
  expect(jsonPost.slug).toBe(slug);

  // Get a single product by slug
  const responseGetBySlug = await request.get(`/api/v1/products/slug/${slug}`);
  const jsonGetBySlug = await responseGetBySlug.json();
  expect(responseGetBySlug.status()).toBe(200);
  expect(jsonGetBySlug).toHaveProperty("id", productId);
  expect(jsonGetBySlug).toHaveProperty("title", title);
  expect(jsonGetBySlug).toHaveProperty("slug", slug);

  // Clean Up
  const responseDel = await request.delete(`/api/v1/products/${productId}`, {
    failOnStatusCode: true,
  });
  expect(responseDel).toBeOK(); // only for 2xx;
  expect(responseDel.status()).toBe(200);
});

test("Check pagination 10", async ({ request }) => {
  const response = await request.get(`/api/v1/products`, {
    params: {
      offset: 0,
      limit: 10,
    },
  });

  const json = await response.json();
  expect(response.status()).toBe(200);
  expect(json).toHaveLength(10);
});

test("Get products related by id", async ({ request }) => {
  // Create 3 products in same category #3

  const objects = [];
  const productIds = [];
  for (let i = 0; i < 3; i++) {
    const responsePost = await request.post("/api/v1/products", {
      data: {
        title: generateRandomProductTitle(),
        slug: "handmade-fresh-table",
        price: 123,
        description: generateRandomProductTitle(),
        categoryId: 3,
        images: ["https://placehold.co/600x400"],
      },
    });

    const jsonPost = await responsePost.json();
    const id = jsonPost.id;
    objects.push(jsonPost);
    productIds.push(id);
  }

  // Get products related by id
  const productId = productIds[0];
  const responseGet = await request.get(
    `/api/v1/products/${productId}/related`,
  );
  expect(responseGet.status()).toBe(200);
  const related = await responseGet.json();
  expect(Array.isArray(related)).toBeTruthy();
  for (const product of related) {
    expect(product.category.id).toBe(3);
  }
  const relatedIds = related.map((p: any) => p.id);
  expect(relatedIds).not.toContain(productId);

  // Clean Up
  for (const id of productIds) {
    await request.delete(`/api/v1/products/${id}`, { failOnStatusCode: true });
  }
});
