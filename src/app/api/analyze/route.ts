import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

function runLocalSecurityRules(text: string) {
  const flags: string[] = [];
  const lower = text.toLowerCase();

  let urgencyScore = 0;
  let domainScore = 0;
  let paymentScore = 0;
  let threatType: "electricity" | "bank" | "lottery" | "general" = "general";

  // Check specific threat categories
  if (/(electricity|power will be disconnected|power cut|bijli)/i.test(lower)) {
    threatType = "electricity";
    flags.push("Simulates utility power disconnection coercion.");
    urgencyScore = 95;
  } else if (/(lottery|lucky draw|won ₹|kbc|prize money)/i.test(lower)) {
    threatType = "lottery";
    flags.push("Promises unrealistic lottery or prize rewards.");
    paymentScore = 90;
  } else if (/(kyc|sbi|hdfc|icici|pan|account suspended|blocked|bank)/i.test(lower)) {
    threatType = "bank";
    flags.push("Impersonates banking institution or KYC deactivation.");
    urgencyScore = Math.max(urgencyScore, 85);
  }

  // APK download detection
  if (/\.apk($|\s|\/)/i.test(lower)) {
    flags.push("Suspicious Android package (.apk) file download detected.");
    domainScore = 95;
  }

  // Suspicious Link detection
  if (/(https?:\/\/)/i.test(lower) && /(verify|update|bill|pay|apk|sbi|kyc)/i.test(lower)) {
    flags.push("Unverified third-party link requesting payment or credentials.");
    domainScore = Math.max(domainScore, 90);
  }

  // UPI Collect Traps
  if (/(upi:\/\/pay|approve request|enter upi pin|collect request)/i.test(lower)) {
    flags.push("Deceptive UPI payment collect request detected.");
    paymentScore = 95;
  }

  // Legitimate transaction check (no links, purely informative)
  const isLegitTxn = /(credited with|debited by|available balance|avail bal|out for delivery|secret one time password|otp for logging)/i.test(lower);
  const hasNoLinks = !/https?:\/\/|\.apk/i.test(lower);

  if (isLegitTxn && hasNoLinks && flags.length === 0) {
    urgencyScore = 0;
    domainScore = 0;
    paymentScore = 0;
  }

  return { flags, threatType, scores: { urgencyScore, domainScore, paymentScore } };
}

export async function POST(req: NextRequest) {
  let userMessage = "";
  let userLang = "english";

  try {
    const body = await req.json();
    userMessage = body.message || "";
    userLang = body.language || "english";

    if (!userMessage.trim()) {
      return NextResponse.json({ error: "Message content cannot be empty." }, { status: 400 });
    }

    const { flags: ruleFlags, threatType, scores: baseScores } = runLocalSecurityRules(userMessage);

    const systemPrompt = `You are SafeSathi (सेफसाथी), an AI FinTech scam triage advisor for senior citizens in India.
Analyze the provided message.
Target Language: ${userLang === "hindi" ? "Hindi (written in clean Devanagari script)" : "Simple English (no tech jargon)"}.

Guidelines:
- Match the explanation specifically to the message topic (e.g. Electricity disconnection if about power, KYC Phishing if about bank, Lottery if about prize).
- If it is a normal transactional credit or delivery alert without suspicious links, classify it as "Safe".

Respond strictly in valid JSON matching this schema:
{
  "riskLevel": "Safe" | "Suspicious" | "High Danger",
  "isScam": boolean,
  "urgencyScore": number,
  "domainScore": number,
  "paymentScore": number,
  "explanation": "2 simple sentences explaining why this specific message is dangerous or safe.",
  "warningSigns": ["list of red flags found"],
  "safeAction": "1 clear instruction on what the user should do right now."
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this message:\n"${userMessage}"` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const data = JSON.parse(raw);

    const finalFlags = Array.from(new Set([...ruleFlags, ...(data.warningSigns || [])]));
    const urgencyScore = Math.max(baseScores.urgencyScore, data.urgencyScore || 0);
    const domainScore = Math.max(baseScores.domainScore, data.domainScore || 0);
    const paymentScore = Math.max(baseScores.paymentScore, data.paymentScore || 0);

    const isHighRisk = ruleFlags.length > 0 || domainScore >= 70 || urgencyScore >= 80 || paymentScore >= 80;
    const finalRisk = isHighRisk ? "High Danger" : (data.riskLevel || "Safe");

    return NextResponse.json({
      riskLevel: finalRisk,
      isScam: finalRisk !== "Safe",
      urgencyScore: finalRisk === "Safe" ? 0 : urgencyScore,
      domainScore: finalRisk === "Safe" ? 0 : domainScore,
      paymentScore: finalRisk === "Safe" ? 0 : paymentScore,
      explanation: data.explanation,
      warningSigns: finalRisk === "Safe" ? [] : finalFlags,
      safeAction: data.safeAction
    });

  } catch (err: any) {
    console.error("GROQ_API_ERROR (Falling back to local rule engine):", err?.message || err);

    const { flags: ruleFlags, threatType, scores } = runLocalSecurityRules(userMessage);
    const isHindi = userLang === "hindi";

    // Safe fallback
    if (ruleFlags.length === 0 && scores.domainScore === 0 && scores.urgencyScore === 0) {
      return NextResponse.json({
        riskLevel: "Safe",
        isScam: false,
        urgencyScore: 0,
        domainScore: 0,
        paymentScore: 0,
        explanation: isHindi
          ? "यह एक सामान्य और सुरक्षित संदेश प्रतीत होता है। इसमें कोई फर्जी लिंक या ख़तरा नहीं पाया गया।"
          : "This appears to be a legitimate informational message. No suspicious links, APK downloads, or threats were detected.",
        warningSigns: [],
        safeAction: isHindi
          ? "चिंता की कोई बात नहीं है। यह संदेश सुरक्षित है।"
          : "No action required. This message is safe."
      });
    }

    // Dynamic High Danger fallback based on specific threat type
    let fallbackExplanation = "";
    let fallbackAction = "";

    if (threatType === "electricity") {
      fallbackExplanation = isHindi
        ? "अत्यधिक गंभीर खतरा: यह एक बिजली बिल का फर्जी संदेश है जिसमें कनेक्शन काटने का डर दिखाकर अनधिकृत ऐप डाउनलोड कराया जा रहा है।"
        : "High Danger: This is a fake electricity disconnection alert designed to force you into installing a malicious APK file.";
      fallbackAction = isHindi
        ? "किसी भी लिंक या APK को डाउनलोड न करें। बिजली बिल की जांच केवल आधिकारिक डिस्कॉम कार्यालय या पोर्टल पर करें।"
        : "Do not install the APK or tap the link. Verify your electricity bill only through your official electricity board.";
    } else if (threatType === "lottery") {
      fallbackExplanation = isHindi
        ? "धोखाधड़ी चेतावनी: यह एक फर्जी लॉटरी और पुरस्कार घोटाला है जो प्रोसेसिंग शुल्क के नाम पर यूपीआई से पैसे निकालने की कोशिश करता है।"
        : "High Danger: This is a fraudulent lottery scam attempting to trick you into approving a UPI collect request.";
      fallbackAction = isHindi
        ? "कोई भी UPI पिन दर्ज न करें और न ही रिक्वेस्ट स्वीकार करें। पुरस्कार प्राप्त करने के लिए कभी पिन नहीं डालना होता।"
        : "Never enter your UPI PIN. Entering a PIN always sends money, it never receives money.";
    } else {
      fallbackExplanation = isHindi
        ? "अत्यधिक गंभीर खतरा: इस संदेश में फर्जी बैंक केवाईसी नवीनीकरण या खाता बंद होने की धमकी देकर संवेदनशील जानकारी मांगी जा रही है।"
        : "High Danger: This message impersonates a bank or service provider to steal your credentials via an unverified link.";
      fallbackAction = isHindi
        ? "किसी भी लिंक पर क्लिक न करें और न ही पैन/ओटीपी साझा करें। बैंक कभी SMS पर ऐसे लिंक नहीं भेजते।"
        : "Do not tap on the link or provide credentials. Legitimate banks never suspend accounts via unverified SMS links.";
    }

    return NextResponse.json({
      riskLevel: "High Danger",
      isScam: true,
      urgencyScore: scores.urgencyScore || 85,
      domainScore: scores.domainScore || 90,
      paymentScore: scores.paymentScore || 80,
      explanation: fallbackExplanation,
      warningSigns: ruleFlags,
      safeAction: fallbackAction
    });
  }
}