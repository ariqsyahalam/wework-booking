# WeWork Booking System

Sistem booking otomatis untuk ruang kerja WeWork dengan antarmuka web yang mudah digunakan.

## Fitur

- ✨ **Antarmuka Web Modern**: UI yang responsif dan user-friendly
- 📅 **Booking Rentang Tanggal**: Book multiple hari sekaligus
- 🏠 **WFA Support**: Skip tanggal atau hari tertentu untuk Work From Anywhere
- ⏰ **Kustomisasi Waktu**: Atur jam mulai dan selesai sesuai kebutuhan
- 📊 **Laporan Real-time**: Lihat hasil booking secara langsung
- 🔒 **Secure**: Token authentication untuk keamanan
- 🖥️ **CLI & Web**: Tersedia dalam versi command line dan web interface

## Cara Menggunakan

### 1. Instalasi

```bash
# Clone atau download project ini
cd wework-booker

# Install dependencies
npm install
```

### 2. Web Interface (Recommended)

```bash
# Jalankan server
npm start
```

Server akan berjalan di `http://localhost:3000`

#### Menggunakan Web Interface:

1. **Buka browser** dan akses `http://localhost:3000`
2. **Isi form booking** dengan informasi berikut:
   - **Bearer Token**: Token autentikasi dari WeWork (wajib)
   - **Location ID**: ID lokasi WeWork (default: Sinarmas Land Plaza)
   - **Space ID**: ID ruang kerja (default sudah diisi)
   - **Tanggal Mulai & Selesai**: Rentang tanggal yang ingin di-book
   - **Jam Mulai & Selesai**: Waktu kerja (default: 08:00-17:00)
   - **Tanggal WFA**: Tanggal spesifik yang ingin dilewati (opsional)
   - **Hari WFA**: Hari dalam seminggu yang ingin dilewati (opsional)

3. **Klik "Mulai Booking"** dan tunggu prosesnya selesai
4. **Lihat hasil** booking dalam bentuk summary dan detail

### 3. Command Line Interface

```bash
# Jalankan CLI version
node wework-booking.js
```

Ikuti prompt untuk memasukkan data booking.

## 🔍 How to Get Your Bearer Token

Follow these detailed steps to obtain your authentication token:

1. **Login to WeWork**:
   - Open Chrome/Firefox and navigate to:
   ```
   https://members.wework.com
   ```
   - Complete the login process

2. **Open Developer Tools**:
   - Windows/Linux: `Ctrl+Shift+I` or `F12`
   - Mac: `Cmd+Opt+I`
   - Select the **Network** tab

3. **Initiate a Manual Booking**:
   - Select a location
   - Choose a space
   - Pick a date and time
   - Click "Book" but don't confirm yet

4. **Find the API Request**:
   - In Network tab, filter by `common-booking`
   - Look for POST request to:
   ```
   /workplaceone/api/common-booking/
   ```

5. **Extract the Token**:
   - Click the request
   - Go to "Headers" section
   - Find "Authorization" header
   - Copy the **long string after "Bearer "** (starts with eyJ...)

## 🚀 Usage

Run the application:
```bash
node wework-booker.js
```

### Step-by-Step Process:

1. **Enter Credentials**:
   ```
   Bearer Token: [paste_your_token_here]
   Location ID [default: 67a0a8eb...]: [press_enter_or_specify]
   Space ID [default: 3dee52f6...]: [press_enter_or_specify]
   ```

2. **Set Date Range**:
   ```
   Start date (DD/MM/YYYY): 01/07/2025
   End date (DD/MM/YYYY): 15/07/2025
   ```

3. **Configure Time Slot**:
   ```
   Start time (HH:MM) [default: 08:00]: 09:00
   End time (HH:MM) [default: 17:00]: 18:00
   ```

4. **Confirmation**:
   ```
   You're about to book from 01/07/2025 to 15/07/2025
   Time slot: 09:00-18:00 at SINARMAS LAND PLAZA SUDIRMAN
   Proceed? (y/n): y
   ```

### Sample Output:
```
📅 Processing bookings from 01/07/2025 to 15/07/2025
⏰ Time slot: 09:00 - 18:00
📌 Mode: Weekdays only

✅ Successfully booked 2025-07-01 (Tuesday) 09:00-18:00
✅ Successfully booked 2025-07-02 (Wednesday) 09:00-18:00
⏩ Skipped 2025-07-05 (Saturday)
❌ Failed to book 2025-07-08: Space not available

📊 Booking Summary:
✅ Success: 10
❌ Failed: 1
⏩ Skipped: 4 (weekends)
```

## ⚙️ Configuration Options

Customize by modifying these parameters in code:

```javascript
{
  onlyWeekdays: true,    // Set false to include weekends
  startTime: '08:00',    // Default start time
  endTime: '17:00',      // Default end time
  delayBetweenRequests: 1500  // Delay in ms between API calls
}
```

## 🛑 Troubleshooting

| Error | Solution |
|-------|----------|
| Invalid token | Refresh token (expires every 12 hours) |
| 403 Forbidden | Check your member permissions |
| Rate limiting | Increase delayBetweenRequests |
| Date format errors | Use exact DD/MM/YYYY format |
| Time slot unavailable | Try different times |

## ⚠️ Important Notes

1. **Token Security**:
   - Never commit tokens to version control
   - Tokens provide full account access
   - Regenerate tokens periodically

2. **Rate Limits**:
   - WeWork may block excessive requests
   - Default 1.5s delay between requests
   - Monitor `x-ratelimit-remaining` headers

3. **Legal Considerations**:
   - Check WeWork's Terms of Service
   - This is for personal/educational use
   - Commercial use may require permission

## Scripts

### Development
```bash
npm start    # Jalankan web server
npm run dev  # Jalankan web server (alias)
```

### Production (PM2)
```bash
npm run pm2:start    # Start dengan PM2
npm run pm2:stop     # Stop PM2 process
npm run pm2:restart  # Restart PM2 process
npm run pm2:delete   # Delete PM2 process
npm run pm2:logs     # View PM2 logs
npm run pm2:monit    # PM2 monitoring
npm run deploy       # Run deployment script
```

## Deployment ke VPS

Aplikasi ini sudah siap untuk di-deploy ke VPS dengan konfigurasi berikut:

- **Port**: 3519
- **Domain**: weworkbook.risya.id
- **Process Manager**: PM2
- **Web Server**: Nginx
- **SSL**: Let's Encrypt

### Quick Deployment

1. **Upload project ke VPS**:
   ```bash
   scp -r . user@your-vps:/var/www/wework-booker
   ```

2. **SSH ke VPS dan jalankan deployment**:
   ```bash
   ssh user@your-vps
   cd /var/www/wework-booker
   ./deploy.sh
   ```

3. **Setup Nginx**:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/weworkbook.risya.id
   sudo ln -s /etc/nginx/sites-available/weworkbook.risya.id /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Setup SSL**:
   ```bash
   sudo certbot --nginx -d weworkbook.risya.id
   ```

### Files untuk Deployment

- `ecosystem.config.js` - Konfigurasi PM2
- `nginx.conf` - Konfigurasi Nginx dengan SSL
- `deploy.sh` - Script deployment otomatis
- `.env.example` - Template environment variables
- `DEPLOYMENT.md` - Panduan deployment lengkap

Lihat [DEPLOYMENT.md](DEPLOYMENT.md) untuk panduan deployment yang lebih detail.

## 📜 License

MIT License - Free for personal and commercial use with attribution

## ✨ Pro Tips

1. For recurring bookings:
   ```bash
   # Run weekly via cron job (Linux/Mac)
   0 9 * * 1 node /path/to/wework-booker.js
   ```

2. To save output to log file:
   ```bash
   node wework-booker.js > booking.log 2>&1
   ```

3. For multiple locations:
   ```javascript
   // Run in parallel with different configs
   Promise.all([
     booker.bookDateRange(loc1, space1, ...),
     booker.bookDateRange(loc2, space2, ...)
   ]);
   ```