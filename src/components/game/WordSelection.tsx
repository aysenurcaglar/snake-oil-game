import { useEffect } from "react";
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
    fetchWords,
    selectWord,
    confirmWords,
    listenForCustomerReady,
    cleanup,
    error,
  } = useRoundsStore();

  useEffect(() => {
    fetchWords();
    listenForCustomerReady(sessionId);

    return () => {
      cleanup();
    };
  }, [fetchWords, listenForCustomerReady, sessionId, cleanup]);

  const handleWordSelect = (wordId: string) => {
    selectWord(wordId);

    const { selectedWords } = useRoundsStore.getState();

    if (selectedWords.length === 2) {
      confirmWords(userId, sessionId);
    }
  };

  return (
    <div className="py-6">
      <h3 className="text-xl font-semibold mb-4 text-center">
        Choose Your Words
      </h3>

      {error && <p className="text-red-500 text-center">{error}</p>}

      {!customerReady ? (
        <p className="text-center">
          Please wait until the customer has selected a role.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {words.map((word) => (
            <button
              key={word.id}
              onClick={() => handleWordSelect(word.id)}
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
