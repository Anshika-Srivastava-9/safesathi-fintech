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

  // 1. Identify Legitimate Transactional / Informational Patterns FIRST
  const isLegitTxn = /(credited with|debited by|available balance|avail bal|txn of inr|out for delivery|delivered successfully|secret otp|otp for logging in|use otp)/i.test(lower);
  const hasSuspiciousLink = /https?:\/\/|\.apk/i.test(lower);
  const hasCoercion = /(power cut|disconnected|suspended|deactivated|block your account|immediately|tonight)/i.test(lower);

  // If it's a standard bank notification without links or coercion, mark safe immediately
  if (isLegitTxn && !hasSuspiciousLink && !hasCoercion) {
    return {
      flags: [],
      threatType: "general" as const,
      scores: { urgencyScore: 0, domainScore: 0, paymentScore: 0 },
      isExplicitlySafe: true
    };
  }

  // 2. Coercive Utility Disconnection Threat
  if (/(electricity|power will be disconnected|power cut|bijli)/i.test(lower) && /(bill|pay|apk|tonight|immediately|update)/i.test(lower)) {
    threatType = "electricity";
    flags.push("Simulates utility power disconnection coercion.");
    urgencyScore = 95;
  }

  // 3. Fake Lottery / UPI Collect Traps
  if (/(lottery|lucky draw|won ₹|kbc|prize money)/i.test(lower)) {
    threatType = "lottery";
    flags.push("Promises unrealistic lottery or prize rewards.");
    paymentScore = 90;
  }

  if (/(upi:\/\/pay|approve request|enter upi pin|collect request)/i.test(lower)) {
    flags.push("Deceptive UPI payment collect request detected.");
    paymentScore = 95;
  }

  // 4. Malicious APK Download Link
  if (/\.apk($|\s|\/)/i.test(lower)) {
    flags.push("Suspicious Android package (.apk) file download detected.");
    domainScore = 95;
  }

  // 5. Phishing URLs with KYC / Bank / Suspension Coercion
  if (/(https?:\/\/)/i.test(lower) && /(sbi|kyc|verify|update|pan|bank|apk|suspend)/i.test(lower)) {
    threatType = "bank";
    flags.push("Unverified third-party link requesting banking or KYC verification.");
    domainScore = Math.max(domainScore, 90);
    urgencyScore = Math.max(urgencyScore, 85);
  }

  // 6. Bank suspension threats WITHOUT legitimate transaction context
  if (/(account suspended|deactivated|blocked)/i.test(lower) && /(sbi|hdfc|icici|bank|pan)/i.test(lower) && hasSuspiciousLink) {
    threatType = "bank";
    flags.push("Impersonates banking institution or KYC deactivation.");
    urgencyScore = Math.max(urgencyScore, 85);
  }

  return {
    flags,
    threatType,
    scores: { urgencyScore, domainScore, paymentScore },
    isExplicitlySafe: false
  };
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

    const { flags: ruleFlags, threatType, scores: baseScores, isExplicitlySafe } = runLocalSecurityRules(userMessage);

    // Fast-path: Explicitly legitimate transactional message
    if (isExplicitlySafe) {
      return NextResponse.json({
        riskLevel: "Safe",
        isScam: false,
        urgencyScore: 0,
        domainScore: 0,
        paymentScore: 0,
        explanation: userLang === "hindi"
          ? "यह एक सामान्य और वैध बैंकिंग या सूचना संदेश है। इसमें कोई फर्जी लिंक या ख़तरा नहीं है।"
          : "This is a legitimate informational message. No suspicious links, APK downloads, or financial threats were detected.",
        warningSigns: [],
        safeAction: userLang === "hindi"
          ? "कोई कार्रवाई की आवश्यकता नहीं है। यह संदेश सुरक्षित है।"
          : "No action required. This message is safe."
      });
    }

    const systemPrompt = `You are SafeSathi (सेफसाथी), an AI FinTech scam triage advisor for digital banking users in India.
Analyze the provided message.
Target Language: ${userLang === "hindi" ? "Hindi (written in clean Devanagari script)" : "Simple English (no tech jargon)"}.

Classification Guidelines:
- If it is a normal transactional credit, debit, OTP, or courier alert WITHOUT suspicious links or threats, classify it as "Safe".
- Only classify as "High Danger" if it asks to download an APK, click unverified KYC/PAN links, send money via UPI PIN, or threatens utility disconnection.

Respond strictly in valid JSON matching this schema:
{
  "riskLevel": "Safe" | "Suspicious" | "High Danger",
  "isScam": boolean,
  "urgencyScore": number,
  "domainScore": number,
  "paymentScore": number,
  "explanation": "2 simple sentences explaining why this specific message is dangerous or safe.",
  "warningSigns": ["list of red flags found, or empty array if safe"],
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

    const isHighRisk = ruleFlags.length > 0 || (data.riskLevel === "High Danger");
    const finalRisk = isHighRisk ? "High Danger" : (data.riskLevel || "Safe");

    return NextResponse.json({
      riskLevel: finalRisk,
      isScam: finalRisk !== "Safe",
      urgencyScore: finalRisk === "Safe" ? 0 : Math.max(baseScores.urgencyScore, data.urgencyScore || 0),
      domainScore: finalRisk === "Safe" ? 0 : Math.max(baseScores.domainScore, data.domainScore || 0),
      paymentScore: finalRisk === "Safe" ? 0 : Math.max(baseScores.paymentScore, data.paymentScore || 0),
      explanation: data.explanation || (finalRisk === "Safe" ? "This message appears completely safe." : "Potential financial threat detected."),
      warningSigns: finalRisk === "Safe" ? [] : Array.from(new Set([...ruleFlags, ...(data.warningSigns || [])])),
      safeAction: data.safeAction || (finalRisk === "Safe" ? "No action required." : "Do not click any link or send money.")
    });

  } catch (err: any) {
    console.error("GROQ_API_ERROR (Falling back to local rule engine):", err?.message || err);

    const { flags: ruleFlags, threatType, scores } = runLocalSecurityRules(userMessage);
    const isHindi = userLang === "hindi";

    if (ruleFlags.length === 0) {
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

    let fallbackExplanation = "";
    let fallbackAction = "";

    if (threatType === "electricity") {
      fallbackExplanation = isHindi
        ? "अत्यधिक गंभीर खतरा: यह बिजली बिल का फर्जी संदेश है जिसमें कनेक्शन काटने का डर दिखाकर अनधिकृत APK डाउनलोड कराया जा रहा है।"
        : "High Danger: This is a fake electricity disconnection alert designed to force you into installing a malicious APK file.";
      fallbackAction = isHindi
        ? "किसी भी लिंक या APK को डाउनलोड न करें।"
        : "Do not install the APK or tap the link.";
    } else if (threatType === "lottery") {
      fallbackExplanation = isHindi
        ? "धोखाधड़ी चेतावनी: यह एक फर्जी लॉटरी घोटाला है जो UPI से पैसे निकालने की कोशिश करता है।"
        : "High Danger: This is a fraudulent lottery scam attempting to trick you into approving a UPI collect request.";
      fallbackAction = isHindi
        ? "कोई भी UPI पिन दर्ज न करें।"
        : "Never enter your UPI PIN.";
    } else {
      fallbackExplanation = isHindi
        ? "अत्यधिक गंभीर खतरा: इस संदेश में फर्जी बैंक या खाता बंद होने की धमकी देकर संवेदनशील जानकारी मांगी जा रही है।"
        : "High Danger: This message impersonates a bank or service provider to steal your credentials via an unverified link.";
      fallbackAction = isHindi
        ? "किसी भी लिंक पर क्लिक न करें।"
        : "Do not tap on the link or provide credentials.";
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