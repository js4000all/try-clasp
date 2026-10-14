
#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: create-gas-project <project-name>" >&2
  exit 1
fi

NAME="$1"

if [[ ! "$NAME" =~ ^[a-zA-Z0-9][a-zA-Z0-9_-]*$ ]]; then
  echo "Invalid project name: $NAME" >&2
  exit 1
fi

if [[ -e "$NAME" ]]; then
  echo "Already exists: $NAME" >&2
  exit 1
fi

for cmd in clasp pnpm node; do
  command -v "$cmd" >/dev/null || {
    echo "Command not found: $cmd" >&2
    exit 1
  }
done

mkdir -p "$NAME"/{src,build,test}
cd "$NAME"

# clasp プロジェクトの初期化
clasp create \
  --type standalone \
  --title "$NAME" \
  --rootDir build

# package.json
cat > package.json <<EOF
{
  "name": "$NAME",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "rollup -c",
    "push": "pnpm run build && clasp push",
    "watch": "rollup -c -w",
    "test": "vitest run"
  }
}
EOF

# tsconfig.json
cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2019",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "rootDir": "src",
    "strict": true,
    "sourceMap": true,
    "types": ["google-apps-script"]
  },
  "include": ["src/**/*.ts"]
}
EOF

# rollup.config.mjs
cat > rollup.config.mjs <<'EOF'
import ts from "@rollup/plugin-typescript";
import gas from "rollup-plugin-gas";

export default {
  input: "src/main.ts",
  output: {
    dir: "build",
    format: "iife",
    name: "GasBundle",
    preserveModules: false,
    indent: "  ",
    sourcemap: true,
  },
  plugins: [
    ts({ tsconfig: "./tsconfig.json" }),
    gas(),
  ],
};
EOF

# src/main.ts
cat > src/main.ts <<'EOF'
export function hello(): void {
  console.log("Hello from GAS!");
}
EOF

# .gitignore
cat > .gitignore <<'EOF'
node_modules/
build/*.js
build/*.js.map
.clasprc.json
EOF

# 開発依存関係のインストール
pnpm add -D \
  typescript@6 \
  rollup \
  @rollup/plugin-typescript \
  @types/google-apps-script \
  rollup-plugin-gas \
  tslib \
  vitest

# 初回ビルド
pnpm run build

echo
echo "Created: $NAME"
echo "  cd $NAME"
echo "  pnpm push"
