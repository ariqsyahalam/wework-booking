# Deployment Guide - WeWork Booker

Panduan lengkap untuk deploy WeWork Booker ke VPS menggunakan PM2 dan Nginx.

## Prerequisites

- VPS dengan Ubuntu 20.04+ atau CentOS 8+
- Domain `weworkbook.risya.id` yang sudah pointing ke IP VPS
- Root atau sudo access
- Node.js 16+ dan npm

## 1. Persiapan Server

### Update sistem
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js dan npm
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Install PM2 globally
```bash
sudo npm install -g pm2
```

### Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

## 2. Deploy Aplikasi

### Clone atau upload project
```bash
# Jika menggunakan Git
git clone <repository-url> /var/www/wework-booker

# Atau upload files ke directory
sudo mkdir -p /var/www/wework-booker
# Upload semua files ke /var/www/wework-booker
```

### Set permissions
```bash
sudo chown -R $USER:$USER /var/www/wework-booker
cd /var/www/wework-booker
```

### Install dependencies dan jalankan deployment script
```bash
# Install dependencies
npm install --production

# Jalankan deployment script
./deploy.sh
```

### Manual deployment (jika script gagal)
```bash
# Create logs directory
mkdir -p logs

# Start dengan PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Follow instruksi yang muncul untuk setup startup script
```

## 3. Konfigurasi Nginx

### Copy konfigurasi Nginx
```bash
sudo cp nginx.conf /etc/nginx/sites-available/weworkbook.risya.id
sudo ln -s /etc/nginx/sites-available/weworkbook.risya.id /etc/nginx/sites-enabled/
```

### Hapus default site (opsional)
```bash
sudo rm /etc/nginx/sites-enabled/default
```

### Test konfigurasi Nginx
```bash
sudo nginx -t
```

### Reload Nginx
```bash
sudo systemctl reload nginx
```

## 4. Setup SSL Certificate

### Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Obtain SSL certificate
```bash
sudo certbot --nginx -d weworkbook.risya.id
```

### Update Nginx config dengan SSL paths yang benar
Edit `/etc/nginx/sites-available/weworkbook.risya.id` dan update paths:
```nginx
ssl_certificate /etc/letsencrypt/live/weworkbook.risya.id/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/weworkbook.risya.id/privkey.pem;
```

### Reload Nginx
```bash
sudo systemctl reload nginx
```

## 5. Firewall Configuration

### Setup UFW (Ubuntu)
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Atau iptables
```bash
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3519 -s 127.0.0.1 -j ACCEPT
```

## 6. Monitoring dan Maintenance

### PM2 Commands
```bash
# Check status
pm2 status

# View logs
pm2 logs wework-booker

# Restart application
pm2 restart wework-booker

# Stop application
pm2 stop wework-booker

# Monitor in real-time
pm2 monit
```

### Nginx Commands
```bash
# Check status
sudo systemctl status nginx

# View access logs
sudo tail -f /var/log/nginx/weworkbook.risya.id.access.log

# View error logs
sudo tail -f /var/log/nginx/weworkbook.risya.id.error.log

# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx
```

### System Monitoring
```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check network connections
netstat -tulpn | grep :3519
```

## 7. Backup dan Update

### Backup aplikasi
```bash
# Create backup
tar -czf wework-booker-backup-$(date +%Y%m%d).tar.gz /var/www/wework-booker

# Exclude node_modules
tar --exclude='node_modules' --exclude='logs' -czf wework-booker-backup-$(date +%Y%m%d).tar.gz /var/www/wework-booker
```

### Update aplikasi
```bash
cd /var/www/wework-booker

# Backup current version
pm2 stop wework-booker

# Update code (git pull atau upload files baru)
git pull origin main

# Install new dependencies
npm install --production

# Restart application
pm2 restart wework-booker
```

## 8. Troubleshooting

### Application tidak bisa diakses
1. Check PM2 status: `pm2 status`
2. Check application logs: `pm2 logs wework-booker`
3. Check port: `netstat -tulpn | grep :3519`
4. Check firewall: `sudo ufw status`

### Nginx errors
1. Check Nginx status: `sudo systemctl status nginx`
2. Check Nginx config: `sudo nginx -t`
3. Check error logs: `sudo tail -f /var/log/nginx/error.log`

### SSL issues
1. Check certificate: `sudo certbot certificates`
2. Renew certificate: `sudo certbot renew`
3. Check SSL config in Nginx

### Performance issues
1. Check system resources: `htop`
2. Check PM2 monitoring: `pm2 monit`
3. Check application logs for errors

## 9. Security Checklist

- [ ] Firewall configured (only necessary ports open)
- [ ] SSL certificate installed and auto-renewal setup
- [ ] Regular security updates
- [ ] Strong passwords for server access
- [ ] SSH key-based authentication
- [ ] Regular backups
- [ ] Monitor logs for suspicious activity

## 10. Environment Variables

Copy `.env.example` to `.env` dan sesuaikan konfigurasi:
```bash
cp .env.example .env
nano .env
```

Restart aplikasi setelah mengubah environment variables:
```bash
pm2 restart wework-booker
```

## Support

Jika mengalami masalah, check:
1. Application logs: `pm2 logs wework-booker`
2. Nginx logs: `/var/log/nginx/weworkbook.risya.id.error.log`
3. System logs: `journalctl -u nginx`