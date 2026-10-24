// Structural + Linguistic Triage (Zero external network calls)
function runLocalSecurityCheck(text, links, forms) {
  let lower = text.toLowerCase();
  let flags = [];
  let urgency = 0;
  let domainRisk = 0;
  let paymentRisk = 0;

  // 1. Structural Action Check (Downloads & Deep Links)
  for (let l of links) {
    if (/\.apk($|\s|\/)/i.test(l)) {
      flags.push("Suspicious Android package (.apk) file download link found.");
      domainRisk = 95;
    }
    if (/(upi:\/\/pay|collect|pay-request)/i.test(l)) {
      flags.push("Deceptive UPI deep-link hook detected.");
      paymentRisk = 95;
    }
    if (/(https?:\/\/)/i.test(l) && /(sbi|kyc|pan-verify|bill-update|netbanking)/i.test(l)) {
      flags.push("Unverified third-party credential collection domain.");
      domainRisk = Math.max(domainRisk, 90);
    }
  }

  // 2. Behavioral Psychological Urgency
  if (/(electricity|power will be disconnected|power cut|bijli)/i.test(lower)) {
    flags.push("Utility power disconnection panic tactic.");
    urgency = 95;
  }
  if (/(account suspended|deactivated within|blocked today|kyc update)/i.test(lower)) {
    flags.push("Account deactivation urgency pressure.");
    urgency = Math.max(urgency, 90);
  }
  if (/(won ₹|lottery|lucky draw|kbc|cash prize)/i.test(lower)) {
    flags.push("Unrealistic lottery or financial reward offer.");
    paymentRisk = Math.max(paymentRisk, 90);
  }

  return { flags, urgency, domainRisk, paymentRisk };
}

document.getElementById('scanBtn').addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const pageText = document.body.innerText || "";
      const links = Array.from(document.querySelectorAll('a')).map(a => a.href);
      return { pageText: pageText.slice(0, 4000), links: links.slice(0, 60) };
    }
  }, (results) => {
    if (!results || !results[0]) return;
    const { pageText, links } = results[0].result;
    const analysis = runLocalSecurityCheck(pageText, links);

    const resultDiv = document.getElementById('result');
    const verdict = document.getElementById('verdict');
    const explanation = document.getElementById('explanation');
    const radar = document.getElementById('radar');
    const helplineBtn = document.getElementById('helplineBtn');

    resultDiv.style.display = 'block';

    if (analysis.flags.length > 0 || analysis.domainRisk > 50 || analysis.urgency > 50 || analysis.paymentRisk > 50) {
      resultDiv.className = 'danger';
      verdict.innerText = '🚨 HIGH DANGER SCAM DETECTED';
      verdict.style.color = '#f87171';
      explanation.innerText = analysis.flags.join(" ");
      radar.innerHTML = `<span>Urgency: <b>${analysis.urgency}%</b></span><span>Domain: <b>${analysis.domainRisk}%</b></span><span>Payment: <b>${analysis.paymentRisk}%</b></span>`;
      helplineBtn.style.display = 'block';

      // Audio Alert
      let utter = new SpeechSynthesisUtterance("Warning. High danger threat detected on this page.");
      utter.rate = 0.95;
      window.speechSynthesis.speak(utter);
    } else {
      resultDiv.className = 'safe';
      verdict.innerText = '✅ PAGE VERIFIED SAFE';
      verdict.style.color = '#4ade80';
      explanation.innerText = 'No malicious APK payloads, deceptive UPI hooks, or coercive threats found on this screen.';
      radar.innerHTML = `<span>Urgency: <b>0%</b></span><span>Domain: <b>0%</b></span><span>Payment: <b>0%</b></span>`;
      helplineBtn.style.display = 'none';
    }
  });
});