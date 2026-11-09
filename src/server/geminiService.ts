import { GoogleGenAI } from '@google/genai';

// Initialize server-side Gemini client
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('Gemini API Key is not configured on the server. Please set your GEMINI_API_KEY in the Settings > Secrets panel.');
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface AIGenerateRequest {
  toolId: string;
  toolName: string;
  inputs: Record<string, string>;
  maxWords?: number;
}

export async function generateWithGemini(req: AIGenerateRequest): Promise<{ text: string; wordCount: number }> {
  const ai = getAIClient();
  const { toolId, toolName, inputs, maxWords = 1500 } = req;

  // Build specialized system instructions based on tool type
  let systemInstruction = `You are ZainAI, a world-class professional AI assistant integrated into a premium SaaS platform.
Generate polished, publication-ready, deeply informative, and directly usable results.
Do NOT output robotic preambles like "Sure! Here is..." or "As an AI...". Provide the deliverable directly.
Format the output with clean markdown headings, bullet points, bold highlights, and readable structure where appropriate.
Target word limit: approximately up to ${maxWords} words.`;

  let prompt = '';

  switch (toolId) {
    // FREE TOOLS (1-20)
    case 'article-writer':
      prompt = `Write a comprehensive, engaging article on the topic: "${inputs.topic || 'Artificial Intelligence'}".
Target Audience: ${inputs.audience || 'General professionals'}
Tone: ${inputs.tone || 'Professional & informative'}
Key Points / Outline: ${inputs.keywords || 'Key trends, challenges, opportunities, future outlook'}`;
      break;

    case 'blog-post':
      prompt = `Create an SEO-optimized blog post with a captivating headline, engaging introduction, structured subheadings (H2, H3), actionable takeaways, and a compelling conclusion.
Topic: "${inputs.topic || 'Future of Work'}"
Tone: ${inputs.tone || 'Conversational and authoritative'}
Keywords to integrate naturally: ${inputs.keywords || 'productivity, AI, automation'}`;
      break;

    case 'email-writer':
      prompt = `Write an effective, high-converting professional email.
Recipient/Context: ${inputs.recipient || 'Prospective client'}
Goal: ${inputs.goal || 'Schedule a 15-minute product demonstration'}
Key message points: ${inputs.points || 'Value proposition, pain point resolution, clear call-to-action'}
Tone: ${inputs.tone || 'Friendly, confident, and professional'}`;
      break;

    case 'grammar-checker':
      prompt = `Analyze the following text for grammar, spelling, punctuation, readability, and sentence flow.
Original Text:
"""
${inputs.text || ''}
"""
Provide:
1. Corrected Version (flawless, polished)
2. Breakdown of Corrections & Improvements (concise explanation of key fixes)
3. Readability & Tone Assessment`;
      break;

    case 'paragraph-rewriter':
      prompt = `Rewrite the following text to enhance clarity, impact, engagement, and flow while preserving core meaning.
Target Tone: ${inputs.tone || 'Persuasive and crisp'}
Original Text:
"""
${inputs.text || ''}
"""
Provide 3 distinct rewrite options:
Option 1: Professional & Direct
Option 2: Engaging & Creative
Option 3: Executive & Concise`;
      break;

    case 'social-caption':
      prompt = `Generate 5 creative, attention-grabbing social media captions for ${inputs.platform || 'LinkedIn and Twitter'}.
Post Topic/Concept: "${inputs.topic || ''}"
Vibe/Tone: ${inputs.tone || 'Energetic and inspiring'}
Include hook lines, clear body text, call-to-action, and relevant hashtags.`;
      break;

    case 'instagram-hashtags':
      prompt = `Generate a categorized set of 30 high-performing Instagram hashtags for: "${inputs.niche || 'Digital Marketing'}".
Group them into:
1. Ultra-High Reach (1M+ posts)
2. Targeted Niche (100k-500k posts)
3. High Engagement Micro-Community (10k-50k posts)
Also provide a 1-click ready-to-paste bundle.`;
      break;

    case 'youtube-description':
      prompt = `Write an optimized YouTube video description that maximizes click-through rate and search ranking.
Video Title: "${inputs.title || ''}"
Key Topics Covered: ${inputs.topics || ''}
Include:
- Catchy first 2 lines (before the 'Show More' fold)
- Comprehensive video summary
- Suggested Timestamps / Chapters breakdown
- Links & Resources placeholder
- 10 targeted YouTube SEO tags`;
      break;

    case 'youtube-script':
      prompt = `Write a high-retention YouTube video script for a video titled: "${inputs.title || ''}".
Video Length Target: ${inputs.duration || '5-8 minutes'}
Tone: ${inputs.tone || 'Engaging, fast-paced, entertaining'}
Format:
- [0:00 - 0:30] Hook & Cold Open (stop viewers from clicking away)
- [0:30 - 1:00] Intro & Value Promise
- Main Content Sections with Visual [B-Roll / Screen] cues and Audio/Spoken words
- Call to Action (Subscribe, Like, Comment question)
- Outro`;
      break;

    case 'product-description':
      prompt = `Craft a compelling e-commerce product description that turns browsers into buyers.
Product Name: "${inputs.productName || ''}"
Key Features & Specs: ${inputs.features || ''}
Target Buyer: ${inputs.targetBuyer || 'Discerning modern consumers'}
Tone: ${inputs.tone || 'Premium, persuasive, and benefit-driven'}
Include: Catchy hook, emotional benefit bullets, technical specifications highlight, and guarantee/urgency nudge.`;
      break;

    case 'meta-title':
      prompt = `Generate 10 click-worthy, SEO-optimized Meta Titles (under 60 characters each) for:
Page Topic/URL: "${inputs.topic || ''}"
Primary Keyword: "${inputs.keyword || ''}"
Target Audience: ${inputs.audience || 'Search users looking for solutions'}
Include character counts for each variation.`;
      break;

    case 'meta-description':
      prompt = `Generate 8 compelling Meta Descriptions (between 140 and 155 characters each) for:
Page Topic: "${inputs.topic || ''}"
Primary Keyword: "${inputs.keyword || ''}"
Value Proposition / Call-to-Action: ${inputs.cta || 'Discover more today'}
Include character counts for each variation to ensure no Google snippet truncation.`;
      break;

    case 'text-summarizer':
      prompt = `Provide an executive summary of the following text:
"""
${inputs.text || ''}
"""
Summary Format requested: ${inputs.format || 'Key Takeaways & TL;DR'}
Include:
- 1-sentence Executive TL;DR
- 5 Core Takeaways (bulleted)
- In-depth synthesized summary`;
      break;

    case 'ai-translator':
      prompt = `Translate the following text accurately and idiomatically from ${inputs.sourceLang || 'Detect language'} to ${inputs.targetLang || 'Spanish'}.
Tone style: ${inputs.style || 'Natural & Professional'}
Original Text:
"""
${inputs.text || ''}
"""
Provide:
1. Fluent Translation
2. Contextual & Cultural Notes (if any idioms or nuances require explanation)`;
      break;

    case 'business-name':
      prompt = `Generate 25 creative, memorable brand and business names for:
Industry/Product: "${inputs.industry || ''}"
Core Value Proposition: "${inputs.values || ''}"
Target Demographics: "${inputs.target || ''}"
Categorize names into:
- Modern & Tech-forward
- Evocative & Premium
- Short & Punchy (Compound or coined)
- Classic & Authoritative
Include domain availability suggestion / .com viability for top picks.`;
      break;

    case 'resume-summary':
      prompt = `Write 3 impactful Professional Resume Summaries for:
Job Title / Target Role: "${inputs.targetRole || ''}"
Years of Experience: ${inputs.experience || '5+ years'}
Core Strengths & Major Accomplishments: ${inputs.accomplishments || ''}
Include metric-driven phrasing and industry power verbs.`;
      break;

    case 'ad-copy':
      prompt = `Generate high-converting advertising copy for ${inputs.adPlatform || 'Google Ads & Facebook/Meta Ads'}.
Product/Service: "${inputs.product || ''}"
Key Benefit: "${inputs.benefit || ''}"
Special Offer / Promotion: "${inputs.offer || 'Free Trial / Limited Discount'}"
Target Demographic: "${inputs.audience || ''}"
Provide:
- 3 Facebook/Instagram Ads (Headline, Primary Text, Call To Action button)
- 3 Google Search Ads (30-char Headlines, 90-char Descriptions)`;
      break;

    case 'faq-generator':
      prompt = `Generate 10 comprehensive, realistic Frequently Asked Questions (FAQs) with helpful, authoritative answers for:
Business / Product / Topic: "${inputs.business || ''}"
Target Customer Concerns: ${inputs.concerns || 'Pricing, refund, onboarding, security, support'}
Format with clear Q&A and collapsible structure guidance.`;
      break;

    case 'content-ideas':
      prompt = `Brainstorm 20 viral, high-engagement content ideas for ${inputs.channel || 'Blog, YouTube, and LinkedIn'}.
Niche / Industry: "${inputs.niche || ''}"
Target Audience: "${inputs.audience || ''}"
Current Trends / Goals: "${inputs.goals || 'Grow followers and establish authority'}"
Categorize into: How-To Tutorials, Industry Debates, Case Studies, and Beginner Guides.`;
      break;

    case 'headline-generator':
      prompt = `Generate 20 irresistibly clickable headlines for:
Topic / Article: "${inputs.topic || ''}"
Target Audience: "${inputs.audience || ''}"
Angle: ${inputs.angle || 'Curiosity & High Value'}
Categorize by psychological triggers: How-To, Numbered List, Fear of Missing Out (FOMO), Bold Statement, and Question Headlines.`;
      break;

    // PREMIUM TOOLS (21-40)
    case 'long-form-article':
      systemInstruction += ` You are generating an exhaustive, masterclass long-form guide. Produce a deep, multi-chapter document with detailed explanations, real-world examples, actionable checklists, and comprehensive insights.`;
      prompt = `Write an in-depth, authoritative, comprehensive long-form article (up to ${maxWords} words) on:
Title: "${inputs.title || inputs.topic || ''}"
Primary Keyword: "${inputs.keyword || ''}"
Secondary Keywords: "${inputs.secondaryKeywords || ''}"
Target Audience: "${inputs.audience || 'Experienced practitioners'}"
Required Structure:
- Table of Contents
- Chapter 1: Introduction, Problem Scope, & Why This Matters Today
- Chapter 2: Fundamentals & Architectural Foundations
- Chapter 3: Step-by-Step Practical Implementation Guide
- Chapter 4: Advanced Strategies & Pro Tips
- Chapter 5: Common Pitfalls & How to Avoid Them
- Chapter 6: Case Studies & Quantitative Benchmarks
- Conclusion & Executive Action Checklist`;
      break;

    case 'seo-writer':
      prompt = `Write an advanced SEO pillar article optimized to rank #1 on Google.
Target Keyword: "${inputs.keyword || ''}"
Secondary/LSI Keywords: "${inputs.lsiKeywords || ''}"
Competitor Gaps to Address: "${inputs.gaps || 'Provide more actionable examples and structured data'}"
Include:
- SEO Meta Title & Meta Description recommendation
- Recommended H1, H2, H3 hierarchy
- Keyword Density strategy
- Comprehensive body content with semantic keywords bolded
- Schema Markup suggestion (Article or FAQPage JSON-LD snippet)`;
      break;

    case 'keyword-research':
      prompt = `Perform comprehensive AI keyword research for the seed keyword/niche: "${inputs.seedKeyword || ''}".
Provide a structured analysis containing:
1. Search Intent classification (Informational, Commercial, Transactional, Navigational)
2. Estimated Search Volume & Keyword Difficulty index (Low, Medium, High)
3. 15 High-Potential Long-Tail Keywords with search intent
4. Top 10 Question-Based Keywords ("How", "Why", "Can", "Best")
5. Content Pillar & Topic Cluster Strategy mapped to user journey`;
      break;

    case 'content-planner':
      prompt = `Create a complete 30-Day Content Marketing Master Plan.
Brand/Niche: "${inputs.brand || ''}"
Primary Goal: "${inputs.goal || 'Generate inbound leads and increase organic traffic'}"
Channels: "${inputs.channels || 'Blog, LinkedIn, YouTube, Twitter/X'}"
Provide:
- 4 Core Content Pillars
- Weekly Calendar Breakdown (Week 1 to Week 4, Day-by-Day schedule with content type, hook, and channel)
- Repurposing Matrix (how to turn 1 pillar piece into 10 micro-assets)`;
      break;

    case 'bulk-article':
      prompt = `Generate a batch of 3 comprehensive article outlines and core drafts for the following topics:
${inputs.topics || '1. AI in Healthcare\n2. AI in Financial Services\n3. AI in E-commerce'}
Target Tone: ${inputs.tone || 'Authoritative and insightful'}
For each topic, provide a complete draft with introduction, 3 major subsections, and key takeaways.`;
      break;

    case 'email-marketing':
      prompt = `Design a high-converting 5-part Automated Email Marketing Sequence.
Product/Offer: "${inputs.offer || ''}"
Target Audience: "${inputs.audience || ''}"
Sequence:
- Email 1: Welcome & Immediate Value Delivery (The Warm Welcome)
- Email 2: The Origin Story & Empathy (Overcoming the Common Struggle)
- Email 3: The Case Study / Social Proof (Concrete Transformation)
- Email 4: Overcoming the #1 Objection & FAQs
- Email 5: Urgency & Final Call to Action
For each email, provide: Subject Line (plus 2 A/B variations), Preview Text, Full Body Copy, and P.S. line.`;
      break;

    case 'business-plan':
      prompt = `Generate an investor-ready, comprehensive Business Plan for:
Company Name: "${inputs.companyName || 'NextGen Tech'}"
Industry & Model: "${inputs.industry || 'B2B SaaS'}"
Product Overview: "${inputs.productOverview || ''}"
Target Market & Revenue Model: "${inputs.revenueModel || 'Subscription tiers'}"
Required Sections:
1. Executive Summary
2. Company Description & Value Proposition
3. Market & Competitive Analysis (including SWOT Analysis)
4. Operations, Organization & Management Plan
5. Marketing & Sales Strategy
6. 3-Year Financial Model Projections (Revenue streams, COGS, Break-even point)
7. Funding Requirements & Capital Allocation`;
      break;

    case 'research-assistant':
      prompt = `Conduct a deep academic and market research synthesis on:
Research Question/Hypothesis: "${inputs.topic || ''}"
Specific Angles: "${inputs.scope || 'Methodologies, historical trends, future projections, counterarguments'}"
Format:
- Abstract & Executive Synthesis
- Theoretical Framework & Methodology Review
- Key Findings & Empirical Data Points
- Conflicting Evidence & Critical Discussion
- Future Research Roadmap & Practical Implications`;
      break;

    case 'pdf-summarizer':
      prompt = `You are an advanced document analyst. Synthesize and extract all key intelligence from the following document content:
Document Title / Source: "${inputs.docName || 'Uploaded Document'}"
Document Content / Transcript:
"""
${inputs.documentText || inputs.text || ''}
"""
Provide:
1. Executive Summary (250 words)
2. 10 Critical Insights & Data Points
3. Actionable Recommendations
4. Key Definitions & Terminology`;
      break;

    case 'chat-pdf':
      prompt = `You are an AI document interlocutor. Answer the user's specific question based on the provided document context.
Document Context:
"""
${inputs.documentText || inputs.context || ''}
"""
User Question: "${inputs.question || 'What are the main findings and conclusions of this document?'}"
Provide a clear, fact-checked response grounded directly in the text, citing relevant sections or quotes.`;
      break;

    case 'resume-builder':
      prompt = `Build a complete, ATS-compliant, executive-grade Resume.
Target Role: "${inputs.role || ''}"
Candidate Name & Contact Info: "${inputs.name || 'Alex Morgan'} | ${inputs.contact || 'alex@example.com'}"
Experience & Background:
"""
${inputs.experience || ''}
"""
Education & Certifications: "${inputs.education || ''}"
Key Skills: "${inputs.skills || ''}"
Output an organized, clean markdown resume with strong bullet points using Google's X-Y-Z formula ("Accomplished [X] as measured by [Y], by doing [Z]").`;
      break;

    case 'cover-letter':
      prompt = `Write a persuasive, tailored Cover Letter that captures attention immediately.
Applicant Name: "${inputs.applicantName || ''}"
Target Company: "${inputs.company || ''}"
Job Position: "${inputs.position || ''}"
Job Requirements: "${inputs.requirements || ''}"
Applicant Experience & Achievements: "${inputs.background || ''}"
Tone: ${inputs.tone || 'Professional, charismatic, and enthusiastic'}`;
      break;

    case 'text-to-speech':
      prompt = `You are preparing text for an audio voiceover and speech synthesis performance.
Input Script / Text:
"""
${inputs.text || ''}
"""
Voice Persona / Style: "${inputs.voice || 'Calm, authoritative narrator'}"
Pacing: "${inputs.pacing || 'Moderate and clear'}"
Task:
1. Provide a phonetically optimized, speech-ready voiceover script with pacing marks, breath pauses [pause: 0.5s], and emphasis markers (*word*).
2. Generate pronunciation guides for any technical terms.
3. Provide director notes on inflection, energy, and audio production recommendations.`;
      break;

    case 'image-generator':
      prompt = `You are a generative AI visual art director and prompt engineer.
Concept/Idea: "${inputs.prompt || ''}"
Style: "${inputs.style || 'Photorealistic cinematic 8K'}"
Aspect Ratio: "${inputs.aspectRatio || '16:9'}"
Lighting & Mood: "${inputs.lighting || 'Dramatic volumetric lighting, golden hour'}"
Provide:
1. Ultra-Detailed Master Image Generation Prompt (for Midjourney / Stable Diffusion / Gemini Imagen)
2. Negative Prompt (artifacts, bad anatomy, blur)
3. Technical Camera Specs (lens type, aperture, focal length, ISO, color grading)
4. Responsive SVG Vector Concept Illustration code snippet representing the core visual theme.`;
      break;

    case 'image-enhancer':
      prompt = `You are an AI image restoration and enhancement consultant.
Image Description / Problem: "${inputs.imageDescription || ''}"
Desired Enhancement: "${inputs.enhancementType || 'Upscale resolution, improve facial details, remove noise, correct color balance'}"
Provide:
1. Step-by-step restoration workflow
2. Optimized visual enhancement prompts and parameter settings
3. Color correction and contrast guidelines (LUTs, curves, shadows/highlights)
4. Prompt-engineered expansion for generating high-definition reimagined variations`;
      break;

    case 'social-calendar':
      prompt = `Generate a full 30-day cross-platform Social Media Editorial Calendar.
Industry/Niche: "${inputs.niche || ''}"
Key Campaigns: "${inputs.campaign || 'Product launch and thought leadership'}"
Platforms: "${inputs.platforms || 'LinkedIn, Twitter/X, Instagram'}"
For each week (Days 1 to 30), provide:
- Date / Day
- Platform
- Content Pillar
- Hook / Headline
- Caption Draft
- Media Asset Recommendation (Image, Carousel, Video, Poll)`;
      break;

    case 'grammar-assistant':
      prompt = `Perform an advanced linguistic and stylistic analysis on the following manuscript:
"""
${inputs.text || ''}
"""
Provide:
1. Polished Masterpiece Revision (improving rhythm, vocabulary, cadence, and conciseness)
2. Readability Analysis (Flesch-Kincaid grade level, passive vs. active voice ratio)
3. Sentence Variety & Tone Heatmap
4. Line-by-Line Micro-Critique highlighting replaced weak verbs and filler words`;
      break;

    case 'website-copy':
      prompt = `Write the complete, high-converting copy for a modern SaaS / Product Landing Page.
Product Name: "${inputs.productName || ''}"
Target Audience: "${inputs.targetAudience || ''}"
Core Problem Solved: "${inputs.problem || ''}"
Key Features & Benefits: "${inputs.features || ''}"
Required Sections:
1. Hero Section (Pre-header, Headline, Subheadline, Primary CTA, Secondary CTA, Social Proof banner)
2. Problem vs. Solution Section (Pain point agitation and relief)
3. 3 Core Feature Showcases (Headline, Paragraph, 3 Bullet points, Visual concept)
4. Social Proof & Metric Stats Section
5. Pricing Card Copy & Guarantees
6. 5 Interactive FAQ items
7. Final CTA Section (FOMO hook, button text, risk-reversal)`;
      break;

    case 'product-research':
      prompt = `Conduct a comprehensive Product Market Research and Competitive Gap Analysis.
Product Concept / Market: "${inputs.productConcept || ''}"
Primary Competitors: "${inputs.competitors || 'Existing market leaders'}"
Target Demographic: "${inputs.targetMarket || 'SMBs and enterprise buyers'}"
Provide:
1. Market Size & Growth Drivers (TAM, SAM, SOM analysis framework)
2. Customer Personas & Deep Pain Points
3. Competitor Feature Matrix & White Space Opportunities (unmet customer needs)
4. Unique Selling Proposition (USP) Formulation
5. Pricing Strategy & Packaging Recommendations`;
      break;

    case 'youtube-studio':
      prompt = `You are a YouTube viral growth strategist and creative director.
Channel Niche: "${inputs.channelNiche || ''}"
Upcoming Video Concept: "${inputs.concept || ''}"
Deliver a full YouTube Studio Launch Pack:
1. 5 Clickbait-Proof High-CTR Video Titles
2. 3 Viral Thumbnail Concepts (Visual composition, colors, facial expression, 3-word bold overlay text)
3. 15-Second Retention Hook (Exact verbatim script to guarantee high retention)
4. Full Video Script Outline with B-roll direction
5. SEO Strategy (Description, 15 High-Volume Tags, Pinned Comment question to drive 500+ comments)`;
      break;

    default:
      prompt = `You are an AI assistant. Please fulfill the following request using the provided inputs:
Tool: ${toolName}
Inputs:
${JSON.stringify(inputs, null, 2)}`;
      break;
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI generation request timed out after 25 seconds. Please try again.')), 25000)
    );

    const response = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
        },
      }),
      timeoutPromise,
    ]);

    const text = response.text || 'No response generated. Please try again.';
    const words = text.trim().split(/\s+/).filter(Boolean).length;

    return {
      text,
      wordCount: words,
    };
  } catch (error: any) {
    console.error('Gemini API execution error:', error);
    let msg = error?.message || 'Failed to generate response with Gemini AI.';
    if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
      msg = 'Invalid Gemini API key. Please verify your GEMINI_API_KEY in the Settings > Secrets panel.';
    } else if (msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
      msg = 'Gemini API permission denied. Please verify your API key in Settings > Secrets.';
    } else if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
      msg = 'Gemini API rate limit or quota exceeded (429). Please wait a moment before trying again.';
    }
    throw new Error(msg);
  }
}
