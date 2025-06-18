const express = require('express');
const path = require('path');
const axios = require('axios');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3519;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Import WeWorkBooker class
class WeWorkBooker {
  constructor(bearerToken) {
    this.baseUrl = 'https://members.wework.com';
    this.bookingEndpoint = '/workplaceone/api/common-booking/';
    this.headers = {
      'authority': 'members.wework.com',
      'accept': 'application/json, text/plain, */*',
      'content-type': 'application/json',
      'origin': 'https://members.wework.com',
      'referer': 'https://members.wework.com/workplaceone/content2/bookings/desks',
      'request-source': 'MemberWeb/WorkplaceOne/Prod',
      'authorization': `Bearer ${bearerToken}`,
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'weworkmembertype': '2'
    };
  }

  getDaySuffix(day) {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd';
      default: return 'th';
    }
  }

  generateBookingPayload(locationId, spaceId, bookingDate, startTime = '08:00', endTime = '17:00') {
    const startLocal = moment(`${bookingDate} ${startTime}`, 'YYYY-MM-DD HH:mm');
    const endLocal = moment(`${bookingDate} ${endTime}`, 'YYYY-MM-DD HH:mm');
    
    return {
      "ApplicationType": "WorkplaceOne",
      "PlatformType": "WEB",
      "SpaceType": 4,
      "ReservationID": "",
      "TriggerCalendarEvent": true,
      "Notes": {
        "locationAddress": "Jl. Jendral Sudirman Kav. 21, RT 010 / RW 001 Karet Setiabudi",
        "locationCity": "Jakarta",
        "locationState": "JK",
        "locationCountry": "IDN",
        "locationName": "SINARMAS LAND PLAZA SUDIRMAN"
      },
      "MailData": {
        "dayFormatted": startLocal.format(`dddd, MMMM Do`).replace(
          startLocal.date(), 
          `${startLocal.date()}${this.getDaySuffix(startLocal.date())}`
        ),
        "startTimeFormatted": moment(startTime, 'HH:mm').format('hh:mm A'),
        "endTimeFormatted": moment(endTime, 'HH:mm').format('hh:mm A'),
        "floorAddress": "",
        "locationAddress": "Jl. Jendral Sudirman Kav. 21, RT 010 / RW 001 Karet Setiabudi",
        "creditsUsed": "0",
        "Capacity": "1",
        "TimezoneUsed": "GMT +07:00",
        "TimezoneIana": "Asia/Jakarta",
        "TimezoneWin": "SE Asia Standard Time",
        "startDateTime": `${bookingDate} ${startTime}`,
        "endDateTime": `${bookingDate} ${endTime}`,
        "locationName": "SINARMAS LAND PLAZA SUDIRMAN",
        "locationCity": "Jakarta",
        "locationCountry": "IDN",
        "locationState": "JK"
      },
      "LocationType": 0,
      "UTCOffset": "+07:00",
      "CreditRatio": 0,
      "LocationID": locationId,
      "SpaceID": spaceId,
      "WeWorkSpaceID": spaceId,
      "StartTime": startLocal.clone().subtract(7, 'hours').toISOString(),
      "EndTime": endLocal.clone().subtract(7, 'hours').toISOString()
    };
  }

  async bookSpace(locationId, spaceId, bookingDate, startTime, endTime) {
    try {
      const payload = this.generateBookingPayload(locationId, spaceId, bookingDate, startTime, endTime);
      const response = await axios.post(
        `${this.baseUrl}${this.bookingEndpoint}`,
        payload,
        { headers: this.headers }
      );
      
      return { success: true, date: bookingDate, message: `Successfully booked ${bookingDate}` };
    } catch (error) {
      return { 
        success: false, 
        date: bookingDate, 
        message: `Failed to book ${bookingDate}: ${error.response?.data?.message || error.message}` 
      };
    }
  }

  async bookDateRange(locationId, spaceId, startDate, endDate, options = {}) {
    const {
      onlyWeekdays = true,
      startTime = '08:00',
      endTime = '17:00',
      wfaDates = [],
      wfaDaysOfWeek = [],
      delayBetweenRequests = 1000
    } = options;
    
    const results = [];
    const current = moment(startDate);
    const end = moment(endDate);

    while (current.isSameOrBefore(end)) {
      const dateStr = current.format('YYYY-MM-DD');
      const dayOfWeek = current.format('dddd');
      
      let skip = false;
      let skipReason = '';

      if (onlyWeekdays && (current.day() === 0 || current.day() === 6)) {
        skip = true;
        skipReason = current.format('dddd');
      } 
      
      if (!skip && wfaDates.includes(dateStr)) {
        skip = true;
        skipReason = 'WFA date';
      }

      if (!skip && wfaDaysOfWeek.includes(dayOfWeek)) {
        skip = true;
        skipReason = 'WFA day of week';
      }

      if (!skip) {
        const result = await this.bookSpace(locationId, spaceId, dateStr, startTime, endTime);
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
      } else {
        results.push({ success: true, date: dateStr, message: `Skipped ${dateStr} (${skipReason})`, skipped: true });
      }
      
      current.add(1, 'days');
    }

    return results;
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/book', async (req, res) => {
  try {
    const {
      bearerToken,
      locationId,
      spaceId,
      startDate,
      endDate,
      startTime,
      endTime,
      wfaDates,
      wfaDaysOfWeek
    } = req.body;

    // Validate required fields
    if (!bearerToken || !locationId || !spaceId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const booker = new WeWorkBooker(bearerToken);
    
    // Format dates
    const formattedStartDate = moment(startDate, 'YYYY-MM-DD').format('YYYY-MM-DD');
    const formattedEndDate = moment(endDate, 'YYYY-MM-DD').format('YYYY-MM-DD');
    
    // Format WFA dates
    const formattedWfaDates = wfaDates ? wfaDates.map(date => 
      moment(date, 'YYYY-MM-DD').format('YYYY-MM-DD')
    ) : [];

    const results = await booker.bookDateRange(
      locationId,
      spaceId,
      formattedStartDate,
      formattedEndDate,
      {
        startTime: startTime || '08:00',
        endTime: endTime || '17:00',
        onlyWeekdays: true,
        wfaDates: formattedWfaDates,
        wfaDaysOfWeek: wfaDaysOfWeek || [],
        delayBetweenRequests: 1000
      }
    );

    // Calculate summary
    const success = results.filter(r => r.success && !r.skipped).length;
    const failed = results.filter(r => !r.success).length;
    const skipped = results.filter(r => r.skipped).length;

    res.json({
      success: true,
      results,
      summary: {
        success,
        failed,
        skipped,
        total: results.length
      }
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 WeWork Booking Server running on http://localhost:${PORT}`);
});