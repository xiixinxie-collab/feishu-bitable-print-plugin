# 飞书生产排期打印
基于 Vue 3 + TypeScript + Vite 的飞书多维表格生产排期打印插件。

## 项目简介

本项目读取当前多维表格视图中筛选、排序后的可见记录，生成可直接打印或导出 PDF 的生产排期表。
主要技术栈：Vue 3、TypeScript、Vite、Element Plus、飞书多维表格 JS SDK。

## 功能特性

- 读取当前视图中筛选、排序后的全部可见记录
- 自动生成序号
- 默认打印：单号、产品、数量、交期、生产安排、已包装数量
- 字段顺序可拖拽调整
- 支持隐藏不需要打印的字段
- A4 纵向排版，跨页重复表头，避免单行被分页截断
- 可通过浏览器打印或另存为 PDF
- 打印配置持久化保存
- 简洁的设置面板

## 目录结构

```
├── src/
│   ├── App.vue                # 主界面与功能入口
│   ├── main.ts                # 入口文件
│   ├── components/
│   │   └── settingsPanel.vue  # 字段设置面板（拖拽排序/隐藏）
│   ├── hooks/
│   │   └── usePrint.ts        # 打印核心逻辑与数据处理
│   ├── types.ts               # 类型定义
│   └── assets/                # 静态资源
├── public/                    # 公共资源
├── package.json               # 项目信息与依赖
├── vite.config.ts             # Vite 配置
```

## 安装与运行

1. 安装依赖
   ```bash
   npm install
   ```

2. 本地开发
   ```bash
   npm run start
   ```

3. 打包构建
   ```bash
   npm run build
   ```

## 依赖说明

- [Vue 3](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Element Plus](https://element-plus.org/)
- [@lark-base-open/js-sdk](https://open.feishu.cn/document/ukTMukTMukTM/ugTNz4COzUzM14CO1MTN)
- [vue-draggable-plus](https://github.com/caoxiemeihao/vue-draggable-plus)

## 使用说明

1. 在飞书多维表格中安装插件
2. 切换到需要打印的生产排期视图，并按需要筛选、排序
3. 打开插件，点击“刷新当前视图”
4. 点击“打印 / 导出 PDF”
5. 可通过“设置打印字段”调整字段顺序和显隐

## License

MIT
