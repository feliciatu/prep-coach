// Role-specific opening greetings (static, shown immediately on role selection)
export const ROLE_GREETINGS = {
  recruiter: {
    'en-US': `Hi! I'm your **Recruiter** for today's practice. I'll focus on the questions you'd typically get in a first-round screen — your background, motivation, cultural fit, and logistics like compensation and timeline.

To get started: **which company are you interviewing for?**`,

    'zh-TW': `你好！我是今天的**人資招募**練習面試官。我會著重在第一輪篩選的常見問題——你的背景、動機、文化契合度，以及薪資和時程等細節。

首先：**你要面試哪間公司？**`,
  },

  hiringManager: {
    'en-US': `Good to meet you. I'm the **Hiring Manager** — you'd be working directly with me or on my team. I care less about polished answers and more about what you've actually done and how you work.

Let's start: **which company are you interviewing for?**`,

    'zh-TW': `很高興認識你。我是**用人主管**——你將直接與我共事或加入我的團隊。比起完美的答案，我更想了解你實際上做過什麼，以及你的工作方式。

我們開始：**你要面試哪間公司？**`,
  },

  designLead: {
    'en-US': `Hi! I'm the **Design Lead** you'd be reporting to. I care deeply about process and craft — not just what you made, but how you think, how you make decisions, and how you handle critique.

To get started: **which company are you interviewing for?**`,

    'zh-TW': `你好！我是你將直接報告的**設計主管**。我非常重視設計過程和品質——不只是你做了什麼，而是你如何思考、如何做決策，以及如何面對設計評論。

首先：**你要面試哪間公司？**`,
  },

  crossFunctional: {
    'en-US': `Hey! I'm a **Cross-functional Partner** — think of me as the PM or engineer you'd work most closely with. I want to understand how you collaborate, communicate across disciplines, and handle disagreements when priorities conflict.

Quick one to kick off: **which company are you interviewing for?**`,

    'zh-TW': `嗨！我是你的**跨部門夥伴**——可以把我想成是你會最密切合作的 PM 或工程師。我想了解你如何跨部門協作、溝通，以及當優先順序衝突時如何處理分歧。

先問一個問題：**你要面試哪間公司？**`,
  },
};

// Generic greetings for business mode (interview mode always uses ROLE_GREETINGS)
export const INITIAL_GREETINGS = {
  business: {
    'en-US': `Hi! I'm your **Business Advisor**. 📊

I'll help you think through strategic decisions, unit economics, and growth challenges for your business.

To get started — **tell me about your business and what you're trying to figure out.**`,

    'zh-TW': `你好！我是你的**商業顧問**。📊

我將幫助你思考商業策略決策、單位經濟學，以及業務成長的挑戰。

首先，**請告訴我你的事業，以及你想解決什麼問題。**`,
  },
};
