import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, ArrowLeft, Copy, Download, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIOutput {
  summary?: { short: string; long: string; bullets: string[] };
  quiz?: { mcqs: any[]; trueFalse: any[]; shortQuestions: any[] };
  questions?: { five_mark: string[]; ten_mark: string[]; fifteen_mark: string[] };
  flashcards?: { term: string; definition: string; concept: string }[];
}

const Output = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pdf, setPdf] = useState<any>(null);
  const [outputs, setOutputs] = useState<AIOutput>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load PDF data
      const { data: pdfData, error: pdfError } = await supabase
        .from("uploaded_pdfs")
        .select("*")
        .eq("id", id)
        .single();

      if (pdfError) throw pdfError;
      setPdf(pdfData);

      // Load AI outputs
      const { data: aiData, error: aiError } = await supabase
        .from("ai_outputs")
        .select("*")
        .eq("pdf_id", id);

      if (aiError) throw aiError;

      const outputMap: AIOutput = {};
      aiData?.forEach((output) => {
        outputMap[output.output_type as keyof AIOutput] = output.content as any;
      });
      setOutputs(outputMap);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async (type: string) => {
    setGenerating(type);
    try {
      const { error } = await supabase.functions.invoke("generate-ai-content", {
        body: { pdfId: id, outputType: type },
      });

      if (error) throw error;

      toast({
        title: "Generated!",
        description: `${type} has been created`,
      });

      await loadData();
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Content copied to clipboard" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">{pdf?.file_name}</h2>
          <p className="text-muted-foreground">
            AI-generated study materials from your PDF
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="quiz">Quizzes</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            {outputs.summary ? (
              <div className="space-y-4">
                <Card className="bg-gradient-card">
                  <CardHeader>
                    <CardTitle>Short Summary</CardTitle>
                    <CardDescription>Quick overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">{outputs.summary.short}</p>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(outputs.summary!.short)}>
                        <Copy className="h-4 w-4 mr-1" /> Copy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-card">
                  <CardHeader>
                    <CardTitle>Detailed Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap">{outputs.summary.long}</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-gradient-card">
                <CardContent className="p-12 text-center">
                  <p className="mb-4 text-muted-foreground">No summary generated yet</p>
                  <Button
                    onClick={() => generateContent("summary")}
                    disabled={generating === "summary"}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    {generating === "summary" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Generate Summary
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent value="quiz" className="space-y-4">
            {outputs.quiz ? (
              <div className="space-y-4">
                <Card className="bg-gradient-card">
                  <CardHeader>
                    <CardTitle>Multiple Choice Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {outputs.quiz.mcqs?.map((q: any, i: number) => (
                        <div key={i} className="p-4 border border-border rounded-lg">
                          <p className="font-semibold mb-2">{i + 1}. {q.question}</p>
                          <div className="space-y-1 ml-4">
                            {q.options?.map((opt: string, j: number) => (
                              <p key={j} className={opt === q.answer ? "text-success font-medium" : ""}>
                                {String.fromCharCode(65 + j)}. {opt}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-gradient-card">
                <CardContent className="p-12 text-center">
                  <p className="mb-4 text-muted-foreground">No quizzes generated yet</p>
                  <Button
                    onClick={() => generateContent("quiz")}
                    disabled={generating === "quiz"}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    {generating === "quiz" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Generate Quizzes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-4">
            {outputs.questions ? (
              <div className="space-y-4">
                <Card className="bg-gradient-card">
                  <CardHeader>
                    <CardTitle>5 Mark Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="list-decimal list-inside space-y-2">
                      {outputs.questions.five_mark?.map((q: string, i: number) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-gradient-card">
                <CardContent className="p-12 text-center">
                  <p className="mb-4 text-muted-foreground">No questions generated yet</p>
                  <Button
                    onClick={() => generateContent("questions")}
                    disabled={generating === "questions"}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    {generating === "questions" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Generate Questions
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Flashcards Tab */}
          <TabsContent value="flashcards" className="space-y-4">
            {outputs.flashcards ? (
              <div className="grid md:grid-cols-2 gap-4">
                {outputs.flashcards.map((card: any, i: number) => (
                  <Card key={i} className="bg-gradient-card hover:shadow-lg transition-all">
                    <CardHeader>
                      <CardTitle className="text-lg">{card.term}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-2"><strong>Definition:</strong> {card.definition}</p>
                      <p className="text-sm text-muted-foreground">{card.concept}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-gradient-card">
                <CardContent className="p-12 text-center">
                  <p className="mb-4 text-muted-foreground">No flashcards generated yet</p>
                  <Button
                    onClick={() => generateContent("flashcards")}
                    disabled={generating === "flashcards"}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    {generating === "flashcards" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Generate Flashcards
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Output;