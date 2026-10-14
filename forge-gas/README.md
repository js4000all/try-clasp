# forge-gas

Google Apps Script（GAS）の V8 ランタイム上で、[node-forge](https://github.com/digitalbazaar/forge) を利用した暗号処理を実行するための検証プロジェクト。

TypeScript と Rollup を使用して node-forge を GAS 向けにバンドルし、RSA-SHA256 署名検証を行う。

## 背景と目的

Google Apps Script は HTTP API の公開や Google サービスとの連携に適しているが、Node.js の `crypto` やブラウザの Web Crypto API を標準的な方法では利用できない。

そのため、GitHub Actions が発行する OIDC トークン（JWT）の署名を GAS 上で検証するには、別途暗号処理の実装が必要になる。

本プロジェクトでは、純粋な JavaScript で暗号処理を実装した node-forge を GAS に導入し、以下を検証する。

- node-forge を Rollup で GAS 向けにバンドルできること
- GAS の V8 ランタイム上で node-forge を初期化できること
- RSA-SHA256 署名を正しく検証できること
- node-forge 本体を改変せず、upstream の更新に追従できること

最終的には、GitHub Actions の OIDC トークンを GAS 側で検証する仕組みへの応用を想定している。

## 技術構成

- Google Apps Script（V8 ランタイム）
- TypeScript 6
- Rollup 4
- node-forge 1.4.0
- pnpm
- clasp

Rollup では以下のプラグインを使用する。

- `@rollup/plugin-typescript`
- `@rollup/plugin-node-resolve`
- `@rollup/plugin-commonjs`
- `rollup-plugin-gas`

node-forge は npm パッケージとして導入し、ソースコードを fork・改変せずに使用する。

## ディレクトリ構成

```text
forge-gas/
├── build/                 # GAS にアップロードする生成物
│   └── appsscript.json
├── src/
│   └── main.ts            # GAS エントリーポイント
├── test/
│   ├── generate-fixture.mjs
│   └── fixtures/          # RSA 鍵・署名のテストデータ
├── .clasp.json
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── rollup.config.mjs
├── tsconfig.json
└── README.md
```

`build/` は clasp の `rootDir` として設定する。

## セットアップ

Node.js、pnpm、clasp が使用可能であり、`clasp login` による認証が完了していることを前提とする。

依存パッケージをインストールする。

```bash
pnpm install --frozen-lockfile
```

GAS 向け JavaScript をビルドする。

```bash
pnpm build
```

ビルドしたコードを GAS にアップロードする。

```bash
pnpm push
```

コード変更を監視して自動ビルドする場合は、次を実行する。

```bash
pnpm watch
```

`pnpm push` はビルドと `clasp push` を順番に実行する。

## GAS エントリーポイント

`src/main.ts` では、GAS から呼び出す関数を `globalThis` に明示的に登録する。

```typescript
function testVerify(): void {
  // RSA 署名検証処理
}

(globalThis as any).testVerify = testVerify;
```

これにより、Rollup で IIFE にバンドルした後も、GAS のグローバル関数として公開できる。

## GAS 互換性対応

### 問題：`window is not defined`

node-forge 1.4.0 をそのまま Rollup でバンドルすると、GAS 上でスクリプトが評価される際に以下のエラーが発生した。

```text
ReferenceError: window is not defined
```

原因は node-forge の実行環境判定処理にある。

```javascript
util.globalScope = (function () {
  if (util.isNodejs) {
    return commonjsGlobal;
  }

  return typeof self === "undefined" ? window : self;
})();
```

GAS の V8 ランタイムには、ブラウザの `window` や `self` が存在しない。
このため、node-forge が `window` を参照した時点で例外が発生する。

このエラーは、`testVerify` の実行前、スクリプトの初期評価時に発生する。

### 解決方法：Rollup の `output.intro`

`rollup.config.mjs` の `output` に次の設定を追加する。

```javascript
output: {
  dir: "build",
  format: "iife",
  name: "GasBundle",
  preserveModules: false,
  indent: "  ",
  sourcemap: true,

  // node-forge のブラウザ環境判定を GAS V8 に適合させる
  intro: "var self = globalThis;",
},
```

Rollup の `output.intro` は、生成する IIFE の内部でバンドル本体より前にコードを挿入する。

これによって node-forge の初期化処理が実行される前に `self` が定義され、`globalThis` を参照できるようになる。

この方法の利点は以下のとおり。

- node-forge のソースコードを変更する必要がない
- fork や独自パッチが不要
- GAS 固有の互換性対応を Rollup 設定に集約できる
- npm から upstream の更新を取り込める

**この設定は GAS 上で node-forge を動作させるために必要な互換性対応であり、削除する場合は再検証すること。**

なお、これは node-forge 1.4.0 で確認した対応であり、将来のバージョンについて動作を保証するものではない。

## RSA-SHA256 署名検証テスト

Node.js の標準 `crypto` モジュールで RSA 鍵ペアと署名を生成し、GAS 上の node-forge で署名を検証する。

署名生成と検証に異なる暗号実装を使用することで、相互運用性を確認する。

### 1. テストデータの生成

```bash
node test/generate-fixture.mjs
```

以下のテストデータを生成する。

```text
test/fixtures/
├── public.pem
├── private.pem
├── message.txt
└── signature.base64
```

署名方式は RS256（RSA PKCS#1 v1.5 + SHA-256）、RSA 鍵長は 2048 bit とする。

### 2. GAS 側で署名を検証

公開鍵、メッセージ、署名を使用して、GAS 上で署名検証を実行する。
検証処理の主要部分は以下のとおり。

```typescript
import forge from "node-forge";

const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
const signature = forge.util.decode64(signatureBase64);

const md = forge.md.sha256.create();
md.update(message, "utf8");

const valid = publicKey.verify(md.digest().bytes(), signature);

console.log("Signature valid:", valid);
```

### 3. 検証結果

Node.js 標準の `crypto` で生成した署名を、GAS 上の node-forge 1.4.0 で正常に検証できた。

```text
Signature valid: true
```

これにより、以下を確認した。

- Rollup による node-forge のバンドルが成功する
- GAS 上で node-forge の初期化が成功する
- PEM 形式の RSA 公開鍵を読み込める
- SHA-256 ダイジェストを計算できる
- RSA PKCS#1 v1.5 署名検証が成功する

現時点では正常な署名による検証を確認済み。改ざん署名などの異常系については追加テストが必要。

## 今後の課題

### 署名検証の追加テスト

不正な署名、メッセージの改ざん、不正な公開鍵などに対し、検証が適切に失敗することを確認する。

### JWK / JWKS への対応

GitHub Actions の OIDC トークン検証に向けて、JWKS から RSA 公開鍵を取得し、JWK の `n`（modulus）と `e`（public exponent）から node-forge の公開鍵を構築する。

### JWT の検証

JWT を `header.payload.signature` に分割し、Base64URL デコード、`kid` による公開鍵選択、RS256 署名検証を実装する。

署名検証だけでなく、`iss`、`aud`、`exp`、`nbf` などのクレーム、および呼び出し元の許可条件も検証する。

### upstream への追従

node-forge はバージョンを固定して運用し、更新時には Rollup ビルドと GAS 上での動作確認を行う。

暗号ライブラリであるため、セキュリティ修正への追従を重視する。

## 参考資料

- [node-forge — GitHub](https://github.com/digitalbazaar/forge)
- [Rollup Configuration Options](https://rollupjs.org/configuration-options/)
- [Google Apps Script V8 Runtime](https://developers.google.com/apps-script/guides/v8-runtime)
- [GitHub Actions — OpenID Connect](https://docs.github.com/en/actions/concepts/security/openid-connect)
