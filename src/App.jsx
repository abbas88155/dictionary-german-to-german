import axios from 'axios';
import React, { useEffect, useState } from 'react';

function App() {
  const [dictionary, setDictionary] = useState({});
  const [search, setSearch] = useState('');
  const [result, setResult] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    axios.get('/dictionary.json').then(res => {
      setDictionary(res.data);
    });

    const fav = JSON.parse(localStorage.getItem('favorites')) || [];
    const his = JSON.parse(localStorage.getItem('history')) || [];
    setFavorites(fav);
    setHistory(his);

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const saveToLocalStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const handleSearch = (customWord = null) => {
    const word = (customWord || search).trim().toLowerCase();
    const entry = dictionary[word];

    if (entry) {
      setResult(entry);
      const updatedHistory = [word, ...history.filter(w => w !== word)].slice(0, 10);
      setHistory(updatedHistory);
      saveToLocalStorage('history', updatedHistory);
      setSuggestions([]);
    } else {
      const nearMatches = Object.keys(dictionary)
        .filter(w => w.startsWith(word))
        .sort((a, b) => a.localeCompare(b))
        .slice(0, 10);

      setResult(null);
      setSuggestions(nearMatches);
    }
  };

  const handleInput = (e) => {
    const value = e.target.value;
    setSearch(value);
    setResult(null);

    const matches = Object.keys(dictionary).filter(word =>
      word.toLowerCase().startsWith(value.trim().toLowerCase())
    );

    setSuggestions(value ? matches.slice(0, 20) : []);
  };

  const handleSuggestionClick = (word) => {
    setSearch(word);
    handleSearch(word);
  };

  const toggleFavorite = () => {
    if (!result) return;
    const word = search.toLowerCase();
    const updatedFavorites = favorites.includes(word)
      ? favorites.filter(f => f !== word)
      : [word, ...favorites];

    setFavorites(updatedFavorites);
    saveToLocalStorage('favorites', updatedFavorites);
  };

  const removeFromHistory = (wordToRemove) => {
    const updated = history.filter(word => word !== wordToRemove);
    setHistory(updated);
    saveToLocalStorage('history', updated);
  };

  const speak = (text) => {
    if (!window.speechSynthesis) {
      alert("SpeechSynthesis is not supported in your browser.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const germanVoice = voices.find(voice => voice.lang.startsWith('de'));
      if (germanVoice) {
        utterance.voice = germanVoice;
      }
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-white min-h-screen p-6 font-inter">
      <div className='max-w-3xl mx-auto bg-[#F9FAFB] border border-gray-200 rounded-xl shadow-sm p-6'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-bold text-blue-700'>📘 Wörterbuch</h1>
        </div>

        <div className='flex gap-2 mb-4'>
          <input
            className='w-full border border-gray-300 h-11 rounded-lg px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm'
            onChange={handleInput}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            value={search}
            type="text"
            placeholder='Wort eingeben...'
          />
          <button onClick={() => handleSearch()} className='bg-blue-600 text-white px-5 rounded-lg text-sm hover:bg-blue-700 transition-all'>Suchen</button>
        </div>

        {suggestions.length > 0 && (
          <ul className='bg-white border border-gray-200 rounded-lg mb-4 shadow-sm'>
            {suggestions.map((word) => (
              <li
                key={word}
                className='px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-none text-sm'
                onClick={() => handleSuggestionClick(word)}
              >
                {word}
              </li>
            ))}
          </ul>
        )}

        {result && (
          <div className='mt-4 space-y-3 text-sm'>
            <div className='flex justify-between items-center'>
              <h2 className='text-lg font-bold text-blue-800 capitalize flex items-center gap-2'>
                {search}
                <button onClick={() => speak(search)} title="Aussprache">🔊</button>
              </h2>
              <button onClick={toggleFavorite} className='text-xl'>
                {favorites.includes(search.toLowerCase()) ? '⭐' : '☆'}
              </button>
            </div>

            <p>
              <strong>Beispiel:</strong> {result.example}
              <button onClick={() => speak(result.example)} className='ml-2' title="Beispiel hören">🔊</button>
            </p>

            <p>
              <strong>Artikel:</strong> {result.article}
              <button onClick={() => speak(result.article)} className='ml-2' title="Artikel hören">🔊</button>
            </p>

            <p>
              <strong>Plural:</strong> {result.plural}
              <button onClick={() => speak(result.plural)} className='ml-2' title="Plural hören">🔊</button>
            </p>

            <p>
              <strong>Bedeutung:</strong> {result.meaning}
              <button onClick={() => speak(result.meaning)} className='ml-2' title="Bedeutung hören">🔊</button>
            </p>
          </div>
        )}

        {history.length > 0 && (
          <div className='mt-8'>
            <h3 className='font-bold text-gray-700 mb-2 text-sm'>🕘 Letzte Suchen</h3>
            <div className='flex flex-wrap gap-2'>
              {history.map((word) => (
                <div key={word} className='bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2 text-xs'>
                  <button onClick={() => handleSuggestionClick(word)}>{word}</button>
                  <button onClick={() => removeFromHistory(word)} className='text-red-400 hover:text-red-600'>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {favorites.length > 0 && (
          <div className='mt-6'>
            <h3 className='font-bold text-gray-700 mb-2 text-sm'>❤️ Favoriten</h3>
            <div className='flex flex-wrap gap-2'>
              {favorites.map((word) => (
                <button
                  key={word}
                  className='bg-yellow-200 px-3 py-1 rounded-full text-xs hover:bg-yellow-300'
                  onClick={() => handleSuggestionClick(word)}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
