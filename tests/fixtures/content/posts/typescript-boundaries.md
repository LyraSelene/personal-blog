---
title: '用 TypeScript 描述输入边界'
description: '类型检查和运行时校验各自解决什么问题？用一份配置文件梳理两者的边界。'
pubDate: 2026-10-03
category: '前端开发'
tags: ['TypeScript', '编程基础']
draft: false
example: true
---
这是一篇用于演示分页和分类的示例文章。

## 编译期的类型信息

TypeScript 可以检查代码内部的约束。类型信息不会自动验证来自网络或文件的所有数据。

## 运行时的数据检查

对于外部输入，需要显式检查结构、范围和可选值。博客的内容 schema 就是一种运行时验证。

```ts
type Config = { title: string; limit?: number };
function readLimit(config: Config) {
  return config.limit ?? 10;
}
```

## 可选值的默认行为

为没有提供封面、源码或演示地址的内容定义清楚的降级方式，能让页面更容易维护。
