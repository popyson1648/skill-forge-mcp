# skill-forge-mcp

[![npm version](https://img.shields.io/npm/v/skill-forge-mcp.svg)](https://www.npmjs.com/package/skill-forge-mcp)
[![CI](https://github.com/popyson1648/skill-forge-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/popyson1648/skill-forge-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[English](README.md)

[Agent Skill](https://github.com/anthropics/skills) の作成手順書（9 フェーズ）を MCP リソースとして提供するサーバーです。
AI エージェントが必要なフェーズだけをオンデマンドで取得し、手順に沿って SKILL.md を作成できます。

## Quick Start

**Claude Code:**

```bash
claude mcp add skill-forge-mcp -- npx skill-forge-mcp
```

**Gemini CLI:**

```bash
gemini mcp add skill-forge-mcp -- npx skill-forge-mcp
```

**VS Code (GitHub Copilot)** — `.vscode/mcp.json`:

```json
{
  "servers": {
    "skill-forge-mcp": {
      "command": "npx",
      "args": ["skill-forge-mcp"]
    }
  }
}
```

**Cursor:**

```json
{
  "skill-forge-mcp": {
    "command": "npx",
    "args": ["skill-forge-mcp"]
  }
}
```

<details>
<summary>Claude Desktop</summary>

```json
{
  "mcpServers": {
    "skill-forge-mcp": {
      "command": "npx",
      "args": ["skill-forge-mcp"]
    }
  }
}
```

</details>

## 使い方

エージェントに依頼:

> 「React コンポーネント設計のスキルを作りたい。skill-forge-mcp のプロセスに従って進めて。」

エージェントは自動的に:

1. `process://manifest` から全体構造を取得
2. `process://phase/1` で Phase 1 を読み、ベースライン測定を実施
3. `mark_progress` で進捗を記録しながら各フェーズを順に進行
4. Phase 6 のガイドラインに従い SKILL.md を生成

`search_process` でキーワード横断検索も可能。

## 9 フェーズの概要

| Phase | 名前 | 目的 |
|-------|------|------|
| 0 | スキル仕様の理解 | SKILL.md の構造と frontmatter の把握 |
| 1 | スコーピングとベースライン | 失敗パターンの測定、調査範囲の決定 |
| 2 | 対象ドメインの基礎調査 | 判断基準と理論的基盤の確立 |
| 3 | ギャップ分析 | 調査結果だけでエージェントが動けるか検証 |
| 4 | 実装レベルの深掘り調査 | コード例・アンチパターン・検証手法でギャップ補完 |
| 5 | 構造化と完全性チェック | 全カテゴリの網羅性を確認 |
| 6 | SKILL.md への蒸留 | ≤500 行に凝縮、トークン効率の最大化 |
| 7 | デプロイとバリデーション | 配置・仕様準拠の検証・セキュリティ確認 |
| 8 | 評価と反復 | ベースラインとの比較、改善サイクル |

## Features

- **段階的アクセス** — フェーズ単位・セクション単位で必要な部分だけを取得
- **横断検索** — 全 9 フェーズをキーワードで一括検索
- **進捗管理** — フェーズごとの完了状態を記録・参照
- **プロンプトテンプレート** — `create_skill` / `resume_skill` でガイド付きワークフローを提供
- **構造化出力** — 全ツールに `outputSchema` + `structuredContent` を搭載
- **多言語対応** — `SKILL_FORGE_LANG=ja` で日本語コンテンツを配信
- **状態永続化** — セッション間の進捗をオプションで保持
- **低コスト** — コンテキストウィンドウへの固定コストは約 1,500 トークン

## API

### Resources

| URI | 内容 |
|-----|------|
| `process://manifest` | 全体インデックス（JSON） |
| `process://phase/0` – `process://phase/8` | Phase 0–8 の本文 |

### Resource Templates

| テンプレート | 説明 |
|-------------|------|
| `process://phase/{phaseId}/section/{sectionName}` | セクション単位で取得 |
| `process://phases/{+phaseIds}` | 複数フェーズを一括取得（例: `1,2,3`） |

### Tools

| ツール | 説明 | 入力例 |
|--------|------|--------|
| `search_process` | 全フェーズ横断キーワード検索 | `{ "query": "frontmatter", "maxResults": 5 }` |
| `mark_progress` | フェーズの進捗を記録 | `{ "phaseId": 1, "status": "in-progress" }` |
| `get_status` | 全フェーズの進捗サマリー | `{}` |

`status`: `"not-started"` · `"in-progress"` · `"completed"`

### Prompts

| プロンプト | 説明 |
|-----------|------|
| `create_skill` | Phase 0→8 のガイド付きワークフロー。`topic` 引数でスキルのテーマを指定。 |
| `resume_skill` | 現在の進捗を確認し、中断箇所から再開。 |

## Configuration

`SKILL_FORGE_PERSIST=true` で進捗を `~/.skill-forge-mcp/state.json` に永続化:

```json
{
  "mcpServers": {
    "skill-forge-mcp": {
      "command": "npx",
      "args": ["skill-forge-mcp"],
      "env": { "SKILL_FORGE_PERSIST": "true" }
    }
  }
}
```

`SKILL_FORGE_LANG=ja` で日本語コンテンツを配信:

```json
{
  "mcpServers": {
    "skill-forge-mcp": {
      "command": "npx",
      "args": ["skill-forge-mcp"],
      "env": { "SKILL_FORGE_LANG": "ja" }
    }
  }
}
```

## Development

```bash
git clone https://github.com/popyson1648/skill-forge-mcp.git
cd skill-forge-mcp
npm install
npm run build
npm test          # 52 tests
```

<details>
<summary>プロジェクト構成</summary>

```
src/
├── index.ts        # エントリーポイント
├── content.ts      # コンテンツ読み込み・セクション抽出
├── search.ts       # 横断検索
├── state.ts        # 状態管理・永続化
├── status.ts       # ステータステーブル
├── content/        # 英語コンテンツ（配信用）
└── content-ja/     # 日本語オリジナル
tests/
├── content.test.ts
├── search.test.ts
├── state.test.ts
├── resources.test.ts
└── tools.test.ts
```

</details>

**要件:** Node.js >= 18

## Contributing

コントリビューション歓迎です！ [Issue](https://github.com/popyson1648/skill-forge-mcp/issues) の作成や Pull Request の提出はお気軽にどうぞ。

## License

MIT
