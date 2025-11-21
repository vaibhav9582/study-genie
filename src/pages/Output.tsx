import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InteractiveQuiz } from "@/components/InteractiveQuiz";
import { Navigation } from "@/components/Navigation";

interface AIOutput {
  summary?: { short: string; long: string; bullets: string[] };
  quiz?: { mcqs: any[]; trueFalse: any[]; shortQuestions: any[] };
  questions?: { five_mark: string[]; ten_mark: string[]; fifteen_mark: string[] };
  flashcards?: { term: string; definition: string; concept: string }[];
}

interface UserAnswers {
  [key: string]: string | boolean;
}

const Output = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pdf, setPdf] = useState<any>(null);
  const [outputs, setOutputs] = useState<AIOutput>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [showResults, setShowResults] = useState(false);

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

      // Auto-generate all content if none exists
      if (!aiData || aiData.length === 0) {
        toast({
          title: "Generating AI content...",
          description: "Please wait while we create your study materials",
        });
        
        // Generate all content types
        await Promise.all([
          generateContent("summary"),
          generateContent("quiz"),
          generateContent("questions"),
          generateContent("flashcards")
        ]);
      }
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
    if (generating) return;
    
    setGenerating(type);
    try {
      const { error } = await supabase.functions.invoke("generate-ai-content", {
        body: { pdfId: id, outputType: type },
      });

      if (error) throw error;

      toast({
        title: "Generated!",
        description: `${type} created successfully`,
      });

      // Reload just this content type
      const { data: aiData } = await supabase
        .from("ai_outputs")
        .select("*")
        .eq("pdf_id", id)
        .eq("output_type", type)
        .single();

      if (aiData) {
        setOutputs(prev => ({
          ...prev,
          [type]: aiData.content
        }));
      }
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

  const handleAnswerChange = (questionId: string, answer: string | boolean) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const submitQuiz = () => {
    setShowResults(true);
    let correct = 0;
    let total = 0;

    // Count MCQ answers
    outputs.quiz?.mcqs?.forEach((q, i) => {
      total++;
      if (userAnswers[`mcq-${i}`] === q.answer) correct++;
    });

    // Count True/False answers
    outputs.quiz?.trueFalse?.forEach((q, i) => {
      total++;
      if (userAnswers[`tf-${i}`] === q.answer) correct++;
    });

    toast({
      title: "Quiz Submitted!",
      description: `You got ${correct} out of ${total} correct!`,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ 
      title: "Copied!", 
      description: "Content copied to clipboard" 
    });
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
      <Navigation />

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">{pdf?.file_name}</h2>
          <p className="text-xl text-muted-foreground">AI-generated study materials ready for you</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 mb-10 h-14 bg-muted/50 p-1.5 rounded-xl border-2">
            <TabsTrigger value="summary" className="text-base font-semibold data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">Summary</TabsTrigger>
            <TabsTrigger value="quiz" className="text-base font-semibold data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">Quiz</TabsTrigger>
            <TabsTrigger value="questions" className="text-base font-semibold data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">Questions</TabsTrigger>
            <TabsTrigger value="flashcards" className="text-base font-semibold data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">Flashcards</TabsTrigger>
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
                <Card className="bg-gradient-card border-2">
                  <CardHeader>
                    <CardTitle className="text-2xl">Detailed Summary</CardTitle>
                    <CardDescription>Comprehensive overview with headings and sections</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-lg max-w-none">
                      {outputs.summary.long.split('\n').map((paragraph, i) => {
                        if (paragraph.startsWith('## ')) {
                          return <h2 key={i} className="text-2xl font-bold mt-6 mb-3 text-primary">{paragraph.substring(3)}</h2>;
                        }
                        return paragraph.trim() ? <p key={i} className="mb-4 text-foreground leading-relaxed">{paragraph}</p> : null;
                      })}
                    </div>
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
              <InteractiveQuiz
                mcqs={outputs.quiz.mcqs || []}
                trueFalse={outputs.quiz.trueFalse || []}
                userAnswers={userAnswers}
                showResults={showResults}
                onAnswerChange={handleAnswerChange}
                onSubmit={submitQuiz}
              />
            ) : (
              <Card className="bg-gradient-card">
                <CardContent className="p-12 text-center">
                  <p className="mb-4 text-muted-foreground">
                    {generating === "quiz" ? "Generating quizzes from your PDF..." : "No quizzes generated yet"}
                  </p>
                  {generating !== "quiz" && (
                    <Button
                      onClick={() => generateContent("quiz")}
                      disabled={generating !== null}
                      className="bg-gradient-primary hover:opacity-90"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate Quizzes
                    </Button>
                  )}
                  {generating === "quiz" && (
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  )}
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
