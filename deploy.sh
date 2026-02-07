#!/bin/bash

# ============================================
# Deploy Gavel Demo to Google Cloud Run
# ============================================

set -e  # Exit on error

# Configuration
PROJECT_ID="alpine-avatar-246411"  # ⚠️ CHANGE THIS
SERVICE_NAME="gavel-demo"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting deployment to Cloud Run...${NC}\n"

# ============================================
# Step 1: Load Environment Variables
# ============================================
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
  echo -e "${GREEN}✅ Loaded environment variables from .env${NC}"
else
  echo -e "${YELLOW}⚠️  Warning: .env file not found${NC}"
  exit 1
fi

# Verify required env vars
if [ -z "$VITE_WALLETCONNECT_PROJECT_ID" ]; then
  echo -e "${YELLOW}⚠️  VITE_WALLETCONNECT_PROJECT_ID not set in .env${NC}"
  exit 1
fi

if [ -z "$VITE_GA_MEASUREMENT_ID" ]; then
  echo -e "${YELLOW}⚠️  VITE_GA_MEASUREMENT_ID not set in .env${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Environment variables validated${NC}\n"

# ============================================
# Step 2: Build React App
# ============================================
echo -e "${BLUE}🔨 Building React app...${NC}"
npm run build

# Verify build
if [ ! -d "dist" ]; then
  echo -e "${YELLOW}⚠️  Build failed - dist/ directory not found${NC}"
  exit 1
fi

echo -e "${GREEN}✅ React app built successfully${NC}\n"

# ============================================
# Step 3: Set GCP Project
# ============================================
echo -e "${BLUE}☁️  Setting GCP project to $PROJECT_ID...${NC}"
gcloud config set project $PROJECT_ID
echo -e "${GREEN}✅ GCP project set${NC}\n"

# ============================================
# Step 4: Build Docker Image
# ============================================
echo -e "${BLUE}🐳 Building Docker image...${NC}"
gcloud builds submit --tag $IMAGE_NAME --timeout=10m

echo -e "${GREEN}✅ Docker image built: $IMAGE_NAME${NC}\n"

# ============================================
# Step 5: Deploy to Cloud Run
# ============================================
echo -e "${BLUE}🚢 Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300

echo -e "${GREEN}✅ Deployed to Cloud Run${NC}\n"

# ============================================
# Step 6: Get Service URL
# ============================================
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format 'value(status.url)')

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment Successful!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}🌐 Service URL:${NC}"
echo -e "   $SERVICE_URL"
echo ""
echo -e "${BLUE}📊 View logs:${NC}"
echo -e "   gcloud run services logs read $SERVICE_NAME --region $REGION --limit 50"
echo ""
echo -e "${BLUE}📈 View in Console:${NC}"
echo -e "   https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"