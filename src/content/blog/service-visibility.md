---
title: "服务可见性：发布规则前，先看清运行环境"
description: "Ordo Platform 的服务可见性功能让你直接在 Studio 里查看所有已注册引擎的健康状态、版本、延迟指标和规则同步情况，在规则上线前确认运行环境一切正常。"
date: 2026-04-19
author: "Pama Lee"
tags: ["Platform", "可观测性", "功能"]
lang: "zh-CN"
---

## 规则发布的盲点

规则引擎的发布风险通常不在规则本身，而在于**你不知道规则会跑在哪个版本的引擎上、那个引擎此刻是否健康**。

开发环境测试通过、staging 环境一切正常——但到了生产环境，某台引擎实例还在跑旧版规则，或者某个节点的 NATS 连接已经断了三分钟，你浑然不知，直到告警来了才开始排查。

Ordo 的服务可见性功能就是为了堵这个漏洞。

---

## 你能看到什么？

在 Platform 的「引擎」页面，你会看到所有已注册的 `ordo-server` 实例，每个实例显示：

**基础信息**
- 实例名称和注册地址（`ORDO_SERVER_URL`）
- 注册时间和上次心跳时间

**健康状态**
- `healthy` / `degraded` / `unreachable` 三种状态
- 心跳延迟（毫秒级）
- 最近一次健康检查的详细结果

**规则同步状态**
- 当前加载的规则版本 hash
- 与 Platform 最新版本的差异（是否落后几个版本）
- 最近一次规则同步的时间戳

**性能指标**
- 最近 5 分钟的 QPS
- P50 / P95 / P99 执行延迟
- 内存和 goroutine 使用概览

![引擎列表页：展示所有已注册的 ordo-server 实例及其在线状态、版本和注册时间](/images/blog/service-visibility-servers.png)

---

点击单个实例的「Metrics」按钮，可以直接查看该引擎暴露的 Prometheus 指标明细：

![实例 Metrics 面板：包含 ordo_rules_total、ordo_sync_events_applied_total、ordo_uptime_seconds 等核心指标](/images/blog/service-visibility-metrics.png)

---

## 架构背后的工作原理

Ordo 的引擎注册和心跳机制是 Platform 感知引擎状态的核心。

每个 `ordo-server` 启动时，会向 `ORDO_PLATFORM_URL` 发送注册请求，携带自身地址、名称、版本信息。之后每 10 秒发送一次心跳，Platform 侧维护每个实例的最后活跃时间。

规则同步通过 NATS JetStream 完成。Platform 在规则发布时向 `ordo.rules.*` 主题发送消息，所有订阅的引擎实例接收后执行热更新，并在下一次心跳时上报当前规则 hash。

这个架构让 Platform 能精确知道：
- 哪些实例已经收到了最新规则
- 哪些实例还在运行旧版本（可能因为 NATS 连接问题或重启延迟）
- 哪些实例已经失联

---

## 发布前检查清单

Ordo 建议在规则发布前确认：

1. **所有目标实例处于 healthy 状态** — 有 degraded 实例时发布，该实例可能继续运行旧规则
2. **实例版本一致** — 如果部分实例还在跑上一个版本，新规则行为可能在这段窗口期不一致
3. **心跳延迟正常** — 心跳超时通常是网络抖动或实例负载过高的先兆

Platform 的发布界面集成了这个检查：如果你的目标实例中有不健康的节点，系统会在确认弹窗里明确提示，并要求你确认是否继续。

---

## 多租户下的隔离

在多租户部署场景下，每个租户的规则发布只影响该租户的引擎实例。服务可见性页面会按租户隔离显示，管理员视图可以看到跨租户的全局状态。

---

## 从这里开始

登录 Ordo Platform，导航到「基础设施 → 引擎」。如果你的引擎列表为空，说明 `ordo-server` 还没有完成注册——检查 `ORDO_PLATFORM_URL` 和 `ORDO_SERVER_TOKEN` 配置是否正确。

遇到问题可以在 [GitHub Issues](https://github.com/Ordo-Engine/Ordo/issues) 反馈，或查阅 [部署文档](https://docs.ordoengine.com)。
