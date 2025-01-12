import { useEffect, useState } from "react";
import { useRoundsStore } from "../../store/roundsStore";

interface Props {
  sessionId: string;
  userId: string;
}

export default function WordSelection({ sessionId, userId }: Props) {
  const {
    words,
    selectedWords,
    isConfirmed,
    customerReady,
    fetchRandomWords,
    toggleWordSelection,
    confirmWordSelection,
    subscribeToRounds,
    unsubscribeFromRounds,
  } = useRoundsStore();

  useEffect(() => {
    fetchRandomWords();
    subscribeToRounds(sessionId);

    return () => {
      unsubscribeFromRounds();
    };
  }, []);

  useEffect(() => {
    if (selectedWords.length === 2) {
      confirmWordSelection(sessionId);
    }
  }, [selectedWords]);

  return (
    <div className="py-6">
      <h3 className="text-xl font-semibold mb-4 text-center">
        Choose Your Words
      </h3>

      {!customerReady ? (
        <p className="text-center">
          Please wait until the customer has selected a role.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {words.map((word) => (
            <button
              key={word.id}
              onClick={() => toggleWordSelection(word.id)}
              disabled={
                isConfirmed ||
                (selectedWords.length === 2 && !selectedWords.includes(word.id))
              }
              className={`p-4 rounded-lg border-2 ${
                selectedWords.includes(word.id)
                  ? "border-primary"
                  : "border-gray-200 hover:border-primary"
              }`}
            >
              <p className="text-lg font-medium">{word.word}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
