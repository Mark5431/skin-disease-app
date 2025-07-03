# DermaCare Web Application

This is the frontend component of the DermaCare platform, built with Next.js.

## Features

- Modern UI with dark/light mode support
- Responsive design for all device sizes
- Skin disease image upload and analysis
- Visualization of AI analysis results with Grad-CAM
- User authentication and account management
- History tracking of previous analyses

## Getting Started

### Prerequisites

- Node.js 18.x or newer
- npm or yarn

### Installation

1. Navigate to the web-app directory:
   ```bash
   cd web-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file based on `.env.example` and fill in the required environment variables.

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

### Building for Production

```bash
npm run build
```

### Starting Production Server

```bash
npm start
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
