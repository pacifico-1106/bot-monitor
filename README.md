# Tokyo307 Bot Monitor

Tokyo307inc AI System の統合監視ダッシュボード

## システム構成

- **Mac mini #1 (Sales)** - OpenClaw/Telegram
- **Mac mini #2 (Admin)** - OpenClaw/Telegram  
- **MacBook Air** - OpenClaw/Telegram
- **Oracle Cloud** - Discord Bot (Sales & Admin)

## 機能

- ✅ リアルタイム稼働監視（10秒ごと更新）
- ✅ CPU/メモリ/ディスク使用率
- ✅ Bot稼働状態（OpenClaw, Discord Bots）
- ✅ エラーログ集約表示
- ✅ オフライン自動検知（5分以上更新なし）

## Vercel 環境変数設定

Vercel ダッシュボードで以下の環境変数を設定してください：

```
HEALTH_API_KEY=your-secret-api-key-here
```

## デプロイ

```bash
# Vercel でデプロイ
vercel --prod
```

## ヘルスエージェントのセットアップ

各マシンにヘルスエージェントをインストールしてください。

詳細は `/agents` ディレクトリを参照。

## ライセンス

Private - Tokyo307inc
