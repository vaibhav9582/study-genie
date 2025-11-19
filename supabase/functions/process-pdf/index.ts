import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfId, filePath } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Downloading PDF from storage...');
    
    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('pdfs')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw downloadError;
    }

    // Convert PDF to base64 for Gemini API
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Pdf = encodeBase64(new Uint8Array(arrayBuffer));
    
    console.log('Sending PDF to Gemini API for extraction...');

    // Use Gemini API to extract text from PDF
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: 'Extract all text content from this PDF document. Return only the extracted text, maintaining the original structure and formatting as much as possible.'
              },
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: base64Pdf
                }
              }
            ]
          }]
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const extractedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                         'Unable to extract text from PDF';
    
    console.log('Text extracted successfully, length:', extractedText.length);

    // Update database with extracted text
    const { error: updateError } = await supabaseClient
      .from('uploaded_pdfs')
      .update({ 
        extracted_text: extractedText,
        upload_status: 'completed'
      })
      .eq('id', pdfId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    console.log('PDF processed successfully:', pdfId);

    return new Response(
      JSON.stringify({ success: true, message: 'PDF processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing PDF:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});