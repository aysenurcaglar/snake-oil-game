import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface Word {
  id: string;
  word: string;
}

interface Props {
  sessionId: string;
  userId: string;
}

export default function WordSelection({ sessionId, userId }: Props) {
  const [words, setWords] = useState<Word[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    const fetchWords = async () => {
      const { data } = await supabase.from("words").select("*").limit(6);

      if (data) {
        setWords(data);
      }
    };

    fetchWords();
  }, []);

  const handleWordSelect = (wordId: string) => {
    if (selectedWords.includes(wordId)) {
      setSelectedWords(selectedWords.filter((id) => id !== wordId));
    } else if (selectedWords.length < 2) {
      setSelectedWords([...selectedWords, wordId]);
    }
  };

  const handleConfirm = async () => {
    if (selectedWords.length === 2) {
      const { error } = await supabase
        .from("rounds")
        .update({
          word1_id: selectedWords[0],
          word2_id: selectedWords[1],
        })
        .eq("session_id", sessionId)
        .is("word1_id", null);

      if (!error) {
        setIsConfirmed(true);
      }
    }
  };

  return (
    <div className="py-6">
      <h3 className="text-xl font-semibold mb-4 text-center">
        Choose Your Words
      </h3>

      <div className="grid grid-cols-3 gap-4 mb-6">
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
                ? "border-purple-500 bg-purple-50"
                : "border-gray-200 hover:border-purple-300"
            }`}
          >
            <p className="text-lg font-medium">{word.word}</p>
          </button>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={handleConfirm}
          disabled={selectedWords.length !== 2 || isConfirmed}
          className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {isConfirmed ? "Words Confirmed" : "Confirm Selection"}
        </button>
      </div>
    </div>
  );
}
