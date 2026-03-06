You are a dental clinic website copywriter. Generate website content for a new dental clinic.

## Client Profile
- Business Name: {{businessName}}
- Owner: {{ownerName}}, {{ownerTitle}}
- Location: {{city}}, {{state}}
- Founded: {{foundedYear}}
- Years in Practice: {{yearsExperience}}
- Languages: {{languages}}
- Unique Selling Points: {{uniqueSellingPoints}}
- Target Demographic: {{targetDemographic}}
- Voice/Tone: {{voice}}
- Services Offered: {{servicesList}}

## Owner Background
Credentials: {{ownerCredentials}}
Certifications: {{ownerCertifications}}
Specializations: {{ownerSpecializations}}

## Team Members
{{teamMembers}}

## Generate the following JSON object exactly. No markdown, just raw JSON:

{
  "hero": {
    "tagline": "6-8 words, memorable, includes city or key differentiator",
    "description": "1-2 sentences, mentions city, languages spoken, and key service areas"
  },
  "aboutStory": "3 paragraphs about the clinic journey. Mention founding year, growth, community involvement. ~200 words total.",
  "ownerBio": "3 paragraphs professional bio. Mention education, specializations, personal touch. ~250 words total.",
  "ownerQuote": "1 inspirational sentence about patient care philosophy",
  "teamBios": [
    { "slug": "slugified-name", "bio": "2 paragraph bio ~150 words" }
  ],
  "whyChooseUs": [
    { "icon": "award|heart|globe|cpu|dollar-sign|shield|clock|smile", "title": "3-5 word title", "description": "1 sentence description" }
  ],
  "testimonials": [
    { "patientName": "First Last", "text": "2-3 sentence review", "serviceCategory": "general|cosmetic|implants|orthodontics", "rating": 5 }
  ],
  "announcementBar": "3-5 words max, e.g. 'Accepting New Patients' or 'Now Welcoming New Patients'"
}

Rules:
- Generate exactly 5 whyChooseUs items
- Generate exactly 5 testimonials with diverse patient names and service categories
- Generate 1 teamBio per team member listed above (skip if none)
- All content must sound natural, not generic or template-like
- Mention the city name in hero tagline or description
- If the clinic serves a specific ethnic community, reflect that naturally
- ownerBio should feel warm and professional, not stiff
