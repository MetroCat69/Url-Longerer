describe("Integration Tests for User Lambda", () => {
  let createdUserId: number;
  const randomEmail = () =>
    Math.random().toString(36).substring(2, 10) + "@example.com";
  jest.setTimeout(30000);

  it("should create a User and perform full lifecycle", async () => {
    const baseURL = "http://127.0.0.1:3000/user";
    const createUserInput = {
      name: "Test User",
      email: randomEmail(),
      password: "securePassword123",
    };

    const createResponse = await fetch(baseURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createUserInput),
    });

    expect(createResponse.status).toBe(201);
    const createData = await createResponse.json();
    expect(createData.message).toBe("User created successfully");
    expect(createData.userId).toBeDefined();

    createdUserId = createData.userId;

    const createUrlInput1 = {
      domainName: "testsite1.com",
      userId: createdUserId,
    };
    const createUrlInput2 = {
      domainName: "testsite2.com",
      userId: createdUserId,
    };

    await fetch("http://127.0.0.1:3000/url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createUrlInput1),
    });

    const FoundUserResponse = await fetch(
      `${baseURL}?userId=${createdUserId}`,
      {
        method: "GET",
      }
    );
    expect(FoundUserResponse.status).toBe(200);

    await fetch("http://127.0.0.1:3000/url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createUrlInput2),
    });

    const deleteResponse = await fetch(`${baseURL}?userId=${createdUserId}`, {
      method: "DELETE",
    });

    expect(deleteResponse.status).toBe(200);
    const deleteData = await deleteResponse.json();
    expect(deleteData.message).toBe("User and all links deleted successfully");

    const notFoundResponse = await fetch(`${baseURL}?userId=${createdUserId}`, {
      method: "GET",
    });

    expect(notFoundResponse.status).toBe(404);
  });
});
