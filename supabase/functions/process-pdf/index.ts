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
    const fileSizeMB = arrayBuffer.byteLength / (1024 * 1024);
    console.log(`PDF size: ${fileSizeMB.toFixed(2)} MB`);

    let extractedText: string | null = null;

    // Only use Gemini API for smaller files (< 5MB) to avoid memory issues
    if (fileSizeMB < 5) {
      const base64Pdf = encodeBase64(new Uint8Array(arrayBuffer));
      
      console.log('Sending PDF to Gemini API for extraction...');

      try {
        // Use Gemini API to extract text from PDF
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const parts = geminiData.candidates?.[0]?.content?.parts ?? [];
          extractedText = parts
            .map((p: any) => p.text ?? '')
            .join('\n')
            .trim();
        } else {
          const errorText = await geminiResponse.text();
          console.error('Gemini API error:', geminiResponse.status, errorText);
        }
      } catch (geminiError) {
        console.error('Gemini request failed:', geminiError);
      }
    } else {
      console.log(`PDF too large (${fileSizeMB.toFixed(2)} MB), skipping Gemini extraction...`);
    }

    // Fallback: basic text extraction if Gemini failed or file too large
    if (!extractedText) {
      console.log('Using basic text extraction...');
      const decoder = new TextDecoder('utf-8', { fatal: false });
      let textContent = decoder.decode(arrayBuffer);

      textContent = textContent
        .replace(/\0/g, '')
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
        .trim();

      // Take a reasonable sample from large files
      const maxChars = 50000;
      extractedText = textContent.slice(0, maxChars) ||
        'Unable to extract readable text from PDF. The file may be image-based, corrupted, or too large.';
      
      if (textContent.length > maxChars) {
        extractedText += `\n\n[Note: This is a large PDF. Only the first ${maxChars} characters were extracted for processing.]`;
      }
    }

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