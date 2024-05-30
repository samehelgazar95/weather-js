const weatherApiKey = 'c0e076f41f7acce961e94eab8c4ddff1';
const timeApiKey = 'BXV97YSUDSHE';
let cityName = 'cairo';

const form = document.querySelector('.section1 form');
const inputValue = form[0].value;

// Weather Elements
const cityAndCountry = document.querySelector('.city-name');
const mainIcon = document.querySelector('.main-icon');

const currDegs = document.getElementsByClassName('curr-degs');
const weatherDesc = document.querySelector('.weather-desc');
const humidityAndWind = document.getElementsByClassName('humiditywind');

// Time and Day Elements
const timeDiv = document.querySelector('.time');
const dayDiv = document.querySelector('.day');

// Section 3
const section3 = document.querySelector('.section3');

// TempKelvin To TempC And TempF
function tempHandler(tempK) {
  const tempC = Math.round(tempK - 273.15);
  const tempF = Math.round(tempC * (9 / 5) + 32);

  return { tempC, tempF };
}

// Fetch Country Data
async function fetchCity(cityName) {
  const res = await fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${weatherApiKey}`
  );
  if (!res.ok) throw new Error(res.statusText);

  const countries = await res.json();
  return countries[0];
}

// Fetching Weather Data
async function fetchWeather({ lat, lon }) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}`
  );
  if (!res.ok) throw new Error(res.statusText);

  const weather = await res.json();
  return weather;
}

// Handle Five Days Predictions
async function updateFiveDays({ lat, lon }) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherApiKey}`
  );
  if (!res.ok) throw new Error(res.statusText);

  const data = await res.json();
  const fiveDays = await data.list.filter((item, index) => {
    if (index == 0) return;

    let currDay, prevDay;
    if (index > 0) {
      currDay = new Date(data.list[index]['dt_txt']).getDay();
      prevDay = new Date(data.list[index - 1]['dt_txt']).getDay();
    }

    if (currDay != prevDay) {
      day = new Date(item['dt_txt']).toLocaleString('en-US', {
        weekday: 'long',
      });
      return item;
    }
  });
  // console.log(fiveDays);
  const fiveDaysHtml = [];

  fiveDays.forEach((day) => {
    const {
      main: { temp },
      weather: [{ icon, description }],
    } = day;
    const { tempC, tempF } = tempHandler(temp);
    const dayName = new Date(day['dt_txt']).toLocaleString('en-US', {
      weekday: 'long',
    });

    fiveDaysHtml.push(`
        <div class="predict">
          <p class="day">${dayName}</p>
          <img
            src="https://openweathermap.org/img/wn/${icon}@2x.png"
            class="cloud-logo"
            alt="main-icon"
          />
          <p class="weather-status">${description}</p>
          <div class="degrees">
            <div class="predict-c">
              <span class="c">${tempC}</span><span>°C</span>
            </div>
            <div class="predict-f">
              <span class="f">${tempF}</span><span>°F</span>
            </div>
          </div>
        </div>`);
  });

  section3.innerHTML = fiveDaysHtml.join('');
}

// Update Current Weather Information
async function updateWeather(city) {
  try {
    const { lat, lon, country } = await fetchCity(city);
    const weather = await fetchWeather({ lat, lon });
    updateFiveDays({ lat, lon });
    fetchAndUpdateTime();
    const {
      main: { temp, humidity },
      wind: { speed },
      weather: [{ icon, description }],
    } = weather;
    const { tempC, tempF } = tempHandler(temp);

    form[0].value = '';
    cityAndCountry.innerHTML = `${
      city[0].toUpperCase() + city.slice(1)
    }, ${country}`;

    mainIcon.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    currDegs[0].innerHTML = tempC;
    currDegs[1].innerHTML = tempF;

    weatherDesc.innerHTML = description[0].toUpperCase() + description.slice(1);

    humidityAndWind[0].innerHTML = humidity + '%';
    humidityAndWind[1].innerHTML = speed + ' m/s';
    document.body.style.display = 'block';
  } catch (err) {
    form[0].value = '';
    form[0].placeholder = 'Wrong country name';
    cityAndCountry.innerHTML = 'Wrong country name';
  }
}

// Fetch TimeZone
async function fetchTimeZone() {
  const { lat, lon } = await fetchCity(cityName);
  const res = await fetch(
    `https://api.timezonedb.com/v2.1/get-time-zone?key=${timeApiKey}&format=json&by=position&lat=${lat}&lng=${lon}`
  );
  if (!res.ok) throw new Error(res.statusText);

  const data = await res.json();
  return data.zoneName;
}

// Fetch and update Time
async function fetchAndUpdateTime() {
  const { DateTime } = luxon;
  const timeZone = await fetchTimeZone();

  try {
    const res = await fetch(
      `https://worldtimeapi.org/api/timezone/${timeZone}`
    );
    if (!res.ok) throw new Error(res.statusText);

    const data = await res.json();

    const time = DateTime.fromISO(data.datetime, { zone: data.timezone });
    const formattedDate = time.toLocaleString(DateTime.TIME_SIMPLE);
    const dayOfWeek = time.toLocaleString({ weekday: 'long' });

    timeDiv.innerHTML = formattedDate;
    dayDiv.innerHTML = dayOfWeek;
  } catch (err) {
    console.error('Error while fetching time' + err);
  }
}

// Show Weather Data
async function submitHandler(e) {
  e.preventDefault();
  let inputVal = this.children[0].value;

  if (!inputVal) {
    form[0].placeholder = 'Please Enter a city!';
    return;
  }

  cityName = inputVal.trim();
  updateWeather(cityName);
}

// The form submitting handler
form.addEventListener('submit', submitHandler);
// Input Focus on Loading
window.addEventListener('load', (e) => {
  form[0].focus();
  updateWeather(cityName);
});
