# 飞书多维表格可视化打印
基于 Vue 3 + TypeScript + Vite 的飞书多维表格可视化排版打印插件。

## 项目简介

本项目自动读取当前多维表格的字段及筛选、排序后的可见记录，生成可直接打印或导出 PDF 的排版表格。
主要技术栈：Vue 3、TypeScript、Vite、Element Plus、飞书多维表格 JS SDK。

## 功能特性

- 读取当前视图中筛选、排序后的全部可见记录
- 自动生成序号
- 自动读取不同多维表格的全部可见字段，不预设业务字段名称
- 支持创建并保存多个打印模板
- 字段顺序可调整
- 支持隐藏不需要打印的字段
- A4 纵向排版，跨页重复表头，避免单行被分页截断
- 可通过浏览器打印或另存为 PDF
- 打印配置持久化保存
- 模板管理首页、字段面板和 A4 可视化画布

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
2. 切换到需要打印的视图，并按需要筛选、排序
3. 打开插件，选择已有模板或创建新模板
4. 从左侧字段面板选择打印字段并调整顺序
5. 保存模板，然后打印或导出 PDF

## License

MIT
