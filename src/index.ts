import { createClient } from "redis";

async function testRedisConnection() {
  const client = createClient({
    username: "default",
    password: `ww6qTLZ5ojKFG3ogaG1zWIjrTXjvzdIT`, // Replace with your actual password
    socket: {
      host: "redis-10431.c293.eu-central-1-1.ec2.redns.redis-cloud.com",
      port: 10431,
    },
  });

  client.on("error", (err: any) => console.log("Redis Client Error", err));

  try {
    await client.connect();
    console.log("Connected to Redis!");

    // Set and get a test value
    await client.set("foo", "bar");
    const result = await client.get("foo");

    console.log("Redis Value:", result); // Expected output: "bar"
  } catch (error) {
    console.error("Error connecting to Redis:", error);
  } finally {
    await client.disconnect();
    console.log("Disconnected from Redis.");
  }
}

// Run the function
testRedisConnection();
