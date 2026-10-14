---
title: "服務可見性：發布規則前，先看清執行環境"
description: "在 Ordo Platform 裡可以檢視每個已註冊引擎的健康狀態、版本、延遲指標和規則同步情況，規則上線前先確認執行環境沒有問題。"
date: 2026-04-19
author: "Pama Lee"
tags: ["Platform", "可觀測性", "功能"]
lang: "zh-TW"
---

## 發布規則時看不到的部分

發布規則時，出問題的往往不是規則本身，而是你不知道規則會跑在哪個版本的引擎上，也不知道那台引擎現在是否正常。

開發環境測試通過，staging 也沒問題。到了生產環境，某台實例的 NATS 連線三分鐘前斷了，還在跑舊版規則，直到告警響了才有人發現。

服務可見性就是為這種情況做的。

---

## 能看到什麼

在 Platform 的「引擎」頁面，可以看到所有已註冊的 `ordo-server` 實例。每個實例顯示：

**基礎資訊**
- 實例名稱和註冊地址（`ORDO_SERVER_URL`）
- 註冊時間和上次心跳時間

**健康狀態**
- `healthy` / `degraded` / `unreachable` 三種狀態
- 心跳延遲（毫秒）
- 最近一次健康檢查的詳細結果

**規則同步狀態**
- 當前載入的規則版本 hash
- 和 Platform 上最新版本相比落後幾個版本
- 最近一次規則同步的時間

**效能指標**
- 最近 5 分鐘的 QPS
- P50 / P95 / P99 執行延遲
- 記憶體使用概覽

![引擎列表頁：展示所有已註冊的 ordo-server 實例及其線上狀態、版本和註冊時間](/images/blog/service-visibility-servers.png)

---

點某個實例的「Metrics」按鈕，可以檢視這台引擎暴露的 Prometheus 指標：

![實例 Metrics 面板：包含 ordo_rules_total、ordo_sync_events_applied_total、ordo_uptime_seconds 等指標](/images/blog/service-visibility-metrics.png)

---

## 工作原理

Platform 靠引擎的註冊和心跳來了解每台引擎的狀態。

`ordo-server` 啟動時向 `ORDO_PLATFORM_URL` 傳送註冊請求，帶上自己的地址、名稱和版本。之後每 10 秒發一次心跳，Platform 記錄每個實例最後一次活躍的時間。

規則同步走 NATS JetStream。發布規則時，Platform 向 `ordo.rules.*` 主題發訊息，訂閱了的引擎實例收到後熱更新規則，並在下一次心跳裡上報當前的規則 hash。

所以 Platform 能知道：
- 哪些實例已經拿到最新規則
- 哪些實例還在跑舊版本（可能是 NATS 連線出了問題，或者重啟慢了）
- 哪些實例已經失聯

---

## 發布前檢查

建議發布規則前確認三件事：

1. **目標實例都是 healthy**：有 degraded 的實例時發布，這台實例可能繼續跑舊規則
2. **實例版本一致**：如果部分實例還在上一個版本，這段時間裡新舊規則會同時生效
3. **心跳延遲正常**：心跳超時通常說明網路在抖動，或者實例負載太高

Platform 的發布介面已經帶了這項檢查。目標實例裡有不健康的節點時，確認彈窗會提示，並要你確認是否繼續。

---

## 多租戶

多租戶部署下，每個租戶發布規則只影響自己的引擎實例。服務可見性頁面按租戶分開顯示，管理員可以看到所有租戶的狀態。

---

## 開始使用

登入 Ordo Platform，進入「基礎設施 → 引擎」。如果列表是空的，說明 `ordo-server` 還沒有註冊成功，檢查 `ORDO_PLATFORM_URL` 和 `ORDO_SERVER_TOKEN` 是否配置正確。

遇到問題可以在 [GitHub Issues](https://github.com/Ordo-Engine/Ordo/issues) 回饋，或查閱[部署文件](https://docs.ordoengine.com)。
