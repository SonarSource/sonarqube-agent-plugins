import type { Skill } from "@opencode/plugin";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

export async function loadSkills(): Promise<Skill.Info[]> {
  const directory = fileURLToPath(new URL("../skills", import.meta.url));
  const entries = await readdir(directory, { withFileTypes: true });

  return Promise.all(
    entries.filter((entry) => entry.isDirectory()).map(async ({ name: id }) => {
      const path = join(directory, id, "SKILL.md");
      const text = await readFile(path, "utf8");
      const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
      const data = frontmatter ? parse(frontmatter[1]) : {};

      return {
        id,
        name: typeof data?.name === "string" ? data.name : id,
        ...(typeof data?.description === "string" ? { description: data.description } : {}),
        path,
        content: frontmatter ? text.slice(frontmatter[0].length) : text,
      } as Skill.Info;
    }),
  );
}
