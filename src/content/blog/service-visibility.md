---
title: "服务可见性：发布规则前，先看清运行环境"
description: "在 Ordo Platform 里可以查看每个已注册引擎的健康状态、版本、延迟指标和规则同步情况，规则上线前先确认运行环境没有问题。"
date: 2026-04-19
author: "Pama Lee"
tags: ["Platform", "可观测性", "功能"]
lang: "zh-CN"
---

## 发布规则时看不到的部分

发布规则时，出问题的往往不是规则本身，而是你不知道规则会跑在哪个版本的引擎上，也不知道那台引擎现在是否正常。

开发环境测试通过，staging 也没问题。到了生产环境，某台实例的 NATS 连接三分钟前断了，还在跑旧版规则，直到告警响了才有人发现。

服务可见性就是为这种情况做的。

---

## 能看到什么

在 Platform 的「引擎」页面，可以看到所有已注册的 `ordo-server` 实例。每个实例显示：

**基础信息**
- 实例名称和注册地址（`ORDO_SERVER_URL`）
- 注册时间和上次心跳时间

**健康状态**
- `healthy` / `degraded` / `unreachable` 三种状态
- 心跳延迟（毫秒）
- 最近一次健康检查的详细结果

**规则同步状态**
- 当前加载的规则版本 hash
- 和 Platform 上最新版本相比落后几个版本
- 最近一次规则同步的时间

**性能指标**
- 最近 5 分钟的 QPS
- P50 / P95 / P99 执行延迟
- 内存使用概览

![引擎列表页：展示所有已注册的 ordo-server 实例及其在线状态、版本和注册时间](/images/blog/service-visibility-servers.png)

---

点某个实例的「Metrics」按钮，可以查看这台引擎暴露的 Prometheus 指标：

![实例 Metrics 面板：包含 ordo_rules_total、ordo_sync_events_applied_total、ordo_uptime_seconds 等指标](/images/blog/service-visibility-metrics.png)

---

## 工作原理

Platform 靠引擎的注册和心跳来了解每台引擎的状态。

`ordo-server` 启动时向 `ORDO_PLATFORM_URL` 发送注册请求，带上自己的地址、名称和版本。之后每 10 秒发一次心跳，Platform 记录每个实例最后一次活跃的时间。

规则同步走 NATS JetStream。发布规则时，Platform 向 `ordo.rules.*` 主题发消息，订阅了的引擎实例收到后热更新规则，并在下一次心跳里上报当前的规则 hash。

所以 Platform 能知道：
- 哪些实例已经拿到最新规则
- 哪些实例还在跑旧版本（可能是 NATS 连接出了问题，或者重启慢了）
- 哪些实例已经失联

---

## 发布前检查

建议发布规则前确认三件事：

1. **目标实例都是 healthy**：有 degraded 的实例时发布，这台实例可能继续跑旧规则
2. **实例版本一致**：如果部分实例还在上一个版本，这段时间里新旧规则会同时生效
3. **心跳延迟正常**：心跳超时通常说明网络在抖动，或者实例负载太高

Platform 的发布界面已经带了这项检查。目标实例里有不健康的节点时，确认弹窗会提示，并要你确认是否继续。

---

## 多租户

多租户部署下，每个租户发布规则只影响自己的引擎实例。服务可见性页面按租户分开显示，管理员可以看到所有租户的状态。

---

## 开始使用

登录 Ordo Platform，进入「基础设施 → 引擎」。如果列表是空的，说明 `ordo-server` 还没有注册成功，检查 `ORDO_PLATFORM_URL` 和 `ORDO_SERVER_TOKEN` 是否配置正确。

遇到问题可以在 [GitHub Issues](https://github.com/Ordo-Engine/Ordo/issues) 反馈，或查阅[部署文档](https://docs.ordoengine.com)。
