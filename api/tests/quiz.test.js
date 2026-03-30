const request = require("supertest");
const app = require("../app");

describe("Quiz routes", () => {

  test("GET /api/quiz without login", async () => {
    const res = await request(app).get("/api/quiz");

    expect(res.status).toBe(401);
  });

});