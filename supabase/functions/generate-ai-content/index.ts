import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfId, outputType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get PDF data
    const { data: pdfData, error: pdfError } = await supabaseClient
      .from('uploaded_pdfs')
      .select('*')
      .eq('id', pdfId)
      .single();

    if (pdfError) throw pdfError;

    const extractedText = pdfData.extracted_text;

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No extracted text found for this PDF. Please wait for processing to finish or re-upload the file.');
    }


    let systemPrompt = '';
    let userPrompt = '';

    // Define prompts based on output type
    switch (outputType) {
      case 'summary':
        systemPrompt = 'You are an expert at creating educational summaries. Generate clear, concise summaries from study materials. IMPORTANT: Return ONLY valid JSON, no markdown formatting, no extra text.';
        userPrompt = `Create a summary from this text with:
1. A short summary (2-3 sentences)
2. A long detailed summary (5-7 sentences)
3. Key bullet points (5-7 points)

Text: ${extractedText.slice(0, 3000)}

Return ONLY this JSON format (no markdown, no extra text):
{
  "short": "...",
  "long": "...",
  "bullets": ["...", "..."]
}`;
        break;

      case 'quiz':
        systemPrompt = 'You are an expert at creating educational quizzes and assessments. IMPORTANT: Return ONLY valid JSON, no markdown formatting, no extra text.';
        userPrompt = `Generate a quiz from this text:
1. 5 multiple choice questions with 4 options each and the correct answer
2. 5 true/false questions with answers
3. 3 short answer questions

Text: ${extractedText.slice(0, 3000)}

Return ONLY this JSON format (no markdown, no extra text):
{
  "mcqs": [{"question": "...", "options": ["a", "b", "c", "d"], "answer": "a"}],
  "trueFalse": [{"question": "...", "answer": true}],
  "shortQuestions": ["Question 1?", "Question 2?"]
}`;
        break;

      case 'questions':
        systemPrompt = 'You are an expert at creating exam questions for students. IMPORTANT: Return ONLY valid JSON, no markdown formatting, no extra text.';
        userPrompt = `Generate important exam questions from this text:
1. 5 questions worth 5 marks each
2. 3 questions worth 10 marks each
3. 2 questions worth 15 marks each

Text: ${extractedText.slice(0, 3000)}

Return ONLY this JSON format (no markdown, no extra text):
{
  "five_mark": ["Q1...", "Q2..."],
  "ten_mark": ["Q1...", "Q2..."],
  "fifteen_mark": ["Q1...", "Q2..."]
}`;
        break;

      case 'flashcards':
        systemPrompt = 'You are an expert at creating educational flashcards for study and revision. IMPORTANT: Return ONLY valid JSON, no markdown formatting, no extra text.';
        userPrompt = `Create 10 flashcards from this text. Each flashcard should have:
- A term/concept name
- A clear definition
- A brief explanation of the concept

Text: ${extractedText.slice(0, 3000)}

Return ONLY this JSON format (no markdown, no extra text):
{
  "flashcards": [
    {"term": "...", "definition": "...", "concept": "..."}
  ]
}`;
        break;

      default:
        throw new Error('Invalid output type');
    }

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received, parsing content...');
    
    let content;
    try {
      const rawContent = aiData.choices[0].message.content;
      console.log('Raw AI content (first 500 chars):', rawContent?.substring(0, 500));
      content = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed to parse content:', aiData.choices[0].message.content);
      throw new Error('Failed to parse AI response. The AI returned invalid JSON format.');
    }

    // Store in database
    const { error: insertError } = await supabaseClient
      .from('ai_outputs')
      .insert({
        pdf_id: pdfId,
        user_id: pdfData.user_id,
        output_type: outputType,
        content: outputType === 'flashcards' ? content.flashcards : content
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('AI content generated successfully:', outputType);

    return new Response(
      JSON.stringify({ success: true, content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating AI content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});