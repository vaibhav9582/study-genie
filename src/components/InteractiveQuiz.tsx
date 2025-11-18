import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";

interface QuizProps {
  mcqs: Array<{
    question: string;
    options: string[];
    answer: string;
  }>;
  trueFalse: Array<{
    question: string;
    answer: boolean;
  }>;
  userAnswers: { [key: string]: string | boolean };
  showResults: boolean;
  onAnswerChange: (questionId: string, answer: string | boolean) => void;
  onSubmit: () => void;
}

export const InteractiveQuiz = ({
  mcqs,
  trueFalse,
  userAnswers,
  showResults,
  onAnswerChange,
  onSubmit
}: QuizProps) => {
  return (
    <div className="space-y-6">
      {/* MCQs */}
      {mcqs && mcqs.length > 0 && (
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Multiple Choice Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {mcqs.map((q, i) => {
              const questionId = `mcq-${i}`;
              const userAnswer = userAnswers[questionId];
              const isCorrect = showResults && userAnswer === q.answer;
              const isWrong = showResults && userAnswer && userAnswer !== q.answer;

              return (
                <div key={i} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start gap-2 mb-3">
                    <p className="font-semibold flex-1">
                      {i + 1}. {q.question}
                    </p>
                    {showResults && (
                      <>
                        {isCorrect && <CheckCircle className="h-5 w-5 text-success" />}
                        {isWrong && <XCircle className="h-5 w-5 text-destructive" />}
                      </>
                    )}
                  </div>
                  <RadioGroup
                    value={userAnswer as string}
                    onValueChange={(value) => onAnswerChange(questionId, value)}
                    disabled={showResults}
                  >
                    {q.options?.map((opt, j) => {
                      const optionLetter = String.fromCharCode(65 + j);
                      const isThisCorrect = showResults && opt === q.answer;
                      const isThisSelected = userAnswer === opt;

                      return (
                        <div
                          key={j}
                          className={`flex items-center space-x-2 p-2 rounded ${
                            showResults && isThisCorrect
                              ? "bg-success/10 border border-success"
                              : showResults && isThisSelected && !isThisCorrect
                              ? "bg-destructive/10 border border-destructive"
                              : ""
                          }`}
                        >
                          <RadioGroupItem value={opt} id={`${questionId}-${j}`} />
                          <Label htmlFor={`${questionId}-${j}`} className="flex-1 cursor-pointer">
                            {optionLetter}. {opt}
                          </Label>
                          {showResults && isThisCorrect && (
                            <span className="text-success text-sm font-medium">Correct Answer</span>
                          )}
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* True/False */}
      {trueFalse && trueFalse.length > 0 && (
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>True or False</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trueFalse.map((q, i) => {
              const questionId = `tf-${i}`;
              const userAnswer = userAnswers[questionId];
              const isCorrect = showResults && userAnswer === q.answer;
              const isWrong = showResults && userAnswer !== undefined && userAnswer !== q.answer;

              return (
                <div key={i} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start gap-2 mb-3">
                    <p className="font-semibold flex-1">
                      {i + 1}. {q.question}
                    </p>
                    {showResults && (
                      <>
                        {isCorrect && <CheckCircle className="h-5 w-5 text-success" />}
                        {isWrong && <XCircle className="h-5 w-5 text-destructive" />}
                      </>
                    )}
                  </div>
                  <RadioGroup
                    value={userAnswer?.toString()}
                    onValueChange={(value) => onAnswerChange(questionId, value === "true")}
                    disabled={showResults}
                  >
                    <div
                      className={`flex items-center space-x-2 p-2 rounded ${
                        showResults && q.answer === true
                          ? "bg-success/10 border border-success"
                          : showResults && userAnswer === true && q.answer === false
                          ? "bg-destructive/10 border border-destructive"
                          : ""
                      }`}
                    >
                      <RadioGroupItem value="true" id={`${questionId}-true`} />
                      <Label htmlFor={`${questionId}-true`} className="flex-1 cursor-pointer">
                        True
                      </Label>
                      {showResults && q.answer === true && (
                        <span className="text-success text-sm font-medium">Correct</span>
                      )}
                    </div>
                    <div
                      className={`flex items-center space-x-2 p-2 rounded ${
                        showResults && q.answer === false
                          ? "bg-success/10 border border-success"
                          : showResults && userAnswer === false && q.answer === true
                          ? "bg-destructive/10 border border-destructive"
                          : ""
                      }`}
                    >
                      <RadioGroupItem value="false" id={`${questionId}-false`} />
                      <Label htmlFor={`${questionId}-false`} className="flex-1 cursor-pointer">
                        False
                      </Label>
                      {showResults && q.answer === false && (
                        <span className="text-success text-sm font-medium">Correct</span>
                      )}
                    </div>
                  </RadioGroup>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {!showResults && (
        <Button
          onClick={onSubmit}
          size="lg"
          className="w-full bg-gradient-primary hover:opacity-90"
        >
          Submit Quiz
        </Button>
      )}

      {showResults && (
        <Card className="bg-success/10 border-success">
          <CardContent className="p-6 text-center">
            <p className="text-lg font-semibold text-success mb-2">
              Quiz Completed! ✓
            </p>
            <p className="text-muted-foreground">
              Check your answers above. Correct answers are highlighted in green.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};