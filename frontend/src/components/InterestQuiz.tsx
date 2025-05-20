import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from '@mui/material';

interface InterestQuizProps {
  onComplete: (interests: string[]) => void;
}

const questions = [
  {
    question: "What's your primary goal with Deepthink AI?",
    options: [
      "Content Creation",
      "SEO Optimization",
      "Digital Marketing",
      "Research & Analysis"
    ]
  },
  {
    question: "Which type of content do you create most often?",
    options: [
      "Blog Posts",
      "Social Media",
      "Video Content",
      "Technical Documentation"
    ]
  },
  {
    question: "What's your experience level with AI tools?",
    options: [
      "Beginner",
      "Intermediate",
      "Advanced",
      "Expert"
    ]
  }
];

const InterestQuiz: React.FC<InterestQuizProps> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      onComplete(newAnswers);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom align="center" sx={{ color: '#ff6600', fontWeight: 600 }}>
          Let's personalize your experience
        </Typography>
        <Typography variant="subtitle1" gutterBottom align="center" sx={{ mb: 4 }}>
          Answer a few quick questions to help us tailor Deepthink AI to your needs
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {questions[currentQuestion].question}
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup>
              {questions[currentQuestion].options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio />}
                  label={option}
                  onClick={() => handleAnswer(option)}
                  sx={{
                    mb: 1,
                    p: 1,
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'rgba(255, 102, 0, 0.08)',
                    },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Question {currentQuestion + 1} of {questions.length}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => onComplete(answers)}
            sx={{ color: '#ff6600', borderColor: '#ff6600' }}
          >
            Skip Quiz
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default InterestQuiz; 