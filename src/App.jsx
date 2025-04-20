import React, { useState, useEffect, useMemo, useRef } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import './i18n';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function App() {
  const { t, i18n } = useTranslation();
  const [cityInput, setCityInput] = useState('Tashkent'); // Input field state
  const [searchCity, setSearchCity] = useState('Tashkent'); // Actual search term
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [coordinates, setCoordinates] = useState({ lat: 41.3111, lon: 69.2797 });
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);

  // 3D Scene setup
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 10, 5);
    scene.add(directionalLight);

    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 5000;
    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 50;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weather?.current?.weather_code) ? 0x5599ff : // rain codes
        [0, 1].includes(weather?.current?.weather_code) ? 0xffdd00 : // sunny/clear codes
          0xffffff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

   

    const particleMesh = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleMesh);

    camera.position.z = 15;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    animate();
    sceneRef.current = { scene, particleMesh, animate };

    return () => {
      window.removeEventListener('resize', handleResize);
      scene.remove(particleMesh);
      renderer.dispose();
    };
  }, [weather]);

  // Fetch coordinates based on searchCity state, not the city input
  useEffect(() => {
    if (searchCity) {
      fetchCoordinates(searchCity);
    }
  }, [searchCity]);

  // Fetch weather when coordinates change
  useEffect(() => {
    if (coordinates.lat && coordinates.lon) {
      fetchWeather(coordinates.lat, coordinates.lon);
    }
  }, [coordinates]);

  // This effect will run once when component mounts to load initial data
  useEffect(() => {
    if (searchCity) {
      fetchCoordinates(searchCity);
    }
  }, []);

  const fetchCoordinates = async (cityName) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=en&format=json`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();

      if (result.results && result.results.length > 0) {
        const { latitude, longitude, name, country, admin1 } = result.results[0];
        setCoordinates({ lat: latitude, lon: longitude });

        // Set location data immediately
        setWeather(prev => ({
          ...prev,
          location: {
            name,
            country,
            region: admin1 || ''
          }
        }));
      } else {
        throw new Error('City not found');
      }
    } catch (error) {
      console.error('Failed to fetch coordinates:', error);
      setError(t('error_fetching'));
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async (latitude, longitude) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=auto`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();

      const transformedData = transformWeatherData(result);

      setWeather(prev => ({
        ...prev,
        ...transformedData
      }));
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      setError(t('error_fetching'));
    } finally {
      setLoading(false);
    }
  };

  const transformWeatherData = (data) => {
    const weatherCodeMap = {
      0: { text: 'Clear sky', icon: '☀️' },
      1: { text: 'Mainly clear', icon: '🌤️' },
      2: { text: 'Partly cloudy', icon: '⛅' },
      3: { text: 'Overcast', icon: '☁️' },
      45: { text: 'Fog', icon: '🌫️' },
      48: { text: 'Depositing rime fog', icon: '🌫️' },
      51: { text: 'Light drizzle', icon: '🌧️' },
      53: { text: 'Moderate drizzle', icon: '🌧️' },
      55: { text: 'Dense drizzle', icon: '🌧️' },
      56: { text: 'Light freezing drizzle', icon: '🌧️❄️' },
      57: { text: 'Dense freezing drizzle', icon: '🌧️❄️' },
      61: { text: 'Slight rain', icon: '🌧️' },
      63: { text: 'Moderate rain', icon: '🌧️' },
      65: { text: 'Heavy rain', icon: '🌧️' },
      66: { text: 'Light freezing rain', icon: '🌧️❄️' },
      67: { text: 'Heavy freezing rain', icon: '🌧️❄️' },
      71: { text: 'Slight snow fall', icon: '❄️' },
      73: { text: 'Moderate snow fall', icon: '❄️' },
      75: { text: 'Heavy snow fall', icon: '❄️' },
      77: { text: 'Snow grains', icon: '❄️' },
      80: { text: 'Slight rain showers', icon: '🌦️' },
      81: { text: 'Moderate rain showers', icon: '🌦️' },
      82: { text: 'Violent rain showers', icon: '🌦️' },
      85: { text: 'Slight snow showers', icon: '🌨️' },
      86: { text: 'Heavy snow showers', icon: '🌨️' },
      95: { text: 'Thunderstorm', icon: '⛈️' },
      96: { text: 'Thunderstorm with slight hail', icon: '⛈️' },
      99: { text: 'Thunderstorm with heavy hail', icon: '⛈️' }
    };

    const currentCode = data.current?.weather_code || 0;
    const currentWeather = weatherCodeMap[currentCode] || weatherCodeMap[0];

    // Get hourly forecast for the next 24 hours
    const hourlyForecast = [];
    const now = new Date();
    const currentHour = now.getHours();

    for (let i = 0; i < 24; i++) {
      const hourIndex = currentHour + i;
      const adjustedIndex = hourIndex >= 24 ? hourIndex - 24 : hourIndex;
      hourlyForecast.push({
        time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), adjustedIndex, 0, 0).toISOString(),
        temp_c: data.hourly.temperature_2m[adjustedIndex],
        condition: {
          text: weatherCodeMap[data.hourly.weather_code[adjustedIndex]]?.text || 'Unknown',
          icon: weatherCodeMap[data.hourly.weather_code[adjustedIndex]]?.icon || '❓'
        }
      });
    }

    // Transform daily forecast
    const dailyForecast = data.daily.time.map((date, index) => ({
      date,
      day: {
        avgtemp_c: (data.daily.temperature_2m_max[index] + data.daily.temperature_2m_min[index]) / 2,
        condition: {
          text: weatherCodeMap[data.daily.weather_code[index]]?.text || 'Unknown',
          icon: weatherCodeMap[data.daily.weather_code[index]]?.icon || '❓'
        }
      },
      astro: {
        sunrise: data.daily.sunrise[index]?.split('T')[1] || '06:00',
        sunset: data.daily.sunset[index]?.split('T')[1] || '18:00'
      }
    }));

    return {
      current: {
        temp_c: data.current.temperature_2m,
        condition: {
          text: currentWeather.text,
          icon: currentWeather.icon
        },
        weather_code: data.current.weather_code,
        wind_kph: data.current.wind_speed_10m,
        humidity: data.current.relative_humidity_2m,
        pressure_mb: data.current.pressure_msl,
        uv: data.daily?.uv_index_max?.[0] || 0,
        is_day: data.current.is_day === 1
      },
      forecast: {
        forecastday: dailyForecast
      },
      hourly_forecast: hourlyForecast
    };
  };

  // Search only when clicking button or pressing Enter
  const handleSearch = () => {
    if (cityInput.trim()) {
      setSearchCity(cityInput);
    }
  };

  const slickSettings = useMemo(() => ({
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    cssEase: "cubic-bezier(0.87, 0.03, 0.41, 0.9)",
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
      name: weather.location.name,
      temperature: weather.current.temp_c,
      condition: weather.current.condition,
      forecastday: weather.forecast?.forecastday || [],
      hourly: weather.hourly_forecast || [],
      current: weather.current
    };
  }, [weather]);

  const tempAnimation = useSpring({
    number: weatherData ? weatherData.temperature : 0,
    from: { number: 0 },
    config: { mass: 1, tension: 20, friction: 10 },
  });

  const getBackgroundGradient = () => {
    if (!weatherData) return 'linear-gradient(to bottom, #0f2027, #203a43, #2c5364)';

    const hours = new Date().getHours();
    const condition = weatherData.condition?.text?.toLowerCase() || 'clear';
    const isDay = weatherData.current?.is_day || true;

    if (isDay) {
      if (condition.includes('cloud')) {
        return 'linear-gradient(to bottom, #bdc3c7, #2c3e50)';
      } else if (condition.includes('rain')) {
        return 'linear-gradient(to bottom, #373b44, #4286f4)';
      } else {
        return 'linear-gradient(to bottom, #00b4db, #0083b0)';
      }
    } else {
      return 'linear-gradient(to bottom, #0f2027, #203a43, #2c5364)';
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`relative p-0 m-0 min-h-screen flex flex-col items-center justify-center overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-blue-100'}`}
      style={{
        background: getBackgroundGradient(),
        transition: 'all 0.5s ease',
      }}>

      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full z-0"
      />

      <div className="absolute top-4 left-8 flex space-x-2 z-10">
        <motion.button
          onClick={toggleTheme}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`px-4 py-2 rounded-full shadow-lg ${theme === 'dark' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-white'}`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </motion.button>
      </div>

      <div className="absolute top-4 right-8 flex space-x-2 z-10">
        <motion.button
          onClick={() => i18n.changeLanguage('en')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full hover:from-blue-600 hover:to-blue-800 shadow-lg"
        >
          EN
        </motion.button>
        <motion.button
          onClick={() => i18n.changeLanguage('ru')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="px-4 py-2 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-full hover:from-red-600 hover:to-red-800 shadow-lg"
        >
          RU
        </motion.button>
        <motion.button
          onClick={() => i18n.changeLanguage('uz')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="px-4 py-2 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-full hover:from-green-600 hover:to-green-800 shadow-lg"
        >
          UZ
        </motion.button>
      </div>

      <AnimatePresence>
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50"
          >
            <div className="p-8 rounded-full">
              <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 w-full max-w-md p-4 bg-red-500 text-white rounded-lg shadow-xl z-10 text-center"
        >
          {error}
        </motion.div>
      )}

      {weatherData ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mt-16 w-full max-w-2xl p-6 rounded-2xl shadow-2xl backdrop-filter backdrop-blur-lg z-10"
          style={{
            background: theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            color: theme === 'dark' ? 'white' : 'black',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: theme === 'dark'
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 255, 255, 0.1)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 15px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="text-center mb-6">
            <motion.div
              className="flex items-center justify-center space-x-2 mb-6"
              whileHover={{ scale: 1.02 }}
            >
              <input
                type="text"
                placeholder={t('enter_city')}
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className={`p-3 rounded-l-full ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} w-2/3 focus:outline-none focus:ring-2 focus:ring-blue-400 border-none`}
                style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}
              />
              <motion.button
                onClick={handleSearch}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-r-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
              >
                🔍
              </motion.button>
            </motion.div>

            <motion.h2
              className="text-4xl font-extrabold mt-4 bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
              }}
            >
              {weatherData.name}, {weatherData.region}
            </motion.h2>

            <div className="flex items-center justify-center mt-4">
              <animated.p className="text-5xl font-bold mr-2">
                {tempAnimation.number.to(n => Math.floor(n))}
              </animated.p>
              <p className="text-5xl font-bold">°C</p>
            </div>

            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative"
            >
              <p className="text-xl mt-2">{weatherData.condition.text}</p>
              <p className="text-4xl mt-2">{weatherData.condition.icon}</p>
            </motion.div>
          </div>

          {weatherData.hourly.length > 0 && (
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-2xl font-semibold mb-4 px-4">{t('hourly_forecast')}</h3>
              <div className={`${theme === 'dark' ? 'slick-dark' : 'slick-light'}`}>
                <Slider {...slickSettings}>
                  {weatherData.hourly.map((hour, index) => (
                    <div key={index}>
                      <motion.div
                        whileHover={{ scale: 1.05, y: -5 }}
                        className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-4 rounded-xl text-center shadow-lg mx-2 transform transition-all duration-300`}
                        style={{
                          background: theme === 'dark'
                            ? 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))'
                            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(241, 245, 249, 0.9))',
                          backdropFilter: 'blur(10px)',
                          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                          borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        <p className="text-lg font-bold">{new Date(hour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-3xl">{hour.condition.icon}</p>
                        <p className="text-xl font-bold">{hour.temp_c}°C</p>
                        <p>{hour.condition.text}</p>
                      </motion.div>
                    </div>
                  ))}
                </Slider>
              </div>
            </motion.div>
          )}

          <motion.div
            className="mt-8 grid grid-cols-2 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { label: t('wind_speed'), value: `${weatherData.current.wind_kph} kph`, icon: '💨' },
              { label: t('humidity'), value: `${weatherData.current.humidity}%`, icon: '💧' },
              { label: t('pressure'), value: `${weatherData.current.pressure_mb} hPa`, icon: '🔄' },
              { label: t('uv_index'), value: weatherData.current.uv, icon: '☀️' },
            ].map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.03 }}
                className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-4 rounded-xl text-center shadow-lg`}
                style={{
                  background: theme === 'dark'
                    ? 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))'
                    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(241, 245, 249, 0.9))',
                  backdropFilter: 'blur(5px)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <p className="text-3xl mb-2">{item.icon}</p>
                <p className="font-semibold">{item.label}</p>
                <p className="text-2xl font-bold">{item.value}</p>
              </motion.div>
            ))}

            <motion.div
              whileHover={{ scale: 1.03 }}
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-4 rounded-xl col-span-2 shadow-lg`}
              style={{
                background: theme === 'dark'
                  ? 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))'
                  : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(241, 245, 249, 0.9))',
                backdropFilter: 'blur(5px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div className="flex justify-around items-center">
                <div>
                  <p className="text-3xl mb-1">🌅</p>
                  <p className="font-semibold">{t('sunrise')}</p>
                  <p className="text-xl font-bold">{weatherData.forecastday[0]?.astro?.sunrise || '06:00'}</p>
                </div>
                <div>
                  <p className="text-3xl mb-1">🌇</p>
                  <p className="font-semibold">{t('sunset')}</p>
                  <p className="text-xl font-bold">{weatherData.forecastday[0]?.astro?.sunset || '18:00'}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {weatherData.forecastday.length > 0 && (
            <motion.div
              className="mt-8 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h3 className="text-2xl w-full font-semibold mb-4">{t('day_forecast')}</h3>
              <div className="grid grid-cols-3 gap-3">
                {weatherData.forecastday.map((day, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-4 rounded-xl w-full text-center shadow-lg transform transition-all duration-300`}
                    style={{
                      background: theme === 'dark'
                        ? 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))'
                        : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(241, 245, 249, 0.9))',
                      backdropFilter: 'blur(5px)',
                      borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                      borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <p className="font-semibold">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                    <p className="text-3xl">{day.day.condition.icon}</p>
                    <p className="text-sm font-bold">{Math.round(day.day.avgtemp_c)}°C</p>

                    <p className="text-sm mt-1">{day.day.condition.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-${theme === 'dark' ? 'white' : 'gray-800'} text-center mt-8 text-xl font-bold z-10`}
        >
          {t('please_enter_city')}
        </motion.p>
      )}

      <footer className="w-full text-center py-4 mt-8 text-white text-sm z-10">
        <p>© 2025 Weather App</p>
      </footer>
    </div>
  );
}

export default App;