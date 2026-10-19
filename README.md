# Lyra的博客

Astro、TypeScript、Markdown/MDX、Tailwind CSS v4 和 Pagefind 构成的静态个人网站，配有独立的本机内容控制台。公开站点不需要数据库、登录或运行时服务器。首页保留个人介绍、用户提供的丰川祥子图片与少量入口；文章、项目、相册、音乐和说说分别展示。

正式内容目录目前留空。格式示例只位于 `tests/fixtures/`，普通构建不会发布这些内容。RSS 已按要求移除。

## 安装与启动

推荐 Node.js 24 LTS、npm。

```sh
npm ci
npm run dev
```

前台预览默认在 http://127.0.0.1:4321/ 。另开终端启动控制台：

```sh
npm run admin
```

打开 http://127.0.0.1:4545/ 。Windows 也可双击 `scripts/launch-admin.cmd`。控制台仅监听本机，关闭终端即停止，不会进入 `dist/`，不能在 GitHub Pages 上运行。前台预览需单独保持运行。

```sh
npm run check
npm run build
npm run preview
```

构建会做类型检查、静态生成、子路径处理和全文搜索索引。搜索在生产构建后完整可用，开发模式没有新生成的索引。内容为空时，Astro 的空集合提示是预期行为。

## 使用本机控制台

1. 选择文章、项目、相册、音乐或说说，点击“新建”。文件名使用唯一的小写英文、数字与连字符，例如 `my-note.md`，它也决定内容 URL。
2. 填写元数据与 Markdown 正文；默认勾选“保存为草稿”。可以预览 Markdown；MDX 组件需要在前台验证。
3. 通过素材上传保存图片或音频，将返回路径复制到封面、照片或音频字段。支持 PNG/JPG/WebP/GIF、MP3/OGG/WAV/M4A，单文件最多 8MB。
4. 保存到本机，然后在前台查看。草稿不会生成公开页面；需要预览详情时可暂时取消草稿并保存，发布前再确认状态。
5. 在“发布”中先构建检查；点击“构建并发布到 GitHub”会构建、提交 `src/` 与 `public/` 的修改并推送 `main`。GitHub Actions 成功后更新网站，控制台会给出日志和部署记录入口。

“站点设置”可以修改名称、作者、简介、关于与社交链接。新增内容、站点设置与素材都保存在此项目文件夹。覆盖保存前的备份位于 `.local/backups/`；移除内容会放进 `.local/trash/对应栏目/`。恢复时将文件复制回原集合并去掉时间戳前缀。

控制台检查本机 Host、会话和写入请求来源，保存时校验 schema，并避免覆盖其他编辑器的新版本。它不提供多用户登录；不要将端口转发到公网。公开仓库中的草稿源文件仍可被他人读取，`draft` 只控制网站输出。

发布依赖本机 Git 的 GitHub 登录状态。遇到身份验证或推送失败，请按终端提示登录，检查远程仓库与网络后重试；不会自动强制覆盖远端。控制台发布目标为 `LyraSelene/personal-blog`，更换仓库时需同步修改服务脚本与部署配置。

## 文件组织

```text
src/config/profile.json     控制台可编辑的个人信息
src/config/site.ts          域名、导航、站点配置
src/config/visuals.ts       Logo、背景、角色图和分享图
src/styles/theme.css        主题颜色与字体
src/styles/collections.css  栏目页面样式
src/lib/schemas.ts          文章、项目、相册、音乐、说说校验
src/content.config.ts       Astro 内容集合
src/content/posts/          文章
src/content/projects/       项目
src/content/albums/         相册
src/content/music/          音乐
src/content/moments/        说说
src/layouts/                公共布局与 SEO
src/components/             导航、文章、项目、目录等组件
src/pages/                  公开静态路由
admin/                      本机控制台界面
scripts/admin-server.mjs    本机文件管理与构建发布服务
public/images/              图片及上传素材
tests/fixtures/             不参与正式构建的测试内容
.local/                     本机备份、回收与测试构建（Git 忽略）
```

## 直接新增内容

也可以在相应集合新建 `.md` / `.mdx`。以下均为格式说明，替换后再发布；未写 `draft` 时默认为 `true`。不要在集合中使用嵌套目录或重复的 `.md` / `.mdx` 文件名。

文章 `src/content/posts/my-note.md`：

```md
---
title: '文章标题'
description: '摘要'
pubDate: 2026-10-18
category: '学习笔记'
tags: ['TypeScript']
draft: true
# updatedDate: 2026-10-19
# cover: '/images/my-cover.webp'
---

## 正文标题

记录问题、理解与验证过程。
```

文章支持目录、代码高亮与复制、图片、引用、表格和 MDX。分类、标签及分页是可分享的静态 URL。日期按发布日期降序，未来日期不等于定时发布。草稿从详情、列表、搜索和 sitemap 排除。

MDX 可使用 `import Callout from '../../components/Callout.astro'` 后加入 `<Callout title="提示">说明。</Callout>`。图片放在 `public/images/`，在内容中写 `/images/文件名.webp`；构建自动补齐 GitHub Pages 子路径。动态 MDX 表达式可导入 `withBase` 手动处理。图片建议用带 `width`、`height` 和 `loading="lazy"` 的 `<img>` 预留尺寸。

项目 `src/content/projects/my-project.md`：

```yaml
---
name: '项目名称'
description: '项目简介'
stack: ['Astro', 'TypeScript']
featured: false
draft: true
# cover: '/images/project.webp'
# source: 'https://github.com/your-name/your-repo'
# demo: 'https://your-domain.example'
---
```

正文可写目标、过程、设计取舍与真实成果。缺少源码、演示或封面时不显示无效按钮或图片。

相册 `src/content/albums/my-album.md`：

```yaml
---
title: '相册名称'
description: '相册简介'
date: 2026-10-18
draft: true
photos:
  - src: '/images/my-photo.webp'
    alt: '照片中的内容'
    caption: '可选说明'
---
```

正文可加相册介绍，点击照片可放大，Escape 关闭。控制台的照片字段使用 JSON，例如 `[{"src":"/images/my-photo.webp","alt":"照片描述","caption":"可选说明"}]`。

音乐 `src/content/music/my-track.md`：

```yaml
---
title: '歌曲名'
artist: '演奏者'
audio: '/images/uploads/my-track.mp3'
draft: true
# cover: '/images/cover.webp'
lyrics: |
  可选歌词
---
```

支持本地音频和可直接播放的 HTTPS 音频地址，不支持把音乐平台页面链接当音频。不会自动播放，同时只播放一首；歌词以文本显示，LRC 不进行同步滚动。请上传你确认可公开的音频，较大文件可使用自己的媒体存储 HTTPS 地址。

说说 `src/content/moments/my-moment.md`：

```md
---
date: 2026-10-18T12:00:00+08:00
photos: []
draft: true
---

写下当下的一点想法。
```

控制台照片路径每行一张；日期在前台按北京时间显示。

## 替换视觉与主题

- `src/config/visuals.ts` 集中修改 Logo、角色图、桌面/移动背景、分享图。设为 `null` 可关闭可选资源。保持素材为独立图层，不使用整张界面截图作为背景。
- 建议 Logo 用 SVG 或宽 1200px 透明 PNG；角色图宽 1440px 左右；背景宽 1920px，移动背景约 1000px；封面 1600×900，分享图 1200×630。使用压缩 WebP 并保留原图备份。
- `src/styles/theme.css` 修改颜色与字体；`stage.css`、`bubbles.css`、`home-landing.css`、`collections.css` 控制背景、气泡和栏目布局。系统/浅色/深色选择会保存在浏览器。
- 字体 UnifrakturCook、Cormorant Garamond 通过 Fontsource 自托管，授权副本在 `public/licenses/`；中文使用系统字体。更换时将有授权的 WOFF2 放入 `public/fonts/`，声明 `font-display: swap` 并修改主题 token。

视觉参考来自用户提供的图片及 XinghuisamaBlogs 的公开展示。此实现未复制该项目源码，也未引入对方的个人内容。当前图片为用户提供的素材，不因此推定其他素材的使用授权。

## GitHub Pages 部署

仓库：https://github.com/LyraSelene/personal-blog

站点：https://lyraselene.github.io/personal-blog/

仓库 Settings → Pages → Source 选择 **GitHub Actions**。`.github/workflows/deploy.yml` 在推送到 `main` 后自动安装、检查、构建和部署 `dist/`。首次发布完成后，后续可通过本机控制台发布内容。

工作流从 Pages 配置读取真实域名和项目路径。手动构建此站点时设置：

```powershell
$env:SITE_URL='https://lyraselene.github.io'
$env:SITE_BASE_PATH='/personal-blog/'
npm run predeploy
npm run build
```

本地普通开发不需要这些环境变量。也可复制 `.env.example` 为 `.env`。`SITE_URL` 只填 HTTPS 根域名；`SITE_BASE_PATH` 填根路径 `/` 或项目路径 `/personal-blog/`。真实发布前必须替换示例域名并重新构建，以更新 canonical、Open Graph、robots 和 sitemap。

如改用 Cloudflare Pages：连接该 GitHub 仓库，根目录为此项目，构建命令 `npm run predeploy && npm run build`，输出 `dist`，Node 24；配置 `SITE_URL=https://真实域名` 和 `SITE_BASE_PATH=/`。无需 adapter、数据库、Worker 或 SPA 通配重写。Cloudflare 使用 `404.html` 处理未找到页面；GitHub Pages 同样支持此静态 404。

## 验证

```powershell
# 只在独立目录构建测试内容，不影响正式 dist
$env:TEST_BUILD='1'
$env:SITE_URL='https://lyraselene.github.io'
$env:SITE_BASE_PATH='/personal-blog/'
$env:ASTRO_TELEMETRY_DISABLED='1'
$env:PLAYWRIGHT_CHANNEL='chrome'
npm run build
npm test

# 恢复正式构建
Remove-Item Env:TEST_BUILD
npm run build
```

测试使用已安装 Chrome；也可安装 Playwright Chromium 后去掉 `PLAYWRIGHT_CHANNEL`。覆盖正文搜索、草稿、目录、复制、分页、相册、主题、键盘菜单与多尺寸无障碍扫描。控制台启动后执行 `node scripts/verify-admin.mjs` 验证保存、上传、回收与请求校验。记录见 `VERIFICATION.md`。
