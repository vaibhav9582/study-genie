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

    // Check file size before processing
    const blobSize = (fileData as Blob).size ?? 0;
    const fileSizeMB = blobSize / (1024 * 1024);
    console.log(`PDF size: ${fileSizeMB.toFixed(2)} MB`);

    const MAX_BYTES_ALLOWED = 15 * 1024 * 1024; // 15 MB absolute maximum
    const OPTIMAL_SIZE = 8 * 1024 * 1024; // 8 MB optimal for best results

    if (blobSize === 0) {
      throw new Error('Downloaded empty PDF file');
    }

    if (blobSize > MAX_BYTES_ALLOWED) {
      console.error('PDF too large for processing:', fileSizeMB, 'MB');

      await supabaseClient
        .from('uploaded_pdfs')
        .update({
          extracted_text: null,
          upload_status: 'failed'
        })
        .eq('id', pdfId);

      return new Response(
        JSON.stringify({ error: `PDF too large (${fileSizeMB.toFixed(2)} MB). Please upload a file under 15 MB for best results.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let extractedText: string | null = null;

    // Read entire file into memory, but only send first 8MB to Gemini if larger
    const arrayBuffer = await fileData.arrayBuffer();
    const geminiBuffer = arrayBuffer.byteLength > OPTIMAL_SIZE
      ? arrayBuffer.slice(0, OPTIMAL_SIZE)
      : arrayBuffer;

    console.log(`Processing ${geminiBuffer.byteLength} bytes (${(geminiBuffer.byteLength / (1024 * 1024)).toFixed(2)} MB) with Gemini...`);

    try {
      const base64Pdf = encodeBase64(new Uint8Array(geminiBuffer));
      console.log('Sending PDF to Gemini API for extraction...');

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
        
        // Add note if we only processed part of the file
        if (arrayBuffer.byteLength > OPTIMAL_SIZE) {
          extractedText += '\n\n[Note: This is a large PDF. Only the first 8 MB was processed for text extraction.]';
        }
      } else {
        const errorText = await geminiResponse.text();
        console.error('Gemini API error:', geminiResponse.status, errorText);
      }
    } catch (geminiError) {
      console.error('Gemini request failed:', geminiError);
    }

    if (!extractedText || extractedText.trim().length === 0) {
      console.error('No readable text extracted from PDF');

      await supabaseClient
        .from('uploaded_pdfs')
        .update({
          extracted_text: null,
          upload_status: 'failed'
        })
        .eq('id', pdfId);

      return new Response(
        JSON.stringify({
          error: 'Could not extract readable text from this PDF. Please upload a text-based PDF (not scanned images) under 15 MB.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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