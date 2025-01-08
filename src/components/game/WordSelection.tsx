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
      const { data, error } = await supabase.rpc("fetch_random_words", {
        limit_count: 6,
      });

      if (error) {
        console.error("Error fetching random words:", error);
        return;
      }

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
      const newSelectedWords = [...selectedWords, wordId];
      setSelectedWords(newSelectedWords);
      if (newSelectedWords.length === 2) {
        handleConfirm(newSelectedWords);
      }
    }
  };

  const handleConfirm = async (words: string[]) => {
    // First, get the current round for this session
    const { data: roundData, error: roundError } = await supabase
      .from("rounds")
      .select("id")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (roundError) {
      console.error("Error getting current round:", roundError);
      return;
    }

    // Then update that specific round with the selected words
    const { error } = await supabase
      .from("rounds")
      .update({
        word1_id: words[0],
        word2_id: words[1],
      })
      .eq("id", roundData.id);

    if (!error) {
      setIsConfirmed(true);
    } else {
      console.error("Error updating words:", error);
    }
  };

  return (
    <div className="py-6">
      <h3 className="text-xl font-semibold mb-4 text-center">
        Choose Your Words
      </h3>

      <div className="grid grid-cols-3 gap-4">
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
                ? "border-purple-500"
                : "border-gray-200 hover:border-purple-300"
            }`}
          >
            <p className="text-lg font-medium">{word.word}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
