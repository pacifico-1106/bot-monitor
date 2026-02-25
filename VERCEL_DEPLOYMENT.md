# Vercel デプロイガイド

Bot Monitor を Vercel にデプロイする手順です。

## 1. Vercel アカウント準備

1. https://vercel.com/ でアカウント作成（GitHub 連携推奨）
2. Vercel CLI のインストール（オプション）:
   ```bash
   npm install -g vercel
   ```

## 2. GitHub リポジトリを Vercel に接続

### Web UI から（推奨）

1. Vercel ダッシュボードにログイン: https://vercel.com/dashboard
2. **New Project** をクリック
3. **Import Git Repository** で `pacifico-1106/bot-monitor` を選択
4. **Import** をクリック

### プロジェクト設定

- **Framework Preset**: Next.js (自動検出されます)
- **Root Directory**: `.` (デフォルト)
- **Build Command**: `npm run build` (デフォルト)
- **Output Directory**: `.next` (デフォルト)

## 3. 環境変数の設定（重要）

デプロイ前に必ず環境変数を設定してください。

### Vercel ダッシュボードで設定

1. Project Settings > Environment Variables に移動
2. 以下の環境変数を追加:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `HEALTH_API_KEY` | ランダムな32文字以上の文字列 | Production, Preview, Development |

### API Key の生成方法

```bash
# Mac/Linux の場合
openssl rand -hex 32

# 出力例
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0
```

この生成された文字列を `HEALTH_API_KEY` として設定します。

**重要**: この API Key は各マシンのヘルスエージェントでも同じ値を設定する必要があります。

## 4. デプロイ実行

### Web UI から

環境変数を設定したら、**Deploy** ボタンをクリックします。

### CLI から

```bash
cd /path/to/bot-monitor
vercel --prod
```

初回デプロイ時は対話的にプロジェクト設定を求められます。

## 5. デプロイ後の確認

1. デプロイが完了すると URL が発行されます（例: `https://bot-monitor-xxx.vercel.app`）
2. ブラウザでアクセスして `/dashboard` が表示されることを確認
3. 初期状態ではマシン情報は表示されません（ヘルスエージェントからのデータ送信が必要）

## 6. ヘルスエージェントの設定

各マシンで環境変数を設定します。

### Mac mini / MacBook Air

`.zshrc` または `.bash_profile` に追加:

```bash
export DASHBOARD_API_URL="https://bot-monitor-xxx.vercel.app/api/health"
export HEALTH_API_KEY="<Vercel で設定した API Key>"
export MACHINE_ID="mac-mini-1"  # 各マシンで異なる値
```

### Oracle Cloud

systemd サービスファイルを編集:

```bash
sudo nano /etc/systemd/system/health-agent.service
```

Environment セクションを更新:

```ini
Environment="DASHBOARD_API_URL=https://bot-monitor-xxx.vercel.app/api/health"
Environment="HEALTH_API_KEY=<Vercel で設定した API Key>"
Environment="MACHINE_ID=oracle-cloud"
```

サービスを再起動:

```bash
sudo systemctl daemon-reload
sudo systemctl restart health-agent.service
```

## 7. 動作確認

### ヘルスエージェントのテスト

各マシンで手動テスト:

```bash
curl -X POST https://bot-monitor-xxx.vercel.app/api/health \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": "test-machine",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
    "status": "online",
    "system": {
      "cpu_percent": 10.5,
      "memory_percent": 45.2,
      "disk_percent": 30.8,
      "platform": "Test Platform"
    }
  }'
```

成功した場合: `{"success":true}`

### ダッシュボードで確認

1. https://bot-monitor-xxx.vercel.app/dashboard にアクセス
2. 送信したテストデータが表示されることを確認
3. 各マシンのヘルスエージェントが起動すると、リアルタイムでデータが更新されます

## 8. カスタムドメインの設定（オプション）

1. Vercel Project Settings > Domains に移動
2. カスタムドメインを追加（例: `monitor.tokyo307.com`）
3. DNS レコードを設定（Vercel が指示を表示します）

## 9. トラブルシューティング

### デプロイが失敗する

- **Node.js バージョン**: Vercel は自動で最新 LTS を使用します
- **ビルドログを確認**: Vercel ダッシュボードの Deployments > Details でログを確認

### データが表示されない

1. **環境変数を確認**: Vercel と各マシンで `HEALTH_API_KEY` が一致しているか
2. **URL を確認**: `DASHBOARD_API_URL` が正しい Vercel URL を指しているか
3. **ヘルスエージェントのログを確認**:
   - Mac: `tail -f ~/Library/Logs/health_agent.log`
   - Oracle Cloud: `sudo journalctl -u health-agent.service -f`

### 401 Unauthorized エラー

- API Key が一致していません
- Vercel の環境変数と各マシンの環境変数を再確認してください

### マシンがオフライン表示される

- 5分以上データが送信されていない場合、自動的にオフライン表示されます
- ヘルスエージェントが起動しているか確認してください

## 10. 本番運用の推奨事項

### セキュリティ

- ✅ API Key は必ず Vercel の環境変数で管理（GitHub には含めない）
- ✅ 定期的に API Key をローテーション
- ✅ Vercel の Access Control を設定して不正アクセスを防ぐ

### スケーラビリティ

現在は In-Memory Storage (Map) を使用していますが、本番環境では以下を推奨:

- **Vercel KV** (Redis): 複数インスタンス間でデータ共有
- **Vercel Postgres**: 履歴データの永続化

### モニタリング

- Vercel Analytics で応答時間を監視
- Vercel Logs でエラーを確認
- 各マシンのヘルスエージェントログを定期的にチェック

## 参考リンク

- Vercel 公式ドキュメント: https://vercel.com/docs
- Next.js デプロイガイド: https://nextjs.org/docs/deployment
- Vercel CLI リファレンス: https://vercel.com/docs/cli
