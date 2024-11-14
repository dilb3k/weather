// Weather.js

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
      backdropFilter: 'blur(5px)',
    }}>
    
      <div className="absolute top-4 right-8 flex space-x-2">
        <button
          onClick={() => i18n.changeLanguage('en')}
          className="px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 shadow-lg"
        >
          EN
        </button>
        <button
          onClick={() => i18n.changeLanguage('ru')}
          className="px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 shadow-lg"
        >
          RU
        </button>
        <button
          onClick={() => i18n.changeLanguage('uz')}
          className="px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 shadow-lg"
        >
          UZ
        </button>
      </div>

      {weatherData ? (
        <div className="mt-16 w-full max-w-2xl p-3 rounded-lg shadow-2xl bg-gray-700 bg-opacity-70 text-white font-medium">
          <div className="text-center mb-5">
            <input
              type="text"
              placeholder={t('enter_city')}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="p-2 rounded-full bg-gray-600 text-white w-[55%] focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <button
              onClick={handleClick}
              className="mt-4 p-2 rounded-full bg-orange-500 text-white font-bold w-[55%] hover:bg-orange-600 transition-colors shadow-md"
            >
              {t('get_weather')}
            </button>
            <h2 className="text-4xl font-extrabold mt-4">{weatherData.country}, {weatherData.region}</h2>
            <p className="text-3xl mt-2">{weatherData.temperature}°C - {weatherData.condition.text}</p>
            <img className="mx-auto mt-6 w-32 h-32" src={weatherData.condition.icon} alt="Weather Icon" />
          </div>

          {weatherData.forecastday[0].hour ? (
            <div className="mt-6">
              <h3 className="text-2xl font-semibold mb-4">{t('hourly_forecast')}</h3>
              <Slider {...slickSettings}>
                {weatherData.forecastday[0].hour.map((hour, index) => (
                  <div key={index} className="bg-gray-800 bg-opacity-75 p-4 rounded-lg text-center shadow-lg mx-2">
                    <p className="text-lg font-bold">{new Date(hour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <img className="mx-auto w-16 h-16 mt-3" src={hour.condition.icon} alt="Hourly Forecast Icon" />
                    <p className="text-xl font-bold">{hour.temp_c}°C</p>
                    <p>{hour.condition.text}</p>
                  </div>
                ))}
              </Slider>
            </div>
          ) : null}

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg text-center shadow-lg">
              <p className="font-semibold">{t('wind_speed')}</p>
              <p className="text-2xl font-bold">{weather.current.wind_kph} kph</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg text-center shadow-lg">
              <p className="font-semibold">{t('humidity')}</p>
              <p className="text-2xl font-bold">{weather.current.humidity}%</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg text-center shadow-lg">
              <p className="font-semibold">{t('pressure')}</p>
              <p className="text-2xl font-bold">{weather.current.pressure_mb} hPa</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg text-center shadow-lg">
              <p className="font-semibold">{t('uv_index')}</p>
              <p className="text-2xl font-bold">{weather.current.uv}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg text-center col-span-2 shadow-lg">
              <p className="font-semibold">{t('sunrise')}: {weather.forecast.forecastday[0].astro.sunrise}</p>
              <p>{t('sunset')}: {weather.forecast.forecastday[0].astro.sunset}</p>
            </div>
          </div>

          <div className="mt-8 w-full">
            <h3 className="text-2xl w-full font-semibold mb-4">{t('day_forecast')}</h3>
            <div className="grid grid-cols-3 gap-2">
              {weatherData.forecastday.map((day, index) => (
                <div key={index} className="bg-gray-800 p-2 rounded-lg w-full text-center shadow-lg">
                  <p className="font-semibold">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                  <img className="mx-auto w-20 h-20 mt-3" src={day.day.condition.icon} alt="Forecast Icon" />
                  <p className="text-2xl font-bold">{day.day.avgtemp_c}°C</p>
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
