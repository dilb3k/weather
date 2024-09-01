import React, { useState, useEffect, useMemo } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useTranslation } from 'react-i18next';
import './i18n'; 

function Weather() {
  const { t, i18n } = useTranslation();
  const [city, setCity] = useState('Tashkent'); 
  const [weather, setWeather] = useState(null);

  // Fetch weather data when the component mounts or when the city changes
  useEffect(() => {
    fetchWeather(city);
  }, [city]);

  const fetchWeather = async (cityName) => {
    const url = `https://weatherapi-com.p.rapidapi.com/forecast.json?q=${cityName}&days=7`;
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '011641d6a5msh0e0918209bc6738p10a5c3jsn54bb0313d8b9',
        'x-rapidapi-host': 'weatherapi-com.p.rapidapi.com',
      },
    };

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();
      setWeather(result);
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }
  };

  const handleClick = () => {
    if (city) {
      fetchWeather(city);
    }
  };

  const slickSettings = useMemo(() => ({
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          dots: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          dots: true,
        },
      },
    ],
  }), []);

  const weatherData = useMemo(() => {
    if (!weather || !weather.location || !weather.current) return null;
    return {
      country: weather.location.country,
      region: weather.location.region,
      temperature: weather.current.temp_c,
      condition: weather.current.condition,
      forecastday: weather.forecast.forecastday,
    };
  }, [weather]);

  return (
    <div className="relative p-8 bg-gray-900 min-h-screen flex flex-col items-center justify-center" style={{
      backgroundImage: `url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLCUgnMytKbqV8SHo_4Ke5-1M_UNRJ-R8mYg&s')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
    
      <div className="absolute top-4 right-8 flex space-x-2">
        <button
          onClick={() => i18n.changeLanguage('en')}
          className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
        >
          EN
        </button>
        <button
          onClick={() => i18n.changeLanguage('ru')}
          className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
        >
          RU
        </button>
        <button
          onClick={() => i18n.changeLanguage('uz')}
          className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
        >
          UZ
        </button>
      </div>


      
      {weatherData ? (
        <div className="mt-16 w-full max-w-2xl bg-slate-800 p-6 rounded-lg shadow-lg text-white font-medium" style={{
           backgroundColor: 'rgba(167, 170, 203, 0.268)'
        }}>
          <div className="text-center mb-5">
          <div className='flex flex-col items-center mb-5 '>
        <input
          type="text"
          placeholder={t('enter_city')}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className=" p-2 rounded bg-gray-500 text-white w-[55%] focus:outline-none focus:ring-2 focus:ring-gray-600"
        />
        <button
          onClick={handleClick}
          className="mt-4 p-2 bg-gray-500 text-white font-medium rounded w-[55%] hover:bg-gray-600 transition-colors"
        >
          {t('get_weather')}
        </button>
      </div>
            <h2 className="text-4xl font-bold">
              {weatherData.country}, {weatherData.region}
            </h2>
            <p className="text-2xl mt-2">
              {weatherData.temperature}°C - {weatherData.condition.text}
            </p>
            <img className="mx-auto mt-4 w-28" src={weatherData.condition.icon} alt="Weather Icon" />
          </div>

          {weatherData.forecastday[0].hour ? (
            <div className="mt-4">
              <h3 className="text-2xl mb-4">{t('hourly_forecast')}</h3>
              <Slider {...slickSettings}>
                {weatherData.forecastday[0].hour.map((hour, index) => (
                  <div key={index} className="bg-gray-500 p-2 rounded text-center mb-7">
                    <p className="text-lg">{new Date(hour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <img className="mx-auto" src={hour.condition.icon} alt="Hourly Forecast Icon" />
                    <p className="text-xl">{hour.temp_c}°C</p>
                    <p>{hour.condition.text}</p>
                  </div>
                ))}
              </Slider>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-gray-500 p-4 rounded text-center">
              <p>{t('wind_speed')}</p>
              <p className="text-xl">{weather.current.wind_kph} kph</p>
            </div>
            <div className="bg-gray-500 p-4 rounded text-center">
              <p>{t('humidity')}</p>
              <p className="text-xl">{weather.current.humidity}%</p>
            </div>
            <div className="bg-gray-500 p-4 rounded text-center">
              <p>{t('pressure')}</p>
              <p className="text-xl">{weather.current.pressure_mb} hPa</p>
            </div>
            <div className="bg-gray-500 p-4 rounded text-center">
              <p>{t('uv_index')}</p>
              <p className="text-xl">{weather.current.uv}</p>
            </div>
            <div className="bg-gray-500 p-4 rounded text-center col-span-2">
              <p>{t('sunrise')}: {weather.forecast.forecastday[0].astro.sunrise}</p>
              <p>{t('sunset')}: {weather.forecast.forecastday[0].astro.sunset}</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-2xl mb-4">{t('day_forecast')}</h3>
            <div className="grid grid-cols-3 gap-4">
              {weatherData.forecastday.map((day, index) => (
                <div key={index} className="bg-gray-500 p-4 rounded text-center">
                  <p>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                  <img className="mx-auto mt-2" src={day.day.condition.icon} alt="Forecast Icon" />
                  <p>{day.day.avgtemp_c}°C</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-white text-center mt-8">{t('please_enter_city')}</p>
      )}
    </div>
  );
}

export default Weather;
