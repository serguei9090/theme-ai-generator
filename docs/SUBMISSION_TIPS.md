# 🚀 Agents League Submission Tips

To win the **Creative Apps** track, presentation is just as important as the code. Follow these tips to polish your submission.

## 📸 1. Recommended Screenshots
Place these in `docs/screenshots/`. Judges love seeing the "Theory vs. Reality" of an AI agent.

- **[Hero Shot] `hero_view.png`**: The main interface showing the Chat Sidebar on the left and the Mockup Previews updating live on the right. Use a vibrant mood like "Neon Cyberpunk" or "Pastel Minimalism" for maximum impact.
- **[Intelligence Shot] `creative_director.png`**: A screenshot of the chat where the AI is suggesting style ideas (Discovery mode). This shows the "Orchestrator" reasoning in action.
- **[Architecture Shot] `settings_expert.png`**: Open the **Settings Dialog** to show the split configuration between the "Creative Director" (Copilot SDK) and the "Palette Engine" (Gemini/MCP). This proves your multi-LLM routing logic.
- **[Mobile Precision] `mobile_preview.png`**: A close-up of the Mobile App mockup. It demonstrates that your AI understands how to apply colors to small, dense UI surfaces.

## 🎥 2. Demo Video Script (2-3 Minutes)
A good demo video follows this "Creative Loop":

1.  **The Hook (30s)**: "Hi, I'm building Theme AI Generator. I was tired of picking colors that look good as swatches but fail in real UIs. Here's how I solve it using a Dual-Brain AI architecture."
2.  **The Discovery (45s)**: Type "I'm building a space-themed analytics app." Show the Creative Director suggesting 3 distinct styles. Select one.
3.  **The Execution (45s)**: Watch as the MCP Server generates the palette. Show the 4 mockups (Web, Desktop, Mobile) updating instantly.
4.  **The Refinement (30s)**: "I like it, but make the action buttons a bit more 'electric' blue." Use the Tweak tool to show precision control.
5.  **The Technology (30s)**: Briefly show the Settings toggle between Gemini and Local Ollama to demonstrate your resilient routing.

## 🧠 3. Presenting Copilot Evidence
We have a massive log in `docs/copilot_prompt_respopnse.md`. **Don't expect judges to read it all.**

- Use `docs/PROMPT_HIGHLIGHTS.md` (newly created) in your submission issue. 
- It highlights the 3 specific moments where Copilot didn't just "write code" but **solved architectural problems** for you.

## 🏁 Final Submission Checklist
- [ ] Repository is **Public**.
- [ ] `README.md` has your real Demo Video link.
- [ ] `.env.example` at root is accurate.
- [ ] You've opened the issue on the [Agents League Repo](https://github.com/microsoft/agentsleague/issues/new?template=project.yml).
