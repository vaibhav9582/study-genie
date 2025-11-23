import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload as UploadIcon, FileText, Sparkles, Brain, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { PDFDocument } from "pdf-lib";
import { motion } from "framer-motion";

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const compressPDF = async (file: File): Promise<File> => {
    try {
      setCompressing(true);
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Save with compression
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      const compressedFile = new File([pdfBytes as BlobPart], file.name, {
        type: "application/pdf",
      });

      setCompressing(false);
      return compressedFile;
    } catch (error) {
      console.error("Compression error:", error);
      setCompressing(false);
      // Return original file if compression fails
      return file;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (fileSizeMB > 100) {
      toast({
        title: "File too large",
        description: `File size is ${fileSizeMB.toFixed(2)} MB. Maximum allowed is 100 MB.`,
        variant: "destructive",
      });
      return;
    }

    // Compress if file is larger than 8MB
    let fileToUse = selectedFile;
    if (fileSizeMB > 8) {
      toast({
        title: "Compressing PDF",
        description: "Your file is being compressed for optimal processing...",
      });
      fileToUse = await compressPDF(selectedFile);
      
      const compressedSizeMB = fileToUse.size / (1024 * 1024);
      if (compressedSizeMB > 8) {
        toast({
          title: "File still too large",
          description: "Even after compression, the file is too large. Please use a smaller PDF.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Compression complete",
        description: `File compressed from ${fileSizeMB.toFixed(2)} MB to ${compressedSizeMB.toFixed(2)} MB`,
      });
    }

    setFile(fileToUse);
    
    toast({
      title: "File selected",
      description: `${fileToUse.name} is ready to upload`,
    });
  };

  const handleDrop = async (e: React.DragEvent) => {
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
    if (fileSizeMB > 100) {
      toast({
        title: "File too large",
        description: `File size is ${fileSizeMB.toFixed(2)} MB. Maximum allowed is 100 MB.`,
        variant: "destructive",
      });
      return;
    }

    // Compress if file is larger than 8MB
    let fileToUse = droppedFile;
    if (fileSizeMB > 8) {
      toast({
        title: "Compressing PDF",
        description: "Your file is being compressed for optimal processing...",
      });
      fileToUse = await compressPDF(droppedFile);
      
      const compressedSizeMB = fileToUse.size / (1024 * 1024);
      if (compressedSizeMB > 8) {
        toast({
          title: "File still too large",
          description: "Even after compression, the file is too large. Please use a smaller PDF.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Compression complete",
        description: `File compressed from ${fileSizeMB.toFixed(2)} MB to ${compressedSizeMB.toFixed(2)} MB`,
      });
    }

    setFile(fileToUse);
    
    toast({
      title: "File selected",
      description: `${fileToUse.name} is ready to upload`,
    });
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
        title: "Upload successful! 🎉",
        description: "AI is now generating your study materials. Redirecting...",
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
      <Navigation />

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
              onClick={() => !compressing && !uploading && document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={compressing || uploading}
              />
              
              {compressing && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full mx-auto"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    >
                      <FileText className="h-6 w-6 text-primary" />
                    </motion.div>
                  </div>
                  <p className="text-xl font-bold">Compressing PDF...</p>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we optimize your file
                  </p>
                </motion.div>
              )}

              {!compressing && file && (
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
              )}
              
              {!compressing && !file && (
                <div className="space-y-4">
                  <div className="h-20 w-20 mx-auto mb-6 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg">
                    <UploadIcon className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <p className="text-2xl font-bold mb-3">
                    Drop your PDF here or click to browse
                  </p>
                  <p className="text-base text-muted-foreground font-medium">
                    Maximum: 100 MB (files over 8 MB will be compressed)
                  </p>
                </div>
              )}
            </div>

            {uploading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-4"
              >
                <div className="relative p-6 bg-gradient-primary/10 rounded-xl border-2 border-primary/20">
                  <div className="flex items-center justify-center mb-4">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="mr-3"
                    >
                      <Brain className="h-8 w-8 text-primary" />
                    </motion.div>
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Sparkles className="h-6 w-6 text-primary" />
                    </motion.div>
                    <motion.div
                      animate={{ 
                        x: [0, 10, 0],
                        opacity: [1, 0.5, 1]
                      }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="ml-3"
                    >
                      <Zap className="h-6 w-6 text-primary" />
                    </motion.div>
                  </div>
                  
                  <p className="text-xl font-bold text-center mb-3">
                    {progress < 50
                      ? "Uploading your file..."
                      : progress < 80
                      ? "Extracting knowledge..."
                      : "AI is generating magic..."}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  <motion.p 
                    key={progress}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-muted-foreground text-center mt-3"
                  >
                    {progress < 30 && "Uploading to secure storage..."}
                    {progress >= 30 && progress < 60 && "Analyzing PDF structure..."}
                    {progress >= 60 && progress < 80 && "Extracting text content..."}
                    {progress >= 80 && "Creating your study materials..."}
                  </motion.p>
                </div>
              </motion.div>
            )}

            {file && !uploading && !compressing && (
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
