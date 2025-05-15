import React, { useState } from "react";

const GratitudeBoard = () => {
  const [notes, setNotes] = useState([
    { id: 1, text: "Thanks Mom & Dad!" },
    { id: 2, text: "Shoutout to my best friend!" }
  ]);
  const [input, setInput] = useState("");

  const addNote = () => {
    if (input.trim()) {
      setNotes([...notes, { id: Date.now(), text: input }]);
      setInput("");
    }
  };

  const removeNote = (id: number) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  return (
    <div className="bg-white/90 rounded-lg p-4 shadow-lg w-full max-w-md mx-auto mt-6 border border-gray-300">
      <h2 className="font-bold text-lg mb-2 text-center">Gratitude Board</h2>
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 px-2 py-1 rounded border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add a thank you note..."
        />
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
          onClick={addNote}
        >
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {notes.map(note => (
          <li key={note.id} className="flex items-center bg-gray-100 rounded px-3 py-2">
            <span className="flex-1">{note.text}</span>
            <button
              className="ml-2 text-xs text-red-500 hover:underline"
              onClick={() => removeNote(note.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GratitudeBoard;
