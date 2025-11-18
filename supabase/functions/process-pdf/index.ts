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
    const { pdfId, filePath } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('pdfs')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw downloadError;
    }

    // Convert PDF to text (simplified - in production, use a proper PDF parser)
    // For now, we'll just extract basic text representation
    const arrayBuffer = await fileData.arrayBuffer();
    const textContent = new TextDecoder().decode(arrayBuffer);
    
    // Extract a sample of text (in production, use proper PDF parsing library)
    const extractedText = textContent.slice(0, 5000); // First 5000 chars as sample

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