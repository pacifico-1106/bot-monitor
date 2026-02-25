# Health Agent セットアップガイド

各マシンにヘルスエージェントをインストールして、監視ダッシュボードに情報を送信します。

## 1. 共通セットアップ

### 依存関係のインストール

```bash
pip install requests psutil
```

### 環境変数の設定

各マシンで以下の環境変数を設定してください：

```bash
export DASHBOARD_API_URL="https://your-vercel-app.vercel.app/api/health"
export HEALTH_API_KEY="your-secret-api-key"  # Vercel側と同じ値
export MACHINE_ID="machine-name"  # 各マシンごとに異なる値
```

**MACHINE_ID の値:**
- Mac mini #1 (Sales): `mac-mini-1`
- Mac mini #2 (Admin): `mac-mini-2`
- MacBook Air: `macbook-air`
- Oracle Cloud: `oracle-cloud`

## 2. Mac mini / MacBook Air セットアップ

### ヘルスエージェントの配置

```bash
# プロジェクトディレクトリに配置
cd ~/path/to/project
cp agents/health_agent_mac.py ~/health_agent.py
chmod +x ~/health_agent.py
```

### launchd でサービス化

```bash
# plist ファイルを配置
cp agents/templates/com.tokyo307.healthagent.plist ~/Library/LaunchAgents/

# plist を編集して環境変数を設定
nano ~/Library/LaunchAgents/com.tokyo307.healthagent.plist

# サービスを登録・起動
launchctl load ~/Library/LaunchAgents/com.tokyo307.healthagent.plist
launchctl start com.tokyo307.healthagent
```

### ステータス確認

```bash
# プロセス確認
ps aux | grep health_agent

# ログ確認
tail -f ~/Library/Logs/health_agent.log
```

## 3. Oracle Cloud セットアップ

### ヘルスエージェントの配置

```bash
# ディレクトリ作成
sudo mkdir -p /opt/health-agent
sudo cp agents/health_agent_oracle.py /opt/health-agent/health_agent.py
sudo chmod +x /opt/health-agent/health_agent.py
```

### systemd でサービス化

```bash
# サービスファイルを配置
sudo cp agents/templates/health-agent.service /etc/systemd/system/

# サービスファイルを編集して環境変数を設定
sudo nano /etc/systemd/system/health-agent.service

# サービスを有効化・起動
sudo systemctl daemon-reload
sudo systemctl enable health-agent.service
sudo systemctl start health-agent.service
```

### ステータス確認

```bash
# サービス状態確認
sudo systemctl status health-agent.service

# ログ確認
sudo journalctl -u health-agent.service -f
```

## 4. トラブルシューティング

### ダッシュボードに表示されない場合

1. **API Key の確認**
   - Vercel の環境変数 `HEALTH_API_KEY` と各マシンの環境変数が一致しているか確認

2. **URL の確認**
   - `DASHBOARD_API_URL` が正しい Vercel アプリの URL を指しているか確認
   - 末尾は `/api/health` になっているか確認

3. **ネットワーク確認**
   ```bash
   curl -X POST https://your-vercel-app.vercel.app/api/health \
     -H "Authorization: Bearer your-api-key" \
     -H "Content-Type: application/json" \
     -d '{"machine_id":"test","status":"online"}'
   ```

4. **プロセス確認**
   - ヘルスエージェントが起動しているか確認
   - Mac: `ps aux | grep health_agent`
   - Oracle Cloud: `sudo systemctl status health-agent`

### サービスの再起動

**Mac:**
```bash
launchctl stop com.tokyo307.healthagent
launchctl start com.tokyo307.healthagent
```

**Oracle Cloud:**
```bash
sudo systemctl restart health-agent.service
```

## 5. アンインストール

**Mac:**
```bash
launchctl stop com.tokyo307.healthagent
launchctl unload ~/Library/LaunchAgents/com.tokyo307.healthagent.plist
rm ~/Library/LaunchAgents/com.tokyo307.healthagent.plist
rm ~/health_agent.py
```

**Oracle Cloud:**
```bash
sudo systemctl stop health-agent.service
sudo systemctl disable health-agent.service
sudo rm /etc/systemd/system/health-agent.service
sudo rm -rf /opt/health-agent
sudo systemctl daemon-reload
```
