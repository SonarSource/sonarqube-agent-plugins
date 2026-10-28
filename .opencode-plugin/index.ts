import type { Plugin } from "@opencode/plugin";
import { loadSkills } from "./skills.ts";

export default {
  id: "sonarsource.sonarqube",
  async setup(ctx) {
    const skills = await loadSkills();
    await ctx.skill.transform((editor) => {
      skills.forEach((skill) => editor.add(skill));
    });
    await ctx.command.transform((editor) => {
      skills.forEach((skill) => {
        editor.add({
          name: skill.name,
          description: skill.description,
          async execute({ sessionID, prompt, delivery }) {
            await ctx.session.prompt({
              ...prompt,
              sessionID,
              delivery,
              skills: [...(prompt.skills ?? []), { id: skill.id }],
            });
          },
        });
      });
    });
    await ctx.mcp.transform((editor) => {
      if (!editor.get("sonarqube")) {
        editor.set("sonarqube", {
          type: "local",
          command: ["sonar", "run", "mcp"],
        });
      }
    });
  },
} satisfies Plugin.Plugin;
