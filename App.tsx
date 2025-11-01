import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateStory } from './services/geminiService';
import type { IllustratedStory } from './types';
import CategoryInput from './components/CategoryInput';
import StoryDisplay from './components/StoryDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { BookIcon } from './components/icons';

// Fix: Defined an interface for window.aistudio to resolve declaration conflicts.
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [apiKeyIsSelected, setApiKeyIsSelected] = useState<boolean>(false);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState<boolean>(true);
  const [category, setCategory] = useState<string>('');
  const [story, setStory] = useState<IllustratedStory | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        if (window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setApiKeyIsSelected(hasKey);
        } else {
          setApiKeyIsSelected(false);
        }
      } catch (e) {
        console.error("Error checking for API key:", e);
        setApiKeyIsSelected(false);
      } finally {
        setIsCheckingApiKey(false);
      }
    };
    // A short delay helps ensure the aistudio object is available.
    setTimeout(checkApiKey, 100);
  }, []);

  const handleSelectKey = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // Assume success to avoid race conditions and immediately show the main app UI.
        setApiKeyIsSelected(true);
      }
    } catch(e) {
      console.error("Error opening API key selection:", e);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setStory(null);

    try {
      const result = await generateStory(category);
      setStory(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      if (errorMessage.includes('API key not valid') || errorMessage.includes('Requested entity was not found')) {
        setError('Your API key is invalid. Please select a valid API key to continue.');
        setApiKeyIsSelected(false); // Reset to show the API key selection screen.
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [category, isLoading]);

  const handleAnotherStory = () => {
    setStory(null);
    setError(null);
    setCategory('');
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    inputRef.current?.focus();
  };

  if (isCheckingApiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!apiKeyIsSelected) {
    return (
      <div className="min-h-screen bg-purple-50 text-gray-800 font-sans p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <main className="max-w-md w-full mx-auto text-center bg-white p-8 rounded-2xl shadow-lg border border-purple-200">
           <BookIcon className="w-16 h-16 text-purple-600 mx-auto mb-4" />
           <h1 className="text-3xl font-bold text-purple-800 mb-2">Welcome to Story Time AI!</h1>
           <p className="text-gray-600 mb-6">To create magical stories, please select your Google AI API key. This is required to use the app.</p>
           {error && <ErrorMessage message={error} />}
           <button
              onClick={handleSelectKey}
              className="w-full bg-purple-600 text-white font-bold py-3 px-8 rounded-full hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all duration-300 ease-in-out mt-4"
            >
              Select API Key
            </button>
            <p className="text-xs text-gray-500 mt-4">
              For more information on billing, visit{' '}
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-700">
                ai.google.dev/gemini-api/docs/billing
              </a>.
            </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 text-gray-800 font-sans p-4 sm:p-6 lg:p-8">
      <main className="max-w-4xl mx-auto">
        <header className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center items-center gap-4 mb-2">
            <BookIcon className="w-12 h-12 text-purple-600" />
            <h1 className="text-4xl sm:text-5xl font-extrabold text-purple-800 tracking-tight">
              Story Time AI
            </h1>
          </div>
          <p className="text-lg text-purple-700">
            Tell me a category, and I'll write a magical story just for you!
          </p>
        </header>

        <section className="mb-8">
          <CategoryInput 
            ref={inputRef}
            category={category}
            setCategory={setCategory}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </section>

        <section aria-live="polite" aria-atomic="true" className="mt-8">
          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}
          {story && !isLoading && <StoryDisplay story={story} />}
          {!isLoading && !error && !story && (
            <div className="text-center p-8 bg-white/60 rounded-2xl border-2 border-dashed border-purple-300">
              <p className="text-xl text-purple-700">Your wonderful story will appear here!</p>
            </div>
          )}
        </section>

        {story && !isLoading && (
          <section className="text-center mt-12">
            <button
              onClick={handleAnotherStory}
              className="bg-green-500 text-white font-bold py-4 px-10 rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all duration-300 ease-in-out shadow-lg transform hover:scale-105"
            >
              Create Another Story
            </button>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
