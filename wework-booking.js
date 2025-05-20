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
      delayBetweenRequests = 1500
    } = options;
    
    const results = [];
    const current = moment(startDate);
    const end = moment(endDate);
    
    console.log(`\n📅 Processing bookings from ${current.format('DD/MM/YYYY')} to ${end.format('DD/MM/YYYY')}`);
    console.log(`⏰ Time slot: ${startTime} - ${endTime}`);
    console.log(`📌 Mode: ${onlyWeekdays ? 'Weekdays only' : 'All days'}\n`);

    while (current.isSameOrBefore(end)) {
      const dateStr = current.format('YYYY-MM-DD');
      
      if (!onlyWeekdays || (current.day() !== 0 && current.day() !== 6)) {
        const result = await this.bookSpace(locationId, spaceId, dateStr, startTime, endTime);
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
      } else {
        console.log(`⏩ Skipped ${dateStr} (${current.format('dddd')})`);
      }
      
      current.add(1, 'days');
    }

    // Show summary
    const success = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('\n📊 Booking Summary:');
    console.log(`✅ Success: ${success}`);
    console.log(`❌ Failed: ${failed}`);
    if (onlyWeekdays) {
      const totalDays = end.diff(startDate, 'days') + 1;
      console.log(`⏩ Skipped: ${totalDays - results.length} (weekends)`);
    }

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
    
    // 4. Confirmation
    console.log(`\nYou're about to book from ${startDate} to ${endDate}`);
    console.log(`Time slot: ${startTime}-${endTime} at SINARMAS LAND PLAZA SUDIRMAN`);
    const confirm = await askQuestion('Proceed? (y/n): ');
    
    if (confirm.toLowerCase() !== 'y') {
      console.log('Booking cancelled');
      process.exit(0);
    }

    // 5. Process bookings
    const booker = new WeWorkBooker(bearerToken);
    await booker.bookDateRange(
      locationId, 
      spaceId,
      moment(startDate, 'DD/MM/YYYY').format('YYYY-MM-DD'),
      moment(endDate, 'DD/MM/YYYY').format('YYYY-MM-DD'),
      {
        startTime,
        endTime,
        onlyWeekdays: true
      }
    );

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

main();