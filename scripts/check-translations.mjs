import { readFileSync } from "node:fs";
import ts from "typescript";

const dictionary = JSON.parse(
  readFileSync(
    new URL("../src/lib/translations/vi.json", import.meta.url),
    "utf8",
  ),
);
const files = process.argv.slice(2);
if (files.length === 0) {
  console.error(
    "Usage: node scripts/check-translations.mjs <file.tsx|file.jsx> [...]",
  );
  process.exitCode = 2;
}

for (const file of files) {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );

  function visit(node) {
    if (
      ts.isJsxElement(node) &&
      node.openingElement.tagName.getText(source) === "T"
    ) {
      for (const child of node.children) {
        const literal = ts.isJsxExpression(child) ? child.expression : child;
        if (
          !literal ||
          (!ts.isJsxText(literal) && !ts.isStringLiteralLike(literal))
        )
          continue;

        const key = literal.text.replace(/\s+/g, " ").trim();
        if (key && !Object.hasOwn(dictionary, key)) {
          const { line } = source.getLineAndCharacterOfPosition(
            literal.getStart(source),
          );
          console.error(
            `${file}:${line + 1}: missing Vietnamese translation for ${JSON.stringify(key)}`,
          );
          process.exitCode = 1;
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(source);
}
