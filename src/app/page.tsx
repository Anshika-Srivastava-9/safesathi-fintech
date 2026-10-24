"use client";

import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  PhoneCall, 
  Loader2, 
  Mic, 
  MicOff, 
  Sparkles,
  RotateCcw,
  Shield,
  Lock,
  Radio,
  ExternalLink,
  CheckCircle2,
  AlertOctagon
} from "lucide-react";

interface AnalysisResult {
  riskLevel: "Safe" | "Suspicious" | "High Danger";
  isScam: boolean;
  urgencyScore: number;
  domainScore: number;
  paymentScore: number;
  explanation: string;
  warningSigns: string[];
  safeAction: string;
}

export default function SafeSathiApp() {
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState<"english" | "hindi">("english");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        setAvailableVoices(window.speechSynthesis.getVoices());
      }
    };
    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const scamPresets = [
    {
      label: "⚡ Electricity Cut Alert",
      text: "Dear consumer, your electricity power will be disconnected tonight at 9:30 PM due to pending bill. Please update bill immediately by downloading our app: http://up-bijli-update.in/bill_pay.apk",
    },
    {
      label: "💳 Fake Bank KYC / APK",
      text: "Dear customer, your SBI bank account has been suspended due to pending KYC update. Click http://sbi-kyc-verify.in to download verification APK and submit PAN details immediately.",
    },
    {
      label: "🎁 Lottery / UPI Collect",
      text: "Congratulations! You won ₹25,00,000 in KBC Lucky Draw. To receive funds, approve the collect request of ₹499 sent to your PhonePe/GPay for registration tax.",
    },
  ];

  const safePresets = [
    {
      label: "✅ Authentic Bank Credit",
      text: "Your A/C ending 4321 has been credited with INR 2,500.00 on 22-Oct-2026 via UPI ref 429381. Avail Bal: INR 14,850.00. - State Bank of India",
    },
    {
      label: "✅ Bank Login OTP",
      text: "582914 is your secret One Time Password (OTP) for logging into your HDFC NetBanking. Valid for 10 mins. Do not share this OTP with anyone, including bank staff.",
    },
    {
      label: "✅ Courier Delivery Alert",
      text: "Your Amazon package containing order #402-98213 is out for delivery today with delivery associate Ravi Kumar. Share delivery code 47 only when you receive package.",
    },
  ];

  const cleanExplanationText = (text?: string) => {
    if (!text || typeof text !== "string") return "";
    return text
      .replace(/^(High Danger|Suspicious|Safe|अत्यधिक गंभीर खतरा|धोखाधड़ी चेतावनी|चेतावनी|सावधान)[:\s-]*/i, "")
      .replace(/[:]/g, " ")
      .trim();
  };

  const fixHindiTtsPronunciation = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\bहैं\b/g, "hai")
      .replace(/\bहै\b/g, "hai");
  };

  const startSpeaking = (textToRead: string, langToUse: "english" | "hindi") => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const speechPayload = langToUse === "hindi" 
        ? fixHindiTtsPronunciation(textToRead) 
        : textToRead;

      const utterance = new SpeechSynthesisUtterance(speechPayload);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();

      if (langToUse === "hindi") {
        utterance.lang = "hi-IN";
        const hindiVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().includes("hi") ||
            v.name.toLowerCase().includes("hindi") ||
            v.name.toLowerCase().includes("kalpana") ||
            v.name.toLowerCase().includes("hemant")
        );
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        utterance.lang = "en-US";
        const englishVoice = voices.find(
          (v) => v.lang.toLowerCase().includes("en") && !v.name.toLowerCase().includes("hindi")
        );
        if (englishVoice) utterance.voice = englishVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.warn("Speech synthesis ended or interrupted:", e);
        setIsSpeaking(false);
      };

      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 50);

    } catch (err) {
      console.error("Speech trigger failed:", err);
      setIsSpeaking(false);
    }
  };

  const buildAnnouncementString = (res?: AnalysisResult | null, lang?: "english" | "hindi") => {
    const activeLang = lang || "english";
    const defaultExp = activeLang === "hindi" 
      ? "संदेश की सुरक्षा जांच पूरी हो गई है।" 
      : "Safety verification completed.";
    const defaultAction = activeLang === "hindi" 
      ? "सतर्क रहें।" 
      : "Stay alert.";

    const rawExp = res?.explanation || defaultExp;
    const rawAction = res?.safeAction || defaultAction;

    const cleanedExp = cleanExplanationText(rawExp);
    const cleanedAction = typeof rawAction === "string" ? rawAction.replace(/[:]/g, " ") : defaultAction;

    if (activeLang === "hindi") {
      const verdictHindi = res?.riskLevel === "High Danger" 
        ? "अत्यधिक गंभीर खतरा" 
        : res?.riskLevel === "Safe" 
        ? "पूर्णतः सुरक्षित" 
        : "संदिग्ध";

      return `सावधान! जाँच का परिणाम ${verdictHindi} है। ${cleanedExp}। हमारी सलाह है कि ${cleanedAction}`;
    }

    return `Alert! Verdict is ${res?.riskLevel || "Analyzed"}. ${cleanedExp} Recommended action: ${cleanedAction}`;
  };

  const handleToggleSpeak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis || !result) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const speechText = buildAnnouncementString(result, language);
      startSpeaking(speechText, language);
    }
  };

  const handleAnalyze = async (textToTest?: string, currentLang?: "english" | "hindi") => {
    const text = textToTest !== undefined ? textToTest : message;
    const activeLang = currentLang || language;

    if (!text.trim()) return;

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language: activeLang }),
      });
      const data = await res.json();
      setResult(data);

      if (data) {
        const announcement = buildAnnouncementString(data, activeLang);
        startSpeaking(announcement, activeLang);
      }
    } catch {
      alert("Failed to analyze. Please check terminal.");
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported on this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === "hindi" ? "hi-IN" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
      setIsListening(false);
      handleAnalyze(transcript, language);
    };

    recognition.start();
  };

  const handleReset = () => {
    setMessage("");
    setResult(null);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Utility Bar (Clean Single Entries) */}
      <div className="bg-[#0D1527] border-b border-slate-800/80 px-4 py-2 text-xs text-slate-400">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-slate-300">SafeSathi Shield Engine 3.1</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline">Offline RegEx + Groq Dual Triage</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400">
              <Lock size={12} className="text-emerald-400" /> Ephemeral Processing (No Data Saved)
            </span>
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
              Chrome Extension Ready (Manifest V3)
            </span>
            <a 
              href="tel:1930" 
              className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold"
            >
              <PhoneCall size={12} /> Helpline 1930
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="border-b border-slate-800 bg-[#0A101D]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-black">
              <Shield size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">SafeSathi</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                  सेफसाथी
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none mt-0.5">
                FinTech Fraud & Deception Defense for Digital Banking Users
              </p>
            </div>
          </div>

          {/* Vernacular Language Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 p-1 rounded-xl">
            <button
              onClick={() => {
                setLanguage("english");
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                setIsSpeaking(false);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                language === "english"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              English
            </button>
            <button
              onClick={() => {
                setLanguage("hindi");
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                setIsSpeaking(false);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                language === "hindi"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Verification Scenarios Selector */}
        <div className="bg-[#0C1322] border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              {language === "hindi" ? "त्वरित जाँच परिदृश्य (Quick Presets):" : "One-Click Evaluation Presets:"}
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Click any sample to test detection
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Scams row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-red-400/90 flex items-center gap-1 mr-1">
                <AlertOctagon size={12} /> Threats:
              </span>
              {scamPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setMessage(preset.text);
                    handleAnalyze(preset.text, language);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/40 border border-red-800/50 text-red-200 transition-all cursor-pointer active:scale-95 text-left font-medium"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Legitimate row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-emerald-400/90 flex items-center gap-1 mr-1">
                <CheckCircle2 size={12} /> Legitimate:
              </span>
              {safePresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setMessage(preset.text);
                    handleAnalyze(preset.text, language);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/50 text-emerald-200 transition-all cursor-pointer active:scale-95 text-left font-medium"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Primary Input Console */}
        <div className="bg-[#0C1322] border border-slate-800 rounded-2xl p-5 shadow-xl relative focus-within:border-amber-500/50 transition">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Radio size={16} className="text-amber-400" />
              {language === "hindi"
                ? "संदिग्ध SMS, WhatsApp संदेश यहाँ पेस्ट करें या बोलें:"
                : "Paste suspicious message or speak via microphone:"}
            </label>
            {message && (
              <button
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw size={12} /> Clear
              </button>
            )}
          </div>

          <div className="relative mt-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder={
                language === "hindi"
                  ? "उदाहरण: 'बिजली कनेक्शन आज रात 9:30 बजे काट दिया जाएगा... बिल तुरंत भरने के लिए इस APK को डाउनलोड करें...'"
                  : "e.g., 'Dear customer, electricity disconnection alert for pending bill. Download APK to update immediately...'"
              }
              className="w-full p-4 pr-14 rounded-xl bg-[#080E1A] border border-slate-700/80 focus:border-amber-500 focus:outline-none text-base text-slate-100 placeholder-slate-600 transition resize-none leading-relaxed"
            />

            {/* Microphone Button Embedded */}
            <button
              onClick={handleVoiceInput}
              title={isListening ? "Listening... click to finish" : "Speak message"}
              className={`absolute right-3 bottom-4 p-2.5 rounded-xl transition-all cursor-pointer shadow-md ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 border border-slate-600"
              }`}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>

          {/* Active Listening Indicator */}
          {isListening && (
            <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-red-400 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-red-500"></span>
              {language === "hindi" ? "माइक्रोफ़ोन सक्रिय है... कृपया अपना संदेश बोलें" : "Microphone active... listening to your voice input"}
            </div>
          )}

          {/* Action Trigger Button */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500">
              {message.trim().length} characters • Analyzed with zero cloud retention
            </div>

            <button
              onClick={() => handleAnalyze()}
              disabled={loading || !message.trim()}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  {language === "hindi" ? "विश्लेषण चल रहा है..." : "Triangulating Threat..."}
                </>
              ) : (
                language === "hindi" ? "सुरक्षा जाँच करें (Analyze)" : "Inspect Safety Now"
              )}
            </button>
          </div>
        </div>

        {/* Verdict Inspection Card */}
        {result && (
          <div
            className={`rounded-2xl border p-6 transition-all shadow-2xl relative overflow-hidden ${
              result.riskLevel === "Safe"
                ? "bg-emerald-950/20 border-emerald-500/40 shadow-emerald-950/30"
                : result.riskLevel === "Suspicious"
                ? "bg-amber-950/20 border-amber-500/40 shadow-amber-950/30"
                : "bg-red-950/25 border-red-500/50 shadow-red-950/40"
            }`}
          >
            {/* Top Accent Strip */}
            <div 
              className={`absolute top-0 left-0 right-0 h-1.5 ${
                result.riskLevel === "Safe"
                  ? "bg-emerald-500"
                  : result.riskLevel === "Suspicious"
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`} 
            />

            {/* Verdict Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3.5">
                <div className={`p-2.5 rounded-xl border ${
                  result.riskLevel === "Safe"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : result.riskLevel === "Suspicious"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}>
                  {result.riskLevel === "Safe" && <ShieldCheck size={32} />}
                  {result.riskLevel === "Suspicious" && <AlertTriangle size={32} />}
                  {result.riskLevel === "High Danger" && <ShieldAlert size={32} />}
                </div>

                <div>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                    DIAGNOSTIC VERDICT
                  </span>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black tracking-tight text-white">
                      {result.riskLevel === "High Danger" 
                        ? (language === "hindi" ? "अत्यधिक गंभीर खतरा (High Danger)" : "High Danger Scam")
                        : result.riskLevel === "Safe"
                        ? (language === "hindi" ? "पूर्णतः सुरक्षित (Legitimate)" : "Safe & Legitimate")
                        : (language === "hindi" ? "संदिग्ध (Suspicious)" : "Suspicious Pattern")}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Speech Controls */}
              <button
                onClick={handleToggleSpeak}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isSpeaking
                    ? "bg-red-600 border-red-500 text-white animate-pulse"
                    : "bg-slate-900/90 border-slate-700 hover:border-slate-500 text-slate-200"
                }`}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX size={16} />
                    {language === "hindi" ? "आवाज बंद करें" : "Stop Voice"}
                  </>
                ) : (
                  <>
                    <Volume2 size={16} />
                    {language === "hindi" ? "बोलकर सुनें" : "Read Aloud"}
                  </>
                )}
              </button>
            </div>

            {/* Quantitative Threat Radar Breakdown */}
            <div className="mt-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                FinTech Risk Radar Assessment:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-400 font-medium">Urgency Pressure</span>
                    <span className="font-bold text-white">{result.urgencyScore}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${result.urgencyScore > 40 ? "bg-red-500" : "bg-emerald-500"}`} 
                      style={{ width: `${result.urgencyScore}%` }} 
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-400 font-medium">Domain & APK Risk</span>
                    <span className="font-bold text-white">{result.domainScore}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${result.domainScore > 40 ? "bg-red-500" : "bg-emerald-500"}`} 
                      style={{ width: `${result.domainScore}%` }} 
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-400 font-medium">Payment / UPI Exploit</span>
                    <span className="font-bold text-white">{result.paymentScore}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${result.paymentScore > 40 ? "bg-red-500" : "bg-emerald-500"}`} 
                      style={{ width: `${result.paymentScore}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Plain-Language Explanation */}
            <div className="mt-5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {language === "hindi" ? "सरल भाषा में विवरण:" : "Plain-Language Explanation:"}
              </span>
              <p className="text-sm sm:text-base text-slate-200 bg-slate-900/80 p-4 rounded-xl border border-slate-800 leading-relaxed font-normal">
                {result.explanation}
              </p>
            </div>

            {/* Detected Warning Indicators */}
            {result.warningSigns && result.warningSigns.length > 0 && (
              <div className="mt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  {language === "hindi" ? "पहचाने गए ख़तरे के संकेत:" : "Identified Attack Vectors:"}
                </span>
                <div className="space-y-1.5">
                  {result.warningSigns.map((sign, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300 bg-slate-900/40 px-3 py-2 rounded-lg border border-slate-800/80">
                      <span className="text-red-400 font-bold">•</span>
                      <span>{sign}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prescribed Action */}
            <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-slate-900 to-[#101827] border border-amber-500/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                {language === "hindi" ? "सलाह (तत्काल क्या करें):" : "Recommended Protective Action:"}
              </span>
              <p className="text-sm font-semibold text-white">
                {result.safeAction}
              </p>
            </div>

            {/* 1930 Emergency Helpline Banner */}
            {result.riskLevel === "High Danger" && (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-red-950/60 border border-red-500/60 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-900/50 text-red-300">
                    <PhoneCall size={20} />
                  </div>
                  <div>
                    <span className="text-xs text-red-200 block">Ministry of Home Affairs (I4C)</span>
                    <span className="text-sm font-bold">
                      National Cyber Crime Helpline: <a href="tel:1930" className="text-amber-400 underline ml-1">1930</a>
                    </span>
                  </div>
                </div>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition cursor-pointer"
                >
                  File Complaint <ExternalLink size={14} />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center pt-6 pb-12 border-t border-slate-900 text-slate-500 text-xs space-y-1">
          <p>SafeSathi • FinTech Cybersecurity & Payment Fraud Triage</p>
          <p>Presented at SPIRIT 3.0 Buildathon, DSMNRU Lucknow • Built with Next.js, Groq & Web Speech</p>
        </footer>
      </main>
    </div>
  );
}