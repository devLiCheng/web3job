---
name: createRemoteWeb3
description: 创建 remoteweb3 应用

---

##  文件夹目录对应的功能
-   E:\myCodeRepository\github\web3job此目录下有如下对应的项目
  **admin** ： 这是后台管理系统的项目文件目录（技术采用基于react开箱即用的成熟框架 https://arco.design/）
  **backend**： 后端项目（后端采用bun(可搭配hono框架) + mysql + nginx ）
  **frontend**： 采用nextjs， 一定要注重ui ，seo， 和加载性能，是的网站打开速度快
  **spider**： 采用bun 和爬虫框架，并且通过安装 npm install ai 和 bun add @ai-sdk/deepseek, npx skills add vercel/ai  总之就是利用这些工具以及和deepseek v4 pro 这个模型通过蜘蛛爬取数据，然后将数据按照规范的格式进行入库，是的数据能够在 admin 能够进行管理，在frontend能够进行展示，并且spider 这个应用需要有界面，这样可以进行批量和单独抓取操作，爬虫爬默认web3排名前20的的网站数据
- 这几个应用的端口用连贯的端口号，比如 6001， 6002， 6003， 6004


## 部署
所有的项目最后通过一键部署上线，请管理好对应的docker 文件，以及项目使用到的环境变量
