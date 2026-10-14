---
title: "Why Use a Rule Engine"
description: "When business rules are spread across the codebase, changing a discount means shipping a release. Moving decision logic out of application code removes that step."
date: 2026-04-10
author: "Pama Lee"
tags: ["Engineering", "Architecture", "Rule Engine"]
lang: "en"
---

## The problem

Many teams run into these:

- Changing a discount rule takes a PR, a code review, a release and a deployment
- Risk policies are split across three microservices, and nobody can describe the full logic
- A product manager wants to see the approval workflow that is live right now, and there is no place to look it up

The cause is the same each time: business decision logic is mixed in with application code.

## The approach

A rule engine separates "what to decide" from "how the decision is executed".

In Ordo, decision logic is written in JSON or YAML, executed through an API, and the result is returned to the caller. Changing the logic does not require redeploying your application.

## What Ordo offers

1. Speed: built on Rust and Cranelift JIT, a single execution takes under a microsecond
2. Visual editing: people who don't write code can read and edit rules in Studio
3. Version control, audit logs and rollback
4. Several ways to call it: HTTP, gRPC, WASM and CLI

If managing business rules is a problem for your team, give Ordo a try.
