describe("Integration Tests for URL Lambda", () => {
  let createdShortUrl: string;
  const testUserId = 1;
  const randomDomain = () =>
    Math.random().toString(36).substring(2, 20) + ".com";
  jest.setTimeout(30000);
  it("should create a URL and perform full lifecycle", async () => {
    const baseURL = "http://127.0.0.1:3000/url";
    const createUrlInput = {
      domainName: randomDomain(),
      userId: testUserId,
    };

    const createResponse = await fetch(baseURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createUrlInput),
    });

    expect(createResponse.status).toBe(201);
    const createData = await createResponse.json();
    expect(createData.message).toBe("Short URL created successfully");
    expect(createData.shortUrl).toBeDefined();

    createdShortUrl = createData.shortUrl;

    const getResponse = await fetch(`${baseURL}?url=${createdShortUrl}`, {
      method: "GET",
      redirect: "manual", // Prevent automatic redirect handling
    });

    expect(getResponse.status).toBe(301);
    expect(getResponse.headers.get("location")).toBe(
      `https://${createUrlInput.domainName}`
    );

    const deleteResponse = await fetch(
      `${baseURL}?url=${createdShortUrl}&userId=${testUserId}`,
      { method: "DELETE" }
    );

    expect(deleteResponse.status).toBe(200);
    const deleteData = await deleteResponse.json();
    expect(deleteData.message).toBe("URL deleted successfully");

    const notFoundResponse = await fetch(`${baseURL}?url=${createdShortUrl}`, {
      method: "GET",
      redirect: "manual",
    });

    expect(notFoundResponse.status).toBe(404);
  });
});
