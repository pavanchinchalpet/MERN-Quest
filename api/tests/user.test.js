const request = require("supertest");
const app = require("../app");

describe("User routes", () => {

  test("GET /api/user/profile without auth", async () => {
    const res = await request(app).get("/api/user/profile");

    expect(res.status).toBe(401);
  });

});