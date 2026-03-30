const request = require("supertest");
const app = require("../app");

describe("Auth routes", () => {

  test("GET /api/auth/profile without cookie returns 401", async () => {
    const res = await request(app).get("/api/auth/profile");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  test("POST /api/auth/login with invalid data", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "wrong@test.com",
        password: "123"
      });

    expect(res.status).toBe(401);
  });

});