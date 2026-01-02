import React, { useState, useRef } from 'react';
import { Camera, FileText, Loader2, CheckCircle2, AlertCircle, Info, Sparkles, ArrowRight, Upload } from 'lucide-react';

export default function IngredientScanner() {
  const [mode, setMode] = useState('home');
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');

  const analyzeImage = async (file) => {
    setMode('loading');
    setError(null);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const extractResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: file.type,
                  data: base64
                }
              },
              {
                type: 'text',
                text: 'Extract ALL ingredient text from this food label image. Return ONLY the ingredients list, nothing else. If you cannot find ingredients, say "No ingredients found".'
              }
            ]
          }]
        })
      });

      const extractData = await extractResponse.json();
      const ingredientText = extractData.content[0].text;

      if (ingredientText.includes('No ingredients found')) {
        setError('Could not find ingredients in the image. Please try again with a clearer photo.');
        setMode('home');
        return;
      }

      await analyzeIngredients(ingredientText);

    } catch (err) {
      console.error('Error:', err);
      setError('Failed to analyze image. Please try again.');
      setMode('home');
    }
  };

  const analyzeIngredients = async (ingredients) => {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Analyze these food ingredients in simple language. Return ONLY valid JSON with this exact structure:
{
  "okay": ["ingredient: brief explanation"],
  "concerns": ["ingredient: brief explanation"],
  "summary": "2-3 sentence overall assessment",
  "uncertainty": "mention if anything is unclear"
}

Ingredients: ${ingredients}

Rules:
- Use simple, friendly language
- No medical advice
- Be honest about uncertainty
- Focus on common concerns (allergens, additives, processing)
- Keep explanations brief`
          }]
        })
      });

      const data = await response.json();
      let text = data.content[0].text;
      
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const result = JSON.parse(text);
      setAnalysis(result);
      setMode('results');

    } catch (err) {
      console.error('Error:', err);
      setError('Failed to analyze ingredients. Please try again.');
      setMode('home');
    }
  };

  const handleScanClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      analyzeImage(file);
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      setMode('loading');
      setShowTextInput(false);
      analyzeIngredients(textInput);
    }
  };

  const handleReset = () => {
    setMode('home');
    setAnalysis(null);
    setError(null);
    setTextInput('');
    setShowTextInput(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 pb-24">
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 shadow-xl">
        <div className="px-6 py-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Sparkles className="text-yellow-300" size={32} />
            <h1 className="text-4xl font-black text-white">
              FoodScan AI
            </h1>
          </div>
          <p className="text-emerald-50 text-center text-lg font-medium">
            Smart ingredient analysis at your fingertips
          </p>
        </div>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto">
        {mode === 'home' && (
          <div className="space-y-5">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-5 shadow-md animate-pulse">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
                  <p className="text-red-800 font-medium leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {!showTextInput ? (
              <>
                {/* Hero Card */}
                <div className="bg-gradient-to-br from-white to-emerald-50 rounded-3xl p-8 shadow-xl border border-emerald-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-emerald-100 p-3 rounded-2xl">
                      <Camera className="text-emerald-600" size={28} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Quick Scan</h2>
                  </div>
                  <p className="text-gray-600 mb-6 text-base leading-relaxed">
                    Point your camera at any food label and let AI decode the ingredients for you instantly.
                  </p>
                  <button
                    onClick={handleScanClick}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl py-5 px-6 text-xl font-bold shadow-lg hover:shadow-xl active:scale-98 transition-all flex items-center justify-center gap-3 group"
                  >
                    <Camera size={28} className="group-hover:scale-110 transition-transform" />
                    Scan Label Now
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  <span className="text-gray-500 font-semibold text-sm">OR</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                </div>

                {/* Secondary Option */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-100 p-2.5 rounded-xl">
                      <FileText className="text-blue-600" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Manual Entry</h3>
                  </div>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                    Already have the ingredients list? Paste it here for instant analysis.
                  </p>
                  <button
                    onClick={() => setShowTextInput(true)}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl py-4 px-5 text-lg font-bold shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    <Upload size={22} />
                    Paste Ingredients
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </>
            ) : (
              <div className="bg-white rounded-3xl p-7 shadow-xl border border-gray-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <FileText className="text-blue-600" size={26} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Enter Ingredients
                  </h2>
                </div>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Example: Water, Sugar, Wheat Flour, Palm Oil, Salt, Artificial Flavoring, Sodium Benzoate (Preservative), Yellow 5, Red 40"
                  className="w-full border-2 border-gray-200 rounded-2xl p-5 text-base min-h-44 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all"
                />
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={handleTextSubmit}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl py-4 text-lg font-bold shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles size={20} />
                    Analyze Now
                  </button>
                  <button
                    onClick={() => setShowTextInput(false)}
                    className="px-7 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-4 text-lg font-bold active:scale-98 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Info Section */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-7 shadow-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-4">
                <Info className="text-purple-600" size={24} />
                <h3 className="font-bold text-xl text-gray-900">How It Works</h3>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="font-semibold text-gray-900">Capture or Paste</p>
                    <p className="text-gray-600 text-sm">Take a photo or paste the ingredients list</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="font-semibold text-gray-900">AI Processing</p>
                    <p className="text-gray-600 text-sm">Advanced AI extracts and analyzes ingredients</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="font-semibold text-gray-900">Instant Insights</p>
                    <p className="text-gray-600 text-sm">Get clear explanations and recommendations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'loading' && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <Loader2 className="w-20 h-20 text-emerald-500 animate-spin" />
              <Sparkles className="w-8 h-8 text-yellow-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-6">Analyzing ingredients...</p>
            <p className="text-gray-500 mt-2 text-lg">Our AI is working its magic ✨</p>
          </div>
        )}

        {mode === 'results' && analysis && (
          <div className="space-y-5">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-6 shadow-xl text-white">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={32} className="flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold">Analysis Complete!</h2>
                  <p className="text-emerald-50 text-sm">Here's what we found</p>
                </div>
              </div>
            </div>

            {analysis.okay && analysis.okay.length > 0 && (
              <div className="bg-white rounded-3xl p-7 shadow-lg border-l-4 border-green-500">
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <CheckCircle2 className="text-green-600" size={28} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Safe Ingredients</h2>
                </div>
                <ul className="space-y-4">
                  {analysis.okay.map((item, idx) => (
                    <li key={idx} className="flex gap-3 items-start">
                      <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-bold">✓</span>
                      </div>
                      <p className="text-gray-700 text-base leading-relaxed">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.concerns && analysis.concerns.length > 0 && (
              <div className="bg-white rounded-3xl p-7 shadow-lg border-l-4 border-amber-500">
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-amber-100 p-3 rounded-xl">
                    <AlertCircle className="text-amber-600" size={28} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Watch Out For</h2>
                </div>
                <ul className="space-y-4">
                  {analysis.concerns.map((item, idx) => (
                    <li key={idx} className="flex gap-3 items-start">
                      <div className="bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-bold">!</span>
                      </div>
                      <p className="text-gray-700 text-base leading-relaxed">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.summary && (
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-7 shadow-lg border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-500 p-3 rounded-xl">
                    <Info className="text-white" size={26} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Overall Summary</h2>
                </div>
                <p className="text-gray-800 text-base leading-relaxed font-medium">
                  {analysis.summary}
                </p>
              </div>
            )}

            {analysis.uncertainty && (
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                <p className="text-gray-700 text-sm leading-relaxed">
                  <span className="font-bold text-gray-900">📌 Note:</span> {analysis.uncertainty}
                </p>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white rounded-2xl py-5 px-6 text-xl font-bold shadow-lg hover:shadow-xl active:scale-98 transition-all flex items-center justify-center gap-3 group"
            >
              <Camera size={24} className="group-hover:rotate-12 transition-transform" />
              Scan Another Label
            </button>
          </div>
        )}
      </div>

      {/* Modern Disclaimer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t-2 border-gray-200 px-5 py-4 shadow-2xl">
        <p className="text-xs text-gray-600 text-center leading-relaxed max-w-2xl mx-auto">
          <span className="font-bold text-gray-800">⚠️ Medical Disclaimer:</span> This tool provides general information only and is not medical advice. 
          Always consult healthcare professionals for dietary concerns or allergies.
        </p>
      </div>
    </div>
  );
}