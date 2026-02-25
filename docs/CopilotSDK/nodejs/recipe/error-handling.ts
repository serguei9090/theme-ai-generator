import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();

try {
  await client.start();
  const session = await client.createSession({ model: "gpt-5" });

  const response = await session.sendAndWait({ prompt: "Hello!" });
  console.log(response?.data.content);

  await session.destroy();
} catch (error) {
  console.error(
    "Error:",
    error instanceof Error ? error.message : String(error),
  );
} finally {
  await client.stop();
}
