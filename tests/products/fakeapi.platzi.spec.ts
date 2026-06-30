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

// test.beforeEach(async () => {
//   console.log("Before Each on file level");
// });

// test.afterEach(async () => {
//   console.log("After Each on file level");
// });

test.describe("GET products", { tag: ["@getProduct"] }, () => {
  test("Get products", async ({ request }) => {
    await test.step("Get all products", async () => {
      const response = await request.get("/api/v1/products", {
        failOnStatusCode: true,
      });
      expect(response.status()).toBe(200);
    });
  });
});

test.describe(
  "Products tests with Clean Up(?)",
  { tag: ["@products", "@cleanUp"] },
  () => {
    let productIdAndSlug;
    let uniqueTitle: string;

    test.beforeEach(async ({ request }) => {
      //! ARRANGE
      uniqueTitle = await test.step("Generate unique title", async () => {
        return generateRandomProductTitle();
      });

      const uniqueDescription =
        await test.step("Generate unique description", async () => {
          return generateRandomProductTitle();
        });

      const responseCreate =
        await test.step(`Create product with title: ${uniqueTitle}`, async () => {
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

      let jsonCreate = await responseCreate.json();
      const productId = jsonCreate["id"];
      const productSlug = jsonCreate["slug"];

      productIdAndSlug = { productId, productSlug };
    });

    test.afterEach(async ({ request }) => {
      //? Clean Up
      await test.step("Clean Up", async () => {
        await request.delete(
          `/api/v1/products/${productIdAndSlug!.productId}`,
          {
            failOnStatusCode: true,
          },
        );
      });
    });

    test("Update product", async ({ request }) => {
      let updatedTitle = generateRandomProductTitle();
      let updatedDescription = generateRandomProductTitle();

      //! ACT
      await test.step("Update product title and description", async () => {
        const responsePut = await request.put(
          `/api/v1/products/${productIdAndSlug!.productId}`,
          {
            failOnStatusCode: true,
            data: {
              title: updatedTitle,
              slug: "handmade-fresh-table",
              price: 123,
              description: updatedDescription,
              categoryId: 1,
              images: ["https://placehold.co/600x400"],
            },
          },
        );
        let jsonPut = await responsePut.json();

        //! ASSERT
        expect(responsePut.status()).toBe(200);
        expect(jsonPut.title).toBe(updatedTitle);
        expect(jsonPut.description).toEqual(updatedDescription);
      });
    });

    test("Get a single product by id", async ({ request }) => {
      //! ACT
      await test.step("Execute GET-request for single product by id", async () => {
        const responseGetById = await request.get(
          `/api/v1/products/${productIdAndSlug!.productId}`,
          {
            failOnStatusCode: true,
          },
        );
        const jsonGetById = await responseGetById.json();

        expect(responseGetById.status()).toBe(200);
        expect(jsonGetById).toHaveProperty("id", productIdAndSlug!.productId);
        expect(jsonGetById).toHaveProperty("title", uniqueTitle);
      });
    });

    test("Get a single product by slug", async ({ request }) => {
      let actualSlug = productIdAndSlug!.productSlug;

      //! ACT
      await test.step("Execute GET-request for single product by slug", async () => {
        const responseGetBySlug = await request.get(
          `/api/v1/products/slug/${actualSlug}`,
        );

        const jsonGetBySlug = await responseGetBySlug.json();

        //! ASSERT
        expect(responseGetBySlug.status()).toBe(200);
        expect(jsonGetBySlug).toHaveProperty("id", productIdAndSlug!.productId);
        expect(jsonGetBySlug).toHaveProperty("title", uniqueTitle);
        expect(jsonGetBySlug).toHaveProperty("slug", actualSlug);
      });
    });
  },
);

test.describe("Create products", { tag: ["@products", "@cleanUp"] }, () => {
  let productId: number;
  let uniqueTitle: string;
  let uniqueDescription: string;

  test.beforeEach(async ({ request }) => {
    //! ARRANGE
    uniqueTitle = await test.step("Generate unique title", async () => {
      return generateRandomProductTitle();
    });

    uniqueDescription =
      await test.step("Generate unique description", async () => {
        return generateRandomProductTitle();
      });
  });
  test.afterEach(async ({ request }) => {
    //? Clean Up
    await test.step("Clean Up", async () => {
      await request.delete(`/api/v1/products/${productId}`, {
        failOnStatusCode: true,
      });
    });
  });

  test("Create product", async ({ request }) => {
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

    productId = json.id;
    //! ASSERT
    expect(response.status()).toBe(201);
    expect(response.statusText()).toMatch("Created");
    expect(response.headers()["content-type"]).toContain("application/json");
    expect(json).toHaveProperty("id");
    expect(json).toHaveProperty("price", 123);
    expect(json.title).toBe(uniqueTitle);
    expect(json.description).toEqual(uniqueDescription);

    // Check product exists
    const responseGetById = await request.get(`/api/v1/products/${productId}`, {
      failOnStatusCode: true,
    });
    const jsonGetById = await responseGetById.json();

    expect(responseGetById.status()).toBe(200);
    expect(jsonGetById).toHaveProperty("id", productId);
  });
});

// test("Delete product", async ({ request }) => {
//   // Create product
//   let title = generateRandomProductTitle();

//   const responsePost = await request.post("/api/v1/products", {
//     failOnStatusCode: true,
//     data: {
//       title: title,
//       slug: "handmade-fresh-table",
//       price: 123,
//       description: generateRandomProductTitle(),
//       categoryId: 1,
//       images: ["https://placehold.co/600x400"],
//     },
//   });
//   const jsonPost = await responsePost.json();
//   const productId = jsonPost.id;
//   expect(responsePost.status()).toBe(201);
//   expect(responsePost.statusText()).toMatch("Created");

//   // Delete product
//   const responseDel = await request.delete(`/api/v1/products/${productId}`, {
//     failOnStatusCode: true,
//   });
//   expect(responseDel).toBeOK(); // only for 2xx;
//   expect(responseDel.status()).toBe(200);

//   // Check product NOT exists
//   const responseGetById = await request.get(`/api/v1/products/${productId}`);
//   const jsonGet = await responseGetById.json();
//   // expect(responseGetById.status()).toBe(404);
//   expect(jsonGet.name).toBe("EntityNotFoundError");
// });

// test("Get a single product by id", async ({ request }) => {
//   // Create product
//   let title = generateRandomProductTitle();

//   const responsePost = await request.post("/api/v1/products", {
//     failOnStatusCode: true,
//     data: {
//       title: title,
//       slug: "handmade-fresh-table",
//       price: 123,
//       description: generateRandomProductTitle(),
//       categoryId: 1,
//       images: ["https://placehold.co/600x400"],
//     },
//   });
//   const jsonPost = await responsePost.json();
//   const productId = jsonPost.id;
//   expect(responsePost.status()).toBe(201);
//   expect(responsePost.statusText()).toMatch("Created");

//   // Get a single product by id
//   const responseGetById = await request.get(`/api/v1/products/${productId}`, {
//     failOnStatusCode: true,
//   });
//   const jsonGetById = await responseGetById.json();

//   expect(responseGetById.status()).toBe(200);
//   expect(jsonGetById).toHaveProperty("id", productId);
//   expect(jsonGetById).toHaveProperty("title", title);

//   // Clean Up
//   const responseDel = await request.delete(`/api/v1/products/${productId}`, {
//     failOnStatusCode: true,
//   });
//   expect(responseDel).toBeOK(); // only for 2xx;
//   expect(responseDel.status()).toBe(200);
// });

// test("Get a single product by slug", async ({ request }) => {
//   // Create product
//   let title = generateRandomProductTitle();
//   let slug = title.toLocaleLowerCase();

//   const responsePost = await request.post("/api/v1/products", {
//     failOnStatusCode: true,
//     data: {
//       title: title,
//       slug: title,
//       price: 123,
//       description: generateRandomProductTitle(),
//       categoryId: 1,
//       images: ["https://placehold.co/600x400"],
//     },
//   });
//   const jsonPost = await responsePost.json();
//   const productId = jsonPost.id;
//   expect(responsePost.status()).toBe(201);
//   expect(responsePost.statusText()).toMatch("Created");
//   expect(jsonPost.slug).toBe(slug);

//   // Get a single product by slug
//   const responseGetBySlug = await request.get(
//     `/api/v1/products/slug/${slug}`,
//   );
//   const jsonGetBySlug = await responseGetBySlug.json();
//   expect(responseGetBySlug.status()).toBe(200);
//   expect(jsonGetBySlug).toHaveProperty("id", productId);
//   expect(jsonGetBySlug).toHaveProperty("title", title);
//   expect(jsonGetBySlug).toHaveProperty("slug", slug);

//   // Clean Up
//   const responseDel = await request.delete(`/api/v1/products/${productId}`, {
//     failOnStatusCode: true,
//   });
//   expect(responseDel).toBeOK(); // only for 2xx;
//   expect(responseDel.status()).toBe(200);
// });

// test("Check pagination 10", async ({ request }) => {
//   const response = await request.get(`/api/v1/products`, {
//     params: {
//       offset: 0,
//       limit: 10,
//     },
//   });

//   const json = await response.json();
//   expect(response.status()).toBe(200);
//   expect(json).toHaveLength(10);
// });

// test("Get products related by id", async ({ request }) => {
//   // Create 3 products in same category #3

//   const objects = [];
//   const productIds = [];
//   for (let i = 0; i < 3; i++) {
//     const responsePost = await request.post("/api/v1/products", {
//       data: {
//         title: generateRandomProductTitle(),
//         slug: "handmade-fresh-table",
//         price: 123,
//         description: generateRandomProductTitle(),
//         categoryId: 3,
//         images: ["https://placehold.co/600x400"],
//       },
//     });

//     const jsonPost = await responsePost.json();
//     const id = jsonPost.id;
//     objects.push(jsonPost);
//     productIds.push(id);
//   }

//   // Get products related by id
//   const productId = productIds[0];
//   const responseGet = await request.get(
//     `/api/v1/products/${productId}/related`,
//   );
//   expect(responseGet.status()).toBe(200);
//   const related = await responseGet.json();
//   expect(Array.isArray(related)).toBeTruthy();
//   for (const product of related) {
//     expect(product.category.id).toBe(3);
//   }
//   const relatedIds = related.map((p: any) => p.id);
//   expect(relatedIds).not.toContain(productId);

//   // Clean Up
//   for (const id of productIds) {
//     await request.delete(`/api/v1/products/${id}`, {
//       failOnStatusCode: true,
//     });
//   }
// });

// await test.step('User executes POST request on endpoint', async () => {

//   });
