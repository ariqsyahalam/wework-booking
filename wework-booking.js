const axios = require('axios');
const moment = require('moment');
const readline = require('readline');

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
      
      console.log(`✅ Successfully booked ${bookingDate} (${moment(bookingDate).format('dddd')}) ${startTime}-${endTime}`);
      return { success: true, date: bookingDate };
    } catch (error) {
      console.log(`❌ Failed to book ${bookingDate}: ${error.response?.data?.message || error.message}`);
      return { success: false, date: bookingDate };
    }
  }

  async bookDateRange(locationId, spaceId, startDate, endDate, options = {}) {
    const {
      onlyWeekdays = true,
      startTime = '08:00',
      endTime = '17:00',
      delayBetweenRequests = 1500,
      wfaDates = [], // Specific WFA dates (YYYY-MM-DD)
      wfaDaysOfWeek = [] // WFA days of the week (e.g., ['Monday', 'Friday'])
    } = options;
    
    const results = [];
    const current = moment(startDate);
    const end = moment(endDate);
    
    console.log(`\n📅 Processing bookings from ${current.format('DD/MM/YYYY')} to ${end.format('DD/MM/YYYY')}`);
    console.log(`⏰ Time slot: ${startTime} - ${endTime}`);
    console.log(`📌 Mode: ${onlyWeekdays ? 'Weekdays only' : 'All days'}`);
    if (wfaDates.length > 0) {
      console.log(`🏠 Specific WFA dates to skip: ${wfaDates.join(', ')}`);
    }
    if (wfaDaysOfWeek.length > 0) {
        console.log(`🏠 WFA days of week to skip: ${wfaDaysOfWeek.join(', ')}`);
    }
    console.log('\n');


    while (current.isSameOrBefore(end)) {
      const dateStr = current.format('YYYY-MM-DD');
      const dayOfWeek = current.format('dddd'); // e.g., 'Monday'
      
      let skip = false;
      let skipReason = '';

      // Check if it's a weekend (if onlyWeekdays is true)
      if (onlyWeekdays && (current.day() === 0 || current.day() === 6)) {
        skip = true;
        skipReason = current.format('dddd');
      } 
      
      // Check if it's a specific WFA date
      if (!skip && wfaDates.includes(dateStr)) {
          skip = true;
          skipReason = 'WFA date';
      }

      // Check if it's a WFA day of the week
      if (!skip && wfaDaysOfWeek.includes(dayOfWeek)) {
          skip = true;
          skipReason = 'WFA day of week';
      }

      if (!skip) {
        const result = await this.bookSpace(locationId, spaceId, dateStr, startTime, endTime);
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
      } else {
        console.log(`⏩ Skipped ${dateStr} (${skipReason})`);
      }
      
      current.add(1, 'days');
    }

    // Show summary
    const success = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('\n📊 Booking Summary:');
    console.log(`✅ Success: ${success}`);
    console.log(`❌ Failed: ${failed}`);
    
    // Calculate skipped days including weekends, specific WFA dates, and WFA days of week
    const totalDaysInRange = end.diff(moment(startDate), 'days') + 1;
    const bookedCount = success + failed;
    const skippedCount = totalDaysInRange - bookedCount;
    
    console.log(`⏩ Skipped: ${skippedCount} days`);


    return results;
  }
}

// User input helper
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

// Helper to format day names consistently
function formatDayName(input) {
    const dayMap = {
        'sunday': 'Sunday', 'sun': 'Sunday',
        'monday': 'Monday', 'mon': 'Monday',
        'tuesday': 'Tuesday', 'tue': 'Tuesday',
        'wednesday': 'Wednesday', 'wed': 'Wednesday',
        'thursday': 'Thursday', 'thu': 'Thursday',
        'friday': 'Friday', 'fri': 'Friday',
        'saturday': 'Saturday', 'sat': 'Saturday'
    };
    const lowerInput = input.toLowerCase();
    return dayMap[lowerInput] || null; // Return formatted name or null if invalid
}


// Main program
async function main() {
  try {
    console.log('=== WeWork Space Booking App ===\n');

    // 1. Get configuration
    const bearerToken = await askQuestion('Enter Bearer Token: ');
    const locationId = await askQuestion('Enter Location ID [default: 67a0a8eb-b18c-4217-ac0a-71438297679e]: ') 
      || '67a0a8eb-b18c-4217-ac0a-71438297679e';
    const spaceId = await askQuestion('Enter Space ID [default: 3dee52f6-3e25-11e9-9bc8-0af5174e198c]: ') 
      || '3dee52f6-3e25-11e9-9bc8-0af5174e198c';
    
    // 2. Get date range
    const startDate = await askQuestion('Start date (DD/MM/YYYY): ');
    const endDate = await askQuestion('End date (DD/MM/YYYY): ');
    
    // 3. Get time slot
    const startTime = await askQuestion('Start time (HH:MM) [default: 08:00]: ') || '08:00';
    const endTime = await askQuestion('End time (HH:MM) [default: 17:00]: ') || '17:00';

    // 4. Get specific WFA dates
    const wfaDatesInput = await askQuestion('Enter specific WFA dates (DD/MM/YYYY, comma-separated, leave blank if none): ');
    const wfaDates = wfaDatesInput
      .split(',')
      .map(date => date.trim())
      .filter(date => date) // Remove empty strings
      .map(date => moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD')) // Format to YYYY-MM-DD
      .filter(date => moment(date, 'YYYY-MM-DD', true).isValid()); // Filter out invalid dates

    // 5. Get WFA days of the week
    const wfaDaysInput = await askQuestion('Enter WFA days of the week (Monday, Friday, etc., comma-separated, leave blank if none): ');
    const wfaDaysOfWeek = wfaDaysInput
        .split(',')
        .map(day => day.trim())
        .filter(day => day) // Remove empty strings
        .map(day => formatDayName(day)) // Format day name
        .filter(day => day !== null); // Filter out invalid day names

    
    // 6. Confirmation
    console.log(`\nYou're about to book from ${startDate} to ${endDate}`);
    console.log(`Time slot: ${startTime}-${endTime} at SINARMAS LAND PLAZA SUDIRMAN`);
    if (wfaDates.length > 0) {
      console.log(`Skipping specific WFA dates: ${wfaDates.join(', ')}`);
    }
    if (wfaDaysOfWeek.length > 0) {
        console.log(`Skipping WFA days of week: ${wfaDaysOfWeek.join(', ')}`);
    }
    const confirm = await askQuestion('Proceed? (y/n): ');
    
    if (confirm.toLowerCase() !== 'y') {
      console.log('Booking cancelled');
      process.exit(0);
    }

    // 7. Process bookings
    const booker = new WeWorkBooker(bearerToken);
    await booker.bookDateRange(
      locationId, 
      spaceId,
      moment(startDate, 'DD/MM/YYYY').format('YYYY-MM-DD'),
      moment(endDate, 'DD/MM/YYYY').format('YYYY-MM-DD'),
      {
        startTime,
        endTime,
        onlyWeekdays: true, // Keep onlyWeekdays true to skip Sat/Sun by default
        wfaDates, // Pass specific WFA dates
        wfaDaysOfWeek // Pass WFA days of week
      }
    );

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

main();