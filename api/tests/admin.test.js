const request = require("supertest");
const app = require("../app");

describe("Admin routes", () => {

  test("GET /api/admin without auth", async () => {
    const res = await request(app).get("/api/admin");

    expect(res.status).toBe(401);
  });

});