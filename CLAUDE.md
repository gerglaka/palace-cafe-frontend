# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Palace Cafe & Bar is a restaurant website frontend built with vanilla HTML, CSS, and JavaScript. The project is a multi-page static website with dynamic functionality for menu display, online ordering, checkout, and admin management. The site is deployed via FTP to WebSupport.sk hosting.

## Deployment

The project uses GitHub Actions for automated deployment via LFTP:

- **Main deployment**: Triggered on pushes to `main` branch
- **Deploy file**: `.github/workflows/deploy.yml`
- **Target server**: WebSupport.sk FTP hosting at palacebar.sk
- **Upload path**: `/palacebar.sk/web/`

Deployment uploads all HTML, CSS, JS, and media files to the hosting server using LFTP with fallback mechanisms.

## Architecture & Key Files

### Core Pages
- `index.html` - Homepage with hero slider, food categories, and restaurant info
- `menu.html` - Menu display with category filtering
- `order.html` - Online ordering system with cart functionality
- `checkout.html` - Checkout process with payment integration
- `admin-dashboard.html` - Restaurant admin interface
- `order-confirmation.html` - Order confirmation page

### JavaScript Architecture
The frontend uses a class-based JavaScript architecture:

- `order-system-2.js` - Main website functionality (hero slider, mobile menu, food categories)
- `menu-app.js` - Menu management system extending `BaseApp` class
- `checkout_2.js` - Checkout and payment processing with Stripe integration
- `orders-app.js` - Order management for admin dashboard
- `dashboard-*.js` - Admin dashboard core functionality and applications

### Styling
- `styles.css` - Main stylesheet for public-facing pages
- `admin.css` - Admin dashboard specific styles

### Backend Integration
The frontend integrates with a Railway-hosted backend API:
- Base URL: `https://palace-cafe-backend-production.up.railway.app/api`
- Used for menu data, order processing, and admin functions
- Includes security headers and CSRF protection

### Security Features
- Content Security Policy headers in HTML
- XSS protection and content type validation
- CSRF token generation in checkout system
- Input sanitization and validation

## Language & Localization

The website is primarily in Hungarian with support for Slovak and English versions:
- Main language: Hungarian (`lang="hu"`)
- Alternative versions: `index-sk.html`, `index-en.html`
- Restaurant location: Komárno, Slovakia

## Development Workflow

Since this is a static frontend project without package.json:
- No build process required
- Direct file editing and deployment
- Testing should be done by opening HTML files in browser
- Changes are deployed automatically via GitHub Actions on push to main

## Key Features

1. **Online Ordering System**: Complete cart management, item customization, and checkout
2. **Admin Dashboard**: Order management, menu administration, and analytics
3. **Responsive Design**: Mobile-first approach with hamburger navigation
4. **Payment Integration**: Stripe payment processing in checkout
5. **Real-time Updates**: Dynamic content loading via backend API
6. **Happy Hour Banner**: Time-based promotional messaging

## File Structure Notes

- `/assets/images/` - All website imagery organized by type
- Root level contains all main HTML, CSS, and JS files
- No node_modules or package management - pure static site
- Admin files prefixed with `admin-`
- Order/checkout related files clearly named