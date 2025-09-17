# Implementation Plan

- [ ] 1. プロジェクトセットアップと基本構成
  - `npx create-next-app@latest`でNext.js 15プロジェクトを初期化（TypeScript、Tailwind CSS、App Routerを選択）
  - 必要なパッケージのインストール（`npm install next-auth @auth/mongodb-adapter @mastra/core @mastra/openai @ai-sdk/react mongodb lucide-react`）
  - Next.js設定ファイル（next.config.ts）の更新
  - _Requirements: 4.1, 4.2_

- [ ] 2. Docker環境とMongoDBセットアップ
  - docker-compose.ymlファイルの作成
  - `docker-compose up -d`でMongoDBコンテナの起動
  - MongoDB接続クライアント（lib/mongodb.ts）の実装
  - 接続テストの実行
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 3. Auth.js認証システムの実装
- [ ] 3.1 Auth.js分割設定パターンの実装
  - `npx auth secret`でAUTH_SECRETの生成
  - auth.config.tsファイルの作成（Edge互換設定）
  - auth.tsファイルの作成（MongoDBアダプター統合）
  - 環境変数ファイル（.env.local）の設定
  - _Requirements: 1.1, 1.2_

- [ ] 3.2 認証ミドルウェアとルートハンドラーの実装
  - middleware.tsファイルの作成（Edge互換）
  - API認証ルートハンドラーの作成
  - 認証フローのテストとデバッグ
  - _Requirements: 1.1, 1.3, 1.4_

- [ ] 4. Mastraエージェントと現在時刻ツールの実装
- [ ] 4.1 現在時刻取得ツールの作成
  - CurrentTimeToolクラスの実装
  - 日本語フォーマットとタイムゾーン対応
  - ツールの単体テスト作成
  - _Requirements: 2.5_

- [ ] 4.2 Mastraエージェントの設定と統合
  - Mastraインスタンスの設定（OpenAI + カスタムツール）
  - エージェントの指示文とモデル設定
  - エージェント機能のテスト
  - _Requirements: 2.1, 2.5_

- [ ] 5. チャットAPIルートの実装
- [ ] 5.1 ストリーミングチャットAPIの作成
  - /api/chatルートの実装
  - 認証チェックとセッション管理
  - MastraエージェントとAI SDKの統合
  - _Requirements: 2.1, 2.2_

- [ ] 5.2 チャット履歴データベース操作の実装
  - ChatMessageモデルとスキーマの定義
  - saveChatMessage関数の実装
  - getChatHistory関数の実装
  - データベース操作のテスト
  - _Requirements: 3.1, 3.4_

- [ ] 6. フロントエンドチャットインターフェースの実装
- [ ] 6.1 基本チャットコンポーネントの作成
  - ChatInterfaceコンポーネントの実装
  - AI SDK useChat フックの統合
  - メッセージ表示とフォーム処理
  - _Requirements: 2.1, 2.4_

- [ ] 6.2 Tailwind CSSデザインの適用
  - モダンなUIデザインの実装
  - レスポンシブレイアウトの作成
  - アニメーションとインタラクション効果
  - アイコンとビジュアル要素の追加
  - _Requirements: 2.4_

- [ ] 7. セッションプロバイダーとレイアウトの実装
- [ ] 7.1 認証プロバイダーの設定
  - SessionProviderコンポーネントの作成
  - ルートレイアウトでのプロバイダー統合
  - クライアントサイド認証状態管理
  - _Requirements: 1.1_

- [ ] 7.2 認証ページとナビゲーションの実装
  - サインインページの作成
  - 認証状態に基づくページ表示制御
  - サインアウト機能の実装
  - _Requirements: 1.1, 1.4_

- [ ] 8. エラーハンドリングとテストの実装
- [ ] 8.1 包括的エラーハンドリングの実装
  - APIエラークラスとハンドラーの作成
  - クライアントサイドエラーハンドリング
  - エラー表示UIコンポーネント
  - _Requirements: 全般_

- [ ] 8.2 基本テストスイートの作成
  - 認証フローのテスト
  - チャットAPI機能のテスト
  - Mastraツール機能のテスト
  - エンドツーエンドチャットフローのテスト
  - _Requirements: 全般_

- [ ] 9. 統合テストと最終調整
- [ ] 9.1 全機能統合テスト
  - 認証からチャットまでの完全フロー確認
  - ストリーミング機能の動作確認
  - 現在時刻ツールの動作確認
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [ ] 9.2 パフォーマンス最適化と仕上げ
  - チャット履歴の効率的な読み込み
  - UIの最終調整とポリッシュ
  - 環境変数とデプロイメント準備
  - _Requirements: 3.2, 3.3_