# Artist Portfolio

A gallery website for displaying and selling artwork (drawings & photography). Built with Astro (SSR), Express, and MongoDB. Includes an admin panel for managing artworks and site content.

## Features

- Gallery with category filtering (drawings / photography)
- Individual artwork pages with description, price, and print size table
- Admin panel with JWT authentication
- Image upload with automatic resizing (Sharp)
- Editable homepage content and artist biography
- Zero client-side JS on public pages

---

## Prerequisites

Install the following on your Ubuntu VPS:

```bash
# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# MongoDB 7
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable --now mongod

# PM2 (process manager)
sudo npm install -g pm2

# Nginx
sudo apt install -y nginx
```

---

## Installation

### 1. Clone the repository

```bash
cd ~
git clone <your-repo-url> artist-website
cd artist-website
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the uploads directory

```bash
mkdir -p ~/artist-website/uploads/processed
mkdir -p ~/artist-website/uploads/thumbs
```

### 4. Configure environment variables

```bash
cp .env.example .env
nano .env
```

Fill in your values:

```env
MONGODB_URI=mongodb://localhost:27017/artist-website
JWT_SECRET=your_very_long_random_secret_here_minimum_32_chars
UPLOAD_DIR=~/artist-website/uploads
PORT=4321
```

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 5. Create the admin user

```bash
node scripts/seed-admin.mjs admin@yourdomain.com yourpassword
```

To reset a password later, run the same command — it updates the existing user.

### 6. Build the site

```bash
npm run build
```

### 7. Start with PM2

```bash
pm2 start server.mjs --name artist-website
pm2 save
pm2 startup   # follow the printed command to enable auto-start on reboot
```

Check logs:
```bash
pm2 logs artist-website
```

---

## Nginx reverse proxy

Create `/etc/nginx/sites-available/artist-website`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Increase upload size limit (adjust as needed)
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:4321;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/artist-website /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Updating the site

After pulling new changes:

```bash
cd ~/artist-website
git pull
npm install
npm run build
pm2 restart artist-website
```

---

## Admin panel

Access the admin at `https://yourdomain.com/admin`

| Section | URL | Description |
|---|---|---|
| Login | `/admin` | JWT-authenticated login |
| Dashboard | `/admin/dashboard` | Overview + recent artworks |
| Homepage | `/admin/content/homepage` | Artist name, tagline, hero text |
| About | `/admin/content/about` | Biography + portrait image |
| Artworks | `/admin/artworks` | List all artworks |
| Add artwork | `/admin/artworks/new` | Upload image + metadata |
| Edit artwork | `/admin/artworks/:id` | Edit or delete an artwork |

---

## Local development

```bash
cp .env.example .env
# Edit .env with local MongoDB URI and a dev JWT secret

npm install
node scripts/seed-admin.mjs dev@example.com password

# Create local uploads directories
mkdir -p uploads/processed uploads/thumbs

npm run dev
```

Visit `http://localhost:4321`

---

## Architecture

```
server.mjs          Express wrapper serving Astro SSR + /uploads static files
src/middleware.ts   JWT guard for all /admin/** routes
src/lib/
  db.ts             Mongoose connection singleton
  auth.ts           JWT sign/verify, bcrypt hash/compare
  imageProcessor.ts Sharp: resize to 1920px (display) and 600px (thumbnail)
  models/           Mongoose schemas: Artwork, User, SiteContent
src/pages/
  api/              REST endpoints (auth, artworks, content)
  admin/            Admin panel pages (SSR, protected)
  gallery/          Public gallery (SSR, reads from MongoDB)
```

---

## SSL with Certbot

Once the site is running over HTTP, install Certbot and obtain a certificate:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot will update `/etc/nginx/sites-available/artist-website` automatically. The resulting config looks like this:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:4321;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Verify auto-renewal works:

```bash
sudo certbot renew --dry-run
```
