# 開発プロジェクト管理アプリ

複数の Node プロジェクト管理する web アプリ

## 機能概要

- **プロジェクト管理**: ローカルにある複数のプロジェクトを一覧表示。
- **ワンクリック起動**: `yarn dev` や `npm run dev` などのコマンドをボタン一つで実行。
- **ログビューア**: 各プロジェクトの実行ログをリアルタイムで確認可能。
- **Git 連携**: 現在のチェックアウトされているブランチ名を表示。
- **設定**: `projects.json` による管理プロジェクトの設定。

## 技術スタック

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Framework**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI / shadcn/ui
- **Icons**: Lucide React
- **State Management**: Jotai
- **Validation**: Zod, React Hook Form

## セットアップと使い方

### 1. リポジトリのクローンと依存関係のインストール

```bash
yarn install
```

### 2. 設定ファイルの作成

`projects.json.example` をコピーして `projects.json` を作成

```bash
cp projects.json.example projects.json
```

### 3. プロジェクトの登録

`projects.json` を編集し、管理したいプロジェクトの情報を追加します。

**設定項目:**

- `name`: （内部識別用 ID として使用されます。一意な名前を推奨）
- `path`: プロジェクトのルートディレクトリへの絶対パス
- `startCommand`: 起動コマンド（例: `yarn dev`, `npm run dev`）。省略時は `yarn dev` が使用されます。
- `displayName`: ダッシュボード上に表示する名前。省略時はディレクトリ名などが使用されます。

**例:**

```json
[
  {
    "name": "my-project",
    "path": "/Users/username/WorkSpace/my-project",
    "startCommand": "yarn dev",
    "displayName": "My Main Project"
  }
]
```

### 4. アプリケーションの起動

```bash
yarn dev
```

ブラウザで `http://localhost:3000` にアクセスするとダッシュボードが表示されます。

---

Created by Gemini 3 Pro.
