# Repository Guidelines

## プロジェクト構成とモジュール配置
- `src/app` は Next.js App Router のエントリーポイントで、ページ、レイアウト、API ルートを保持します。
- `src/components`, `src/hooks`, `src/lib`, `src/types` で UI・状態管理・ドメインロジック・型定義を分離し、`@/*` パスエイリアスで再利用します。
- `public` には静的アセット、`scripts` には Mastra/認証ワークフローを検証する CLI テストがまとまっています。
- ルート直下の `next.config.ts`, `tsconfig.json`, `eslint.config.mjs` は必ず PR ごとに差分を確認してください。

## ビルド・テスト・開発コマンド
```bash
npm run dev           # Turbopack でローカル開発サーバーを起動 (http://localhost:3000)
npm run build         # 本番用ビルドを生成
npm run start         # 事前ビルド済みアプリの起動
npm run lint          # ESLint (next/core-web-vitals, next/typescript) を実行
npm run test:mastra-agent   # Mastra エージェント設定の健全性を手動検証
npm run test:auth-flow      # NextAuth/MongoDB 連携のシナリオテスト
```
- 複数テストをまとめて走らせたい場合は、`scripts/` 配下のファイルを `tsx` で呼び出す npm script を追加します。

## コーディングスタイルと命名規約
- TypeScript は `strict: true`。`any` の使用を避け、型は `src/types` に集約します。
- React/コンポーネントは `PascalCase`、hooks は `use` で始める `camelCase` を徹底します。
- ESLint に違反しないことを前提に、コンポーネント内部は 2 スペースインデント、不要な `console.log` は PR 前に削除します。
- UI パーツは `src/components` に集約し、状態共有は `src/hooks` または `src/lib` のサービス層に置くのが基本です。

## テストガイドライン
- 既存の E2E 風テストは `scripts/test-*.ts` で `tsx` を通じて実行します。ログ出力を活用し、成功条件を明記してください。
- 単体テストを追加する場合は Vitest (`vitest`, `@testing-library/react`) を利用し、ファイル名は `*.spec.ts(x)` で `src` 階層に配置します。
- MongoDB 依存テストでは `docker compose up mongodb` でローカルコンテナを起動し、終了後は `docker compose down` を忘れないでください。

## コミットとプルリクエスト運用
- コミットは Conventional Commit 形式 (例: `feat: add mastra chat agent config`) を必須とします。
- PR には目的、主要変更点、テスト結果、関連 Issue を記載し、UI 変更時はスクリーンショットを添付してください。
- マージ前に `npm run lint` と該当テストを実行し、結果ログを PR コメントに共有することを推奨します。

## 環境設定とセキュリティ
- 認証や Mongo 接続情報は `.env.local` に定義し、機微値は共有しないでください。
- `compose.yaml` の MongoDB はデフォルト資格情報を持つため、本番環境では必ず強固なユーザーと TLS を設定してください。
- NextAuth の URL や OAuth クライアント情報は `process.env` で読み込み、ビルド時に欠けると失敗するので CI でのチェックを推奨します。
