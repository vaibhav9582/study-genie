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
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      toast({
        title: "Invalid file",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      return;
    }

    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > 8) {
      toast({
        title: "File too large",
        description: `File size is ${fileSizeMB.toFixed(2)} MB. Please upload a file under 8 MB.`,
        variant: "destructive",
      });
      return;
    }

    if (fileSizeMB > 6) {
      toast({
        title: "Large file detected",
        description: `File is ${fileSizeMB.toFixed(2)} MB. Processing may take a bit longer.`,
      });
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    if (droppedFile.type !== "application/pdf") {
      toast({
        title: "Invalid file",
        description: "Please drop a PDF file",
        variant: "destructive",
      });
      return;
    }

    const fileSizeMB = droppedFile.size / (1024 * 1024);
    if (fileSizeMB > 8) {
      toast({
        title: "File too large",
        description: `File size is ${fileSizeMB.toFixed(2)} MB. Please upload a file under 8 MB.`,
        variant: "destructive",
      });
      return;
    }

    if (fileSizeMB > 6) {
      toast({
        title: "Large file detected",
        description: `File is ${fileSizeMB.toFixed(2)} MB. Processing may take a bit longer.`,
      });
    }

    setFile(droppedFile);
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
      <nav className="border-b-2 border-border bg-background/95 backdrop-blur shadow-sm">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-extrabold bg-gradient-primary bg-clip-text text-transparent tracking-tight">
              StudyGenie
            </h1>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")} className="font-semibold border-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">Upload Your Study Material</h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload a PDF and let AI generate comprehensive study materials in seconds
          </p>
        </div>

        <Card className="shadow-glow border-2 bg-gradient-card">
          <CardContent className="p-8">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className={`border-3 border-dashed rounded-2xl p-16 text-center transition-all duration-300 cursor-pointer ${
                file ? "border-primary bg-primary/10 shadow-inner" : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
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
                  <div className="h-20 w-20 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg">
                    <FileText className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold mb-2">{file.name}</p>
                    <p className="text-base text-muted-foreground font-medium">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="mt-4"
                  >
                    Choose Different File
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-20 w-20 mx-auto mb-6 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg">
                    <UploadIcon className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <p className="text-2xl font-bold mb-3">
                    Drop your PDF here or click to browse
                  </p>
                  <p className="text-base text-muted-foreground font-medium">
                    Best results: Under 6 MB • Maximum: 8 MB
                  </p>
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