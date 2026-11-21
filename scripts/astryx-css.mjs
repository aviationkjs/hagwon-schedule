// Astryx 디자인 시스템 토큰(src/theme/astryx-tokens.json)을 CSS 변수 파일로 만든다.
// Claude 디자인의 Astryx가 바뀌면 tokens.json 을 다시 복사하고 `npm run theme` 을 실행한다.
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "src/theme/astryx-tokens.json";
const OUT = "src/theme/astryx.css";
const t = JSON.parse(readFileSync(SRC, "utf8"));

const [first, ...otherThemes] = t.color.themes.map((th) => th.id);
const alias = (v) => (typeof v === "string" ? v.replace(/^\{(.+)\}$/, "var(--$1)") : v);
const themed = (tokens, theme) =>
  tokens
    .map((tok) => {
      const v = typeof tok.value === "string" ? (theme === first ? tok.value : undefined) : tok.value[theme];
      return v === undefined ? null : `  --${tok.name}: ${alias(v)};`;
    })
    .filter(Boolean);
const plain = (family) => (t[family]?.tokens ?? []).map((tok) => `  --${tok.name}: ${tok.value};`);

const fonts = Object.entries(t.type.families).map(([k, v]) => `  --font-${k}: ${v};`);
const textStyles = t.type.groups.flatMap((g) =>
  g.styles.flatMap((s) => [
    `  --text-${s.name}-size: ${s.fontSize};`,
    `  --text-${s.name}-line: ${s.lineHeight};`,
    `  --text-${s.name}-weight: ${s.fontWeight};`,
    `  --text-${s.name}-family: var(--font-${g.family});`,
  ]),
);

const lines = [
  `/* ${t.name} — generated from tokens.json (${t.meta?.repo ?? ""} ${t.meta?.ref ?? ""}). 직접 고치지 말고 npm run theme */`,
  ":root {",
  ...themed(t.color.tokens, first),
  ...themed(t.shadow.tokens, first),
  ...plain("spacing"),
  ...plain("radius"),
  ...plain("size"),
  ...fonts,
  ...textStyles,
  "}",
  ...otherThemes.flatMap((theme) => [
    `@media (prefers-color-scheme: ${theme}) {`,
    "  :root {",
    ...themed(t.color.tokens, theme).map((l) => "  " + l),
    ...themed(t.shadow.tokens, theme).map((l) => "  " + l),
    "  }",
    "}",
  ]),
  "",
];

writeFileSync(OUT, lines.join("\n"));
console.log(`${OUT}: ${t.color.tokens.length} colors, themes ${t.color.themes.map((x) => x.id).join("/")}`);
