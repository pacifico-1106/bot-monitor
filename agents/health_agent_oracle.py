"""
Tokyo307 Health Agent for Oracle Cloud
Discord Bots (Sales & Admin) 監視用ヘルスチェックエージェント
"""
import requests
import psutil
import platform
import time
import os
from datetime import datetime

# 環境変数から設定読み込み
DASHBOARD_API = os.getenv("DASHBOARD_API_URL", "https://your-vercel-app.vercel.app/api/health")
MACHINE_ID = os.getenv("MACHINE_ID", "oracle-cloud")
API_KEY = os.getenv("HEALTH_API_KEY")

def get_system_info():
    """システム情報を取得"""
    return {
        "machine_id": MACHINE_ID,
        "timestamp": datetime.utcnow().isoformat(),
        "status": "online",
        "system": {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent,
            "platform": platform.platform(),
        },
        "bots": {
            "sales": check_bot_status("sales"),
            "admin": check_bot_status("admin"),
        },
        "errors": check_recent_errors(),
    }

def check_bot_status(bot_name):
    """Discord Bot が起動しているか確認"""
    for proc in psutil.process_iter(['name', 'cmdline']):
        try:
            cmdline = ' '.join(proc.info['cmdline'] or [])
            if f'{bot_name}_bot.py' in cmdline:
                return {
                    "running": True,
                    "status": "✓ Running"
                }
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    return {
        "running": False,
        "status": "✗ Stopped"
    }

def check_recent_errors():
    """最近のエラーログをチェック"""
    errors = []

    # Discord Bot ログファイル確認
    log_paths = [
        os.path.expanduser("~/discord-bots/logs/sales_bot.log"),
        os.path.expanduser("~/discord-bots/logs/admin_bot.log"),
    ]

    for log_path in log_paths:
        if os.path.exists(log_path):
            try:
                with open(log_path, 'r') as f:
                    lines = f.readlines()[-100:]
                    for line in lines:
                        if 'ERROR' in line or 'CRITICAL' in line or 'Exception' in line:
                            errors.append(line.strip())
            except Exception:
                pass

    return errors[-5:]  # 最新5件のみ

def send_heartbeat():
    """ダッシュボードにヘルスデータを送信"""
    try:
        data = get_system_info()
        response = requests.post(
            DASHBOARD_API,
            json=data,
            headers={"Authorization": f"Bearer {API_KEY}"},
            timeout=10
        )
        print(f"✅ Heartbeat sent: {response.status_code}")
    except Exception as e:
        print(f"❌ Heartbeat failed: {e}")

if __name__ == "__main__":
    print(f"🚀 Health Agent started for {MACHINE_ID}")
    print(f"📡 Sending to: {DASHBOARD_API}")

    while True:
        send_heartbeat()
        time.sleep(60)  # 1分ごとに送信
