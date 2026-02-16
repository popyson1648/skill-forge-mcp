## Phase 0: スキル仕様の理解（初回のみ）

全スキル共通の仕様。一度把握すれば以降は参照するだけでよい。

### SKILL.md の構造

```
skill-name/
├── SKILL.md          # 必須: メイン指示
├── scripts/          # オプション: 実行可能コード
├── references/       # オプション: 追加ドキュメント
└── assets/           # オプション: テンプレート、リソース
```

### Frontmatter（必須ヘッダー）

```yaml
---
name: skill-name              # 必須: 1-64文字、小文字英数字+ハイフン
description: What and when     # 必須: 1-1024文字
argument-hint: "[file] [opts]" # オプション
user-invokable: true           # オプション（デフォルト true）
disable-model-invocation: false # オプション（デフォルト false）
allowed-tools: Read, Grep      # オプション（実験的）
license: Apache-2.0            # オプション
compatibility: Requires git    # オプション: 1-500文字
metadata:                      # オプション: 任意のキーバリュー
  author: example-org
  version: "1.0"
# --- Claude Code 固有フィールド ---
context: fork                  # オプション: サブエージェント実行
agent: Explore                 # オプション: context: fork 時のエージェント種別
model: claude-sonnet           # オプション: スキルごとのモデル指定
hooks: ...                     # オプション: ライフサイクルフック
---
```

**name ルール**:
- 小文字英数字+ハイフンのみ。動名詞推奨（例: `processing-pdfs`）
- `-` で開始・終了不可、連続ハイフン (`--`) 不可
- XMLタグを含めてはならない
- 予約語 `anthropic`, `claude` を含めてはならない
- 親ディレクトリ名と一致させる

**description ルール**:
- XMLタグを含めてはならない
- 三人称で記述（× "I can help" / × "You can use" / ✅ "Processes files and generates..."）
- 「何をするか」+「いつ使うか」の両方を含める
- エージェントが選択に使うキー用語を含める

### Progressive Disclosure（3レベルのロード）

| レベル | ロードタイミング | 内容 | 予算 |
|--------|---------------|------|------|
| L1: 発見 | 起動時（常時） | `name` + `description` のみ | ~100 トークン |
| L2: 指示 | タスクが description にマッチ時 | SKILL.md 本文 | < 5000 トークン推奨 |
| L3: リソース | 本文内で参照された時 | scripts/, references/, assets/ | 必要最小限 |

→ SKILL.md 本文は **500行以下**。詳細は別ファイルに分離し、1レベルの参照に留める。

### スキルの種類

| 種類 | 用途 | 例 |
|------|------|-----|
| **Reference** | 知識・ルールの追加 | API慣習、コーディング規約 |
| **Task** | アクションの手順 | デプロイ、テスト実行 |

### 自由度の設定

| 自由度 | 使用場面 | 記述方法 |
|--------|---------|---------|
| **高** | 複数アプローチが有効 | テキスト指示 |
| **中** | 推奨パターンあり | 擬似コード・パラメータ付きスクリプト |
| **低** | 正確な手順が必須 | 具体的スクリプト |

> アナロジー: 「両側が崖の橋」→ 低自由度、「障害物のない野原」→ 高自由度

### 呼び出し制御

| 設定 | `/` メニュー | 自動ロード | 用途 |
|------|------------|-----------|------|
| デフォルト | ✅ | ✅ | 汎用スキル |
| `user-invokable: false` | ❌ | ✅ | バックグラウンド知識 |
| `disable-model-invocation: true` | ✅ | ❌ | オンデマンド専用 |

### Claude Code 固有の高度な機能

| 機能 | 構文/フィールド | 用途 |
|------|---------------|------|
| **引数の受け取り** | `$ARGUMENTS`, `$0`, `$1` | `/skill arg1 arg2` で引数を渡す |
| **動的コンテキスト注入** | `` !`command` `` | 実行時のシェル出力をスキルに注入 |
| **サブエージェント実行** | `context: fork` | 隔離環境で実行（探索型タスク） |
| **Extended Thinking** | 本文に `ultrathink` を含める | 複雑な推論が必要な場面 |
| **ツール制限** | `allowed-tools: Read, Grep` | 安全性の確保 |
| **モデル指定** | `model: claude-sonnet` | コスト/品質のトレードオフ |
| **セッションID** | `${CLAUDE_SESSION_ID}` | ログやセッション固有ファイルの生成 |

> **注意**: これらは Claude Code 固有。使用するとVS Code Copilot, Cursor等でのポータビリティが下がる。

---

