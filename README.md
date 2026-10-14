# try-clasp

## CLASP の始め方

```bash
clasp login
```

`open`でデフォルトブラウザで開くか、`copy`して任意のブラウザで開く。
画面の案内に従って必要な権限を与える。
認証情報は`~/.clasprc.json`に保存される。

### 新しいプロジェクトを作る

```bash
mkdir <project-name>
cd <project-name>
clasp create --title <project-name>
```

### 既存のプロジェクトを clone

```bash
mkdir <project-name>
cd <project-name>
clasp clone <script-id>
```

### プロジェクトの初期設定

```bash
npm i -D tslib @rollup/plugin-typescript rollup-plugin-gas @types/google-apps-script
```

以下のファイルを作成。

```json:tsconfig.json
{
  "compilerOptions": {
    "target": "ES2019",
    "module": "ESNext",
    "rootDir": "src",
    "strict": true,
    "sourceMap": true
  },
  "include": ["src/**/*"]
}
```
```js:rollup.config.mjs
import ts from "@rollup/plugin-typescript";
import gas from "rollup-plugin-gas";

export default {
  input: "src/index.ts", // エントリーポイント
  output: {
    dir: "build", // clasp の rootDir に合わせる
    format: "esm", // V8 は ESM OK
    preserveModules: true, // 元のファイル構造を保ち可読性◎
    indent: "  ",
    sourcemap: true,
  },
  plugins: [
    ts({ tsconfig: "./tsconfig.json" }),
    gas(), // global wrapper を付与
  ],
};
```
```json:package.json(追記分)
  "scripts": {
    "build": "rollup -c",
    "push": "npm run build && clasp push",
    "watch": "rollup -c -w"
  },
```

`npm run build`でローカルビルドのみ実行。
`npm run push`でローカルビルドとGASへのpushを実行。

### GAS 　の管理画面を開く

```bash
clasp open
```
