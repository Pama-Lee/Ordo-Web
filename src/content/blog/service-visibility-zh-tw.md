---
title: "服務可見性：發布規則前，先看清執行環境"
description: "Ordo Platform 的服務可見性功能讓你直接在 Studio 裡查看所有已註冊引擎的健康狀態、版本、延遲指標和規則同步情況，在規則上線前確認執行環境一切正常。"
date: 2026-04-19
author: "Pama Lee"
tags: ["Platform", "可觀測性", "功能"]
lang: "zh-TW"
---

## 規則發布的盲點

規則引擎的發布風險通常不在規則本身，而在於**你不知道規則會跑在哪個版本的引擎上、那個引擎此刻是否健康**。

開發環境測試通過、staging 環境一切正常——但到了生產環境，某台引擎實例還在跑舊版規則，或者某個節點的 NATS 連線已經中斷三分鐘，你渾然不知，直到告警來了才開始排查。

Ordo 的服務可見性功能就是為了堵這個漏洞。

---

## 你能看到什麼？

在 Platform 的「引擎」頁面，你會看到所有已註冊的 `ordo-server` 實例，每個實例顯示：

**基本資訊**
- 實例名稱和註冊地址（`ORDO_SERVER_URL`）
- 註冊時間和上次心跳時間

**健康狀態**
- `healthy` / `degraded` / `unreachable` 三種狀態
- 心跳延遲（毫秒級）
- 最近一次健康檢查的詳細結果

**規則同步狀態**
- 目前載入的規則版本 hash
- 與 Platform 最新版本的差異
- 最近一次規則同步的時間戳

**效能指標**
- 最近 5 分鐘的 QPS
- P50 / P95 / P99 執行延遲
- 記憶體和 goroutine 使用概覽

![引擎列表頁：展示所有已註冊的 ordo-server 實例及其線上狀態、版本和註冊時間](/images/blog/service-visibility-servers.png)

點擊單個實例的「Metrics」按鈕，可以直接查看該引擎暴露的 Prometheus 指標明細：

![實例 Metrics 面板：包含 ordo_rules_total、ordo_sync_events_applied_total、ordo_uptime_seconds 等核心指標](/images/blog/service-visibility-metrics.png)

---

## 運作原理

每個 `ordo-server` 啟動時，會向 `ORDO_PLATFORM_URL` 發送註冊請求，之後每 10 秒發送一次心跳。規則同步透過 NATS JetStream 完成——Platform 在規則發布時向 `ordo.rules.*` 主題發送訊息，所有訂閱的引擎實例接收後執行熱更新，並在下一次心跳時上報當前規則 hash。

---

## 發布前檢查清單

1. **所有目標實例處於 healthy 狀態** — 有 degraded 實例時發布，該實例可能繼續執行舊規則
2. **實例版本一致** — 避免新舊規則在短暫窗口期並存造成行為不一致
3. **心跳延遲正常** — 心跳超時通常是網路抖動或實例負載過高的先兆

Platform 的發布介面整合了這個檢查，有不健康節點時會明確提示並要求確認。

---

## 開始使用

登入 Ordo Platform，導覽到「基礎設施 → 引擎」。如果列表為空，請確認 `ORDO_PLATFORM_URL` 和 `ORDO_SERVER_TOKEN` 設定正確。

遇到問題可在 [GitHub Issues](https://github.com/Ordo-Engine/Ordo/issues) 回饋，或查閱 [部署文件](https://docs.ordoengine.com)。
