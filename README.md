# RemoteWeb3 Job Portal (remoteweb3.com)

Welcome to the **RemoteWeb3** project skeleton! This is a state-of-the-art, high-performance, and beautifully engineered architecture built for remote Web3 job matchmaking. 

This repository is organized as a multi-service monorepo structure, tailored for excellent loading speeds, perfect search-engine optimization (SEO), and premium aesthetic user experiences.

---

## 🛠️ Architecture & Technology Stack

The project is structured into 4 independent microservices:

1. **`frontend/` (Next.js)**
   - Built using **Next.js App Router** for hybrid static/server rendering (high SEO visibility).
   - Utilizes **Vanilla CSS Modules** for premium fluid animations and zero-unused-CSS overhead.
   - Tailored fonts (`Outfit`, `Inter`) and high-end visual systems.

2. **`backend/` (Bun + Hono)**
   - High-performance, fast REST API hosted on port **`2236`**.
   - Leverages **Bun** runtime for ultra-fast startup and response times.
   - Built on **Hono** router framework (modern, zero overhead, highly typescript integrated).
   - Pre-configured to connect to MySQL database **`remoteweb3Jobs`**.

3. **`spider/` (Bun + Web UI + AI Scraper)**
   - Runs on port **`2237`**.
   - A scraper service designed to import raw web listings.
   - Integrates the modern **Vercel AI SDK (`ai` library)** with **DeepSeek V4 Pro** to extract high-accuracy structured JSON datasets from unformatted HTML and descriptions.
   - Includes a simple web control dashboard for real-time crawling metrics.

4. **`admin/` (React + Arco Design Pro)**
   - Runs on port **`2238`**.
   - Standard React back-office management console.
   - Built on ByteDance's **Arco Design Pro** for an elegant, feature-rich user experience.

---

## 🚀 One-Click Local Deployment (Docker Compose)

The root folder contains a pre-configured `docker-compose.yml` to spin up the entire ecosystem, including the MySQL database.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- [Bun](https://bun.sh/) (Recommended for local dev) or Node.js.

### Quick Start

1. **Clone and Enter the Workspace**:
   ```bash
   cd web3job
   ```

2. **Prepare Environment Variables**:
   ```bash
   copy .env.example .env
   ```
   *Edit `.env` to configure your DeepSeek API keys and DB credentials.*

3. **Launch the Entire Stack**:
   ```bash
   docker compose up --build
   ```

4. **Access the services**:
   - 🌐 **Frontend App**: `http://localhost:3000`
   - ⚡ **Backend API**: `http://localhost:2236`
   - 🕷️ **Spider Console**: `http://localhost:2237`
   - 💼 **Admin Panel**: `http://localhost:2238`
   - 🗄️ **MySQL Database**: `localhost:3306` (internally maps to database `remoteweb3Jobs`)

---

## 📂 Folder Breakdown

For detailed information about each project segment, configurations, or custom development steps, check their respective directories:
- Check [frontend/README.md](./frontend/README.md) for Next.js web application steps.
- Check [backend/README.md](./backend/README.md) for Bun + Hono API guides.
- Check [spider/README.md](./spider/README.md) for AI-Crawler operations and prompt setups.
- Check [admin/README.md](./admin/README.md) for Arco Design back-office customizations.
