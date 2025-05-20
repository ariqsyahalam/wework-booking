Here's an enhanced and more detailed `README.md` for your WeWork Space Booker application:

# WeWork Space Booker 🚀

A comprehensive Node.js solution for automating WeWork space bookings with advanced scheduling capabilities.

## 🌟 Features

- **Flexible Date Ranges**: Book spaces for any date range (past validations included)
- **Smart Scheduling**:
  - Weekday-only filtering (Mon-Fri)
  - Customizable time slots (8AM-5PM default)
  - Timezone-aware (Asia/Jakarta GMT+7)
- **Interactive CLI**: User-friendly command-line interface
- **Real-time Feedback**: 
  - ✅ Success indicators
  - ❌ Error messages with details
  - ⏩ Skipped days tracking
- **Comprehensive Reporting**: Summary statistics after completion

## 📦 Prerequisites

- Node.js v14+ ([Download](https://nodejs.org/))
- npm v6+ (comes with Node.js)
- WeWork member account with booking privileges

## 🛠 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/wework-booker.git
cd wework-booker
```

2. Install dependencies:
```bash
npm install axios moment
```

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