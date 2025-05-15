import React, { useState } from "react";

const Playlist = () => {
  const [songs, setSongs] = useState([
    { id: 1, title: "Graduation (Friends Forever)", artist: "Vitamin C" },
    { id: 2, title: "Good Riddance (Time of Your Life)", artist: "Green Day" }
  ]);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");

  const addSong = () => {
    if (title.trim() && artist.trim()) {
      setSongs([...songs, { id: Date.now(), title, artist }]);
      setTitle("");
      setArtist("");
    }
  };

  return (
    <div className="bg-white/90 rounded-lg p-4 shadow-lg w-full max-w-md mx-auto mt-6 border border-gray-300">
      <h2 className="font-bold text-lg mb-2 text-center">Graduation Playlist</h2>
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 px-2 py-1 rounded border border-gray-300 bg-gray-50 focus:outline-none"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Song Title"
        />
        <input
          className="flex-1 px-2 py-1 rounded border border-gray-300 bg-gray-50 focus:outline-none"
          value={artist}
          onChange={e => setArtist(e.target.value)}
          placeholder="Artist"
        />
        <button
          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
          onClick={addSong}
        >
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {songs.map(song => (
          <li key={song.id} className="flex items-center bg-gray-100 rounded px-3 py-2">
            <span className="flex-1">{song.title} <span className="text-gray-500 text-xs">by {song.artist}</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Playlist;
