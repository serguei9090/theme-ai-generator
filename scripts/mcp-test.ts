import { executeGenerate } from "../packages/mcp-server/src/server";

console.log("🎨 Generating a 'Cyberpunk Midnight' palette...");
try {
  const result = await executeGenerate({
    mood: "Cyberpunk Midnight: deep purples, electric cyan highlights, and dark obsidian backgrounds.",
    provider: "gemini",
  });
  console.log("\n✅ Generation Successful!");
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error("\n❌ Generation Failed:", error);
}
