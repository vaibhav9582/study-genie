import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, Upload as UploadIcon, FileText, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a PDF file",
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      toast({
        title: "Invalid file",
        description: "Please drop a PDF file",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(10);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setProgress(30);

      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("pdfs")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setProgress(60);

      // Create database record
      const { data: pdfData, error: dbError } = await supabase
        .from("uploaded_pdfs")
        .insert({
          user_id: session.user.id,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          upload_status: "processing",
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setProgress(80);

      // Call edge function to process PDF
      const { error: processError } = await supabase.functions.invoke("process-pdf", {
        body: { pdfId: pdfData.id, filePath: fileName },
      });

      if (processError) throw processError;

      setProgress(100);

      toast({
        title: "Success!",
        description: "Your PDF is being processed by AI",
      });

      setTimeout(() => {
        navigate(`/output/${pdfData.id}`);
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              StudyGenie
            </h1>
          </div>
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4">Upload Your Study Notes</h2>
          <p className="text-xl text-muted-foreground">
            Drop your PDF and let AI create summaries, quizzes, and more
          </p>
        </div>

        <Card className="bg-gradient-card shadow-glow">
          <CardContent className="p-8">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="space-y-4">
                  <FileText className="h-16 w-16 mx-auto text-primary" />
                  <div>
                    <p className="text-lg font-semibold">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    Choose Different File
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <UploadIcon className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-lg font-semibold mb-2">
                      Drop your PDF here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Maximum file size: 20MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {uploading && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  {progress < 50
                    ? "Uploading file..."
                    : progress < 80
                    ? "Extracting text..."
                    : "Generating AI content..."}
                </p>
              </div>
            )}

            {file && !uploading && (
              <Button
                size="lg"
                className="w-full mt-6 bg-gradient-primary hover:opacity-90 shadow-glow"
                onClick={handleUpload}
              >
                <UploadIcon className="h-5 w-5 mr-2" />
                Upload and Process with AI
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {[
            { title: "Fast Processing", desc: "Results in seconds" },
            { title: "Smart AI", desc: "Powered by Gemini" },
            { title: "Multiple Formats", desc: "Summaries, quizzes & more" },
          ].map((item, i) => (
            <Card key={i} className="text-center p-4 bg-gradient-card">
              <p className="font-semibold mb-1">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Upload;